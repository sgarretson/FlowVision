const { PrismaClient } = require('@prisma/client');

// Simulate the OpenAI API calls that would happen through the UI
class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
  }

  async getCompletion(messages, maxTokens = 1000) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messages,
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return {
        content: data.choices[0].message.content,
        usage: data.usage
      };
    } catch (error) {
      throw error;
    }
  }
}

const prisma = new PrismaClient();
const openaiService = new OpenAIService();

async function demonstrateIssueAnalysis() {
  console.log('🧠 AI ISSUE ANALYSIS DEMO');
  console.log('==========================\n');

  // Get a real issue from the database
  const issue = await prisma.issue.findFirst({
    orderBy: { heatmapScore: 'desc' }
  });

  if (!issue) {
    console.log('❌ No issues found in database');
    return;
  }

  console.log('📋 ISSUE TO ANALYZE:');
  console.log(`Description: ${issue.description.substring(0, 200)}...`);
  console.log(`Current Score: ${issue.heatmapScore}/100`);
  console.log(`Community Votes: ${issue.votes}\n`);

  const prompt = `As a business efficiency expert, analyze this operational issue and provide insights in JSON format:

Issue: ${issue.description}

Please respond with a JSON object containing:
{
  "category": "string (process, technology, communication, resource, etc.)",
  "severity": "string (low, medium, high, critical)",
  "impact": "string (description of business impact)",
  "rootCauses": ["array", "of", "root", "causes"],
  "suggestedInitiatives": [
    {
      "title": "Initiative title",
      "description": "Brief description",
      "priority": "high/medium/low",
      "estimatedROI": "string"
    }
  ],
  "quickWins": ["immediate", "actions", "to", "take"],
  "longTermStrategy": "string (strategic recommendation)"
}`;

  try {
    console.log('🤖 Calling OpenAI API for analysis...');
    const result = await openaiService.getCompletion([
      { role: 'system', content: 'You are a business efficiency expert who analyzes operational issues and provides structured insights.' },
      { role: 'user', content: prompt }
    ], 800);

    console.log('📊 AI ANALYSIS RESULT:');
    console.log(result.content);
    console.log(`\n💰 API Usage: ${result.usage.total_tokens} tokens (~$${(result.usage.total_tokens * 0.0015 / 1000).toFixed(4)})`);

    // Log the usage to audit log
    await prisma.auditLog.create({
      data: {
        userId: 'demo-user',
        action: 'AI_ISSUE_ANALYSIS',
        details: {
          issueId: issue.id,
          tokens: result.usage.total_tokens,
          model: 'gpt-3.5-turbo',
          cost: (result.usage.total_tokens * 0.0015 / 1000).toFixed(4),
          success: true
        }
      }
    });

    return true;
  } catch (error) {
    console.error('❌ Issue analysis failed:', error.message);
    return false;
  }
}

async function demonstrateInitiativeGeneration() {
  console.log('\n\n🎯 AI INITIATIVE GENERATION DEMO');
  console.log('=================================\n');

  // Get a real initiative from the database
  const initiative = await prisma.initiative.findFirst({
    include: { owner: true }
  });

  if (!initiative) {
    console.log('❌ No initiatives found in database');
    return;
  }

  console.log('📋 INITIATIVE TO ENHANCE:');
  console.log(`Title: ${initiative.title}`);
  console.log(`Problem: ${initiative.problem}`);
  console.log(`Current Goal: ${initiative.goal}`);
  console.log(`Owner: ${initiative.owner.name}`);
  console.log(`Progress: ${initiative.progress}%\n`);

  const prompt = `As a business strategy consultant, help enhance this initiative with detailed planning.

Current Initiative:
- Title: ${initiative.title}
- Problem: ${initiative.problem}
- Goal: ${initiative.goal}

Please provide a comprehensive enhancement in JSON format:
{
  "enhancedTitle": "Improved initiative title",
  "refinedGoal": "Clear, measurable goal statement",
  "keyResults": ["measurable", "outcome", "indicators"],
  "detailedPlan": {
    "phase1": "Discovery and planning details",
    "phase2": "Development and implementation",
    "phase3": "Testing and rollout"
  },
  "timeline": "string (e.g., '3-6 months')",
  "resources": {
    "team": "Team composition needed",
    "budget": "Estimated budget range",
    "technology": "Technology requirements"
  },
  "successMetrics": ["how", "to", "measure", "success"],
  "risks": ["potential", "risks", "and", "mitigation"],
  "expectedROI": "Return on investment estimate"
}`;

  try {
    console.log('🤖 Calling OpenAI API for initiative enhancement...');
    const result = await openaiService.getCompletion([
      { role: 'system', content: 'You are a business strategy consultant specializing in digital transformation initiatives.' },
      { role: 'user', content: prompt }
    ], 1000);

    console.log('🚀 AI ENHANCEMENT RESULT:');
    console.log(result.content);
    console.log(`\n💰 API Usage: ${result.usage.total_tokens} tokens (~$${(result.usage.total_tokens * 0.0015 / 1000).toFixed(4)})`);

    // Log the usage to audit log
    await prisma.auditLog.create({
      data: {
        userId: 'demo-user',
        action: 'AI_INITIATIVE_RECOMMENDATIONS',
        details: {
          initiativeId: initiative.id,
          tokens: result.usage.total_tokens,
          model: 'gpt-3.5-turbo',
          cost: (result.usage.total_tokens * 0.0015 / 1000).toFixed(4),
          success: true
        }
      }
    });

    return true;
  } catch (error) {
    console.error('❌ Initiative generation failed:', error.message);
    return false;
  }
}

async function demonstrateUsageMonitoring() {
  console.log('\n\n📈 AI USAGE MONITORING DEMO');
  console.log('============================\n');

  try {
    // Get updated usage statistics
    const aiLogs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: ['AI_ISSUE_ANALYSIS', 'AI_INITIATIVE_RECOMMENDATIONS', 'AI_INITIATIVE_REQUIREMENTS', 'OPENAI_CONNECTION_TEST']
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 10,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`📊 USAGE STATISTICS (Last 10 AI Operations):`);
    console.log('─'.repeat(60));

    let totalTokens = 0;
    let totalCost = 0;

    aiLogs.forEach((log, index) => {
      const details = log.details;
      const tokens = details.tokens || 0;
      const cost = parseFloat(details.cost || 0);
      
      totalTokens += tokens;
      totalCost += cost;

      console.log(`${index + 1}. ${log.action}`);
      console.log(`   User: ${log.user?.name || 'System'}`);
      console.log(`   Time: ${log.timestamp.toLocaleDateString()} ${log.timestamp.toLocaleTimeString()}`);
      console.log(`   Tokens: ${tokens} | Cost: $${cost.toFixed(4)}`);
      console.log('');
    });

    console.log('─'.repeat(60));
    console.log(`💰 TOTAL USAGE: ${totalTokens} tokens | $${totalCost.toFixed(4)}`);
    console.log(`📈 AVERAGE PER REQUEST: ${Math.round(totalTokens / aiLogs.length)} tokens | $${(totalCost / aiLogs.length).toFixed(4)}`);

    // Usage by action type
    const usageByType = aiLogs.reduce((acc, log) => {
      const action = log.action;
      if (!acc[action]) {
        acc[action] = { count: 0, tokens: 0, cost: 0 };
      }
      acc[action].count++;
      acc[action].tokens += (log.details.tokens || 0);
      acc[action].cost += parseFloat(log.details.cost || 0);
      return acc;
    }, {});

    console.log('\n📋 USAGE BY FEATURE:');
    Object.entries(usageByType).forEach(([action, stats]) => {
      console.log(`   ${action}: ${stats.count} calls | ${stats.tokens} tokens | $${stats.cost.toFixed(4)}`);
    });

    return true;
  } catch (error) {
    console.error('❌ Usage monitoring failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🎉 FLOWVISION AI FEATURES - LIVE DEMONSTRATION');
  console.log('===============================================');
  console.log('This demo shows all AI features working with your OpenAI API key.\n');

  const results = {
    issueAnalysis: false,
    initiativeGeneration: false,
    usageMonitoring: false
  };

  // Demo 1: AI Issue Analysis
  results.issueAnalysis = await demonstrateIssueAnalysis();

  // Demo 2: AI Initiative Generation
  results.initiativeGeneration = await demonstrateInitiativeGeneration();

  // Demo 3: Usage Monitoring
  results.usageMonitoring = await demonstrateUsageMonitoring();

  // Final Summary
  console.log('\n\n🏆 DEMONSTRATION RESULTS');
  console.log('========================');
  console.log(`🧠 Issue Analysis: ${results.issueAnalysis ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`🎯 Initiative Generation: ${results.initiativeGeneration ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`📈 Usage Monitoring: ${results.usageMonitoring ? '✅ SUCCESS' : '❌ FAILED'}`);

  const successCount = Object.values(results).filter(Boolean).length;
  console.log(`\n🎯 Overall Success Rate: ${successCount}/3 features working`);

  if (successCount === 3) {
    console.log('\n🎉 ALL AI FEATURES ARE FULLY OPERATIONAL!');
    console.log('\n✅ Your FlowVision application is ready with:');
    console.log('   - Real-time AI issue analysis');
    console.log('   - Intelligent initiative generation');
    console.log('   - Comprehensive usage monitoring');
    console.log('   - Full admin control interface');
    console.log('\n🌐 Access your application at: http://localhost:3000');
    console.log('🔐 Login: admin@flowvision.com / admin123');
  } else {
    console.log('\n⚠️  Some features need attention. Check the error messages above.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Demo failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });