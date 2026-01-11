const mongoose = require('mongoose');
const { v4 } = require('uuid');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => v4(),
  },
  userId: {
    type: String,
    required: true,
  },
  items: [orderItemSchema],
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['created', 'paid', 'cancelled'],
    default: 'created',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);