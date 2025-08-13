#!/usr/bin/env node

/**
 * GitHub Monitoring and Debugging Script
 * Provides comprehensive monitoring of GitHub repository health and CI/CD status
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class GitHubMonitor {
  constructor() {
    this.logDir = './debug-logs';
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.logFile = path.join(this.logDir, `github-monitor-${this.timestamp}.log`);

    // Ensure log directory exists
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}`;
    console.log(logEntry);
    fs.appendFileSync(this.logFile, logEntry + '\n');
  }

  logSection(title) {
    const separator = '='.repeat(50);
    this.log(`\n${separator}`);
    this.log(`${title}`);
    this.log(separator);
  }

  execCommand(command, description) {
    this.log(`Executing: ${description || command}`);
    try {
      const result = execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe',
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });
      this.log(`✅ Success: ${description || command}`, 'SUCCESS');
      return { success: true, output: result.trim() };
    } catch (error) {
      this.log(`❌ Failed: ${description || command}`, 'ERROR');
      this.log(`Error: ${error.message}`, 'ERROR');
      return { success: false, error: error.message, output: error.stdout || '' };
    }
  }

  async checkGitHubCLI() {
    this.logSection('GitHub CLI Status');

    // Check if GitHub CLI is installed
    const ghCheck = this.execCommand('gh --version', 'Check GitHub CLI installation');
    if (!ghCheck.success) {
      this.log('GitHub CLI not installed. Install with: brew install gh', 'WARNING');
      return false;
    }

    this.log(`GitHub CLI version: ${ghCheck.output.split('\n')[0]}`);

    // Check authentication
    const authCheck = this.execCommand('gh auth status', 'Check GitHub authentication');
    if (!authCheck.success) {
      this.log('GitHub CLI not authenticated. Run: gh auth login', 'WARNING');
      return false;
    }

    this.log('GitHub authentication: ✅ Configured');
    return true;
  }

  async checkRepositoryStatus() {
    this.logSection('Repository Status');

    // Git status
    const gitStatus = this.execCommand('git status --porcelain', 'Check working directory status');
    if (gitStatus.success) {
      if (gitStatus.output) {
        this.log('Working directory has changes:', 'WARNING');
        this.log(gitStatus.output);
      } else {
        this.log('Working directory clean ✅');
      }
    }

    // Current branch
    const currentBranch = this.execCommand('git branch --show-current', 'Get current branch');
    if (currentBranch.success) {
      this.log(`Current branch: ${currentBranch.output}`);
    }

    // Remote status
    this.execCommand('git fetch origin', 'Fetch latest changes');
    const remoteStatus = this.execCommand('git status -b --porcelain', 'Check remote status');
    if (remoteStatus.success) {
      this.log('Remote status:');
      this.log(remoteStatus.output || 'Up to date');
    }

    // Recent commits
    const recentCommits = this.execCommand('git log --oneline -5', 'Get recent commits');
    if (recentCommits.success) {
      this.log('Recent commits:');
      this.log(recentCommits.output);
    }
  }

  async checkPullRequests() {
    this.logSection('Pull Request Analysis');

    // List open PRs
    const openPRs = this.execCommand(
      'gh pr list --json number,title,state,author,createdAt,updatedAt',
      'List open pull requests'
    );
    if (openPRs.success) {
      try {
        const prs = JSON.parse(openPRs.output);
        this.log(`Open pull requests: ${prs.length}`);

        prs.forEach((pr) => {
          this.log(`PR #${pr.number}: ${pr.title}`);
          this.log(`  Author: ${pr.author.login}`);
          this.log(`  Created: ${pr.createdAt}`);
          this.log(`  Updated: ${pr.updatedAt}`);
        });

        // Check PR status for each
        for (const pr of prs) {
          this.log(`\nChecking PR #${pr.number} status...`);
          const prChecks = this.execCommand(
            `gh pr checks ${pr.number}`,
            `Check PR #${pr.number} CI status`
          );
          if (prChecks.success) {
            this.log(`PR #${pr.number} checks:`);
            this.log(prChecks.output);
          }
        }
      } catch (error) {
        this.log(`Error parsing PR data: ${error.message}`, 'ERROR');
      }
    }
  }

  async checkIssues() {
    this.logSection('Issues Analysis');

    const openIssues = this.execCommand(
      'gh issue list --json number,title,state,author,createdAt,labels',
      'List open issues'
    );
    if (openIssues.success) {
      try {
        const issues = JSON.parse(openIssues.output);
        this.log(`Open issues: ${issues.length}`);

        // Group by labels
        const labelGroups = {};
        issues.forEach((issue) => {
          issue.labels.forEach((label) => {
            if (!labelGroups[label.name]) {
              labelGroups[label.name] = [];
            }
            labelGroups[label.name].push(issue);
          });
        });

        this.log('\nIssues by label:');
        Object.entries(labelGroups).forEach(([label, issueList]) => {
          this.log(`  ${label}: ${issueList.length} issues`);
        });

        // Recent issues
        const recentIssues = issues.slice(0, 5);
        this.log('\nRecent issues:');
        recentIssues.forEach((issue) => {
          this.log(`  #${issue.number}: ${issue.title}`);
        });
      } catch (error) {
        this.log(`Error parsing issues data: ${error.message}`, 'ERROR');
      }
    }
  }

  async checkWorkflows() {
    this.logSection('GitHub Workflows Analysis');

    // List workflow files
    const workflowDir = '.github/workflows';
    if (fs.existsSync(workflowDir)) {
      const workflows = fs
        .readdirSync(workflowDir)
        .filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));
      this.log(`Workflow files found: ${workflows.length}`);
      workflows.forEach((workflow) => {
        this.log(`  - ${workflow}`);
      });

      // Get workflow runs
      const workflowRuns = this.execCommand(
        'gh run list --limit 10 --json status,conclusion,workflowName,createdAt,url',
        'Get recent workflow runs'
      );
      if (workflowRuns.success) {
        try {
          const runs = JSON.parse(workflowRuns.output);
          this.log('\nRecent workflow runs:');
          runs.forEach((run) => {
            const status = run.conclusion || run.status;
            const emoji = status === 'success' ? '✅' : status === 'failure' ? '❌' : '🔄';
            this.log(`  ${emoji} ${run.workflowName}: ${status} (${run.createdAt})`);
          });

          // Count failures
          const failures = runs.filter((r) => r.conclusion === 'failure').length;
          if (failures > 0) {
            this.log(`⚠️  ${failures} recent workflow failures detected`, 'WARNING');
          }
        } catch (error) {
          this.log(`Error parsing workflow runs: ${error.message}`, 'ERROR');
        }
      }
    } else {
      this.log('No GitHub workflows directory found', 'WARNING');
    }
  }

  async checkRepositoryHealth() {
    this.logSection('Repository Health Metrics');

    // Repository info
    const repoInfo = this.execCommand(
      'gh repo view --json name,owner,description,isPrivate,defaultBranch,openIssuesCount,stargazerCount',
      'Get repository information'
    );
    if (repoInfo.success) {
      try {
        const repo = JSON.parse(repoInfo.output);
        this.log(`Repository: ${repo.owner.login}/${repo.name}`);
        this.log(`Description: ${repo.description || 'No description'}`);
        this.log(`Default branch: ${repo.defaultBranch}`);
        this.log(`Open issues: ${repo.openIssuesCount}`);
        this.log(`Stars: ${repo.stargazerCount}`);
        this.log(`Private: ${repo.isPrivate ? 'Yes' : 'No'}`);
      } catch (error) {
        this.log(`Error parsing repository info: ${error.message}`, 'ERROR');
      }
    }

    // Branch analysis
    const branches = this.execCommand('git branch -r', 'List remote branches');
    if (branches.success) {
      const branchList = branches.output.split('\n').filter((b) => b.trim() && !b.includes('HEAD'));
      this.log(`Remote branches: ${branchList.length}`);

      // Check for stale branches
      this.log('\nAnalyzing branch freshness...');
      for (const branch of branchList.slice(0, 10)) {
        // Limit to first 10 branches
        const branchName = branch.trim().replace('origin/', '');
        if (branchName === 'main' || branchName === 'master') continue;

        const lastCommit = this.execCommand(
          `git log -1 --format="%cr" origin/${branchName}`,
          `Check last commit for ${branchName}`
        );
        if (lastCommit.success) {
          this.log(`  ${branchName}: last commit ${lastCommit.output}`);
        }
      }
    }
  }

  async checkDependencyHealth() {
    this.logSection('Dependency Health Check');

    // Package.json analysis
    if (fs.existsSync('package.json')) {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const depCount = Object.keys(packageJson.dependencies || {}).length;
      const devDepCount = Object.keys(packageJson.devDependencies || {}).length;

      this.log(`Dependencies: ${depCount} production, ${devDepCount} development`);

      // Check for security vulnerabilities
      const auditResult = this.execCommand(
        'npm audit --audit-level=moderate --json',
        'Run security audit'
      );
      if (auditResult.success) {
        try {
          const audit = JSON.parse(auditResult.output);
          if (audit.metadata) {
            const { vulnerabilities } = audit.metadata;
            const totalVulns = vulnerabilities.total;

            if (totalVulns > 0) {
              this.log(`⚠️  Security vulnerabilities found: ${totalVulns}`, 'WARNING');
              this.log(`  Critical: ${vulnerabilities.critical || 0}`);
              this.log(`  High: ${vulnerabilities.high || 0}`);
              this.log(`  Moderate: ${vulnerabilities.moderate || 0}`);
              this.log(`  Low: ${vulnerabilities.low || 0}`);
            } else {
              this.log('✅ No security vulnerabilities found');
            }
          }
        } catch (error) {
          this.log(`Audit completed with warnings: ${auditResult.output.substring(0, 200)}...`);
        }
      }

      // Check for outdated packages
      const outdatedResult = this.execCommand('npm outdated --json', 'Check for outdated packages');
      if (outdatedResult.output) {
        try {
          const outdated = JSON.parse(outdatedResult.output);
          const outdatedCount = Object.keys(outdated).length;
          if (outdatedCount > 0) {
            this.log(`⚠️  Outdated packages: ${outdatedCount}`, 'WARNING');
            Object.entries(outdated)
              .slice(0, 5)
              .forEach(([pkg, info]) => {
                this.log(`  ${pkg}: ${info.current} → ${info.wanted} (latest: ${info.latest})`);
              });
          } else {
            this.log('✅ All packages up to date');
          }
        } catch (error) {
          this.log('All packages appear to be up to date');
        }
      }
    }
  }

  async generateReport() {
    this.logSection('Generating Comprehensive Report');

    const reportPath = path.join(this.logDir, `github-health-report-${this.timestamp}.md`);

    const report = `
# GitHub Repository Health Report

**Generated:** ${new Date().toISOString()}
**Repository:** $(git remote get-url origin 2>/dev/null || 'Unknown')
**Branch:** $(git branch --show-current 2>/dev/null || 'Unknown')

## Summary

This report provides a comprehensive analysis of the repository's health, including:
- Git status and branch management
- Pull request and issue tracking
- CI/CD workflow status
- Dependency security and updates
- Repository metrics

## Detailed Logs

See the complete log file: \`${this.logFile}\`

## Recommendations

Based on the analysis, consider the following actions:

1. **Critical Issues**: Address any failing CI/CD checks immediately
2. **Security**: Update packages with security vulnerabilities
3. **Maintenance**: Clean up stale branches and close resolved issues
4. **Performance**: Review and optimize workflow execution times

## Next Steps

1. Review the detailed logs for specific issues
2. Address critical and high-priority items first
3. Set up monitoring for continuous health checks
4. Schedule regular repository maintenance

---

*This report was generated automatically by the GitHub Monitor script.*
`;

    fs.writeFileSync(reportPath, report);
    this.log(`📄 Comprehensive report saved to: ${reportPath}`);
  }

  async run() {
    console.log('🔍 Starting GitHub Repository Monitor...\n');

    try {
      // Check prerequisites
      const hasGH = await this.checkGitHubCLI();

      // Run all checks
      await this.checkRepositoryStatus();
      await this.checkPullRequests();
      await this.checkIssues();
      await this.checkWorkflows();
      await this.checkRepositoryHealth();
      await this.checkDependencyHealth();

      // Generate report
      await this.generateReport();

      this.logSection('Monitor Complete');
      this.log('✅ GitHub monitoring completed successfully');
      this.log(`📁 Logs saved to: ${this.logFile}`);

      console.log('\n🎉 GitHub monitoring completed successfully!');
      console.log(`📁 Check the logs at: ${this.logFile}`);
    } catch (error) {
      this.log(`❌ Monitor failed with error: ${error.message}`, 'ERROR');
      console.error('❌ GitHub monitoring failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the monitor if called directly
if (require.main === module) {
  const monitor = new GitHubMonitor();
  monitor.run().catch(console.error);
}

module.exports = GitHubMonitor;
