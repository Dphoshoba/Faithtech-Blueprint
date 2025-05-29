const Template = require('../models/Template');
const TemplateInstance = require('../models/TemplateInstance');
const { AppError } = require('../utils/errors');
const { uploadToS3, deleteFromS3 } = require('../utils/storage');
const logger = require('../utils/logger');
const {
  getContentBasedRecommendations,
  getCollaborativeRecommendations,
  getTrendingTemplates,
  getPersonalizedRecommendations
} = require('../utils/recommendations');

// Create new template
exports.createTemplate = async (req, res) => {
  try {
    const template = new Template({
      ...req.body,
      createdBy: req.user._id,
      organization: req.user.organization
    });

    if (req.files?.thumbnail) {
      const thumbnailUrl = await uploadToS3(req.files.thumbnail[0], 'thumbnails');
      template.thumbnail = {
        url: thumbnailUrl,
        alt: req.body.name
      };
    }

    await template.save();
    res.status(201).json({
      status: 'success',
      data: template
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get all templates
exports.getTemplates = async (req, res) => {
  try {
    const filters = {};

    // Handle public templates and organization-specific templates
    if (req.query.access === 'public') {
      filters.isPublic = true;
    } else {
      filters.organization = req.user.organization;
    }

    // Apply category filter
    if (req.query.category) {
      filters.category = req.query.category;
    }

    // Apply type filter
    if (req.query.type) {
      filters.type = req.query.type;
    }

    // Apply status filter
    if (req.query.status) {
      filters.status = req.query.status;
    }

    // Apply tag filter
    if (req.query.tags) {
      filters.tags = { $all: req.query.tags.split(',') };
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const templates = await Template.find(filters)
      .sort(req.query.sort || '-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('createdBy', 'firstName lastName email');

    const total = await Template.countDocuments(filters);

    res.json({
      status: 'success',
      results: templates.length,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      },
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get single template
exports.getTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      $or: [
        { organization: req.user.organization },
        { isPublic: true }
      ]
    }).populate('createdBy', 'firstName lastName email');

    if (!template) {
      return res.status(404).json({
        status: 'error',
        message: 'Template not found'
      });
    }

    // Update view count
    await template.updateAnalytics('view');

    res.json({
      status: 'success',
      data: template
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update template
exports.updateTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      organization: req.user.organization
    });

    if (!template) {
      return res.status(404).json({
        status: 'error',
        message: 'Template not found'
      });
    }

    // Handle version increment
    if (req.body.components) {
      template.incrementVersion(req.body.versionType || 'patch');
    }

    // Handle thumbnail update
    if (req.files?.thumbnail) {
      if (template.thumbnail?.url) {
        await deleteFromS3(template.thumbnail.url);
      }
      const thumbnailUrl = await uploadToS3(req.files.thumbnail[0], 'thumbnails');
      template.thumbnail = {
        url: thumbnailUrl,
        alt: req.body.name || template.name
      };
    }

    Object.assign(template, req.body);
    await template.save();

    res.json({
      status: 'success',
      data: template
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete template
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({
      _id: req.params.id,
      organization: req.user.organization
    });

    if (!template) {
      return res.status(404).json({
        status: 'error',
        message: 'Template not found'
      });
    }

    // Check for instances
    const instanceCount = await TemplateInstance.countDocuments({
      template: template._id
    });

    if (instanceCount > 0) {
      // Archive instead of delete if instances exist
      template.status = 'archived';
      await template.save();

      return res.json({
        status: 'success',
        message: 'Template archived due to existing instances'
      });
    }

    // Delete thumbnail if exists
    if (template.thumbnail?.url) {
      await deleteFromS3(template.thumbnail.url);
    }

    await template.deleteOne();
    res.json({
      status: 'success',
      message: 'Template deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Create template instance
exports.createInstance = async (req, res) => {
  try {
    const template = await Template.findById(req.params.id);
    if (!template) {
      return res.status(404).json({
        status: 'error',
        message: 'Template not found'
      });
    }

    const instance = new TemplateInstance({
      template: template._id,
      name: req.body.name,
      organization: req.user.organization,
      createdBy: req.user._id,
      customizations: req.body.customizations || [],
      settings: req.body.settings || {},
      version: {
        templateVersion: template.versionString,
        instanceVersion: 1
      }
    });

    await instance.save();

    res.status(201).json({
      status: 'success',
      data: instance
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

// Search templates
exports.searchTemplates = async (req, res) => {
  try {
    const searchQuery = req.query.q;
    const filters = {
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { tags: { $regex: searchQuery, $options: 'i' } }
      ],
      $and: [
        {
          $or: [
            { organization: req.user.organization },
            { isPublic: true }
          ]
        }
      ]
    };

    const templates = await Template.find(filters)
      .sort('-metadata.analytics.rating.average')
      .limit(10)
      .populate('createdBy', 'firstName lastName email');

    res.json({
      status: 'success',
      results: templates.length,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Add a review to a template
exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const template = await Template.findById(req.params.id);

    if (!template) {
      return next(new AppError('No template found with that ID', 404));
    }

    await template.addReview(req.user.id, rating, comment);

    logger.info(`Review added to template: ${template._id}`);
    res.status(200).json({
      status: 'success',
      data: { template }
    });
  } catch (error) {
    next(error);
  }
};

// Increment download count
exports.incrementDownloads = async (req, res, next) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return next(new AppError('No template found with that ID', 404));
    }

    await template.incrementDownloads();

    logger.info(`Download count incremented for template: ${template._id}`);
    res.status(200).json({
      status: 'success',
      data: { downloads: template.downloads }
    });
  } catch (error) {
    next(error);
  }
};

// Add a new version
exports.addVersion = async (req, res, next) => {
  try {
    const { changes } = req.body;
    const template = await Template.findById(req.params.id);

    if (!template) {
      return next(new AppError('No template found with that ID', 404));
    }

    // Check if user is the creator or an admin
    if (template.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to update this template', 403));
    }

    await template.addVersion(req.file, changes, req.user.id);

    logger.info(`New version added to template: ${template._id}`);
    res.status(200).json({
      status: 'success',
      data: { template }
    });
  } catch (error) {
    next(error);
  }
};

// Get template versions
exports.getVersions = async (req, res, next) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return next(new AppError('No template found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { versions: template.versions }
    });
  } catch (error) {
    next(error);
  }
};

// Update template status
exports.updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const template = await Template.findById(req.params.id);

    if (!template) {
      return next(new AppError('No template found with that ID', 404));
    }

    // Check if user is the creator or an admin
    if (template.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new AppError('You do not have permission to update this template', 403));
    }

    if (status === 'archived') {
      await template.archive(req.user.id);
    } else if (status === 'published') {
      await template.publish(req.user.id);
    } else {
      return next(new AppError('Invalid status', 400));
    }

    logger.info(`Template status updated: ${template._id} to ${status}`);
    res.status(200).json({
      status: 'success',
      data: { template }
    });
  } catch (error) {
    next(error);
  }
};

// Get similar templates
exports.getSimilarTemplates = async (req, res) => {
  try {
    const templates = await getContentBasedRecommendations(req.params.id, 6);
    
    res.json({
      status: 'success',
      results: templates.length,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get personalized recommendations
exports.getRecommendedTemplates = async (req, res) => {
  try {
    const templates = await getPersonalizedRecommendations(req.user._id, 10);
    
    res.json({
      status: 'success',
      results: templates.length,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get trending templates
exports.getTrendingTemplates = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const limit = parseInt(req.query.limit) || 5;
    
    const templates = await getTrendingTemplates(days, limit);
    
    res.json({
      status: 'success',
      results: templates.length,
      data: templates
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}; 