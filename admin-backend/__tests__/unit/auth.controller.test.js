const authController = require('../../src/modules/auth/controllers/authController');

describe('Auth Controller', () => {
  let mockService;
  let mockLogger;
  let controller;
  let mockReq;
  let mockRes;

  beforeEach(() => {
    mockService = {
      login: jest.fn(),
    };
    mockLogger = {
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
    };
    controller = authController(mockService, mockLogger);

    mockReq = {
      body: {},
      get: jest.fn(),
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully with valid input', async () => {
      mockReq.body = { email: 'test@example.com', password: 'password123' };
      const mockResult = { token: 'token123', user: { user_id: 1 } };
      mockService.login.mockResolvedValue(mockResult);

      await controller.login(mockReq, mockRes);

      expect(mockService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(mockRes.cookie).toHaveBeenCalledWith('authToken', 'token123', expect.any(Object));
      expect(mockRes.json).toHaveBeenCalledWith({
        token: 'token123',
        user: { user_id: 1 },
        message: 'Login successful'
      });
    });

    it('should return 400 for invalid email', async () => {
      mockReq.body = { email: 'invalid-email', password: 'password123' };

      await controller.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: '"email" must be a valid email' });
    });

    it('should return 400 for missing password', async () => {
      mockReq.body = { email: 'test@example.com' };

      await controller.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: '"password" is required' });
    });

    it('should return 401 for invalid credentials', async () => {
      mockReq.body = { email: 'test@example.com', password: 'wrongpassword' };
      mockService.login.mockRejectedValue(new Error('Invalid email or password'));

      await controller.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid email or password' });
    });

    it('should return 500 for service error', async () => {
      mockReq.body = { email: 'test@example.com', password: 'password123' };
      mockService.login.mockRejectedValue(new Error('Database error'));

      await controller.login(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      mockReq.user = { user_id: 1 };

      await controller.logout(mockReq, mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('authToken', expect.any(Object));
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Logout successful' });
    });

    it('should logout successfully without user', async () => {
      await controller.logout(mockReq, mockRes);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('authToken', expect.any(Object));
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Logout successful' });
    });
  });
});