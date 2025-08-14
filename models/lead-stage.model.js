const { executeQuery } = require('../config/database');

class LeadStageModel {
    // Enter a new stage for a lead
    static async enterStage(stageData) {
        const { entityId, leadId, statusId, userId, notes, nextActionRequired } = stageData;

        // First, exit the current stage if it exists
        await this.exitCurrentStage(leadId, entityId);

        // Enter new stage
        const insertQuery = `
            INSERT INTO lead_stages (entity_id, lead_id, status_id, user_id, notes, next_action_required)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        const result = await executeQuery(insertQuery, [
            entityId, leadId, statusId, userId, notes || '', nextActionRequired || null
        ]);

        // Update lead_data status
        await executeQuery(`
            UPDATE lead_data 
            SET status = (SELECT name FROM lead_statuses WHERE id = ?), updated_at = NOW()
            WHERE id = ? AND entity_id = ?
        `, [statusId, leadId, entityId]);

        return result.insertId;
    }

    // Exit current stage for a lead
    static async exitCurrentStage(leadId, entityId) {
        const updateQuery = `
            UPDATE lead_stages 
            SET exited_at = NOW(), 
                duration_hours = TIMESTAMPDIFF(HOUR, entered_at, NOW())
            WHERE lead_id = ? AND entity_id = ? AND exited_at IS NULL
        `;

        return executeQuery(updateQuery, [leadId, entityId]);
    }

    // Get current stage for a lead
    static async getCurrentStage(leadId, entityId) {
        const query = `
            SELECT ls.*, ls.name as status_name, ls.description as status_description,
                   u.first_name, u.last_name, u.email as user_email
            FROM lead_stages ls
            JOIN lead_statuses ls ON ls.status_id = ls.id
            JOIN users u ON ls.user_id = u.id
            WHERE ls.lead_id = ? AND ls.entity_id = ? AND ls.exited_at IS NULL
        `;

        const stages = await executeQuery(query, [leadId, entityId]);
        return stages[0] || null;
    }

    // Get stage history for a lead
    static async getStageHistory(leadId, entityId) {
        const query = `
            SELECT ls.*, ls.name as status_name, ls.description as status_description,
                   u.first_name, u.last_name, u.email as user_email
            FROM lead_stages ls
            JOIN lead_statuses ls ON ls.status_id = ls.id
            JOIN users u ON ls.user_id = u.id
            WHERE ls.lead_id = ? AND ls.entity_id = ?
            ORDER BY ls.entered_at DESC
        `;

        return executeQuery(query, [leadId, entityId]);
    }

    // Get all stages for an entity with filters
    static async getStagesByEntity(entityId, filters = {}) {
        let query = `
            SELECT ls.*, ls.name as status_name, ls.description as status_description,
                   u.first_name, u.last_name, u.email as user_email,
                   ld.email as lead_email, ld.first_name as lead_first_name, ld.last_name as lead_last_name,
                   ld.platform_key, ld.assigned_user_id
            FROM lead_stages ls
            JOIN lead_statuses ls ON ls.status_id = ls.id
            JOIN users u ON ls.user_id = u.id
            JOIN lead_data ld ON ls.lead_id = ld.id
            WHERE ls.entity_id = ?
        `;

        const params = [entityId];

        // Add filters
        if (filters.status_id) {
            query += ` AND ls.status_id = ?`;
            params.push(filters.status_id);
        }

        if (filters.user_id) {
            query += ` AND ls.user_id = ?`;
            params.push(filters.user_id);
        }

        if (filters.lead_id) {
            query += ` AND ls.lead_id = ?`;
            params.push(filters.lead_id);
        }

        if (filters.date_from) {
            query += ` AND ls.entered_at >= ?`;
            params.push(filters.date_from);
        }

        if (filters.date_to) {
            query += ` AND ls.entered_at <= ?`;
            params.push(filters.date_to);
        }

        if (filters.active_only) {
            query += ` AND ls.exited_at IS NULL`;
        }

        // Add ordering
        query += ` ORDER BY ls.entered_at DESC`;

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

    // Get stage performance metrics for an entity
    static async getStagePerformanceMetrics(entityId, dateFrom = null, dateTo = null) {
        let dateFilter = '';
        const params = [entityId];

        if (dateFrom && dateTo) {
            dateFilter = ` AND ls.entered_at BETWEEN ? AND ?`;
            params.push(dateFrom, dateTo);
        }

        const query = `
            SELECT 
                ls.name as status_name,
                ls.description as status_description,
                COUNT(*) as total_entries,
                COUNT(CASE WHEN ls.exited_at IS NOT NULL THEN 1 END) as total_exits,
                COUNT(CASE WHEN ls.exited_at IS NULL THEN 1 END) as currently_in_stage,
                AVG(CASE WHEN ls.duration_hours IS NOT NULL THEN ls.duration_hours END) as avg_duration_hours,
                MIN(CASE WHEN ls.duration_hours IS NOT NULL THEN ls.duration_hours END) as min_duration_hours,
                MAX(CASE WHEN ls.duration_hours IS NOT NULL THEN ls.duration_hours END) as max_duration_hours
            FROM lead_stages ls
            JOIN lead_statuses ls ON ls.status_id = ls.id
            WHERE ls.entity_id = ? ${dateFilter}
            GROUP BY ls.id, ls.name, ls.description
            ORDER BY total_entries DESC
        `;

        return executeQuery(query, params);
    }

    // Get user performance metrics
    static async getUserPerformanceMetrics(entityId, userId = null, dateFrom = null, dateTo = null) {
        let userFilter = '';
        let dateFilter = '';
        const params = [entityId];

        if (userId) {
            userFilter = ` AND ls.user_id = ?`;
            params.push(userId);
        }

        if (dateFrom && dateTo) {
            dateFilter = ` AND ls.entered_at BETWEEN ? AND ?`;
            params.push(dateFrom, dateTo);
        }

        const query = `
            SELECT 
                u.id, u.first_name, u.last_name, u.email,
                COUNT(*) as total_stage_changes,
                COUNT(CASE WHEN ls.exited_at IS NOT NULL THEN 1 END) as completed_stages,
                COUNT(CASE WHEN ls.exited_at IS NULL THEN 1 END) as active_stages,
                AVG(CASE WHEN ls.duration_hours IS NOT NULL THEN ls.duration_hours END) as avg_stage_duration,
                COUNT(DISTINCT ls.lead_id) as unique_leads_handled
            FROM lead_stages ls
            JOIN users u ON ls.user_id = u.id
            WHERE ls.entity_id = ? ${userFilter} ${dateFilter}
            GROUP BY u.id, u.first_name, u.last_name, u.email
            ORDER BY total_stage_changes DESC
        `;

        return executeQuery(query, params);
    }

    // Get stage transition matrix
    static async getStageTransitionMatrix(entityId, dateFrom = null, dateTo = null) {
        let dateFilter = '';
        const params = [entityId];

        if (dateFrom && dateTo) {
            dateFilter = ` AND ls.entered_at BETWEEN ? AND ?`;
            params.push(dateFrom, dateTo);
        }

        const query = `
            SELECT 
                from_status.name as from_status,
                to_status.name as to_status,
                COUNT(*) as transition_count,
                AVG(ls.duration_hours) as avg_time_in_from_status
            FROM lead_stages ls
            JOIN lead_stages next_stage ON ls.lead_id = next_stage.lead_id 
                AND next_stage.entered_at > ls.entered_at
                AND next_stage.entity_id = ls.entity_id
            JOIN lead_statuses from_status ON ls.status_id = from_status.id
            JOIN lead_statuses to_status ON next_stage.status_id = to_status.id
            WHERE ls.entity_id = ? ${dateFilter}
            GROUP BY from_status.name, to_status.name
            ORDER BY transition_count DESC
        `;

        return executeQuery(query, params);
    }

    // Get leads stuck in stages (exceeding SLA)
    static async getLeadsExceedingSLA(entityId, slaHours = 24) {
        const query = `
            SELECT 
                ls.*, ls.name as status_name, ls.description as status_description,
                u.first_name, u.last_name, u.email as user_email,
                ld.email as lead_email, ld.first_name as lead_first_name, ld.last_name as lead_last_name,
                ld.platform_key, ld.assigned_user_id,
                TIMESTAMPDIFF(HOUR, ls.entered_at, NOW()) as hours_in_stage
            FROM lead_stages ls
            JOIN lead_statuses ls ON ls.status_id = ls.id
            JOIN users u ON ls.user_id = u.id
            JOIN lead_data ld ON ls.lead_id = ld.id
            WHERE ls.entity_id = ? 
                AND ls.exited_at IS NULL 
                AND TIMESTAMPDIFF(HOUR, ls.entered_at, NOW()) > ?
            ORDER BY hours_in_stage DESC
        `;

        return executeQuery(query, [entityId, slaHours]);
    }

    // Get stage conversion rates
    static async getStageConversionRates(entityId, dateFrom = null, dateTo = null) {
        let dateFilter = '';
        const params = [entityId];

        if (dateFrom && dateTo) {
            dateFilter = ` AND ls.entered_at BETWEEN ? AND ?`;
            params.push(dateFrom, dateTo);
        }

        const query = `
            SELECT 
                ls.name as status_name,
                ls.description as status_description,
                COUNT(*) as total_entries,
                COUNT(CASE WHEN ld.status = 'won' THEN 1 END) as won_leads,
                COUNT(CASE WHEN ld.status = 'lost' THEN 1 END) as lost_leads,
                ROUND((COUNT(CASE WHEN ld.status = 'won' THEN 1 END) / COUNT(*)) * 100, 2) as conversion_rate
            FROM lead_stages ls
            JOIN lead_statuses ls ON ls.status_id = ls.id
            JOIN lead_data ld ON ls.lead_id = ld.id
            WHERE ls.entity_id = ? ${dateFilter}
            GROUP BY ls.id, ls.name, ls.description
            ORDER BY conversion_rate DESC
        `;

        return executeQuery(query, params);
    }

    // Update stage notes
    static async updateStageNotes(stageId, entityId, notes, nextActionRequired) {
        const query = `
            UPDATE lead_stages 
            SET notes = ?, next_action_required = ?, updated_at = NOW()
            WHERE id = ? AND entity_id = ?
        `;

        return executeQuery(query, [notes, nextActionRequired, stageId, entityId]);
    }

    // Get stage summary for dashboard
    static async getStageSummary(entityId) {
        const query = `
            SELECT 
                ls.name as status_name,
                COUNT(*) as lead_count,
                COUNT(CASE WHEN ls.exited_at IS NULL THEN 1 END) as active_leads,
                AVG(CASE WHEN ls.duration_hours IS NOT NULL THEN ls.duration_hours END) as avg_duration
            FROM lead_stages ls
            JOIN lead_statuses ls ON ls.status_id = ls.id
            WHERE ls.entity_id = ?
            GROUP BY ls.id, ls.name
            ORDER BY lead_count DESC
        `;

        return executeQuery(query, [entityId]);
    }

    // Get recent stage changes
    static async getRecentStageChanges(entityId, limit = 20) {
        const query = `
            SELECT 
                ls.*, ls.name as status_name,
                u.first_name, u.last_name,
                ld.email as lead_email, ld.first_name as lead_first_name, ld.last_name as lead_last_name
            FROM lead_stages ls
            JOIN lead_statuses ls ON ls.status_id = ls.id
            JOIN users u ON ls.user_id = u.id
            JOIN lead_data ld ON ls.lead_id = ld.id
            WHERE ls.entity_id = ?
            ORDER BY ls.entered_at DESC
            LIMIT ?
        `;

        return executeQuery(query, [entityId, limit]);
    }
}

module.exports = LeadStageModel;
