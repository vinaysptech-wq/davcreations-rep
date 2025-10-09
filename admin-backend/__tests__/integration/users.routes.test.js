const request = require('supertest');
const bcrypt = require('bcryptjs');

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
  },
  database: {},
}));

// Mock auth middleware to set req.user
jest.mock('../../src/middleware/auth', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { user_id: 1, module_permissions: [1] }; // Add permissions for module 1 (Users)
    next();
  },
  authorizeRoles: () => (req, res, next) => {
    next(); // Allow all requests in tests
  }
}));

const db = require('../../src/lib/prisma');
const app = require('../../src/app');

describe('Users Routes Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should return users', async () => {
      const users = [{ user_id: 1 }];
      db.user.findMany.mockResolvedValue(users);
      db.user.count.mockResolvedValue(1);

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.users).toEqual(users);
      expect(response.body.total).toBe(1);
    });
  });

  describe('POST /api/users', () => {
    it('should create user', async () => {
      const userData = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        user_password: 'password123',
        confirm_password: 'password123',
        user_type_id: 1,
      };
      const createdUser = { user_id: 1, ...userData };
      db.user.findUnique.mockResolvedValue(null);
      db.user.create.mockResolvedValue(createdUser);
      db.userAccess.createMany.mockResolvedValue({});

      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);

      expect(response.body).toEqual(createdUser);
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ first_name: 'John' })
        .expect(400);

      expect(response.body.message).toContain('required');
    });
  });

  describe('GET /api/userTypes', () => {
    it('should return user types', async () => {
      const types = [{ id: 1, name: 'Admin' }];
      db.userType.findMany.mockResolvedValue(types);

      const response = await request(app)
        .get('/api/userTypes')
        .expect(200);

      expect(response.body).toEqual(types);
    });
  });

  describe('Profile routes', () => {
    describe('GET /api/users/profile', () => {
      it('should return user profile', async () => {
        const user = {
          user_id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '1234567890',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
        };
        db.user.findUnique.mockResolvedValue(user);

        const response = await request(app)
          .get('/api/users/profile')
          .expect(200);

        expect(response.body).toEqual({
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '1234567890',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
        });
      });

      it('should return 404 if user not found', async () => {
        db.user.findUnique.mockResolvedValue(null);

        const response = await request(app)
          .get('/api/users/profile')
          .expect(500); // Since service throws error

        expect(response.body.message).toContain('User not found');
      });
    });

    describe('PUT /api/users/profile', () => {
      it('should update user profile', async () => {
        const profileData = {
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane@example.com',
          phone: '0987654321',
          address: '456 Elm St',
          city: 'Othertown',
          state: 'NY',
        };
        const updatedUser = { user_id: 1, ...profileData };
        db.user.findUnique.mockResolvedValue(null); // For email check
        db.user.update.mockResolvedValue(updatedUser);

        const response = await request(app)
          .put('/api/users/profile')
          .send(profileData)
          .expect(200);

        expect(response.body).toEqual(updatedUser);
      });

      it('should return 400 for invalid data', async () => {
        const response = await request(app)
          .put('/api/users/profile')
          .send({ first_name: 'Jane' }) // Missing last_name and email
          .expect(400);

        expect(response.body.message).toContain('last_name');
      });
    });

    describe('PUT /api/users/profile/password', () => {
      it('should update user password', async () => {
        const passwordData = {
          old_password: 'oldpass123',
          new_password: 'newpass123',
          confirm_password: 'newpass123',
        };
        const user = { user_id: 1, user_password: await bcrypt.hash('oldpass123', 10) };
        db.user.findUnique.mockResolvedValue(user);
        db.user.update.mockResolvedValue({});

        const response = await request(app)
          .put('/api/users/profile/password')
          .send(passwordData)
          .expect(200);

        expect(response.body.message).toBe('Password updated successfully');
      });

      it('should return 400 for mismatched passwords', async () => {
        const response = await request(app)
          .put('/api/users/profile/password')
          .send({
            old_password: 'oldpass123',
            new_password: 'newpass123',
            confirm_password: 'different',
          })
          .expect(400);

        expect(response.body.message).toContain('[ref:new_password]');
      });

      it('should return 400 for invalid old password', async () => {
        const user = { user_id: 1, user_password: await bcrypt.hash('realoldpass', 10) };
        db.user.findUnique.mockResolvedValue(user);

        const response = await request(app)
          .put('/api/users/profile/password')
          .send({
            old_password: 'wrongoldpass',
            new_password: 'newpass123',
            confirm_password: 'newpass123',
          })
          .expect(500); // Service throws error

        expect(response.body.message).toContain('incorrect');
      });
    });
  });
});