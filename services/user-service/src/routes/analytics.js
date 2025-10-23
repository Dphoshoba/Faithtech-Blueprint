const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const analyticsService = require('../services/analyticsService');

// Get overview analytics
router.get('/overview', auth, async (req, res, next) => {
  try {
    const metrics = await analyticsService.getOverviewAnalytics(
      req.user._id,
      req.user.role
    );

    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    next(error);
  }
});

// Get assessment-specific analytics
router.get('/assessments/:assessmentId', auth, async (req, res, next) => {
  try {
    const analytics = await analyticsService.getAssessmentAnalytics(req.params.assessmentId);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

// Get trending assessments
router.get('/trending', auth, async (req, res, next) => {
  try {
    const { limit = 10, days = 30 } = req.query;
    
    const trending = await analyticsService.getTrendingAssessments(
      parseInt(limit),
      parseInt(days)
    );

    res.json({
      success: true,
      data: trending
    });
  } catch (error) {
    next(error);
  }
});

// Get engagement over time
router.get('/engagement', auth, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    
    const engagement = await analyticsService.getEngagementOverTime(parseInt(days));

    res.json({
      success: true,
      data: engagement
    });
  } catch (error) {
    next(error);
  }
});

// Get category performance
router.get('/categories', auth, async (req, res, next) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user._id;
    const categories = await analyticsService.getCategoryPerformance(userId);

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

// Get user performance comparison
router.get('/performance/me', auth, async (req, res, next) => {
  try {
    const comparison = await analyticsService.getUserPerformanceComparison(req.user._id);

    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    next(error);
  }
});

// Get completion trends
router.get('/trends/completions', auth, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    
    const trends = await analyticsService.getCompletionTrends(parseInt(days));

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    next(error);
  }
});

// Get popular categories
router.get('/popular/categories', auth, async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;
    
    const categories = await analyticsService.getPopularCategories(parseInt(limit));

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

// Get subscription analytics (admin only)
router.get('/subscriptions', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const analytics = await analyticsService.getSubscriptionAnalytics();

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

// Get user activity timeline
router.get('/activity/me', auth, async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    
    const activities = await analyticsService.getUserActivityTimeline(
      req.user._id,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    next(error);
  }
});

// Export analytics data (admin only)
router.post('/export', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    const { type, filters } = req.body;
    
    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Export type is required'
      });
    }

    const exportData = await analyticsService.exportAnalyticsData(type, filters || {});

    res.json({
      success: true,
      data: exportData
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

