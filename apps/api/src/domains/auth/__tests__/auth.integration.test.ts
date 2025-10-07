import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import authRoutes from '../auth.routes';
import prisma from '../../../config/database';
import { hashPassword } from '../../../utils/password';

// Create test app
const createTestApp = (): Express => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  return app;
};

describe('Auth Integration Tests', () => {
  let app: Express;
  let testUserId: string;
  let testUserRefreshToken: string;

  beforeAll(async () => {
    app = createTestApp();

    // Create test user
    const hashedPassword = await hashPassword('password123');
    const user = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        fullName: 'Test User',
        role: 'admin',
        status: 'active',
      },
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.refreshToken.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.activityLog.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.userSession.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });

    // Close Prisma connection
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean up sessions and tokens before each test
    await prisma.refreshToken.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.userSession.deleteMany({
      where: { userId: testUserId },
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toMatchObject({
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'admin',
      });

      // Save refresh token for other tests
      testUserRefreshToken = response.body.data.refreshToken;
    });

    it('should return 401 for invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 400 for missing username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for username less than 3 characters', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'ab',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for password less than 6 characters', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: '12345',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/refresh', () => {
    beforeEach(async () => {
      // Login to get a refresh token
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        });
      testUserRefreshToken = response.body.data.refreshToken;
    });

    it('should successfully refresh access token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: testUserRefreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Token refreshed successfully');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(typeof response.body.data.accessToken).toBe('string');
    });

    it('should return 401 for invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid refresh token');
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 401 for revoked refresh token', async () => {
      // First revoke the token
      await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: testUserRefreshToken,
        });

      // Try to use the revoked token
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: testUserRefreshToken,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid refresh token');
    });
  });

  describe('POST /api/auth/logout', () => {
    beforeEach(async () => {
      // Login to get a refresh token
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123',
        });
      testUserRefreshToken = response.body.data.refreshToken;
    });

    it('should successfully logout with refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({
          refreshToken: testUserRefreshToken,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });

    it('should successfully logout without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logout successful');
    });
  });

  describe('POST /api/auth/verify-2fa', () => {
    let user2FAId: string;
    const mockSecret = 'JBSWY3DPEHPK3PXP'; // Base32 encoded secret

    beforeAll(async () => {
      // Create user with 2FA enabled
      const hashedPassword = await hashPassword('password123');
      const user = await prisma.user.create({
        data: {
          username: 'testuser2fa',
          email: 'test2fa@example.com',
          password: hashedPassword,
          fullName: 'Test User 2FA',
          role: 'admin',
          status: 'active',
        },
      });
      user2FAId = user.id;

      // Enable 2FA for user
      await prisma.twoFactorAuth.create({
        data: {
          userId: user2FAId,
          enabled: true,
          secret: mockSecret,
        },
      });
    });

    afterAll(async () => {
      // Cleanup
      await prisma.twoFactorAuth.deleteMany({
        where: { userId: user2FAId },
      });
      await prisma.refreshToken.deleteMany({
        where: { userId: user2FAId },
      });
      await prisma.activityLog.deleteMany({
        where: { userId: user2FAId },
      });
      await prisma.userSession.deleteMany({
        where: { userId: user2FAId },
      });
      await prisma.user.delete({
        where: { id: user2FAId },
      });
    });

    it('should return 400 for missing userId', async () => {
      const response = await request(app)
        .post('/api/auth/verify-2fa')
        .send({
          token: '123456',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for missing token', async () => {
      const response = await request(app)
        .post('/api/auth/verify-2fa')
        .send({
          userId: user2FAId,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for invalid token length', async () => {
      const response = await request(app)
        .post('/api/auth/verify-2fa')
        .send({
          userId: user2FAId,
          token: '12345', // Only 5 digits
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/verify-2fa')
        .send({
          userId: 'non-existent-id',
          token: '123456',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('User not found');
    });
  });
});
