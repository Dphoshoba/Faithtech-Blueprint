const request = require('supertest');
const express = require('express');
const cookieParser = require('cookie-parser');
const { csrfProtection, handleCSRFError } = require('../csrf.middleware');

describe('CSRF Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(cookieParser());
    app.use(express.json());
  });

  describe('CSRF Protection', () => {
    beforeEach(() => {
      // Set up a test route with CSRF protection
      app.use(csrfProtection);
      app.use(handleCSRFError);
      
      // Test route that requires CSRF
      app.post('/test', (req, res) => {
        res.json({ message: 'success' });
      });
      
      // Route to get CSRF token
      app.get('/get-token', (req, res) => {
        res.json({ csrfToken: req.csrfToken() });
      });
    });

    it('should return 403 when CSRF token is missing', async () => {
      const response = await request(app)
        .post('/test')
        .send({ data: 'test' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Invalid or missing CSRF token');
    });

    it('should return 403 when CSRF token is invalid', async () => {
      const response = await request(app)
        .post('/test')
        .set('x-csrf-token', 'invalid-token')
        .send({ data: 'test' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Invalid or missing CSRF token');
    });

    it('should allow request with valid CSRF token', async () => {
      // First get the CSRF token
      const tokenResponse = await request(app)
        .get('/get-token');
      
      const csrfToken = tokenResponse.body.csrfToken;
      const cookies = tokenResponse.headers['set-cookie'];

      // Then make the actual request with the token
      const response = await request(app)
        .post('/test')
        .set('Cookie', cookies)
        .set('x-csrf-token', csrfToken)
        .send({ data: 'test' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('success');
    });
  });

  describe('CSRF Exclusions', () => {
    beforeEach(() => {
      // Set up the exclusion middleware
      app.use((req, res, next) => {
        if (req.path === '/public') {
          next();
        } else {
          csrfProtection(req, res, next);
        }
      });
      app.use(handleCSRFError);

      // Test routes
      app.post('/public', (req, res) => {
        res.json({ message: 'public success' });
      });

      app.post('/protected', (req, res) => {
        res.json({ message: 'protected success' });
      });
    });

    it('should allow requests to excluded paths without CSRF token', async () => {
      const response = await request(app)
        .post('/public')
        .send({ data: 'test' });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('public success');
    });

    it('should require CSRF token for protected paths', async () => {
      const response = await request(app)
        .post('/protected')
        .send({ data: 'test' });

      expect(response.status).toBe(403);
      expect(response.body.message).toBe('Invalid or missing CSRF token');
    });
  });
}); 