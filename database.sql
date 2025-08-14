-- =====================================================
-- CRM Database Setup Script - Users Only
-- =====================================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS crm_database;
USE crm_database;

-- =====================================================
-- ENTITIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS entities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL
);

-- =====================================================
-- ROLES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role_id INT NOT NULL,
    entity_id INT NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE RESTRICT,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role_id (role_id),
    INDEX idx_entity_id (entity_id),
    INDEX idx_is_verified (is_verified),
    INDEX idx_is_active (is_active)
);

-- =====================================================
-- OTPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS otps (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    email VARCHAR(100) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    type ENUM('verification', 'password_reset', 'email_update') NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_email (user_id, email),
    INDEX idx_expires_at (expires_at),
    INDEX idx_type (type)
);

-- =====================================================
-- PASSWORD RESET TOKENS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
);

-- =====================================================
-- EMAIL UPDATE TOKENS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS email_update_tokens (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    new_email VARCHAR(100) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_token (token),
    INDEX idx_expires_at (expires_at)
);

-- =====================================================
-- INSERT ENTITIES DATA
-- =====================================================
INSERT INTO entities (name) VALUES
('fxcareers'),
('yamarkets'),
('nxgmarkets');

-- =====================================================
-- INSERT ROLES DATA
-- =====================================================

-- Insert roles
INSERT INTO roles (role) VALUES
('admin'),
('manager'),
('sales_rep'),
('support');

-- =====================================================
-- SAMPLE USERS DATA
-- =====================================================

-- Insert sample users (password_hash is 'password123' hashed with bcrypt)
-- Note: entity_id 1 corresponds to 'fxcareers'
INSERT INTO users (username, email, password_hash, first_name, last_name, role_id, entity_id, phone, is_verified) VALUES
('admin', 'admin@crm.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5u.Gi', 'Admin', 'User', 1, 1, '+1234567890', TRUE),
('manager1', 'manager@crm.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5u.Gi', 'John', 'Manager', 2, 1, '+1234567891', TRUE),
('sales1', 'sales@crm.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5u.Gi', 'Jane', 'Sales', 3, 1, '+1234567892', FALSE);

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

/*
This database schema is designed for a basic CRM system with user management and authentication.

Features:
1. Entity Management: Multi-tenant support with separate company entities
2. User Management: Different user roles (admin, manager, sales_rep, support) with entity association
3. Role Management: Separate roles table for better flexibility
4. User Verification: is_verified field to track verified users
5. User Status: is_active field to enable/disable users
6. OTP Management: Support for verification, password reset, and email update
7. Token Management: Secure tokens for password reset and email update
8. Security: Password hashing support
9. Audit Trail: Timestamp tracking for created_at and updated_at
10. Lead Management: Complete lead lifecycle with assignment, status tracking, and stage management

Key Features:
- Foreign key constraints for data integrity
- Proper indexing for performance
- Timestamp tracking for audit trails
- Role-based access control
- Entity-based multi-tenancy
- OTP rate limiting support (3 per hour, 5 min expiry)
- Token expiration management
- Sample data for testing

To use this database:
1. Run this script in your MySQL server
2. Update the .env file with your database credentials
3. The application will automatically connect to this database
*/

-- =====================================================
-- LEADS: CORE TABLES (MINIMAL: Facebook, Instagram, Website)
-- =====================================================

-- Non-PII transport, attribution, and minimal context
CREATE TABLE IF NOT EXISTS lead_meta (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entity_id INT NOT NULL,
    platform_key ENUM('facebook','instagram','website') NOT NULL,
    source_lead_id VARCHAR(128) NOT NULL,

    -- Attribution identifiers
    page_id VARCHAR(64),
    form_id VARCHAR(64),
    ad_id VARCHAR(64),
    campaign_id VARCHAR(64),

    -- Provider created time and receipt time
    created_time DATETIME NULL,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Minimal website context
    page_url VARCHAR(512),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(150),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),

    -- Processing status
    processing_status ENUM('received','processed','failed') NOT NULL DEFAULT 'received',

    -- Constraints and indexes
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_platform_source_lead (platform_key, source_lead_id, entity_id),
    INDEX idx_entity_id (entity_id),
    INDEX idx_created_time (created_time),
    INDEX idx_form_id (form_id),
    INDEX idx_page_id (page_id),
    INDEX idx_campaign_id (campaign_id),
    INDEX idx_utm_source_campaign (utm_source, utm_campaign)
);

-- PII and normalized answer values (1:1 with lead_meta) - This is the MAIN LEAD table
CREATE TABLE IF NOT EXISTS lead_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entity_id INT NOT NULL,
    lead_meta_id INT NOT NULL,

    -- Normalized contact fields
    email VARCHAR(150),
    phone VARCHAR(30),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(200),

    -- Original provider answers
    raw_field_data JSON,

    -- Consent timestamp if provided
    consent_time DATETIME,

    -- Denormalized attribution for reporting
    platform_key ENUM('facebook','instagram','website') NOT NULL,
    source_page_id VARCHAR(64),
    source_page_name VARCHAR(150),

    -- Lead lifecycle and status
    status ENUM('new','qualified','contacted','meeting_scheduled','proposal_sent','negotiation','won','lost') NOT NULL DEFAULT 'new',
    assigned_user_id INT NULL,
    assigned_at DATETIME NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_leaddata_leadmeta FOREIGN KEY (lead_meta_id)
        REFERENCES lead_meta(id) ON DELETE CASCADE,
    CONSTRAINT fk_leaddata_entity FOREIGN KEY (entity_id)
        REFERENCES entities(id) ON DELETE RESTRICT,
    CONSTRAINT fk_leaddata_assigned_user FOREIGN KEY (assigned_user_id)
        REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY uq_lead_meta_id (lead_meta_id),
    INDEX idx_entity_id (entity_id),
    INDEX idx_entity_status (entity_id, status),
    INDEX idx_assigned_user (assigned_user_id),
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_platform_page (platform_key, source_page_id)
);

-- =====================================================
-- LEADS: STATUS AND STAGE MANAGEMENT
-- =====================================================

-- Lead statuses reference table (global, same for all entities)
CREATE TABLE IF NOT EXISTS lead_statuses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_is_active (is_active)
);

-- Lead assignments tracking (entity-isolated)
CREATE TABLE IF NOT EXISTS lead_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entity_id INT NOT NULL,
    lead_id INT NOT NULL,                    -- References lead_data.id (the actual lead)
    assigned_user_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by_user_id INT NOT NULL,
    previous_user_id INT NULL,
    reassignment_reason VARCHAR(255),
    notes TEXT,
    
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE RESTRICT,
    FOREIGN KEY (lead_id) REFERENCES lead_data(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    UNIQUE KEY uq_lead_assignment (lead_id),  -- One assignment per lead
    INDEX idx_entity_assigned_user (entity_id, assigned_user_id),
    INDEX idx_assigned_at (assigned_at),
    INDEX idx_entity_lead (entity_id, lead_id)
);

-- Lead stage progression tracking (entity-isolated)
CREATE TABLE IF NOT EXISTS lead_stages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entity_id INT NOT NULL,
    lead_id INT NOT NULL,                    -- References lead_data.id
    status_id INT NOT NULL,                  -- References lead_statuses
    entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exited_at TIMESTAMP NULL,
    duration_hours DECIMAL(10,2) NULL,
    user_id INT NOT NULL,                    -- Who moved it to this stage
    notes TEXT,
    next_action_required VARCHAR(255),
    
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE RESTRICT,
    FOREIGN KEY (lead_id) REFERENCES lead_data(id) ON DELETE CASCADE,
    FOREIGN KEY (status_id) REFERENCES lead_statuses(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_entity_lead (entity_id, lead_id),
    INDEX idx_entity_status (entity_id, status_id),
    INDEX idx_entered_at (entered_at),
    INDEX idx_exited_at (exited_at)
);

-- Lead activities and interactions (entity-isolated)
CREATE TABLE IF NOT EXISTS lead_activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entity_id INT NOT NULL,
    lead_id INT NOT NULL,                    -- References lead_data.id
    user_id INT NOT NULL,                    -- Must belong to same entity
    activity_type ENUM('call','email','meeting','note','status_change','assignment','follow_up') NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_follow_up_date DATETIME NULL,
    priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
    status ENUM('pending','completed','cancelled') DEFAULT 'pending',
    
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE RESTRICT,
    FOREIGN KEY (lead_id) REFERENCES lead_data(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    
    INDEX idx_entity_lead (entity_id, lead_id),
    INDEX idx_entity_user (entity_id, user_id),
    INDEX idx_activity_type (activity_type),
    INDEX idx_next_follow_up (next_follow_up_date),
    INDEX idx_created_at (created_at)
);

-- =====================================================
-- INSERT DEFAULT LEAD STATUSES
-- =====================================================

INSERT INTO lead_statuses (name, description) VALUES
('new', 'New lead received'),
('qualified', 'Lead qualified and ready for contact'),
('contacted', 'Initial contact made'),
('meeting_scheduled', 'Meeting or call scheduled'),
('proposal_sent', 'Proposal or quote sent'),
('negotiation', 'In negotiation phase'),
('won', 'Lead converted to customer'),
('lost', 'Lead lost or disqualified');

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

/*
LEAD MANAGEMENT SYSTEM FEATURES:

1. Entity Isolation: All lead data is isolated by entity_id
2. Lead Identification: lead_data.id is the primary lead identifier
3. Status Management: Predefined lead statuses with customizable workflow
4. Assignment Tracking: Complete history of lead assignments and reassignments
5. Stage Progression: Track time spent in each stage with performance metrics
6. Activity Logging: Log all interactions, calls, emails, and notes
7. Follow-up Management: Schedule and track follow-up activities
8. Performance Analytics: Entity-specific metrics and reporting

KEY RELATIONSHIPS:
- lead_data.id is the main lead identifier used throughout the system
- lead_meta stores technical metadata (platform, source, UTM params)
- lead_assignments tracks current and historical assignments
- lead_stages tracks stage progression and duration
- lead_activities logs all interactions and follow-ups

SECURITY FEATURES:
- Entity-based data isolation prevents cross-entity access
- Foreign key constraints ensure data integrity
- Proper indexing for performance on entity-scoped queries
- Role-based access control within entity boundaries

USAGE EXAMPLES:
- Get lead: SELECT * FROM lead_data WHERE id = ? AND entity_id = ?
- Assign lead: INSERT INTO lead_assignments (entity_id, lead_id, assigned_user_id, ...)
- Update status: INSERT INTO lead_stages (entity_id, lead_id, status_id, ...)
- Log activity: INSERT INTO lead_activities (entity_id, lead_id, user_id, ...)
*/

-- Analytics & Reporting Tables

-- Report Templates Table
CREATE TABLE report_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entity_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    report_type ENUM('lead_summary', 'platform_performance', 'user_performance', 'conversion_funnel', 'time_based', 'activity_summary', 'sla_compliance') NOT NULL,
    filters JSON,
    group_by VARCHAR(100),
    sort_by VARCHAR(100) DEFAULT 'created_at',
    sort_order ENUM('ASC', 'DESC') DEFAULT 'DESC',
    schedule JSON,
    recipients JSON,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
    INDEX idx_entity_report_type (entity_id, report_type),
    INDEX idx_active_templates (entity_id, is_active)
);

-- Generated Reports Table
CREATE TABLE generated_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entity_id INT NOT NULL,
    template_id INT,
    report_type ENUM('lead_summary', 'platform_performance', 'user_performance', 'conversion_funnel', 'time_based', 'activity_summary', 'sla_compliance') NOT NULL,
    filters JSON,
    data JSON,
    generated_by INT NOT NULL,
    format ENUM('json', 'csv') DEFAULT 'json',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES report_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_entity_generated (entity_id, generated_at),
    INDEX idx_template_reports (template_id),
    INDEX idx_user_reports (generated_by),
    INDEX idx_report_type (entity_id, report_type)
);

-- Report Schedules Table
CREATE TABLE report_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entity_id INT NOT NULL,
    template_id INT NOT NULL,
    frequency ENUM('daily', 'weekly', 'monthly') NOT NULL,
    time TIME NOT NULL,
    day_of_week TINYINT, -- 0-6 (Sunday = 0)
    day_of_month TINYINT, -- 1-31
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES report_templates(id) ON DELETE CASCADE,
    INDEX idx_entity_active_schedules (entity_id, is_active),
    INDEX idx_template_schedules (template_id),
    INDEX idx_schedule_time (frequency, time)
);

-- Report Execution Logs Table
CREATE TABLE report_execution_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entity_id INT NOT NULL,
    schedule_id INT,
    template_id INT,
    report_id INT,
    execution_status ENUM('success', 'failed', 'in_progress') NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    error_message TEXT,
    execution_time_ms INT,
    records_processed INT,
    file_size_bytes INT,
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE,
    FOREIGN KEY (schedule_id) REFERENCES report_schedules(id) ON DELETE SET NULL,
    FOREIGN KEY (template_id) REFERENCES report_templates(id) ON DELETE SET NULL,
    FOREIGN KEY (report_id) REFERENCES generated_reports(id) ON DELETE SET NULL,
    INDEX idx_entity_execution (entity_id, started_at),
    INDEX idx_schedule_execution (schedule_id, started_at),
    INDEX idx_execution_status (entity_id, execution_status)
);