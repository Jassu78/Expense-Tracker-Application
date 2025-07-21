const request = require('supertest');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Mock the server
const app = require('../src/server');

describe('Authentication', () => {
  beforeAll(async () => {
    // Clean up database before tests
    await prisma.auditLog.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // Create a test user
      const hashedPassword = await bcrypt.hash('password123', 10);
      const testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: hashedPassword,
          name: 'Test User',
          role: 'EMPLOYEE',
        },
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });
}); 