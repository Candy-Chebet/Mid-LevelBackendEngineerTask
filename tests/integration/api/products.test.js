const request = require('supertest');
const app = require('../../../src/app');

describe('Products API Integration Tests', () => {
  let adminToken;
  let customerToken;

  beforeEach(async () => {
    const adminRes = await request(app).post('/auth/register').send({
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
    });
    adminToken = adminRes.body.data.token;

    const customerRes = await request(app).post('/auth/register').send({
      email: 'customer@test.com',
      password: 'customer123',
    });
    customerToken = customerRes.body.data.token;
  });

  describe('POST /products', () => {
    it('should create product as admin', async () => {
      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
          price: 9999,
          stock: 100,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe('Test Product');
      expect(response.body.data.price).toBe(9999);
    });

    it('should return 403 when customer tries to create product', async () => {
      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Test Product',
          price: 9999,
          stock: 100,
        });

      expect(response.status).toBe(403);
    });

    it('should return 401 without token', async () => {
      const response = await request(app).post('/products').send({
        name: 'Test Product',
        price: 9999,
        stock: 100,
      });

      expect(response.status).toBe(401);
    });

    it('should validate product data', async () => {
      const response = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '',
          price: -100,
          stock: -10,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /products', () => {
    it('should return all products without authentication', async () => {
      await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Product 1', price: 100, stock: 10 });

      await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Product 2', price: 200, stock: 20 });

      const response = await request(app).get('/products');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('PATCH /products/:id', () => {
    it('should update product as admin', async () => {
      const createRes = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Original', price: 100, stock: 10 });

      const productId = createRes.body.data.id;

      const response = await request(app)
        .patch(`/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated', price: 200 });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated');
      expect(response.body.data.price).toBe(200);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      const response = await request(app)
        .patch(`/products/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
    });
  });
});