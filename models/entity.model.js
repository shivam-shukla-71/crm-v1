const { executeQuery } = require('../config/database');

class EntityModel {
    static async findAll() {
        const query = `
            SELECT id, name
            FROM entities
            ORDER BY name ASC
        `;
        return executeQuery(query);
    }

    static async findById(id) {
        const query = `
            SELECT id, name
            FROM entities
            WHERE id = ?
            LIMIT 1
        `;
        const rows = await executeQuery(query, [id]);
        return rows[0] || null;
    }

    static async findByName(name) {
        const query = `
            SELECT id, name
            FROM entities
            WHERE name = ?
            LIMIT 1
        `;
        const rows = await executeQuery(query, [name]);
        return rows[0] || null;
    }

    static async create(entity) {
        const query = `
            INSERT INTO entities (name)
            VALUES (?)
        `;
        const params = [entity.name];
        const result = await executeQuery(query, params);
        return { id: result.insertId, name: entity.name };
    }

    static async update(id, fields) {
        const allowed = ['name'];
        const sets = [];
        const params = [];

        for (const [key, value] of Object.entries(fields)) {
            if (allowed.includes(key) && value !== undefined) {
                sets.push(`${key} = ?`);
                params.push(value);
            }
        }

        if (sets.length === 0) return false;

        const query = `UPDATE entities SET ${sets.join(', ')} WHERE id = ?`;
        params.push(id);
        await executeQuery(query, params);
        return true;
    }

    static async delete(id) {
        // Check if entity has users
        const userCheckQuery = `SELECT COUNT(*) as user_count FROM users WHERE entity_id = ?`;
        const userResult = await executeQuery(userCheckQuery, [id]);

        if (userResult[0].user_count > 0) {
            throw new Error('Cannot delete entity with associated users');
        }

        // Check if entity has leads
        const leadCheckQuery = `SELECT COUNT(*) as lead_count FROM lead_meta WHERE entity_id = ?`;
        const leadResult = await executeQuery(leadCheckQuery, [id]);

        if (leadResult[0].lead_count > 0) {
            throw new Error('Cannot delete entity with associated leads');
        }

        const query = `DELETE FROM entities WHERE id = ?`;
        await executeQuery(query, [id]);
        return true;
    }

    static async exists(id) {
        const query = `SELECT id FROM entities WHERE id = ? LIMIT 1`;
        const rows = await executeQuery(query, [id]);
        return rows.length > 0;
    }

    static async nameExists(name, excludeId = null) {
        let query = `SELECT id FROM entities WHERE name = ?`;
        let params = [name];

        if (excludeId) {
            query += ` AND id != ?`;
            params.push(excludeId);
        }

        query += ` LIMIT 1`;
        const rows = await executeQuery(query, params);
        return rows.length > 0;
    }
}

module.exports = EntityModel;
