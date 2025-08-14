import { NextRequest, NextResponse } from 'next/server';
import { secureApiRoute, logSecurityEvent } from '@/lib/rbac-middleware';
import { generateSecurityAudit } from '@/lib/security-audit';

// Force dynamic server-side rendering for this API route
export const dynamic = 'force-dynamic';

export const GET = secureApiRoute(
  async (req: NextRequest, { user }) => {
    try {
      // Log security audit access
      await logSecurityEvent(
        'SECURITY_AUDIT_ACCESS',
        user.id,
        {
          userAgent: req.headers.get('user-agent'),
          ip: req.headers.get('x-forwarded-for') || 'unknown',
          action: 'security_audit_request',
        },
        'info'
      );

      console.log('🔒 Starting security audit requested by admin:', user.email);

      // Generate comprehensive security audit
      const auditResult = await generateSecurityAudit();

      // Log audit completion
      await logSecurityEvent(
        'SECURITY_AUDIT_COMPLETED',
        user.id,
        {
          overallScore: auditResult.score,
          totalIssues: auditResult.summary.totalIssues,
          criticalIssues: auditResult.summary.criticalIssues,
          highIssues: auditResult.summary.highIssues,
        },
        auditResult.summary.criticalIssues > 0 ? 'warning' : 'info'
      );

      return NextResponse.json({
        ...auditResult,
        auditedAt: new Date().toISOString(),
        auditedBy: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      console.error('Security audit error:', error);
      await logSecurityEvent(
        'SECURITY_AUDIT_ERROR',
        user.id,
        {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        'error'
      );

      return NextResponse.json({ error: 'Failed to perform security audit' }, { status: 500 });
    }
  },
  {
    allowedRoles: ['ADMIN'], // Only admins can access security audit
  }
);
