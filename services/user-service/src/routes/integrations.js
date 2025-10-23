const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Integration = require('../models/Integration');
const integrationManager = require('../services/integrations/integrationManager');

// Get user's integrations
router.get('/', auth, async (req, res, next) => {
  try {
    const integrations = await Integration.find({ 
      user: req.user._id,
      active: true 
    }).select('-credentials.accessToken -credentials.refreshToken -apiSecret');

    res.json({
      success: true,
      data: integrations
    });
  } catch (error) {
    next(error);
  }
});

// Get single integration
router.get('/:id', auth, async (req, res, next) => {
  try {
    const integration = await Integration.findOne({
      _id: req.params.id,
      user: req.user._id
    }).select('-credentials.accessToken -credentials.refreshToken -apiSecret');

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found'
      });
    }

    res.json({
      success: true,
      data: integration
    });
  } catch (error) {
    next(error);
  }
});

// Create new integration
router.post('/', auth, async (req, res, next) => {
  try {
    const integrationData = {
      ...req.body,
      user: req.user._id
    };

    const integration = await Integration.create(integrationData);

    res.status(201).json({
      success: true,
      message: 'Integration created successfully',
      data: integration
    });
  } catch (error) {
    next(error);
  }
});

// Update integration
router.put('/:id', auth, async (req, res, next) => {
  try {
    const integration = await Integration.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found'
      });
    }

    Object.assign(integration, req.body);
    await integration.save();

    res.json({
      success: true,
      message: 'Integration updated successfully',
      data: integration
    });
  } catch (error) {
    next(error);
  }
});

// Test integration connection
router.post('/:id/test', auth, async (req, res, next) => {
  try {
    const integration = await Integration.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found'
      });
    }

    const result = await integrationManager.testIntegration(integration._id);

    res.json({
      success: result.success,
      message: result.success ? 'Connection successful' : 'Connection failed',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Trigger manual sync
router.post('/:id/sync', auth, async (req, res, next) => {
  try {
    const integration = await Integration.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found'
      });
    }

    const result = await integrationManager.syncIntegration(integration._id);

    res.json({
      success: result.success,
      message: result.success ? 'Sync completed successfully' : 'Sync completed with errors',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// Get integration statistics
router.get('/stats/overview', auth, async (req, res, next) => {
  try {
    const stats = await integrationManager.getIntegrationStats(req.user._id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// Delete integration
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const integration = await Integration.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Integration not found'
      });
    }

    integration.active = false;
    integration.status = 'inactive';
    await integration.save();

    res.json({
      success: true,
      message: 'Integration deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Get available providers
router.get('/providers/list', auth, (req, res) => {
  const providers = [
    {
      id: 'planning-center',
      name: 'Planning Center Online',
      description: 'Comprehensive church management with people, groups, check-ins, and giving',
      authType: 'oauth',
      features: ['people', 'groups', 'events', 'giving', 'check-ins'],
      tier: 'premium',
      logoUrl: '/images/integrations/planning-center.png'
    },
    {
      id: 'breeze',
      name: 'Breeze ChMS',
      description: 'Simple church management software for growing churches',
      authType: 'api-key',
      features: ['people', 'groups', 'events', 'giving'],
      tier: 'basic',
      logoUrl: '/images/integrations/breeze.png'
    },
    {
      id: 'ccb',
      name: 'Church Community Builder',
      description: 'All-in-one church management system',
      authType: 'basic',
      features: ['people', 'groups', 'events'],
      tier: 'premium',
      logoUrl: '/images/integrations/ccb.png'
    }
  ];

  res.json({
    success: true,
    data: providers
  });
});

module.exports = router;

