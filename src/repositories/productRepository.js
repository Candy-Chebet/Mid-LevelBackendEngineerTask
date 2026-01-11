const Product = require('../models/Product');

class ProductRepository {
  async create(productData) {
    const product = new Product(productData);
    return await product.save();
  }

  async findAll() {
    return await Product.find().sort({ createdAt: -1 });
  }

  async findById(id) {
    return await Product.findById(id);
  }

  async findByIds(ids) {
    return await Product.find({ _id: { $in: ids } });
  }

  async update(id, updateData) {
    return await Product.findByIdAndUpdate(id, updateData, { 
      new: true,
      runValidators: true 
    });
  }

  async decreaseStock(productId, quantity, session) {
    const result = await Product.findOneAndUpdate(
      { _id: productId, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } },
      { new: true, session }
    );
    return result;
  }

  async increaseStock(productId, quantity, session) {
    return await Product.findByIdAndUpdate(
      productId,
      { $inc: { stock: quantity } },
      { new: true, session }
    );
  }
}

module.exports = new ProductRepository();