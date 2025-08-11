import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the NextRequest import first
jest.mock('next/server', () => ({
  NextRequest: class {
    constructor(url: string, init?: any) {
      this.url = url;
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers || {});
    }
    url: string;
    method: string;
    headers: Headers;
    json() {
      return Promise.resolve({});
    }
    text() {
      return Promise.resolve('');
    }
  },
  NextResponse: {
    json: jest.fn().mockImplementation(
      (data, init) =>
        new Response(JSON.stringify(data), {
          status: init?.status ?? 200,
          headers: { 'Content-Type': 'application/json' },
        })
    ),
  },
}));

import { NextRequest } from 'next/server';

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    initiative: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    issue: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

import { GET as getUsersGET } from '@/app/api/users/route';
import {
  GET as getInitiativesGET,
  POST as createInitiativePOST,
} from '@/app/api/initiatives/route';

describe('API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('/api/users', () => {
    it('should require authentication', async () => {
      // Mock no session
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/users', { method: 'GET' });

      const response = await getUsersGET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return users for authenticated requests', async () => {
      // Mock authenticated session
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      // Mock prisma response
      const { prisma } = require('@/lib/prisma');
      prisma.user.findMany.mockResolvedValue([
        {
          id: '1',
          name: 'Test User',
          email: 'test@example.com',
          role: 'LEADER',
        },
      ]);

      const request = new NextRequest('http://localhost:3000/api/users', { method: 'GET' });

      const response = await getUsersGET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0].email).toBe('test@example.com');
    });
  });

  describe('/api/initiatives', () => {
    it('should return initiatives for authenticated users', async () => {
      // Mock authenticated session
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      // Mock prisma response
      const { prisma } = require('@/lib/prisma');
      prisma.initiative.findMany.mockResolvedValue([
        {
          id: '1',
          title: 'Test Initiative',
          problem: 'Test problem',
          goal: 'Test goal',
          status: 'Define',
          progress: 0,
        },
      ]);

      const response = await getInitiativesGET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data[0].title).toBe('Test Initiative');
    });

    it('should create new initiative with valid data', async () => {
      // Mock authenticated session
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue({
        user: { email: 'test@example.com', id: 'user1' },
      });

      // Mock user lookup
      const { prisma } = require('@/lib/prisma');
      prisma.user.findUnique.mockResolvedValue({
        id: 'user1',
        email: 'test@example.com',
      });

      // Mock initiative creation
      prisma.initiative.create.mockResolvedValue({
        id: 'init1',
        title: 'New Initiative',
        problem: 'Test problem',
        goal: 'Test goal',
        status: 'Define',
        ownerId: 'user1',
      });

      // Mock audit log creation
      prisma.auditLog.create.mockResolvedValue({ id: 'log1' });

      const request = new NextRequest('http://localhost:3000/api/initiatives', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Initiative',
          problem: 'Test problem',
          goal: 'Test goal',
          kpis: ['metric1'],
          status: 'Define',
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const response = await createInitiativePOST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe('New Initiative');
      expect(data.ownerId).toBe('user1');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock authenticated session
      const { getServerSession } = require('next-auth');
      getServerSession.mockResolvedValue({
        user: { email: 'test@example.com' },
      });

      // Mock database error
      const { prisma } = require('@/lib/prisma');
      prisma.user.findMany.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/users', { method: 'GET' });

      const response = await getUsersGET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch users');
    });
  });
});
