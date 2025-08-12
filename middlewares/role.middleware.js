const { executeQuery } = require('../config/database');

// Check if user has admin role
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Check if user has admin role (role_id = 1)
        if (req.user.role_id !== 1) {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        next();
    } catch (error) {
        console.error('Error in admin role check:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during role verification'
        });
    }
};

// Check if user has manager or admin role
const requireManagerOrAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Check if user has manager (role_id = 2) or admin (role_id = 1) role
        if (req.user.role_id !== 1 && req.user.role_id !== 2) {
            return res.status(403).json({
                success: false,
                message: 'Manager or Admin access required'
            });
        }

        next();
    } catch (error) {
        console.error('Error in manager/admin role check:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during role verification'
        });
    }
};

// Check if user can manage the target user
const canManageUser = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const targetUserId = parseInt(req.params.id || req.body.user_id);

        if (!targetUserId) {
            return res.status(400).json({
                success: false,
                message: 'Target user ID is required'
            });
        }

        // Admin can manage any user
        if (req.user.role_id === 1) {
            return next();
        }

        // Manager can manage users with role_id >= 3 (sales_rep, support)
        if (req.user.role_id === 2) {
            const targetUserQuery = `
                SELECT role_id FROM users WHERE id = ?
            `;
            const targetUsers = await executeQuery(targetUserQuery, [targetUserId]);

            if (targetUsers.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Target user not found'
                });
            }

            if (targetUsers[0].role_id < 3) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only manage sales representatives and support users'
                });
            }

            return next();
        }

        // Other roles cannot manage users
        return res.status(403).json({
            success: false,
            message: 'Insufficient permissions to manage users'
        });

    } catch (error) {
        console.error('Error in user management permission check:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during permission verification'
        });
    }
};

// Check if user can change roles
const canChangeRole = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const targetUserId = parseInt(req.params.id || req.body.user_id);
        const newRoleId = parseInt(req.body.role_id);

        if (!targetUserId || !newRoleId) {
            return res.status(400).json({
                success: false,
                message: 'Target user ID and new role ID are required'
            });
        }

        // Admin can change any role
        if (req.user.role_id === 1) {
            return next();
        }

        // Manager can only change roles to sales_rep (3) or support (4)
        if (req.user.role_id === 2) {
            if (newRoleId < 3 || newRoleId > 4) {
                return res.status(403).json({
                    success: false,
                    message: 'Managers can only assign sales_rep or support roles'
                });
            }

            // Check if target user is manageable by manager
            const targetUserQuery = `
                SELECT role_id FROM users WHERE id = ?
            `;
            const targetUsers = await executeQuery(targetUserQuery, [targetUserId]);

            if (targetUsers.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Target user not found'
                });
            }

            if (targetUsers[0].role_id < 3) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only manage sales representatives and support users'
                });
            }

            return next();
        }

        // Other roles cannot change roles
        return res.status(403).json({
            success: false,
            message: 'Insufficient permissions to change user roles'
        });

    } catch (error) {
        console.error('Error in role change permission check:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during permission verification'
        });
    }
};

// Check if user can delete users
const canDeleteUser = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const targetUserId = parseInt(req.params.id);

        if (!targetUserId) {
            return res.status(400).json({
                success: false,
                message: 'Target user ID is required'
            });
        }

        // Prevent self-deletion
        if (req.user.id === targetUserId) {
            return res.status(403).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        // Admin can delete any user
        if (req.user.role_id === 1) {
            return next();
        }

        // Manager can only delete sales_rep (3) or support (4) users
        if (req.user.role_id === 2) {
            const targetUserQuery = `
                SELECT role_id FROM users WHERE id = ?
            `;
            const targetUsers = await executeQuery(targetUserQuery, [targetUserId]);

            if (targetUsers.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Target user not found'
                });
            }

            if (targetUsers[0].role_id < 3) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only delete sales representatives and support users'
                });
            }

            return next();
        }

        // Other roles cannot delete users
        return res.status(403).json({
            success: false,
            message: 'Insufficient permissions to delete users'
        });

    } catch (error) {
        console.error('Error in user deletion permission check:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during permission verification'
        });
    }
};

module.exports = {
    requireAdmin,
    requireManagerOrAdmin,
    canManageUser,
    canChangeRole,
    canDeleteUser
};
