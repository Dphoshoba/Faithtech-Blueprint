const Assessment = require('../models/Assessment');

// Recommendation rules based on score percentages
const RECOMMENDATION_RULES = {
  'ministry-tech': {
    'Digital Presence': {
      low: {
        threshold: 40,
        recommendations: [
          {
            text: 'Establish basic online presence',
            priority: 'high',
            actionItems: [
              'Create a mobile-responsive website',
              'Set up social media accounts',
              'Implement basic SEO practices'
            ],
            resources: [
              {
                title: 'Website Building Guide',
                url: 'https://faithtech.com/resources/website-guide',
                type: 'guide'
              }
            ]
          }
        ]
      },
      medium: {
        threshold: 70,
        recommendations: [
          {
            text: 'Enhance digital engagement',
            priority: 'medium',
            actionItems: [
              'Develop content strategy',
              'Implement analytics tracking',
              'Optimize user experience'
            ]
          }
        ]
      },
      high: {
        threshold: 90,
        recommendations: [
          {
            text: 'Advanced digital optimization',
            priority: 'low',
            actionItems: [
              'Implement A/B testing',
              'Develop personalization',
              'Integrate advanced analytics'
            ]
          }
        ]
      }
    },
    'Communication': {
      low: {
        threshold: 40,
        recommendations: [
          {
            text: 'Establish basic communication channels',
            priority: 'high',
            actionItems: [
              'Set up email newsletter',
              'Implement church management system',
              'Create communication guidelines'
            ]
          }
        ]
      }
    }
  },
  'digital-maturity': {
    'Technology Infrastructure': {
      low: {
        threshold: 40,
        recommendations: [
          {
            text: 'Strengthen core infrastructure',
            priority: 'high',
            actionItems: [
              'Assess current hardware needs',
              'Implement basic security measures',
              'Set up cloud backup system'
            ]
          }
        ]
      }
    }
  }
};

// Helper function to get recommendations based on score
const getRecommendationsForCategory = (assessmentType, category, score) => {
  const categoryRules = RECOMMENDATION_RULES[assessmentType]?.[category];
  if (!categoryRules) return [];

  let recommendations = [];

  // Check each threshold level
  if (score <= categoryRules.low?.threshold) {
    recommendations = recommendations.concat(categoryRules.low.recommendations);
  } else if (score <= categoryRules.medium?.threshold) {
    recommendations = recommendations.concat(categoryRules.medium.recommendations);
  } else if (score <= categoryRules.high?.threshold) {
    recommendations = recommendations.concat(categoryRules.high.recommendations);
  }

  return recommendations;
};

// Main recommendation generation function
exports.generateRecommendations = async (response) => {
  const assessment = await Assessment.findById(response.assessment);
  const recommendations = {};

  response.categoryScores.forEach(categoryScore => {
    recommendations[categoryScore.name] = getRecommendationsForCategory(
      assessment.type,
      categoryScore.name,
      categoryScore.percentage
    );
  });

  return recommendations;
};

// Export rules for testing
exports.RECOMMENDATION_RULES = RECOMMENDATION_RULES; 