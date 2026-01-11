const { ValidationError } = require('../utils/errors');

const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error.name === 'ZodError') {
        // ✅ FIX: Handle Zod errors properly
        const message = error.errors
          ? error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          : error.message;
        next(new ValidationError(message));
      } else {
        next(error);
      }
    }
  };
};

module.exports = { validate };