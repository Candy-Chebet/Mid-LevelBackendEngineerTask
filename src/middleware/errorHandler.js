const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  let error = err;

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(e => e.message).join(', ');
    error = new AppError(400, message);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    error = new AppError(409, `${field} already exists`);
  }

  // Mongoose cast error (invalid ID format)
  if (err.name === 'CastError') {
    error = new AppError(400, `Invalid ${err.path}: ${err.value}`);
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  // Log error
  if (statusCode >= 500) {
    logger.error('Server error:', {
      message: error.message,
      stack: error.stack,
      url: req.url,
      method: req.method,
    });
  } else {
    logger.warn('Client error:', {
      message: error.message,
      url: req.url,
      method: req.method,
    });
  }

  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

module.exports = errorHandler;