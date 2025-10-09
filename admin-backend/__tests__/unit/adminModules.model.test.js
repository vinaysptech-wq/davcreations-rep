const adminModuleModel = require('../../src/modules/adminModules/models/adminModule');

describe('AdminModule Model', () => {
  let mockDb;
  let model;

  beforeEach(() => {
    mockDb = {
      adminModules: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };
    model = adminModuleModel(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create admin module', async () => {
      const data = { module_name: 'Test Module' };
      const created = { admin_module_id: 1, ...data };
      mockDb.adminModules.create.mockResolvedValue(created);

      const result = await model.create(data);

      expect(mockDb.adminModules.create).toHaveBeenCalledWith({ data });
      expect(result).toEqual(created);
    });
  });

  describe('getAll', () => {
    it('should return all admin modules', async () => {
      const modules = [{ admin_module_id: 1 }];
      mockDb.adminModules.findMany.mockResolvedValue(modules);

      const result = await model.getAll();

      expect(mockDb.adminModules.findMany).toHaveBeenCalled();
      expect(result).toEqual(modules);
    });
  });

  describe('getById', () => {
    it('should return admin module by id', async () => {
      const module = { admin_module_id: 1 };
      mockDb.adminModules.findUnique.mockResolvedValue(module);

      const result = await model.getById(1);

      expect(mockDb.adminModules.findUnique).toHaveBeenCalledWith({ where: { admin_module_id: 1 } });
      expect(result).toEqual(module);
    });
  });

  describe('update', () => {
    it('should update admin module', async () => {
      const data = { module_name: 'Updated' };
      const updated = { admin_module_id: 1, ...data };
      mockDb.adminModules.update.mockResolvedValue(updated);

      const result = await model.update(1, data);

      expect(mockDb.adminModules.update).toHaveBeenCalledWith({
        where: { admin_module_id: 1 },
        data,
      });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('should soft delete admin module', async () => {
      const deleted = { admin_module_id: 1, is_active: false };
      mockDb.adminModules.update.mockResolvedValue(deleted);

      const result = await model.delete(1);

      expect(mockDb.adminModules.update).toHaveBeenCalledWith({
        where: { admin_module_id: 1 },
        data: {
          is_active: false,
          last_updated_date: expect.any(Date),
        },
      });
      expect(result).toEqual(deleted);
    });
  });
});