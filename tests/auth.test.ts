import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn(),
}));

describe('Authentication System', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'test' } },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: 'test' } },
    });
  });

  describe('User Registration', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'testpassword123',
        name: 'Test User',
        role: 'LEADER' as const,
      };

      const passwordHash = await bcrypt.hash(userData.password, 10);

      const user = await prisma.user.create({
        data: {
          email: userData.email,
          passwordHash,
          name: userData.name,
          role: userData.role,
        },
      });

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.role).toBe(userData.role);
      expect(user.passwordHash).not.toBe(userData.password);
    });

    it('should not allow duplicate email addresses', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Test User',
        role: 'LEADER' as const,
      };

      // Create first user
      await prisma.user.create({ data: userData });

      // Attempt to create duplicate
      await expect(prisma.user.create({ data: userData })).rejects.toThrow();
    });

    it('should default to LEADER role if not specified', async () => {
      const user = await prisma.user.create({
        data: {
          email: 'test2@example.com',
          passwordHash: await bcrypt.hash('password123', 10),
          name: 'Test User 2',
        },
      });

      expect(user.role).toBe('LEADER');
    });
  });

  describe('Password Security', () => {
    it('should hash passwords properly', async () => {
      const plainPassword = 'testpassword123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      expect(hashedPassword).not.toBe(plainPassword);
      expect(hashedPassword.length).toBeGreaterThan(50);

      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect passwords', async () => {
      const plainPassword = 'testpassword123';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      const isValid = await bcrypt.compare('wrongpassword', hashedPassword);
      expect(isValid).toBe(false);
    });
  });

  describe('User Roles', () => {
    it('should support ADMIN and LEADER roles', async () => {
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@test.com',
          passwordHash: await bcrypt.hash('password123', 10),
          name: 'Admin User',
          role: 'ADMIN',
        },
      });

      const leaderUser = await prisma.user.create({
        data: {
          email: 'leader@test.com',
          passwordHash: await bcrypt.hash('password123', 10),
          name: 'Leader User',
          role: 'LEADER',
        },
      });

      expect(adminUser.role).toBe('ADMIN');
      expect(leaderUser.role).toBe('LEADER');
    });
  });
});
