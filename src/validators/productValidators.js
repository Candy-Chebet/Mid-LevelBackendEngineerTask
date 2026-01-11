const { z } = require('zod');

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').trim(),
  price: z.number().int().min(0, 'Price must be a non-negative integer'),
  stock: z.number().int().min(0, 'Stock must be a non-negative integer'),
});

const updateProductSchema = z.object({
  name: z.string().min(1).trim().optional(),
  price: z.number().int().min(0).optional(),
  stock: z.number().int().min(0).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

module.exports = {
  createProductSchema,
  updateProductSchema,
};