const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAIDirect() {
  try {
    console.log('🧪 Testing AI Category Suggestions directly...\n');

    // Simulate the exact flow from the API
    const description = `All client requests for work come into a single email box by client. It is difficult to determine what type of request is coming through: Lot, SWAT, or Project. This causes our client managers to waste time. We need to find an automated way to classify these requests and parse the data in the email. An automated tool that would do this, or a custom app, would improve efficiency and free up the client manager's time. For example, Pulte sends an email to the client inbox; it has request-type data in the email and attachment. A client manager has to manually review and enter data into Cortex to start the process. We get about 30 emails a day, so this is a consistent issue, and we have to look at hiring more people to fix it if we do not automate.`;

    // Test 1: Load taxonomy
    console.log('📊 Loading taxonomy from database...');
    const businessAreas = await prisma.systemCategory.findMany({
      where: {
        type: 'PROCESS',
        isActive: true,
        tags: { has: 'business-area' },
      },
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });

    const departments = await prisma.systemCategory.findMany({
      where: {
        type: 'PEOPLE',
        isActive: true,
        tags: { has: 'department' },
      },
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });

    const impactTypes = await prisma.systemCategory.findMany({
      where: {
        type: 'PROCESS',
        isActive: true,
        tags: { has: 'impact-type' },
      },
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    });

    const taxonomy = {
      businessAreas: businessAreas.map((cat) => cat.name),
      departments: departments.map((cat) => cat.name),
      impactTypes: impactTypes.map((cat) => cat.name),
    };

    console.log('✅ Taxonomy loaded:', {
      businessAreas: taxonomy.businessAreas.length,
      departments: taxonomy.departments.length,
      impactTypes: taxonomy.impactTypes.length,
    });

    // Test 2: Create prompt
    const prompt = `
Analyze this business issue and suggest appropriate categorization for a business company:

Issue: "${description}"

Categorize this issue into:

1. BUSINESS AREA (select 1-2 most relevant):
${taxonomy.businessAreas.map((area) => `- ${area}`).join('\n')}

2. DEPARTMENTS (select 1-3 most affected):
${taxonomy.departments.map((dept) => `- ${dept}`).join('\n')}

3. IMPACT TYPES (select 1-2 most relevant):
${taxonomy.impactTypes.map((impact) => `- ${impact}`).join('\n')}

Respond in this exact JSON format:
{
  "businessAreas": [
    {"businessArea": "Operations", "confidence": 90, "reasoning": "Brief explanation"}
  ],
  "departments": [
    {"department": "Engineering", "confidence": 85, "reasoning": "Brief explanation"}
  ],
  "impactTypes": [
    {"impactType": "Productivity Loss", "confidence": 80, "reasoning": "Brief explanation"}
  ]
}

Use confidence scores 0-100 based on how clearly the issue fits each category.
`;

    console.log('\n📝 Created prompt (first 500 chars):');
    console.log(prompt.substring(0, 500) + '...');

    // Test 3: Check AI configuration
    const aiConfig = await prisma.aIConfiguration.findUnique({
      where: { key: 'openai_config' },
    });

    if (!aiConfig) {
      console.log('❌ No AI configuration found');
      return;
    }

    const configValue = aiConfig.value;
    console.log('\n🤖 AI Configuration:');
    console.log('Model:', configValue.model);
    console.log('Enabled:', configValue.enabled);
    console.log('API Key:', configValue.apiKey ? 'Present' : 'Missing');

    console.log('\n✅ All components ready for AI categorization');
    console.log('🔧 Issue might be in the AI service initialization or API call');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAIDirect();
