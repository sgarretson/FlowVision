#!/bin/bash

# FlowVision Debug Testing Script
# Provides comprehensive debugging for testing issues

set -e

echo "🔍 FlowVision Debug Testing Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOG_DIR="./debug-logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/debug_${TIMESTAMP}.log"

# Create log directory
mkdir -p "$LOG_DIR"

# Logging function
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

log_section() {
    log "\n${BLUE}=== $1 ===${NC}"
}

log_success() {
    log "${GREEN}✅ $1${NC}"
}

log_warning() {
    log "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    log "${RED}❌ $1${NC}"
}

# Start debugging
log_section "System Information"
log "Timestamp: $(date)"
log "OS: $(uname -a)"
log "Node.js: $(node --version 2>/dev/null || echo 'Not installed')"
log "NPM: $(npm --version 2>/dev/null || echo 'Not installed')"
log "Git: $(git --version 2>/dev/null || echo 'Not installed')"
log "Current directory: $(pwd)"
log "User: $(whoami)"

log_section "Environment Variables"
log "NODE_ENV: ${NODE_ENV:-'not set'}"
log "LOG_LEVEL: ${LOG_LEVEL:-'not set'}"
log "NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL:-'not set'}"
log "Database URL: ${DATABASE_URL:+[REDACTED]}"

log_section "Project Structure Validation"
if [ -f "package.json" ]; then
    log_success "package.json found"
    log "Project name: $(jq -r '.name' package.json 2>/dev/null || echo 'Unable to read')"
    log "Version: $(jq -r '.version' package.json 2>/dev/null || echo 'Unable to read')"
else
    log_error "package.json not found - not in project root?"
fi

if [ -f "next.config.js" ] || [ -f "next.config.mjs" ]; then
    log_success "Next.js config found"
else
    log_warning "Next.js config not found"
fi

if [ -d ".git" ]; then
    log_success "Git repository detected"
    log "Current branch: $(git branch --show-current 2>/dev/null || echo 'Unable to determine')"
    log "Last commit: $(git log -1 --oneline 2>/dev/null || echo 'Unable to read')"
else
    log_warning "Not a Git repository"
fi

log_section "Dependency Analysis"
if [ -f "package-lock.json" ]; then
    log_success "package-lock.json found"
    
    # Check if node_modules exists
    if [ -d "node_modules" ]; then
        log_success "node_modules directory exists"
        log "Node modules size: $(du -sh node_modules 2>/dev/null || echo 'Unable to calculate')"
        
        # Check for common issues
        if [ ! -d "node_modules/.bin" ]; then
            log_warning "node_modules/.bin not found - dependencies may not be properly installed"
        fi
    else
        log_error "node_modules directory not found - run 'npm install'"
    fi
else
    log_warning "package-lock.json not found"
fi

# Check for dependency conflicts
log "Checking for dependency conflicts..."
npm ls --depth=0 > "$LOG_DIR/dependency_tree_${TIMESTAMP}.log" 2>&1 || log_warning "Dependency conflicts detected - see log file"

log_section "Database Connectivity"
if command -v docker &> /dev/null; then
    log_success "Docker is available"
    
    # Check if Docker is running
    if docker ps &> /dev/null; then
        log_success "Docker daemon is running"
        
        # Check for PostgreSQL container
        POSTGRES_CONTAINERS=$(docker ps --filter "ancestor=postgres" --format "table {{.Names}}\t{{.Status}}" | tail -n +2)
        if [ -n "$POSTGRES_CONTAINERS" ]; then
            log_success "PostgreSQL containers found:"
            log "$POSTGRES_CONTAINERS"
        else
            log_warning "No PostgreSQL containers running"
        fi
    else
        log_error "Docker daemon not running"
    fi
else
    log_warning "Docker not available"
fi

# Test database connection
if [ -f "prisma/schema.prisma" ]; then
    log_success "Prisma schema found"
    
    log "Testing database connection..."
    if npx prisma db pull --preview-feature &> "$LOG_DIR/prisma_test_${TIMESTAMP}.log"; then
        log_success "Database connection successful"
    else
        log_error "Database connection failed - see log file"
    fi
else
    log_warning "Prisma schema not found"
fi

log_section "Build and Compilation Tests"

# TypeScript compilation
log "Testing TypeScript compilation..."
if npx tsc --noEmit > "$LOG_DIR/typescript_${TIMESTAMP}.log" 2>&1; then
    log_success "TypeScript compilation successful"
else
    log_error "TypeScript compilation failed - see log file"
    log "First 10 errors:"
    head -20 "$LOG_DIR/typescript_${TIMESTAMP}.log" | tee -a "$LOG_FILE"
fi

# Linting
log "Testing linting..."
if npm run lint > "$LOG_DIR/lint_${TIMESTAMP}.log" 2>&1; then
    log_success "Linting passed"
else
    log_warning "Linting issues found - see log file"
fi

# Build test
log "Testing production build..."
if npm run build > "$LOG_DIR/build_${TIMESTAMP}.log" 2>&1; then
    log_success "Production build successful"
else
    log_error "Production build failed - see log file"
    log "Build errors:"
    tail -20 "$LOG_DIR/build_${TIMESTAMP}.log" | tee -a "$LOG_FILE"
fi

log_section "Test Execution"

# Unit tests
log "Running unit tests..."
if npm test > "$LOG_DIR/unit_tests_${TIMESTAMP}.log" 2>&1; then
    log_success "Unit tests passed"
else
    log_error "Unit tests failed - see log file"
    log "Test failures:"
    grep -A 5 -B 5 "FAIL\|Error" "$LOG_DIR/unit_tests_${TIMESTAMP}.log" | head -20 | tee -a "$LOG_FILE"
fi

# Check for test files
TEST_FILES=$(find . -name "*.test.ts" -o -name "*.test.js" -o -name "*.spec.ts" -o -name "*.spec.js" | grep -v node_modules | wc -l)
log "Test files found: $TEST_FILES"

if [ -d "cypress" ]; then
    log_success "Cypress E2E tests directory found"
    E2E_TESTS=$(find cypress -name "*.cy.*" | wc -l)
    log "E2E test files: $E2E_TESTS"
else
    log_warning "No Cypress E2E tests found"
fi

log_section "Port and Process Analysis"

# Check for processes using common ports
PORTS=(3000 3001 3002 5432 6379)
for port in "${PORTS[@]}"; do
    if lsof -i ":$port" &> /dev/null; then
        PROCESS_INFO=$(lsof -i ":$port" | tail -n +2)
        log_warning "Port $port is in use:"
        log "$PROCESS_INFO"
    else
        log "Port $port is available"
    fi
done

log_section "Network Connectivity"

# Test external connectivity
if ping -c 1 google.com &> /dev/null; then
    log_success "External network connectivity available"
else
    log_warning "External network connectivity issues"
fi

# Test npm registry
if npm ping &> /dev/null; then
    log_success "NPM registry accessible"
else
    log_warning "NPM registry connectivity issues"
fi

log_section "GitHub Integration"

# Check GitHub CLI
if command -v gh &> /dev/null; then
    log_success "GitHub CLI available"
    
    # Test GitHub authentication
    if gh auth status &> /dev/null; then
        log_success "GitHub authentication configured"
        
        # Get repository info
        if gh repo view &> /dev/null; then
            REPO_INFO=$(gh repo view --json name,owner,defaultBranch,isPrivate)
            log "Repository info:"
            log "$REPO_INFO"
        fi
    else
        log_warning "GitHub authentication not configured"
    fi
else
    log_warning "GitHub CLI not available"
fi

# Check for GitHub workflows
if [ -d ".github/workflows" ]; then
    WORKFLOW_COUNT=$(find .github/workflows -name "*.yml" -o -name "*.yaml" | wc -l)
    log_success "GitHub workflows found: $WORKFLOW_COUNT"
    
    log "Workflows:"
    find .github/workflows -name "*.yml" -o -name "*.yaml" | xargs basename -s .yml | tee -a "$LOG_FILE"
else
    log_warning "No GitHub workflows found"
fi

log_section "AI Services Configuration"

# Check OpenAI configuration
if [ -n "$OPENAI_API_KEY" ]; then
    log_success "OpenAI API key configured"
else
    log_warning "OpenAI API key not configured"
fi

# Test AI service connection (if configured)
if [ -f "lib/openai.ts" ]; then
    log_success "OpenAI service file found"
else
    log_warning "OpenAI service file not found"
fi

log_section "Performance Baseline"

# Measure startup time
log "Measuring application startup time..."
START_TIME=$(date +%s%N)

# Start the app in background and wait for it to be ready
timeout 30s npm start &
APP_PID=$!

# Wait for the app to start (check for localhost:3000)
READY=false
for i in {1..30}; do
    if curl -s http://localhost:3000 &> /dev/null; then
        READY=true
        break
    fi
    sleep 1
done

END_TIME=$(date +%s%N)
STARTUP_TIME=$(( (END_TIME - START_TIME) / 1000000 ))

# Clean up
kill $APP_PID &> /dev/null || true

if [ "$READY" = true ]; then
    log_success "Application started successfully in ${STARTUP_TIME}ms"
else
    log_error "Application failed to start within 30 seconds"
fi

log_section "Security Scan"

# Check for sensitive files
SENSITIVE_FILES=(.env .env.local .env.production .env.development)
for file in "${SENSITIVE_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_warning "Sensitive file found: $file"
    fi
done

# Check for hardcoded secrets (basic check)
if grep -r "password\|secret\|key" --include="*.ts" --include="*.js" --exclude-dir=node_modules . > "$LOG_DIR/potential_secrets_${TIMESTAMP}.log" 2>/dev/null; then
    SECRET_COUNT=$(wc -l < "$LOG_DIR/potential_secrets_${TIMESTAMP}.log")
    if [ "$SECRET_COUNT" -gt 0 ]; then
        log_warning "Potential hardcoded secrets found: $SECRET_COUNT instances - review log file"
    fi
fi

log_section "Cleanup and Summary"

# Generate summary
TOTAL_ISSUES=$(grep -c "❌" "$LOG_FILE" || echo "0")
TOTAL_WARNINGS=$(grep -c "⚠️" "$LOG_FILE" || echo "0")
TOTAL_SUCCESS=$(grep -c "✅" "$LOG_FILE" || echo "0")

log ""
log "${BLUE}=== DEBUG SUMMARY ===${NC}"
log "✅ Successful checks: $TOTAL_SUCCESS"
log "⚠️  Warnings: $TOTAL_WARNINGS"
log "❌ Issues found: $TOTAL_ISSUES"
log ""
log "📁 Log files saved to: $LOG_DIR"
log "📝 Main log file: $LOG_FILE"

# Suggest next steps
if [ "$TOTAL_ISSUES" -gt 0 ]; then
    log "${RED}🚨 Critical issues found! Review the errors above and check log files.${NC}"
elif [ "$TOTAL_WARNINGS" -gt 0 ]; then
    log "${YELLOW}⚠️  Some warnings found. Review them to ensure optimal setup.${NC}"
else
    log "${GREEN}🎉 All checks passed! Your environment looks good.${NC}"
fi

log "\n${BLUE}Next steps:${NC}"
log "1. Review log files in $LOG_DIR"
log "2. Address any critical issues (❌) first"
log "3. Consider fixing warnings (⚠️) for optimal performance"
log "4. Run specific tests: npm test, npm run build, npm run lint"
log "5. Check GitHub Actions for CI/CD pipeline status"

log "\n${BLUE}Useful commands:${NC}"
log "- npm run dev    # Start development server"
log "- npm test       # Run tests"
log "- npm run build  # Build for production"
log "- gh pr status   # Check PR status"
log "- docker ps      # Check running containers"

echo ""
echo "Debug testing completed. Check the log files for detailed information."
