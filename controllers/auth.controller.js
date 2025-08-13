const AuthService = require('../services/auth.service');
const PasswordService = require('../services/password.service');
const EmailUpdateService = require('../services/email-update.service');
const UserService = require('../services/user.service');
const UserModel = require('../models/user.model');
const bcrypt = require('bcryptjs');

class AuthController {
    // Auth
    static async register(req, res) {
        try {
            const result = await AuthService.register(req.validatedData);
            return res.status(201).json({ success: true, data: result });
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    static async verifyOTP(req, res) {
        try {
            const { user_id, email, otp } = req.validatedData;
            await AuthService.verifyRegistrationOTP(user_id, email, otp);
            return res.json({ success: true, message: 'Account verified successfully' });
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    static async login(req, res) {
        try {
            const { email, password } = req.validatedData;
            const result = await AuthService.login(email, password);
            return res.json({ success: true, data: result });
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    // Password reset
    static async requestPasswordReset(req, res) {
        try {
            const { email } = req.validatedData;
            const result = await PasswordService.requestReset(email);
            return res.json({ success: true, data: result });
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    static async verifyPasswordOTP(req, res) {
        try {
            const { email, otp } = req.validatedData;
            const result = await PasswordService.verifyResetOTP(email, otp);
            return res.json({ success: true, data: result });
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    static async updatePassword(req, res) {
        try {
            const { new_password } = req.validatedData;
            await PasswordService.updatePassword(req.tokenPayload.user_id, new_password);
            return res.json({ success: true, message: 'Password updated successfully' });
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    // Email update
    static async requestEmailUpdate(req, res) {
        try {
            const { new_email } = req.validatedData;
            const result = await EmailUpdateService.requestEmailUpdate(req.user.id, new_email);
            return res.json({ success: true, data: result });
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    static async verifyEmailUpdate(req, res) {
        try {
            const { otp } = req.validatedData;
            await EmailUpdateService.verifyEmailUpdate(req.user.id, otp);
            return res.json({ success: true, message: 'Email updated successfully' });
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    // Admin user management
    static async listUsers(req, res) {
        try {
            const users = await UserService.listUsers();
            return res.json({ success: true, data: users });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async listUsersByEntity(req, res) {
        try {
            const entityId = parseInt(req.params.entityId);
            if (isNaN(entityId)) {
                return res.status(400).json({ success: false, message: 'Invalid entity ID' });
            }
            const users = await UserService.listUsersByEntity(entityId);
            return res.json({ success: true, data: users });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    static async createUser(req, res) {
        try {
            const data = req.validatedData;
            const password_hash = await bcrypt.hash(data.password, parseInt(process.env.BCRYPT_ROUNDS || '12', 10));
            const created = await UserService.createUser({
                username: data.username,
                email: data.email,
                password_hash,
                first_name: data.first_name,
                last_name: data.last_name,
                role_id: data.role_id || 3,
                entity_id: data.entity_id,
                phone: data.phone || null,
                is_verified:1
            });
            await UserModel.markVerified(created.id)
            return res.status(201).json({ success: true, data: { id: created.id } });
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    static async updateUser(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const { first_name, last_name, phone, is_active } = req.body;
            await UserService.updateUser(userId, { first_name, last_name, phone, is_active });
            return res.json({ success: true, message: 'User updated' });
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    static async changeUserRole(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const { role_id } = req.body;
            await UserService.changeRole(userId, role_id);
            return res.json({ success: true, message: 'Role updated' });
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    static async deleteUser(req, res) {
        try {
            const userId = parseInt(req.params.id);
            await UserService.deleteUser(userId);
            return res.json({ success: true, message: 'User deleted' });
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = AuthController;
