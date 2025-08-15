import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/lib/rbac';

// Business-aligned taxonomy structure
interface TaxonomyResponse {
  businessAreas: Array<{
    id: string;
    name: string;
    description?: string;
    usageCount: number;
    isActive: boolean;
  }>;
  departments: Array<{
    id: string;
    name: string;
    description?: string;
    usageCount: number;
    isActive: boolean;
  }>;
  impactTypes: Array<{
    id: string;
    name: string;
    description?: string;
    usageCount: number;
    isActive: boolean;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all taxonomy categories from database
    const businessAreas = await prisma.systemCategory.findMany({
      where: {
        type: 'PROCESS',
        isActive: true,
        // Filter for business area categories
        OR: [
          { name: { contains: 'Operations', mode: 'insensitive' } },
          { name: { contains: 'People', mode: 'insensitive' } },
          { name: { contains: 'Technology', mode: 'insensitive' } },
          { name: { contains: 'Financial', mode: 'insensitive' } },
          { name: { contains: 'Strategy', mode: 'insensitive' } },
          { name: { contains: 'Compliance', mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    });

    const departments = await prisma.systemCategory.findMany({
      where: {
        type: 'PEOPLE',
        isActive: true,
        // Filter for department categories
        OR: [
          { name: { contains: 'Engineering', mode: 'insensitive' } },
          { name: { contains: 'Sales', mode: 'insensitive' } },
          { name: { contains: 'Marketing', mode: 'insensitive' } },
          { name: { contains: 'HR', mode: 'insensitive' } },
          { name: { contains: 'Finance', mode: 'insensitive' } },
          { name: { contains: 'Operations', mode: 'insensitive' } },
          { name: { contains: 'Leadership', mode: 'insensitive' } },
          { name: { contains: 'Customer Service', mode: 'insensitive' } },
          { name: { contains: 'Legal', mode: 'insensitive' } },
          { name: { contains: 'IT', mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    });

    // Impact types are stored as tags or in a separate structure
    const impactTypes = await prisma.systemCategory.findMany({
      where: {
        type: 'PROCESS',
        isActive: true,
        // Filter for impact type categories
        OR: [
          { name: { contains: 'Productivity', mode: 'insensitive' } },
          { name: { contains: 'Employee Satisfaction', mode: 'insensitive' } },
          { name: { contains: 'Customer Impact', mode: 'insensitive' } },
          { name: { contains: 'Revenue Impact', mode: 'insensitive' } },
          { name: { contains: 'Cost', mode: 'insensitive' } },
          { name: { contains: 'Risk', mode: 'insensitive' } },
          { name: { contains: 'Quality', mode: 'insensitive' } },
          { name: { contains: 'Communication', mode: 'insensitive' } },
        ],
      },
      orderBy: { name: 'asc' },
    });

    const response: TaxonomyResponse = {
      businessAreas: businessAreas.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description || undefined,
        usageCount: cat.usageCount,
        isActive: cat.isActive,
      })),
      departments: departments.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description || undefined,
        usageCount: cat.usageCount,
        isActive: cat.isActive,
      })),
      impactTypes: impactTypes.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description || undefined,
        usageCount: cat.usageCount,
        isActive: cat.isActive,
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to fetch taxonomy:', error);
    return NextResponse.json({ error: 'Failed to fetch taxonomy' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    if (!(await hasPermission('system_settings'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { type, name, description, categoryType } = body;

    if (!name || !type || !categoryType) {
      return NextResponse.json(
        { error: 'Name, type, and categoryType are required' },
        { status: 400 }
      );
    }

    // Map categoryType to SystemType
    let systemType: 'TECHNOLOGY' | 'PROCESS' | 'PEOPLE';
    switch (categoryType) {
      case 'businessArea':
      case 'impactType':
        systemType = 'PROCESS';
        break;
      case 'department':
        systemType = 'PEOPLE';
        break;
      default:
        return NextResponse.json({ error: 'Invalid categoryType' }, { status: 400 });
    }

    const category = await prisma.systemCategory.create({
      data: {
        name,
        description,
        type: systemType,
        isActive: true,
        isDefault: false,
      },
    });

    return NextResponse.json({
      id: category.id,
      name: category.name,
      description: category.description,
      usageCount: category.usageCount,
      isActive: category.isActive,
    });
  } catch (error) {
    console.error('Failed to create taxonomy item:', error);
    return NextResponse.json({ error: 'Failed to create taxonomy item' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    if (!(await hasPermission('system_settings'))) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { id, name, description, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const category = await prisma.systemCategory.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      id: category.id,
      name: category.name,
      description: category.description,
      usageCount: category.usageCount,
      isActive: category.isActive,
    });
  } catch (error) {
    console.error('Failed to update taxonomy item:', error);
    return NextResponse.json({ error: 'Failed to update taxonomy item' }, { status: 500 });
  }
}
