#!/bin/bash

# FlowVision GitHub Rules Enforcement Setup Script
# This script configures all automated enforcement mechanisms

set -e

echo "🛡️  Setting up FlowVision GitHub Rules Enforcement..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_info "Checking prerequisites..."
    
    # Check if git is installed
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install Node.js and npm first."
        exit 1
    fi
    
    # Check if we're in a git repository
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        print_error "Not in a git repository. Please run this script from the project root."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Setup Husky and pre-commit hooks
setup_husky() {
    print_info "Setting up Husky pre-commit hooks..."
    
    # Install husky if not already installed
    if ! npm list husky &> /dev/null; then
        npm install --save-dev husky
    fi
    
    # Initialize husky
    npx husky install
    
    # Create pre-commit hook
    npx husky add .husky/pre-commit "npx lint-staged"
    npx husky add .husky/commit-msg "npx commitlint --edit \$1"
    npx husky add .husky/pre-push "npm test"
    
    print_success "Husky hooks configured"
}

# Setup ESLint and Prettier
setup_linting() {
    print_info "Configuring linting and formatting..."
    
    # Install lint-staged if not already installed
    if ! npm list lint-staged &> /dev/null; then
        npm install --save-dev lint-staged
    fi
    
    # Install commitlint if not already installed
    if ! npm list @commitlint/cli &> /dev/null; then
        npm install --save-dev @commitlint/cli @commitlint/config-conventional
    fi
    
    # Create commitlint config if it doesn't exist
    if [ ! -f "commitlint.config.js" ]; then
        cat > commitlint.config.js << EOF
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [2, 'always', 'sentence-case'],
    'body-max-line-length': [2, 'always', 100],
    'subject-max-length': [2, 'always', 50]
  }
};
EOF
    fi
    
    print_success "Linting and formatting configured"
}

# Setup VS Code workspace settings
setup_vscode() {
    print_info "Setting up VS Code workspace settings..."
    
    # Create .vscode directory if it doesn't exist
    mkdir -p .vscode
    
    # Create workspace settings
    cat > .vscode/settings.json << EOF
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "git.inputValidation": "always",
  "git.inputValidationLength": 50,
  "git.inputValidationSubjectLength": 50,
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,
  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],
  "typescript.preferences.quoteStyle": "single",
  "javascript.preferences.quoteStyle": "single"
}
EOF
    
    # Create recommended extensions
    cat > .vscode/extensions.json << EOF
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next",
    "github.vscode-pull-request-github",
    "eamodio.gitlens"
  ]
}
EOF
    
    print_success "VS Code settings configured"
}

# Configure Git settings
setup_git_config() {
    print_info "Configuring Git settings for the project..."
    
    # Set up git config for better commit editing
    git config core.editor "code --wait"
    git config merge.tool "vscode"
    git config mergetool.vscode.cmd 'code --wait $MERGED'
    git config diff.tool "vscode"
    git config difftool.vscode.cmd 'code --wait --diff $LOCAL $REMOTE'
    
    # Configure git to use conventional commits template
    cat > .gitmessage << EOF
# <type>(<scope>): <subject>
#
# <body>
#
# <footer>
#
# Types:
# feat: A new feature
# fix: A bug fix
# docs: Documentation only changes
# style: Changes that do not affect the meaning of the code
# refactor: A code change that neither fixes a bug nor adds a feature
# perf: A code change that improves performance
# test: Adding missing tests or correcting existing tests
# chore: Changes to the build process or auxiliary tools
#
# Remember:
# - Use the imperative mood in the subject line
# - Limit the subject line to 50 characters
# - Separate subject from body with a blank line
# - Wrap the body at 100 characters
# - Use the body to explain what and why vs. how
EOF
    
    git config commit.template .gitmessage
    
    print_success "Git configuration completed"
}

# Create enforcement monitoring scripts
create_monitoring_scripts() {
    print_info "Creating monitoring and compliance scripts..."
    
    mkdir -p scripts/monitoring
    
    # Create compliance check script
    cat > scripts/monitoring/check-compliance.sh << 'EOF'
#!/bin/bash

# Compliance checking script
echo "🔍 Running compliance checks..."

# Check commit message format for last 10 commits
echo "📝 Checking commit message format..."
git log --oneline -10 --pretty=format:"%s" | while read -r commit_msg; do
    if ! echo "$commit_msg" | grep -qE '^(feat|fix|docs|style|refactor|perf|test|chore)(\(.+\))?: .+'; then
        echo "❌ Non-conventional commit: $commit_msg"
    fi
done

# Check for TODO comments in production code
echo "📋 Checking for TODO comments..."
if grep -r "TODO\|FIXME\|XXX" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" app/ lib/ components/ 2>/dev/null; then
    echo "⚠️  TODO comments found in production code"
else
    echo "✅ No TODO comments in production code"
fi

# Check for console.log statements
echo "🐛 Checking for console.log statements..."
if grep -r "console\.log" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" app/ lib/ components/ 2>/dev/null; then
    echo "⚠️  console.log statements found"
else
    echo "✅ No console.log statements found"
fi

# Check for hardcoded API keys or secrets
echo "🔒 Checking for potential secrets..."
if grep -r "api_key\|secret\|password\|token" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" app/ lib/ components/ 2>/dev/null | grep -v "process.env"; then
    echo "⚠️  Potential hardcoded secrets found"
else
    echo "✅ No hardcoded secrets detected"
fi

echo "🎯 Compliance check completed"
EOF

    chmod +x scripts/monitoring/check-compliance.sh
    
    # Create metrics collection script
    cat > scripts/monitoring/collect-metrics.js << 'EOF'
#!/usr/bin/env node

// Metrics collection script for GitHub repository
const { execSync } = require('child_process');
const fs = require('fs');

function collectGitMetrics() {
    const metrics = {};
    
    // Get commit count for last 30 days
    const commitCount = execSync('git rev-list --count --since="30 days ago" HEAD', { encoding: 'utf8' }).trim();
    metrics.commitsLast30Days = parseInt(commitCount);
    
    // Get contributor count
    const contributors = execSync('git shortlog -sn --all | wc -l', { encoding: 'utf8' }).trim();
    metrics.totalContributors = parseInt(contributors);
    
    // Get branch count
    const branches = execSync('git branch -r | wc -l', { encoding: 'utf8' }).trim();
    metrics.totalBranches = parseInt(branches);
    
    // Check conventional commit compliance for last 50 commits
    const recentCommits = execSync('git log --oneline -50 --pretty=format:"%s"', { encoding: 'utf8' }).split('\n');
    const conventionalCommits = recentCommits.filter(msg => 
        /^(feat|fix|docs|style|refactor|perf|test|chore)(\(.+\))?: .+/.test(msg)
    );
    metrics.commitCompliance = Math.round((conventionalCommits.length / recentCommits.length) * 100);
    
    // Save metrics
    const timestamp = new Date().toISOString();
    const report = {
        timestamp,
        metrics,
        summary: `Compliance: ${metrics.commitCompliance}%, Commits: ${metrics.commitsLast30Days}, Contributors: ${metrics.totalContributors}`
    };
    
    if (!fs.existsSync('metrics')) {
        fs.mkdirSync('metrics');
    }
    
    fs.writeFileSync(`metrics/compliance-${new Date().toISOString().split('T')[0]}.json`, JSON.stringify(report, null, 2));
    
    console.log('📊 Metrics collected:');
    console.log(`   Commit Compliance: ${metrics.commitCompliance}%`);
    console.log(`   Commits (30 days): ${metrics.commitsLast30Days}`);
    console.log(`   Total Contributors: ${metrics.totalContributors}`);
    console.log(`   Total Branches: ${metrics.totalBranches}`);
}

collectGitMetrics();
EOF

    chmod +x scripts/monitoring/collect-metrics.js
    
    print_success "Monitoring scripts created"
}

# Create developer onboarding checklist
create_onboarding_checklist() {
    print_info "Creating developer onboarding checklist..."
    
    cat > DEVELOPER_ONBOARDING.md << 'EOF'
# Developer Onboarding Checklist

Welcome to the FlowVision project! Please complete this checklist to ensure you're set up for success.

## 🛠️ Environment Setup

### Prerequisites
- [ ] Install Node.js 18+ and npm
- [ ] Install Git
- [ ] Install Docker Desktop
- [ ] Install VS Code (recommended)

### Project Setup
- [ ] Clone the repository: `git clone https://github.com/sgarretson/FlowVision.git`
- [ ] Install dependencies: `npm install`
- [ ] Copy environment file: `cp .env.example .env.local`
- [ ] Set up database: `docker compose up -d db`
- [ ] Run database migrations: `npx prisma db push`
- [ ] Seed test data: `npm run prisma:seed`

### Development Tools
- [ ] Install VS Code extensions (prompted automatically)
- [ ] Configure Git: `git config --global user.name "Your Name"`
- [ ] Configure Git: `git config --global user.email "your.email@company.com"`
- [ ] Test pre-commit hooks: Make a test commit

## 📚 Learning Requirements

### Required Reading
- [ ] Read [GITHUB_BEST_PRACTICES.md](./GITHUB_BEST_PRACTICES.md)
- [ ] Review [.cursorrules](./.cursorrules)
- [ ] Understand [ENFORCEMENT_STRATEGY.md](./ENFORCEMENT_STRATEGY.md)
- [ ] Study project README.md

### Training Modules
- [ ] Complete Git Workflow training (2 hours)
- [ ] Complete Code Quality Standards training (1.5 hours)
- [ ] Complete Security Best Practices training (1 hour)

## 🎯 Practical Exercises

### Git Workflow
- [ ] Create your first feature branch: `git checkout -b feature/onboarding-test`
- [ ] Make a practice commit with conventional format
- [ ] Submit a practice PR following the template
- [ ] Successfully resolve a merge conflict (simulated)

### Code Quality
- [ ] Run linting: `npm run lint`
- [ ] Run tests: `npm test`
- [ ] Run build: `npm run build`
- [ ] Fix any linting errors in practice code

### Development Workflow
- [ ] Start development server: `npm run dev`
- [ ] Make a small UI change
- [ ] Test the change manually
- [ ] Create proper tests for the change

## ✅ Verification

### Pre-commit Hooks
- [ ] Verify pre-commit hooks block bad commits
- [ ] Verify commit message validation works
- [ ] Verify linting runs automatically

### CI/CD Understanding
- [ ] Understand the CI/CD pipeline stages
- [ ] Know how to check CI/CD status
- [ ] Understand when PRs can be merged

### Emergency Procedures
- [ ] Know how to resolve merge conflicts
- [ ] Understand hotfix process
- [ ] Know who to contact for help

## 🎓 Certification

Once you've completed all items above:

- [ ] Schedule onboarding review with team lead
- [ ] Demonstrate Git workflow knowledge
- [ ] Show understanding of code quality standards
- [ ] Complete first real feature implementation
- [ ] Receive onboarding certification

---

**Welcome to the team! 🎉**

If you have any questions during onboarding, reach out in the #dev-support Slack channel or contact your team lead directly.
EOF
    
    print_success "Developer onboarding checklist created"
}

# Main execution
main() {
    echo "🚀 Starting FlowVision enforcement setup..."
    echo
    
    check_prerequisites
    setup_husky
    setup_linting
    setup_vscode
    setup_git_config
    create_monitoring_scripts
    create_onboarding_checklist
    
    echo
    print_success "🎉 Enforcement setup completed successfully!"
    echo
    print_info "Next steps:"
    echo "  1. Commit these changes: git add . && git commit -m 'chore: setup enforcement mechanisms'"
    echo "  2. Test pre-commit hooks: Make a test commit"
    echo "  3. Run compliance check: ./scripts/monitoring/check-compliance.sh"
    echo "  4. Review onboarding checklist: DEVELOPER_ONBOARDING.md"
    echo
    print_warning "Note: Make sure all team members run this setup script on their local environments"
}

# Run the main function
main "$@"
EOF
chmod +x scripts/setup-enforcement.sh
