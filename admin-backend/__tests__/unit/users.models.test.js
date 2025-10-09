const userModel = require('../../src/models/UserRole/AdminUsers');
const adminModuleModel = require('../../src/models/UserRole/ManageModules');
const userAccessModel = require('../../src/models/UserRole/RolesPermissions');
const userTypeModel = require('../../src/models/UserRole/RolesPermissions');

describe('Users Models', () => {
  let mockDb;
  let user, adminModule, userAccess, userType;

  beforeEach(() => {
    mockDb = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      adminModule: {
        findMany: jest.fn(),
      },
      userAccess: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
        createMany: jest.fn(),
      },
      userType: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    user = userModel(mockDb);
    adminModule = adminModuleModel(mockDb);
    userAccess = userAccessModel(mockDb);
    userType = userTypeModel(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('User Model', () => {
    describe('createUser', () => {
      it('should create user successfully', async () => {
        const userData = {
          first_name: 'John',
          last_name: 'Doe',
          user_type_id: 1,
          email: 'john@example.com',
          user_password: 'password',
          modules: [1, 2],
        };
        const createdUser = { user_id: 1, ...userData };
        mockDb.user.findUnique.mockResolvedValue(null);
        mockDb.user.create.mockResolvedValue(createdUser);
        mockDb.userAccess.createMany.mockResolvedValue({});

        const result = await user.createUser(userData, 1);

        expect(mockDb.user.findUnique).toHaveBeenCalledWith({ where: { email: 'john@example.com' } });
        expect(mockDb.user.create).toHaveBeenCalled();
        expect(result).toEqual(createdUser);
      });

      it('should throw error if email exists', async () => {
        mockDb.user.findUnique.mockResolvedValue({ user_id: 2 });

        await expect(user.createUser({ email: 'existing@example.com' }, 1)).rejects.toThrow('Email already exists');
      });
    });

    describe('getAllUsers', () => {
      it('should return users with pagination', async () => {
        const users = [{ user_id: 1 }];
        mockDb.user.findMany.mockResolvedValue(users);
        mockDb.user.count.mockResolvedValue(1);

        const result = await user.getAllUsers(1, 10);

        expect(result).toEqual({ users, total: 1 });
      });
    });

    describe('getUserById', () => {
      it('should return user by id', async () => {
        const mockUser = { user_id: 1 };
        mockDb.user.findUnique.mockResolvedValue(mockUser);

        const result = await user.getUserById(1);

        expect(mockDb.user.findUnique).toHaveBeenCalledWith({
          where: { user_id: 1 },
          include: { user_type: true },
        });
        expect(result).toEqual(mockUser);
      });
    });

    describe('updateUser', () => {
      it('should update user successfully', async () => {
        const userData = { first_name: 'Jane' };
        const updatedUser = { user_id: 1, first_name: 'Jane' };
        mockDb.user.findUnique.mockResolvedValue(null);
        mockDb.user.update.mockResolvedValue(updatedUser);

        const result = await user.updateUser(1, userData, 1);

        expect(result).toEqual(updatedUser);
      });
    });

    describe('deleteUser', () => {
      it('should soft delete user', async () => {
        const deletedUser = { user_id: 1, is_active: false };
        mockDb.user.update.mockResolvedValue(deletedUser);

        const result = await user.deleteUser(1);

        expect(mockDb.user.update).toHaveBeenCalledWith({
          where: { user_id: 1 },
          data: { is_active: false },
        });
        expect(result).toEqual(deletedUser);
      });
    });

    describe('getByEmail', () => {
      it('should return user by email', async () => {
        const mockUser = { email: 'test@example.com' };
        mockDb.user.findUnique.mockResolvedValue(mockUser);

        const result = await user.getByEmail('test@example.com');

        expect(result).toEqual(mockUser);
      });
    });
  });

  describe('AdminModule Model', () => {
    describe('getActiveModules', () => {
      it('should return active modules', async () => {
        const modules = [{ id: 1, name: 'Module1' }];
        mockDb.adminModule.findMany.mockResolvedValue(modules);

        const result = await adminModule.getActiveModules();

        expect(mockDb.adminModule.findMany).toHaveBeenCalledWith({ where: { is_active: true } });
        expect(result).toEqual(modules);
      });
    });
  });

  describe('UserAccess Model', () => {
    describe('getModulesByUserId', () => {
      it('should return modules for user', async () => {
        const modules = [{ admin_module_id: 1 }];
        mockDb.userAccess.findMany.mockResolvedValue(modules);

        const result = await userAccess.getModulesByUserId(1);

        expect(mockDb.userAccess.findMany).toHaveBeenCalledWith({
          where: { user_id: 1, is_active: true },
          select: { admin_module_id: true },
        });
        expect(result).toEqual(modules);
      });
    });

    describe('updateUserModules', () => {
      it('should update user modules', async () => {
        mockDb.$transaction.mockImplementation(async (callback) => {
          return await callback(mockDb);
        });
        mockDb.userAccess.deleteMany.mockResolvedValue({});
        mockDb.userAccess.createMany.mockResolvedValue({});

        const result = await userAccess.updateUserModules(1, [1, 2], 1);

        expect(mockDb.$transaction).toHaveBeenCalled();
        expect(mockDb.userAccess.deleteMany).toHaveBeenCalledWith({ where: { user_id: 1 } });
        expect(mockDb.userAccess.createMany).toHaveBeenCalled();
      });
    });
  });

  describe('UserType Model', () => {
    describe('getAll', () => {
      it('should return all user types', async () => {
        const types = [{ id: 1, name: 'Admin' }];
        mockDb.userType.findMany.mockResolvedValue(types);

        const result = await userType.getAll();

        expect(mockDb.userType.findMany).toHaveBeenCalled();
        expect(result).toEqual(types);
      });
    });
  });
});