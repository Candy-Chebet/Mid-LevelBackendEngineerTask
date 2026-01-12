// tests/unit/services/authService.test.js
const authService = require('../../../src/services/authService');
const userRepository = require('../../../src/repositories/userRepository');
const bcrypt = require('bcrypt');
const { generateToken } = require('../../../src/utils/jwt');
const { ConflictError, UnauthorizedError } = require('../../../src/utils/errors');

// Mock dependencies ⬇️
jest.mock('../../../src/repositories/userRepository');
jest.mock('bcrypt');
jest.mock('../../../src/utils/jwt');

describe('AuthService Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockUser = {
        _id: 'user-123',
        email: 'test@example.com',
        role: 'customer',
        createdAt: new Date(),
      };

      // Setup mocks
      userRepository.emailExists.mockResolvedValue(false);
      bcrypt.hash.mockResolvedValue('hashed_password');
      userRepository.create.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('mock_token');

      const result = await authService.register(userData);

      // Verify mocks were called correctly
      expect(userRepository.emailExists).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', expect.any(Number));
      expect(userRepository.create).toHaveBeenCalledWith({
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        role: 'customer',
      });

      // Verify result
      expect(result).toEqual({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          role: 'customer',
          createdAt: mockUser.createdAt,
        },
        token: 'mock_token',
      });
    });

    it('should throw ConflictError for duplicate email', async () => {
      userRepository.emailExists.mockResolvedValue(true);

      await expect(
        authService.register({
          email: 'duplicate@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(ConflictError);

      // Should not call create if email exists
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should register admin user when role is specified', async () => {
      const mockUser = {
        _id: 'admin-123',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: new Date(),
      };

      userRepository.emailExists.mockResolvedValue(false);
      bcrypt.hash.mockResolvedValue('hashed_password');
      userRepository.create.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('admin_token');

      const result = await authService.register({
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
      });

      expect(result.user.role).toBe('admin');
      expect(userRepository.create).toHaveBeenCalledWith({
        email: 'admin@example.com',
        passwordHash: 'hashed_password',
        role: 'admin',
      });
    });
  });

  describe('login', () => {
    it('should successfully login with correct credentials', async () => {
      const mockUser = {
        _id: 'user-123',
        email: 'login@example.com',
        passwordHash: 'hashed_password',
        role: 'customer',
        createdAt: new Date(),
      };

      userRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      generateToken.mockReturnValue('login_token');

      const result = await authService.login({
        email: 'login@example.com',
        password: 'password123',
      });

      expect(userRepository.findByEmail).toHaveBeenCalledWith('login@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed_password');
      expect(result.token).toBe('login_token');
    });

    it('should throw UnauthorizedError for non-existent user', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(UnauthorizedError);

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedError for incorrect password', async () => {
      const mockUser = {
        _id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
      };

      userRepository.findByEmail.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow(UnauthorizedError);

      expect(generateToken).not.toHaveBeenCalled();
    });
  });
});