const bcrypt = require('bcryptjs');
const userService = require('../../src/modules/users/services/userService');

jest.mock('bcryptjs');

describe('User Service', () => {
  let mockConfig;
  let mockLogger;
  let mockModels;
  let service;

  beforeEach(() => {
    mockConfig = {};
    mockLogger = {
      debug: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    };
    mockModels = {
      user: {
        createUser: jest.fn(),
        getAllUsers: jest.fn(),
        getUserById: jest.fn(),
        updateUser: jest.fn(),
        deleteUser: jest.fn(),
      },
      userType: {
        getAll: jest.fn(),
      },
      adminModule: {
        getActiveModules: jest.fn(),
      },
      userAccess: {
        getModulesByUserId: jest.fn(),
        updateUserModules: jest.fn(),
      },
    };
    service = userService(mockConfig, mockLogger, mockModels);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        user_password: 'password',
        confirm_password: 'password',
        user_type_id: 1,
        address: '123 Main St',
      };
      const createdUser = { user_id: 1 };
      mockModels.user.createUser.mockResolvedValue(createdUser);

      const result = await service.createUser(userData, 1);

      expect(mockModels.user.createUser).toHaveBeenCalledWith(userData);
      expect(result).toEqual(createdUser);
    });

    it('should throw error for missing fields', async () => {
      const userData = { first_name: 'John' };

      await expect(service.createUser(userData, 1)).rejects.toThrow('Required fields missing');
    });

    it('should throw error for password mismatch', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        user_password: 'password',
        confirm_password: 'different',
        user_type_id: 1,
        address: '123 Main St',
      };

      await expect(service.createUser(userData, 1)).rejects.toThrow('Passwords do not match');
    });

    it('should throw error for missing address', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        user_password: 'password',
        confirm_password: 'password',
        user_type_id: 1,
        // address missing
      };

      await expect(service.createUser(userData, 1)).rejects.toThrow('Address is required and cannot be empty');
    });

    it('should throw error for empty address', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        user_password: 'password',
        confirm_password: 'password',
        user_type_id: 1,
        address: '',
      };

      await expect(service.createUser(userData, 1)).rejects.toThrow('Address is required and cannot be empty');
    });

    it('should throw error for whitespace address', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        user_password: 'password',
        confirm_password: 'password',
        user_type_id: 1,
        address: '   ',
      };

      await expect(service.createUser(userData, 1)).rejects.toThrow('Address is required and cannot be empty');
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const users = { users: [], total: 0 };
      mockModels.user.getAllUsers.mockResolvedValue(users);

      const result = await service.getAllUsers(1, 10);

      expect(mockModels.user.getAllUsers).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(users);
    });
  });

  describe('getUserById', () => {
    it('should return user by id', async () => {
      const user = { user_id: 1 };
      mockModels.user.getUserById.mockResolvedValue(user);

      const result = await service.getUserById(1);

      expect(result).toEqual(user);
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userData = { first_name: 'Jane' };
      const updatedUser = { user_id: 1, first_name: 'Jane' };
      mockModels.user.updateUser.mockResolvedValue(updatedUser);

      const result = await service.updateUser(1, userData, 1);

      expect(result).toEqual(updatedUser);
    });

    it('should throw error for password mismatch', async () => {
      const userData = { user_password: 'newpass', confirm_password: 'different' };

      await expect(service.updateUser(1, userData, 1)).rejects.toThrow('Passwords do not match');
    });
  });

  describe('deleteUser', () => {
    it('should delete user', async () => {
      const deletedUser = { user_id: 1, is_active: false };
      mockModels.user.deleteUser.mockResolvedValue(deletedUser);

      const result = await service.deleteUser(1);

      expect(result).toEqual(deletedUser);
    });
  });

  describe('getUserTypes', () => {
    it('should return user types', async () => {
      const types = [{ id: 1 }];
      mockModels.userType.getAll.mockResolvedValue(types);

      const result = await service.getUserTypes();

      expect(result).toEqual(types);
    });
  });

  describe('getActiveModules', () => {
    it('should return active modules', async () => {
      const modules = [{ id: 1 }];
      mockModels.adminModule.getActiveModules.mockResolvedValue(modules);

      const result = await service.getActiveModules();

      expect(result).toEqual(modules);
    });
  });

  describe('getModulesByUserId', () => {
    it('should return modules for user', async () => {
      const modules = [{ admin_module_id: 1 }];
      mockModels.userAccess.getModulesByUserId.mockResolvedValue(modules);

      const result = await service.getModulesByUserId(1);

      expect(result).toEqual(modules);
    });
  });

  describe('updateUserModules', () => {
    it('should update user modules', async () => {
      const modules = [1, 2];
      mockModels.userAccess.updateUserModules.mockResolvedValue({});

      const result = await service.updateUserModules(1, modules, 1);

      expect(mockModels.userAccess.updateUserModules).toHaveBeenCalledWith(1, modules, 1);
      expect(result).toEqual({});
    });
  });
});