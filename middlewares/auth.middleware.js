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
                   u.role_id, u.entity_id, u.phone, u.is_active, u.is_verified, 
                   r.role, e.name as entity_name
            FROM users u
            JOIN roles r ON r.id = u.role_id
            JOIN entities e ON e.id = u.entity_id
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

        // Add user info to request with entity information
        req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role_id: user.role_id,
            role: user.role,
            entity_id: user.entity_id,
            entity_name: user.entity_name,
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
                   u.role_id, u.entity_id, u.phone, u.is_active, u.is_verified
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
                       u.role_id, u.entity_id, u.phone, u.is_active, u.is_verified, r.role
                FROM users u
                JOIN roles r ON r.id = u.role_id
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
                    entity_id: user.entity_id,
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

// Entity access control middleware
const requireEntityAccess = (req, res, next) => {
    const userEntityId = req.user?.entity_id;
    const requestedEntityId = req.params.entityId || req.body.entity_id;

    if (requestedEntityId && parseInt(requestedEntityId) !== userEntityId) {
        return res.status(403).json({
            success: false,
            message: 'Access denied: Cannot access data from other entities'
        });
    }
    next();
};

// Lead entity access middleware
const requireLeadEntityAccess = async (req, res, next) => {
    try {
        const leadId = req.params.id;
        const userEntityId = req.user.entity_id;

        if (!leadId || !userEntityId) {
            return res.status(400).json({
                success: false,
                message: 'Lead ID and user entity are required'
            });
        }

        // Verify lead belongs to user's entity
        const leadQuery = `
            SELECT id, entity_id, status, assigned_user_id 
            FROM lead_data 
            WHERE id = ? AND entity_id = ?
        `;

        const leads = await executeQuery(leadQuery, [leadId, userEntityId]);

        if (leads.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found or access denied'
            });
        }

        req.lead = leads[0];
        next();
    } catch (error) {
        console.error('Error in lead entity access check:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during access verification'
        });
    }
};

module.exports = {
    verifyToken,
    verifyShortLivedToken,
    optionalAuth,
    requireEntityAccess,
    requireLeadEntityAccess
};
