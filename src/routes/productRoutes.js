const express = require('express');
const productController = require('../controllers/productController');
const { authenticate, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { createProductSchema, updateProductSchema } = require('../validators/productValidators');

const router = express.Router();

router.get('/', productController.getAllProducts);
router.post('/', authenticate, requireRole('admin'), validate(createProductSchema), productController.createProduct);
router.patch('/:id', authenticate, requireRole('admin'), validate(updateProductSchema), productController.updateProduct);

module.exports = router;