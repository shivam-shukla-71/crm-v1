const { executeQuery } = require('../config/database');

class RoleModel {
    static async listRoles() {
        const query = `SELECT id, role, created_at FROM roles ORDER BY id ASC`;
        return executeQuery(query);
    }

    static async findById(id) {
        const query = `SELECT id, role FROM roles WHERE id = ? LIMIT 1`;
        const rows = await executeQuery(query, [id]);
        return rows[0] || null;
    }

    static async isValidRoleId(id) {
        const query = `SELECT 1 FROM roles WHERE id = ? LIMIT 1`;
        const rows = await executeQuery(query, [id]);
        return rows.length > 0;
    }
}

module.exports = RoleModel;
