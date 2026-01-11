const request = require('supertest');
const app = require('../../../src/app');

describe('Auth API Integration Tests', () => {
  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe('newuser@example.com');
      expect(response.body.data.user.role).toBe('customer');
    });

    it('should return 409 for duplicate email', async () => {
      await request(app).post('/auth/register').send({
        email: 'duplicate@example.com',
        password: 'password123',
      });

      const response = await request(app).post('/auth/register').send({
        email: 'duplicate@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(409);
      expect(response.body.status).toBe('error');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app).post('/auth/register').send({
        email: 'invalidemail',
        password: 'password123',
      });

      expect(response.status).toBe(400);
    });

    it('should return 400 for short password', async () => {
      const response = await request(app).post('/auth/register').send({
        email: 'test@example.com',
        password: '123',
      });

      expect(response.status).toBe(400);
    });

    it('should respect rate limiting', async () => {
      const promises = [];
      for (let i = 0; i < 6; i++) {
        promises.push(
          request(app).post('/auth/register').send({
            email: `user${i}@example.com`,
            password: 'password123',
          })
        );
      }

      const responses = await Promise.all(promises);
      const tooManyRequests = responses.filter(r => r.status === 429);
      expect(tooManyRequests.length).toBeGreaterThan(0);
    });
  });

  describe('POST /auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/auth/register').send({
        email: 'loginuser@example.com',
        password: 'password123',
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'loginuser@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe('loginuser@example.com');
    });

    it('should return 401 for wrong password', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'loginuser@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
    });

    it('should return 401 for non-existent user', async () => {
      const response = await request(app).post('/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(401);
    });
  });
});