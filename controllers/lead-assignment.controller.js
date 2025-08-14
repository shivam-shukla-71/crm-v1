const LeadAssignmentModel = require('../models/lead-assignment.model');
const LeadModel = require('../models/lead.model');

class LeadAssignmentController {
    // Assign a lead to a user
    static async assignLead(req, res) {
        try {
            const { leadId, assignedUserId, reason, notes } = req.body;
            const entityId = req.user.entity_id;
            const assignedByUserId = req.user.id;

            // Validate required fields
            if (!leadId || !assignedUserId) {
                return res.status(400).json({
                    success: false,
                    message: 'Lead ID and assigned user ID are required'
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

            // Check if user exists and belongs to the same entity
            const { executeQuery } = require('../config/database');
            const users = await executeQuery(
                'SELECT id, first_name, last_name FROM users WHERE id = ? AND entity_id = ? AND is_active = TRUE',
                [assignedUserId, entityId]
            );

            if (users.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Assigned user not found or not active in this entity'
                });
            }

            // Perform assignment
            await LeadAssignmentModel.assignLead({
                entityId,
                leadId,
                assignedUserId,
                assignedByUserId,
                reason: reason || 'Manual assignment',
                notes: notes || ''
            });

            // Get updated assignment details
            const assignment = await LeadAssignmentModel.getAssignmentByLeadId(leadId, entityId);

            return res.json({
                success: true,
                message: 'Lead assigned successfully',
                data: {
                    assignment,
                    assigned_user: users[0]
                }
            });

        } catch (error) {
            console.error('Error assigning lead:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while assigning lead'
            });
        }
    }

    // Reassign a lead to a different user
    static async reassignLead(req, res) {
        try {
            const { leadId, newAssignedUserId, reason, notes } = req.body;
            const entityId = req.user.entity_id;
            const reassignedByUserId = req.user.id;

            // Validate required fields
            if (!leadId || !newAssignedUserId) {
                return res.status(400).json({
                    success: false,
                    message: 'Lead ID and new assigned user ID are required'
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

            // Check if new user exists and belongs to the same entity
            const { executeQuery } = require('../config/database');
            const users = await executeQuery(
                'SELECT id, first_name, last_name FROM users WHERE id = ? AND entity_id = ? AND is_active = TRUE',
                [newAssignedUserId, entityId]
            );

            if (users.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'New assigned user not found or not active in this entity'
                });
            }

            // Perform reassignment
            await LeadAssignmentModel.assignLead({
                entityId,
                leadId,
                assignedUserId: newAssignedUserId,
                assignedByUserId: reassignedByUserId,
                reason: reason || 'Lead reassignment',
                notes: notes || ''
            });

            // Get updated assignment details
            const assignment = await LeadAssignmentModel.getAssignmentByLeadId(leadId, entityId);

            return res.json({
                success: true,
                message: 'Lead reassigned successfully',
                data: {
                    assignment,
                    new_assigned_user: users[0]
                }
            });

        } catch (error) {
            console.error('Error reassigning lead:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while reassigning lead'
            });
        }
    }

    // Unassign a lead
    static async unassignLead(req, res) {
        try {
            const { leadId, reason } = req.body;
            const entityId = req.user.entity_id;
            const unassignedByUserId = req.user.id;

            // Validate required fields
            if (!leadId) {
                return res.status(400).json({
                    success: false,
                    message: 'Lead ID is required'
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

            // Check if lead is currently assigned
            if (!lead.assigned_user_id) {
                return res.status(400).json({
                    success: false,
                    message: 'Lead is not currently assigned'
                });
            }

            // Perform unassignment
            await LeadAssignmentModel.unassignLead(leadId, entityId, unassignedByUserId, reason || 'Lead unassigned');

            return res.json({
                success: true,
                message: 'Lead unassigned successfully'
            });

        } catch (error) {
            console.error('Error unassigning lead:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while unassigning lead'
            });
        }
    }

    // Get assignment details for a lead
    static async getLeadAssignment(req, res) {
        try {
            const leadId = parseInt(req.params.leadId);
            const entityId = req.user.entity_id;

            if (isNaN(leadId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid lead ID'
                });
            }

            const assignment = await LeadAssignmentModel.getAssignmentByLeadId(leadId, entityId);

            if (!assignment) {
                return res.json({
                    success: true,
                    data: null,
                    message: 'Lead is not currently assigned'
                });
            }

            return res.json({
                success: true,
                data: assignment
            });

        } catch (error) {
            console.error('Error fetching lead assignment:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching lead assignment'
            });
        }
    }

    // Get assignment history for a lead
    static async getAssignmentHistory(req, res) {
        try {
            const leadId = parseInt(req.params.leadId);
            const entityId = req.user.entity_id;

            if (isNaN(leadId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid lead ID'
                });
            }

            const history = await LeadAssignmentModel.getAssignmentHistory(leadId, entityId);

            return res.json({
                success: true,
                data: history
            });

        } catch (error) {
            console.error('Error fetching assignment history:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching assignment history'
            });
        }
    }

    // Get all assignments for the entity
    static async getEntityAssignments(req, res) {
        try {
            const entityId = req.user.entity_id;
            const filters = {
                assigned_user_id: req.query.assigned_user_id,
                lead_status: req.query.lead_status,
                date_from: req.query.date_from,
                date_to: req.query.date_to,
                limit: req.query.limit || 50,
                offset: req.query.offset || 0
            };

            const assignments = await LeadAssignmentModel.getAssignmentsByEntity(entityId, filters);

            return res.json({
                success: true,
                data: assignments,
                filters: filters,
                total: assignments.length
            });

        } catch (error) {
            console.error('Error fetching entity assignments:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching assignments'
            });
        }
    }

    // Get user's assignments
    static async getUserAssignments(req, res) {
        try {
            const entityId = req.user.entity_id;
            const userId = req.user.id;
            const limit = parseInt(req.query.limit) || 50;

            const assignments = await LeadAssignmentModel.getAssignmentsByUser(userId, entityId, limit);

            return res.json({
                success: true,
                data: assignments,
                total: assignments.length
            });

        } catch (error) {
            console.error('Error fetching user assignments:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching user assignments'
            });
        }
    }

    // Bulk assign unassigned leads
    static async bulkAssignUnassignedLeads(req, res) {
        try {
            const entityId = req.user.entity_id;
            const assignedByUserId = req.user.id;
            const { reason, max_leads_per_user } = req.body;

            // Check if user has permission to bulk assign (manager or admin)
            if (!['admin', 'manager'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions for bulk assignment'
                });
            }

            // Get unassigned leads
            const unassignedLeads = await LeadModel.getUnassignedLeads(entityId, 1000);

            if (unassignedLeads.length === 0) {
                return res.json({
                    success: true,
                    message: 'No unassigned leads found',
                    data: []
                });
            }

            // Get workload distribution to respect max leads per user
            const workloadDistribution = await LeadAssignmentModel.getWorkloadDistribution(entityId);
            const maxLeadsPerUser = max_leads_per_user || 20;

            // Filter leads based on user capacity
            const availableLeads = [];
            for (const lead of unassignedLeads) {
                // Find user with lowest workload
                const userWithLowestWorkload = workloadDistribution
                    .filter(user => user.assigned_leads < maxLeadsPerUser)
                    .sort((a, b) => a.assigned_leads - b.assigned_leads)[0];

                if (userWithLowestWorkload) {
                    availableLeads.push({
                        leadId: lead.id,
                        assignedUserId: userWithLowestWorkload.id
                    });
                    // Update workload count
                    userWithLowestWorkload.assigned_leads++;
                }
            }

            // Perform bulk assignment
            const assignments = [];
            for (const assignment of availableLeads) {
                await LeadAssignmentModel.assignLead({
                    entityId,
                    leadId: assignment.leadId,
                    assignedUserId: assignment.assignedUserId,
                    assignedByUserId,
                    reason: reason || 'Bulk assignment of unassigned leads',
                    notes: 'Automated bulk assignment'
                });

                assignments.push(assignment);
            }

            return res.json({
                success: true,
                message: `Successfully assigned ${assignments.length} leads`,
                data: {
                    total_assigned: assignments.length,
                    assignments: assignments
                }
            });

        } catch (error) {
            console.error('Error in bulk assignment:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while performing bulk assignment'
            });
        }
    }

    // Get workload statistics
    static async getWorkloadStats(req, res) {
        try {
            const entityId = req.user.entity_id;

            const [
                unassignedCount,
                workloadDistribution
            ] = await Promise.all([
                LeadAssignmentModel.getUnassignedLeadsCount(entityId),
                LeadAssignmentModel.getWorkloadDistribution(entityId)
            ]);

            return res.json({
                success: true,
                data: {
                    unassigned_leads: unassignedCount,
                    workload_distribution: workloadDistribution,
                    total_users: workloadDistribution.length,
                    average_leads_per_user: workloadDistribution.length > 0
                        ? Math.round(workloadDistribution.reduce((sum, user) => sum + user.assigned_leads, 0) / workloadDistribution.length)
                        : 0
                }
            });

        } catch (error) {
            console.error('Error fetching workload stats:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching workload statistics'
            });
        }
    }
}

module.exports = LeadAssignmentController;
