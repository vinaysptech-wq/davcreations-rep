const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

// Mock prisma
jest.mock('../../src/lib/prisma', () => ({
  user: {
    findUnique: jest.fn(),
  },
  userType: {
    findUnique: jest.fn(),
  },
  userAccess: {
    findMany: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    findMany: jest.fn(),
  },
  rolePermissions: {
    findMany: jest.fn(),
  },
  admin_module: {
    findMany: jest.fn(),
  },
}));

// Mock config
jest.mock('../../src/config', () => ({
  server: {
    port: 5000,
    env: 'test',
    corsOrigin: 'http://localhost:3000',
    corsCredentials: true,
    httpsEnabled: false,
    httpsRedirect: false,
    logFilePath: null,
  },
  auth: {
    jwtSecret: 'test-secret',
    jwtExpiresIn: '1h',
    refreshTokenExpiresIn: '7d',
  },
  database: {},
}));

const db = require('../../src/lib/prisma');
const app = require('../../src/app');

describe('Auth Routes Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    db.userAccess.findMany.mockResolvedValue([{
      admin_module_id: 1,
      admin_module: {
        admin_module_id: 1,
        module_name: 'Test Module',
        parent_id: null,
        children: [],
        parent: null
      },
      permissions: { view: true, create: true, edit: true, delete: true },
      is_active: true
    }]);
    db.refreshToken.create.mockResolvedValue({});
    db.refreshToken.update.mockResolvedValue({});
    db.refreshToken.updateMany.mockResolvedValue({});
    db.refreshToken.findMany.mockResolvedValue([]);
    db.rolePermissions.findMany.mockResolvedValue([]);
    db.admin_module.findMany.mockResolvedValue([]);
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully', async () => {
      const user = {
        user_id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        user_password: 'hashedpassword',
        user_typeid: 1,
      };
      const userType = {
        user_type_name: 'Admin',
      };

      // Mock database calls
      db.user.findUnique.mockResolvedValue(user);
      db.userType.findUnique.mockResolvedValue(userType);

      // Mock bcrypt and jwt
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock-jwt-token');

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200);

      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toMatch(/authToken=/);
      expect(response.body).toEqual({
        token: 'mock-jwt-token',
        user: {
          user_id: 1,
          email: 'test@example.com',
          first_name: 'John',
          last_name: 'Doe',
          user_type_name: 'Admin',
        },
        message: 'Login successful'
      });
    });

    it('should return 400 for invalid input', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'invalid-email', password: 'pass' })
        .expect(400);

      expect(response.body.message).toContain('must be a valid email');
    });

    it('should return 401 for invalid credentials', async () => {
      db.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'notfound@example.com', password: 'password123' })
        .expect(401);

      expect(response.body.message).toBe('Invalid email or password');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.message).toBe('Logout successful');
      // Check that cookie is cleared (set-cookie with expired or cleared)
      expect(response.headers['set-cookie']).toBeDefined();
      expect(response.headers['set-cookie'][0]).toMatch(/authToken=;/); // cleared cookie
    });
  });
});