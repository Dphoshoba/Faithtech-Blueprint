const Template = require('../models/Template');
const { CACHE_KEYS, CACHE_DURATION, getCache, setCache } = require('./cache');
const logger = require('./logger');

// Track recommendation engagement
const trackRecommendationEngagement = async (templateId, userId, recommendationType) => {
  try {
    await Template.findByIdAndUpdate(templateId, {
      $push: {
        'metadata.analytics.recommendations': {
          user: userId,
          type: recommendationType,
          timestamp: new Date()
        }
      }
    });
  } catch (error) {
    logger.error('Error tracking recommendation engagement:', error);
  }
};

// Content-based filtering
const getContentBasedRecommendations = async (templateId, limit = 5) => {
  // Check cache first
  const cacheKey = CACHE_KEYS.SIMILAR(templateId);
  const cachedResults = await getCache(cacheKey);
  if (cachedResults) return cachedResults;

  const template = await Template.findById(templateId);
  if (!template) return [];

  // Get templates with similar tags, category, and type
  const similarTemplates = await Template.find({
    _id: { $ne: templateId },
    $or: [
      { tags: { $in: template.tags } },
      { category: template.category },
      { type: template.type }
    ],
    status: 'published'
  })
  .select('name description tags category type metadata')
  .limit(limit * 2);

  // Score each template based on similarity
  const scoredTemplates = similarTemplates.map(t => {
    let score = 0;
    
    // Tag similarity (3 points per matching tag)
    const matchingTags = t.tags.filter(tag => template.tags.includes(tag));
    score += matchingTags.length * 3;
    
    // Category match (5 points)
    if (t.category === template.category) score += 5;
    
    // Type match (4 points)
    if (t.type === template.type) score += 4;

    return { template: t, score };
  });

  // Sort by score and get top results
  const results = scoredTemplates
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(st => st.template);

  // Cache results
  await setCache(cacheKey, results, CACHE_DURATION.SIMILAR);

  return results;
};

// Collaborative filtering based on user behavior
const getCollaborativeRecommendations = async (userId, limit = 5) => {
  // Check cache first
  const cacheKey = CACHE_KEYS.PERSONALIZED(userId);
  const cachedResults = await getCache(cacheKey);
  if (cachedResults) return cachedResults;

  // Get templates the user has interacted with
  const userTemplates = await Template.find({
    $or: [
      { 'metadata.analytics.downloads.users': userId },
      { 'metadata.analytics.views.users': userId },
      { 'metadata.analytics.ratings.user': userId },
      { 'metadata.analytics.recommendations.user': userId }
    ]
  }).select('_id');

  // Find users with similar interactions
  const similarUsers = await Template.aggregate([
    {
      $match: {
        _id: { $in: userTemplates.map(t => t._id) }
      }
    },
    {
      $unwind: '$metadata.analytics.ratings'
    },
    {
      $group: {
        _id: '$metadata.analytics.ratings.user',
        commonTemplates: { $sum: 1 },
        averageRating: { $avg: '$metadata.analytics.ratings.rating' }
      }
    },
    {
      $match: {
        _id: { $ne: userId },
        commonTemplates: { $gte: 2 },
        averageRating: { $gte: 4 }
      }
    }
  ]);

  // Get recommended templates
  const recommendedTemplates = await Template.find({
    'metadata.analytics.ratings': {
      $elemMatch: {
        user: { $in: similarUsers.map(u => u._id) },
        rating: { $gte: 4 }
      }
    },
    _id: { $nin: userTemplates.map(t => t._id) },
    status: 'published'
  })
  .sort('-metadata.analytics.rating.average')
  .limit(limit);

  // Cache results
  await setCache(cacheKey, recommendedTemplates, CACHE_DURATION.PERSONALIZED);

  return recommendedTemplates;
};

// Get trending templates
const getTrendingTemplates = async (days = 30, limit = 5) => {
  // Check cache first
  const cachedResults = await getCache(CACHE_KEYS.TRENDING);
  if (cachedResults) return cachedResults;

  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);

  const results = await Template.aggregate([
    {
      $match: {
        status: 'published',
        createdAt: { $gte: dateThreshold }
      }
    },
    {
      $addFields: {
        score: {
          $add: [
            { $multiply: ['$metadata.analytics.views', 1] },
            { $multiply: ['$metadata.analytics.downloads', 3] },
            { $multiply: ['$metadata.analytics.rating.average', 5] },
            { $multiply: [{ $size: '$metadata.analytics.recommendations' }, 2] }
          ]
        }
      }
    },
    {
      $sort: { score: -1 }
    },
    {
      $limit: limit
    }
  ]);

  // Cache results
  await setCache(CACHE_KEYS.TRENDING, results, CACHE_DURATION.TRENDING);

  return results;
};

// Get personalized recommendations
const getPersonalizedRecommendations = async (userId, limit = 10) => {
  // Get recommendations using different methods
  const [collaborative, trending] = await Promise.all([
    getCollaborativeRecommendations(userId, Math.floor(limit * 0.6)),
    getTrendingTemplates(30, Math.floor(limit * 0.4))
  ]);

  // Combine and deduplicate recommendations
  const recommendedIds = new Set();
  const recommendations = [];

  // Add collaborative recommendations first
  for (const template of collaborative) {
    if (!recommendedIds.has(template._id.toString())) {
      recommendedIds.add(template._id.toString());
      recommendations.push({
        ...template.toObject(),
        recommendationType: 'collaborative'
      });
    }
  }

  // Add trending recommendations
  for (const template of trending) {
    if (!recommendedIds.has(template._id.toString()) && recommendations.length < limit) {
      recommendedIds.add(template._id.toString());
      recommendations.push({
        ...template,
        recommendationType: 'trending'
      });
    }
  }

  return recommendations;
};

module.exports = {
  getContentBasedRecommendations,
  getCollaborativeRecommendations,
  getTrendingTemplates,
  getPersonalizedRecommendations,
  trackRecommendationEngagement
}; 