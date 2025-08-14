import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AIMigration from '@/lib/ai-migration';
import { aiConfigLoader } from '@/lib/ai-config-loader';
import { prisma } from '@/lib/prisma';

// GET /api/admin/openai - Get current OpenAI configuration and status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const config = await AIMigration.getConfig();
    const isConfigured = await AIMigration.isConfigured();
    const rawUsageStats = await AIMigration.getPerformanceMetrics();

    // Transform usage stats to match frontend expectations
    let usageStats;
    if (rawUsageStats && rawUsageStats.dailyUsage) {
      usageStats = {
        totalRequests: rawUsageStats.dailyUsage.totalRequests || 0,
        totalTokens: rawUsageStats.dailyUsage.totalTokens || 0,
        lastUsed: rawUsageStats.dailyUsage.lastUsed || null,
        costEstimate: rawUsageStats.dailyUsage.totalCost || 0,
      };
    } else {
      // Provide default usage stats structure if none available
      usageStats = {
        totalRequests: 0,
        totalTokens: 0,
        lastUsed: null,
        costEstimate: 0,
      };
    }

    return NextResponse.json({
      isConfigured,
      config: config
        ? {
            model: config.model,
            maxTokens: config.maxTokens,
            temperature: config.temperature,
            enabled: config.enabled,
            hasApiKey: !!config.apiKey,
          }
        : null,
      usageStats,
    });
  } catch (error) {
    console.error('Failed to get OpenAI config:', error);
    return NextResponse.json({ error: 'Failed to get configuration' }, { status: 500 });
  }
}

// POST /api/admin/openai - Update OpenAI configuration
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { apiKey, model, maxTokens, temperature, enabled } = body;

    // Validate inputs
    const existing = await AIMigration.getConfig();
    const effectiveApiKey = apiKey && typeof apiKey === 'string' ? apiKey : existing?.apiKey;
    if (!effectiveApiKey || !effectiveApiKey.startsWith('sk-')) {
      return NextResponse.json({ error: 'Valid OpenAI API key required' }, { status: 400 });
    }

    if (model && typeof model !== 'string') {
      return NextResponse.json({ error: 'Invalid model specified' }, { status: 400 });
    }

    if (maxTokens && (typeof maxTokens !== 'number' || maxTokens < 1 || maxTokens > 4000)) {
      return NextResponse.json({ error: 'Max tokens must be between 1 and 4000' }, { status: 400 });
    }

    if (temperature && (typeof temperature !== 'number' || temperature < 0 || temperature > 2)) {
      return NextResponse.json({ error: 'Temperature must be between 0 and 2' }, { status: 400 });
    }

    // Configure and save OpenAI service to database
    const configSuccess = await AIMigration.configure(
      {
        apiKey: effectiveApiKey,
        model: model || 'gpt-3.5-turbo',
        maxTokens: maxTokens || 500,
        temperature: temperature || 0.7,
        enabled: enabled !== false,
      },
      user.id
    );

    if (!configSuccess) {
      return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
    }

    // Log the configuration change
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'OPENAI_CONFIG_UPDATE',
        details: {
          model: model || 'gpt-3.5-turbo',
          maxTokens: maxTokens || 500,
          temperature: temperature || 0.7,
          enabled: enabled !== false,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'OpenAI configuration updated successfully',
    });
  } catch (error) {
    console.error('Failed to update OpenAI config:', error);
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}

// PUT /api/admin/openai - Test OpenAI connection
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { apiKey, model } = body;

    // Test connection with provided key or existing config
    let testResult;
    if (apiKey) {
      // Test with temporary configuration
      testResult = await aiConfigLoader.testConfiguration({
        apiKey,
        model: model || 'gpt-3.5-turbo',
        maxTokens: 10,
        temperature: 0.7,
        enabled: true,
      });
    } else {
      // Test existing configuration
      testResult = await AIMigration.testConnection();
    }

    // Log the test
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'OPENAI_CONNECTION_TEST',
        details: {
          success: testResult.success,
          model: testResult.model,
          error: testResult.error,
        },
      },
    });

    return NextResponse.json(testResult);
  } catch (error) {
    console.error('Failed to test OpenAI connection:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to test connection',
      },
      { status: 500 }
    );
  }
}
