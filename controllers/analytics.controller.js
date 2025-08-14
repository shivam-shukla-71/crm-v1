const AnalyticsModel = require('../models/analytics.model');

class AnalyticsController {
    // Dashboard Summary
    static async getDashboardSummary(req, res) {
        try {
            const { entity_id } = req.user;
            const summary = await AnalyticsModel.getDashboardSummary(entity_id);

            res.json({
                success: true,
                data: summary,
                message: 'Dashboard summary retrieved successfully'
            });
        } catch (error) {
            console.error('Error getting dashboard summary:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve dashboard summary',
                error: error.message
            });
        }
    }

    // Lead Analytics
    static async getLeadAnalytics(req, res) {
        try {
            const { entity_id } = req.user;
            const {
                startDate,
                endDate,
                platform,
                status,
                assignedUserId,
                source
            } = req.query;

            const filters = {
                startDate,
                endDate,
                platform,
                status,
                assignedUserId,
                source
            };

            const analytics = await AnalyticsModel.getLeadAnalytics(entity_id, filters);

            res.json({
                success: true,
                data: analytics,
                message: 'Lead analytics retrieved successfully'
            });
        } catch (error) {
            console.error('Error getting lead analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve lead analytics',
                error: error.message
            });
        }
    }

    // Platform Performance Analytics
    static async getPlatformPerformance(req, res) {
        try {
            const { entity_id } = req.user;
            const { startDate, endDate } = req.query;

            const filters = { startDate, endDate };
            const performance = await AnalyticsModel.getPlatformPerformance(entity_id, filters);

            res.json({
                success: true,
                data: performance,
                message: 'Platform performance analytics retrieved successfully'
            });
        } catch (error) {
            console.error('Error getting platform performance:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve platform performance analytics',
                error: error.message
            });
        }
    }

    // User Performance Analytics
    static async getUserPerformance(req, res) {
        try {
            const { entity_id } = req.user;
            const {
                startDate,
                endDate,
                userId,
                includeInactive
            } = req.query;

            const filters = {
                startDate,
                endDate,
                userId,
                includeInactive: includeInactive === 'true'
            };

            const performance = await AnalyticsModel.getUserPerformance(entity_id, filters);

            res.json({
                success: true,
                data: performance,
                message: 'User performance analytics retrieved successfully'
            });
        } catch (error) {
            console.error('Error getting user performance:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve user performance analytics',
                error: error.message
            });
        }
    }

    // Conversion Funnel Analytics
    static async getConversionFunnel(req, res) {
        try {
            const { entity_id } = req.user;
            const {
                startDate,
                endDate,
                platform,
                source
            } = req.query;

            const filters = { startDate, endDate, platform, source };
            const funnel = await AnalyticsModel.getConversionFunnel(entity_id, filters);

            res.json({
                success: true,
                data: funnel,
                message: 'Conversion funnel analytics retrieved successfully'
            });
        } catch (error) {
            console.error('Error getting conversion funnel:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve conversion funnel analytics',
                error: error.message
            });
        }
    }

    // Time-based Analytics
    static async getTimeBasedAnalytics(req, res) {
        try {
            const { entity_id } = req.user;
            const {
                startDate,
                endDate,
                groupBy = 'day',
                platform,
                status
            } = req.query;

            const filters = {
                startDate,
                endDate,
                groupBy,
                platform,
                status
            };

            const analytics = await AnalyticsModel.getTimeBasedAnalytics(entity_id, filters);

            res.json({
                success: true,
                data: analytics,
                message: 'Time-based analytics retrieved successfully'
            });
        } catch (error) {
            console.error('Error getting time-based analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve time-based analytics',
                error: error.message
            });
        }
    }

    // Activity Analytics
    static async getActivityAnalytics(req, res) {
        try {
            const { entity_id } = req.user;
            const {
                startDate,
                endDate,
                activityType,
                priority,
                userId
            } = req.query;

            const filters = {
                startDate,
                endDate,
                activityType,
                priority,
                userId
            };

            const analytics = await AnalyticsModel.getActivityAnalytics(entity_id, filters);

            res.json({
                success: true,
                data: analytics,
                message: 'Activity analytics retrieved successfully'
            });
        } catch (error) {
            console.error('Error getting activity analytics:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve activity analytics',
                error: error.message
            });
        }
    }

    // SLA Compliance Analytics
    static async getSLACompliance(req, res) {
        try {
            const { entity_id } = req.user;
            const {
                startDate,
                endDate,
                slaHours = 24,
                status
            } = req.query;

            const filters = {
                startDate,
                endDate,
                slaHours: parseInt(slaHours),
                status
            };

            const compliance = await AnalyticsModel.getSLACompliance(entity_id, filters);

            res.json({
                success: true,
                data: compliance,
                message: 'SLA compliance analytics retrieved successfully'
            });
        } catch (error) {
            console.error('Error getting SLA compliance:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve SLA compliance analytics',
                error: error.message
            });
        }
    }

    // Recent Activities
    static async getRecentActivities(req, res) {
        try {
            const { entity_id } = req.user;
            const { limit = 10 } = req.query;

            const activities = await AnalyticsModel.getRecentActivities(entity_id, parseInt(limit));

            res.json({
                success: true,
                data: activities,
                message: 'Recent activities retrieved successfully'
            });
        } catch (error) {
            console.error('Error getting recent activities:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve recent activities',
                error: error.message
            });
        }
    }

    // Upcoming Follow-ups
    static async getUpcomingFollowUps(req, res) {
        try {
            const { entity_id } = req.user;
            const { limit = 10 } = req.query;

            const followUps = await AnalyticsModel.getUpcomingFollowUps(entity_id, parseInt(limit));

            res.json({
                success: true,
                data: followUps,
                message: 'Upcoming follow-ups retrieved successfully'
            });
        } catch (error) {
            console.error('Error getting upcoming follow-ups:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve upcoming follow-ups',
                error: error.message
            });
        }
    }

    // Custom Report Builder
    static async generateCustomReport(req, res) {
        try {
            const { entity_id } = req.user;
            const {
                reportType,
                startDate,
                endDate,
                filters = {},
                groupBy,
                sortBy = 'created_at',
                sortOrder = 'DESC',
                limit = 100
            } = req.body;

            if (!reportType) {
                return res.status(400).json({
                    success: false,
                    message: 'Report type is required'
                });
            }

            let reportData;
            const baseFilters = { startDate, endDate, ...filters };

            switch (reportType) {
                case 'lead_summary':
                    reportData = await AnalyticsModel.getLeadAnalytics(entity_id, baseFilters);
                    break;
                case 'platform_performance':
                    reportData = await AnalyticsModel.getPlatformPerformance(entity_id, baseFilters);
                    break;
                case 'user_performance':
                    reportData = await AnalyticsModel.getUserPerformance(entity_id, baseFilters);
                    break;
                case 'conversion_funnel':
                    reportData = await AnalyticsModel.getConversionFunnel(entity_id, baseFilters);
                    break;
                case 'time_based':
                    reportData = await AnalyticsModel.getTimeBasedAnalytics(entity_id, {
                        ...baseFilters,
                        groupBy: groupBy || 'day'
                    });
                    break;
                case 'activity_summary':
                    reportData = await AnalyticsModel.getActivityAnalytics(entity_id, baseFilters);
                    break;
                case 'sla_compliance':
                    reportData = await AnalyticsModel.getSLACompliance(entity_id, baseFilters);
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid report type'
                    });
            }

            res.json({
                success: true,
                data: {
                    reportType,
                    filters: baseFilters,
                    groupBy,
                    sortBy,
                    sortOrder,
                    limit,
                    results: reportData
                },
                message: 'Custom report generated successfully'
            });
        } catch (error) {
            console.error('Error generating custom report:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to generate custom report',
                error: error.message
            });
        }
    }

    // Export Report Data
    static async exportReportData(req, res) {
        try {
            const { entity_id } = req.user;
            const {
                reportType,
                startDate,
                endDate,
                filters = {},
                format = 'json' // json, csv
            } = req.body;

            if (!reportType) {
                return res.status(400).json({
                    success: false,
                    message: 'Report type is required'
                });
            }

            let reportData;
            const baseFilters = { startDate, endDate, ...filters };

            switch (reportType) {
                case 'lead_summary':
                    reportData = await AnalyticsModel.getLeadAnalytics(entity_id, baseFilters);
                    break;
                case 'platform_performance':
                    reportData = await AnalyticsModel.getPlatformPerformance(entity_id, baseFilters);
                    break;
                case 'user_performance':
                    reportData = await AnalyticsModel.getUserPerformance(entity_id, baseFilters);
                    break;
                case 'conversion_funnel':
                    reportData = await AnalyticsModel.getConversionFunnel(entity_id, baseFilters);
                    break;
                case 'time_based':
                    reportData = await AnalyticsModel.getTimeBasedAnalytics(entity_id, baseFilters);
                    break;
                case 'activity_summary':
                    reportData = await AnalyticsModel.getActivityAnalytics(entity_id, baseFilters);
                    break;
                case 'sla_compliance':
                    reportData = await AnalyticsModel.getSLACompliance(entity_id, baseFilters);
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid report type'
                    });
            }

            if (format === 'csv') {
                // Convert to CSV format
                const csvData = convertToCSV(reportData);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="${reportType}_${new Date().toISOString().split('T')[0]}.csv"`);
                return res.send(csvData);
            }

            // Default JSON response
            res.json({
                success: true,
                data: {
                    reportType,
                    filters: baseFilters,
                    format,
                    results: reportData,
                    exportedAt: new Date().toISOString()
                },
                message: 'Report data exported successfully'
            });
        } catch (error) {
            console.error('Error exporting report data:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to export report data',
                error: error.message
            });
        }
    }
}

// Helper function to convert data to CSV format
function convertToCSV(data) {
    if (!Array.isArray(data)) {
        data = [data];
    }

    if (data.length === 0) {
        return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header];
            // Escape commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
}

module.exports = AnalyticsController;
