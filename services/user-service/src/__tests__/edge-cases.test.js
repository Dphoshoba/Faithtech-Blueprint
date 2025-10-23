const request = require('supertest');
const mongoose = require('mongoose');
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

describe('Edge Cases and Error Handling', () => {
  describe('Input Validation Edge Cases', () => {
    it('should handle extremely long input fields', async () => {
      const longString = 'a'.repeat(1000);
      const res = await request(app)
        .post('/api/users/register')
        .send({
          email: `test@${longString}.com`,
          password: longString,
          firstName: longString,
          lastName: longString
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    }, 120000);

    it('should handle special characters in user input', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test.user+special@example.com',
          password: 'password123!@#$%^&*()',
          firstName: 'Test-Name',
          lastName: "O'Connor"
        });

      expect(res.status).toBe(201);
      expect(res.body.user.firstName).toBe('Test-Name');
      expect(res.body.user.lastName).toBe("O'Connor");
    }, 120000);

    it('should handle empty or whitespace-only input', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          email: '   ',
          password: '   ',
          firstName: '   ',
          lastName: '   '
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
    }, 120000);

    it('should handle unicode characters in names', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: '名前',
          lastName: 'Señor'
        });

      expect(res.status).toBe(201);
      expect(res.body.user.firstName).toBe('名前');
      expect(res.body.user.lastName).toBe('Señor');
    }, 120000);

    it('should handle special characters in email local part', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test.user+label@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('test.user+label@example.com');
    });

    it('should reject SQL injection attempts', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .send({
          email: "test@example.com' OR '1'='1",
          password: "password123' OR '1'='1",
          firstName: "Robert'; DROP TABLE users; --",
          lastName: "User"
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Network and Database Error Handling', () => {
    it('should handle database connection loss gracefully', async () => {
      // Force close the connection
      await mongoose.connection.close();

      const res = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('message', 'Internal server error');

      // Reconnect for other tests
      const dbName = 'edge-test-' + new Date().getTime();
      const mongoUri = process.env.MONGODB_URI || `mongodb://localhost:27017/${dbName}`;
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
    });

    it('should handle malformed JSON in requests', async () => {
      const res = await request(app)
        .post('/api/users/register')
        .set('Content-Type', 'application/json')
        .send('{"malformed":json}');

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'Invalid JSON payload');
    });
  });

  describe('Authentication Edge Cases', () => {
    it('should handle expired tokens gracefully', async () => {
      // Create a user and get token
      const registerRes = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjF9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message', 'Token expired');
    });

    it('should handle malformed tokens', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer not-a-real-token');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message', 'Invalid token');
    });

    it('should handle malformed JWT tokens', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer malformed.jwt.token');

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid token');
    });

    it('should handle missing Authorization header', async () => {
      const res = await request(app)
        .get('/api/users/profile');

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Authentication required');
    });

    it('should handle concurrent logout requests', async () => {
      const user = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      const token = user.body.token;
      const logoutPromises = Array(5).fill().map(() =>
        request(app)
          .post('/api/users/logout')
          .set('Authorization', `Bearer ${token}`)
      );

      const responses = await Promise.all(logoutPromises);
      expect(responses[0].status).toBe(200);
      // Subsequent logout attempts should fail
      expect(responses.slice(1).every(res => res.status === 401)).toBe(true);
    });
  });

  describe('Concurrent Operation Handling', () => {
    it('should handle concurrent profile updates correctly', async () => {
      // Create a user
      const registerRes = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      const token = registerRes.body.token;

      // Make concurrent update requests
      const updates = Array.from({ length: 5 }, (_, i) => 
        request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${token}`)
          .send({
            firstName: `Test${i}`,
            lastName: `User${i}`
          })
      );

      const results = await Promise.all(updates);

      // All requests should succeed
      results.forEach(res => {
        expect(res.status).toBe(200);
      });

      // Final state should match one of the updates
      const finalUser = await User.findOne({ email: 'test@example.com' });
      expect(finalUser.firstName).toMatch(/Test[0-4]/);
      expect(finalUser.lastName).toMatch(/User[0-4]/);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency during failed operations', async () => {
      // Create initial user
      const user = await User.create({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });

      const initialState = await User.findById(user._id);

      // Attempt an invalid update
      const res = await request(app)
        .put('/api/users/profile')
        .send({
          email: 'invalid-email',
          firstName: 'New Name'
        });

      expect(res.status).toBe(401); // Unauthorized without token

      // Verify user data remained unchanged
      const finalState = await User.findById(user._id);
      expect(finalState.email).toBe(initialState.email);
      expect(finalState.firstName).toBe(initialState.firstName);
    });
  });

  describe('Profile Management Edge Cases', () => {
    it('should handle circular profile picture updates', async () => {
      const user = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      const token = user.body.token;
      
      // Upload multiple profile pictures in quick succession
      const uploadPromises = Array(5).fill().map(() =>
        request(app)
          .post('/api/users/profile/picture')
          .set('Authorization', `Bearer ${token}`)
          .attach('picture', Buffer.from('fake-image'), 'test.jpg')
      );

      const responses = await Promise.all(uploadPromises);
      // All uploads should succeed, but only the last one should be saved
      expect(responses.every(res => res.status === 200)).toBe(true);
      
      const profileResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      const urls = responses.map(res => res.body.profilePicture);
      expect(profileResponse.body.user.profilePicture).toBe(urls[urls.length - 1]);
    });

    it('should handle malformed image data', async () => {
      const user = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      const token = user.body.token;
      
      const response = await request(app)
        .post('/api/users/profile/picture')
        .set('Authorization', `Bearer ${token}`)
        .attach('picture', Buffer.from('not-an-image'), 'test.txt');

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Only image files are allowed!');
    });

    it('should handle XSS attempts in profile updates', async () => {
      const user = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      const token = user.body.token;
      
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: '<script>alert("xss")</script>',
          lastName: '<img src="x" onerror="alert(1)">'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.firstName).not.toMatch(/<script>/);
      expect(response.body.user.lastName).not.toMatch(/<img/);
    });
  });

  describe('Password Reset Edge Cases', () => {
    it('should handle multiple reset requests for same email', async () => {
      await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      // Send multiple reset requests
      const resetPromises = Array(5).fill().map(() =>
        request(app)
          .post('/api/users/forgot-password')
          .send({ email: 'test@example.com' })
      );

      const responses = await Promise.all(resetPromises);
      expect(responses.every(res => res.status === 200)).toBe(true);

      // Check that only the latest token is valid
      const user = await User.findOne({ email: 'test@example.com' });
      expect(user.passwordResetToken).toBeTruthy();
    });

    it('should handle password reset with invalid token format', async () => {
      const response = await request(app)
        .post('/api/users/reset-password')
        .send({
          token: 'invalid-token-format',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Invalid or expired reset token');
    });

    it('should prevent password reuse', async () => {
      const user = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      const resetResponse = await request(app)
        .post('/api/users/forgot-password')
        .send({ email: 'test@example.com' });

      const dbUser = await User.findOne({ email: 'test@example.com' });
      const resetToken = dbUser.passwordResetToken;

      const response = await request(app)
        .post('/api/users/reset-password')
        .send({
          token: resetToken,
          newPassword: 'password123' // Same as original password
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('New password cannot be the same as old password');
    });
  });

  describe('Database Edge Cases', () => {
    it('should handle MongoDB duplicate key errors', async () => {
      // Create first user
      await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      // Try to create another user with same email
      const response = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'different123',
          firstName: 'Another',
          lastName: 'User'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email already exists');
    });

    it('should handle MongoDB validation errors', async () => {
      const user = new User({
        // Missing required fields
        email: 'test@example.com'
      });

      try {
        await user.save();
        fail('Should have thrown validation error');
      } catch (error) {
        expect(error.name).toBe('ValidationError');
        expect(error.errors.password).toBeDefined();
        expect(error.errors.firstName).toBeDefined();
        expect(error.errors.lastName).toBeDefined();
      }
    });

    it('should handle concurrent document updates', async () => {
      const user = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'Test',
          lastName: 'User'
        });

      const token = user.body.token;

      // Make concurrent profile updates
      const updatePromises = Array(5).fill().map((_, i) =>
        request(app)
          .put('/api/users/profile')
          .set('Authorization', `Bearer ${token}`)
          .send({
            firstName: `Test${i}`,
            lastName: `User${i}`
          })
      );

      const responses = await Promise.all(updatePromises);
      expect(responses.every(res => res.status === 200)).toBe(true);

      // Verify final state
      const finalResponse = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(finalResponse.status).toBe(200);
      expect(finalResponse.body.user.firstName).toBe('Test4');
      expect(finalResponse.body.user.lastName).toBe('User4');
    });
  });
});

describe('Rate Limiting Edge Cases', () => {
  test('should handle burst requests properly', async () => {
    const user = await request(app)
      .post('/api/users/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });

    const token = user.body.token;

    // Make 100 requests in quick succession
    const requests = Array(100).fill().map(() =>
      request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${token}`)
    );

    const responses = await Promise.all(requests);
    
    // Should see some rate limited responses
    const rateLimited = responses.some(res => res.status === 429);
    expect(rateLimited).toBe(true);

    // Headers should contain rate limit info
    const rateLimitHeaders = responses[0].headers;
    expect(rateLimitHeaders).toHaveProperty('x-ratelimit-limit');
    expect(rateLimitHeaders).toHaveProperty('x-ratelimit-remaining');
    expect(rateLimitHeaders).toHaveProperty('x-ratelimit-reset');
  });

  test('should handle distributed rate limiting across IPs', async () => {
    const ips = ['1.1.1.1', '2.2.2.2', '3.3.3.3'];
    
    // Make requests from different IPs
    const requests = ips.flatMap(ip => 
      Array(40).fill().map(() =>
        request(app)
          .post('/api/users/login')
          .set('X-Forwarded-For', ip)
          .send({
            email: 'nonexistent@example.com',
            password: 'wrongpassword'
          })
      )
    );

    const responses = await Promise.all(requests);
    
    // Each IP should hit its own rate limit
    ips.forEach(ip => {
      const ipResponses = responses.filter((_, i) => Math.floor(i / 40) === ips.indexOf(ip));
      expect(ipResponses.some(res => res.status === 429)).toBe(true);
    });
  });
});

describe('Session Management Edge Cases', () => {
  test('should handle multiple active sessions per user', async () => {
    // Register a user
    const user = await request(app)
      .post('/api/users/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });

    // Create multiple sessions (logins)
    const sessions = await Promise.all(
      Array(5).fill().map(() =>
        request(app)
          .post('/api/users/login')
          .send({
            email: 'test@example.com',
            password: 'password123'
          })
      )
    );

    // All sessions should be valid
    const tokens = sessions.map(session => session.body.token);
    const profileChecks = await Promise.all(
      tokens.map(token =>
        request(app)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${token}`)
      )
    );

    expect(profileChecks.every(res => res.status === 200)).toBe(true);

    // Verify session count in database
    const dbUser = await User.findOne({ email: 'test@example.com' });
    expect(dbUser.tokens.length).toBe(5);
  });

  test('should handle session invalidation on password change', async () => {
    // Register and login
    const user = await request(app)
      .post('/api/users/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });

    const token = user.body.token;

    // Change password
    const passwordChange = await request(app)
      .post('/api/users/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'password123',
        newPassword: 'newpassword123'
      });

    expect(passwordChange.status).toBe(200);

    // Old token should be invalid
    const oldTokenCheck = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(oldTokenCheck.status).toBe(401);
  });
});

describe('Security Edge Cases', () => {
  test('should prevent NoSQL injection attacks', async () => {
    const maliciousQueries = [
      { email: { $ne: null }, password: { $ne: null } },
      { email: { $in: ['admin@example.com'] } },
      { email: { $regex: '.*' } }
    ];

    const responses = await Promise.all(
      maliciousQueries.map(query =>
        request(app)
          .post('/api/users/login')
          .send(query)
      )
    );

    expect(responses.every(res => res.status === 400 || res.status === 401)).toBe(true);
  });

  test('should handle large payload attacks', async () => {
    const largeString = 'a'.repeat(1024 * 1024); // 1MB string
    const response = await request(app)
      .post('/api/users/register')
      .send({
        email: 'test@example.com',
        password: largeString,
        firstName: largeString,
        lastName: largeString
      });

    expect(response.status).toBe(413); // Payload Too Large
  });

  test('should prevent path traversal in profile picture uploads', async () => {
    const user = await request(app)
      .post('/api/users/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });

    const token = user.body.token;

    const response = await request(app)
      .post('/api/users/profile/picture')
      .set('Authorization', `Bearer ${token}`)
      .attach('picture', Buffer.from('fake image'), '../../../etc/passwd');

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/invalid filename/i);
  });

  test('should handle CSRF token validation', async () => {
    const response = await request(app)
      .post('/api/users/register')
      .set('X-CSRF-Token', 'invalid-token')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/invalid csrf token/i);
  });
});

describe('Data Integrity Edge Cases', () => {
  test('should handle race conditions in email verification', async () => {
    // Register a user
    const user = await request(app)
      .post('/api/users/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });

    const verificationToken = 'some-verification-token';

    // Attempt multiple concurrent verifications
    const verificationPromises = Array(5).fill().map(() =>
      request(app)
        .post('/api/users/verify-email')
        .send({ token: verificationToken })
    );

    const responses = await Promise.all(verificationPromises);
    
    // Only one verification should succeed
    const successfulVerifications = responses.filter(res => res.status === 200);
    expect(successfulVerifications.length).toBe(1);
  });

  test('should maintain referential integrity on user deletion', async () => {
    // Create a user with associated data
    const user = await request(app)
      .post('/api/users/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });

    const token = user.body.token;

    // Add some user data (posts, comments, etc.)
    await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'Test post' });

    // Delete user
    await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${token}`);

    // Check associated data is handled properly
    const posts = await Post.find({ author: user.body.user._id });
    expect(posts.length).toBe(0);
  });

  test('should handle concurrent account deletion requests', async () => {
    const user = await request(app)
      .post('/api/users/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User'
      });

    const token = user.body.token;

    // Send multiple delete requests
    const deletePromises = Array(5).fill().map(() =>
      request(app)
        .delete('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
    );

    const responses = await Promise.all(deletePromises);
    
    // Only one deletion should succeed
    const successfulDeletions = responses.filter(res => res.status === 200);
    expect(successfulDeletions.length).toBe(1);

    // Subsequent requests should fail
    const finalCheck = await request(app)
      .get('/api/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(finalCheck.status).toBe(401);
  });
});

describe('Password Complexity Edge Cases', () => {
  test('should validate password complexity requirements', async () => {
    const testCases = [
      {
        password: 'short',
        shouldPass: false,
        message: 'Password too short'
      },
      {
        password: 'onlylowercase',
        shouldPass: false,
        message: 'Missing uppercase'
      },
      {
        password: 'ONLYUPPERCASE',
        shouldPass: false,
        message: 'Missing lowercase'
      },
      {
        password: 'NoNumbers',
        shouldPass: false,
        message: 'Missing numbers'
      },
      {
        password: 'NoSpecial123',
        shouldPass: false,
        message: 'Missing special characters'
      },
      {
        password: 'Valid@Password123',
        shouldPass: true,
        message: 'Valid password'
      },
      {
        password: ''.padEnd(129, 'A@1a'),  // Too long password
        shouldPass: false,
        message: 'Password too long'
      }
    ];

    for (const testCase of testCases) {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: testCase.password,
          firstName: 'Test',
          lastName: 'User'
        });

      if (testCase.shouldPass) {
        expect(response.status).toBe(201);
      } else {
        expect(response.status).toBe(400);
        expect(response.body.message).toMatch(/password/i);
      }
    }
  });

  test('should prevent common passwords', async () => {
    const commonPasswords = [
      'Password123!',
      'Admin123!',
      'Welcome123!',
      'Letmein123!'
    ];

    for (const password of commonPasswords) {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          email: 'test@example.com',
          password: password,
          firstName: 'Test',
          lastName: 'User'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/common password/i);
    }
  });
});

describe('Role Management Edge Cases', () => {
  test('should handle role elevation attempts', async () => {
    // Create a regular user
    const user = await request(app)
      .post('/api/users/register')
      .send({
        email: 'user@example.com',
        password: 'ValidPass123!',
        firstName: 'Regular',
        lastName: 'User'
      });

    const token = user.body.token;

    // Attempt to elevate own role
    const response = await request(app)
      .put('/api/users/role')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: user.body.user._id,
        role: 'admin'
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/unauthorized/i);
  });

  test('should prevent admin from demoting themselves', async () => {
    // Create an admin user
    const admin = await User.create({
      email: 'admin@example.com',
      password: 'AdminPass123!',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });

    const token = await admin.generateAuthToken();

    // Attempt to demote self
    const response = await request(app)
      .put('/api/users/role')
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId: admin._id,
        role: 'user'
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/cannot demote yourself/i);
  });
});

describe('API Versioning Edge Cases', () => {
  test('should handle deprecated API version gracefully', async () => {
    const response = await request(app)
      .post('/api/v1/users/register')  // Old API version
      .send({
        email: 'test@example.com',
        password: 'ValidPass123!',
        firstName: 'Test',
        lastName: 'User'
      });

    expect(response.status).toBe(410);  // Gone
    expect(response.body.message).toMatch(/api version deprecated/i);
  });

  test('should handle unsupported API version', async () => {
    const response = await request(app)
      .post('/api/v99/users/register')  // Non-existent version
      .send({
        email: 'test@example.com',
        password: 'ValidPass123!',
        firstName: 'Test',
        lastName: 'User'
      });

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/api version not found/i);
  });
});

describe('Account Recovery Edge Cases', () => {
  test('should handle multiple recovery methods concurrently', async () => {
    // Create a user
    const user = await request(app)
      .post('/api/users/register')
      .send({
        email: 'test@example.com',
        password: 'ValidPass123!',
        firstName: 'Test',
        lastName: 'User'
      });

    // Initiate both email and phone recovery
    const [emailRecovery, phoneRecovery] = await Promise.all([
      request(app)
        .post('/api/users/recover/email')
        .send({ email: 'test@example.com' }),
      request(app)
        .post('/api/users/recover/phone')
        .send({ phone: '+1234567890' })
    ]);

    expect(emailRecovery.status).toBe(200);
    expect(phoneRecovery.status).toBe(200);

    // Verify only one recovery method can be completed
    const recoveryToken = emailRecovery.body.token;
    const phoneCode = '123456';

    const [emailReset, phoneReset] = await Promise.all([
      request(app)
        .post('/api/users/reset-password')
        .send({
          token: recoveryToken,
          newPassword: 'NewValidPass123!'
        }),
      request(app)
        .post('/api/users/reset-password/phone')
        .send({
          code: phoneCode,
          newPassword: 'DifferentPass123!'
        })
    ]);

    // Only one reset should succeed
    const successfulResets = [emailReset, phoneReset].filter(res => res.status === 200);
    expect(successfulResets.length).toBe(1);
  });

  test('should handle account recovery with 2FA enabled', async () => {
    // Create a user with 2FA enabled
    const user = await User.create({
      email: 'test@example.com',
      password: 'ValidPass123!',
      firstName: 'Test',
      lastName: 'User',
      twoFactorEnabled: true
    });

    // Request password reset
    const resetRequest = await request(app)
      .post('/api/users/forgot-password')
      .send({ email: 'test@example.com' });

    expect(resetRequest.status).toBe(200);

    // Attempt reset without 2FA code
    const resetWithout2FA = await request(app)
      .post('/api/users/reset-password')
      .send({
        token: resetRequest.body.token,
        newPassword: 'NewValidPass123!'
      });

    expect(resetWithout2FA.status).toBe(400);
    expect(resetWithout2FA.body.message).toMatch(/2fa required/i);

    // Reset with 2FA code
    const resetWith2FA = await request(app)
      .post('/api/users/reset-password')
      .send({
        token: resetRequest.body.token,
        newPassword: 'NewValidPass123!',
        twoFactorCode: '123456'
      });

    expect(resetWith2FA.status).toBe(200);
  });
}); 