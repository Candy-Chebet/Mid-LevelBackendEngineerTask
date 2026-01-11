const productRepository = require('../repositories/productRepository');
const { NotFoundError } = require('../utils/errors');
const logger = require('../utils/logger');

class ProductService {
  async createProduct(productData) {
    const product = await productRepository.create(productData);
    logger.info(`Product created: ${product._id} - ${product.name}`);
    
    return {
      id: product._id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      createdAt: product.createdAt,
    };
  }

  async getAllProducts() {
    const products = await productRepository.findAll();
    return products.map(p => ({
      id: p._id,
      name: p.name,
      price: p.price,
      stock: p.stock,
      createdAt: p.createdAt,
    }));
  }

  async updateProduct(id, updateData) {
    const product = await productRepository.update(id, updateData);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    logger.info(`Product updated: ${product._id}`);

    return {
      id: product._id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      createdAt: product.createdAt,
    };
  }
}

module.exports = new ProductService();