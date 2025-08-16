#!/usr/bin/env node
/**
 * Security Initialization Script
 * Sets up secure environment configuration and validates security settings
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SECURITY_CONFIG = {
  ENV_TEMPLATE: `# FlowVision Environment Configuration
# Copy this file to .env.local and configure with your actual values

# =============================================================================
# REQUIRED CONFIGURATION
# =============================================================================

# Database (PostgreSQL recommended for production)
DATABASE_URL="postgresql://username:password@host:port/database"

# Authentication (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET="{{NEXTAUTH_SECRET}}"
NEXTAUTH_URL="http://localhost:3000"

# =============================================================================
# ADMIN CONFIGURATION
# =============================================================================

# Admin seed user (change in production!)
SEED_ADMIN_EMAIL="admin@yourdomain.com"
SEED_ADMIN_PASSWORD="{{ADMIN_PASSWORD}}"

# =============================================================================
# OPTIONAL SERVICES
# =============================================================================

# AI Services
OPENAI_API_KEY="sk-your-openai-api-key"

# Email SMTP
EMAIL_SERVER_HOST="smtp.yourdomain.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="noreply@yourdomain.com"
EMAIL_SERVER_PASSWORD="your-email-password"
EMAIL_FROM="noreply@yourdomain.com"

# File Storage (AWS S3)
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="flowvision-uploads"

# =============================================================================
# PRODUCTION SECURITY
# =============================================================================

# Rate limiting
RATE_LIMIT_ENABLED="true"
RATE_LIMIT_WINDOW="900000"  # 15 minutes
RATE_LIMIT_MAX="100"        # Max requests per window

# CORS
CORS_ORIGINS="https://yourdomain.com"

# Security headers
HSTS_MAX_AGE="31536000"

# Monitoring
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
SENTRY_DSN="your-sentry-dsn"
`,

  GITIGNORE_ENTRIES: [
    '# Environment files',
    '.env',
    '.env.local',
    '.env.development.local',
    '.env.test.local',
    '.env.production.local',
    '',
    '# Security files',
    '*.pem',
    '*.key',
    '*.crt',
    'secrets/',
    '',
  ],

  SECURITY_CHECKLIST: [
    '✅ Environment configuration created',
    '⚠️  Update .env.local with your actual values',
    '⚠️  Generate secure secrets with: openssl rand -base64 32',
    '⚠️  Set strong SEED_ADMIN_PASSWORD (12+ characters)',
    '⚠️  Configure database connection',
    '⚠️  Add OpenAI API key for AI features',
    '⚠️  Review and update CORS origins for production',
    '⚠️  Enable monitoring and error tracking',
  ],
};

/**
 * Generate cryptographically secure secret
 */
function generateSecureSecret(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

/**
 * Generate secure password
 */
function generateSecurePassword(length = 16) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';

  // Ensure at least one character from each required category
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
  password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special

  // Fill remaining length
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('');
}

/**
 * Check if .gitignore has security entries
 */
function updateGitignore() {
  const gitignorePath = path.join(process.cwd(), '.gitignore');

  if (!fs.existsSync(gitignorePath)) {
    console.log('⚠️  .gitignore not found, creating...');
    fs.writeFileSync(gitignorePath, SECURITY_CONFIG.GITIGNORE_ENTRIES.join('\n'));
    return;
  }

  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');

  // Check if security entries already exist
  if (!gitignoreContent.includes('.env.local')) {
    console.log('📝 Adding security entries to .gitignore...');
    fs.appendFileSync(gitignorePath, '\n' + SECURITY_CONFIG.GITIGNORE_ENTRIES.join('\n'));
  }
}

/**
 * Create environment template
 */
function createEnvironmentTemplate() {
  const envExamplePath = path.join(process.cwd(), '.env.example');

  // Generate secure values
  const nextAuthSecret = generateSecureSecret(32);
  const adminPassword = generateSecurePassword(16);

  // Replace placeholders in template
  let envContent = SECURITY_CONFIG.ENV_TEMPLATE.replace(
    '{{NEXTAUTH_SECRET}}',
    nextAuthSecret
  ).replace('{{ADMIN_PASSWORD}}', adminPassword);

  // Write template file
  fs.writeFileSync(envExamplePath, envContent);

  console.log('✅ Created .env.example template');

  // Check if .env.local exists
  const envLocalPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envLocalPath)) {
    console.log('📝 Creating .env.local from template...');
    fs.writeFileSync(envLocalPath, envContent);

    console.log('🔐 Generated secure credentials:');
    console.log(`   NEXTAUTH_SECRET: ${nextAuthSecret}`);
    console.log(`   SEED_ADMIN_PASSWORD: ${adminPassword}`);
    console.log('');
    console.log(
      '⚠️  IMPORTANT: Update .env.local with your actual database URL and other services'
    );
  } else {
    console.log('ℹ️  .env.local already exists, not overwriting');
    console.log('💡 Compare with .env.example for any missing configuration');
  }

  return { nextAuthSecret, adminPassword };
}

/**
 * Validate existing environment configuration
 */
function validateEnvironment() {
  const envLocalPath = path.join(process.cwd(), '.env.local');

  if (!fs.existsSync(envLocalPath)) {
    console.log('❌ .env.local not found');
    return false;
  }

  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const issues = [];

  // Check required variables
  const requiredVars = ['DATABASE_URL', 'NEXTAUTH_SECRET', 'NEXTAUTH_URL'];
  requiredVars.forEach((varName) => {
    if (!envContent.includes(varName) || envContent.match(new RegExp(`${varName}=.*your-.*`))) {
      issues.push(`${varName} not properly configured`);
    }
  });

  // Check NEXTAUTH_SECRET length
  const secretMatch = envContent.match(/NEXTAUTH_SECRET="([^"]+)"/);
  if (secretMatch && secretMatch[1].length < 32) {
    issues.push('NEXTAUTH_SECRET should be at least 32 characters');
  }

  // Check for placeholder values
  const placeholders = ['your-', 'username:password@host', 'sk-your-openai'];
  placeholders.forEach((placeholder) => {
    if (envContent.includes(placeholder)) {
      issues.push(`Replace placeholder values containing "${placeholder}"`);
    }
  });

  if (issues.length > 0) {
    console.log('❌ Environment validation issues:');
    issues.forEach((issue) => console.log(`   - ${issue}`));
    return false;
  }

  console.log('✅ Environment configuration validated');
  return true;
}

/**
 * Security audit
 */
function performSecurityAudit() {
  console.log('🔍 Performing security audit...');

  const issues = [];
  const recommendations = [];

  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion < 18) {
    issues.push(`Node.js version ${nodeVersion} is outdated (recommend 18+)`);
  }

  // Check package.json for security scripts
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    if (!packageJson.scripts?.audit) {
      recommendations.push(
        'Add "audit": "npm audit --audit-level moderate" to package.json scripts'
      );
    }

    if (!packageJson.scripts?.['security:check']) {
      recommendations.push('Consider adding security check scripts');
    }
  }

  // Check for secure headers middleware
  const middlewarePath = path.join(process.cwd(), 'middleware.ts');
  if (!fs.existsSync(middlewarePath)) {
    issues.push('Security middleware not found');
  }

  // Check Dockerfile security
  const dockerfilePath = path.join(process.cwd(), 'Dockerfile');
  if (fs.existsSync(dockerfilePath)) {
    const dockerContent = fs.readFileSync(dockerfilePath, 'utf8');
    if (dockerContent.includes('USER root') || !dockerContent.includes('USER ')) {
      issues.push('Dockerfile should use non-root user');
    }
  }

  // Report results
  if (issues.length > 0) {
    console.log('❌ Security issues found:');
    issues.forEach((issue) => console.log(`   - ${issue}`));
  }

  if (recommendations.length > 0) {
    console.log('💡 Security recommendations:');
    recommendations.forEach((rec) => console.log(`   - ${rec}`));
  }

  if (issues.length === 0) {
    console.log('✅ No critical security issues found');
  }

  return { issues, recommendations };
}

/**
 * Main initialization function
 */
async function initializeSecurity() {
  console.log('🔐 FlowVision Security Initialization\n');

  try {
    // 1. Update .gitignore
    updateGitignore();

    // 2. Create environment template
    const credentials = createEnvironmentTemplate();

    // 3. Validate environment
    const envValid = validateEnvironment();

    // 4. Perform security audit
    const auditResults = performSecurityAudit();

    // 5. Display security checklist
    console.log('\n📋 Security Checklist:');
    SECURITY_CONFIG.SECURITY_CHECKLIST.forEach((item) => {
      console.log(`   ${item}`);
    });

    // 6. Next steps
    console.log('\n🚀 Next Steps:');
    console.log('   1. Review and update .env.local with your actual values');
    console.log('   2. Set up your database connection');
    console.log('   3. Configure any optional services (OpenAI, Email, etc.)');
    console.log('   4. Run: npm run prisma:migrate');
    console.log('   5. Run: npm run prisma:seed:secure');
    console.log('   6. Start development: npm run dev');

    if (!envValid) {
      console.log('\n⚠️  Environment configuration needs attention before proceeding');
    }

    if (auditResults.issues.length > 0) {
      console.log('\n⚠️  Address security issues before production deployment');
    }

    console.log('\n📚 Documentation:');
    console.log('   - Security Guide: SECURITY_AUDIT_REPORT.md');
    console.log('   - Environment Config: lib/environment-config.ts');
    console.log('   - Secure Seeding: lib/secure-seed-config.ts');
  } catch (error) {
    console.error('❌ Security initialization failed:', error);
    process.exit(1);
  }
}

/**
 * CLI interface
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'audit':
      performSecurityAudit();
      break;
    case 'validate':
      validateEnvironment();
      break;
    case 'template':
      createEnvironmentTemplate();
      break;
    default:
      initializeSecurity();
  }
}

module.exports = {
  initializeSecurity,
  performSecurityAudit,
  validateEnvironment,
  createEnvironmentTemplate,
  generateSecureSecret,
  generateSecurePassword,
};
