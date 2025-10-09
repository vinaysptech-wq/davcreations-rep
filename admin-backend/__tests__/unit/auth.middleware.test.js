const { authenticateToken } = require('../../src/middleware/auth');

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {
      cookies: {},
      headers: {},
      method: 'GET',
      path: '/test',
      ip: '127.0.0.1'
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate successfully with token in cookies', () => {
      const token = 'valid.jwt.token';
      mockReq.cookies.authToken = token;

      // Mock jwt.verify
      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { user_id: 1, email: 'test@example.com' });
      });

      authenticateToken(mockReq, mockRes, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET, expect.any(Function));
      expect(mockReq.user).toEqual({ user_id: 1, email: 'test@example.com' });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should authenticate successfully with token in Authorization header', () => {
      const token = 'valid.jwt.token';
      mockReq.headers.authorization = `Bearer ${token}`;

      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(null, { user_id: 1, email: 'test@example.com' });
      });

      authenticateToken(mockReq, mockRes, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith(token, process.env.JWT_SECRET, expect.any(Function));
      expect(mockReq.user).toEqual({ user_id: 1, email: 'test@example.com' });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should prefer cookies over Authorization header', () => {
      const cookieToken = 'cookie.jwt.token';
      const headerToken = 'header.jwt.token';
      mockReq.cookies.authToken = cookieToken;
      mockReq.headers.authorization = `Bearer ${headerToken}`;

      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn((token, secret, callback) => {
        expect(token).toBe(cookieToken); // Should use cookie token
        callback(null, { user_id: 1, email: 'test@example.com' });
      });

      authenticateToken(mockReq, mockRes, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith(cookieToken, process.env.JWT_SECRET, expect.any(Function));
    });

    it('should return 401 if no token provided', () => {
      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 for invalid token', () => {
      mockReq.cookies.authToken = 'invalid.token';

      const jwt = require('jsonwebtoken');
      jwt.verify = jest.fn((token, secret, callback) => {
        callback(new Error('Invalid token'), null);
      });

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});