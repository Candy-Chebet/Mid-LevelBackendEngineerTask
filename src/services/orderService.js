const mongoose = require('mongoose');
const orderRepository = require('../repositories/orderRepository');
const productRepository = require('../repositories/productRepository');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');
const logger = require('../utils/logger');

class OrderService {
  async createOrder(userId, { items }) {
  
  try {
    // Get all unique product IDs
    const productIds = [...new Set(items.map(item => item.productId))];

    // Fetch all products
    const products = await productRepository.findByIds(productIds);

    // Validate all products exist
    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p._id);
      const missingIds = productIds.filter(id => !foundIds.includes(id));
      throw new NotFoundError(`Products not found: ${missingIds.join(', ')}`);
    }

    // Create product map for easy lookup
    const productMap = {};
    products.forEach(p => {
      productMap[p._id] = p;
    });

    // Validate stock and prepare order items
    const orderItems = [];
    let total = 0;

    for (const item of items) {
      const product = productMap[item.productId];

      // Validate stock availability
      if (product.stock < item.quantity) {
        throw new ValidationError(
          `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
        );
      }

      // Decrease stock (NO SESSION - pass null)
      const updatedProduct = await productRepository.decreaseStock(
        item.productId,
        item.quantity,
        null
      );

      if (!updatedProduct) {
        throw new ValidationError(
          `Failed to reserve stock for product ${product.name}. Please try again.`
        );
      }

      // Prepare order item with current price
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
      });

      total += product.price * item.quantity;
    }

    // Create order (NO SESSION - pass null)
    const order = await orderRepository.create({
      userId,
      items: orderItems,
      total,
      status: 'created',
    }, null);

    logger.info(`Order created: ${order._id} for user ${userId}, total: ${total}`);

    return {
      id: order._id,
      userId: order.userId,
      items: order.items,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
    };
  } catch (error) {
    throw error;
  }
}

  async getOrders(userId, role) {
    let orders;
    
    if (role === 'admin') {
      orders = await orderRepository.findAll();
    } else {
      orders = await orderRepository.findByUserId(userId);
    }

    return orders.map(o => ({
      id: o._id,
      userId: o.userId,
      items: o.items,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
    }));
  }

  async payOrder(orderId) {
    const order = await orderRepository.findById(orderId);
    
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    //if already paid, return success
    if (order.status === 'paid') {
      logger.info(`Order ${orderId} already paid (idempotent)`);
      return {
        id: order._id,
        userId: order.userId,
        items: order.items,
        total: order.total,
        status: order.status,
        createdAt: order.createdAt,
      };
    }

    // Cannot pay cancelled order
    if (order.status === 'cancelled') {
      throw new ConflictError('Cannot pay a cancelled order');
    }

    const updatedOrder = await orderRepository.updateStatus(orderId, 'paid', null);

    logger.info(`Order ${orderId} paid successfully`);

    return {
      id: updatedOrder._id,
      userId: updatedOrder.userId,
      items: updatedOrder.items,
      total: updatedOrder.total,
      status: updatedOrder.status,
      createdAt: updatedOrder.createdAt,
    };
  }

  async cancelOrder(orderId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const order = await orderRepository.findById(orderId);
      
      if (!order) {
        throw new NotFoundError('Order not found');
      }

      // if already cancelled, return success
      if (order.status === 'cancelled') {
        await session.commitTransaction();
        logger.info(`Order ${orderId} already cancelled (idempotent)`);
        return {
          id: order._id,
          userId: order.userId,
          items: order.items,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt,
        };
      }

      // Allow cancellation of paid orders
      if (order.status === 'paid') {
        logger.warn(`Cancelling paid order ${orderId} - refund may be required`);
      }

      // Restore stock for all items
      for (const item of order.items) {
        await productRepository.increaseStock(
          item.productId,
          item.quantity,
          session
        );
      }

      // Update order status
      const updatedOrder = await orderRepository.updateStatus(orderId, 'cancelled', session);

      await session.commitTransaction();

      logger.info(`Order ${orderId} cancelled, stock restored`);

      return {
        id: updatedOrder._id,
        userId: updatedOrder.userId,
        items: updatedOrder.items,
        total: updatedOrder.total,
        status: updatedOrder.status,
        createdAt: updatedOrder.createdAt,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}

module.exports = new OrderService();