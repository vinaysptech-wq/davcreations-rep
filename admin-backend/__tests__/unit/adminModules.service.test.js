const adminModuleService = require('../../src/modules/adminModules/services/adminModuleService');

describe('AdminModule Service', () => {
  let mockConfig;
  let mockLogger;
  let mockModels;
  let service;

  beforeEach(() => {
    mockConfig = {};
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    };
    mockModels = {
      adminModule: {
        create: jest.fn(),
        getAll: jest.fn(),
        getById: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = adminModuleService(mockConfig, mockLogger, mockModels);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create admin module', async () => {
      const data = { module_name: 'Test' };
      const created = { admin_module_id: 1 };
      mockModels.adminModule.create.mockResolvedValue(created);

      const result = await service.create(data);

      expect(mockModels.adminModule.create).toHaveBeenCalledWith(data);
      expect(result).toEqual(created);
    });

    it('should throw error if module_name missing', async () => {
      await expect(service.create({})).rejects.toThrow('module_name is required');
    });
  });

  describe('getAll', () => {
    it('should return all admin modules', async () => {
      const modules = [{ id: 1 }];
      mockModels.adminModule.getAll.mockResolvedValue(modules);

      const result = await service.getAll();

      expect(result).toEqual(modules);
    });
  });

  describe('getById', () => {
    it('should return admin module by id', async () => {
      const module = { admin_module_id: 1 };
      mockModels.adminModule.getById.mockResolvedValue(module);

      const result = await service.getById(1);

      expect(result).toEqual(module);
    });
  });

  describe('update', () => {
    it('should update admin module', async () => {
      const data = { module_name: 'Updated' };
      const updated = { admin_module_id: 1 };
      mockModels.adminModule.update.mockResolvedValue(updated);

      const result = await service.update(1, data);

      expect(mockModels.adminModule.update).toHaveBeenCalledWith(1, data);
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('should delete admin module', async () => {
      const deleted = { admin_module_id: 1 };
      mockModels.adminModule.delete.mockResolvedValue(deleted);

      const result = await service.delete(1);

      expect(result).toEqual(deleted);
    });
  });
});