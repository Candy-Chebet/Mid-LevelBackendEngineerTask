const orderService = require('../services/orderService');

class OrderController {
  async createOrder(req, res, next) {
    try {
      const order = await orderService.createOrder(req.user.userId, req.body);
      res.status(201).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrders(req, res, next) {
    try {
      const orders = await orderService.getOrders(req.user.userId, req.user.role);
      res.status(200).json({
        status: 'success',
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  async payOrder(req, res, next) {
    try {
      const order = await orderService.payOrder(req.params.id);
      res.status(200).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelOrder(req, res, next) {
    try {
      const order = await orderService.cancelOrder(req.params.id);
      res.status(200).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();