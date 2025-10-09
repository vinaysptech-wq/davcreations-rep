const userModel = require('../../src/modules/auth/models/user');

describe('Auth User Model', () => {
  let mockDb;
  let model;

  beforeEach(() => {
    mockDb = {
      user: {
        findUnique: jest.fn(),
      },
    };
    model = userModel(mockDb);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getByEmail', () => {
    it('should return user when found', async () => {
      const mockUser = { user_id: 1, email: 'test@example.com' };
      mockDb.user.findUnique.mockResolvedValue(mockUser);

      const result = await model.getByEmail('test@example.com');

      expect(mockDb.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockDb.user.findUnique.mockResolvedValue(null);

      const result = await model.getByEmail('notfound@example.com');

      expect(mockDb.user.findUnique).toHaveBeenCalledWith({ where: { email: 'notfound@example.com' } });
      expect(result).toBeNull();
    });

    it('should throw error when database error occurs', async () => {
      const error = new Error('Database error');
      mockDb.user.findUnique.mockRejectedValue(error);

      await expect(model.getByEmail('test@example.com')).rejects.toThrow('Database error');
    });
  });
});