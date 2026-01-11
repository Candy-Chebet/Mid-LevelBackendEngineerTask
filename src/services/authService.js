const bcrypt = require('bcrypt');
const userRepository = require('../repositories/userRepository');
const { generateToken } = require('../utils/jwt');
const { ValidationError, UnauthorizedError, ConflictError } = require('../utils/errors');
const config = require('../config/env');
const logger = require('../utils/logger');

class AuthService {
  async register({ email, password, role = 'customer' }) {
    // Check if email already exists
    const emailExists = await userRepository.emailExists(email);
    if (emailExists) {
      throw new ConflictError('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, config.bcrypt.rounds);

    // Create user
    const user = await userRepository.create({
      email,
      passwordHash,
      role,
    });

    logger.info(`New user registered: ${user.email} (${user.role})`);

    // Generate token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async login({ email, password }) {
    // Find user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new UnauthorizedError('Invalid credentials');
    }

    logger.info(`User logged in: ${user.email}`);

    // Generate token
    const token = generateToken({
      userId: user._id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }
}

module.exports = new AuthService();