const TemplateInstance = require('../models/TemplateInstance');
const Template = require('../models/Template');
const { AppError } = require('../utils/errors');
const { deployInstance, updateDeployment } = require('../utils/deployment');

// Get all instances for organization
exports.getInstances = async (req, res) => {
  try {
    const filters = {
      organization: req.user.organization
    };

    if (req.query.status) {
      filters.status = req.query.status;
    }

    if (req.query.template) {
      filters.template = req.query.template;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const instances = await TemplateInstance.find(filters)
      .sort('-createdAt')
      .skip(skip)
      .limit(limit)
      .populate('template', 'name type category')
      .populate('createdBy', 'firstName lastName email');

    const total = await TemplateInstance.countDocuments(filters);

    res.json({
      status: 'success',
      results: instances.length,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit
      },
      data: instances
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Get single instance
exports.getInstance = async (req, res) => {
  try {
    const instance = await TemplateInstance.findOne({
      _id: req.params.id,
      organization: req.user.organization
    })
    .populate('template')
    .populate('createdBy', 'firstName lastName email');

    if (!instance) {
      return res.status(404).json({
        status: 'error',
        message: 'Template instance not found'
      });
    }

    res.json({
      status: 'success',
      data: instance
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Update instance
exports.updateInstance = async (req, res) => {
  try {
    const instance = await TemplateInstance.findOne({
      _id: req.params.id,
      organization: req.user.organization
    });

    if (!instance) {
      return res.status(404).json({
        status: 'error',
        message: 'Template instance not found'
      });
    }

    // Check if template version has changed
    const template = await Template.findById(instance.template);
    if (template.versionString !== instance.version.templateVersion) {
      // Add warning about template version mismatch
      instance.deploymentDetails.buildLogs.push({
        timestamp: new Date(),
        message: 'Warning: Template version has changed since instance creation',
        level: 'warning'
      });
    }

    // Handle customizations update
    if (req.body.customizations) {
      instance.customizations = req.body.customizations;
      instance.incrementVersion();
    }

    // Update other fields
    if (req.body.name) instance.name = req.body.name;
    if (req.body.settings) instance.settings = req.body.settings;

    await instance.save();

    // Trigger deployment if instance is published
    if (instance.status === 'published') {
      await updateDeployment(instance);
    }

    res.json({
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

// Deploy instance
exports.deployInstance = async (req, res) => {
  try {
    const instance = await TemplateInstance.findOne({
      _id: req.params.id,
      organization: req.user.organization
    }).populate('template');

    if (!instance) {
      return res.status(404).json({
        status: 'error',
        message: 'Template instance not found'
      });
    }

    // Update build status
    instance.deploymentDetails.buildStatus = 'building';
    await instance.save();

    // Start deployment process
    const deploymentResult = await deployInstance(instance);

    // Update instance with deployment results
    instance.deploymentDetails.url = deploymentResult.url;
    instance.deploymentDetails.buildStatus = deploymentResult.success ? 'success' : 'failed';
    instance.deploymentDetails.lastDeployed = new Date();
    instance.deploymentDetails.buildLogs.push({
      timestamp: new Date(),
      message: deploymentResult.message,
      level: deploymentResult.success ? 'info' : 'error'
    });

    await instance.save();

    res.json({
      status: 'success',
      data: instance
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Delete instance
exports.deleteInstance = async (req, res) => {
  try {
    const instance = await TemplateInstance.findOne({
      _id: req.params.id,
      organization: req.user.organization
    });

    if (!instance) {
      return res.status(404).json({
        status: 'error',
        message: 'Template instance not found'
      });
    }

    // If instance is published, archive instead of delete
    if (instance.status === 'published') {
      instance.status = 'archived';
      await instance.save();

      return res.json({
        status: 'success',
        message: 'Template instance archived'
      });
    }

    await instance.deleteOne();
    res.json({
      status: 'success',
      message: 'Template instance deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
}; 