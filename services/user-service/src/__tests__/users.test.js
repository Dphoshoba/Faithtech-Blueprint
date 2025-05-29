const request = require('supertest');
const { setupTestDB, teardownTestDB } = require('./setup');
const app = require('../index');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const speakeasy = require('speakeasy');

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('User Registration', () => {
  const validUser = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User'
  };

  test('should register a new user', async () => {
    const response = await request(app)
      .post('/api/users/register')
      .send(validUser);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toHaveProperty('email', validUser.email);
    expect(response.body.user).not.toHaveProperty('password');
  });

  test('should not register user with invalid email', async () => {
    const response = await request(app)
      .post('/api/users/register')
      .send({
        ...validUser,
        email: 'invalid-email'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  test('should not register user with short password', async () => {
    const response = await request(app)
      .post('/api/users/register')
      .send({
        ...validUser,
        password: '123'
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  test('should not register duplicate email', async () => {
    await request(app)
      .post('/api/users/register')
      .send(validUser);

    const response = await request(app)
      .post('/api/users/register')
      .send(validUser);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Email already exists');
  });
});

describe('User Authentication', () => {
  const user = {
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User'
  };
  let token;

  beforeEach(async () => {
    const response = await request(app)
      .post('/api/users/register')
      .send(user);
    token = response.body.token;
  });

  test('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/users/login')
      .send({
        email: user.email,
        password: user.password
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user).toHaveProperty('email', user.email);
  });

  test('should not login with wrong password', async () => {
    const response = await request(app)
      .post('/api/users/login')
      .send({
        email: user.email,
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message', 'Invalid credentials');
  });

  test('should get profile with valid token', async () => {
    const response = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user).toHaveProperty('email', user.email);
  });

  test('should not get profile without token', async () => {
    const response = await request(app)
      .get('/api/users/profile');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message', 'Authentication required');
  });
}); 