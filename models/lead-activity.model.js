const { executeQuery } = require('../config/database');

class LeadActivityModel {
    // Log a new activity for a lead
    static async logActivity(activityData) {
        const { entityId, leadId, userId, activityType, description, nextFollowUpDate, priority, status } = activityData;

        const insertQuery = `
            INSERT INTO lead_activities (entity_id, lead_id, user_id, activity_type, description, next_follow_up_date, priority, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await executeQuery(insertQuery, [
            entityId, leadId, userId, activityType, description, nextFollowUpDate || null, priority || 'medium', status || 'pending'
        ]);

        return result.insertId;
    }

    // Get all activities for a lead
    static async getActivitiesByLead(leadId, entityId, filters = {}) {
        let query = `
            SELECT la.*, 
                   u.first_name, u.last_name, u.email as user_email,
                   ld.email as lead_email, ld.first_name as lead_first_name, ld.last_name as lead_last_name
            FROM lead_activities la
            JOIN users u ON la.user_id = u.id
            JOIN lead_data ld ON la.lead_id = ld.id
            WHERE la.lead_id = ? AND la.entity_id = ?
        `;

        const params = [leadId, entityId];

        // Add filters
        if (filters.activity_type) {
            query += ` AND la.activity_type = ?`;
            params.push(filters.activity_type);
        }

        if (filters.user_id) {
            query += ` AND la.user_id = ?`;
            params.push(filters.user_id);
        }

        if (filters.priority) {
            query += ` AND la.priority = ?`;
            params.push(filters.priority);
        }

        if (filters.status) {
            query += ` AND la.status = ?`;
            params.push(filters.status);
        }

        if (filters.date_from) {
            query += ` AND la.created_at >= ?`;
            params.push(filters.date_from);
        }

        if (filters.date_to) {
            query += ` AND la.created_at <= ?`;
            params.push(filters.date_to);
        }

        // Add ordering
        query += ` ORDER BY la.created_at DESC`;

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

    // Get all activities for an entity
    static async getActivitiesByEntity(entityId, filters = {}) {
        let query = `
            SELECT la.*, 
                   u.first_name, u.last_name, u.email as user_email,
                   ld.email as lead_email, ld.first_name as lead_first_name, ld.last_name as lead_last_name,
                   ld.status as lead_status, ld.platform_key
            FROM lead_activities la
            JOIN users u ON la.user_id = u.id
            JOIN lead_data ld ON la.lead_id = ld.id
            WHERE la.entity_id = ?
        `;

        const params = [entityId];

        // Add filters
        if (filters.activity_type) {
            query += ` AND la.activity_type = ?`;
            params.push(filters.activity_type);
        }

        if (filters.user_id) {
            query += ` AND la.user_id = ?`;
            params.push(filters.user_id);
        }

        if (filters.lead_id) {
            query += ` AND la.lead_id = ?`;
            params.push(filters.lead_id);
        }

        if (filters.priority) {
            query += ` AND la.priority = ?`;
            params.push(filters.priority);
        }

        if (filters.status) {
            query += ` AND la.status = ?`;
            params.push(filters.status);
        }

        if (filters.date_from) {
            query += ` AND la.created_at >= ?`;
            params.push(filters.date_from);
        }

        if (filters.date_to) {
            query += ` AND la.created_at <= ?`;
            params.push(filters.date_to);
        }

        // Add ordering
        query += ` ORDER BY la.created_at DESC`;

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

    // Get user's activities
    static async getUserActivities(userId, entityId, filters = {}) {
        let query = `
            SELECT la.*, 
                   ld.email as lead_email, ld.first_name as lead_first_name, ld.last_name as lead_last_name,
                   ld.status as lead_status, ld.platform_key
            FROM lead_activities la
            JOIN lead_data ld ON la.lead_id = ld.id
            WHERE la.user_id = ? AND la.entity_id = ?
        `;

        const params = [userId, entityId];

        // Add filters
        if (filters.activity_type) {
            query += ` AND la.activity_type = ?`;
            params.push(filters.activity_type);
        }

        if (filters.priority) {
            query += ` AND la.priority = ?`;
            params.push(filters.priority);
        }

        if (filters.status) {
            query += ` AND la.status = ?`;
            params.push(filters.status);
        }

        if (filters.date_from) {
            query += ` AND la.created_at >= ?`;
            params.push(filters.date_from);
        }

        if (filters.date_to) {
            query += ` AND la.created_at <= ?`;
            params.push(filters.date_to);
        }

        // Add ordering
        query += ` ORDER BY la.created_at DESC`;

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

    // Get pending follow-ups
    static async getPendingFollowUps(entityId, userId = null, filters = {}) {
        let userFilter = '';
        const params = [entityId];

        if (userId) {
            userFilter = ` AND la.user_id = ?`;
            params.push(userId);
        }

        let query = `
            SELECT la.*, 
                   u.first_name, u.last_name, u.email as user_email,
                   ld.email as lead_email, ld.first_name as lead_first_name, ld.last_name as lead_last_name,
                   ld.status as lead_status, ld.platform_key,
                   TIMESTAMPDIFF(HOUR, NOW(), la.next_follow_up_date) as hours_until_follow_up
            FROM lead_activities la
            JOIN users u ON la.user_id = u.id
            JOIN lead_data ld ON la.lead_id = ld.id
            WHERE la.entity_id = ? ${userFilter} 
                AND la.next_follow_up_date IS NOT NULL 
                AND la.next_follow_up_date > NOW()
                AND la.status = 'pending'
        `;

        // Add filters
        if (filters.priority) {
            query += ` AND la.priority = ?`;
            params.push(filters.priority);
        }

        if (filters.date_from) {
            query += ` AND la.next_follow_up_date >= ?`;
            params.push(filters.date_from);
        }

        if (filters.date_to) {
            query += ` AND la.next_follow_up_date <= ?`;
            params.push(filters.date_to);
        }

        // Add ordering by priority and follow-up date
        query += ` ORDER BY 
            CASE la.priority 
                WHEN 'urgent' THEN 1 
                WHEN 'high' THEN 2 
                WHEN 'medium' THEN 3 
                WHEN 'low' THEN 4 
            END, 
            la.next_follow_up_date ASC`;

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

    // Get overdue follow-ups
    static async getOverdueFollowUps(entityId, userId = null) {
        let userFilter = '';
        const params = [entityId];

        if (userId) {
            userFilter = ` AND la.user_id = ?`;
            params.push(userId);
        }

        const query = `
            SELECT la.*, 
                   u.first_name, u.last_name, u.email as user_email,
                   ld.email as lead_email, ld.first_name as lead_first_name, ld.last_name as lead_last_name,
                   ld.status as lead_status, ld.platform_key,
                   TIMESTAMPDIFF(HOUR, la.next_follow_up_date, NOW()) as hours_overdue
            FROM lead_activities la
            JOIN users u ON la.user_id = u.id
            JOIN lead_data ld ON la.lead_id = ld.id
            WHERE la.entity_id = ? ${userFilter} 
                AND la.next_follow_up_date IS NOT NULL 
                AND la.next_follow_up_date < NOW()
                AND la.status = 'pending'
            ORDER BY la.next_follow_up_date ASC
        `;

        return executeQuery(query, params);
    }

    // Update activity status
    static async updateActivityStatus(activityId, entityId, status, notes = null) {
        const query = `
            UPDATE lead_activities 
            SET status = ?, notes = COALESCE(?, notes), updated_at = NOW()
            WHERE id = ? AND entity_id = ?
        `;

        return executeQuery(query, [status, notes, activityId, entityId]);
    }

    // Update follow-up date
    static async updateFollowUpDate(activityId, entityId, nextFollowUpDate, notes = null) {
        const query = `
            UPDATE lead_activities 
            SET next_follow_up_date = ?, notes = COALESCE(?, notes), updated_at = NOW()
            WHERE id = ? AND entity_id = ?
        `;

        return executeQuery(query, [nextFollowUpDate, notes, activityId, entityId]);
    }

    // Get activity statistics for an entity
    static async getActivityStatistics(entityId, dateFrom = null, dateTo = null) {
        let dateFilter = '';
        const params = [entityId];

        if (dateFrom && dateTo) {
            dateFilter = ` AND la.created_at BETWEEN ? AND ?`;
            params.push(dateFrom, dateTo);
        }

        const query = `
            SELECT 
                la.activity_type,
                COUNT(*) as total_activities,
                COUNT(CASE WHEN la.status = 'completed' THEN 1 END) as completed_activities,
                COUNT(CASE WHEN la.status = 'pending' THEN 1 END) as pending_activities,
                COUNT(CASE WHEN la.status = 'cancelled' THEN 1 END) as cancelled_activities,
                ROUND((COUNT(CASE WHEN la.status = 'completed' THEN 1 END) / COUNT(*)) * 100, 2) as completion_rate
            FROM lead_activities la
            WHERE la.entity_id = ? ${dateFilter}
            GROUP BY la.activity_type
            ORDER BY total_activities DESC
        `;

        return executeQuery(query, params);
    }

    // Get user activity performance
    static async getUserActivityPerformance(entityId, userId = null, dateFrom = null, dateTo = null) {
        let userFilter = '';
        let dateFilter = '';
        const params = [entityId];

        if (userId) {
            userFilter = ` AND la.user_id = ?`;
            params.push(userId);
        }

        if (dateFrom && dateTo) {
            dateFilter = ` AND la.created_at BETWEEN ? AND ?`;
            params.push(dateFrom, dateTo);
        }

        const query = `
            SELECT 
                u.id, u.first_name, u.last_name, u.email,
                COUNT(*) as total_activities,
                COUNT(CASE WHEN la.status = 'completed' THEN 1 END) as completed_activities,
                COUNT(CASE WHEN la.status = 'pending' THEN 1 END) as pending_activities,
                COUNT(CASE WHEN la.next_follow_up_date IS NOT NULL THEN 1 END) as follow_ups_scheduled,
                COUNT(CASE WHEN la.next_follow_up_date < NOW() AND la.status = 'pending' THEN 1 END) as overdue_follow_ups,
                ROUND((COUNT(CASE WHEN la.status = 'completed' THEN 1 END) / COUNT(*)) * 100, 2) as completion_rate
            FROM lead_activities la
            JOIN users u ON la.user_id = u.id
            WHERE la.entity_id = ? ${userFilter} ${dateFilter}
            GROUP BY u.id, u.first_name, u.last_name, u.email
            ORDER BY total_activities DESC
        `;

        return executeQuery(query, params);
    }

    // Get priority distribution
    static async getPriorityDistribution(entityId, dateFrom = null, dateTo = null) {
        let dateFilter = '';
        const params = [entityId];

        if (dateFrom && dateTo) {
            dateFilter = ` AND la.created_at BETWEEN ? AND ?`;
            params.push(dateFrom, dateTo);
        }

        const query = `
            SELECT 
                la.priority,
                COUNT(*) as total_activities,
                COUNT(CASE WHEN la.status = 'completed' THEN 1 END) as completed_activities,
                COUNT(CASE WHEN la.status = 'pending' THEN 1 END) as pending_activities,
                ROUND((COUNT(CASE WHEN la.status = 'completed' THEN 1 END) / COUNT(*)) * 100, 2) as completion_rate
            FROM lead_activities la
            WHERE la.entity_id = ? ${dateFilter}
            GROUP BY la.priority
            ORDER BY 
                CASE la.priority 
                    WHEN 'urgent' THEN 1 
                    WHEN 'high' THEN 2 
                    WHEN 'medium' THEN 3 
                    WHEN 'low' THEN 4 
                END
        `;

        return executeQuery(query, params);
    }

    // Get activity timeline for a lead
    static async getLeadActivityTimeline(leadId, entityId, limit = 50) {
        const query = `
            SELECT la.*, 
                   u.first_name, u.last_name, u.email as user_email
            FROM lead_activities la
            JOIN users u ON la.user_id = u.id
            WHERE la.lead_id = ? AND la.entity_id = ?
            ORDER BY la.created_at DESC
            LIMIT ?
        `;

        return executeQuery(query, [leadId, entityId, limit]);
    }

    // Get recent activities for dashboard
    static async getRecentActivities(entityId, limit = 20) {
        const query = `
            SELECT la.*, 
                   u.first_name, u.last_name,
                   ld.email as lead_email, ld.first_name as lead_first_name, ld.last_name as lead_last_name
            FROM lead_activities la
            JOIN users u ON la.user_id = u.id
            JOIN lead_data ld ON la.lead_id = ld.id
            WHERE la.entity_id = ?
            ORDER BY la.created_at DESC
            LIMIT ?
        `;

        return executeQuery(query, [entityId, limit]);
    }

    // Get upcoming follow-ups summary
    static async getUpcomingFollowUpsSummary(entityId) {
        const query = `
            SELECT 
                COUNT(*) as total_pending,
                COUNT(CASE WHEN la.priority = 'urgent' THEN 1 END) as urgent_pending,
                COUNT(CASE WHEN la.priority = 'high' THEN 1 END) as high_pending,
                COUNT(CASE WHEN la.next_follow_up_date <= DATE_ADD(NOW(), INTERVAL 24 HOUR) THEN 1 END) as due_within_24h,
                COUNT(CASE WHEN la.next_follow_up_date <= DATE_ADD(NOW(), INTERVAL 7 DAY) THEN 1 END) as due_within_week
            FROM lead_activities la
            WHERE la.entity_id = ? 
                AND la.next_follow_up_date IS NOT NULL 
                AND la.next_follow_up_date > NOW()
                AND la.status = 'pending'
        `;

        const result = await executeQuery(query, [entityId]);
        return result[0] || null;
    }

    // Bulk update follow-up dates
    static async bulkUpdateFollowUpDates(entityId, activityIds, nextFollowUpDate, userId) {
        if (!activityIds || activityIds.length === 0) return 0;

        const placeholders = activityIds.map(() => '?').join(',');
        const query = `
            UPDATE lead_activities 
            SET next_follow_up_date = ?, updated_at = NOW()
            WHERE id IN (${placeholders}) AND entity_id = ?
        `;

        const params = [nextFollowUpDate, ...activityIds, entityId];
        const result = await executeQuery(query, params);

        return result.affectedRows;
    }

    // Get activity summary for dashboard
    static async getActivitySummary(entityId) {
        const query = `
            SELECT 
                la.activity_type,
                COUNT(*) as total_count,
                COUNT(CASE WHEN la.status = 'pending' THEN 1 END) as pending_count,
                COUNT(CASE WHEN la.status = 'completed' THEN 1 END) as completed_count
            FROM lead_activities la
            WHERE la.entity_id = ?
            GROUP BY la.activity_type
            ORDER BY total_count DESC
        `;

        return executeQuery(query, [entityId]);
    }
}

module.exports = LeadActivityModel;
