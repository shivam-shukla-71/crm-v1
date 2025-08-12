const jwt = require('jsonwebtoken');
require('dotenv').config();

class JWTUtil {
    // Generate access token (72 hours)
    static generateAccessToken(payload) {
        try {
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: process.env.JWT_EXPIRES_IN || '72h'
            });
            return token;
        } catch (error) {
            console.error('Error generating access token:', error);
            throw error;
        }
    }

    // Generate short-lived token (10 minutes)
    static generateShortLivedToken(payload) {
        try {
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: '10m'
            });
            return token;
        } catch (error) {
            console.error('Error generating short-lived token:', error);
            throw error;
        }
    }

    // Verify token
    static verifyToken(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return { valid: true, decoded };
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return { valid: false, reason: 'Token expired' };
            } else if (error.name === 'JsonWebTokenError') {
                return { valid: false, reason: 'Invalid token' };
            } else {
                return { valid: false, reason: 'Token verification failed' };
            }
        }
    }

    // Decode token without verification (for getting payload)
    static decodeToken(token) {
        try {
            const decoded = jwt.decode(token);
            return decoded;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    // Get token expiration time
    static getTokenExpiration(token) {
        try {
            const decoded = jwt.decode(token);
            if (decoded && decoded.exp) {
                return new Date(decoded.exp * 1000);
            }
            return null;
        } catch (error) {
            console.error('Error getting token expiration:', error);
            return null;
        }
    }

    // Check if token is expired
    static isTokenExpired(token) {
        try {
            const decoded = jwt.decode(token);
            if (decoded && decoded.exp) {
                const currentTime = Math.floor(Date.now() / 1000);
                return decoded.exp < currentTime;
            }
            return true;
        } catch (error) {
            console.error('Error checking token expiration:', error);
            return true;
        }
    }

    // Generate token payload for user
    static generateUserPayload(user) {
        return {
            user_id: user.id,
            email: user.email,
            role_id: user.role_id
        };
    }

    // Generate token payload for password reset
    static generatePasswordResetPayload(userId, email) {
        return {
            user_id: userId,
            email: email,
            purpose: 'password_reset'
        };
    }

    // Generate token payload for email update
    static generateEmailUpdatePayload(userId, currentEmail, newEmail) {
        return {
            user_id: userId,
            current_email: currentEmail,
            new_email: newEmail,
            purpose: 'email_update'
        };
    }
}

module.exports = JWTUtil;
