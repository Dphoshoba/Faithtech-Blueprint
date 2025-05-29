const request = require('supertest');
const app = require('../index'); // Adjust path to your Express app

describe('Plans API', () => {
  it('should list all plans', async () => {
    const res = await request(app).get('/api/plans');
    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
}); 