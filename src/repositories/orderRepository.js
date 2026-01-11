const Order = require('../models/Order');

class OrderRepository {
  async create(orderData, session) {
    const order = new Order(orderData);
    return await order.save({ session });
  }

  async findAll() {
    return await Order.find().sort({ createdAt: -1 });
  }

  async findByUserId(userId) {
    return await Order.find({ userId }).sort({ createdAt: -1 });
  }

  async findById(id) {
    return await Order.findById(id);
  }

  async updateStatus(id, status, session) {
    return await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, session }
    );
  }
}

module.exports = new OrderRepository();