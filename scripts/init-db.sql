-- Database initialization script for FlowVision
-- Creates necessary extensions and configurations

-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types if needed
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'LEADER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create indexes for better performance
-- These will be created after Prisma migration, so we use IF NOT EXISTS

-- User table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON "User"(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON "User"(role);

-- Issue table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_issues_heatmap_score ON "Issue"(heatmapScore DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_issues_votes ON "Issue"(votes DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_issues_created_at ON "Issue"(createdAt DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_issues_department ON "Issue"(department);

-- Initiative table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_initiatives_owner ON "Initiative"(ownerId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_initiatives_status ON "Initiative"(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_initiatives_priority ON "Initiative"(priority DESC);

-- Audit log indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_user ON "AuditLog"(userId);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_timestamp ON "AuditLog"(timestamp DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_action ON "AuditLog"(action);

-- Full text search indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_issues_description_search 
    ON "Issue" USING gin(to_tsvector('english', description));
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_initiatives_title_search 
    ON "Initiative" USING gin(to_tsvector('english', title));

-- Performance monitoring views
CREATE OR REPLACE VIEW active_users AS
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'LEADER' THEN 1 END) as leader_count,
    COUNT(CASE WHEN "createdAt" > NOW() - INTERVAL '30 days' THEN 1 END) as recent_users
FROM "User";

CREATE OR REPLACE VIEW system_health AS
SELECT 
    (SELECT COUNT(*) FROM "Issue") as total_issues,
    (SELECT COUNT(*) FROM "Initiative") as total_initiatives,
    (SELECT COUNT(*) FROM "User") as total_users,
    (SELECT COUNT(*) FROM "AuditLog" WHERE timestamp > NOW() - INTERVAL '24 hours') as daily_activity,
    (SELECT AVG(heatmapScore) FROM "Issue") as avg_issue_severity,
    NOW() as last_check;

-- Create a function to clean up old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM "AuditLog" 
    WHERE timestamp < NOW() - INTERVAL '1 year';
    
    -- Log the cleanup
    INSERT INTO "AuditLog" (action, details, timestamp)
    VALUES ('SYSTEM_CLEANUP', '{"operation": "audit_log_cleanup"}', NOW());
END;
$$ LANGUAGE plpgsql;

-- Create a function to update search vectors
CREATE OR REPLACE FUNCTION update_search_vectors()
RETURNS void AS $$
BEGIN
    -- Update issue search vectors
    UPDATE "Issue" 
    SET search_vector = to_tsvector('english', description)
    WHERE search_vector IS NULL;
    
    -- Update initiative search vectors
    UPDATE "Initiative" 
    SET search_vector = to_tsvector('english', title || ' ' || COALESCE(description, ''))
    WHERE search_vector IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT CONNECT ON DATABASE flowvision TO flowvision;
GRANT USAGE ON SCHEMA public TO flowvision;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO flowvision;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO flowvision;

-- Set up connection pooling parameters
ALTER SYSTEM SET max_connections = '200';
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET work_mem = '4MB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';

-- Configure logging for security monitoring
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log slow queries
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';

-- Reload configuration
SELECT pg_reload_conf();
