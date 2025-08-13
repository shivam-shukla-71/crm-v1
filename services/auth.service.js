const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const OTPService = require('./otp.service');
const JWTUtil = require('../utils/jwt.util');

class AuthService {
    static async register(userInput) {
        const emailTaken = await UserModel.emailExists(userInput.email);
        if (emailTaken) {
            throw new Error('Email already in use');
        }
        const usernameTaken = await UserModel.usernameExists(userInput.username);
        if (usernameTaken) {
            throw new Error('Username already in use');
        }

        const password_hash = await bcrypt.hash(userInput.password, parseInt(process.env.BCRYPT_ROUNDS || '12', 10));
        const created = await UserModel.createUser({
            username: userInput.username,
            email: userInput.email,
            password_hash,
            first_name: userInput.first_name,
            last_name: userInput.last_name,
            role_id: userInput.role_id || 3,
            phone: userInput.phone || null,
            entity_id:userInput.entity_id

        });

        // Send verification OTP (rate-limited)
        const rate = await OTPService.checkRateLimit(created.id, 'verification');
        if (!rate.allowed) {
            return { userId: created.id, otpSent: false, reason: rate.reason };
        }

        const { otp, expiresAt } = await OTPService.createOTP(created.id, created.email, 'verification');
        await OTPService.sendOTPEmail({
            email: created.email,
            first_name: userInput.first_name,
            last_name: userInput.last_name
        }, otp, 'verification');

        return { userId: created.id, email: created.email, otpSent: true, otpExpiresAt: expiresAt };
    }

    static async verifyRegistrationOTP(userId, email, otp) {
        const result = await OTPService.verifyOTP(userId, email, otp, 'verification');
        if (!result.valid) {
            throw new Error(result.reason || 'Invalid OTP');
        }
        await UserModel.markVerified(userId);
        return true;
    }

    static async login(email, password) {
        const user = await UserModel.findByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }
        if (!user.is_active) {
            throw new Error('Account is inactive');
        }
        if (!user.is_verified) {
            throw new Error('Account not verified');
        }
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) {
            throw new Error('Invalid credentials');
        }
        const payload = JWTUtil.generateUserPayload(user);
        const token = JWTUtil.generateAccessToken(payload);

        return {
            user: {
                username: user.username,
                email: user.email,
                phone: user.phone,
                role: user.role,
                entity: {
                    id: user.entity_id,
                    name: user.entity_name
                }
            },
            access_token: token,
            expires_in: process.env.JWT_EXPIRES_IN || '72h'
        };
    }
}

module.exports = AuthService;
