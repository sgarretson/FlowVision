#!/bin/bash
# Production Deployment Script for FlowVision
# Handles environment validation, database migrations, and zero-downtime deployment

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT="${1:-production}"
BACKUP_DIR="/opt/flowvision/backups"
DEPLOY_LOG="/var/log/flowvision/deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOY_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$DEPLOY_LOG"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$DEPLOY_LOG"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$DEPLOY_LOG"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "🔍 Running pre-deployment checks..."
    
    # Check if running as appropriate user
    if [[ "$ENVIRONMENT" == "production" && "$EUID" -eq 0 ]]; then
        error "Do not run production deployments as root!"
    fi
    
    # Check required directories
    mkdir -p "$BACKUP_DIR" "$(dirname "$DEPLOY_LOG")"
    
    # Check Docker and Docker Compose
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed or not in PATH"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed or not in PATH"
    fi
    
    # Check environment variables
    case "$ENVIRONMENT" in
        production)
            REQUIRED_VARS=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
            ;;
        staging)
            REQUIRED_VARS=("DATABASE_URL" "NEXTAUTH_SECRET" "NEXTAUTH_URL")
            ;;
        development)
            REQUIRED_VARS=("DATABASE_URL")
            ;;
        *)
            error "Invalid environment: $ENVIRONMENT. Use: production, staging, or development"
            ;;
    esac
    
    for var in "${REQUIRED_VARS[@]}"; do
        if [[ -z "${!var}" ]]; then
            error "Required environment variable $var is not set"
        fi
    done
    
    # Check disk space
    AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
    if [[ "$AVAILABLE_SPACE" -lt 2097152 ]]; then  # 2GB in KB
        warn "Low disk space: $(($AVAILABLE_SPACE / 1024 / 1024))GB available"
    fi
    
    success "Pre-deployment checks passed"
}

# Environment validation
validate_environment() {
    log "🧪 Validating environment configuration..."
    
    cd "$PROJECT_ROOT"
    
    # Run environment validation
    if command -v node &> /dev/null; then
        node scripts/init-security.js validate || warn "Environment validation issues detected"
    fi
    
    # Check Docker compose file
    case "$ENVIRONMENT" in
        production)
            COMPOSE_FILE="docker-compose.prod.yml"
            ;;
        staging)
            COMPOSE_FILE="docker-compose.yml"
            ;;
        development)
            COMPOSE_FILE="docker-compose.yml"
            ;;
    esac
    
    if [[ ! -f "$COMPOSE_FILE" ]]; then
        error "Docker compose file not found: $COMPOSE_FILE"
    fi
    
    # Validate compose file
    docker-compose -f "$COMPOSE_FILE" config > /dev/null || error "Invalid Docker compose configuration"
    
    success "Environment validation completed"
}

# Database backup
backup_database() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log "💾 Creating database backup..."
        
        BACKUP_FILE="$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql"
        
        # Create backup using pg_dump
        docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump \
            -U "$POSTGRES_USER" \
            -d "$POSTGRES_DB" \
            --no-owner --no-privileges > "$BACKUP_FILE" || error "Database backup failed"
        
        # Compress backup
        gzip "$BACKUP_FILE"
        BACKUP_FILE="${BACKUP_FILE}.gz"
        
        # Verify backup
        if [[ -f "$BACKUP_FILE" && -s "$BACKUP_FILE" ]]; then
            success "Database backup created: $BACKUP_FILE"
        else
            error "Database backup verification failed"
        fi
        
        # Cleanup old backups (keep last 30 days)
        find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +30 -delete
    fi
}

# Build application
build_application() {
    log "🏗️ Building application..."
    
    cd "$PROJECT_ROOT"
    
    # Pull latest changes (if in CI/CD)
    if [[ -n "$CI" ]]; then
        git fetch origin
        git reset --hard "origin/${GITHUB_REF#refs/heads/}"
    fi
    
    # Build Docker images
    case "$ENVIRONMENT" in
        production)
            docker-compose -f docker-compose.prod.yml build --no-cache
            ;;
        staging)
            docker-compose build --no-cache
            ;;
        development)
            docker-compose build
            ;;
    esac
    
    success "Application build completed"
}

# Database migrations
run_migrations() {
    log "🗄️ Running database migrations..."
    
    cd "$PROJECT_ROOT"
    
    case "$ENVIRONMENT" in
        production)
            # Run migrations in production mode
            docker-compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy
            ;;
        staging|development)
            docker-compose run --rm app npx prisma migrate dev
            ;;
    esac
    
    success "Database migrations completed"
}

# Health check
health_check() {
    log "🏥 Performing health check..."
    
    local max_attempts=30
    local attempt=1
    local health_endpoint
    
    case "$ENVIRONMENT" in
        production)
            health_endpoint="http://localhost/api/health"
            ;;
        *)
            health_endpoint="http://localhost:3000/api/health"
            ;;
    esac
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "$health_endpoint" > /dev/null; then
            success "Health check passed"
            return 0
        fi
        
        log "Health check attempt $attempt/$max_attempts failed, retrying in 10 seconds..."
        sleep 10
        ((attempt++))
    done
    
    error "Health check failed after $max_attempts attempts"
}

# Deploy application
deploy_application() {
    log "🚀 Deploying application..."
    
    cd "$PROJECT_ROOT"
    
    case "$ENVIRONMENT" in
        production)
            # Zero-downtime deployment for production
            log "Starting zero-downtime deployment..."
            
            # Start new services
            docker-compose -f docker-compose.prod.yml up -d --remove-orphans
            
            # Wait for services to be healthy
            log "Waiting for services to become healthy..."
            sleep 30
            
            # Perform health check
            health_check
            
            # Cleanup old images
            docker image prune -f
            ;;
            
        staging)
            docker-compose up -d --remove-orphans
            sleep 20
            health_check
            ;;
            
        development)
            docker-compose up -d
            sleep 15
            ;;
    esac
    
    success "Application deployment completed"
}

# Post-deployment tasks
post_deployment() {
    log "🧹 Running post-deployment tasks..."
    
    # Generate deployment report
    DEPLOY_REPORT="/tmp/deploy_report_$(date +%Y%m%d_%H%M%S).txt"
    {
        echo "FlowVision Deployment Report"
        echo "============================"
        echo "Environment: $ENVIRONMENT"
        echo "Timestamp: $(date)"
        echo "User: $(whoami)"
        echo "Git Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')"
        echo ""
        echo "Services Status:"
        docker-compose ps
        echo ""
        echo "Disk Usage:"
        df -h
        echo ""
        echo "Memory Usage:"
        free -h
    } > "$DEPLOY_REPORT"
    
    # Send notifications (if configured)
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"✅ FlowVision $ENVIRONMENT deployment completed successfully\"}" \
            "$SLACK_WEBHOOK_URL" > /dev/null 2>&1 || warn "Slack notification failed"
    fi
    
    # Cleanup
    docker system prune -f > /dev/null 2>&1 || true
    
    success "Post-deployment tasks completed"
    success "Deployment report: $DEPLOY_REPORT"
}

# Rollback function
rollback() {
    local backup_file="$1"
    
    error "🔄 Rolling back deployment..."
    
    if [[ -n "$backup_file" && -f "$backup_file" ]]; then
        log "Restoring database from backup: $backup_file"
        
        if [[ "$backup_file" == *.gz ]]; then
            gunzip -c "$backup_file" | docker-compose -f docker-compose.prod.yml exec -T postgres psql \
                -U "$POSTGRES_USER" -d "$POSTGRES_DB"
        else
            docker-compose -f docker-compose.prod.yml exec -T postgres psql \
                -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$backup_file"
        fi
    fi
    
    # Restart previous version (this would need more sophisticated logic in a real deployment)
    docker-compose -f docker-compose.prod.yml restart
    
    error "Rollback completed"
}

# Trap for cleanup on exit
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        error "Deployment failed with exit code $exit_code"
        
        # In production, trigger rollback
        if [[ "$ENVIRONMENT" == "production" && -n "$BACKUP_FILE" ]]; then
            rollback "$BACKUP_FILE"
        fi
    fi
}
trap cleanup EXIT

# Main deployment flow
main() {
    log "🎯 Starting FlowVision deployment to $ENVIRONMENT environment"
    
    pre_deployment_checks
    validate_environment
    
    # Backup before production deployment
    if [[ "$ENVIRONMENT" == "production" ]]; then
        backup_database
    fi
    
    build_application
    run_migrations
    deploy_application
    post_deployment
    
    success "🎉 FlowVision deployment to $ENVIRONMENT completed successfully!"
}

# Help function
show_help() {
    cat << EOF
FlowVision Deployment Script

Usage: $0 [ENVIRONMENT]

ENVIRONMENT:
    production  - Deploy to production environment
    staging     - Deploy to staging environment  
    development - Deploy to development environment (default)

Examples:
    $0                    # Deploy to development
    $0 staging           # Deploy to staging
    $0 production        # Deploy to production

Environment Variables:
    DATABASE_URL         - Database connection string
    NEXTAUTH_SECRET      - NextAuth secret key
    NEXTAUTH_URL         - Application URL
    SLACK_WEBHOOK_URL    - Slack notifications (optional)
    
EOF
}

# Script entry point
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    show_help
    exit 0
fi

# Execute main function
main "$@"
