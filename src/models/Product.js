const mongoose = require('mongoose');
const { v4 } = require('uuid');

const productSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => v4(),
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

productSchema.index({ name: 1 });

module.exports = mongoose.model('Product', productSchema);