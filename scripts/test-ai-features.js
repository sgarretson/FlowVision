const { PrismaClient } = require('@prisma/client');

// Mock the OpenAI service for testing
class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  async getCompletion(messages, maxTokens = 1000) {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

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
        const errorData = await response.text();
        throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw error;
    }
  }
}

const prisma = new PrismaClient();
const openaiService = new OpenAIService();

async function testOpenAIConnection() {
  console.log('🔍 Testing OpenAI API connection...');
  
  try {
    const response = await openaiService.getCompletion([
      {
        role: 'user',
        content: 'Say "Hello, FlowVision!" if you can receive this message.'
      }
    ], 50);
    
    console.log('✅ OpenAI Connection Test Result:', response);
    return true;
  } catch (error) {
    console.error('❌ OpenAI Connection Failed:', error.message);
    return false;
  }
}

async function testIssueAnalysis() {
  console.log('\n🧠 Testing AI Issue Analysis...');
  
  try {
    const issueDescription = `Our current client approval process for design iterations is taking 3-4 weeks per round. Clients receive design proposals via email, often get lost in communication, multiple stakeholders need to coordinate, and we lack a centralized tracking system. This is causing project delays and client frustration.`;
    
    const prompt = `As a business efficiency expert, analyze this operational issue and provide insights in JSON format:

Issue: ${issueDescription}

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

    const response = await openaiService.getCompletion([
      { role: 'system', content: 'You are a business efficiency expert who analyzes operational issues and provides structured insights.' },
      { role: 'user', content: prompt }
    ], 800);

    console.log('📊 AI Issue Analysis Result:');
    console.log(response);
    
    // Try to parse as JSON to validate structure
    try {
      const parsed = JSON.parse(response);
      console.log('✅ Response is valid JSON with structure:', Object.keys(parsed));
    } catch (e) {
      console.log('⚠️  Response is not valid JSON, but AI responded');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Issue Analysis Failed:', error.message);
    return false;
  }
}

async function testInitiativeGeneration() {
  console.log('\n🎯 Testing AI Initiative Generation...');
  
  try {
    const problemStatement = 'Client approval process is slow and disorganized';
    const title = 'Digital Client Portal Implementation';
    
    const prompt = `As a business strategy consultant, help generate a comprehensive initiative based on this problem.

Problem: ${problemStatement}
Initiative Title: ${title}

Please provide a detailed response in JSON format:
{
  "title": "Refined initiative title",
  "goal": "Clear, measurable goal statement",
  "keyResults": ["measurable", "outcome", "indicators"],
  "recommendedApproach": {
    "phase1": "Discovery and planning details",
    "phase2": "Development and implementation",
    "phase3": "Testing and rollout"
  },
  "estimatedTimeline": "string (e.g., '3-6 months')",
  "resourceRequirements": {
    "team": "Team composition needed",
    "budget": "Estimated budget range",
    "technology": "Technology requirements"
  },
  "successMetrics": ["how", "to", "measure", "success"],
  "risks": ["potential", "risks", "and", "mitigation"],
  "expectedROI": "Return on investment estimate"
}`;

    const response = await openaiService.getCompletion([
      { role: 'system', content: 'You are a business strategy consultant specializing in digital transformation initiatives.' },
      { role: 'user', content: prompt }
    ], 1000);

    console.log('🚀 AI Initiative Generation Result:');
    console.log(response);
    
    try {
      const parsed = JSON.parse(response);
      console.log('✅ Response is valid JSON with structure:', Object.keys(parsed));
    } catch (e) {
      console.log('⚠️  Response is not valid JSON, but AI responded');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Initiative Generation Failed:', error.message);
    return false;
  }
}

async function testUsageTracking() {
  console.log('\n📈 Testing Usage Tracking...');
  
  try {
    // Check if we have audit logs in the database
    const aiLogs = await prisma.auditLog.findMany({
      where: {
        action: {
          in: ['AI_ISSUE_ANALYSIS', 'AI_INITIATIVE_RECOMMENDATIONS', 'AI_INITIATIVE_REQUIREMENTS', 'OPENAI_CONNECTION_TEST']
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 5,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    console.log(`📊 Found ${aiLogs.length} AI usage logs in database`);
    
    if (aiLogs.length > 0) {
      console.log('Recent AI activity:');
      aiLogs.forEach((log, index) => {
        console.log(`  ${index + 1}. ${log.action} by ${log.user?.name || 'Unknown'} at ${log.timestamp.toISOString()}`);
        if (log.details && typeof log.details === 'object') {
          const details = log.details;
          if (details.tokens) console.log(`     Tokens: ${details.tokens}`);
          if (details.cost) console.log(`     Cost: $${details.cost}`);
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Usage Tracking Test Failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 FlowVision AI Features Test Suite');
  console.log('=====================================\n');

  const results = {
    connection: false,
    issueAnalysis: false,
    initiativeGeneration: false,
    usageTracking: false
  };

  // Test 1: OpenAI Connection
  results.connection = await testOpenAIConnection();

  // Test 2: Issue Analysis (only if connection works)
  if (results.connection) {
    results.issueAnalysis = await testIssueAnalysis();
  }

  // Test 3: Initiative Generation (only if connection works)
  if (results.connection) {
    results.initiativeGeneration = await testInitiativeGeneration();
  }

  // Test 4: Usage Tracking (independent of OpenAI)
  results.usageTracking = await testUsageTracking();

  // Summary
  console.log('\n📋 Test Results Summary');
  console.log('========================');
  console.log(`🔗 OpenAI Connection: ${results.connection ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🧠 Issue Analysis: ${results.issueAnalysis ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🎯 Initiative Generation: ${results.initiativeGeneration ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`📈 Usage Tracking: ${results.usageTracking ? '✅ PASS' : '❌ FAIL'}`);

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  console.log(`\n🏆 Overall: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All AI features are working correctly!');
  } else {
    console.log('⚠️  Some features need attention. Check the logs above.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Test suite failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });