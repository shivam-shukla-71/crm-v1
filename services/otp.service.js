const { executeQuery } = require('../config/database');
const { sendEmail } = require('../config/email');

class OTPService {
    // Generate 6-digit OTP
    static generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Check OTP rate limiting (max 3 per hour, min 3 min gap)
    static async checkRateLimit(userId, type) {
        try {
            // Check if user has sent 3 OTPs in the last hour
            const hourlyCountQuery = `
                SELECT COUNT(*) as count 
                FROM otps 
                WHERE user_id = ? AND type = ? 
                AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
            `;
            const hourlyResult = await executeQuery(hourlyCountQuery, [userId, type]);

            if (hourlyResult[0].count >= 3) {
                return { allowed: false, reason: 'Hourly limit exceeded (3 OTPs per hour)' };
            }

            // Check if last OTP was sent within 3 minutes
            const recentOTPQuery = `
                SELECT created_at 
                FROM otps 
                WHERE user_id = ? AND type = ? 
                ORDER BY created_at DESC 
                LIMIT 1
            `;
            const recentResult = await executeQuery(recentOTPQuery, [userId, type]);

            if (recentResult.length > 0) {
                const lastOTPTime = new Date(recentResult[0].created_at);
                const currentTime = new Date();
                const timeDiff = (currentTime - lastOTPTime) / 1000 / 60; // minutes

                if (timeDiff < 3) {
                    return { allowed: false, reason: `Please wait ${Math.ceil(3 - timeDiff)} more minutes before requesting another OTP` };
                }
            }

            return { allowed: true };
        } catch (error) {
            console.error('Error checking OTP rate limit:', error);
            throw error;
        }
    }

    // Create and store OTP
    static async createOTP(userId, email, type) {
        try {
            const otp = this.generateOTP();
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

            const insertQuery = `
                INSERT INTO otps (user_id, email, otp, type, expires_at) 
                VALUES (?, ?, ?, ?, ?)
            `;

            await executeQuery(insertQuery, [userId, email, otp, type, expiresAt]);

            return { success: true, otp, expiresAt };
        } catch (error) {
            console.error('Error creating OTP:', error);
            throw error;
        }
    }

    // Verify OTP
    static async verifyOTP(userId, email, otp, type) {
        try {
            const verifyQuery = `
                SELECT * FROM otps 
                WHERE user_id = ? AND email = ? AND otp = ? AND type = ? 
                AND expires_at > NOW() 
                ORDER BY created_at DESC 
                LIMIT 1
            `;

            const result = await executeQuery(verifyQuery, [userId, email, otp, type]);

            if (result.length === 0) {
                return { valid: false, reason: 'Invalid or expired OTP' };
            }

            // Delete the used OTP
            const deleteQuery = `DELETE FROM otps WHERE id = ?`;
            await executeQuery(deleteQuery, [result[0].id]);

            return { valid: true, otpData: result[0] };
        } catch (error) {
            console.error('Error verifying OTP:', error);
            throw error;
        }
    }

    // Send OTP email
    static async sendOTPEmail(userData, otp, type, newEmail = null) {
        try {
            let template;
            let emailData;

            switch (type) {
                case 'verification':
                    template = 'registrationOTP';
                    emailData = { ...userData, otp };
                    break;
                case 'password_reset':
                    template = 'passwordResetOTP';
                    emailData = { ...userData, otp };
                    break;
                case 'email_update':
                    template = 'emailUpdateOTP';
                    emailData = { ...userData, otp, newEmail };
                    break;
                default:
                    throw new Error('Invalid OTP type');
            }

            const result = await sendEmail(userData.email, template, emailData);

            if (result.success) {
                return { success: true, messageId: result.messageId };
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error sending OTP email:', error);
            throw error;
        }
    }

    // Clean up expired OTPs
    static async cleanupExpiredOTPs() {
        try {
            const cleanupQuery = `DELETE FROM otps WHERE expires_at < NOW()`;
            const result = await executeQuery(cleanupQuery);
            console.log(`Cleaned up ${result.affectedRows} expired OTPs`);
            return result.affectedRows;
        } catch (error) {
            console.error('Error cleaning up expired OTPs:', error);
            throw error;
        }
    }

    // Get OTP statistics for a user
    static async getOTPStats(userId) {
        try {
            const statsQuery = `
                SELECT 
                    type,
                    COUNT(*) as total_sent,
                    COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as active_count,
                    MAX(created_at) as last_sent
                FROM otps 
                WHERE user_id = ? 
                GROUP BY type
            `;

            const result = await executeQuery(statsQuery, [userId]);
            return result;
        } catch (error) {
            console.error('Error getting OTP stats:', error);
            throw error;
        }
    }
}

module.exports = OTPService;
