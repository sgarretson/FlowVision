# Advanced Logging & Monitoring System

FlowVision now includes a comprehensive logging and monitoring system to help track GitHub operations, CI/CD issues, and testing problems in greater detail.

## 🔧 System Components

### 1. **Core Logger (`lib/logger.ts`)**

- Centralized logging system with multiple log levels
- Context-aware logging for different components
- Automatic external logging for production environments
- Performance timing helpers

### 2. **Enhanced CI/CD Workflow (`.github/workflows/enhanced-logging.yml`)**

- Detailed logging for all CI/CD pipeline steps
- Comprehensive diagnostic reports
- Automatic artifact collection
- PR commenting with diagnostic information

### 3. **Debug Testing Script (`scripts/debug-testing.sh`)**

- Comprehensive local environment validation
- System information collection
- Performance baseline measurements
- Security scanning

### 4. **GitHub Monitor (`scripts/github-monitor.js`)**

- Repository health monitoring
- PR and issue analysis
- Workflow status tracking
- Dependency security checks

### 5. **Request Middleware (`middleware.ts`)**

- Request/response logging
- Performance monitoring
- Security header injection
- Request tracing

## 🚀 Quick Start

### Enable Advanced Logging

1. **Set Environment Variables:**

```bash
export LOG_LEVEL=DEBUG
export LOG_CONTEXTS=github,testing,api,auth,ai,ci
export ENABLE_PERFORMANCE_MONITORING=true
```

2. **Run Debug Testing:**

```bash
./scripts/debug-testing.sh
```

3. **Monitor GitHub Status:**

```bash
node scripts/github-monitor.js
```

4. **Check CI/CD Logs:**

- GitHub Actions will automatically generate detailed logs
- Check workflow artifacts for comprehensive reports

## 📊 Log Levels

| Level   | Description                    | Use Case                    |
| ------- | ------------------------------ | --------------------------- |
| `DEBUG` | Detailed debugging information | Development troubleshooting |
| `INFO`  | General information            | Normal operations           |
| `WARN`  | Warning conditions             | Potential issues            |
| `ERROR` | Error conditions               | Application errors          |
| `FATAL` | Critical errors                | System failures             |

## 🎯 Log Contexts

Enable specific logging contexts based on what you're debugging:

- **`github`**: GitHub operations, webhooks, API calls
- **`testing`**: Test execution, results, failures
- **`api`**: API requests, responses, errors
- **`auth`**: Authentication, authorization
- **`ai`**: AI service calls, responses, performance
- **`ci`**: CI/CD pipeline operations

## 📋 Usage Examples

### Basic Logging

```typescript
import { logger } from '@/lib/logger';

// Simple logging
logger.info('User action performed');
logger.error('Operation failed', error);

// With context
logger.info('API request processed', {
  component: 'api',
  operation: 'getUserProfile',
  userId: 'user123',
  metadata: { responseTime: 150 },
});
```

### Specialized Loggers

```typescript
import { githubLogger, testLogger, apiLogger } from '@/lib/logger';

// GitHub operations
githubLogger.pr('PR #24 checks completed', '24', { status: 'success' });
githubLogger.workflow('CI pipeline started', 'ci.yml', { trigger: 'push' });

// Testing
testLogger.suite('Unit tests starting', 'auth.test.ts');
testLogger.test('Login test completed', 'should authenticate user', 'auth.test.ts');

// API monitoring
apiLogger.request('/api/users', 'GET', 'user123');
apiLogger.response('/api/users', 'GET', 200, 150);
```

### Performance Timing

```typescript
import { logger } from '@/lib/logger';

// Automatic timing
const endTimer = logger.time('database-query');
await performDatabaseQuery();
endTimer(); // Logs: "Operation completed: database-query" with duration

// Manual performance logging
logger.performance('AI summary generation', 2500, 'generateSummary', {
  model: 'gpt-3.5-turbo',
  tokens: 1500,
});
```

## 🔍 Debugging GitHub Issues

### 1. **Check PR Status**

```bash
# Run comprehensive GitHub monitoring
node scripts/github-monitor.js

# Check specific PR
gh pr checks 24
gh pr view 24
```

### 2. **Analyze CI/CD Failures**

- GitHub Actions automatically uploads diagnostic artifacts
- Check workflow run artifacts for detailed logs
- Review the enhanced logging workflow output

### 3. **Local Environment Validation**

```bash
# Run comprehensive debugging
./scripts/debug-testing.sh

# Check specific issues
npm run build 2>&1 | tee build-debug.log
npm test 2>&1 | tee test-debug.log
```

## 🔍 Debugging Testing Issues

### 1. **Test Environment Validation**

```bash
# Comprehensive test environment check
./scripts/debug-testing.sh

# Focus on test-specific issues
npm test -- --verbose --detectOpenHandles
```

### 2. **Database Issues**

```bash
# Test database connectivity
npx prisma db pull --preview-feature

# Validate schema
npx prisma validate

# Check database status
docker ps | grep postgres
```

### 3. **Performance Issues**

```bash
# Measure startup time
time npm start

# Profile build time
npm run build -- --profile

# Check memory usage
npm test -- --logHeapUsage
```

## 📈 Monitoring Dashboard

### GitHub Workflow Artifacts

- **Diagnostic Reports**: Comprehensive system analysis
- **Build Logs**: Detailed build process information
- **Test Results**: Complete test execution logs
- **Dependency Analysis**: Security and update reports

### Local Log Files

All scripts generate timestamped log files in `./debug-logs/`:

- `debug_YYYYMMDD_HHMMSS.log`: Comprehensive environment debugging
- `github-monitor-YYYY-MM-DD.log`: GitHub repository health
- `github-health-report-YYYY-MM-DD.md`: Formatted health report

## 🚨 Common Issues & Solutions

### GitHub CI/CD Failures

**Issue: Linting errors**

```bash
# Check specific linting issues
npm run lint 2>&1 | grep "error"

# Fix auto-fixable issues
npm run lint -- --fix
```

**Issue: TypeScript compilation errors**

```bash
# Detailed TypeScript analysis
npx tsc --noEmit --listFiles --extendedDiagnostics
```

**Issue: Test failures**

```bash
# Run tests with detailed output
npm test -- --verbose --coverage

# Run specific test suite
npm test -- auth.test.ts --verbose
```

### Local Development Issues

**Issue: Port conflicts**

```bash
# Check port usage
lsof -i :3000
lsof -i :5432

# Kill conflicting processes
./scripts/debug-testing.sh  # Includes port analysis
```

**Issue: Database connectivity**

```bash
# Check Docker status
docker ps
docker-compose up -d db

# Test Prisma connection
npx prisma db push --preview-feature
```

**Issue: Dependency problems**

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Check for conflicts
npm ls --depth=0
npm audit
```

## 🔧 Configuration

### Environment Variables

```bash
# Logging Configuration
LOG_LEVEL=DEBUG                    # Set log verbosity
LOG_CONTEXTS=github,testing,api    # Enable specific contexts
ENABLE_PERFORMANCE_MONITORING=true # Enable performance tracking

# GitHub Integration
GITHUB_TOKEN=your_token            # For GitHub API access

# External Services (Optional)
DATADOG_API_KEY=your_key          # External logging
SENTRY_DSN=your_dsn               # Error tracking
```

### Production Considerations

- **Log Level**: Use `INFO` or `WARN` in production
- **Context Filtering**: Only enable necessary contexts
- **External Logging**: Configure external services for log aggregation
- **Storage**: Implement log rotation and cleanup policies

## 📚 Best Practices

### 1. **Structured Logging**

- Always include relevant context
- Use consistent field names
- Include request IDs for tracing

### 2. **Performance Monitoring**

- Log slow operations (>1000ms)
- Track resource usage
- Monitor external service latency

### 3. **Error Handling**

- Include stack traces for errors
- Log user actions leading to errors
- Provide correlation IDs

### 4. **Security**

- Never log sensitive information
- Redact PII and credentials
- Use appropriate log levels

## 🔮 Future Enhancements

- **Real-time Dashboard**: Web-based monitoring interface
- **Alerting System**: Automated notifications for critical issues
- **Log Analytics**: Pattern detection and anomaly identification
- **Integration**: Connect with external monitoring services

---

**Need Help?** Check the generated log files in `./debug-logs/` for detailed diagnostic information.
