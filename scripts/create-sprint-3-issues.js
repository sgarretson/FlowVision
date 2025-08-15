/**
 * GitHub Issues Creation Script for Sprint 3: System Configuration
 *
 * This script creates all the GitHub issues for Sprint 3 following our standard process.
 * Run with: node scripts/create-sprint-3-issues.js
 */

const stories = [
  {
    title: 'Story 3.1: SystemConfiguration Database Schema',
    body: `## 📋 Story Overview
**Points**: 5
**Sprint**: Sprint 3 - System Configuration Management
**Assigned**: Technical Architect + Senior Full-Stack Developer
**Priority**: 🔴 Critical

## 🎯 Acceptance Criteria
- [ ] Create \`SystemConfiguration\` table with proper constraints
- [ ] Add database migration script
- [ ] Implement unique constraints on (category, key)
- [ ] Add proper indexing for performance
- [ ] Include audit fields (updatedBy, updatedAt)
- [ ] Test migration with existing data

## 📝 Tasks
- [ ] Design schema with JSON value storage
- [ ] Create Prisma schema definition
- [ ] Generate and test migration
- [ ] Add seed data for default configurations
- [ ] Validate schema with production constraints

## 🔗 Related
- Part of Sprint 3: System Configuration Management
- Addresses hardcoded values audit findings
- Foundation for Stories 3.2, 3.3, 3.4

## ✅ Definition of Done
- [ ] Database schema is implemented and tested
- [ ] Migration script works with existing data
- [ ] All constraints and indexes are properly configured
- [ ] Seed data is available for testing
- [ ] Code review completed and approved`,
    labels: ['sprint-3', 'story', 'database', 'critical', 'backend'],
    assignees: [],
    milestone: null,
  },
  {
    title: 'Story 3.2: Configuration Service Implementation',
    body: `## 📋 Story Overview
**Points**: 8
**Sprint**: Sprint 3 - System Configuration Management
**Assigned**: Senior Full-Stack Developer + AI/ML Architect
**Priority**: 🔴 Critical

## 🎯 Acceptance Criteria
- [ ] Implement \`SystemConfigService\` with caching
- [ ] Support typed configuration retrieval
- [ ] Cache invalidation on configuration changes
- [ ] Environment-specific configuration support
- [ ] Real-time configuration updates
- [ ] Error handling and fallback mechanisms

## 📝 Tasks
- [ ] Create \`lib/system-config.ts\` service
- [ ] Implement Redis/memory caching layer
- [ ] Add TypeScript interfaces for configuration types
- [ ] Create configuration loading utilities
- [ ] Add configuration change event system
- [ ] Implement service health monitoring

## 🔗 Related
- Depends on Story 3.1 (Database Schema)
- Enables Stories 3.3 and 3.4
- Critical for eliminating hardcoded values

## ✅ Definition of Done
- [ ] Configuration service is fully functional
- [ ] Caching layer is operational and tested
- [ ] TypeScript types are properly defined
- [ ] Error handling covers all edge cases
- [ ] Performance meets requirements (<100ms lookup)
- [ ] Code review completed and approved`,
    labels: ['sprint-3', 'story', 'service', 'critical', 'backend', 'caching'],
    assignees: [],
    milestone: null,
  },
  {
    title: 'Story 3.3: Critical Scoring Migration',
    body: `## 📋 Story Overview
**Points**: 5
**Sprint**: Sprint 3 - System Configuration Management
**Assigned**: Senior Full-Stack Developer + Data Scientist
**Priority**: 🟡 High

## 🎯 Acceptance Criteria
- [ ] Replace hardcoded issue scoring thresholds (80/60/40)
- [ ] Migrate form validation scoring thresholds
- [ ] Update all related UI components
- [ ] Maintain backward compatibility
- [ ] Add configuration for color mappings
- [ ] Test scoring accuracy with existing data

## 📝 Tasks
- [ ] Identify all hardcoded scoring references
- [ ] Create configuration entries for thresholds
- [ ] Update \`app/issues/page.tsx\` scoring logic
- [ ] Update \`components/SmartFormValidation.tsx\`
- [ ] Add configuration-driven color mapping
- [ ] Validate scoring behavior with test data

## 🔗 Related
- Depends on Stories 3.1 and 3.2
- Addresses critical hardcoded business logic
- Direct impact on user experience

## ✅ Definition of Done
- [ ] No hardcoded scoring thresholds remain
- [ ] All scoring logic uses configuration service
- [ ] UI reflects configuration changes in real-time
- [ ] Existing scoring behavior is maintained
- [ ] All tests pass with new configuration
- [ ] Code review completed and approved`,
    labels: ['sprint-3', 'story', 'frontend', 'business-logic', 'high'],
    assignees: [],
    milestone: null,
  },
  {
    title: 'Story 3.4: Admin Configuration Interface',
    body: `## 📋 Story Overview
**Points**: 2
**Sprint**: Sprint 3 - System Configuration Management
**Assigned**: Product Manager + Senior Full-Stack Developer
**Priority**: 🟡 High

## 🎯 Acceptance Criteria
- [ ] Create \`/admin/system-config\` page
- [ ] Category-based configuration management
- [ ] Real-time preview of configuration changes
- [ ] Input validation and error handling
- [ ] Configuration change audit trail
- [ ] Role-based access control

## 📝 Tasks
- [ ] Design admin interface wireframes
- [ ] Implement configuration management UI
- [ ] Add form validation and error states
- [ ] Create configuration preview functionality
- [ ] Implement change tracking and audit
- [ ] Add admin role verification

## 🔗 Related
- Depends on Stories 3.1 and 3.2
- Enables business user self-service
- Foundation for future admin features

## ✅ Definition of Done
- [ ] Admin interface is functional and intuitive
- [ ] Configuration changes work in real-time
- [ ] Input validation prevents invalid configurations
- [ ] Audit trail tracks all changes
- [ ] Only admin users can access the interface
- [ ] Code review completed and approved`,
    labels: ['sprint-3', 'story', 'frontend', 'admin', 'ui', 'high'],
    assignees: [],
    milestone: null,
  },
];

console.log('🚀 Sprint 3 GitHub Issues Creation Plan');
console.log('=====================================');
console.log('');

console.log('📋 Stories to Create:');
stories.forEach((story, index) => {
  console.log(`${index + 1}. ${story.title}`);
  console.log(`   Labels: ${story.labels.join(', ')}`);
  console.log(`   Points: ${story.body.match(/\*\*Points\*\*: (\d+)/)?.[1] || 'Not specified'}`);
  console.log('');
});

console.log('🎯 Next Steps:');
console.log('1. Create these issues manually in GitHub or use GitHub CLI');
console.log('2. Set up Sprint 3 project board');
console.log('3. Assign team members to appropriate stories');
console.log('4. Create milestone for Sprint 3');
console.log('5. Link issues to the sprint execution plan');
console.log('');

console.log('💡 GitHub CLI Commands (if available):');
console.log('# Create each issue:');
stories.forEach((story, index) => {
  const labelsStr = story.labels.map((l) => `"${l}"`).join(' ');
  console.log(
    `gh issue create --title "${story.title}" --body-file - --label ${labelsStr} << 'EOF'`
  );
  console.log(story.body);
  console.log('EOF');
  console.log('');
});

console.log('✅ Sprint 3 setup will be complete once issues are created!');
