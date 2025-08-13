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

-- LEADS: CORE TABLES (MINIMAL: Facebook, Instagram, Website)

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

    -- Simple processing marker
    status ENUM('received','processed','failed') NOT NULL DEFAULT 'received',

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

-- PII and normalized answer values (1:1 with lead_meta)
CREATE TABLE IF NOT EXISTS lead_data (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lead_meta_id INT NOT NULL,
    entity_id INT NOT NULL,

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

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_leaddata_leadmeta FOREIGN KEY (lead_meta_id)
        REFERENCES lead_meta(id) ON DELETE CASCADE,
    CONSTRAINT fk_leaddata_entity FOREIGN KEY (entity_id)
        REFERENCES entities(id) ON DELETE RESTRICT,
    UNIQUE KEY uq_lead_meta_id (lead_meta_id),
    INDEX idx_entity_id (entity_id),
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_platform_page (platform_key, source_page_id)
);

-- (Reference tables removed for minimal setup)

-- (Processing/audit/backfill tables removed for minimal setup)