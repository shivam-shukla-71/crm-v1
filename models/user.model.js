const { executeQuery } = require('../config/database');

class UserModel {
    static async createUser(user) {
        const query = `
      INSERT INTO users (username, email, password_hash, first_name, last_name, role_id, phone, is_active, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, FALSE)
    `;
        const params = [
            user.username,
            user.email,
            user.password_hash,
            user.first_name,
            user.last_name,
            user.role_id || 3,
            user.phone || null
        ];
        const result = await executeQuery(query, params);
        return { id: result.insertId, ...user, is_active: 1, is_verified: 0 };
    }

    static async findByEmail(email) {
        const query = `
      SELECT u.*, r.role FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.email = ?
      LIMIT 1
    `;
        const rows = await executeQuery(query, [email]);
        return rows[0] || null;
    }

    static async findById(id) {
        const query = `
      SELECT u.*, r.role FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = ?
      LIMIT 1
    `;
        const rows = await executeQuery(query, [id]);
        return rows[0] || null;
    }

    static async emailExists(email) {
        const query = `SELECT id FROM users WHERE email = ? LIMIT 1`;
        const rows = await executeQuery(query, [email]);
        return rows.length > 0;
    }

    static async usernameExists(username) {
        const query = `SELECT id FROM users WHERE username = ? LIMIT 1`;
        const rows = await executeQuery(query, [username]);
        return rows.length > 0;
    }

    static async markVerified(userId) {
        const query = `UPDATE users SET is_verified = TRUE, updated_at = NOW() WHERE id = ?`;
        await executeQuery(query, [userId]);
        return true;
    }

    static async updatePassword(userId, password_hash) {
        const query = `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?`;
        await executeQuery(query, [password_hash, userId]);
        return true;
    }

    static async updateEmail(userId, newEmail) {
        const query = `UPDATE users SET email = ?, updated_at = NOW() WHERE id = ?`;
        await executeQuery(query, [newEmail, userId]);
        return true;
    }

    static async listUsers() {
        const query = `
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.phone, u.is_active, u.is_verified, u.role_id, r.role,
             u.created_at, u.updated_at
      FROM users u JOIN roles r ON r.id = u.role_id
      ORDER BY u.id DESC
    `;
        return executeQuery(query);
    }

    static async updateUser(userId, fields) {
        const allowed = ['first_name', 'last_name', 'phone', 'is_active'];
        const sets = [];
        const params = [];
        for (const [key, value] of Object.entries(fields)) {
            if (allowed.includes(key) && value !== undefined) {
                sets.push(`${key} = ?`);
                params.push(value);
            }
        }
        if (sets.length === 0) return false;
        const query = `UPDATE users SET ${sets.join(', ')}, updated_at = NOW() WHERE id = ?`;
        params.push(userId);
        await executeQuery(query, params);
        return true;
    }

    static async changeRole(userId, roleId) {
        const query = `UPDATE users SET role_id = ?, updated_at = NOW() WHERE id = ?`;
        await executeQuery(query, [roleId, userId]);
        return true;
    }

    static async deleteUser(userId) {
        const query = `DELETE FROM users WHERE id = ?`;
        await executeQuery(query, [userId]);
        return true;
    }
}

module.exports = UserModel;
