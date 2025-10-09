const usersController = require('../../src/controllers/UserRole');

describe('Users Controller', () => {
  let mockService;
  let mockLogger;
  let controller;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockService = {
      getAllUsers: jest.fn(),
      getUserById: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
      getUserTypes: jest.fn(),
      getActiveModules: jest.fn(),
      getModulesByUserId: jest.fn(),
      updateUserModules: jest.fn(),
      createAuditLog: jest.fn(),
    };
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    };
    controller = usersController(mockService, mockLogger);

    mockReq = {
      query: {},
      params: {},
      body: {},
      user: { user_id: 1 },
      get: jest.fn(),
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUsers', () => {
    it('should return users successfully', async () => {
      mockReq.query = { page: '1', limit: '10' };
      const usersData = { users: [], total: 0 };
      mockService.getAllUsers.mockResolvedValue(usersData);

      await controller.getUsers(mockReq, mockRes);

      expect(mockService.getAllUsers).toHaveBeenCalledWith(1, 10);
      expect(mockRes.json).toHaveBeenCalledWith({ ...usersData, page: 1, limit: 10 });
    });
  });

  describe('getUser', () => {
    it('should return user successfully', async () => {
      mockReq.params.id = '1';
      const user = { user_id: 1 };
      mockService.getUserById.mockResolvedValue(user);

      await controller.getUser(mockReq, mockRes);

      expect(mockService.getUserById).toHaveBeenCalledWith('1');
      expect(mockRes.json).toHaveBeenCalledWith(user);
    });

    it('should return 404 if user not found', async () => {
      mockService.getUserById.mockResolvedValue(null);

      await controller.getUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      mockReq.body = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        user_password: 'password123',
        confirm_password: 'password123',
        user_type_id: 1,
      };
      const createdUser = { user_id: 1 };
      mockService.createUser.mockResolvedValue(createdUser);

      await controller.createUser(mockReq, mockRes);

      expect(mockService.createUser).toHaveBeenCalledWith(mockReq.body, 1);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(createdUser);
    });

    it('should return 400 for validation error', async () => {
      mockReq.body = { first_name: 'John' };

      await controller.createUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: '"last_name" is required' });
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      mockReq.params.id = '1';
      mockReq.body = { first_name: 'Jane' };
      const updatedUser = { user_id: 1, first_name: 'Jane' };
      mockService.updateUser.mockResolvedValue(updatedUser);

      await controller.updateUser(mockReq, mockRes);

      expect(mockService.updateUser).toHaveBeenCalledWith('1', mockReq.body, 1);
      expect(mockRes.json).toHaveBeenCalledWith(updatedUser);
    });

    it('should return 404 if user not found', async () => {
      mockService.updateUser.mockResolvedValue(null);

      await controller.updateUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not found' });
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockReq.params.id = '1';
      const deletedUser = { user_id: 1 };
      mockService.deleteUser.mockResolvedValue(deletedUser);

      await controller.deleteUser(mockReq, mockRes);

      expect(mockService.deleteUser).toHaveBeenCalledWith('1');
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
    });
  });

  describe('getUserTypes', () => {
    it('should return user types', async () => {
      const types = [{ id: 1 }];
      mockService.getUserTypes.mockResolvedValue(types);

      await controller.getUserTypes(mockReq, mockRes);

      expect(mockService.getUserTypes).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(types);
    });
  });

  describe('getModules', () => {
    it('should return modules', async () => {
      const modules = [{ id: 1 }];
      mockService.getActiveModules.mockResolvedValue(modules);

      await controller.getModules(mockReq, mockRes);

      expect(mockService.getActiveModules).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(modules);
    });
  });

  describe('getUserModules', () => {
    it('should return user modules', async () => {
      mockReq.params.id = '1';
      const modules = [{ admin_module_id: 1 }];
      mockService.getModulesByUserId.mockResolvedValue(modules);

      await controller.getUserModules(mockReq, mockRes);

      expect(mockService.getModulesByUserId).toHaveBeenCalledWith('1');
      expect(mockRes.json).toHaveBeenCalledWith({ modules: [1] });
    });
  });

  describe('updateUserModules', () => {
    it('should update user modules', async () => {
      mockReq.params.id = '1';
      mockReq.body.modules = [1, 2];
      mockService.updateUserModules.mockResolvedValue({});

      await controller.updateUserModules(mockReq, mockRes);

      expect(mockService.updateUserModules).toHaveBeenCalledWith('1', [1, 2], 1);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User modules updated successfully' });
    });

    it('should return 400 if modules not array', async () => {
      mockReq.body.modules = 'notarray';

      await controller.updateUserModules(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Modules must be an array of admin_module_ids' });
    });
  });
});