const { executeQuery } = require('../config/database');

class OtpModel {
    static async countOtpsLastHour(userId, type) {
        const query = `
      SELECT COUNT(*) AS count
      FROM otps
      WHERE user_id = ? AND type = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `;
        const rows = await executeQuery(query, [userId, type]);
        return rows[0]?.count || 0;
    }

    static async getLastOtp(userId, type) {
        const query = `
      SELECT * FROM otps
      WHERE user_id = ? AND type = ?
      ORDER BY created_at DESC
      LIMIT 1
    `;
        const rows = await executeQuery(query, [userId, type]);
        return rows[0] || null;
    }

    static async createOtp({ userId, email, otp, type, expiresAt }) {
        const query = `
      INSERT INTO otps (user_id, email, otp, type, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `;
        const result = await executeQuery(query, [userId, email, otp, type, expiresAt]);
        return { id: result.insertId };
    }

    static async findValidOtp({ userId, email, otp, type }) {
        const query = `
      SELECT * FROM otps
      WHERE user_id = ? AND email = ? AND otp = ? AND type = ? AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1
    `;
        const rows = await executeQuery(query, [userId, email, otp, type]);
        return rows[0] || null;
    }

    static async deleteById(id) {
        const query = `DELETE FROM otps WHERE id = ?`;
        await executeQuery(query, [id]);
        return true;
    }

    static async cleanupExpired() {
        const query = `DELETE FROM otps WHERE expires_at < NOW()`;
        const result = await executeQuery(query);
        return result.affectedRows || 0;
    }

    static async statsByUser(userId) {
        const query = `
      SELECT type,
             COUNT(*) AS total_sent,
             COUNT(CASE WHEN expires_at > NOW() THEN 1 END) AS active_count,
             MAX(created_at) AS last_sent
      FROM otps
      WHERE user_id = ?
      GROUP BY type
    `;
        return executeQuery(query, [userId]);
    }

    static async findLatestEmailUpdateOtp(userId) {
        const query = `
      SELECT * FROM otps
      WHERE user_id = ? AND type = 'email_update'
      ORDER BY created_at DESC
      LIMIT 1
    `;
        const rows = await executeQuery(query, [userId]);
        return rows[0] || null;
    }
}

module.exports = OtpModel;
