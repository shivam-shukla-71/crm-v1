const UserModel = require('../models/user.model');
const OTPService = require('./otp.service');

class EmailUpdateService {
    static async requestEmailUpdate(userId, newEmail) {
        const exists = await UserModel.emailExists(newEmail);
        if (exists) {
            throw new Error('Email already in use');
        }
        const user = await UserModel.findById(userId);
        if (!user) throw new Error('User not found');

        const rate = await OTPService.checkRateLimit(userId, 'email_update');
        if (!rate.allowed) {
            return { otpSent: false, reason: rate.reason };
        }

        // Store OTP with new email value, and send to new email address
        const { otp, expiresAt } = await OTPService.createOTP(userId, newEmail, 'email_update');
        await OTPService.sendOTPEmail({ email: user.email, first_name: user.first_name }, otp, 'email_update', newEmail);
        return { otpSent: true, otpExpiresAt: expiresAt };
    }

    static async verifyEmailUpdate(userId, otp) {
        const user = await UserModel.findById(userId);
        if (!user) throw new Error('User not found');

        // Find the most recent email_update OTP for this user
        const query = `SELECT * FROM otps WHERE user_id = ? AND type = 'email_update' ORDER BY created_at DESC LIMIT 1`;
        const { executeQuery } = require('../config/database');
        const rows = await executeQuery(query, [userId]);
        if (rows.length === 0) throw new Error('No email update request found');

        const pending = rows[0];

        // Verify OTP using the stored new email
        const result = await OTPService.verifyOTP(userId, pending.email, otp, 'email_update');
        if (!result.valid) throw new Error(result.reason || 'Invalid OTP');

        // Update user's email to the pending email
        await UserModel.updateEmail(userId, pending.email);

        return true;
    }
}

module.exports = EmailUpdateService;
