const request = require('supertest');
const { performance } = require('perf_hooks');
const { setupTestDB, teardownTestDB } = require('./setup');
const app = require('../index');
const User = require('../models/User');

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('Performance Tests', () => {
  const generateUser = (index) => ({
    email: `test${index}@example.com`,
    password: 'password123',
    firstName: `Test${index}`,
    lastName: 'User'
  });

  test('should handle concurrent user registrations', async () => {
    const numUsers = 50;
    const registrationPromises = [];

    for (let i = 0; i < numUsers; i++) {
      registrationPromises.push(
        request(app)
          .post('/api/users/register')
          .send(generateUser(i))
      );
    }

    const responses = await Promise.all(registrationPromises);
    const successfulRegistrations = responses.filter(res => res.status === 201);
    
    expect(successfulRegistrations.length).toBe(numUsers);
  }, 30000);

  test('should handle concurrent logins', async () => {
    // First register users
    const numUsers = 50;
    for (let i = 0; i < numUsers; i++) {
      await request(app)
        .post('/api/users/register')
        .send(generateUser(i));
    }

    const loginPromises = [];
    for (let i = 0; i < numUsers; i++) {
      loginPromises.push(
        request(app)
          .post('/api/users/login')
          .send({
            email: `test${i}@example.com`,
            password: 'password123'
          })
      );
    }

    const responses = await Promise.all(loginPromises);
    const successfulLogins = responses.filter(res => res.status === 200);
    
    expect(successfulLogins.length).toBe(numUsers);
  }, 30000);

  test('should maintain response times under load', async () => {
    // Register a test user
    const response = await request(app)
      .post('/api/users/register')
      .send(generateUser(1));
    
    const token = response.body.token;

    // Make 100 concurrent profile requests
    const startTime = Date.now();
    const requests = Array(100).fill().map(() =>
      request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
    );

    const responses = await Promise.all(requests);
    const endTime = Date.now();

    const totalTime = endTime - startTime;
    const avgResponseTime = totalTime / responses.length;

    // Average response time should be under 200ms
    expect(avgResponseTime).toBeLessThan(200);

    // All requests should be successful
    expect(responses.every(res => res.status === 200)).toBe(true);
  }, 30000);

  test('should handle database connection pool efficiently', async () => {
    // Create 100 users
    const users = await Promise.all(
      Array(100).fill().map((_, i) =>
        request(app)
          .post('/api/users/register')
          .send(generateUser(i))
      )
    );

    const tokens = users.map(response => response.body.token);

    // Simulate multiple concurrent database operations
    const operations = [];
    for (let i = 0; i < 100; i++) {
      operations.push(
        request(app)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${tokens[i]}`),
        request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${tokens[i]}`)
          .send({ firstName: `Updated${i}` })
      );
    }

    const startTime = Date.now();
    const results = await Promise.all(operations);
    const endTime = Date.now();

    const totalTime = endTime - startTime;
    const avgOperationTime = totalTime / operations.length;

    // Average operation time should be under 100ms
    expect(avgOperationTime).toBeLessThan(100);

    // All operations should be successful
    expect(results.every(res => res.status === 200)).toBe(true);
  }, 60000);

  test('should handle memory usage efficiently', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Create 1000 users with profile pictures
    const users = [];
    for (let i = 0; i < 1000; i++) {
      const user = await request(app)
        .post('/api/users/register')
        .send(generateUser(i));
      users.push(user.body);
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB

    // Memory increase should be less than 100MB
    expect(memoryIncrease).toBeLessThan(100);
  }, 120000);

  test('should handle rate limiting', async () => {
    const user = await request(app)
      .post('/api/users/register')
      .send(generateUser(1));
    
    const token = user.body.token;

    // Make 100 requests in quick succession
    const requests = Array(100).fill().map(() =>
      request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
    );

    const responses = await Promise.all(requests);
    
    // Some requests should be rate limited (status 429)
    const rateLimited = responses.some(res => res.status === 429);
    expect(rateLimited).toBe(true);

    // Wait for rate limit to reset
    await new Promise(resolve => setTimeout(resolve, 60000));

    // Should be able to make requests again
    const response = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);
    
    expect(response.status).toBe(200);
  }, 90000);
}); 