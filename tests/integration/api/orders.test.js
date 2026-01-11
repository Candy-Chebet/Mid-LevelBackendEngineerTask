const request = require('supertest');
const app = require('../../../src/app');

describe('Orders API Integration Tests', () => {
  let adminToken;
  let customerToken;
  let customer2Token;
  let product1;
  let product2;

  beforeEach(async () => {
    // Create admin
    const adminRes = await request(app).post('/auth/register').send({
      email: 'admin@test.com',
      password: 'admin123',
      role: 'admin',
    });
    adminToken = adminRes.body.data.token;

    // Create customer 1
    const customer1Res = await request(app).post('/auth/register').send({
      email: 'customer1@test.com',
      password: 'customer123',
    });
    customerToken = customer1Res.body.data.token;

    // Create customer 2
    const customer2Res = await request(app).post('/auth/register').send({
      email: 'customer2@test.com',
      password: 'customer123',
    });
    customer2Token = customer2Res.body.data.token;

    // Create products
    const product1Res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Laptop', price: 99999, stock: 10 });
    product1 = product1Res.body.data;

    const product2Res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Mouse', price: 2999, stock: 50 });
    product2 = product2Res.body.data;
  });

  describe('POST /orders', () => {
    it('should create order successfully', async () => {
      const response = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            { productId: product1.id, quantity: 2 },
            { productId: product2.id, quantity: 3 },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.total).toBe(208997); // (99999 * 2) + (2999 * 3)
      expect(response.body.data.status).toBe('created');
    });

    it('should decrease product stock when creating order', async () => {
      await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: product1.id, quantity: 3 }],
        });

      const productsRes = await request(app).get('/products');
      const updatedProduct = productsRes.body.data.find(p => p.id === product1.id);
      expect(updatedProduct.stock).toBe(7); // 10 - 3
    });

    it('should store unit price at time of purchase', async () => {
      const response = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: product1.id, quantity: 1 }],
        });

      expect(response.body.data.items[0].unitPrice).toBe(product1.price);

      // Update product price
      await request(app)
        .patch(`/products/${product1.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 79999 });

      // Order should still have old price
      const ordersRes = await request(app)
        .get('/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(ordersRes.body.data[0].items[0].unitPrice).toBe(product1.price);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 1 }],
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for insufficient stock', async () => {
      const response = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: product1.id, quantity: 100 }],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Insufficient stock');
    });

    it('should return 400 for quantity <= 0', async () => {
      const response = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: product1.id, quantity: 0 }],
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for invalid product ID format', async () => {
      const response = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: 'invalid-id', quantity: 1 }],
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for empty items array', async () => {
      const response = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ items: [] });

      expect(response.status).toBe(400);
    });

    it('should rollback transaction if second item has insufficient stock', async () => {
      const response = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            { productId: product1.id, quantity: 2 },
            { productId: product2.id, quantity: 100 }, // Exceeds stock
          ],
        });

      expect(response.status).toBe(400);

      // First product stock should not be decreased
      const productsRes = await request(app).get('/products');
      const p1 = productsRes.body.data.find(p => p.id === product1.id);
      expect(p1.stock).toBe(10); // Original stock
    });

    it('should return 403 when admin tries to create order', async () => {
      const response = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          items: [{ productId: product1.id, quantity: 1 }],
        });

      expect(response.status).toBe(403);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).post('/orders').send({
        items: [{ productId: product1.id, quantity: 1 }],
      });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /orders', () => {
    beforeEach(async () => {
      // Customer 1 creates an order
      await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: product1.id, quantity: 1 }],
        });

      // Customer 2 creates an order
      await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          items: [{ productId: product2.id, quantity: 2 }],
        });
    });

    it('should return only customer orders for customer role', async () => {
      const response = await request(app)
        .get('/orders')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].items[0].productId).toBe(product1.id);
    });

    it('should return all orders for admin role', async () => {
      const response = await request(app)
        .get('/orders')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/orders');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /orders/:id/pay', () => {
    let orderId;

    beforeEach(async () => {
      const orderRes = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: product1.id, quantity: 1 }],
        });
      orderId = orderRes.body.data.id;
    });

    it('should pay order successfully', async () => {
      const response = await request(app)
        .post(`/orders/${orderId}/pay`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('paid');
    });

    it('should be idempotent - paying twice returns same result', async () => {
      await request(app)
        .post(`/orders/${orderId}/pay`)
        .set('Authorization', `Bearer ${customerToken}`);

      const response = await request(app)
        .post(`/orders/${orderId}/pay`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('paid');
    });

    it('should return 409 when paying cancelled order', async () => {
      await request(app)
        .post(`/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      const response = await request(app)
        .post(`/orders/${orderId}/pay`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('cancelled');
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      const response = await request(app)
        .post(`/orders/${fakeId}/pay`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).post(`/orders/${orderId}/pay`);
      expect(response.status).toBe(401);
    });
  });

  describe('POST /orders/:id/cancel', () => {
    let orderId;

    beforeEach(async () => {
      const orderRes = await request(app)
        .post('/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            { productId: product1.id, quantity: 2 },
            { productId: product2.id, quantity: 3 },
          ],
        });
      orderId = orderRes.body.data.id;
    });

    it('should cancel order successfully', async () => {
      const response = await request(app)
        .post(`/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('cancelled');
    });

    it('should restore stock when cancelling order', async () => {
      await request(app)
        .post(`/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      const productsRes = await request(app).get('/products');
      const p1 = productsRes.body.data.find(p => p.id === product1.id);
      const p2 = productsRes.body.data.find(p => p.id === product2.id);

      expect(p1.stock).toBe(10);
      expect(p2.stock).toBe(50);
    });

    it('should be idempotent - cancelling twice returns same result', async () => {
      await request(app)
        .post(`/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      const response = await request(app)
        .post(`/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('cancelled');
    });

    it('should allow cancelling paid orders', async () => {
      await request(app)
        .post(`/orders/${orderId}/pay`)
        .set('Authorization', `Bearer ${customerToken}`);

      const response = await request(app)
        .post(`/orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('cancelled');
    });

    it('should return 404 for non-existent order', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      const response = await request(app)
        .post(`/orders/${fakeId}/cancel`)
        .set('Authorization', `Bearer ${customerToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app).post(`/orders/${orderId}/cancel`);
      expect(response.status).toBe(401);
    });
  });
});