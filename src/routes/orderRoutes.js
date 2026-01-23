const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { createOrderSchema } = require('../validators/orderValidators');

const router = express.Router();

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     description: Create a new order (Customer only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *             properties:
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - quantity
 *                   properties:
 *                     productId:
 *                       type: string
 *                       format: uuid
 *                       example: 660e8400-e29b-41d4-a716-446655440001
 *                     quantity:
 *                       type: integer
 *                       minimum: 1
 *                       example: 2
 *     responses:
 *       201:
 *         description: Order successfully created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 770e8400-e29b-41d4-a716-446655440003
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                       example: 550e8400-e29b-41d4-a716-446655440000
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: string
 *                             format: uuid
 *                             example: 660e8400-e29b-41d4-a716-446655440001
 *                           quantity:
 *                             type: integer
 *                             example: 2
 *                           unitPrice:
 *                             type: number
 *                             example: 99999
 *                     total:
 *                       type: number
 *                       example: 202997
 *                     status:
 *                       type: string
 *                       example: created
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-11T10:30:00.000Z
 *       400:
 *         description: Bad Request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Quantity must be greater than 0
 *             examples:
 *               emptyItems:
 *                 value:
 *                   status: error
 *                   message: Items array cannot be empty
 *               invalidQuantity:
 *                 value:
 *                   status: error
 *                   message: Quantity must be greater than 0
 *               invalidProductId:
 *                 value:
 *                   status: error
 *                   message: Invalid product ID format
 *               insufficientStock:
 *                 value:
 *                   status: error
 *                   message: Insufficient stock for requested quantity
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: No token provided
 *       403:
 *         description: Forbidden - User is not a customer
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Access denied. Customer only.
 *       404:
 *         description: Not Found - One or more products don't exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Product not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Server error occurred
 */
router.post('/', authenticate, requireRole('customer'), validate(createOrderSchema), orderController.createOrder);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     description: Get all orders (customers see only their orders, admins see all orders)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved orders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: 770e8400-e29b-41d4-a716-446655440003
 *                       userId:
 *                         type: string
 *                         format: uuid
 *                         example: 550e8400-e29b-41d4-a716-446655440000
 *                       items:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             productId:
 *                               type: string
 *                               format: uuid
 *                               example: 660e8400-e29b-41d4-a716-446655440001
 *                             quantity:
 *                               type: integer
 *                               example: 2
 *                             unitPrice:
 *                               type: number
 *                               example: 99999
 *                       total:
 *                         type: number
 *                         example: 202997
 *                       status:
 *                         type: string
 *                         enum: [created, paid, cancelled]
 *                         example: created
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: 2024-01-11T10:30:00.000Z
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: No token provided
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Server error occurred
 */
router.get('/', authenticate, orderController.getOrders);

/**
 * @swagger
 * /orders/{id}/pay:
 *   post:
 *     summary: Pay for an order
 *     description: Mark an order as paid (idempotent - returns current state if already paid)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID
 *         example: 770e8400-e29b-41d4-a716-446655440003
 *     responses:
 *       200:
 *         description: Order successfully paid (or already paid)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 770e8400-e29b-41d4-a716-446655440003
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                       example: 550e8400-e29b-41d4-a716-446655440000
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: string
 *                             format: uuid
 *                             example: 660e8400-e29b-41d4-a716-446655440001
 *                           quantity:
 *                             type: integer
 *                             example: 2
 *                           unitPrice:
 *                             type: number
 *                             example: 99999
 *                     total:
 *                       type: number
 *                       example: 202997
 *                     status:
 *                       type: string
 *                       example: paid
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-11T10:30:00.000Z
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: No token provided
 *       403:
 *         description: Forbidden - Cannot pay another user's order
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Access denied
 *       404:
 *         description: Not Found - Order doesn't exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Order not found
 *       409:
 *         description: Conflict - Cannot pay a cancelled order
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Cannot pay a cancelled order
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Server error occurred
 */
router.post('/:id/pay', authenticate, orderController.payOrder);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   post:
 *     summary: Cancel an order
 *     description: Cancel an order and restore product stock (idempotent - returns current state if already cancelled)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Order ID
 *         example: 770e8400-e29b-41d4-a716-446655440003
 *     responses:
 *       200:
 *         description: Order successfully cancelled (or already cancelled). Stock restored atomically.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: 770e8400-e29b-41d4-a716-446655440003
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                       example: 550e8400-e29b-41d4-a716-446655440000
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productId:
 *                             type: string
 *                             format: uuid
 *                             example: 660e8400-e29b-41d4-a716-446655440001
 *                           quantity:
 *                             type: integer
 *                             example: 2
 *                           unitPrice:
 *                             type: number
 *                             example: 99999
 *                     total:
 *                       type: number
 *                       example: 202997
 *                     status:
 *                       type: string
 *                       example: cancelled
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: 2024-01-11T10:30:00.000Z
 *       401:
 *         description: Unauthorized - No token provided or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: No token provided
 *       403:
 *         description: Forbidden - Cannot cancel another user's order
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Access denied
 *       404:
 *         description: Not Found - Order doesn't exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Order not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Server error occurred
 */

router.post('/:id/cancel', authenticate, orderController.cancelOrder);

module.exports = router;