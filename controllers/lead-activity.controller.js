const LeadActivityModel = require('../models/lead-activity.model');
const LeadModel = require('../models/lead.model');

class LeadActivityController {
    // Log a new activity for a lead
    static async logActivity(req, res) {
        try {
            const { leadId, activityType, description, nextFollowUpDate, priority, status } = req.body;
            const entityId = req.user.entity_id;
            const userId = req.user.id;

            // Validate required fields
            if (!leadId || !activityType || !description) {
                return res.status(400).json({
                    success: false,
                    message: 'Lead ID, activity type, and description are required'
                });
            }

            // Verify lead exists and belongs to user's entity
            const lead = await LeadModel.getLeadById(leadId, entityId);
            if (!lead) {
                return res.status(404).json({
                    success: false,
                    message: 'Lead not found or access denied'
                });
            }

            // Validate activity type
            const validActivityTypes = ['call', 'email', 'meeting', 'note', 'status_change', 'assignment', 'follow_up'];
            if (!validActivityTypes.includes(activityType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid activity type',
                    data: { validTypes: validActivityTypes }
                });
            }

            // Validate priority
            const validPriorities = ['low', 'medium', 'high', 'urgent'];
            if (priority && !validPriorities.includes(priority)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid priority level',
                    data: { validPriorities: validPriorities }
                });
            }

            // Log the activity
            const activityId = await LeadActivityModel.logActivity({
                entityId,
                leadId,
                userId,
                activityType,
                description,
                nextFollowUpDate: nextFollowUpDate || null,
                priority: priority || 'medium',
                status: status || 'pending'
            });

            // Get the created activity
            const activities = await LeadActivityModel.getActivitiesByLead(leadId, entityId, { limit: 1 });
            const newActivity = activities[0];

            return res.json({
                success: true,
                message: 'Activity logged successfully',
                data: {
                    activity_id: activityId,
                    activity: newActivity
                }
            });

        } catch (error) {
            console.error('Error logging activity:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while logging activity'
            });
        }
    }

    // Get all activities for a lead
    static async getLeadActivities(req, res) {
        try {
            const leadId = parseInt(req.params.leadId);
            const entityId = req.user.entity_id;
            const filters = {
                activity_type: req.query.activity_type,
                user_id: req.query.user_id,
                priority: req.query.priority,
                status: req.query.status,
                date_from: req.query.date_from,
                date_to: req.query.date_to,
                limit: req.query.limit || 50,
                offset: req.query.offset || 0
            };

            if (isNaN(leadId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid lead ID'
                });
            }

            const activities = await LeadActivityModel.getActivitiesByLead(leadId, entityId, filters);

            return res.json({
                success: true,
                data: activities,
                filters: filters,
                total: activities.length
            });

        } catch (error) {
            console.error('Error fetching lead activities:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching activities'
            });
        }
    }

    // Get all activities for entity
    static async getEntityActivities(req, res) {
        try {
            const entityId = req.user.entity_id;
            const filters = {
                activity_type: req.query.activity_type,
                user_id: req.query.user_id,
                lead_id: req.query.lead_id,
                priority: req.query.priority,
                status: req.query.status,
                date_from: req.query.date_from,
                date_to: req.query.date_to,
                limit: req.query.limit || 50,
                offset: req.query.offset || 0
            };

            const activities = await LeadActivityModel.getActivitiesByEntity(entityId, filters);

            return res.json({
                success: true,
                data: activities,
                filters: filters,
                total: activities.length
            });

        } catch (error) {
            console.error('Error fetching entity activities:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching activities'
            });
        }
    }

    // Get user's activities
    static async getUserActivities(req, res) {
        try {
            const entityId = req.user.entity_id;
            const userId = req.user.id;
            const filters = {
                activity_type: req.query.activity_type,
                priority: req.query.priority,
                status: req.query.status,
                date_from: req.query.date_from,
                date_to: req.query.date_to,
                limit: req.query.limit || 50,
                offset: req.query.offset || 0
            };

            const activities = await LeadActivityModel.getUserActivities(userId, entityId, filters);

            return res.json({
                success: true,
                data: activities,
                filters: filters,
                total: activities.length
            });

        } catch (error) {
            console.error('Error fetching user activities:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching user activities'
            });
        }
    }

    // Get pending follow-ups
    static async getPendingFollowUps(req, res) {
        try {
            const entityId = req.user.entity_id;
            const userId = req.query.user_id || null;
            const filters = {
                priority: req.query.priority,
                date_from: req.query.date_from,
                date_to: req.query.date_to,
                limit: req.query.limit || 50,
                offset: req.query.offset || 0
            };

            const followUps = await LeadActivityModel.getPendingFollowUps(entityId, userId, filters);

            return res.json({
                success: true,
                data: followUps,
                filters: filters,
                total: followUps.length
            });

        } catch (error) {
            console.error('Error fetching pending follow-ups:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching follow-ups'
            });
        }
    }

    // Get overdue follow-ups
    static async getOverdueFollowUps(req, res) {
        try {
            const entityId = req.user.entity_id;
            const userId = req.query.user_id || null;

            const overdueFollowUps = await LeadActivityModel.getOverdueFollowUps(entityId, userId);

            return res.json({
                success: true,
                data: overdueFollowUps,
                total: overdueFollowUps.length
            });

        } catch (error) {
            console.error('Error fetching overdue follow-ups:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching overdue follow-ups'
            });
        }
    }

    // Update activity status
    static async updateActivityStatus(req, res) {
        try {
            const { activityId, status, notes } = req.body;
            const entityId = req.user.entity_id;

            if (!activityId || !status) {
                return res.status(400).json({
                    success: false,
                    message: 'Activity ID and status are required'
                });
            }

            // Validate status
            const validStatuses = ['pending', 'completed', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status',
                    data: { validStatuses: validStatuses }
                });
            }

            await LeadActivityModel.updateActivityStatus(activityId, entityId, status, notes);

            return res.json({
                success: true,
                message: 'Activity status updated successfully'
            });

        } catch (error) {
            console.error('Error updating activity status:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while updating activity status'
            });
        }
    }

    // Update follow-up date
    static async updateFollowUpDate(req, res) {
        try {
            const { activityId, nextFollowUpDate, notes } = req.body;
            const entityId = req.user.entity_id;

            if (!activityId || !nextFollowUpDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Activity ID and next follow-up date are required'
                });
            }

            // Validate date format
            const date = new Date(nextFollowUpDate);
            if (isNaN(date.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date format'
                });
            }

            await LeadActivityModel.updateFollowUpDate(activityId, entityId, nextFollowUpDate, notes);

            return res.json({
                success: true,
                message: 'Follow-up date updated successfully'
            });

        } catch (error) {
            console.error('Error updating follow-up date:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while updating follow-up date'
            });
        }
    }

    // Bulk update follow-up dates
    static async bulkUpdateFollowUpDates(req, res) {
        try {
            const { activityIds, nextFollowUpDate, notes } = req.body;
            const entityId = req.user.entity_id;
            const userId = req.user.id;

            if (!activityIds || !Array.isArray(activityIds) || activityIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Activity IDs array is required and must not be empty'
                });
            }

            if (!nextFollowUpDate) {
                return res.status(400).json({
                    success: false,
                    message: 'Next follow-up date is required'
                });
            }

            // Validate date format
            const date = new Date(nextFollowUpDate);
            if (isNaN(date.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date format'
                });
            }

            const updatedCount = await LeadActivityModel.bulkUpdateFollowUpDates(
                entityId,
                activityIds,
                nextFollowUpDate,
                userId
            );

            return res.json({
                success: true,
                message: `Successfully updated ${updatedCount} follow-up dates`,
                data: {
                    updated_count: updatedCount,
                    next_follow_up_date: nextFollowUpDate
                }
            });

        } catch (error) {
            console.error('Error bulk updating follow-up dates:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while bulk updating follow-up dates'
            });
        }
    }

    // Get activity statistics
    static async getActivityStatistics(req, res) {
        try {
            const entityId = req.user.entity_id;
            const { date_from, date_to } = req.query;

            const statistics = await LeadActivityModel.getActivityStatistics(entityId, date_from, date_to);

            return res.json({
                success: true,
                data: statistics
            });

        } catch (error) {
            console.error('Error fetching activity statistics:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching activity statistics'
            });
        }
    }

    // Get user activity performance
    static async getUserActivityPerformance(req, res) {
        try {
            const entityId = req.user.entity_id;
            const { user_id, date_from, date_to } = req.query;

            const performance = await LeadActivityModel.getUserActivityPerformance(
                entityId,
                user_id,
                date_from,
                date_to
            );

            return res.json({
                success: true,
                data: performance
            });

        } catch (error) {
            console.error('Error fetching user activity performance:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching user performance'
            });
        }
    }

    // Get priority distribution
    static async getPriorityDistribution(req, res) {
        try {
            const entityId = req.user.entity_id;
            const { date_from, date_to } = req.query;

            const distribution = await LeadActivityModel.getPriorityDistribution(entityId, date_from, date_to);

            return res.json({
                success: true,
                data: distribution
            });

        } catch (error) {
            console.error('Error fetching priority distribution:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching priority distribution'
            });
        }
    }

    // Get lead activity timeline
    static async getLeadActivityTimeline(req, res) {
        try {
            const leadId = parseInt(req.params.leadId);
            const entityId = req.user.entity_id;
            const limit = parseInt(req.query.limit) || 50;

            if (isNaN(leadId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid lead ID'
                });
            }

            const timeline = await LeadActivityModel.getLeadActivityTimeline(leadId, entityId, limit);

            return res.json({
                success: true,
                data: timeline,
                total: timeline.length
            });

        } catch (error) {
            console.error('Error fetching lead activity timeline:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching activity timeline'
            });
        }
    }

    // Get recent activities for dashboard
    static async getRecentActivities(req, res) {
        try {
            const entityId = req.user.entity_id;
            const limit = parseInt(req.query.limit) || 20;

            const activities = await LeadActivityModel.getRecentActivities(entityId, limit);

            return res.json({
                success: true,
                data: activities,
                total: activities.length
            });

        } catch (error) {
            console.error('Error fetching recent activities:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching recent activities'
            });
        }
    }

    // Get upcoming follow-ups summary
    static async getUpcomingFollowUpsSummary(req, res) {
        try {
            const entityId = req.user.entity_id;

            const summary = await LeadActivityModel.getUpcomingFollowUpsSummary(entityId);

            return res.json({
                success: true,
                data: summary
            });

        } catch (error) {
            console.error('Error fetching upcoming follow-ups summary:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching follow-ups summary'
            });
        }
    }

    // Get activity summary for dashboard
    static async getActivitySummary(req, res) {
        try {
            const entityId = req.user.entity_id;

            const summary = await LeadActivityModel.getActivitySummary(entityId);

            return res.json({
                success: true,
                data: summary
            });

        } catch (error) {
            console.error('Error fetching activity summary:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching activity summary'
            });
        }
    }
}

module.exports = LeadActivityController;
