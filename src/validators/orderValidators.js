const { z } = require('zod');

const orderItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
});

const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
});

module.exports = {
  createOrderSchema,
};