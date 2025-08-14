const { executeQuery } = require('../config/database');

class LeadStatusModel {
    // Get all active statuses
    static async getAllStatuses() {
        const query = `
            SELECT * FROM lead_statuses 
            WHERE is_active = TRUE 
            ORDER BY id
        `;

        return executeQuery(query);
    }

    // Get status by ID
    static async getStatusById(statusId) {
        const query = `
            SELECT * FROM lead_statuses 
            WHERE id = ? AND is_active = TRUE
        `;

        const statuses = await executeQuery(query, [statusId]);
        return statuses[0] || null;
    }

    // Get status by name
    static async getStatusByName(statusName) {
        const query = `
            SELECT * FROM lead_statuses 
            WHERE name = ? AND is_active = TRUE
        `;

        const statuses = await executeQuery(query, [statusName]);
        return statuses[0] || null;
    }

    // Get next possible statuses (workflow rules)
    static async getNextPossibleStatuses(currentStatusName) {
        // Define workflow rules
        const workflowRules = {
            'new': ['qualified', 'lost'],
            'qualified': ['contacted', 'lost'],
            'contacted': ['meeting_scheduled', 'proposal_sent', 'lost'],
            'meeting_scheduled': ['proposal_sent', 'negotiation', 'lost'],
            'proposal_sent': ['negotiation', 'won', 'lost'],
            'negotiation': ['won', 'lost'],
            'won': [], // Terminal status
            'lost': []  // Terminal status
        };

        const nextStatuses = workflowRules[currentStatusName] || [];

        if (nextStatuses.length === 0) {
            return [];
        }

        const query = `
            SELECT * FROM lead_statuses 
            WHERE name IN (${nextStatuses.map(() => '?').join(',')}) 
            AND is_active = TRUE
            ORDER BY id
        `;

        return executeQuery(query, nextStatuses);
    }

    // Get previous possible statuses
    static async getPreviousPossibleStatuses(currentStatusName) {
        // Define reverse workflow rules
        const reverseWorkflowRules = {
            'qualified': ['new'],
            'contacted': ['qualified'],
            'meeting_scheduled': ['contacted'],
            'proposal_sent': ['contacted', 'meeting_scheduled'],
            'negotiation': ['proposal_sent', 'meeting_scheduled'],
            'won': ['proposal_sent', 'negotiation'],
            'lost': ['new', 'qualified', 'contacted', 'meeting_scheduled', 'proposal_sent', 'negotiation']
        };

        const previousStatuses = reverseWorkflowRules[currentStatusName] || [];

        if (previousStatuses.length === 0) {
            return [];
        }

        const query = `
            SELECT * FROM lead_statuses 
            WHERE name IN (${previousStatuses.map(() => '?').join(',')}) 
            AND is_active = TRUE
            ORDER BY id
        `;

        return executeQuery(query, previousStatuses);
    }

    // Validate status transition
    static async validateStatusTransition(fromStatusName, toStatusName) {
        const nextPossibleStatuses = await this.getNextPossibleStatuses(fromStatusName);
        const isValidTransition = nextPossibleStatuses.some(status => status.name === toStatusName);

        return {
            isValid: isValidTransition,
            allowedStatuses: nextPossibleStatuses,
            message: isValidTransition
                ? 'Valid status transition'
                : `Invalid transition from '${fromStatusName}' to '${toStatusName}'`
        };
    }

    // Get status statistics for an entity
    static async getStatusStatistics(entityId, dateFrom = null, dateTo = null) {
        let dateFilter = '';
        const params = [entityId];

        if (dateFrom && dateTo) {
            dateFilter = ` AND ld.created_at BETWEEN ? AND ?`;
            params.push(dateFrom, dateTo);
        }

        const query = `
            SELECT 
                ls.name as status_name,
                ls.description as status_description,
                COUNT(*) as lead_count,
                COUNT(CASE WHEN ld.assigned_user_id IS NOT NULL THEN 1 END) as assigned_leads,
                COUNT(CASE WHEN ld.assigned_user_id IS NULL THEN 1 END) as unassigned_leads,
                AVG(TIMESTAMPDIFF(HOUR, ld.created_at, NOW())) as avg_age_hours
            FROM lead_data ld
            JOIN lead_statuses ls ON ld.status = ls.name
            WHERE ld.entity_id = ? ${dateFilter}
            GROUP BY ls.id, ls.name, ls.description
            ORDER BY lead_count DESC
        `;

        return executeQuery(query, params);
    }

    // Get status progression timeline
    static async getStatusProgressionTimeline(entityId, leadId) {
        const query = `
            SELECT 
                ls.name as status_name,
                ls.description as status_description,
                ls.entered_at,
                ls.exited_at,
                ls.duration_hours,
                ls.notes,
                ls.next_action_required,
                u.first_name, u.last_name, u.email as user_email
            FROM lead_stages ls
            JOIN lead_statuses ls ON ls.status_id = ls.id
            JOIN users u ON ls.user_id = u.id
            WHERE ls.entity_id = ? AND ls.lead_id = ?
            ORDER BY ls.entered_at ASC
        `;

        return executeQuery(query, [entityId, leadId]);
    }

    // Get status performance metrics
    static async getStatusPerformanceMetrics(entityId, dateFrom = null, dateTo = null) {
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
                AVG(CASE WHEN ls.duration_hours IS NOT NULL THEN ls.duration_hours END) as avg_duration_hours,
                MIN(CASE WHEN ls.duration_hours IS NOT NULL THEN ls.duration_hours END) as min_duration_hours,
                MAX(CASE WHEN ls.duration_hours IS NOT NULL THEN ls.duration_hours END) as max_duration_hours,
                COUNT(CASE WHEN ls.duration_hours > 24 THEN 1 END) as leads_exceeding_24h,
                COUNT(CASE WHEN ls.duration_hours > 48 THEN 1 END) as leads_exceeding_48h
            FROM lead_stages ls
            JOIN lead_statuses ls ON ls.status_id = ls.id
            WHERE ls.entity_id = ? ${dateFilter}
            GROUP BY ls.id, ls.name, ls.description
            ORDER BY total_entries DESC
        `;

        return executeQuery(query, params);
    }

    // Get status SLA compliance
    static async getStatusSLACompliance(entityId, slaHours = 24) {
        const query = `
            SELECT 
                ls.name as status_name,
                ls.description as status_description,
                COUNT(*) as total_leads,
                COUNT(CASE WHEN ls.duration_hours <= ? THEN 1 END) as within_sla,
                COUNT(CASE WHEN ls.duration_hours > ? THEN 1 END) as exceeding_sla,
                ROUND((COUNT(CASE WHEN ls.duration_hours <= ? THEN 1 END) / COUNT(*)) * 100, 2) as sla_compliance_rate
            FROM lead_stages ls
            JOIN lead_statuses ls ON ls.status_id = ls.id
            WHERE ls.entity_id = ? AND ls.exited_at IS NOT NULL
            GROUP BY ls.id, ls.name, ls.description
            ORDER BY sla_compliance_rate DESC
        `;

        return executeQuery(query, [slaHours, slaHours, slaHours, entityId]);
    }

    // Get status workflow efficiency
    static async getStatusWorkflowEfficiency(entityId, dateFrom = null, dateTo = null) {
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
                COUNT(CASE WHEN ls.exited_at IS NOT NULL THEN 1 END) as completed_stages,
                COUNT(CASE WHEN ls.exited_at IS NULL THEN 1 END) as active_stages,
                ROUND((COUNT(CASE WHEN ls.exited_at IS NOT NULL THEN 1 END) / COUNT(*)) * 100, 2) as completion_rate,
                AVG(CASE WHEN ls.duration_hours IS NOT NULL THEN ls.duration_hours END) as avg_completion_time
            FROM lead_stages ls
            JOIN lead_statuses ls ON ls.status_id = ls.id
            WHERE ls.entity_id = ? ${dateFilter}
            GROUP BY ls.id, ls.name, ls.description
            ORDER BY completion_rate DESC
        `;

        return executeQuery(query, params);
    }

    // Get status bottleneck analysis
    static async getStatusBottleneckAnalysis(entityId, dateFrom = null, dateTo = null) {
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
                AVG(CASE WHEN ls.duration_hours IS NOT NULL THEN ls.duration_hours END) as avg_duration_hours,
                COUNT(CASE WHEN ls.duration_hours > 24 THEN 1 END) as leads_over_24h,
                COUNT(CASE WHEN ls.duration_hours > 48 THEN 1 END) as leads_over_48h,
                COUNT(CASE WHEN ls.duration_hours > 72 THEN 1 END) as leads_over_72h,
                ROUND((COUNT(CASE WHEN ls.duration_hours > 24 THEN 1 END) / COUNT(*)) * 100, 2) as bottleneck_percentage
            FROM lead_stages ls
            JOIN lead_statuses ls ON ls.status_id = ls.id
            WHERE ls.entity_id = ? ${dateFilter}
            GROUP BY ls.id, ls.name, ls.description
            HAVING bottleneck_percentage > 20
            ORDER BY bottleneck_percentage DESC
        `;

        return executeQuery(query, params);
    }
}

module.exports = LeadStatusModel;
