const { executeQuery } = require('../config/database');

class LeadAssignmentModel {
    // Assign a lead to a user
    static async assignLead(assignmentData) {
        const { entityId, leadId, assignedUserId, assignedByUserId, reason, notes } = assignmentData;

        // Check if lead is already assigned
        const existingAssignment = await this.getAssignmentByLeadId(leadId, entityId);

        if (existingAssignment) {
            // Update existing assignment (reassignment)
            const updateQuery = `
                UPDATE lead_assignments 
                SET assigned_user_id = ?, assigned_at = NOW(), assigned_by_user_id = ?, 
                    previous_user_id = ?, reassignment_reason = ?, notes = ?
                WHERE lead_id = ? AND entity_id = ?
            `;

            await executeQuery(updateQuery, [
                assignedUserId, assignedByUserId, existingAssignment.assigned_user_id,
                reason, notes, leadId, entityId
            ]);
        } else {
            // Create new assignment
            const insertQuery = `
                INSERT INTO lead_assignments (entity_id, lead_id, assigned_user_id, assigned_by_user_id, reassignment_reason, notes)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            await executeQuery(insertQuery, [
                entityId, leadId, assignedUserId, assignedByUserId, reason, notes
            ]);
        }

        // Update lead_data table with assignment
        await executeQuery(`
            UPDATE lead_data 
            SET assigned_user_id = ?, assigned_at = NOW(), updated_at = NOW()
            WHERE id = ? AND entity_id = ?
        `, [assignedUserId, leadId, entityId]);

        return true;
    }

    // Get assignment by lead ID
    static async getAssignmentByLeadId(leadId, entityId) {
        const query = `
            SELECT la.*, u.first_name, u.last_name, u.email as assigned_user_email
            FROM lead_assignments la
            JOIN users u ON la.assigned_user_id = u.id
            WHERE la.lead_id = ? AND la.entity_id = ?
        `;

        const assignments = await executeQuery(query, [leadId, entityId]);
        return assignments[0] || null;
    }

    // Get all assignments for an entity
    static async getAssignmentsByEntity(entityId, filters = {}) {
        let query = `
            SELECT la.*, 
                   u.first_name, u.last_name, u.email as assigned_user_email,
                   au.first_name as assigned_by_first_name, au.last_name as assigned_by_last_name,
                   ld.email as lead_email, ld.first_name as lead_first_name, ld.last_name as lead_last_name,
                   ld.status as lead_status
            FROM lead_assignments la
            JOIN users u ON la.assigned_user_id = u.id
            JOIN users au ON la.assigned_by_user_id = au.id
            JOIN lead_data ld ON la.lead_id = ld.id
            WHERE la.entity_id = ?
        `;

        const params = [entityId];

        // Add filters
        if (filters.assigned_user_id) {
            query += ` AND la.assigned_user_id = ?`;
            params.push(filters.assigned_user_id);
        }

        if (filters.lead_status) {
            query += ` AND ld.status = ?`;
            params.push(filters.lead_status);
        }

        if (filters.date_from) {
            query += ` AND la.assigned_at >= ?`;
            params.push(filters.date_from);
        }

        if (filters.date_to) {
            query += ` AND la.assigned_at <= ?`;
            params.push(filters.date_to);
        }

        // Add ordering
        query += ` ORDER BY la.assigned_at DESC`;

        // Add pagination
        if (filters.limit) {
            query += ` LIMIT ?`;
            params.push(parseInt(filters.limit));
        }

        if (filters.offset) {
            query += ` OFFSET ?`;
            params.push(parseInt(filters.offset));
        }

        return executeQuery(query, params);
    }

    // Get assignments for a specific user
    static async getAssignmentsByUser(userId, entityId, limit = 50) {
        const query = `
            SELECT la.*, 
                   ld.email as lead_email, ld.first_name as lead_first_name, ld.last_name as lead_last_name,
                   ld.status as lead_status, ld.platform_key, ld.created_at as lead_created_at
            FROM lead_assignments la
            JOIN lead_data ld ON la.lead_id = ld.id
            WHERE la.entity_id = ? AND la.assigned_user_id = ?
            ORDER BY la.assigned_at DESC
            LIMIT ?
        `;

        return executeQuery(query, [entityId, userId, limit]);
    }

    // Get assignment history for a lead
    static async getAssignmentHistory(leadId, entityId) {
        const query = `
            SELECT la.*, 
                   u.first_name, u.last_name, u.email as assigned_user_email,
                   au.first_name as assigned_by_first_name, au.last_name as assigned_by_last_name
            FROM lead_assignments la
            JOIN users u ON la.assigned_user_id = u.id
            JOIN users au ON la.assigned_by_user_id = au.id
            WHERE la.lead_id = ? AND la.entity_id = ?
            ORDER BY la.assigned_at DESC
        `;

        return executeQuery(query, [leadId, entityId]);
    }

    // Get unassigned leads count for an entity
    static async getUnassignedLeadsCount(entityId) {
        const query = `
            SELECT COUNT(*) as count
            FROM lead_data
            WHERE entity_id = ? AND assigned_user_id IS NULL
        `;

        const result = await executeQuery(query, [entityId]);
        return result[0]?.count || 0;
    }

    // Get user workload (number of assigned leads)
    static async getUserWorkload(userId, entityId) {
        const query = `
            SELECT COUNT(*) as count
            FROM lead_data
            WHERE entity_id = ? AND assigned_user_id = ? AND status NOT IN ('won', 'lost')
        `;

        const result = await executeQuery(query, [entityId, userId]);
        return result[0]?.count || 0;
    }

    // Get workload distribution across users in an entity
    static async getWorkloadDistribution(entityId) {
        const query = `
            SELECT 
                u.id, u.first_name, u.last_name, u.email,
                COUNT(ld.id) as assigned_leads,
                COUNT(CASE WHEN ld.status IN ('new', 'qualified') THEN 1 END) as active_leads,
                COUNT(CASE WHEN ld.status IN ('won', 'lost') THEN 1 END) as closed_leads
            FROM users u
            LEFT JOIN lead_data ld ON u.id = ld.assigned_user_id AND ld.entity_id = u.entity_id
            WHERE u.entity_id = ? AND u.is_active = TRUE
            GROUP BY u.id, u.first_name, u.last_name, u.email
            ORDER BY assigned_leads DESC
        `;

        return executeQuery(query, [entityId]);
    }

    // Bulk assign leads to users (round-robin)
    static async bulkAssignLeads(entityId, leadIds, assignedByUserId, reason = 'Bulk assignment') {
        if (!leadIds || leadIds.length === 0) return [];

        // Get active users in the entity
        const usersQuery = `
            SELECT id, first_name, last_name
            FROM users 
            WHERE entity_id = ? AND is_active = TRUE AND role_id IN (2, 3) -- managers and sales reps
            ORDER BY id
        `;

        const users = await executeQuery(usersQuery, [entityId]);
        if (users.length === 0) throw new Error('No active users found for assignment');

        const assignments = [];
        let userIndex = 0;

        for (const leadId of leadIds) {
            const assignedUserId = users[userIndex].id;

            // Assign the lead
            await this.assignLead({
                entityId,
                leadId,
                assignedUserId,
                assignedByUserId,
                reason,
                notes: `Bulk assignment to ${users[userIndex].first_name} ${users[userIndex].last_name}`
            });

            assignments.push({
                lead_id: leadId,
                assigned_user_id: assignedUserId,
                assigned_user_name: `${users[userIndex].first_name} ${users[userIndex].last_name}`
            });

            // Move to next user (round-robin)
            userIndex = (userIndex + 1) % users.length;
        }

        return assignments;
    }

    // Unassign a lead
    static async unassignLead(leadId, entityId, unassignedByUserId, reason = 'Lead unassigned') {
        // Get current assignment
        const currentAssignment = await this.getAssignmentByLeadId(leadId, entityId);
        if (!currentAssignment) return false;

        // Update assignment record
        await executeQuery(`
            UPDATE lead_assignments 
            SET assigned_user_id = NULL, assigned_at = NULL, 
                reassignment_reason = ?, notes = CONCAT(notes, ' | ', ?)
            WHERE lead_id = ? AND entity_id = ?
        `, [reason, `Unassigned by user ${unassignedByUserId}`, leadId, entityId]);

        // Update lead_data table
        await executeQuery(`
            UPDATE lead_data 
            SET assigned_user_id = NULL, assigned_at = NULL, updated_at = NOW()
            WHERE id = ? AND entity_id = ?
        `, [leadId, entityId]);

        return true;
    }
}

module.exports = LeadAssignmentModel;
