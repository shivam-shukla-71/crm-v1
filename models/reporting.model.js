const db = require('../config/database');

class ReportingModel {
    // Create Report Template
    static async createReportTemplate(entityId, templateData) {
        const {
            name,
            description,
            reportType,
            filters,
            groupBy,
            sortBy,
            sortOrder,
            schedule,
            recipients,
            isActive = true
        } = templateData;

        const query = `
      INSERT INTO report_templates (
        entity_id, name, description, report_type, filters, group_by, 
        sort_by, sort_order, schedule, recipients, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

        const params = [
            entityId,
            name,
            description,
            reportType,
            JSON.stringify(filters),
            groupBy,
            sortBy,
            sortOrder,
            JSON.stringify(schedule),
            JSON.stringify(recipients),
            isActive
        ];

        try {
            const [result] = await db.execute(query, params);
            return result.insertId;
        } catch (error) {
            throw new Error(`Error creating report template: ${error.message}`);
        }
    }

    // Get Report Templates
    static async getReportTemplates(entityId, filters = {}) {
        const { isActive, reportType } = filters;

        let whereClause = 'WHERE entity_id = ?';
        const params = [entityId];

        if (isActive !== undefined) {
            whereClause += ' AND is_active = ?';
            params.push(isActive);
        }
        if (reportType) {
            whereClause += ' AND report_type = ?';
            params.push(reportType);
        }

        const query = `
      SELECT 
        id, name, description, report_type, filters, group_by, 
        sort_by, sort_order, schedule, recipients, is_active, 
        created_at, updated_at
      FROM report_templates
      ${whereClause}
      ORDER BY created_at DESC
    `;

        try {
            const [rows] = await db.execute(query, params);
            return rows.map(row => ({
                ...row,
                filters: JSON.parse(row.filters),
                schedule: JSON.parse(row.schedule),
                recipients: JSON.parse(row.recipients)
            }));
        } catch (error) {
            throw new Error(`Error getting report templates: ${error.message}`);
        }
    }

    // Update Report Template
    static async updateReportTemplate(templateId, entityId, updateData) {
        const {
            name,
            description,
            filters,
            groupBy,
            sortBy,
            sortOrder,
            schedule,
            recipients,
            isActive
        } = updateData;

        const query = `
      UPDATE report_templates 
      SET 
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        filters = COALESCE(?, filters),
        group_by = COALESCE(?, group_by),
        sort_by = COALESCE(?, sort_by),
        sort_order = COALESCE(?, sort_order),
        schedule = COALESCE(?, schedule),
        recipients = COALESCE(?, recipients),
        is_active = COALESCE(?, is_active),
        updated_at = NOW()
      WHERE id = ? AND entity_id = ?
    `;

        const params = [
            name,
            description,
            filters ? JSON.stringify(filters) : null,
            groupBy,
            sortBy,
            sortOrder,
            schedule ? JSON.stringify(schedule) : null,
            recipients ? JSON.stringify(recipients) : null,
            isActive,
            templateId,
            entityId
        ];

        try {
            const [result] = await db.execute(query, params);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error updating report template: ${error.message}`);
        }
    }

    // Delete Report Template
    static async deleteReportTemplate(templateId, entityId) {
        const query = 'DELETE FROM report_templates WHERE id = ? AND entity_id = ?';

        try {
            const [result] = await db.execute(query, [templateId, entityId]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error deleting report template: ${error.message}`);
        }
    }

    // Generate Report from Template
    static async generateReportFromTemplate(templateId, entityId, customFilters = {}) {
        try {
            // Get template
            const templates = await this.getReportTemplates(entityId, {});
            const template = templates.find(t => t.id === parseInt(templateId));

            if (!template) {
                throw new Error('Report template not found');
            }

            // Merge template filters with custom filters
            const mergedFilters = { ...template.filters, ...customFilters };

            // Generate report based on template type
            const AnalyticsModel = require('./analytics.model');
            let reportData;

            switch (template.reportType) {
                case 'lead_summary':
                    reportData = await AnalyticsModel.getLeadAnalytics(entityId, mergedFilters);
                    break;
                case 'platform_performance':
                    reportData = await AnalyticsModel.getPlatformPerformance(entityId, mergedFilters);
                    break;
                case 'user_performance':
                    reportData = await AnalyticsModel.getUserPerformance(entityId, mergedFilters);
                    break;
                case 'conversion_funnel':
                    reportData = await AnalyticsModel.getConversionFunnel(entityId, mergedFilters);
                    break;
                case 'time_based':
                    reportData = await AnalyticsModel.getTimeBasedAnalytics(entityId, {
                        ...mergedFilters,
                        groupBy: template.groupBy || 'day'
                    });
                    break;
                case 'activity_summary':
                    reportData = await AnalyticsModel.getActivityAnalytics(entityId, mergedFilters);
                    break;
                case 'sla_compliance':
                    reportData = await AnalyticsModel.getSLACompliance(entityId, mergedFilters);
                    break;
                default:
                    throw new Error('Invalid report type in template');
            }

            return {
                template,
                filters: mergedFilters,
                data: reportData,
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            throw new Error(`Error generating report from template: ${error.message}`);
        }
    }

    // Save Generated Report
    static async saveGeneratedReport(entityId, reportData) {
        const {
            templateId,
            reportType,
            filters,
            data,
            generatedBy,
            format = 'json'
        } = reportData;

        const query = `
      INSERT INTO generated_reports (
        entity_id, template_id, report_type, filters, data, 
        generated_by, format, generated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

        const params = [
            entityId,
            templateId,
            reportType,
            JSON.stringify(filters),
            JSON.stringify(data),
            generatedBy,
            format
        ];

        try {
            const [result] = await db.execute(query, params);
            return result.insertId;
        } catch (error) {
            throw new Error(`Error saving generated report: ${error.message}`);
        }
    }

    // Get Generated Reports
    static async getGeneratedReports(entityId, filters = {}) {
        const { reportType, generatedBy, startDate, endDate, limit = 50 } = filters;

        let whereClause = 'WHERE gr.entity_id = ?';
        const params = [entityId];

        if (reportType) {
            whereClause += ' AND gr.report_type = ?';
            params.push(reportType);
        }
        if (generatedBy) {
            whereClause += ' AND gr.generated_by = ?';
            params.push(generatedBy);
        }
        if (startDate) {
            whereClause += ' AND DATE(gr.generated_at) >= ?';
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ' AND DATE(gr.generated_at) <= ?';
            params.push(endDate);
        }

        const query = `
      SELECT 
        gr.id, gr.template_id, gr.report_type, gr.filters, 
        gr.generated_by, gr.format, gr.generated_at,
        rt.name as template_name, rt.description as template_description,
        u.first_name, u.last_name, u.email
      FROM generated_reports gr
      LEFT JOIN report_templates rt ON gr.template_id = rt.id
      LEFT JOIN users u ON gr.generated_by = u.id
      ${whereClause}
      ORDER BY gr.generated_at DESC
      LIMIT ?
    `;

        try {
            const [rows] = await db.execute(query, [...params, limit]);
            return rows.map(row => ({
                ...row,
                filters: JSON.parse(row.filters),
                user: {
                    id: row.generated_by,
                    name: `${row.first_name} ${row.last_name}`,
                    email: row.email
                }
            }));
        } catch (error) {
            throw new Error(`Error getting generated reports: ${error.message}`);
        }
    }

    // Get Report by ID
    static async getReportById(reportId, entityId) {
        const query = `
      SELECT 
        gr.*, rt.name as template_name, rt.description as template_description,
        u.first_name, u.last_name, u.email
      FROM generated_reports gr
      LEFT JOIN report_templates rt ON gr.template_id = rt.id
      LEFT JOIN users u ON gr.generated_by = u.id
      WHERE gr.id = ? AND gr.entity_id = ?
    `;

        try {
            const [rows] = await db.execute(query, [reportId, entityId]);
            if (rows.length === 0) {
                return null;
            }

            const row = rows[0];
            return {
                ...row,
                filters: JSON.parse(row.filters),
                data: JSON.parse(row.data),
                user: {
                    id: row.generated_by,
                    name: `${row.first_name} ${row.last_name}`,
                    email: row.email
                }
            };
        } catch (error) {
            throw new Error(`Error getting report by ID: ${error.message}`);
        }
    }

    // Delete Generated Report
    static async deleteGeneratedReport(reportId, entityId) {
        const query = 'DELETE FROM generated_reports WHERE id = ? AND entity_id = ?';

        try {
            const [result] = await db.execute(query, [reportId, entityId]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error deleting generated report: ${error.message}`);
        }
    }

    // Get Report Statistics
    static async getReportStatistics(entityId, filters = {}) {
        const { startDate, endDate, reportType } = filters;

        let whereClause = 'WHERE entity_id = ?';
        const params = [entityId];

        if (startDate) {
            whereClause += ' AND DATE(generated_at) >= ?';
            params.push(startDate);
        }
        if (endDate) {
            whereClause += ' AND DATE(generated_at) <= ?';
            params.push(endDate);
        }
        if (reportType) {
            whereClause += ' AND report_type = ?';
            params.push(reportType);
        }

        const query = `
      SELECT 
        report_type,
        format,
        COUNT(*) as total_reports,
        COUNT(CASE WHEN DATE(generated_at) = CURDATE() THEN 1 END) as reports_today,
        COUNT(CASE WHEN DATE(generated_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 END) as reports_this_week,
        COUNT(CASE WHEN DATE(generated_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN 1 END) as reports_this_month,
        AVG(LENGTH(data)) as avg_data_size_bytes
      FROM generated_reports
      ${whereClause}
      GROUP BY report_type, format
      ORDER BY total_reports DESC
    `;

        try {
            const [rows] = await db.execute(query, params);
            return rows;
        } catch (error) {
            throw new Error(`Error getting report statistics: ${error.message}`);
        }
    }

    // Schedule Report
    static async scheduleReport(entityId, scheduleData) {
        const {
            templateId,
            frequency, // daily, weekly, monthly
            time, // HH:MM format
            dayOfWeek, // 0-6 for weekly (Sunday = 0)
            dayOfMonth, // 1-31 for monthly
            isActive = true
        } = scheduleData;

        const query = `
      INSERT INTO report_schedules (
        entity_id, template_id, frequency, time, day_of_week, 
        day_of_month, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

        const params = [
            entityId,
            templateId,
            frequency,
            time,
            dayOfWeek,
            dayOfMonth,
            isActive
        ];

        try {
            const [result] = await db.execute(query, params);
            return result.insertId;
        } catch (error) {
            throw new Error(`Error scheduling report: ${error.message}`);
        }
    }

    // Get Scheduled Reports
    static async getScheduledReports(entityId) {
        const query = `
      SELECT 
        rs.*, rt.name as template_name, rt.description as template_description,
        rt.report_type
      FROM report_schedules rs
      JOIN report_templates rt ON rs.template_id = rt.id
      WHERE rs.entity_id = ? AND rs.is_active = 1
      ORDER BY rs.created_at ASC
    `;

        try {
            const [rows] = await db.execute(query, [entityId]);
            return rows;
        } catch (error) {
            throw new Error(`Error getting scheduled reports: ${error.message}`);
        }
    }

    // Update Report Schedule
    static async updateReportSchedule(scheduleId, entityId, updateData) {
        const {
            frequency,
            time,
            dayOfWeek,
            dayOfMonth,
            isActive
        } = updateData;

        const query = `
      UPDATE report_schedules 
      SET 
        frequency = COALESCE(?, frequency),
        time = COALESCE(?, time),
        day_of_week = COALESCE(?, day_of_week),
        day_of_month = COALESCE(?, day_of_month),
        is_active = COALESCE(?, is_active),
        updated_at = NOW()
      WHERE id = ? AND entity_id = ?
    `;

        const params = [
            frequency,
            time,
            dayOfWeek,
            dayOfMonth,
            isActive,
            scheduleId,
            entityId
        ];

        try {
            const [result] = await db.execute(query, params);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error updating report schedule: ${error.message}`);
        }
    }

    // Delete Report Schedule
    static async deleteReportSchedule(scheduleId, entityId) {
        const query = 'DELETE FROM report_schedules WHERE id = ? AND entity_id = ?';

        try {
            const [result] = await db.execute(query, [scheduleId, entityId]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error deleting report schedule: ${error.message}`);
        }
    }
}

module.exports = ReportingModel;
