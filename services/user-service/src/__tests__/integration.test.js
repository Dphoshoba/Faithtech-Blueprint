const mongoose = require('mongoose');
const request = require('supertest');
const nodemailer = require('nodemailer');
const aws = require('aws-sdk');
const { MongoMemoryServer } = require('mongodb-memory-server');
const AWS = require('aws-sdk-mock');
const { setupTestDB, teardownTestDB } = require('./setup');
const app = require('../index');
const User = require('../models/User');

let emailSentTo = null;

// Mock external services
jest.mock('nodemailer');
jest.mock('aws-sdk');

describe('Integration Tests', () => {
  let mockMailer;
  let mockS3;

  beforeAll(async () => {
    await setupTestDB();

    // Setup mock mailer
    mockMailer = {
      sendMail: jest.fn().mockImplementation((mailOptions) => {
        emailSentTo = mailOptions.to;
        return Promise.resolve({ messageId: 'test-id' });
      })
    };
    nodemailer.createTransport.mockReturnValue(mockMailer);

    // Setup mock S3
    mockS3 = {
      upload: jest.fn().mockImplementation(() => ({
        promise: () => Promise.resolve({ Location: 'https://s3.example.com/test.jpg' })
      })),
      deleteObject: jest.fn().mockImplementation(() => ({
        promise: () => Promise.resolve({})
      }))
    };
    aws.S3 = jest.fn(() => mockS3);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
  });

  describe('Email Service Integration', () => {
    it('should send welcome email on registration', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(res.status).toBe(201);
      expect(mockMailer.sendMail).toHaveBeenCalledTimes(1);
      expect(mockMailer.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Welcome')
        })
      );
    });

    it('should send password reset email', async () => {
      // Create a user first
      const user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });

      const res = await request(app)
        .post('/api/users/forgot-password')
        .send({
          email: 'test@example.com'
        });

      expect(res.status).toBe(200);
      expect(mockMailer.sendMail).toHaveBeenCalledTimes(1);
      expect(mockMailer.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: expect.stringContaining('Password Reset')
        })
      );
    });
  });

  describe('File Upload Integration', () => {
    let userToken;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      userToken = res.body.token;
    });

    it('should upload profile picture to S3', async () => {
      const res = await request(app)
        .post('/api/users/profile/picture')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('picture', Buffer.from('fake-image'), 'test.jpg');

      expect(res.status).toBe(200);
      expect(mockS3.upload).toHaveBeenCalledTimes(1);
      expect(res.body).toHaveProperty('profilePicture', 'https://s3.example.com/test.jpg');
    });

    it('should delete old profile picture when updating', async () => {
      // First upload
      await request(app)
        .post('/api/users/profile/picture')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('picture', Buffer.from('fake-image'), 'test1.jpg');

      // Second upload should delete the first one
      const res = await request(app)
        .post('/api/users/profile/picture')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('picture', Buffer.from('fake-image'), 'test2.jpg');

      expect(res.status).toBe(200);
      expect(mockS3.deleteObject).toHaveBeenCalledTimes(1);
      expect(mockS3.upload).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle email service failures gracefully', async () => {
      // Mock email failure
      mockMailer.sendMail.mockRejectedValueOnce(new Error('SMTP error'));

      const res = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      // Should still create user despite email failure
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      
      // Verify user was created in database
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user).toBeTruthy();
    });

    it('should handle S3 upload failures gracefully', async () => {
      // Register a user
      const registerRes = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      const userToken = registerRes.body.token;

      // Mock S3 failure
      mockS3.upload.mockImplementationOnce(() => ({
        promise: () => Promise.reject(new Error('S3 error'))
      }));

      const res = await request(app)
        .post('/api/users/profile/picture')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('picture', Buffer.from('fake-image'), 'test.jpg');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Error uploading profile picture');
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should enforce rate limits on login attempts', async () => {
      // Create a user
      await User.create({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });

      // Make multiple login attempts
      const attempts = Array.from({ length: 6 }, () => 
        request(app)
          .post('/api/users/login')
          .send({
            email: 'test@example.com',
            password: 'wrongpassword'
          })
      );

      const results = await Promise.all(attempts);
      
      // The last attempt should be rate limited
      expect(results[5].status).toBe(429);
      expect(results[5].body).toHaveProperty('message', 'Too many login attempts');
    });
  });
}); 