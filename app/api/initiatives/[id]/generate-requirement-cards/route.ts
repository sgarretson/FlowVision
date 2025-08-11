import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { openAIService } from '@/lib/openai';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user owns the initiative or is admin
    const initiative = await prisma.initiative.findUnique({
      where: { id: params.id },
      select: { ownerId: true, title: true, problem: true, goal: true },
    });

    if (!initiative) {
      return NextResponse.json({ error: 'Initiative not found' }, { status: 404 });
    }

    if (user.role !== 'ADMIN' && initiative.ownerId !== user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if OpenAI is configured
    if (!openAIService.isConfigured()) {
      return NextResponse.json(
        {
          error: 'AI generation not available - OpenAI not configured',
          fallback: 'Use the admin panel to configure OpenAI integration for AI-powered features.',
        },
        { status: 503 }
      );
    }

    // Get business context
    const businessProfile = await prisma.businessProfile.findUnique({
      where: { userId: user.id },
    });

    const businessContext = businessProfile
      ? {
          industry: businessProfile.industry,
          size: businessProfile.size,
          metrics: businessProfile.metrics,
        }
      : undefined;

    // Generate requirement cards with AI
    const result = await openAIService.generateRequirementCards(
      initiative.title,
      initiative.problem,
      initiative.goal,
      businessContext
    );

    if (!result || !result.cards) {
      return NextResponse.json(
        {
          error: 'Failed to generate requirement cards',
          fallback: 'AI generation temporarily unavailable. Please try again later.',
        },
        { status: 500 }
      );
    }

    // Get next order index
    const lastCard = await prisma.requirementCard.findFirst({
      where: { initiativeId: params.id },
      orderBy: { orderIndex: 'desc' },
    });

    let orderIndex = (lastCard?.orderIndex || 0) + 1;

    // Create requirement cards in database
    const createdCards = [];
    for (const cardData of result.cards) {
      try {
        const card = await prisma.requirementCard.create({
          data: {
            initiativeId: params.id,
            title: cardData.title,
            description: cardData.description,
            type: cardData.type,
            priority: cardData.priority,
            category: cardData.category || null,
            createdById: user.id,
            orderIndex: orderIndex++,
          },
          include: {
            createdBy: { select: { id: true, name: true, email: true } },
            assignedTo: { select: { id: true, name: true, email: true } },
            approvedBy: { select: { id: true, name: true, email: true } },
            comments: {
              include: {
                author: { select: { id: true, name: true, email: true } },
              },
            },
          },
        });
        createdCards.push(card);
      } catch (error) {
        console.error('Failed to create requirement card:', error);
      }
    }

    // Log the AI usage
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'AI_REQUIREMENT_CARDS_GENERATED',
        details: {
          initiativeId: params.id,
          cardsGenerated: createdCards.length,
          initiativeTitle: initiative.title.substring(0, 100),
        },
      },
    });

    return NextResponse.json({
      success: true,
      cards: createdCards,
      message: `Generated ${createdCards.length} requirement cards`,
    });
  } catch (error) {
    console.error('Failed to generate requirement cards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
