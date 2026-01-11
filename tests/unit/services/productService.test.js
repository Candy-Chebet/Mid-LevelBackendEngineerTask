const productService = require('../../../src/services/productService');
const { NotFoundError } = require('../../../src/utils/errors');

describe('ProductService', () => {
  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      const productData = {
        name: 'Test Product',
        price: 1999,
        stock: 100,
      };

      const product = await productService.createProduct(productData);

      expect(product).toHaveProperty('id');
      expect(product.name).toBe(productData.name);
      expect(product.price).toBe(productData.price);
      expect(product.stock).toBe(productData.stock);
      expect(product).toHaveProperty('createdAt');
    });
  });

  describe('getAllProducts', () => {
    it('should return empty array when no products exist', async () => {
      const products = await productService.getAllProducts();
      expect(products).toEqual([]);
    });

    it('should return all products', async () => {
      await productService.createProduct({ name: 'Product 1', price: 100, stock: 10 });
      await productService.createProduct({ name: 'Product 2', price: 200, stock: 20 });

      const products = await productService.getAllProducts();

      expect(products).toHaveLength(2);
      expect(products[0].name).toBe('Product 2'); // Most recent first
      expect(products[1].name).toBe('Product 1');
    });
  });

  describe('updateProduct', () => {
    it('should update product successfully', async () => {
      const product = await productService.createProduct({
        name: 'Original',
        price: 100,
        stock: 10,
      });

      const updated = await productService.updateProduct(product.id, {
        name: 'Updated',
        price: 200,
      });

      expect(updated.name).toBe('Updated');
      expect(updated.price).toBe(200);
      expect(updated.stock).toBe(10);
    });

    it('should throw NotFoundError for non-existent product', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';

      await expect(
        productService.updateProduct(fakeId, { name: 'Updated' })
      ).rejects.toThrow(NotFoundError);
    });
  });
});