const { executeQuery } = require('../config/database');

class PasswordResetTokenModel {
    static async create({ userId, token, expiresAt }) {
        const query = `INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)`;
        const res = await executeQuery(query, [userId, token, expiresAt]);
        return { id: res.insertId };
    }

    static async findValid({ userId, token }) {
        const query = `SELECT * FROM password_reset_tokens WHERE user_id = ? AND token = ? AND expires_at > NOW() LIMIT 1`;
        const rows = await executeQuery(query, [userId, token]);
        return rows[0] || null;
    }

    static async deleteById(id) {
        const query = `DELETE FROM password_reset_tokens WHERE id = ?`;
        await executeQuery(query, [id]);
        return true;
    }

    static async cleanupExpired() {
        const query = `DELETE FROM password_reset_tokens WHERE expires_at < NOW()`;
        const res = await executeQuery(query);
        return res.affectedRows || 0;
    }
}

class EmailUpdateTokenModel {
    static async create({ userId, newEmail, token, expiresAt }) {
        const query = `INSERT INTO email_update_tokens (user_id, new_email, token, expires_at) VALUES (?, ?, ?, ?)`;
        const res = await executeQuery(query, [userId, newEmail, token, expiresAt]);
        return { id: res.insertId };
    }

    static async findValid({ userId, token }) {
        const query = `SELECT * FROM email_update_tokens WHERE user_id = ? AND token = ? AND expires_at > NOW() LIMIT 1`;
        const rows = await executeQuery(query, [userId, token]);
        return rows[0] || null;
    }

    static async deleteById(id) {
        const query = `DELETE FROM email_update_tokens WHERE id = ?`;
        await executeQuery(query, [id]);
        return true;
    }

    static async cleanupExpired() {
        const query = `DELETE FROM email_update_tokens WHERE expires_at < NOW()`;
        const res = await executeQuery(query);
        return res.affectedRows || 0;
    }
}

module.exports = { PasswordResetTokenModel, EmailUpdateTokenModel };
