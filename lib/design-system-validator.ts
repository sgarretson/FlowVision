import { advancedLogger, LogContext } from '@/lib/advanced-logger';

// Design system validation utilities
export interface ComponentValidationRule {
  name: string;
  description: string;
  validator: (element: HTMLElement) => ValidationResult;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationResult {
  passed: boolean;
  message?: string;
  details?: any;
}

export interface ValidationReport {
  componentType: string;
  element: HTMLElement;
  rules: Array<{
    rule: ComponentValidationRule;
    result: ValidationResult;
  }>;
  overallScore: number;
  passed: boolean;
}

// Standard validation rules
export const DESIGN_SYSTEM_RULES: ComponentValidationRule[] = [
  // Icon sizing validation
  {
    name: 'icon-sizing',
    description: 'Icons should use standardized size classes',
    severity: 'warning',
    validator: (element: HTMLElement): ValidationResult => {
      const svgElements = element.querySelectorAll('svg');
      const violations: string[] = [];

      svgElements.forEach((svg, index) => {
        const hasStandardSize = [
          'icon-xs',
          'icon-sm',
          'icon-md',
          'icon-lg',
          'icon-xl',
          'icon-2xl',
        ].some((size) => svg.classList.contains(size));

        if (!hasStandardSize) {
          const computedSize = window.getComputedStyle(svg);
          violations.push(
            `SVG ${index}: ${computedSize.width} x ${computedSize.height} (no standard class)`
          );
        }
      });

      return {
        passed: violations.length === 0,
        message:
          violations.length > 0
            ? `${violations.length} icons without standard sizing classes`
            : 'All icons use standard sizing classes',
        details: violations,
      };
    },
  },

  // Touch target validation
  {
    name: 'touch-targets',
    description: 'Interactive elements should meet 44px minimum touch target',
    severity: 'error',
    validator: (element: HTMLElement): ValidationResult => {
      const interactiveElements = element.querySelectorAll(
        'button, a, input, select, textarea, [role="button"], [tabindex="0"]'
      );
      const violations: string[] = [];

      interactiveElements.forEach((el, index) => {
        const rect = el.getBoundingClientRect();
        const minSize = 44;

        if (rect.width < minSize || rect.height < minSize) {
          violations.push(
            `Element ${index} (${el.tagName}): ${Math.round(rect.width)}x${Math.round(rect.height)}px`
          );
        }
      });

      return {
        passed: violations.length === 0,
        message:
          violations.length > 0
            ? `${violations.length} elements below 44px touch target`
            : 'All interactive elements meet touch target requirements',
        details: violations,
      };
    },
  },

  // Button variant validation
  {
    name: 'button-variants',
    description: 'Buttons should use standardized variant classes',
    severity: 'warning',
    validator: (element: HTMLElement): ValidationResult => {
      const buttons = element.querySelectorAll('button');
      const violations: string[] = [];

      const standardVariants = [
        'button-primary',
        'button-secondary',
        'button-success',
        'button-danger',
        'button-outline',
        'button-ghost',
      ];

      buttons.forEach((button, index) => {
        const hasStandardVariant = standardVariants.some((variant) =>
          button.classList.contains(variant)
        );

        if (!hasStandardVariant) {
          violations.push(`Button ${index}: No standard variant class`);
        }
      });

      return {
        passed: violations.length === 0,
        message:
          violations.length > 0
            ? `${violations.length} buttons without standard variant classes`
            : 'All buttons use standard variant classes',
        details: violations,
      };
    },
  },

  // Color contrast validation (basic)
  {
    name: 'color-contrast',
    description: 'Text should have sufficient color contrast',
    severity: 'error',
    validator: (element: HTMLElement): ValidationResult => {
      const textElements = element.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, a, button');
      const violations: string[] = [];

      textElements.forEach((el, index) => {
        const styles = window.getComputedStyle(el);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;

        // Basic check for common problematic combinations
        if (color === 'rgb(128, 128, 128)' && backgroundColor === 'rgb(255, 255, 255)') {
          violations.push(`Element ${index}: Low contrast gray text on white`);
        }

        // Check for light text on light backgrounds
        if (color.includes('rgb(255') && backgroundColor.includes('rgb(255')) {
          violations.push(`Element ${index}: Light text on light background`);
        }
      });

      return {
        passed: violations.length === 0,
        message:
          violations.length > 0
            ? `${violations.length} potential contrast issues detected`
            : 'No obvious contrast issues detected',
        details: violations,
      };
    },
  },

  // Animation timing validation
  {
    name: 'animation-timing',
    description: 'Animations should use standardized timing classes',
    severity: 'info',
    validator: (element: HTMLElement): ValidationResult => {
      const animatedElements = element.querySelectorAll('[class*="transition"]');
      const violations: string[] = [];

      const standardTimings = [
        'transition-fast',
        'transition-normal',
        'transition-slow',
        'transition-standard',
        'transition-button',
        'transition-modal',
      ];

      animatedElements.forEach((el, index) => {
        const hasStandardTiming = standardTimings.some((timing) => el.classList.contains(timing));

        if (!hasStandardTiming && el.classList.contains('transition')) {
          violations.push(`Element ${index}: Uses generic 'transition' instead of standard timing`);
        }
      });

      return {
        passed: violations.length === 0,
        message:
          violations.length > 0
            ? `${violations.length} elements using non-standard transition timing`
            : 'All animations use standard timing classes',
        details: violations,
      };
    },
  },

  // Semantic HTML validation
  {
    name: 'semantic-html',
    description: 'Components should use semantic HTML structure',
    severity: 'warning',
    validator: (element: HTMLElement): ValidationResult => {
      const violations: string[] = [];

      // Check for buttons vs divs with click handlers
      const clickableDivs = element.querySelectorAll('div[onclick], div[onmousedown]');
      if (clickableDivs.length > 0) {
        violations.push(`${clickableDivs.length} clickable divs (should use button)`);
      }

      // Check for proper heading hierarchy
      const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let lastLevel = 0;
      headings.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        if (level > lastLevel + 1) {
          violations.push(`Heading ${index}: Skips from h${lastLevel} to h${level}`);
        }
        lastLevel = level;
      });

      return {
        passed: violations.length === 0,
        message:
          violations.length > 0
            ? `${violations.length} semantic HTML issues`
            : 'Good semantic HTML structure',
        details: violations,
      };
    },
  },
];

/**
 * Validate a component against design system rules
 */
export function validateComponent(
  element: HTMLElement,
  componentType: string = 'unknown',
  rules: ComponentValidationRule[] = DESIGN_SYSTEM_RULES
): ValidationReport {
  const results = rules.map((rule) => ({
    rule,
    result: rule.validator(element),
  }));

  const errorCount = results.filter((r) => !r.result.passed && r.rule.severity === 'error').length;
  const warningCount = results.filter(
    (r) => !r.result.passed && r.rule.severity === 'warning'
  ).length;

  // Calculate score (errors are -10 points, warnings are -5 points)
  const totalRules = rules.length;
  const penaltyPoints = errorCount * 10 + warningCount * 5;
  const maxPenalty = totalRules * 10;
  const overallScore = Math.max(0, ((maxPenalty - penaltyPoints) / maxPenalty) * 100);

  const report: ValidationReport = {
    componentType,
    element,
    rules: results,
    overallScore: Math.round(overallScore),
    passed: errorCount === 0,
  };

  // Log validation results
  const logLevel = errorCount > 0 ? 'error' : warningCount > 0 ? 'warn' : 'info';
  const message = `Component validation: ${componentType}`;

  if (logLevel === 'error') {
    advancedLogger.error(LogContext.DESIGN_SYSTEM, message, new Error('Validation failed'), {
      componentType,
      score: overallScore,
      errors: errorCount,
      warnings: warningCount,
      violations: results
        .filter((r) => !r.result.passed)
        .map((r) => ({
          rule: r.rule.name,
          message: r.result.message,
        })),
    });
  } else if (logLevel === 'warn') {
    advancedLogger.warn(LogContext.DESIGN_SYSTEM, message, {
      componentType,
      score: overallScore,
      warnings: warningCount,
      violations: results
        .filter((r) => !r.result.passed)
        .map((r) => ({
          rule: r.rule.name,
          message: r.result.message,
        })),
    });
  } else {
    advancedLogger.info(LogContext.DESIGN_SYSTEM, message, {
      componentType,
      score: overallScore,
      status: 'passed',
    });
  }

  return report;
}

/**
 * Validate all components in a container
 */
export function validateAllComponents(
  container: HTMLElement = document.body,
  componentSelectors: Record<string, string> = {
    button: 'button',
    card: '[class*="card"]',
    form: 'form',
    input: 'input, select, textarea',
    icon: 'svg',
    modal: '[role="dialog"]',
    navigation: 'nav',
  }
): ValidationReport[] {
  const reports: ValidationReport[] = [];

  Object.entries(componentSelectors).forEach(([componentType, selector]) => {
    const elements = container.querySelectorAll(selector);
    elements.forEach((element, index) => {
      const report = validateComponent(element as HTMLElement, `${componentType}-${index}`);
      reports.push(report);
    });
  });

  return reports;
}

/**
 * Generate a validation summary
 */
export function generateValidationSummary(reports: ValidationReport[]) {
  const summary = {
    totalComponents: reports.length,
    passedComponents: reports.filter((r) => r.passed).length,
    averageScore: Math.round(reports.reduce((sum, r) => sum + r.overallScore, 0) / reports.length),
    ruleViolations: {} as Record<string, number>,
    componentTypes: {} as Record<string, { total: number; passed: number; score: number }>,
  };

  // Count rule violations
  reports.forEach((report) => {
    report.rules.forEach(({ rule, result }) => {
      if (!result.passed) {
        summary.ruleViolations[rule.name] = (summary.ruleViolations[rule.name] || 0) + 1;
      }
    });

    // Component type stats
    const type = report.componentType.split('-')[0];
    if (!summary.componentTypes[type]) {
      summary.componentTypes[type] = { total: 0, passed: 0, score: 0 };
    }
    summary.componentTypes[type].total++;
    if (report.passed) summary.componentTypes[type].passed++;
    summary.componentTypes[type].score += report.overallScore;
  });

  // Calculate average scores per component type
  Object.keys(summary.componentTypes).forEach((type) => {
    const stats = summary.componentTypes[type];
    stats.score = Math.round(stats.score / stats.total);
  });

  return summary;
}

/**
 * Development-only validation runner
 */
export function runDesignSystemValidation() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Run validation on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => performValidation(), 1000); // Allow components to render
    });
  } else {
    setTimeout(() => performValidation(), 1000);
  }
}

function performValidation() {
  const reports = validateAllComponents();
  const summary = generateValidationSummary(reports);

  advancedLogger.info(LogContext.DESIGN_SYSTEM, 'Design system validation summary', {
    ...summary,
    url: window.location.pathname,
  });

  // Console output for development
  console.group('🎨 Design System Validation');
  console.log(`📊 Score: ${summary.averageScore}/100`);
  console.log(`✅ Passed: ${summary.passedComponents}/${summary.totalComponents} components`);

  if (Object.keys(summary.ruleViolations).length > 0) {
    console.group('⚠️  Rule Violations');
    Object.entries(summary.ruleViolations).forEach(([rule, count]) => {
      console.log(`${rule}: ${count} violations`);
    });
    console.groupEnd();
  }

  console.group('📋 Component Types');
  Object.entries(summary.componentTypes).forEach(([type, stats]) => {
    console.log(`${type}: ${stats.passed}/${stats.total} passed (${stats.score}/100)`);
  });
  console.groupEnd();

  console.groupEnd();
}

// Auto-run validation in development
if (typeof window !== 'undefined') {
  runDesignSystemValidation();
}

export default {
  validateComponent,
  validateAllComponents,
  generateValidationSummary,
  DESIGN_SYSTEM_RULES,
};
