#!/bin/bash

# FlowVision Repository Cleanup Script
# Cleans up stale branches, optimizes repository, and addresses open issues

set -e

echo "🧹 FlowVision Repository Cleanup Script"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LOG_DIR="./debug-logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOG_DIR/repository-cleanup_${TIMESTAMP}.log"

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

# Start cleanup
log_section "Repository Cleanup Starting"
log "Timestamp: $(date)"
log "Current branch: $(git branch --show-current)"
log "Working directory: $(pwd)"

log_section "Fetching Latest Repository State"
git fetch origin --prune
log_success "Fetched latest changes and pruned stale references"

log_section "Analyzing Branch Status"

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
log "Current branch: $CURRENT_BRANCH"

# List all remote branches
log "Remote branches:"
git branch -r | grep -v HEAD | sed 's/origin\///' | while read branch; do
    if [ "$branch" != "main" ] && [ "$branch" != "$CURRENT_BRANCH" ]; then
        LAST_COMMIT=$(git log -1 --format="%cr" "origin/$branch" 2>/dev/null || echo "unknown")
        log "  - $branch: last commit $LAST_COMMIT"
    fi
done

log_section "Identifying Stale Branches"

# Define stale branch threshold (7 days)
SEVEN_DAYS_AGO=$(date -d '7 days ago' +%s 2>/dev/null || date -j -v-7d +%s)

STALE_BRANCHES=()
git branch -r | grep -v HEAD | sed 's/origin\///' | while read branch; do
    if [ "$branch" != "main" ] && [ "$branch" != "$CURRENT_BRANCH" ]; then
        # Get the last commit date
        COMMIT_DATE=$(git log -1 --format="%ct" "origin/$branch" 2>/dev/null || echo "0")
        
        if [ "$COMMIT_DATE" -lt "$SEVEN_DAYS_AGO" ] 2>/dev/null; then
            log_warning "Stale branch detected: $branch (last commit: $(git log -1 --format="%cr" "origin/$branch" 2>/dev/null))"
            echo "$branch" >> "$LOG_DIR/stale_branches_${TIMESTAMP}.txt"
        fi
    fi
done

log_section "Checking Merged Branches"

# Check which branches have been merged
MERGED_BRANCHES=()
git branch -r --merged main | grep -v HEAD | grep -v main | sed 's/origin\///' | while read branch; do
    if [ "$branch" != "$CURRENT_BRANCH" ]; then
        log_warning "Merged branch detected: $branch"
        echo "$branch" >> "$LOG_DIR/merged_branches_${TIMESTAMP}.txt"
    fi
done

log_section "Repository Size Analysis"

# Analyze repository size
REPO_SIZE=$(du -sh .git 2>/dev/null | cut -f1)
log "Git repository size: $REPO_SIZE"

# Count objects
OBJECT_COUNT=$(git count-objects -v | grep "count" | head -1 | awk '{print $2}')
PACK_COUNT=$(git count-objects -v | grep "in-pack" | awk '{print $2}')
log "Loose objects: $OBJECT_COUNT"
log "Packed objects: $PACK_COUNT"

log_section "Dependency Analysis"

# Check for unused dependencies
if command -v npm &> /dev/null; then
    log "Analyzing npm dependencies..."
    
    # Check for security vulnerabilities
    if npm audit --audit-level=moderate > "$LOG_DIR/npm_audit_${TIMESTAMP}.log" 2>&1; then
        log_success "No critical security vulnerabilities found"
    else
        VULN_COUNT=$(grep -c "vulnerability" "$LOG_DIR/npm_audit_${TIMESTAMP}.log" 2>/dev/null || echo "0")
        if [ "$VULN_COUNT" -gt 0 ]; then
            log_warning "$VULN_COUNT security vulnerabilities found - see audit log"
        fi
    fi
    
    # Check for outdated packages
    if npm outdated > "$LOG_DIR/npm_outdated_${TIMESTAMP}.log" 2>/dev/null; then
        log_success "All packages are up to date"
    else
        OUTDATED_COUNT=$(wc -l < "$LOG_DIR/npm_outdated_${TIMESTAMP}.log" 2>/dev/null || echo "0")
        if [ "$OUTDATED_COUNT" -gt 1 ]; then  # Header line counts as 1
            log_warning "$((OUTDATED_COUNT - 1)) outdated packages found - see outdated log"
        fi
    fi
fi

log_section "Git Maintenance"

# Run git maintenance
log "Running git maintenance..."
git gc --auto
log_success "Git garbage collection completed"

# Optimize repository
git repack -a -d --depth=250 --window=250
log_success "Repository repacking completed"

log_section "Issue Analysis"

# Check open GitHub issues if GitHub CLI is available
if command -v gh &> /dev/null; then
    log "Analyzing GitHub issues..."
    
    # Get issue counts by priority
    P0_COUNT=$(gh issue list --label "p0" --json number | jq length 2>/dev/null || echo "0")
    P1_COUNT=$(gh issue list --label "p1" --json number | jq length 2>/dev/null || echo "0")
    TOTAL_ISSUES=$(gh issue list --json number | jq length 2>/dev/null || echo "0")
    
    log "Total open issues: $TOTAL_ISSUES"
    log "P0 (critical) issues: $P0_COUNT"
    log "P1 (high) issues: $P1_COUNT"
    
    if [ "$P0_COUNT" -gt 0 ]; then
        log_warning "$P0_COUNT critical issues need attention"
        gh issue list --label "p0" --json number,title | jq -r '.[] | "  - #\(.number): \(.title)"' >> "$LOG_FILE"
    fi
else
    log_warning "GitHub CLI not available - skipping issue analysis"
fi

log_section "Workflow Analysis"

# Check workflow files
WORKFLOW_DIR=".github/workflows"
if [ -d "$WORKFLOW_DIR" ]; then
    WORKFLOW_COUNT=$(find "$WORKFLOW_DIR" -name "*.yml" -o -name "*.yaml" | wc -l)
    log "GitHub workflow files: $WORKFLOW_COUNT"
    
    # List workflow files
    find "$WORKFLOW_DIR" -name "*.yml" -o -name "*.yaml" | while read workflow; do
        FILENAME=$(basename "$workflow")
        log "  - $FILENAME"
    done
    
    # Check for recent workflow failures if GitHub CLI is available
    if command -v gh &> /dev/null; then
        FAILED_RUNS=$(gh run list --limit 10 --json conclusion | jq '[.[] | select(.conclusion == "failure")] | length' 2>/dev/null || echo "0")
        if [ "$FAILED_RUNS" -gt 0 ]; then
            log_warning "$FAILED_RUNS recent workflow failures detected"
        else
            log_success "No recent workflow failures"
        fi
    fi
fi

log_section "Cleanup Recommendations"

log "📋 Cleanup Recommendations:"

# Branch cleanup recommendations
if [ -f "$LOG_DIR/stale_branches_${TIMESTAMP}.txt" ]; then
    STALE_COUNT=$(wc -l < "$LOG_DIR/stale_branches_${TIMESTAMP}.txt" 2>/dev/null || echo "0")
    if [ "$STALE_COUNT" -gt 0 ]; then
        log "1. Consider deleting $STALE_COUNT stale branches (see stale_branches_${TIMESTAMP}.txt)"
    fi
fi

if [ -f "$LOG_DIR/merged_branches_${TIMESTAMP}.txt" ]; then
    MERGED_COUNT=$(wc -l < "$LOG_DIR/merged_branches_${TIMESTAMP}.txt" 2>/dev/null || echo "0")
    if [ "$MERGED_COUNT" -gt 0 ]; then
        log "2. Consider deleting $MERGED_COUNT merged branches (see merged_branches_${TIMESTAMP}.txt)"
    fi
fi

# Dependency recommendations
if [ -f "$LOG_DIR/npm_outdated_${TIMESTAMP}.log" ]; then
    OUTDATED_COUNT=$(wc -l < "$LOG_DIR/npm_outdated_${TIMESTAMP}.log" 2>/dev/null || echo "0")
    if [ "$OUTDATED_COUNT" -gt 1 ]; then
        log "3. Update $((OUTDATED_COUNT - 1)) outdated packages (see npm_outdated_${TIMESTAMP}.log)"
    fi
fi

# Security recommendations
if [ -f "$LOG_DIR/npm_audit_${TIMESTAMP}.log" ]; then
    VULN_COUNT=$(grep -c "vulnerability" "$LOG_DIR/npm_audit_${TIMESTAMP}.log" 2>/dev/null || echo "0")
    if [ "$VULN_COUNT" -gt 0 ]; then
        log "4. Address $VULN_COUNT security vulnerabilities (see npm_audit_${TIMESTAMP}.log)"
    fi
fi

log_section "Automated Cleanup Actions"

# Only perform safe automated actions
log "Performing safe automated cleanup..."

# Clean up local tracking branches for deleted remotes
git remote prune origin
log_success "Pruned stale remote tracking branches"

# Clean up .DS_Store files (macOS)
if find . -name ".DS_Store" -type f -delete 2>/dev/null; then
    log_success "Removed .DS_Store files"
fi

# Clean up temporary files
find . -name "*.tmp" -type f -delete 2>/dev/null || true
find . -name "*~" -type f -delete 2>/dev/null || true
log_success "Removed temporary files"

# Clean up log files older than 7 days
find "$LOG_DIR" -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
log_success "Cleaned up old log files"

log_section "Cleanup Summary"

log "📊 Repository Cleanup Summary:"
log "Repository size: $REPO_SIZE"
log "Git objects: $OBJECT_COUNT loose, $PACK_COUNT packed"
log "Workflow files: ${WORKFLOW_COUNT:-0}"
log "Open issues: ${TOTAL_ISSUES:-0} total (${P0_COUNT:-0} critical)"

# Calculate space saved (rough estimate)
NEW_REPO_SIZE=$(du -sh .git 2>/dev/null | cut -f1)
log "Repository size after cleanup: $NEW_REPO_SIZE"

log ""
log "${GREEN}✅ Repository cleanup completed successfully!${NC}"
log "📁 Detailed logs saved to: $LOG_FILE"
log "📋 Review recommendations in the log file for manual cleanup tasks"

log_section "Manual Cleanup Script"

# Generate a script for manual cleanup
MANUAL_SCRIPT="$LOG_DIR/manual_cleanup_${TIMESTAMP}.sh"
cat > "$MANUAL_SCRIPT" << 'EOF'
#!/bin/bash
# Manual cleanup script generated by repository cleanup
# Review each command before executing

echo "Manual Repository Cleanup Actions"
echo "================================"
echo "⚠️  Review each command before executing!"
echo ""

# Branch deletion commands (commented out for safety)
echo "# Delete stale branches (REVIEW FIRST):"
EOF

if [ -f "$LOG_DIR/stale_branches_${TIMESTAMP}.txt" ]; then
    while read branch; do
        echo "# git push origin --delete $branch  # Delete remote branch" >> "$MANUAL_SCRIPT"
        echo "# git branch -D $branch  # Delete local branch (if exists)" >> "$MANUAL_SCRIPT"
    done < "$LOG_DIR/stale_branches_${TIMESTAMP}.txt"
fi

cat >> "$MANUAL_SCRIPT" << 'EOF'

echo ""
echo "# Update outdated packages:"
echo "# npm update  # Update all packages"
echo "# npm audit fix  # Fix security vulnerabilities"

echo ""
echo "# Advanced cleanup (use with caution):"
echo "# git reflog expire --expire=now --all"
echo "# git gc --prune=now --aggressive"

echo ""
echo "Cleanup script completed. Review and execute commands as needed."
EOF

chmod +x "$MANUAL_SCRIPT"
log "📝 Manual cleanup script created: $MANUAL_SCRIPT"

echo ""
echo "🎉 Repository cleanup analysis completed!"
echo "📁 Check logs in $LOG_DIR for detailed information"
echo "🔧 Run $MANUAL_SCRIPT for additional cleanup options"
