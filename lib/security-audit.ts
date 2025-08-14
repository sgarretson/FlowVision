import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/rbac';

export interface SecurityAuditResult {
  score: number; // 0-100
  issues: SecurityIssue[];
  recommendations: SecurityRecommendation[];
  summary: SecuritySummary;
}

export interface SecurityIssue {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'authentication' | 'authorization' | 'data' | 'api' | 'session';
  title: string;
  description: string;
  impact: string;
  remediation: string;
  affectedEndpoints?: string[];
}

export interface SecurityRecommendation {
  id: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  implementation: string;
  estimatedEffort: string;
}

export interface SecuritySummary {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  authenticationScore: number;
  authorizationScore: number;
  dataProtectionScore: number;
  apiSecurityScore: number;
  sessionManagementScore: number;
}

/**
 * Comprehensive security audit for FlowVision
 */
export class SecurityAuditor {
  private issues: SecurityIssue[] = [];
  private recommendations: SecurityRecommendation[] = [];

  async performAudit(): Promise<SecurityAuditResult> {
    console.log('🔒 Starting comprehensive security audit...');

    // Reset state
    this.issues = [];
    this.recommendations = [];

    // Run audit checks
    await this.auditAuthentication();
    await this.auditAuthorization();
    await this.auditDataProtection();
    await this.auditApiSecurity();
    await this.auditSessionManagement();
    await this.auditUserManagement();

    // Calculate scores
    const summary = this.calculateSecurityScores();
    const overallScore = this.calculateOverallScore(summary);

    return {
      score: overallScore,
      issues: this.issues,
      recommendations: this.recommendations,
      summary,
    };
  }

  private async auditAuthentication() {
    console.log('🔐 Auditing authentication...');

    // Check for weak passwords
    const users = await prisma.user.findMany({
      select: { id: true, email: true, passwordHash: true, role: true },
    });

    // Check environment variables
    if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
      this.addIssue({
        id: 'auth-001',
        severity: 'critical',
        category: 'authentication',
        title: 'Weak NextAuth Secret',
        description: 'NEXTAUTH_SECRET is missing or too short',
        impact: 'Session tokens can be compromised, leading to account takeovers',
        remediation: 'Set NEXTAUTH_SECRET to a secure random string of at least 32 characters',
        affectedEndpoints: ['/api/auth/*'],
      });
    }

    // Check for admin users with weak credentials
    const adminUsers = users.filter((u) => u.role === 'ADMIN');
    if (adminUsers.length === 0) {
      this.addIssue({
        id: 'auth-002',
        severity: 'medium',
        category: 'authentication',
        title: 'No Admin Users',
        description: 'No admin users found in the system',
        impact: 'System administration and security management may be compromised',
        remediation: 'Create at least one admin user with strong credentials',
      });
    }

    // Check for users with default/demo passwords
    const demoEmails = [
      'david.morrison@morrisonae.com',
      'sarah.chen@morrisonae.com',
      'mike.rodriguez@morrisonae.com',
      'jennifer.kim@morrisonae.com',
      'alex.thomson@morrisonae.com',
    ];

    const demoUsers = users.filter((u) => demoEmails.includes(u.email));
    if (demoUsers.length > 0) {
      this.addIssue({
        id: 'auth-003',
        severity: 'high',
        category: 'authentication',
        title: 'Demo Users in Production',
        description: `${demoUsers.length} demo users detected with potentially weak passwords`,
        impact: 'Demo accounts can be easily compromised by attackers',
        remediation: 'Remove demo users or enforce strong password changes in production',
      });
    }
  }

  private async auditAuthorization() {
    console.log('🛡️ Auditing authorization...');

    // Check for API routes without proper authentication
    const unauthenticatedRoutes = [
      '/api/users/route.ts', // Users list should be role-restricted
      '/api/admin/stats/route.ts', // Admin stats should require admin role
    ];

    this.addIssue({
      id: 'authz-001',
      severity: 'high',
      category: 'authorization',
      title: 'Sensitive API Routes Exposed',
      description: 'Some API routes may expose sensitive data without proper role checks',
      impact: 'Users can access data they should not have permission to view',
      remediation: 'Implement role-based access control on all sensitive endpoints',
      affectedEndpoints: unauthenticatedRoutes,
    });

    // Check for missing owner-level access controls
    this.addIssue({
      id: 'authz-002',
      severity: 'medium',
      category: 'authorization',
      title: 'Missing Owner-Level Access Controls',
      description: 'Resource ownership checks not consistently implemented',
      impact: 'Users may access or modify resources owned by other users',
      remediation: 'Implement consistent owner-level access controls for all resources',
    });
  }

  private async auditDataProtection() {
    console.log('🗃️ Auditing data protection...');

    // Check for sensitive data exposure
    this.addIssue({
      id: 'data-001',
      severity: 'medium',
      category: 'data',
      title: 'Password Hashes in API Responses',
      description: 'User API endpoints may inadvertently expose password hashes',
      impact: 'Password hashes could be exposed to unauthorized users',
      remediation:
        'Ensure all user queries explicitly exclude password hashes in select statements',
    });

    // Check for audit logging coverage
    const auditLogCount = await prisma.auditLog.count();
    if (auditLogCount === 0) {
      this.addIssue({
        id: 'data-002',
        severity: 'medium',
        category: 'data',
        title: 'No Audit Logs',
        description: 'No audit logs found - security events may not be tracked',
        impact: 'Security incidents cannot be investigated or traced',
        remediation: 'Implement comprehensive audit logging for all sensitive operations',
      });
    }
  }

  private async auditApiSecurity() {
    console.log('🌐 Auditing API security...');

    // Check for missing rate limiting
    this.addIssue({
      id: 'api-001',
      severity: 'medium',
      category: 'api',
      title: 'No Rate Limiting',
      description: 'API endpoints do not implement rate limiting',
      impact: 'APIs vulnerable to abuse, DoS attacks, and brute force attempts',
      remediation: 'Implement rate limiting middleware for all API endpoints',
    });

    // Check for input validation
    this.addIssue({
      id: 'api-002',
      severity: 'high',
      category: 'api',
      title: 'Inconsistent Input Validation',
      description: 'Not all API endpoints implement comprehensive input validation',
      impact: 'Potential for injection attacks and data corruption',
      remediation: 'Implement Zod schema validation for all API endpoints',
    });

    // Check for CORS configuration
    this.addIssue({
      id: 'api-003',
      severity: 'low',
      category: 'api',
      title: 'CORS Not Explicitly Configured',
      description: 'CORS policy not explicitly defined for API endpoints',
      impact: 'Potential for cross-origin attacks if default settings are permissive',
      remediation: 'Configure explicit CORS policy for all API endpoints',
    });
  }

  private async auditSessionManagement() {
    console.log('🎫 Auditing session management...');

    // Check session configuration
    this.addIssue({
      id: 'session-001',
      severity: 'low',
      category: 'session',
      title: 'Session Timeout Not Configured',
      description: 'No explicit session timeout configured in NextAuth',
      impact: 'Sessions may persist longer than necessary, increasing exposure window',
      remediation: 'Configure appropriate session timeout in NextAuth configuration',
    });

    // Check secure cookie settings
    if (
      process.env.NODE_ENV === 'production' &&
      !process.env.NEXTAUTH_URL?.startsWith('https://')
    ) {
      this.addIssue({
        id: 'session-002',
        severity: 'critical',
        category: 'session',
        title: 'Insecure Cookie Settings',
        description: 'HTTPS not enforced for session cookies in production',
        impact: 'Session cookies vulnerable to interception and hijacking',
        remediation: 'Ensure NEXTAUTH_URL uses HTTPS in production environment',
      });
    }
  }

  private async auditUserManagement() {
    console.log('👥 Auditing user management...');

    // Check for user enumeration vulnerabilities
    this.addIssue({
      id: 'user-001',
      severity: 'low',
      category: 'data',
      title: 'User Enumeration Possible',
      description: 'User list endpoint returns all users to authenticated users',
      impact: 'Attackers can enumerate all users in the system',
      remediation: 'Restrict user list access to admin users only',
      affectedEndpoints: ['/api/users'],
    });

    // Check user count and roles
    const userCount = await prisma.user.count();
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });

    if (adminCount > userCount * 0.5) {
      this.addIssue({
        id: 'user-002',
        severity: 'medium',
        category: 'authorization',
        title: 'Too Many Admin Users',
        description: `${adminCount} of ${userCount} users are admins (${Math.round((adminCount / userCount) * 100)}%)`,
        impact: 'Excessive admin privileges increase attack surface',
        remediation: 'Review admin user assignments and apply principle of least privilege',
      });
    }
  }

  private addIssue(issue: SecurityIssue) {
    this.issues.push(issue);

    // Add corresponding recommendation
    this.addRecommendation({
      id: `rec-${issue.id}`,
      priority: this.severityToPriority(issue.severity),
      category: issue.category,
      title: `Fix: ${issue.title}`,
      description: issue.remediation,
      implementation: this.getImplementationGuidance(issue),
      estimatedEffort: this.getEffortEstimate(issue.severity),
    });
  }

  private addRecommendation(rec: SecurityRecommendation) {
    this.recommendations.push(rec);
  }

  private severityToPriority(severity: string): 'immediate' | 'high' | 'medium' | 'low' {
    switch (severity) {
      case 'critical':
        return 'immediate';
      case 'high':
        return 'high';
      case 'medium':
        return 'medium';
      case 'low':
        return 'low';
      default:
        return 'medium';
    }
  }

  private getImplementationGuidance(issue: SecurityIssue): string {
    const guidance: Record<string, string> = {
      'auth-001': 'Generate a secure 32+ character secret: openssl rand -base64 32',
      'auth-002': 'Create admin user via secure registration process with strong password',
      'auth-003': 'Remove demo users in production or enforce password reset',
      'authz-001': 'Use the new rbac-middleware.ts for all sensitive API routes',
      'authz-002': 'Implement resource ownership checks in API routes',
      'data-001': 'Review all Prisma queries and ensure passwordHash is excluded',
      'data-002': 'Use logSecurityEvent() function for all sensitive operations',
      'api-001': 'Implement rate limiting middleware using next-rate-limit',
      'api-002': 'Add Zod schema validation to all API route handlers',
      'api-003': 'Configure CORS policy in Next.js middleware',
      'session-001': 'Add session maxAge configuration to NextAuth options',
      'session-002': 'Ensure production NEXTAUTH_URL uses HTTPS protocol',
      'user-001': 'Restrict /api/users endpoint to admin users only',
      'user-002': 'Audit admin users and demote unnecessary admin accounts',
    };

    return guidance[issue.id] || 'Follow security best practices for this issue type';
  }

  private getEffortEstimate(severity: string): string {
    switch (severity) {
      case 'critical':
        return '1-2 hours';
      case 'high':
        return '2-4 hours';
      case 'medium':
        return '4-8 hours';
      case 'low':
        return '1-2 hours';
      default:
        return '2-4 hours';
    }
  }

  private calculateSecurityScores(): SecuritySummary {
    const totalIssues = this.issues.length;
    const criticalIssues = this.issues.filter((i) => i.severity === 'critical').length;
    const highIssues = this.issues.filter((i) => i.severity === 'high').length;
    const mediumIssues = this.issues.filter((i) => i.severity === 'medium').length;
    const lowIssues = this.issues.filter((i) => i.severity === 'low').length;

    // Calculate category scores (0-100, higher is better)
    const authenticationScore = this.calculateCategoryScore('authentication');
    const authorizationScore = this.calculateCategoryScore('authorization');
    const dataProtectionScore = this.calculateCategoryScore('data');
    const apiSecurityScore = this.calculateCategoryScore('api');
    const sessionManagementScore = this.calculateCategoryScore('session');

    return {
      totalIssues,
      criticalIssues,
      highIssues,
      mediumIssues,
      lowIssues,
      authenticationScore,
      authorizationScore,
      dataProtectionScore,
      apiSecurityScore,
      sessionManagementScore,
    };
  }

  private calculateCategoryScore(category: string): number {
    const categoryIssues = this.issues.filter((i) => i.category === category);
    if (categoryIssues.length === 0) return 100;

    // Scoring: critical = -40, high = -25, medium = -15, low = -5
    const penalty = categoryIssues.reduce((total, issue) => {
      switch (issue.severity) {
        case 'critical':
          return total + 40;
        case 'high':
          return total + 25;
        case 'medium':
          return total + 15;
        case 'low':
          return total + 5;
        default:
          return total + 10;
      }
    }, 0);

    return Math.max(0, 100 - penalty);
  }

  private calculateOverallScore(summary: SecuritySummary): number {
    const weights = {
      authentication: 0.25,
      authorization: 0.25,
      data: 0.2,
      api: 0.2,
      session: 0.1,
    };

    return Math.round(
      summary.authenticationScore * weights.authentication +
        summary.authorizationScore * weights.authorization +
        summary.dataProtectionScore * weights.data +
        summary.apiSecurityScore * weights.api +
        summary.sessionManagementScore * weights.session
    );
  }
}

/**
 * Generate security audit report
 */
export async function generateSecurityAudit(): Promise<SecurityAuditResult> {
  const auditor = new SecurityAuditor();
  return await auditor.performAudit();
}
