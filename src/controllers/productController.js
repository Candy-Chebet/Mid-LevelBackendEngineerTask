const productService = require('../services/productService');

class ProductController {
  async createProduct(req, res, next) {
    try {
      const product = await productService.createProduct(req.body);
      res.status(201).json({
        status: 'success',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllProducts(req, res, next) {
    try {
      const products = await productService.getAllProducts();
      res.status(200).json({
        status: 'success',
        data: products,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      res.status(200).json({
        status: 'success',
        data: product,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();