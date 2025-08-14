const db = require('../config/database');

class AnalyticsModel {
    // Lead Analytics
    static async getLeadAnalytics(entityId, filters = {}) {
        const {
            startDate,
            endDate,
            platform,
            status,
            assignedUserId,
            source
        } = filters;

        let whereClause = 'WHERE ld.entity_id = ?';
        const params = [entityId];

        if (startDate) {
            whereClause += ' AND DATE(ld.created_at) >= ?';
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ' AND DATE(ld.created_at) <= ?';
            params.push(endDate);
        }
        if (platform) {
            whereClause += ' AND lm.platform = ?';
            params.push(platform);
        }
        if (status) {
            whereClause += ' AND ld.status = ?';
            params.push(status);
        }
        if (assignedUserId) {
            whereClause += ' AND ld.assigned_user_id = ?';
            params.push(assignedUserId);
        }
        if (source) {
            whereClause += ' AND lm.source = ?';
            params.push(source);
        }

        const query = `
      SELECT 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN ld.status = 'new' THEN 1 END) as new_leads,
        COUNT(CASE WHEN ld.status = 'contacted' THEN 1 END) as contacted_leads,
        COUNT(CASE WHEN ld.status = 'qualified' THEN 1 END) as qualified_leads,
        COUNT(CASE WHEN ld.status = 'proposal' THEN 1 END) as proposal_leads,
        COUNT(CASE WHEN ld.status = 'negotiation' THEN 1 END) as negotiation_leads,
        COUNT(CASE WHEN ld.status = 'closed_won' THEN 1 END) as closed_won_leads,
        COUNT(CASE WHEN ld.status = 'closed_lost' THEN 1 END) as closed_lost_leads,
        COUNT(CASE WHEN ld.assigned_user_id IS NOT NULL THEN 1 END) as assigned_leads,
        COUNT(CASE WHEN ld.assigned_user_id IS NULL THEN 1 END) as unassigned_leads,
        AVG(CASE WHEN ld.assigned_at IS NOT NULL THEN TIMESTAMPDIFF(HOUR, ld.created_at, ld.assigned_at) END) as avg_assignment_time_hours,
        AVG(CASE WHEN ld.status IN ('closed_won', 'closed_lost') THEN TIMESTAMPDIFF(DAY, ld.created_at, ld.updated_at) END) as avg_cycle_time_days
      FROM lead_data ld
      LEFT JOIN lead_meta lm ON ld.lead_meta_id = lm.id
      ${whereClause}
    `;

        try {
            const [rows] = await db.execute(query, params);
            return rows[0];
        } catch (error) {
            throw new Error(`Error getting lead analytics: ${error.message}`);
        }
    }

    // Platform Performance Analytics
    static async getPlatformPerformance(entityId, filters = {}) {
        const { startDate, endDate } = filters;

        let whereClause = 'WHERE ld.entity_id = ?';
        const params = [entityId];

        if (startDate) {
            whereClause += ' AND DATE(ld.created_at) >= ?';
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ' AND DATE(ld.created_at) <= ?';
            params.push(endDate);
        }

        const query = `
      SELECT 
        lm.platform,
        lm.source,
        COUNT(*) as total_leads,
        COUNT(CASE WHEN ld.status = 'closed_won' THEN 1 END) as won_leads,
        COUNT(CASE WHEN ld.status = 'closed_lost' THEN 1 END) as lost_leads,
        ROUND(
          (COUNT(CASE WHEN ld.status = 'closed_won' THEN 1 END) / 
           COUNT(CASE WHEN ld.status IN ('closed_won', 'closed_lost') THEN 1 END)) * 100, 2
        ) as conversion_rate,
        AVG(CASE WHEN ld.status IN ('closed_won', 'closed_lost') THEN TIMESTAMPDIFF(DAY, ld.created_at, ld.updated_at) END) as avg_cycle_time_days,
        AVG(CASE WHEN ld.assigned_at IS NOT NULL THEN TIMESTAMPDIFF(HOUR, ld.created_at, ld.assigned_at) END) as avg_assignment_time_hours
      FROM lead_data ld
      LEFT JOIN lead_meta lm ON ld.lead_meta_id = lm.id
      ${whereClause}
      GROUP BY lm.platform, lm.source
      ORDER BY total_leads DESC
    `;

        try {
            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            throw new Error(`Error getting platform performance: ${error.message}`);
        }
    }

    // User Performance Analytics
    static async getUserPerformance(entityId, filters = {}) {
        const {
            startDate,
            endDate,
            userId,
            includeInactive = false
        } = filters;

        let whereClause = 'WHERE u.entity_id = ?';
        const params = [entityId];

        if (!includeInactive) {
            whereClause += ' AND u.is_active = 1';
        }
        if (startDate) {
            whereClause += ' AND DATE(ld.created_at) >= ?';
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ' AND DATE(ld.created_at) <= ?';
            params.push(endDate);
        }
        if (userId) {
            whereClause += ' AND u.id = ?';
            params.push(userId);
        }

        const query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        COUNT(DISTINCT ld.id) as total_leads_assigned,
        COUNT(CASE WHEN ld.status = 'closed_won' THEN 1 END) as won_leads,
        COUNT(CASE WHEN ld.status = 'closed_lost' THEN 1 END) as lost_leads,
        ROUND(
          (COUNT(CASE WHEN ld.status = 'closed_won' THEN 1 END) / 
           COUNT(CASE WHEN ld.status IN ('closed_won', 'closed_lost') THEN 1 END)) * 100, 2
        ) as conversion_rate,
        AVG(CASE WHEN ld.status IN ('closed_won', 'closed_lost') THEN TIMESTAMPDIFF(DAY, ld.created_at, ld.updated_at) END) as avg_cycle_time_days,
        AVG(CASE WHEN ld.assigned_at IS NOT NULL THEN TIMESTAMPDIFF(HOUR, ld.created_at, ld.assigned_at) END) as avg_assignment_time_hours,
        COUNT(DISTINCT la.id) as total_activities,
        COUNT(CASE WHEN la.activity_type = 'call' THEN 1 END) as calls_made,
        COUNT(CASE WHEN la.activity_type = 'email' THEN 1 END) as emails_sent,
        COUNT(CASE WHEN la.activity_type = 'meeting' THEN 1 END) as meetings_held,
        COUNT(CASE WHEN la.priority = 'urgent' THEN 1 END) as urgent_activities,
        COUNT(CASE WHEN la.priority = 'high' THEN 1 END) as high_priority_activities
      FROM users u
      LEFT JOIN lead_data ld ON u.id = ld.assigned_user_id AND ld.entity_id = u.entity_id
      LEFT JOIN lead_activities la ON u.id = la.user_id AND la.entity_id = u.entity_id
      ${whereClause}
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.role
      ORDER BY total_leads_assigned DESC
    `;

        try {
            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            throw new Error(`Error getting user performance: ${error.message}`);
        }
    }

    // Conversion Funnel Analytics
    static async getConversionFunnel(entityId, filters = {}) {
        const { startDate, endDate, platform, source } = filters;

        let whereClause = 'WHERE ld.entity_id = ?';
        const params = [entityId];

        if (startDate) {
            whereClause += ' AND DATE(ld.created_at) >= ?';
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ' AND DATE(ld.created_at) <= ?';
            params.push(endDate);
        }
        if (platform) {
            whereClause += ' AND lm.platform = ?';
            params.push(platform);
        }
        if (source) {
            whereClause += ' AND lm.source = ?';
            params.push(source);
        }

        const query = `
      SELECT 
        'Total Leads' as stage,
        COUNT(*) as count,
        100 as percentage
      FROM lead_data ld
      LEFT JOIN lead_meta lm ON ld.lead_meta_id = lm.id
      ${whereClause}
      
      UNION ALL
      
      SELECT 
        'Contacted' as stage,
        COUNT(CASE WHEN ld.status IN ('contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost') THEN 1 END) as count,
        ROUND((COUNT(CASE WHEN ld.status IN ('contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost') THEN 1 END) / COUNT(*)) * 100, 2) as percentage
      FROM lead_data ld
      LEFT JOIN lead_meta lm ON ld.lead_meta_id = lm.id
      ${whereClause}
      
      UNION ALL
      
      SELECT 
        'Qualified' as stage,
        COUNT(CASE WHEN ld.status IN ('qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost') THEN 1 END) as count,
        ROUND((COUNT(CASE WHEN ld.status IN ('qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost') THEN 1 END) / COUNT(*)) * 100, 2) as percentage
      FROM lead_data ld
      LEFT JOIN lead_meta lm ON ld.lead_meta_id = lm.id
      ${whereClause}
      
      UNION ALL
      
      SELECT 
        'Proposal' as stage,
        COUNT(CASE WHEN ld.status IN ('proposal', 'negotiation', 'closed_won', 'closed_lost') THEN 1 END) as count,
        ROUND((COUNT(CASE WHEN ld.status IN ('proposal', 'negotiation', 'closed_won', 'closed_lost') THEN 1 END) / COUNT(*)) * 100, 2) as percentage
      FROM lead_data ld
      LEFT JOIN lead_meta lm ON ld.lead_meta_id = lm.id
      ${whereClause}
      
      UNION ALL
      
      SELECT 
        'Negotiation' as stage,
        COUNT(CASE WHEN ld.status IN ('negotiation', 'closed_won', 'closed_lost') THEN 1 END) as count,
        ROUND((COUNT(CASE WHEN ld.status IN ('negotiation', 'closed_won', 'closed_lost') THEN 1 END) / COUNT(*)) * 100, 2) as percentage
      FROM lead_data ld
      LEFT JOIN lead_meta lm ON ld.lead_meta_id = lm.id
      ${whereClause}
      
      UNION ALL
      
      SELECT 
        'Closed Won' as stage,
        COUNT(CASE WHEN ld.status = 'closed_won' THEN 1 END) as count,
        ROUND((COUNT(CASE WHEN ld.status = 'closed_won' THEN 1 END) / COUNT(*)) * 100, 2) as percentage
      FROM lead_data ld
      LEFT JOIN lead_meta lm ON ld.lead_meta_id = lm.id
      ${whereClause}
      
      UNION ALL
      
      SELECT 
        'Closed Lost' as stage,
        COUNT(CASE WHEN ld.status = 'closed_lost' THEN 1 END) as count,
        ROUND((COUNT(CASE WHEN ld.status = 'closed_lost' THEN 1 END) / COUNT(*)) * 100, 2) as percentage
      FROM lead_data ld
      LEFT JOIN lead_meta lm ON ld.lead_meta_id = lm.id
      ${whereClause}
    `;

        try {
            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            throw new Error(`Error getting conversion funnel: ${error.message}`);
        }
    }

    // Time-based Analytics
    static async getTimeBasedAnalytics(entityId, filters = {}) {
        const {
            startDate,
            endDate,
            groupBy = 'day', // day, week, month
            platform,
            status
        } = filters;

        let whereClause = 'WHERE ld.entity_id = ?';
        const params = [entityId];

        if (startDate) {
            whereClause += ' AND DATE(ld.created_at) >= ?';
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ' AND DATE(ld.created_at) <= ?';
            params.push(endDate);
        }
        if (platform) {
            whereClause += ' AND lm.platform = ?';
            params.push(platform);
        }
        if (status) {
            whereClause += ' AND ld.status = ?';
            params.push(status);
        }

        let dateFormat;
        let groupByClause;

        switch (groupBy) {
            case 'week':
                dateFormat = 'YEARWEEK(ld.created_at)';
                groupByClause = 'YEARWEEK(ld.created_at)';
                break;
            case 'month':
                dateFormat = 'DATE_FORMAT(ld.created_at, "%Y-%m")';
                groupByClause = 'DATE_FORMAT(ld.created_at, "%Y-%m")';
                break;
            default: // day
                dateFormat = 'DATE(ld.created_at)';
                groupByClause = 'DATE(ld.created_at)';
        }

        const query = `
      SELECT 
        ${dateFormat} as period,
        COUNT(*) as total_leads,
        COUNT(CASE WHEN ld.status = 'new' THEN 1 END) as new_leads,
        COUNT(CASE WHEN ld.status = 'closed_won' THEN 1 END) as won_leads,
        COUNT(CASE WHEN ld.status = 'closed_lost' THEN 1 END) as lost_leads,
        ROUND(
          (COUNT(CASE WHEN ld.status = 'closed_won' THEN 1 END) / 
           COUNT(CASE WHEN ld.status IN ('closed_won', 'closed_lost') THEN 1 END)) * 100, 2
        ) as conversion_rate,
        AVG(CASE WHEN ld.status IN ('closed_won', 'closed_lost') THEN TIMESTAMPDIFF(DAY, ld.created_at, ld.updated_at) END) as avg_cycle_time_days
      FROM lead_data ld
      LEFT JOIN lead_meta lm ON ld.lead_meta_id = lm.id
      ${whereClause}
      GROUP BY ${groupByClause}
      ORDER BY period ASC
    `;

        try {
            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            throw new Error(`Error getting time-based analytics: ${error.message}`);
        }
    }

    // Activity Analytics
    static async getActivityAnalytics(entityId, filters = {}) {
        const {
            startDate,
            endDate,
            activityType,
            priority,
            userId
        } = filters;

        let whereClause = 'WHERE la.entity_id = ?';
        const params = [entityId];

        if (startDate) {
            whereClause += ' AND DATE(la.created_at) >= ?';
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ' AND DATE(la.created_at) <= ?';
            params.push(endDate);
        }
        if (activityType) {
            whereClause += ' AND la.activity_type = ?';
            params.push(activityType);
        }
        if (priority) {
            whereClause += ' AND la.priority = ?';
            params.push(priority);
        }
        if (userId) {
            whereClause += ' AND la.user_id = ?';
            params.push(userId);
        }

        const query = `
      SELECT 
        la.activity_type,
        la.priority,
        COUNT(*) as total_activities,
        COUNT(CASE WHEN la.follow_up_date IS NOT NULL THEN 1 END) as activities_with_follow_up,
        COUNT(CASE WHEN la.follow_up_date < NOW() AND la.follow_up_status = 'pending' THEN 1 END) as overdue_follow_ups,
        COUNT(CASE WHEN la.follow_up_date >= NOW() AND la.follow_up_date <= DATE_ADD(NOW(), INTERVAL 7 DAY) AND la.follow_up_status = 'pending' THEN 1 END) as upcoming_follow_ups,
        AVG(CASE WHEN la.follow_up_date IS NOT NULL THEN TIMESTAMPDIFF(HOUR, la.created_at, la.follow_up_date) END) as avg_follow_up_delay_hours,
        COUNT(CASE WHEN la.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR) THEN 1 END) as activities_last_24h,
        COUNT(CASE WHEN la.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as activities_last_7d,
        COUNT(CASE WHEN la.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as activities_last_30d
      FROM lead_activities la
      ${whereClause}
      GROUP BY la.activity_type, la.priority
      ORDER BY total_activities DESC
    `;

        try {
            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            throw new Error(`Error getting activity analytics: ${error.message}`);
        }
    }

    // SLA Compliance Analytics
    static async getSLACompliance(entityId, filters = {}) {
        const {
            startDate,
            endDate,
            slaHours = 24, // Default 24-hour SLA
            status
        } = filters;

        let whereClause = 'WHERE ld.entity_id = ?';
        const params = [entityId];

        if (startDate) {
            whereClause += ' AND DATE(ld.created_at) >= ?';
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ' AND DATE(ld.created_at) <= ?';
            params.push(endDate);
        }
        if (status) {
            whereClause += ' AND ld.status = ?';
            params.push(status);
        }

        const query = `
      SELECT 
        COUNT(*) as total_leads,
        COUNT(CASE WHEN ld.assigned_at IS NOT NULL THEN 1 END) as assigned_leads,
        COUNT(CASE WHEN ld.assigned_at IS NOT NULL AND TIMESTAMPDIFF(HOUR, ld.created_at, ld.assigned_at) <= ? THEN 1 END) as sla_compliant_leads,
        COUNT(CASE WHEN ld.assigned_at IS NOT NULL AND TIMESTAMPDIFF(HOUR, ld.created_at, ld.assigned_at) > ? THEN 1 END) as sla_violation_leads,
        ROUND(
          (COUNT(CASE WHEN ld.assigned_at IS NOT NULL AND TIMESTAMPDIFF(HOUR, ld.created_at, ld.assigned_at) <= ? THEN 1 END) / 
           COUNT(CASE WHEN ld.assigned_at IS NOT NULL THEN 1 END)) * 100, 2
        ) as sla_compliance_rate,
        AVG(CASE WHEN ld.assigned_at IS NOT NULL THEN TIMESTAMPDIFF(HOUR, ld.created_at, ld.assigned_at) END) as avg_assignment_time_hours,
        MAX(CASE WHEN ld.assigned_at IS NOT NULL THEN TIMESTAMPDIFF(HOUR, ld.created_at, ld.assigned_at) END) as max_assignment_time_hours,
        MIN(CASE WHEN ld.assigned_at IS NOT NULL THEN TIMESTAMPDIFF(HOUR, ld.created_at, ld.assigned_at) END) as min_assignment_time_hours
      FROM lead_data ld
      ${whereClause}
    `;

        try {
            const [rows] = await db.execute(query, [...params, slaHours, slaHours, slaHours]);
            return rows[0];
        } catch (error) {
            throw new Error(`Error getting SLA compliance: ${error.message}`);
        }
    }

    // Dashboard Summary
    static async getDashboardSummary(entityId) {
        try {
            const [
                leadCounts,
                todayStats,
                weekStats,
                monthStats,
                recentActivities,
                upcomingFollowUps,
                slaStats
            ] = await Promise.all([
                this.getLeadAnalytics(entityId, {
                    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
                }),
                this.getLeadAnalytics(entityId, {
                    startDate: new Date().toISOString().split('T')[0]
                }),
                this.getLeadAnalytics(entityId, {
                    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]
                }),
                this.getLeadAnalytics(entityId, {
                    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
                }),
                this.getRecentActivities(entityId, 10),
                this.getUpcomingFollowUps(entityId, 10),
                this.getSLACompliance(entityId)
            ]);

            return {
                leadCounts,
                todayStats,
                weekStats,
                monthStats,
                recentActivities,
                upcomingFollowUps,
                slaStats
            };
        } catch (error) {
            throw new Error(`Error getting dashboard summary: ${error.message}`);
        }
    }

    // Helper method for recent activities
    static async getRecentActivities(entityId, limit = 10) {
        const query = `
      SELECT 
        la.id,
        la.activity_type,
        la.description,
        la.priority,
        la.created_at,
        la.follow_up_date,
        la.follow_up_status,
        u.first_name,
        u.last_name,
        ld.id as lead_id,
        CONCAT(ld.first_name, ' ', ld.last_name) as lead_name
      FROM lead_activities la
      JOIN users u ON la.user_id = u.id
      JOIN lead_data ld ON la.lead_id = ld.id
      WHERE la.entity_id = ?
      ORDER BY la.created_at DESC
      LIMIT ?
    `;

        try {
            const [rows] = await db.execute(query, [entityId, limit]);
            return rows;
        } catch (error) {
            throw new Error(`Error getting recent activities: ${error.message}`);
        }
    }

    // Helper method for upcoming follow-ups
    static async getUpcomingFollowUps(entityId, limit = 10) {
        const query = `
      SELECT 
        la.id,
        la.activity_type,
        la.description,
        la.priority,
        la.follow_up_date,
        la.follow_up_status,
        u.first_name,
        u.last_name,
        ld.id as lead_id,
        CONCAT(ld.first_name, ' ', ld.last_name) as lead_name
      FROM lead_activities la
      JOIN users u ON la.user_id = u.id
      JOIN lead_data ld ON la.lead_id = ld.id
      WHERE la.entity_id = ? 
        AND la.follow_up_date >= NOW() 
        AND la.follow_up_status = 'pending'
      ORDER BY la.follow_up_date ASC
      LIMIT ?
    `;

        try {
            const [rows] = await db.execute(query, [entityId, limit]);
            return rows;
        } catch (error) {
            throw new Error(`Error getting upcoming follow-ups: ${error.message}`);
        }
    }
}

module.exports = AnalyticsModel;
