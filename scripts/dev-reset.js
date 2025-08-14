#!/usr/bin/env node

/**
 * FlowVision Development Environment Reset Script
 *
 * This script resets the development environment with comprehensive seed data
 * demonstrating the full FlowVision lifecycle from issues to initiatives.
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 FlowVision Development Environment Reset');
console.log('==========================================');

try {
  // Change to project root directory
  process.chdir(path.join(__dirname, '..'));

  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  console.log('🗄️  Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('🔄 Resetting database...');
  execSync('npx prisma db push --force-reset', { stdio: 'inherit' });

  console.log('🌱 Seeding comprehensive FlowVision data...');
  execSync('npm run prisma:seed:comprehensive', { stdio: 'inherit' });

  console.log('🧹 Clearing Next.js cache...');
  execSync('rm -rf .next', { stdio: 'inherit' });

  console.log('');
  console.log('✅ Development environment reset complete!');
  console.log('');
  console.log('🚀 Database populated with:');
  console.log('   • Real employee feedback issues (42 issues across 7 categories)');
  console.log('   • Strategic issue clusters with AI analysis');
  console.log('   • 4 comprehensive strategic initiatives');
  console.log('   • Multiple solutions per initiative in various stages');
  console.log('   • Detailed tasks with realistic progress tracking');
  console.log('   • Improvement ideas for future consideration');
  console.log('');
  console.log('🎯 Full FlowVision lifecycle demonstrated:');
  console.log('   📝 Issue Identification → 🧩 AI Clustering → 🎯 Strategic Initiatives');
  console.log('   → 💡 Solution Development → ✅ Task Execution → 📊 Progress Tracking');
  console.log('');
  console.log('🏃‍♂️ Ready to start development:');
  console.log('   npm run dev');
  console.log('');
} catch (error) {
  console.error('❌ Reset failed:', error.message);
  process.exit(1);
}
