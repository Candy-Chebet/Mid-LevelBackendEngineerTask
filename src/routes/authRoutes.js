const express = require('express');
const authController = require('../controllers/authController');
const { validate } = require('../middleware/validation');
const { registerSchema, loginSchema } = require('../validators/authValidators');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);

module.exports = router;