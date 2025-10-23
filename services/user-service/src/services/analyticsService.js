/**
 * Analytics Service
 * Provides comprehensive analytics and insights for assessments and user engagement
 */

const Assessment = require('../models/Assessment');
const AssessmentResponse = require('../models/AssessmentResponse');
const User = require('../models/User');
const UserSubscription = require('../models/UserSubscription');

/**
 * Get overview analytics
 * @param {String} userId - User ID (optional, for user-specific analytics)
 * @param {String} role - User role
 * @returns {Object} - Overview metrics
 */
const getOverviewAnalytics = async (userId = null, role = 'user') => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let metrics = {};

    if (role === 'admin') {
      // Admin sees platform-wide metrics
      const [
        totalUsers,
        totalAssessments,
        totalResponses,
        completedResponses,
        recentUsers,
        recentCompletions
      ] = await Promise.all([
        User.countDocuments({ active: { $ne: false } }),
        Assessment.countDocuments({ status: 'published' }),
        AssessmentResponse.countDocuments(),
        AssessmentResponse.countDocuments({ status: 'completed' }),
        User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
        AssessmentResponse.countDocuments({ 
          status: 'completed', 
          completedAt: { $gte: sevenDaysAgo } 
        })
      ]);

      const completionRate = totalResponses > 0 
        ? Math.round((completedResponses / totalResponses) * 100) 
        : 0;

      metrics = {
        totalUsers,
        totalAssessments,
        totalResponses,
        completedResponses,
        completionRate,
        recentUsers,
        recentCompletions,
        period: {
          last7Days: {
            newUsers: recentUsers,
            completions: recentCompletions
          }
        }
      };
    } else {
      // Regular users see their own metrics
      const [
        myResponses,
        myCompletedResponses,
        myAverageScore,
        recentCompletions
      ] = await Promise.all([
        AssessmentResponse.countDocuments({ user: userId }),
        AssessmentResponse.countDocuments({ user: userId, status: 'completed' }),
        AssessmentResponse.aggregate([
          { $match: { user: userId, status: 'completed' } },
          { $group: { _id: null, avgScore: { $avg: '$percentage' } } }
        ]),
        AssessmentResponse.countDocuments({ 
          user: userId,
          status: 'completed',
          completedAt: { $gte: sevenDaysAgo }
        })
      ]);

      const averageScore = myAverageScore.length > 0 ? Math.round(myAverageScore[0].avgScore) : 0;
      const completionRate = myResponses > 0 
        ? Math.round((myCompletedResponses / myResponses) * 100) 
        : 0;

      metrics = {
        myResponses,
        myCompletedResponses,
        averageScore,
        completionRate,
        recentCompletions,
        period: {
          last7Days: {
            completions: recentCompletions
          }
        }
      };
    }

    return metrics;
  } catch (error) {
    console.error('Error getting overview analytics:', error);
    throw error;
  }
};

/**
 * Get assessment-specific analytics
 * @param {String} assessmentId - Assessment ID
 * @returns {Object} - Assessment analytics
 */
const getAssessmentAnalytics = async (assessmentId) => {
  try {
    const assessment = await Assessment.findById(assessmentId);
    
    if (!assessment) {
      throw new Error('Assessment not found');
    }

    const [
      totalAttempts,
      completedAttempts,
      averageScoreData,
      averageTimeData,
      passRateData,
      recentCompletions
    ] = await Promise.all([
      AssessmentResponse.countDocuments({ assessment: assessmentId }),
      AssessmentResponse.countDocuments({ assessment: assessmentId, status: 'completed' }),
      AssessmentResponse.aggregate([
        { $match: { assessment: assessmentId, status: 'completed' } },
        { $group: { _id: null, avgScore: { $avg: '$percentage' } } }
      ]),
      AssessmentResponse.aggregate([
        { $match: { assessment: assessmentId, status: 'completed' } },
        { $group: { _id: null, avgTime: { $avg: '$totalTimeSpent' } } }
      ]),
      AssessmentResponse.aggregate([
        { $match: { assessment: assessmentId, status: 'completed' } },
        { $group: { 
          _id: null, 
          passRate: { 
            $avg: { $cond: [{ $eq: ['$passed', true] }, 1, 0] } 
          } 
        } }
      ]),
      AssessmentResponse.countDocuments({ 
        assessment: assessmentId,
        status: 'completed',
        completedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
    ]);

    const averageScore = averageScoreData.length > 0 ? Math.round(averageScoreData[0].avgScore) : 0;
    const averageTime = averageTimeData.length > 0 ? Math.round(averageTimeData[0].avgTime / 60) : 0;
    const passRate = passRateData.length > 0 ? Math.round(passRateData[0].passRate * 100) : 0;
    const completionRate = totalAttempts > 0 ? Math.round((completedAttempts / totalAttempts) * 100) : 0;

    return {
      assessmentId,
      title: assessment.title,
      category: assessment.category,
      difficulty: assessment.difficulty,
      totalAttempts,
      completedAttempts,
      completionRate,
      averageScore,
      averageTime, // in minutes
      passRate,
      recentCompletions,
      metadata: {
        published: assessment.status === 'published',
        totalQuestions: assessment.totalQuestions,
        timeLimit: assessment.timeLimit
      }
    };
  } catch (error) {
    console.error('Error getting assessment analytics:', error);
    throw error;
  }
};

/**
 * Get trending assessments
 * @param {Number} limit - Number of assessments to return
 * @param {Number} days - Days to look back
 * @returns {Array} - Array of trending assessments
 */
const getTrendingAssessments = async (limit = 10, days = 30) => {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const trending = await AssessmentResponse.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: since }
        }
      },
      {
        $group: {
          _id: '$assessment',
          completions: { $sum: 1 },
          averageScore: { $avg: '$percentage' }
        }
      },
      {
        $sort: { completions: -1 }
      },
      {
        $limit: limit
      }
    ]);

    // Populate assessment details
    const assessmentIds = trending.map(t => t._id);
    const assessments = await Assessment.find({ _id: { $in: assessmentIds } })
      .select('title category difficulty tier');

    const trendingWithDetails = trending.map(t => {
      const assessment = assessments.find(a => a._id.toString() === t._id.toString());
      return {
        assessmentId: t._id,
        title: assessment?.title || 'Unknown',
        category: assessment?.category || 'Unknown',
        difficulty: assessment?.difficulty || 'Unknown',
        tier: assessment?.tier || 'free',
        completions: t.completions,
        averageScore: Math.round(t.averageScore)
      };
    });

    return trendingWithDetails;
  } catch (error) {
    console.error('Error getting trending assessments:', error);
    throw error;
  }
};

/**
 * Get user engagement metrics over time
 * @param {Number} days - Number of days to analyze
 * @returns {Array} - Daily engagement data
 */
const getEngagementOverTime = async (days = 30) => {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const engagement = await AssessmentResponse.aggregate([
      {
        $match: {
          completedAt: { $gte: since },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
          },
          completions: { $sum: 1 },
          averageScore: { $avg: '$percentage' },
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return engagement.map(e => ({
      date: e._id,
      completions: e.completions,
      averageScore: Math.round(e.averageScore),
      uniqueUsers: e.uniqueUsers.length
    }));
  } catch (error) {
    console.error('Error getting engagement over time:', error);
    throw error;
  }
};

/**
 * Get category performance analytics
 * @param {String} userId - User ID (optional)
 * @returns {Array} - Category performance data
 */
const getCategoryPerformance = async (userId = null) => {
  try {
    const matchQuery = userId 
      ? { user: userId, status: 'completed' }
      : { status: 'completed' };

    const categoryData = await AssessmentResponse.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'assessments',
          localField: 'assessment',
          foreignField: '_id',
          as: 'assessmentData'
        }
      },
      { $unwind: '$assessmentData' },
      {
        $group: {
          _id: '$assessmentData.category',
          completions: { $sum: 1 },
          averageScore: { $avg: '$percentage' },
          totalScore: { $sum: '$totalScore' }
        }
      },
      {
        $sort: { completions: -1 }
      }
    ]);

    return categoryData.map(cat => ({
      category: cat._id,
      completions: cat.completions,
      averageScore: Math.round(cat.averageScore),
      totalScore: cat.totalScore
    }));
  } catch (error) {
    console.error('Error getting category performance:', error);
    throw error;
  }
};

/**
 * Get user performance comparison
 * @param {String} userId - User ID
 * @returns {Object} - Comparison data
 */
const getUserPerformanceComparison = async (userId) => {
  try {
    // Get user's average score
    const userScoreData = await AssessmentResponse.aggregate([
      { $match: { user: userId, status: 'completed' } },
      { $group: { _id: null, avgScore: { $avg: '$percentage' } } }
    ]);

    const userAverage = userScoreData.length > 0 ? userScoreData[0].avgScore : 0;

    // Get platform average
    const platformScoreData = await AssessmentResponse.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, avgScore: { $avg: '$percentage' } } }
    ]);

    const platformAverage = platformScoreData.length > 0 ? platformScoreData[0].avgScore : 0;

    // Calculate percentile
    const totalUsers = await AssessmentResponse.distinct('user', { status: 'completed' });
    const usersWithLowerScore = await AssessmentResponse.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$user',
          avgScore: { $avg: '$percentage' }
        }
      },
      {
        $match: { avgScore: { $lt: userAverage } }
      }
    ]);

    const percentile = totalUsers.length > 0 
      ? Math.round((usersWithLowerScore.length / totalUsers.length) * 100)
      : 50;

    return {
      userAverage: Math.round(userAverage),
      platformAverage: Math.round(platformAverage),
      percentile,
      performanceDiff: Math.round(userAverage - platformAverage),
      rank: usersWithLowerScore.length + 1,
      totalUsers: totalUsers.length
    };
  } catch (error) {
    console.error('Error getting user performance comparison:', error);
    throw error;
  }
};

/**
 * Get completion trends
 * @param {Number} days - Number of days to analyze
 * @returns {Object} - Trend data with growth rate
 */
const getCompletionTrends = async (days = 30) => {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const halfwayPoint = new Date(Date.now() - (days / 2) * 24 * 60 * 60 * 1000);

    const [firstHalf, secondHalf] = await Promise.all([
      AssessmentResponse.countDocuments({
        status: 'completed',
        completedAt: { $gte: since, $lt: halfwayPoint }
      }),
      AssessmentResponse.countDocuments({
        status: 'completed',
        completedAt: { $gte: halfwayPoint }
      })
    ]);

    const growthRate = firstHalf > 0 
      ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100)
      : 100;

    return {
      firstHalf,
      secondHalf,
      growthRate,
      trend: growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'stable'
    };
  } catch (error) {
    console.error('Error getting completion trends:', error);
    throw error;
  }
};

/**
 * Get popular assessment categories
 * @param {Number} limit - Number of categories to return
 * @returns {Array} - Popular categories
 */
const getPopularCategories = async (limit = 5) => {
  try {
    const categories = await AssessmentResponse.aggregate([
      { $match: { status: 'completed' } },
      {
        $lookup: {
          from: 'assessments',
          localField: 'assessment',
          foreignField: '_id',
          as: 'assessmentData'
        }
      },
      { $unwind: '$assessmentData' },
      {
        $group: {
          _id: '$assessmentData.category',
          count: { $sum: 1 },
          averageScore: { $avg: '$percentage' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: limit }
    ]);

    return categories.map(cat => ({
      category: cat._id,
      completions: cat.count,
      averageScore: Math.round(cat.averageScore)
    }));
  } catch (error) {
    console.error('Error getting popular categories:', error);
    throw error;
  }
};

/**
 * Get subscription analytics (admin only)
 * @returns {Object} - Subscription metrics
 */
const getSubscriptionAnalytics = async () => {
  try {
    const [
      totalSubscriptions,
      activeSubscriptions,
      subscriptionsByTier,
      recentSubscriptions,
      revenue
    ] = await Promise.all([
      UserSubscription.countDocuments(),
      UserSubscription.countDocuments({ status: 'active' }),
      UserSubscription.aggregate([
        {
          $group: {
            _id: '$planId',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$amount' }
          }
        }
      ]),
      UserSubscription.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }),
      UserSubscription.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const monthlyRevenue = revenue.length > 0 ? revenue[0].total : 0;
    const tierBreakdown = subscriptionsByTier.reduce((acc, tier) => {
      acc[tier._id] = {
        count: tier.count,
        revenue: tier.totalRevenue
      };
      return acc;
    }, {});

    return {
      totalSubscriptions,
      activeSubscriptions,
      tierBreakdown,
      recentSubscriptions,
      monthlyRevenue,
      churnRate: totalSubscriptions > 0 
        ? Math.round(((totalSubscriptions - activeSubscriptions) / totalSubscriptions) * 100)
        : 0
    };
  } catch (error) {
    console.error('Error getting subscription analytics:', error);
    throw error;
  }
};

/**
 * Get user activity timeline
 * @param {String} userId - User ID
 * @param {Number} limit - Number of activities to return
 * @returns {Array} - Recent user activities
 */
const getUserActivityTimeline = async (userId, limit = 20) => {
  try {
    const activities = await AssessmentResponse.find({ user: userId })
      .populate('assessment', 'title category')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return activities.map(activity => ({
      id: activity._id,
      type: activity.status,
      assessmentTitle: activity.assessment?.title || 'Unknown',
      category: activity.assessment?.category || 'Unknown',
      status: activity.status,
      score: activity.percentage,
      passed: activity.passed,
      date: activity.completedAt || activity.startedAt,
      timeSpent: Math.round(activity.totalTimeSpent / 60) // Convert to minutes
    }));
  } catch (error) {
    console.error('Error getting user activity timeline:', error);
    throw error;
  }
};

/**
 * Export analytics data
 * @param {String} type - Type of export (overview, assessments, users)
 * @param {Object} filters - Filter criteria
 * @returns {Object} - Exportable data
 */
const exportAnalyticsData = async (type, filters = {}) => {
  try {
    let data = [];

    switch (type) {
      case 'assessment-responses':
        data = await AssessmentResponse.find(filters)
          .populate('assessment', 'title category')
          .populate('user', 'email firstName lastName')
          .lean();
        break;

      case 'user-performance':
        data = await AssessmentResponse.aggregate([
          { $match: { status: 'completed', ...filters } },
          {
            $group: {
              _id: '$user',
              totalAssessments: { $sum: 1 },
              averageScore: { $avg: '$percentage' },
              totalTimeSpent: { $sum: '$totalTimeSpent' }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'userData'
            }
          },
          { $unwind: '$userData' },
          {
            $project: {
              email: '$userData.email',
              name: { $concat: ['$userData.firstName', ' ', '$userData.lastName'] },
              totalAssessments: 1,
              averageScore: { $round: ['$averageScore', 2] },
              totalTimeSpent: { $round: [{ $divide: ['$totalTimeSpent', 60] }, 2] }
            }
          }
        ]);
        break;

      case 'assessment-stats':
        data = await Assessment.find({ status: 'published' })
          .select('title category difficulty completions averageScore')
          .lean();
        break;

      default:
        throw new Error('Invalid export type');
    }

    return {
      type,
      generatedAt: new Date().toISOString(),
      recordCount: data.length,
      data
    };
  } catch (error) {
    console.error('Error exporting analytics data:', error);
    throw error;
  }
};

module.exports = {
  getOverviewAnalytics,
  getAssessmentAnalytics,
  getTrendingAssessments,
  getEngagementOverTime,
  getCategoryPerformance,
  getUserPerformanceComparison,
  getCompletionTrends,
  getPopularCategories,
  getSubscriptionAnalytics,
  getUserActivityTimeline,
  exportAnalyticsData
};

