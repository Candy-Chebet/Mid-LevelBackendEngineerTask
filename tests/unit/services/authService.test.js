const authService = require('../../../src/services/authService');
const userRepository = require('../../../src/repositories/userRepository');
const { ConflictError, UnauthorizedError } = require('../../../src/utils/errors');

describe('AuthService', () => {
  describe('register', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authService.register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.role).toBe('customer');
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('should register admin user when role is specified', async () => {
      const userData = {
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin',
      };

      const result = await authService.register(userData);

      expect(result.user.role).toBe('admin');
    });

    it('should throw ConflictError for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
      };

      await authService.register(userData);

      await expect(authService.register(userData)).rejects.toThrow(ConflictError);
    });

    it('should hash the password', async () => {
      const userData = {
        email: 'test2@example.com',
        password: 'password123',
      };

      await authService.register(userData);

      const user = await userRepository.findByEmail(userData.email);
      expect(user.passwordHash).not.toBe(userData.password);
      expect(user.passwordHash).toHaveLength(60);
    });
  });

  describe('login', () => {
    it('should successfully login with correct credentials', async () => {
      const userData = {
        email: 'login@example.com',
        password: 'password123',
      };

      await authService.register(userData);
      const result = await authService.login(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(userData.email);
    });

    it('should throw UnauthorizedError for non-existent user', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      await expect(authService.login(credentials)).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for incorrect password', async () => {
      const userData = {
        email: 'wrongpass@example.com',
        password: 'password123',
      };

      await authService.register(userData);

      const wrongCredentials = {
        email: userData.email,
        password: 'wrongpassword',
      };

      await expect(authService.login(wrongCredentials)).rejects.toThrow(UnauthorizedError);
    });
  });
});