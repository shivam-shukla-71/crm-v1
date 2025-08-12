-- =====================================================
-- CRM Database Setup Script - Users Only
-- =====================================================

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS crm_database;
USE crm_database;

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
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role_id (role_id),
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
INSERT INTO users (username, email, password_hash, first_name, last_name, role_id, phone, is_verified) VALUES
('admin', 'admin@crm.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5u.Gi', 'Admin', 'User', 1, '+1234567890', TRUE),
('manager1', 'manager@crm.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5u.Gi', 'John', 'Manager', 2, '+1234567891', TRUE),
('sales1', 'sales@crm.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5u.Gi', 'Jane', 'Sales', 3, '+1234567892', FALSE);

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

/*
This database schema is designed for a basic CRM system with user management and authentication.

Features:
1. User Management: Different user roles (admin, manager, sales_rep, support)
2. Role Management: Separate roles table for better flexibility
3. User Verification: is_verified field to track verified users
4. User Status: is_active field to enable/disable users
5. OTP Management: Support for verification, password reset, and email update
6. Token Management: Secure tokens for password reset and email update
7. Security: Password hashing support
8. Audit Trail: Timestamp tracking for created_at and updated_at

Key Features:
- Foreign key constraints for data integrity
- Proper indexing for performance
- Timestamp tracking for audit trails
- Role-based access control
- OTP rate limiting support (3 per hour, 5 min expiry)
- Token expiration management
- Sample data for testing

To use this database:
1. Run this script in your MySQL server
2. Update the .env file with your database credentials
3. The application will automatically connect to this database
*/
