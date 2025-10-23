const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const AWS = require('aws-sdk-mock');

let mongoServer;
let mongod;

// Set test environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.AWS_ACCESS_KEY_ID = 'test-key-id';
process.env.AWS_SECRET_ACCESS_KEY = 'test-access-key';
process.env.AWS_REGION = 'us-east-1';
process.env.AWS_S3_BUCKET = 'test-bucket';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_PORT = '587';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'test-password';

// Mock AWS services before requiring any modules that use AWS
AWS.setSDKInstance(require('aws-sdk'));

// Export setup and teardown functions
module.exports = {
  setupTestDB: async () => {
    // Mock AWS S3 methods
    AWS.mock('S3', 'upload', (params, callback) => {
      callback(null, { Location: 'https://test-bucket.s3.amazonaws.com/test.jpg' });
    });

    AWS.mock('S3', 'deleteObject', (params, callback) => {
      callback(null, {});
    });

    // Setup MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = await mongoServer.getUri();
    await mongoose.connect(mongoUri);
  },

  teardownTestDB: async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
    AWS.restore('S3');
  },

  clearDatabase: async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany();
    }
  }
};

// Mock external services
jest.mock('nodemailer');
jest.mock('aws-sdk');

// Configure test timeouts
jest.setTimeout(120000); // 2 minutes for complex tests

beforeAll(async () => {
  // Create an in-memory MongoDB instance
  mongod = await MongoMemoryServer.create();
  const mongoUri = mongod.getUri();
  
  // Set the MongoDB URI for tests
  process.env.MONGODB_URI = mongoUri;
});

afterAll(async () => {
  // Stop the in-memory MongoDB instance
  if (mongod) {
    await mongod.stop();
  }
}); 