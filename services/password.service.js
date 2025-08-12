const UserModel = require('../models/user.model');
const OTPService = require('./otp.service');
const JWTUtil = require('../utils/jwt.util');
const bcrypt = require('bcryptjs');

class PasswordService {
    static async requestReset(email) {
        const user = await UserModel.findByEmail(email);
        if (!user) {
            // For privacy, don't reveal existence
            return { otpSent: true };
        }
        const rate = await OTPService.checkRateLimit(user.id, 'password_reset');
        if (!rate.allowed) {
            return { otpSent: false, reason: rate.reason };
        }
        const { otp, expiresAt } = await OTPService.createOTP(user.id, user.email, 'password_reset');
        await OTPService.sendOTPEmail({ email: user.email, first_name: user.first_name }, otp, 'password_reset');
        return { otpSent: true, otpExpiresAt: expiresAt };
    }

    static async verifyResetOTP(email, otp) {
        const user = await UserModel.findByEmail(email);
        if (!user) {
            throw new Error('Invalid or expired OTP');
        }
        const result = await OTPService.verifyOTP(user.id, email, otp, 'password_reset');
        if (!result.valid) {
            throw new Error(result.reason || 'Invalid or expired OTP');
        }
        const payload = JWTUtil.generatePasswordResetPayload(user.id, email);
        const shortToken = JWTUtil.generateShortLivedToken(payload);
        return { token: shortToken, expires_in: '10m' };
    }

    static async updatePassword(userId, newPassword) {
        const password_hash = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12', 10));
        await UserModel.updatePassword(userId, password_hash);
        return true;
    }
}

module.exports = PasswordService;
