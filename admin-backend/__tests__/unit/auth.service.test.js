const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authService = require('../../src/modules/auth/services/authService');

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Service', () => {
  let mockConfig;
  let mockLogger;
  let mockModel;
  let mockUserAccessModel;
  let service;

  beforeEach(() => {
    mockConfig = {
      auth: {
        jwtSecret: 'test-secret',
        jwtExpiresIn: '1h',
      },
    };
    mockLogger = {
      debug: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    };
    mockModel = {
      getByEmail: jest.fn(),
      getUserTypeById: jest.fn(),
    };
    mockUserAccessModel = {
      getModulesByUserId: jest.fn(),
    };
    service = authService(mockConfig, mockLogger, mockModel, mockUserAccessModel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const user = {
        user_id: 1,
        email: 'test@example.com',
        user_password: 'hashedpassword',
        first_name: 'John',
        last_name: 'Doe',
        user_typeid: 1,
      };
      const userType = { user_type_name: 'Superadmin' };
      const userAccessData = [{ admin_module_id: 1 }];
      const modulePermissions = [1];
      mockModel.getByEmail.mockResolvedValue(user);
      mockModel.getUserTypeById.mockResolvedValue(userType);
      mockUserAccessModel.getModulesByUserId.mockResolvedValue(userAccessData);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('token123');

      const result = await service.login('test@example.com', 'password123');

      expect(mockModel.getByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockModel.getUserTypeById).toHaveBeenCalledWith(1);
      expect(mockUserAccessModel.getModulesByUserId).toHaveBeenCalledWith(1);
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(jwt.sign).toHaveBeenCalledWith(
        { user_id: 1, email: 'test@example.com', user_typeid: 1, user_type_name: 'Superadmin', module_permissions: modulePermissions },
        'test-secret',
        { expiresIn: '1h' }
      );
      expect(result).toEqual({
        token: 'token123',
        user: {
          user_id: 1,
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          user_type_name: 'Superadmin',
        },
      });
    });

    it('should throw error when email is missing', async () => {
      await expect(service.login('', 'password')).rejects.toThrow('Email and password are required');
    });

    it('should throw error when password is missing', async () => {
      await expect(service.login('test@example.com', '')).rejects.toThrow('Email and password are required');
    });

    it('should throw error when user not found', async () => {
      mockModel.getByEmail.mockResolvedValue(null);

      await expect(service.login('notfound@example.com', 'password')).rejects.toThrow('Invalid email or password');
    });

    it('should throw error when password is invalid', async () => {
      const user = { user_id: 1, email: 'test@example.com', user_password: 'hashedpassword' };
      mockModel.getByEmail.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);

      await expect(service.login('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid email or password');
    });

    it('should throw error when database error occurs', async () => {
      mockModel.getByEmail.mockRejectedValue(new Error('DB error'));

      await expect(service.login('test@example.com', 'password')).rejects.toThrow('DB error');
    });
  });
});