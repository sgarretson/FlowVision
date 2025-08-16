#!/usr/bin/env node

/**
 * Automated Documentation System for FlowVision
 *
 * This script provides automated documentation updates based on:
 * - Git commit analysis
 * - Sprint progress tracking
 * - Learning extraction
 * - Velocity data updates
 * - Process documentation synchronization
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  docsPath: './docs',
  sprintPlansPath: './docs/project-management/sprint-plans',
  knowledgeBasePath: './docs/project-management/processes',
  velocityDataPath: './docs/project-management/velocity-data.json',
  learningsPath: './docs/analysis-reports/learning-insights.json',
  processDocsPath: './docs/project-management/processes',
};

/**
 * Main automation orchestrator
 */
async function runAutomatedDocumentationSystem() {
  console.log('🤖 Starting Automated Documentation System...\n');

  try {
    // 1. Extract learnings from recent commits
    console.log('📚 Extracting learnings from commits...');
    const learnings = await extractCommitLearnings();
    console.log(`   ✅ Extracted ${learnings.length} learnings`);

    // 2. Update velocity data
    console.log('📊 Updating velocity metrics...');
    const velocityData = await updateVelocityMetrics();
    console.log(`   ✅ Updated velocity data for ${velocityData.sprints.length} sprints`);

    // 3. Sync sprint documentation
    console.log('🏃‍♂️ Syncing sprint documentation...');
    const sprintUpdates = await syncSprintDocumentation();
    console.log(`   ✅ Updated ${sprintUpdates.length} sprint documents`);

    // 4. Update knowledge base
    console.log('🧠 Updating knowledge base...');
    const knowledgeUpdates = await updateKnowledgeBase(learnings);
    console.log(`   ✅ Updated ${knowledgeUpdates.length} knowledge documents`);

    // 5. Generate insights and reports
    console.log('📈 Generating insights and reports...');
    const reports = await generateInsightsReports(learnings, velocityData);
    console.log(`   ✅ Generated ${reports.length} insight reports`);

    // 6. Validate and fix documentation links
    console.log('🔗 Validating documentation links...');
    const linkValidation = await validateDocumentationLinks();
    console.log(
      `   ✅ Validated ${linkValidation.totalLinks} links, fixed ${linkValidation.fixedLinks} issues`
    );

    // 7. Update process documentation
    console.log('📋 Updating process documentation...');
    const processUpdates = await updateProcessDocumentation();
    console.log(`   ✅ Updated ${processUpdates.length} process documents`);

    console.log('\n🎉 Automated Documentation System completed successfully!');

    // Generate summary report
    const summary = generateSummaryReport({
      learnings,
      velocityData,
      sprintUpdates,
      knowledgeUpdates,
      reports,
      linkValidation,
      processUpdates,
    });

    await saveSummaryReport(summary);
    console.log('\n📄 Summary report saved to: docs/analysis-reports/automation-summary.json');
  } catch (error) {
    console.error('❌ Error in automated documentation system:', error);
    process.exit(1);
  }
}

/**
 * Extract learnings from commit messages
 */
async function extractCommitLearnings() {
  const since = getLastSyncDate();
  const gitLog = execSync(`git log --since="${since}" --pretty=format:"%H|%an|%ad|%s" --date=iso`, {
    encoding: 'utf8',
  });

  const commits = gitLog.split('\n').filter((line) => line.trim());
  const learnings = [];

  for (const commitLine of commits) {
    const [hash, author, date, message] = commitLine.split('|');

    // Extract learning annotations
    const learningMatch = message.match(/\\[learns: ([^\\]]+)\\]/);
    const storyMatch = message.match(/\\[story: ([^\\]]+)\\]/);
    const pointsMatch = message.match(/\\[points: (\\d+)\\]/);

    if (learningMatch) {
      learnings.push({
        id: hash.substring(0, 8),
        timestamp: new Date(date),
        author,
        commit: hash,
        learning: learningMatch[1],
        story: storyMatch ? storyMatch[1] : null,
        points: pointsMatch ? parseInt(pointsMatch[1]) : 0,
        type: message.split(':')[0],
        scope: extractScope(message),
        category: categorizeLearning(learningMatch[1]),
        impact: assessLearningImpact(learningMatch[1]),
        actionable: isActionableLearning(learningMatch[1]),
      });
    }
  }

  // Save learnings data
  await saveLearningsData(learnings);
  return learnings;
}

/**
 * Update velocity metrics from sprint data
 */
async function updateVelocityMetrics() {
  const sprintFiles = await getSprintFiles();
  const velocityData = { lastUpdated: new Date(), sprints: [] };

  for (const sprintFile of sprintFiles) {
    const sprintData = await parseSprintFile(sprintFile);
    const velocityMetrics = calculateSprintVelocity(sprintData);

    velocityData.sprints.push({
      sprintId: sprintData.id,
      planned: sprintData.plannedPoints,
      completed: velocityMetrics.completedPoints,
      accuracy: velocityMetrics.accuracy,
      trend: velocityMetrics.trend,
      blockers: sprintData.blockers?.length || 0,
      stories: sprintData.stories?.length || 0,
      timestamp: sprintData.endDate || new Date(),
    });
  }

  // Calculate overall metrics
  velocityData.overall = calculateOverallVelocityMetrics(velocityData.sprints);

  await saveVelocityData(velocityData);
  return velocityData;
}

/**
 * Sync sprint documentation with current state
 */
async function syncSprintDocumentation() {
  const sprintFiles = await getSprintFiles();
  const updates = [];

  for (const sprintFile of sprintFiles) {
    const content = await fs.readFile(sprintFile, 'utf8');
    const sprintData = parseSprintContent(content);

    // Check if sprint needs updates
    const needsUpdate = await checkSprintNeedsUpdate(sprintData);

    if (needsUpdate) {
      const updatedContent = await generateUpdatedSprintContent(sprintData);
      await fs.writeFile(sprintFile, updatedContent);
      updates.push({
        file: sprintFile,
        sprintId: sprintData.id,
        updates: needsUpdate.updates,
      });
    }
  }

  return updates;
}

/**
 * Update knowledge base with new learnings
 */
async function updateKnowledgeBase(learnings) {
  const knowledgeFiles = await getKnowledgeFiles();
  const updates = [];

  // Update knowledge tracking system
  const knowledgeTrackingFile = path.join(CONFIG.knowledgeBasePath, 'KNOWLEDGE_TRACKING_SYSTEM.md');
  const knowledgeContent = await fs.readFile(knowledgeTrackingFile, 'utf8');
  const updatedKnowledgeContent = await updateKnowledgeContent(knowledgeContent, learnings);

  if (updatedKnowledgeContent !== knowledgeContent) {
    await fs.writeFile(knowledgeTrackingFile, updatedKnowledgeContent);
    updates.push({
      file: knowledgeTrackingFile,
      type: 'knowledge-tracking',
      learningsAdded: learnings.length,
    });
  }

  // Update continuous learning framework
  const frameworkFile = path.join(CONFIG.knowledgeBasePath, 'CONTINUOUS_LEARNING_FRAMEWORK.md');
  const frameworkUpdates = await updateFrameworkWithLearnings(frameworkFile, learnings);
  if (frameworkUpdates.updated) {
    updates.push({
      file: frameworkFile,
      type: 'learning-framework',
      updates: frameworkUpdates.changes,
    });
  }

  return updates;
}

/**
 * Generate insights and reports
 */
async function generateInsightsReports(learnings, velocityData) {
  const reports = [];

  // Learning insights report
  const learningInsights = analyzeLearningTrends(learnings);
  const learningReportPath = path.join(
    CONFIG.docsPath,
    'analysis-reports',
    'learning-insights-report.md'
  );
  await generateLearningInsightsReport(learningInsights, learningReportPath);
  reports.push({
    type: 'learning-insights',
    path: learningReportPath,
    insights: learningInsights.insights.length,
  });

  // Velocity analysis report
  const velocityInsights = analyzeVelocityTrends(velocityData);
  const velocityReportPath = path.join(
    CONFIG.docsPath,
    'analysis-reports',
    'velocity-analysis-report.md'
  );
  await generateVelocityAnalysisReport(velocityInsights, velocityReportPath);
  reports.push({
    type: 'velocity-analysis',
    path: velocityReportPath,
    trends: velocityInsights.trends.length,
  });

  // Process improvement recommendations
  const processRecommendations = generateProcessRecommendations(learnings, velocityData);
  const processReportPath = path.join(
    CONFIG.docsPath,
    'analysis-reports',
    'process-recommendations.md'
  );
  await generateProcessRecommendationsReport(processRecommendations, processReportPath);
  reports.push({
    type: 'process-recommendations',
    path: processReportPath,
    recommendations: processRecommendations.length,
  });

  return reports;
}

/**
 * Validate and fix documentation links
 */
async function validateDocumentationLinks() {
  const docFiles = await getAllDocumentationFiles();
  let totalLinks = 0;
  let brokenLinks = 0;
  let fixedLinks = 0;

  for (const docFile of docFiles) {
    const content = await fs.readFile(docFile, 'utf8');
    const links = extractMarkdownLinks(content);
    totalLinks += links.length;

    for (const link of links) {
      const isValid = await validateLink(link, docFile);
      if (!isValid.valid) {
        brokenLinks++;
        const fix = suggestLinkFix(link, docFile);
        if (fix) {
          const updatedContent = content.replace(link.original, fix.replacement);
          await fs.writeFile(docFile, updatedContent);
          fixedLinks++;
        }
      }
    }
  }

  return { totalLinks, brokenLinks, fixedLinks };
}

/**
 * Update process documentation
 */
async function updateProcessDocumentation() {
  const processFiles = await getProcessFiles();
  const updates = [];

  for (const processFile of processFiles) {
    const content = await fs.readFile(processFile, 'utf8');
    const analysis = analyzeProcessDocument(content);

    if (analysis.needsUpdate) {
      const updatedContent = await updateProcessContent(content, analysis);
      await fs.writeFile(processFile, updatedContent);
      updates.push({
        file: processFile,
        updates: analysis.updates,
      });
    }
  }

  return updates;
}

// Utility functions

function getLastSyncDate() {
  try {
    const syncFile = '.last-doc-sync';
    const lastSync = fs.readFileSync(syncFile, 'utf8');
    return lastSync.trim();
  } catch {
    return '1 week ago';
  }
}

function extractScope(message) {
  const scopeMatch = message.match(/\\(([^)]+)\\)/);
  return scopeMatch ? scopeMatch[1] : null;
}

function categorizeLearning(learning) {
  const categories = {
    performance: ['performance', 'speed', 'optimization', 'cache', 'latency'],
    security: ['security', 'auth', 'vulnerability', 'encryption', 'token'],
    architecture: ['architecture', 'design', 'pattern', 'structure', 'modular'],
    process: ['process', 'workflow', 'automation', 'efficiency', 'team'],
    tooling: ['tool', 'framework', 'library', 'integration', 'api'],
    quality: ['quality', 'testing', 'coverage', 'reliability', 'stability'],
  };

  const lowerLearning = learning.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some((keyword) => lowerLearning.includes(keyword))) {
      return category;
    }
  }
  return 'general';
}

function assessLearningImpact(learning) {
  const highImpact = ['70%', '80%', '90%', 'significant', 'major', 'critical'];
  const mediumImpact = ['30%', '40%', '50%', 'moderate', 'noticeable'];

  const lowerLearning = learning.toLowerCase();
  if (highImpact.some((term) => lowerLearning.includes(term))) return 'high';
  if (mediumImpact.some((term) => lowerLearning.includes(term))) return 'medium';
  return 'low';
}

function isActionableLearning(learning) {
  const actionableKeywords = ['implement', 'use', 'apply', 'adopt', 'change', 'improve'];
  const lowerLearning = learning.toLowerCase();
  return actionableKeywords.some((keyword) => lowerLearning.includes(keyword));
}

async function saveLearningsData(learnings) {
  const learningsFile = path.join(CONFIG.docsPath, 'analysis-reports', 'extracted-learnings.json');
  await fs.writeFile(learningsFile, JSON.stringify(learnings, null, 2));
}

async function saveVelocityData(velocityData) {
  await fs.writeFile(CONFIG.velocityDataPath, JSON.stringify(velocityData, null, 2));
}

// Mock implementations for complex functions (would be implemented based on specific needs)

async function getSprintFiles() {
  const files = await fs.readdir(CONFIG.sprintPlansPath);
  return files.filter((f) => f.endsWith('.md')).map((f) => path.join(CONFIG.sprintPlansPath, f));
}

async function parseSprintFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return parseSprintContent(content);
}

function parseSprintContent(content) {
  // Mock implementation - would parse markdown content for sprint data
  return {
    id: 'sprint-1',
    plannedPoints: 60,
    stories: [],
    blockers: [],
    endDate: new Date(),
  };
}

function calculateSprintVelocity(sprintData) {
  // Mock implementation - would calculate actual velocity metrics
  return {
    completedPoints: sprintData.plannedPoints * 0.85,
    accuracy: 85,
    trend: 'stable',
  };
}

function calculateOverallVelocityMetrics(sprints) {
  // Mock implementation - would calculate trends and predictions
  return {
    averageVelocity: 52,
    trend: 'increasing',
    predictability: 85,
  };
}

function generateSummaryReport(data) {
  return {
    timestamp: new Date(),
    summary: {
      learningsExtracted: data.learnings.length,
      velocitySprintsUpdated: data.velocityData.sprints.length,
      sprintDocumentsUpdated: data.sprintUpdates.length,
      knowledgeDocumentsUpdated: data.knowledgeUpdates.length,
      reportsGenerated: data.reports.length,
      linksValidated: data.linkValidation.totalLinks,
      processDocumentsUpdated: data.processUpdates.length,
    },
    nextActions: generateNextActions(data),
  };
}

function generateNextActions(data) {
  const actions = [];

  if (data.learnings.filter((l) => l.actionable).length > 0) {
    actions.push('Review actionable learnings and create implementation tasks');
  }

  if (data.velocityData.overall.trend === 'decreasing') {
    actions.push('Investigate velocity decrease and identify improvement opportunities');
  }

  if (data.linkValidation.brokenLinks > 0) {
    actions.push(`Fix ${data.linkValidation.brokenLinks} remaining broken documentation links`);
  }

  return actions;
}

async function saveSummaryReport(summary) {
  const reportPath = path.join(CONFIG.docsPath, 'analysis-reports', 'automation-summary.json');
  await fs.writeFile(reportPath, JSON.stringify(summary, null, 2));
}

// Additional utility functions would be implemented here...

// Run the automation system
if (require.main === module) {
  runAutomatedDocumentationSystem().catch(console.error);
}

module.exports = {
  runAutomatedDocumentationSystem,
  extractCommitLearnings,
  updateVelocityMetrics,
  syncSprintDocumentation,
  updateKnowledgeBase,
};
