import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';

describe('Initiatives System', () => {
  let testUser: any;

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: 'test-initiatives@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        name: 'Test User',
        role: 'LEADER',
      },
    });

    // Clean up test initiatives
    await prisma.initiative.deleteMany({
      where: { title: { contains: 'Test Initiative' } },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.initiative.deleteMany({
      where: { title: { contains: 'Test Initiative' } },
    });

    await prisma.user.delete({
      where: { id: testUser.id },
    });
  });

  describe('Initiative Creation', () => {
    it('should create initiative with required fields', async () => {
      const initiativeData = {
        title: 'Test Initiative Creation',
        problem: 'Test problem description',
        goal: 'Test goal description',
        kpis: ['metric1', 'metric2'],
        ownerId: testUser.id,
        status: 'Define',
        progress: 0,
      };

      const initiative = await prisma.initiative.create({
        data: initiativeData,
      });

      expect(initiative).toBeDefined();
      expect(initiative.title).toBe(initiativeData.title);
      expect(initiative.problem).toBe(initiativeData.problem);
      expect(initiative.goal).toBe(initiativeData.goal);
      expect(initiative.kpis).toEqual(initiativeData.kpis);
      expect(initiative.ownerId).toBe(testUser.id);
      expect(initiative.status).toBe('Define');
      expect(initiative.progress).toBe(0);
    });

    it('should handle optional fields correctly', async () => {
      const initiative = await prisma.initiative.create({
        data: {
          title: 'Test Initiative Optional Fields',
          problem: 'Test problem',
          goal: 'Test goal',
          ownerId: testUser.id,
          status: 'Define',
          timelineStart: new Date('2024-01-01'),
          timelineEnd: new Date('2024-06-01'),
          difficulty: 50,
          roi: 75,
          priorityScore: 80,
        },
      });

      expect(initiative.timelineStart).toBeDefined();
      expect(initiative.timelineEnd).toBeDefined();
      expect(initiative.difficulty).toBe(50);
      expect(initiative.roi).toBe(75);
      expect(initiative.priorityScore).toBe(80);
    });
  });

  describe('Initiative Status Management', () => {
    let testInitiative: any;

    beforeEach(async () => {
      testInitiative = await prisma.initiative.create({
        data: {
          title: 'Test Initiative Status',
          problem: 'Test problem',
          goal: 'Test goal',
          ownerId: testUser.id,
          status: 'Define',
        },
      });
    });

    it('should update initiative status', async () => {
      const updatedInitiative = await prisma.initiative.update({
        where: { id: testInitiative.id },
        data: { status: 'In Progress' },
      });

      expect(updatedInitiative.status).toBe('In Progress');
    });

    it('should update progress percentage', async () => {
      const updatedInitiative = await prisma.initiative.update({
        where: { id: testInitiative.id },
        data: {
          status: 'In Progress',
          progress: 45,
        },
      });

      expect(updatedInitiative.progress).toBe(45);
      expect(updatedInitiative.status).toBe('In Progress');
    });
  });

  describe('Initiative Dependencies', () => {
    let initiative1: any;
    let initiative2: any;

    beforeEach(async () => {
      initiative1 = await prisma.initiative.create({
        data: {
          title: 'Test Initiative Dependency 1',
          problem: 'Test problem 1',
          goal: 'Test goal 1',
          ownerId: testUser.id,
          status: 'Define',
        },
      });

      initiative2 = await prisma.initiative.create({
        data: {
          title: 'Test Initiative Dependency 2',
          problem: 'Test problem 2',
          goal: 'Test goal 2',
          ownerId: testUser.id,
          status: 'Define',
        },
      });
    });

    it('should handle initiative dependencies', async () => {
      // Update initiative2 to depend on initiative1
      const updatedInitiative = await prisma.initiative.update({
        where: { id: initiative2.id },
        data: {
          dependencies: {
            connect: { id: initiative1.id },
          },
        },
        include: {
          dependencies: true,
          dependents: true,
        },
      });

      expect(updatedInitiative.dependencies).toHaveLength(1);
      expect(updatedInitiative.dependencies[0].id).toBe(initiative1.id);
    });
  });

  describe('Initiative KPIs', () => {
    it('should store and retrieve KPIs as array', async () => {
      const kpis = ['customer_satisfaction', 'processing_time', 'error_rate'];

      const initiative = await prisma.initiative.create({
        data: {
          title: 'Test Initiative KPIs',
          problem: 'Test problem',
          goal: 'Test goal',
          ownerId: testUser.id,
          status: 'Define',
          kpis: kpis,
        },
      });

      expect(initiative.kpis).toEqual(kpis);
      expect(Array.isArray(initiative.kpis)).toBe(true);
    });

    it('should handle empty KPIs array', async () => {
      const initiative = await prisma.initiative.create({
        data: {
          title: 'Test Initiative Empty KPIs',
          problem: 'Test problem',
          goal: 'Test goal',
          ownerId: testUser.id,
          status: 'Define',
          kpis: [],
        },
      });

      expect(initiative.kpis).toEqual([]);
    });
  });
});
