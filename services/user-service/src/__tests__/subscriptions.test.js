const request = require('supertest');
const app = require('../index'); // Adjust path to your Express app

describe('Subscriptions API', () => {
  it('should require authentication', async () => {
    const res = await request(app).get('/api/subscriptions/me');
    expect(res.statusCode).toEqual(401);
  });
}); 