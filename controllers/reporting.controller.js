const ReportingModel = require('../models/reporting.model');

class ReportingController {
    // Create Report Template
    static async createReportTemplate(req, res) {
        try {
            const { entity_id } = req.user;
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
                isActive
            } = req.body;

            if (!name || !reportType) {
                return res.status(400).json({
                    success: false,
                    message: 'Name and report type are required'
                });
            }

            const templateId = await ReportingModel.createReportTemplate(entity_id, {
                name,
                description,
                reportType,
                filters,
                groupBy,
                sortBy,
                sortOrder,
                schedule,
                recipients,
                isActive
            });

            res.status(201).json({
                success: true,
                data: { templateId },
                message: 'Report template created successfully'
            });
        } catch (error) {
            console.error('Error creating report template:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to create report template',
                error: error.message
            });
        }
    }

    // Get Report Templates
    static async getReportTemplates(req, res) {
        try {
            const { entity_id } = req.user;
            const { isActive, reportType } = req.query;

            const filters = {};
            if (isActive !== undefined) filters.isActive = isActive === 'true';
            if (reportType) filters.reportType = reportType;

            const templates = await ReportingModel.getReportTemplates(entity_id, filters);

            res.json({
                success: true,
                data: templates,
                message: 'Report templates retrieved successfully'
            });
        } catch (error) {
            console.error('Error getting report templates:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve report templates',
                error: error.message
            });
        }
    }

    // Get Report Template by ID
    static async getReportTemplateById(req, res) {
        try {
            const { entity_id } = req.user;
            const { templateId } = req.params;

            const templates = await ReportingModel.getReportTemplates(entity_id, {});
            const template = templates.find(t => t.id === parseInt(templateId));

            if (!template) {
                return res.status(404).json({
                    success: false,
                    message: 'Report template not found'
                });
            }

            res.json({
                success: true,
                data: template,
                message: 'Report template retrieved successfully'
            });
        } catch (error) {
            console.error('Error getting report template:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve report template',
                error: error.message
            });
        }
    }

    // Update Report Template
    static async updateReportTemplate(req, res) {
        try {
            const { entity_id } = req.user;
            const { templateId } = req.params;
            const updateData = req.body;

            const success = await ReportingModel.updateReportTemplate(
                parseInt(templateId),
                entity_id,
                updateData
            );

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Report template not found'
                });
            }

            res.json({
                success: true,
                message: 'Report template updated successfully'
            });
        } catch (error) {
            console.error('Error updating report template:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update report template',
                error: error.message
            });
        }
    }

    // Delete Report Template
    static async deleteReportTemplate(req, res) {
        try {
            const { entity_id } = req.user;
            const { templateId } = req.params;

            const success = await ReportingModel.deleteReportTemplate(
                parseInt(templateId),
                entity_id
            );

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Report template not found'
                });
            }

            res.json({
                success: true,
                message: 'Report template deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting report template:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete report template',
                error: error.message
            });
        }
    }

    // Generate Report from Template
    static async generateReportFromTemplate(req, res) {
        try {
            const { entity_id } = req.user;
            const { templateId } = req.params;
            const { customFilters = {} } = req.body;

            const report = await ReportingModel.generateReportFromTemplate(
                parseInt(templateId),
                entity_id,
                customFilters
            );

            res.json({
                success: true,
                data: report,
                message: 'Report generated successfully from template'
            });
        } catch (error) {
            console.error('Error generating report from template:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate report from template',
                error: error.message
            });
        }
    }

    // Save Generated Report
    static async saveGeneratedReport(req, res) {
        try {
            const { entity_id } = req.user;
            const {
                templateId,
                reportType,
                filters,
                data,
                format
            } = req.body;

            if (!templateId || !reportType || !data) {
                return res.status(400).json({
                    success: false,
                    message: 'Template ID, report type, and data are required'
                });
            }

            const reportId = await ReportingModel.saveGeneratedReport(entity_id, {
                templateId,
                reportType,
                filters,
                data,
                generatedBy: req.user.id,
                format
            });

            res.status(201).json({
                success: true,
                data: { reportId },
                message: 'Report saved successfully'
            });
        } catch (error) {
            console.error('Error saving generated report:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to save generated report',
                error: error.message
            });
        }
    }

    // Get Generated Reports
    static async getGeneratedReports(req, res) {
        try {
            const { entity_id } = req.user;
            const {
                reportType,
                generatedBy,
                startDate,
                endDate,
                limit
            } = req.query;

            const filters = {};
            if (reportType) filters.reportType = reportType;
            if (generatedBy) filters.generatedBy = generatedBy;
            if (startDate) filters.startDate = startDate;
            if (endDate) filters.endDate = endDate;
            if (limit) filters.limit = parseInt(limit);

            const reports = await ReportingModel.getGeneratedReports(entity_id, filters);

            res.json({
                success: true,
                data: reports,
                message: 'Generated reports retrieved successfully'
            });
        } catch (error) {
            console.error('Error getting generated reports:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve generated reports',
                error: error.message
            });
        }
    }

    // Get Generated Report by ID
    static async getGeneratedReportById(req, res) {
        try {
            const { entity_id } = req.user;
            const { reportId } = req.params;

            const report = await ReportingModel.getReportById(
                parseInt(reportId),
                entity_id
            );

            if (!report) {
                return res.status(404).json({
                    success: false,
                    message: 'Generated report not found'
                });
            }

            res.json({
                success: true,
                data: report,
                message: 'Generated report retrieved successfully'
            });
        } catch (error) {
            console.error('Error getting generated report:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve generated report',
                error: error.message
            });
        }
    }

    // Delete Generated Report
    static async deleteGeneratedReport(req, res) {
        try {
            const { entity_id } = req.user;
            const { reportId } = req.params;

            const success = await ReportingModel.deleteGeneratedReport(
                parseInt(reportId),
                entity_id
            );

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Generated report not found'
                });
            }

            res.json({
                success: true,
                message: 'Generated report deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting generated report:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete generated report',
                error: error.message
            });
        }
    }

    // Get Report Statistics
    static async getReportStatistics(req, res) {
        try {
            const { entity_id } = req.user;
            const { startDate, endDate, reportType } = req.query;

            const filters = {};
            if (startDate) filters.startDate = startDate;
            if (endDate) filters.endDate = endDate;
            if (reportType) filters.reportType = reportType;

            const statistics = await ReportingModel.getReportStatistics(entity_id, filters);

            res.json({
                success: true,
                data: statistics,
                message: 'Report statistics retrieved successfully'
            });
        } catch (error) {
            console.error('Error getting report statistics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve report statistics',
                error: error.message
            });
        }
    }

    // Schedule Report
    static async scheduleReport(req, res) {
        try {
            const { entity_id } = req.user;
            const {
                templateId,
                frequency,
                time,
                dayOfWeek,
                dayOfMonth,
                isActive
            } = req.body;

            if (!templateId || !frequency || !time) {
                return res.status(400).json({
                    success: false,
                    message: 'Template ID, frequency, and time are required'
                });
            }

            const scheduleId = await ReportingModel.scheduleReport(entity_id, {
                templateId,
                frequency,
                time,
                dayOfWeek,
                dayOfMonth,
                isActive
            });

            res.status(201).json({
                success: true,
                data: { scheduleId },
                message: 'Report scheduled successfully'
            });
        } catch (error) {
            console.error('Error scheduling report:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to schedule report',
                error: error.message
            });
        }
    }

    // Get Scheduled Reports
    static async getScheduledReports(req, res) {
        try {
            const { entity_id } = req.user;

            const schedules = await ReportingModel.getScheduledReports(entity_id);

            res.json({
                success: true,
                data: schedules,
                message: 'Scheduled reports retrieved successfully'
            });
        } catch (error) {
            console.error('Error getting scheduled reports:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve scheduled reports',
                error: error.message
            });
        }
    }

    // Update Report Schedule
    static async updateReportSchedule(req, res) {
        try {
            const { entity_id } = req.user;
            const { scheduleId } = req.params;
            const updateData = req.body;

            const success = await ReportingModel.updateReportSchedule(
                parseInt(scheduleId),
                entity_id,
                updateData
            );

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Report schedule not found'
                });
            }

            res.json({
                success: true,
                message: 'Report schedule updated successfully'
            });
        } catch (error) {
            console.error('Error updating report schedule:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update report schedule',
                error: error.message
            });
        }
    }

    // Delete Report Schedule
    static async deleteReportSchedule(req, res) {
        try {
            const { entity_id } = req.user;
            const { scheduleId } = req.params;

            const success = await ReportingModel.deleteReportSchedule(
                parseInt(scheduleId),
                entity_id
            );

            if (!success) {
                return res.status(404).json({
                    success: false,
                    message: 'Report schedule not found'
                });
            }

            res.json({
                success: true,
                message: 'Report schedule deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting report schedule:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to delete report schedule',
                error: error.message
            });
        }
    }

    // Generate and Save Report (Combined operation)
    static async generateAndSaveReport(req, res) {
        try {
            const { entity_id } = req.user;
            const {
                templateId,
                customFilters = {},
                format = 'json'
            } = req.body;

            if (!templateId) {
                return res.status(400).json({
                    success: false,
                    message: 'Template ID is required'
                });
            }

            // Generate report from template
            const report = await ReportingModel.generateReportFromTemplate(
                parseInt(templateId),
                entity_id,
                customFilters
            );

            // Save the generated report
            const reportId = await ReportingModel.saveGeneratedReport(entity_id, {
                templateId: parseInt(templateId),
                reportType: report.template.reportType,
                filters: report.filters,
                data: report.data,
                generatedBy: req.user.id,
                format
            });

            res.status(201).json({
                success: true,
                data: {
                    reportId,
                    report: {
                        ...report,
                        saved: true
                    }
                },
                message: 'Report generated and saved successfully'
            });
        } catch (error) {
            console.error('Error generating and saving report:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate and save report',
                error: error.message
            });
        }
    }
}

module.exports = ReportingController;
