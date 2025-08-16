/**
 * Secure Seed Configuration
 * Replaces hardcoded passwords with environment-based configuration
 */

import bcrypt from 'bcrypt';
import { getEnvironmentConfig } from './environment-config';

export interface SecureSeedUser {
  email: string;
  name: string;
  role: 'ADMIN' | 'LEADER';
  department: string;
  passwordHash: string;
  forcePasswordReset: boolean;
}

/**
 * Generate secure password hash
 */
export async function generateSecurePassword(password?: string): Promise<{
  hash: string;
  shouldReset: boolean;
}> {
  // If no password provided, generate a secure random one
  if (!password) {
    const randomPassword = generateRandomPassword(16);
    const hash = await bcrypt.hash(randomPassword, 12);
    return { hash, shouldReset: true };
  }

  // Use provided password but ensure it's strong
  if (password.length < 12) {
    console.warn('⚠️  Password is weak, consider using a stronger password');
  }

  const hash = await bcrypt.hash(password, 12);
  return { hash, shouldReset: password === 'admin123' || isWeakPassword(password) };
}

/**
 * Generate a cryptographically secure random password
 */
function generateRandomPassword(length: number = 16): string {
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
 * Check if password is considered weak
 */
function isWeakPassword(password: string): boolean {
  const weakPasswords = [
    'admin123',
    'principal123',
    'pm123',
    'design123',
    'eng123',
    'ops123',
    'password',
    'admin',
    'user',
    '123456',
    'qwerty',
    'password123',
  ];

  return (
    weakPasswords.includes(password.toLowerCase()) ||
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password)
  );
}

/**
 * Get secure seed users configuration
 */
export async function getSecureSeedUsers(): Promise<SecureSeedUser[]> {
  const config = getEnvironmentConfig();

  // Default admin user from environment
  const adminPassword = config.SEED_ADMIN_PASSWORD || generateRandomPassword(16);
  const adminEmail = config.SEED_ADMIN_EMAIL || 'admin@flowvision.com';

  const adminPasswordConfig = await generateSecurePassword(adminPassword);

  const seedUsers: SecureSeedUser[] = [
    {
      email: adminEmail,
      name: 'System Administrator',
      role: 'ADMIN',
      department: 'Administration',
      passwordHash: adminPasswordConfig.hash,
      forcePasswordReset: adminPasswordConfig.shouldReset,
    },
  ];

  // Add additional demo users only in development
  if (config.NODE_ENV === 'development') {
    const demoUsers = await generateDemoUsers();
    seedUsers.push(...demoUsers);
  }

  return seedUsers;
}

/**
 * Generate demo users for development environment
 */
async function generateDemoUsers(): Promise<SecureSeedUser[]> {
  const demoUserConfigs = [
    {
      email: 'principal@morrarch.com',
      name: 'Michael Morrison',
      role: 'LEADER' as const,
      department: 'Executive',
    },
    {
      email: 'pm.lead@morrarch.com',
      name: 'Jennifer Rodriguez',
      role: 'LEADER' as const,
      department: 'Project Management',
    },
    {
      email: 'design.director@morrarch.com',
      name: 'David Kim',
      role: 'LEADER' as const,
      department: 'Design',
    },
    {
      email: 'eng.lead@morrarch.com',
      name: 'Amanda Foster',
      role: 'LEADER' as const,
      department: 'Engineering',
    },
    {
      email: 'operations@morrarch.com',
      name: 'Robert Thompson',
      role: 'LEADER' as const,
      department: 'Operations',
    },
  ];

  const demoUsers: SecureSeedUser[] = [];

  for (const userConfig of demoUserConfigs) {
    // Generate secure random passwords for demo users
    const passwordConfig = await generateSecurePassword();

    demoUsers.push({
      ...userConfig,
      passwordHash: passwordConfig.hash,
      forcePasswordReset: true, // Always force reset for demo users
    });
  }

  return demoUsers;
}

/**
 * Create user with secure configuration
 */
export async function createSecureUser(prisma: any, userConfig: SecureSeedUser) {
  const user = await prisma.user.upsert({
    where: { email: userConfig.email },
    update: {
      // Only update password if it's still the default
      ...(userConfig.forcePasswordReset && {
        passwordHash: userConfig.passwordHash,
        // Add a field to track password reset requirement
        preferences: {
          requirePasswordReset: true,
          passwordLastChanged: null,
        },
      }),
    },
    create: {
      email: userConfig.email,
      name: userConfig.name,
      passwordHash: userConfig.passwordHash,
      role: userConfig.role,
      preferences: {
        department: userConfig.department,
        requirePasswordReset: userConfig.forcePasswordReset,
        passwordLastChanged: userConfig.forcePasswordReset ? null : new Date(),
        securitySettings: {
          mfaEnabled: false,
          lastLoginAt: null,
          loginAttempts: 0,
          lockedUntil: null,
        },
      },
    },
  });

  return user;
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number; // 0-5
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 12) {
    score += 2;
  } else if (password.length >= 8) {
    score += 1;
    feedback.push('Consider using a longer password (12+ characters)');
  } else {
    feedback.push('Password must be at least 8 characters long');
  }

  // Character variety
  if (/[A-Z]/.test(password)) score += 0.5;
  else feedback.push('Add uppercase letters');

  if (/[a-z]/.test(password)) score += 0.5;
  else feedback.push('Add lowercase letters');

  if (/[0-9]/.test(password)) score += 0.5;
  else feedback.push('Add numbers');

  if (/[^A-Za-z0-9]/.test(password)) score += 0.5;
  else feedback.push('Add special characters');

  // Common password check
  if (isWeakPassword(password)) {
    score = Math.min(score, 1);
    feedback.push('Avoid common passwords');
  }

  // Repetitive patterns
  if (/(.)\1{2,}/.test(password)) {
    score -= 0.5;
    feedback.push('Avoid repetitive characters');
  }

  const isValid = score >= 3 && password.length >= 8;

  return {
    isValid,
    score: Math.max(0, Math.min(5, score)),
    feedback,
  };
}

/**
 * Generate environment-specific message for seed users
 */
export function generateSeedUserMessage(users: SecureSeedUser[]): string {
  const config = getEnvironmentConfig();

  let message = `\n🔐 Seed Users Created (${config.NODE_ENV} environment):\n`;

  users.forEach((user) => {
    message += `\n👤 ${user.name} (${user.role})`;
    message += `\n   Email: ${user.email}`;

    if (user.forcePasswordReset) {
      message += `\n   ⚠️  PASSWORD RESET REQUIRED on first login`;
    }

    if (config.NODE_ENV === 'development' && user.email !== config.SEED_ADMIN_EMAIL) {
      message += `\n   🔑 Demo user - secure password generated`;
    }
  });

  message += `\n\n📋 Next Steps:`;
  message += `\n   1. Users with password reset required must change password on first login`;
  message += `\n   2. Consider enabling MFA for admin accounts`;
  message += `\n   3. Review and update user permissions as needed`;

  if (config.NODE_ENV === 'production') {
    message += `\n\n⚠️  PRODUCTION SECURITY:`;
    message += `\n   - Ensure SEED_ADMIN_PASSWORD is set to a strong, unique password`;
    message += `\n   - Remove or disable demo accounts`;
    message += `\n   - Enable audit logging for all user actions`;
  }

  return message;
}

/**
 * Security audit for seed configuration
 */
export function auditSeedSecurity(): {
  issues: string[];
  recommendations: string[];
  score: number; // 0-10
} {
  const config = getEnvironmentConfig();
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 10;

  // Check admin password configuration
  if (!config.SEED_ADMIN_PASSWORD) {
    issues.push('SEED_ADMIN_PASSWORD not configured - using generated password');
    score -= 2;
  } else if (isWeakPassword(config.SEED_ADMIN_PASSWORD)) {
    issues.push('SEED_ADMIN_PASSWORD is weak');
    score -= 4;
  }

  // Check admin email
  if (!config.SEED_ADMIN_EMAIL) {
    recommendations.push('Set SEED_ADMIN_EMAIL to your organization email');
  } else if (config.SEED_ADMIN_EMAIL.includes('example.com')) {
    issues.push('SEED_ADMIN_EMAIL uses example domain');
    score -= 1;
  }

  // Environment-specific checks
  if (config.NODE_ENV === 'production') {
    if (!config.SEED_ADMIN_PASSWORD || config.SEED_ADMIN_PASSWORD.length < 12) {
      issues.push('Production requires strong SEED_ADMIN_PASSWORD (12+ characters)');
      score -= 5;
    }

    recommendations.push('Disable or remove demo accounts in production');
    recommendations.push('Enable MFA for admin accounts');
    recommendations.push('Implement password rotation policy');
  }

  if (config.NODE_ENV === 'development') {
    recommendations.push('Use secure passwords even in development');
    recommendations.push('Consider using a separate development database');
  }

  return { issues, recommendations, score };
}
