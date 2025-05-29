const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const {
  getContentBasedRecommendations,
  getCollaborativeRecommendations,
  getTrendingTemplates,
  getPersonalizedRecommendations
} = require('../utils/recommendations');
const Template = require('../models/Template');
const { redis } = require('../utils/cache');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
  await redis.quit();
});

beforeEach(async () => {
  await Template.deleteMany({});
});

describe('Recommendation System', () => {
  describe('Content-based Recommendations', () => {
    it('should return similar templates based on tags and category', async () => {
      // Create test templates
      const template1 = await Template.create({
        name: 'Template 1',
        category: 'church',
        tags: ['modern', 'responsive'],
        status: 'published'
      });

      await Template.create({
        name: 'Template 2',
        category: 'church',
        tags: ['modern', 'events'],
        status: 'published'
      });

      await Template.create({
        name: 'Template 3',
        category: 'ministry',
        tags: ['responsive'],
        status: 'published'
      });

      const recommendations = await getContentBasedRecommendations(template1._id);
      expect(recommendations).toHaveLength(2);
      expect(recommendations[0].name).toBe('Template 2'); // More matching attributes
      expect(recommendations[1].name).toBe('Template 3'); // Fewer matching attributes
    });
  });

  describe('Collaborative Recommendations', () => {
    it('should return templates based on user interactions', async () => {
      const userId = new mongoose.Types.ObjectId();
      const otherUserId = new mongoose.Types.ObjectId();

      // Create templates with user interactions
      const template1 = await Template.create({
        name: 'Template 1',
        status: 'published',
        metadata: {
          analytics: {
            ratings: [
              { user: userId, rating: 5 },
              { user: otherUserId, rating: 5 }
            ]
          }
        }
      });

      const template2 = await Template.create({
        name: 'Template 2',
        status: 'published',
        metadata: {
          analytics: {
            ratings: [
              { user: otherUserId, rating: 5 }
            ]
          }
        }
      });

      const recommendations = await getCollaborativeRecommendations(userId);
      expect(recommendations).toHaveLength(1);
      expect(recommendations[0].name).toBe('Template 2');
    });
  });

  describe('Trending Templates', () => {
    it('should return templates sorted by engagement score', async () => {
      // Create templates with different engagement levels
      await Template.create({
        name: 'High Engagement',
        status: 'published',
        metadata: {
          analytics: {
            views: 1000,
            downloads: 100,
            rating: { average: 4.8, count: 50 }
          }
        }
      });

      await Template.create({
        name: 'Low Engagement',
        status: 'published',
        metadata: {
          analytics: {
            views: 100,
            downloads: 10,
            rating: { average: 4.0, count: 5 }
          }
        }
      });

      const trending = await getTrendingTemplates(30, 2);
      expect(trending).toHaveLength(2);
      expect(trending[0].name).toBe('High Engagement');
      expect(trending[1].name).toBe('Low Engagement');
    });
  });

  describe('Personalized Recommendations', () => {
    it('should combine collaborative and trending recommendations', async () => {
      const userId = new mongoose.Types.ObjectId();
      
      // Create templates for both types of recommendations
      await Template.create([
        {
          name: 'Collaborative Rec',
          status: 'published',
          metadata: {
            analytics: {
              ratings: [{ user: userId, rating: 5 }]
            }
          }
        },
        {
          name: 'Trending Template',
          status: 'published',
          metadata: {
            analytics: {
              views: 1000,
              downloads: 100,
              rating: { average: 4.8, count: 50 }
            }
          }
        }
      ]);

      const recommendations = await getPersonalizedRecommendations(userId);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.recommendationType === 'collaborative')).toBe(true);
      expect(recommendations.some(r => r.recommendationType === 'trending')).toBe(true);
    });
  });
}); 