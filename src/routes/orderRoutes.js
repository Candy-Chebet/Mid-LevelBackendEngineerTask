const express = require('express');
const orderController = require('../controllers/orderController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { createOrderSchema } = require('../validators/orderValidators');

const router = express.Router();

router.post('/', authenticate, requireRole('customer'), validate(createOrderSchema), orderController.createOrder);
router.get('/', authenticate, orderController.getOrders);
router.post('/:id/pay', authenticate, orderController.payOrder);
router.post('/:id/cancel', authenticate, orderController.cancelOrder);

module.exports = router;