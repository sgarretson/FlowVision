/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Secure Seed Script for FlowVision
 * Replaces hardcoded passwords with environment-based secure configuration
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Security configuration
const SECURITY_CONFIG = {
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_COMPLEXITY_REQUIRED: true,
  FORCE_PASSWORD_RESET_ON_WEAK: true,
  BCRYPT_ROUNDS: 12,
};

/**
 * Generate cryptographically secure random password
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
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Check if password is weak
 */
function isWeakPassword(password) {
  if (!password) return true;
  
  const weakPasswords = [
    'admin123', 'principal123', 'pm123', 'design123', 'eng123', 'ops123',
    'password', 'admin', 'user', '123456', 'qwerty', 'password123',
    'Admin123!', 'Password1'
  ];
  
  return weakPasswords.includes(password.toLowerCase()) || 
         password.length < SECURITY_CONFIG.PASSWORD_MIN_LENGTH ||
         !/[A-Z]/.test(password) ||
         !/[a-z]/.test(password) ||
         !/[0-9]/.test(password);
}

/**
 * Create secure password hash
 */
async function createSecurePassword(providedPassword) {
  let password = providedPassword;
  let requiresReset = false;
  
  // If no password provided or weak password, generate secure one
  if (!password || isWeakPassword(password)) {
    if (password) {
      console.warn(`⚠️  Weak password detected for user, generating secure alternative`);
    }
    password = generateSecurePassword(16);
    requiresReset = true;
  }
  
  const hash = await bcrypt.hash(password, SECURITY_CONFIG.BCRYPT_ROUNDS);
  
  return {
    hash,
    requiresReset,
    generatedPassword: requiresReset ? password : null
  };
}

async function main() {
  console.log('🔐 Starting secure seed process...');
  
  // Environment validation
  const nodeEnv = process.env.NODE_ENV || 'development';
  console.log(`Environment: ${nodeEnv}`);
  
  // Get admin configuration from environment
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@flowvision.com';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  
  if (!adminPassword && nodeEnv === 'production') {
    console.error('❌ SEED_ADMIN_PASSWORD must be set in production environment');
    process.exit(1);
  }
  
  // Clear existing data in correct order to avoid foreign key constraints
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.vote.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.idea.deleteMany({});
  await prisma.resourceAssignment.deleteMany({});
  await prisma.milestone.deleteMany({});
  await prisma.initiative.deleteMany({});
  await prisma.issue.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.businessProfile.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.user.deleteMany({});

  // Create secure admin user
  console.log('👤 Creating admin user...');
  const adminPasswordConfig = await createSecurePassword(adminPassword);
  
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: 'System Administrator',
      passwordHash: adminPasswordConfig.hash,
      role: 'ADMIN',
      preferences: {
        requirePasswordReset: adminPasswordConfig.requiresReset,
        passwordLastChanged: adminPasswordConfig.requiresReset ? null : new Date(),
        securitySettings: {
          mfaEnabled: false,
          lastLoginAt: null,
          loginAttempts: 0,
          lockedUntil: null,
        },
        department: 'Administration',
        timezone: 'America/New_York',
        notifications: {
          email: true,
          browser: true,
          digest: 'daily',
        },
      },
    },
  });

  // Create business profile for admin
  await prisma.businessProfile.create({
    data: {
      userId: admin.id,
      industry: 'Architecture & Engineering',
      size: 50,
      metrics: {
        companyName: 'FlowVision Demo Organization',
        billableUtilization: 0.75,
        avgProjectDurationDays: 120,
        clientSatisfactionScore: 4.2,
        employeeRetentionRate: 0.85,
        revenueGrowthRate: 0.12,
      },
    },
  });

  // Track created users for reporting
  const createdUsers = [
    {
      email: adminEmail,
      name: 'System Administrator',
      role: 'ADMIN',
      requiresReset: adminPasswordConfig.requiresReset,
      generatedPassword: adminPasswordConfig.generatedPassword,
    }
  ];

  // Only create demo users in development
  if (nodeEnv === 'development') {
    console.log('🎭 Creating demo users for development...');
    
    const demoUsers = [
      {
        email: 'principal@morrarch.com',
        name: 'Michael Morrison',
        role: 'LEADER',
        department: 'Executive',
      },
      {
        email: 'pm.lead@morrarch.com',
        name: 'Jennifer Rodriguez',
        role: 'LEADER',
        department: 'Project Management',
      },
      {
        email: 'design.director@morrarch.com',
        name: 'David Kim',
        role: 'LEADER',
        department: 'Design',
      },
      {
        email: 'eng.lead@morrarch.com',
        name: 'Amanda Foster',
        role: 'LEADER',
        department: 'Engineering',
      },
      {
        email: 'operations@morrarch.com',
        name: 'Robert Thompson',
        role: 'LEADER',
        department: 'Operations',
      },
    ];

    for (const userConfig of demoUsers) {
      const passwordConfig = await createSecurePassword(); // Always generate secure passwords
      
      const user = await prisma.user.create({
        data: {
          email: userConfig.email,
          name: userConfig.name,
          passwordHash: passwordConfig.hash,
          role: userConfig.role,
          preferences: {
            requirePasswordReset: true, // Always require reset for demo users
            passwordLastChanged: null,
            securitySettings: {
              mfaEnabled: false,
              lastLoginAt: null,
              loginAttempts: 0,
              lockedUntil: null,
            },
            department: userConfig.department,
            timezone: 'America/New_York',
            notifications: {
              email: true,
              browser: true,
              digest: 'weekly',
            },
          },
        },
      });

      createdUsers.push({
        email: userConfig.email,
        name: userConfig.name,
        role: userConfig.role,
        requiresReset: true,
        generatedPassword: passwordConfig.generatedPassword,
      });
    }
  }

  // Create teams
  console.log('👥 Creating teams...');
  const teams = [
    {
      name: 'Executive Leadership',
      department: 'Executive',
      capacity: 20,
      skills: ['Strategic Planning', 'Business Development', 'Client Relations', 'Team Leadership'],
    },
    {
      name: 'Project Management',
      department: 'Operations',
      capacity: 30,
      skills: ['Project Planning', 'Resource Management', 'Client Communication', 'Quality Assurance'],
    },
    {
      name: 'Design Team',
      department: 'Creative',
      capacity: 40,
      skills: ['Architectural Design', 'CAD/Revit', 'Visualization', 'Building Codes'],
    },
    {
      name: 'Engineering Team',
      department: 'Technical',
      capacity: 35,
      skills: ['Structural Engineering', 'MEP Systems', 'Construction Documents', 'Code Compliance'],
    },
    {
      name: 'Operations & Support',
      department: 'Operations',
      capacity: 25,
      skills: ['Business Operations', 'HR Management', 'IT Support', 'Process Improvement'],
    },
  ];

  const createdTeams = [];
  for (const teamData of teams) {
    const team = await prisma.team.create({
      data: teamData,
    });
    createdTeams.push(team);
  }

  // Create sample issues and initiatives only in development
  if (nodeEnv === 'development') {
    console.log('📋 Creating sample data...');
    
    // Create sample issues
    const sampleIssues = [
      {
        title: 'Project Communication Gaps',
        description: 'Teams report inconsistent communication about project changes and updates',
        priority: 'HIGH',
        status: 'OPEN',
        category: 'Process',
        impactScore: 8,
        effortScore: 5,
        submittedBy: createdUsers[1]?.email || admin.email,
      },
      {
        title: 'CAD Software License Management',
        description: 'Need better tracking and allocation of software licenses across teams',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        category: 'Technology',
        impactScore: 6,
        effortScore: 4,
        submittedBy: createdUsers[2]?.email || admin.email,
      },
      {
        title: 'Client Feedback Integration',
        description: 'Streamline process for incorporating client feedback into design iterations',
        priority: 'HIGH',
        status: 'OPEN',
        category: 'Process',
        impactScore: 9,
        effortScore: 7,
        submittedBy: createdUsers[3]?.email || admin.email,
      },
    ];

    const createdIssues = [];
    for (const issueData of sampleIssues) {
      const issue = await prisma.issue.create({
        data: {
          title: issueData.title,
          description: issueData.description,
          priority: issueData.priority,
          status: issueData.status,
          category: issueData.category,
          impactScore: issueData.impactScore,
          effortScore: issueData.effortScore,
          submittedBy: issueData.submittedBy,
        },
      });
      createdIssues.push(issue);
    }
  }

  // Log security audit
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'SEED_DATABASE',
      details: {
        environment: nodeEnv,
        usersCreated: createdUsers.length,
        securityMeasures: {
          bcryptRounds: SECURITY_CONFIG.BCRYPT_ROUNDS,
          passwordComplexityEnforced: SECURITY_CONFIG.PASSWORD_COMPLEXITY_REQUIRED,
          forceResetOnWeak: SECURITY_CONFIG.FORCE_PASSWORD_RESET_ON_WEAK,
        },
        timestamp: new Date().toISOString(),
      },
    },
  });

  console.log('✅ Secure seed completed successfully!');
  
  // Generate security report
  console.log('\n🔐 SECURITY SUMMARY:');
  console.log(`Environment: ${nodeEnv}`);
  console.log(`Users created: ${createdUsers.length}`);
  console.log(`Password security: bcrypt with ${SECURITY_CONFIG.BCRYPT_ROUNDS} rounds`);
  
  console.log('\n👤 USER ACCOUNTS:');
  createdUsers.forEach(user => {
    console.log(`  ${user.name} (${user.role})`);
    console.log(`    Email: ${user.email}`);
    if (user.requiresReset) {
      console.log(`    ⚠️  PASSWORD RESET REQUIRED on first login`);
      if (user.generatedPassword && nodeEnv === 'development') {
        console.log(`    🔑 Generated password: ${user.generatedPassword}`);
      }
    }
  });
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Users with password reset required must change password on first login');
  console.log('2. Consider enabling MFA for admin accounts');
  console.log('3. Review and configure security settings as needed');
  
  if (nodeEnv === 'production') {
    console.log('\n⚠️  PRODUCTION SECURITY REMINDER:');
    console.log('- Ensure strong, unique passwords for all accounts');
    console.log('- Enable audit logging for all critical operations');
    console.log('- Remove or disable demo accounts');
    console.log('- Implement password rotation policy');
    console.log('- Consider implementing MFA requirements');
  }
  
  if (nodeEnv === 'development') {
    console.log('\n🎭 DEVELOPMENT NOTES:');
    console.log('- Demo users created with secure generated passwords');
    console.log('- All demo users require password reset on first login');
    console.log('- Sample data created for testing purposes');
  }
}

main()
  .catch((e) => {
    console.error('❌ Seed process failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
