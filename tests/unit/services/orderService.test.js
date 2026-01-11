const orderService = require('../../../src/services/orderService');
const productService = require('../../../src/services/productService');
const authService = require('../../../src/services/authService');
const { NotFoundError, ValidationError, ConflictError } = require('../../../src/utils/errors');

describe('OrderService', () => {
  let customer;
  let product1;
  let product2;

  beforeEach(async () => {
    const result = await authService.register({
      email: 'customer@test.com',
      password: 'pass123',
    });
    customer = result.user;

    product1 = await productService.createProduct({
      name: 'Product 1',
      price: 1000,
      stock: 10,
    });

    product2 = await productService.createProduct({
      name: 'Product 2',
      price: 2000,
      stock: 5,
    });
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      const orderData = {
        items: [
          { productId: product1.id, quantity: 2 },
          { productId: product2.id, quantity: 1 },
        ],
      };

      const order = await orderService.createOrder(customer.id, orderData);

      expect(order).toHaveProperty('id');
      expect(order.userId).toBe(customer.id);
      expect(order.items).toHaveLength(2);
      expect(order.total).toBe(4000); // (1000 * 2) + (2000 * 1)
      expect(order.status).toBe('created');
    });

    it('should decrease stock when creating order', async () => {
      const orderData = {
        items: [{ productId: product1.id, quantity: 3 }],
      };

      await orderService.createOrder(customer.id, orderData);

      const products = await productService.getAllProducts();
      const updatedProduct = products.find(p => p.id === product1.id);
      expect(updatedProduct.stock).toBe(7); // 10 - 3
    });

    it('should throw NotFoundError for non-existent product', async () => {
      const orderData = {
        items: [{ productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 1 }],
      };

      await expect(
        orderService.createOrder(customer.id, orderData)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ValidationError for insufficient stock', async () => {
      const orderData = {
        items: [{ productId: product1.id, quantity: 100 }],
      };

      await expect(
        orderService.createOrder(customer.id, orderData)
      ).rejects.toThrow(ValidationError);
    });

    it('should rollback transaction if stock update fails', async () => {
      const orderData = {
        items: [
          { productId: product1.id, quantity: 5 },
          { productId: product2.id, quantity: 10 }, // Exceeds stock
        ],
      };

      await expect(
        orderService.createOrder(customer.id, orderData)
      ).rejects.toThrow(ValidationError);

      // Stock should not be decreased
      const products = await productService.getAllProducts();
      const p1 = products.find(p => p.id === product1.id);
      expect(p1.stock).toBe(10); // Original stock
    });
  });

  describe('payOrder', () => {
    it('should pay order successfully', async () => {
      const orderData = {
        items: [{ productId: product1.id, quantity: 1 }],
      };

      const order = await orderService.createOrder(customer.id, orderData);
      const paidOrder = await orderService.payOrder(order.id);

      expect(paidOrder.status).toBe('paid');
    });

    it('should be idempotent - paying twice returns same result', async () => {
      const orderData = {
        items: [{ productId: product1.id, quantity: 1 }],
      };

      const order = await orderService.createOrder(customer.id, orderData);
      await orderService.payOrder(order.id);
      const paidAgain = await orderService.payOrder(order.id);

      expect(paidAgain.status).toBe('paid');
    });

    it('should throw ConflictError when paying cancelled order', async () => {
      const orderData = {
        items: [{ productId: product1.id, quantity: 1 }],
      };

      const order = await orderService.createOrder(customer.id, orderData);
      await orderService.cancelOrder(order.id);

      await expect(orderService.payOrder(order.id)).rejects.toThrow(ConflictError);
    });

    it('should throw NotFoundError for non-existent order', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      await expect(orderService.payOrder(fakeId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('cancelOrder', () => {
    it('should cancel order and restore stock', async () => {
      const orderData = {
        items: [{ productId: product1.id, quantity: 3 }],
      };

      const order = await orderService.createOrder(customer.id, orderData);
      const cancelledOrder = await orderService.cancelOrder(order.id);

      expect(cancelledOrder.status).toBe('cancelled');

      // Stock should be restored
      const products = await productService.getAllProducts();
      const p1 = products.find(p => p.id === product1.id);
      expect(p1.stock).toBe(10); // Back to original
    });

    it('should be idempotent - cancelling twice returns same result', async () => {
      const orderData = {
        items: [{ productId: product1.id, quantity: 1 }],
      };

      const order = await orderService.createOrder(customer.id, orderData);
      await orderService.cancelOrder(order.id);
      const cancelledAgain = await orderService.cancelOrder(order.id);

      expect(cancelledAgain.status).toBe('cancelled');
    });

    it('should allow cancelling paid orders (refund scenario)', async () => {
      const orderData = {
        items: [{ productId: product1.id, quantity: 2 }],
      };

      const order = await orderService.createOrder(customer.id, orderData);
      await orderService.payOrder(order.id);
      const cancelled = await orderService.cancelOrder(order.id);

      expect(cancelled.status).toBe('cancelled');
    });
  });
});