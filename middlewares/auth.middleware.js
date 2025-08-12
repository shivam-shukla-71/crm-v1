const JWTUtil = require('../utils/jwt.util');
const { executeQuery } = require('../config/database');

// Verify JWT token middleware
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        const token = authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : authHeader;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        // Verify token
        const tokenResult = JWTUtil.verifyToken(token);

        if (!tokenResult.valid) {
            return res.status(401).json({
                success: false,
                message: tokenResult.reason
            });
        }

        // Check if user still exists and is active
        const userQuery = `
            SELECT u.id, u.username, u.email, u.first_name, u.last_name, 
                   u.role_id, u.phone, u.is_active, u.is_verified, r.role
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.id = ? AND u.is_active = TRUE
        `;

        const users = await executeQuery(userQuery, [tokenResult.decoded.user_id]);

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found or account is inactive'
            });
        }

        const user = users[0];

        // Check if user is verified (except for admin operations)
        if (!user.is_verified && req.path !== '/api/auth/verify-otp') {
            return res.status(403).json({
                success: false,
                message: 'Account not verified. Please verify your email first.'
            });
        }

        // Add user info to request
        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role_id: user.role_id,
            role: user.role,
            phone: user.phone,
            is_active: user.is_active,
            is_verified: user.is_verified
        };

        next();
    } catch (error) {
        console.error('Error in token verification:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during authentication'
        });
    }
};

// Verify short-lived token middleware (for password reset, email update)
const verifyShortLivedToken = async (req, res, next) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token is required'
            });
        }

        // Verify token
        const tokenResult = JWTUtil.verifyToken(token);

        if (!tokenResult.valid) {
            return res.status(401).json({
                success: false,
                message: tokenResult.reason
            });
        }

        // Check if user exists
        const userQuery = `
            SELECT u.id, u.username, u.email, u.first_name, u.last_name, 
                   u.role_id, u.phone, u.is_active, u.is_verified
            FROM users u
            WHERE u.id = ? AND u.is_active = TRUE
        `;

        const users = await executeQuery(userQuery, [tokenResult.decoded.user_id]);

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found or account is inactive'
            });
        }

        const user = users[0];

        // Add user info to request
        req.user = user;
        req.tokenPayload = tokenResult.decoded;

        next();
    } catch (error) {
        console.error('Error in short-lived token verification:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during token verification'
        });
    }
};

// Optional token verification (for endpoints that can work with or without auth)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return next(); // Continue without authentication
        }

        const token = authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : authHeader;

        if (!token) {
            return next(); // Continue without authentication
        }

        // Try to verify token
        const tokenResult = JWTUtil.verifyToken(token);

        if (tokenResult.valid) {
            // Check if user exists and is active
            const userQuery = `
                SELECT u.id, u.username, u.email, u.first_name, u.last_name, 
                       u.role_id, u.phone, u.is_active, u.is_verified, r.role
                FROM users u
                JOIN roles r ON u.role_id = r.id
                WHERE u.id = ? AND u.is_active = TRUE
            `;

            const users = await executeQuery(userQuery, [tokenResult.decoded.user_id]);

            if (users.length > 0) {
                const user = users[0];
                req.user = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    role_id: user.role_id,
                    role: user.role,
                    phone: user.phone,
                    is_active: user.is_active,
                    is_verified: user.is_verified
                };
            }
        }

        next();
    } catch (error) {
        console.error('Error in optional authentication:', error);
        next(); // Continue without authentication on error
    }
};

module.exports = {
    verifyToken,
    verifyShortLivedToken,
    optionalAuth
};
