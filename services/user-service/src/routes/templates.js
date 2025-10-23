const express = require('express');
const router = express.Router();
const Template = require('../models/Template');
const TemplateInstance = require('../models/TemplateInstance');
const auth = require('../middleware/auth');
const templateService = require('../services/templateService');

// Get all published templates (paginated)
router.get('/', async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      difficulty,
      tier,
      status = 'published',
      search,
      featured
    } = req.query;

    const query = { status };

    // Apply filters
    if (category) query.category = category;
    if (difficulty) query.difficulty = difficulty;
    if (tier) query.tier = tier;
    if (featured === 'true') query.featured = true;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [templates, total] = await Promise.all([
      Template.find(query)
        .select('-content -variables') // Don't return full content in list
        .sort({ featured: -1, usageCount: -1, createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      Template.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: templates,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
});

// Get single template by ID
router.get('/:id', async (req, res, next) => {
  try {
    const template = await Template.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .lean();

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
});

// Create new template (admin only)
router.post('/', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const templateData = {
      ...req.body,
      createdBy: req.user._id,
      status: 'draft'
    };

    const template = await Template.create(templateData);

    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (error) {
    next(error);
  }
});

// Create template instance (use template)
router.post('/:id/use', auth, async (req, res, next) => {
  try {
    const template = await Template.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    if (template.status !== 'published') {
      return res.status(400).json({
        success: false,
        message: 'Template is not published'
      });
    }

    // Create a new instance
    const instance = await TemplateInstance.create({
      template: template._id,
      user: req.user._id,
      title: `${template.title} - ${new Date().toLocaleDateString()}`,
      templateVersion: template.version,
      variables: new Map() // Start with empty variables
    });

    // Increment template usage
    await template.incrementUsage();

    res.status(201).json({
      success: true,
      message: 'Template instance created',
      data: {
        instanceId: instance._id,
        template: {
          id: template._id,
          title: template.title,
          variables: template.variables,
          sections: template.sections
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user's template instances
router.get('/instances/my', auth, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const instances = await TemplateInstance.getUserInstances(req.user._id, {
      status,
      skip: (parseInt(page) - 1) * parseInt(limit),
      limit: parseInt(limit)
    });

    const total = await TemplateInstance.countDocuments({
      $or: [
        { user: req.user._id },
        { 'sharedWith.user': req.user._id }
      ],
      ...(status && { status })
    });

    res.json({
      success: true,
      data: instances,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    next(error);
  }
});

// Update template instance variables
router.put('/instances/:instanceId/variables', auth, async (req, res, next) => {
  try {
    const instance = await TemplateInstance.findOne({
      _id: req.params.instanceId,
      user: req.user._id
    });

    if (!instance) {
      return res.status(404).json({
        success: false,
        message: 'Template instance not found'
      });
    }

    const { variables } = req.body;

    // Get template for validation
    const template = await Template.findById(instance.template);
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Associated template not found'
      });
    }

    // Validate variables
    const validation = templateService.validateVariables(template, variables);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Variable validation failed',
        errors: validation.errors
      });
    }

    // Update variables
    instance.variables = new Map(Object.entries(variables));
    await instance.save();

    res.json({
      success: true,
      message: 'Variables updated successfully',
      data: {
        instanceId: instance._id,
        variables: Object.fromEntries(instance.variables)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Generate preview
router.post('/instances/:instanceId/preview', auth, async (req, res, next) => {
  try {
    const instance = await TemplateInstance.findOne({
      _id: req.params.instanceId,
      $or: [
        { user: req.user._id },
        { 'sharedWith.user': req.user._id }
      ]
    }).populate('template');

    if (!instance) {
      return res.status(404).json({
        success: false,
        message: 'Template instance not found'
      });
    }

    const html = templateService.generateHTML(instance.template, instance);

    res.json({
      success: true,
      data: {
        html,
        variables: Object.fromEntries(instance.variables)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Generate and download PDF
router.get('/instances/:instanceId/download', auth, async (req, res, next) => {
  try {
    const instance = await TemplateInstance.findOne({
      _id: req.params.instanceId,
      $or: [
        { user: req.user._id },
        { 'sharedWith.user': req.user._id }
      ]
    }).populate('template');

    if (!instance) {
      return res.status(404).json({
        success: false,
        message: 'Template instance not found'
      });
    }

    const html = templateService.generateHTML(instance.template, instance);
    const pdf = await templateService.generatePDF(html);

    // Update download count
    instance.downloadedAt = new Date();
    await instance.save();

    // Update template download count
    await Template.findByIdAndUpdate(instance.template._id, {
      $inc: { downloadCount: 1 }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${instance.title}.pdf"`);
    res.send(pdf);
  } catch (error) {
    next(error);
  }
});

// Complete template instance
router.post('/instances/:instanceId/complete', auth, async (req, res, next) => {
  try {
    const instance = await TemplateInstance.findOne({
      _id: req.params.instanceId,
      user: req.user._id
    });

    if (!instance) {
      return res.status(404).json({
        success: false,
        message: 'Template instance not found'
      });
    }

    await instance.complete();

    res.json({
      success: true,
      message: 'Template instance completed',
      data: instance
    });
  } catch (error) {
    next(error);
  }
});

// Delete template instance
router.delete('/instances/:instanceId', auth, async (req, res, next) => {
  try {
    const instance = await TemplateInstance.findOne({
      _id: req.params.instanceId,
      user: req.user._id
    });

    if (!instance) {
      return res.status(404).json({
        success: false,
        message: 'Template instance not found'
      });
    }

    instance.status = 'archived';
    await instance.save();

    res.json({
      success: true,
      message: 'Template instance archived'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

