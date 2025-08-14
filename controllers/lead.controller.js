const LeadModel = require('../models/lead.model');

class LeadController {
    // Get all leads for user's entity with optional filters
    static async getLeads(req, res) {
        try {
            const entityId = req.user.entity_id;
            const filters = {
                status: req.query.status,
                platform_key: req.query.platform,
                assigned_user_id: req.query.assigned_user_id,
                search: req.query.search,
                limit: req.query.limit || 50,
                offset: req.query.offset || 0
            };

            const leads = await LeadModel.getLeadsByEntity(entityId, filters);

            return res.json({
                success: true,
                data: leads,
                filters: filters,
                total: leads.length
            });
        } catch (error) {
            console.error('Error fetching leads:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching leads'
            });
        }
    }

    // Get lead by ID (entity-checked)
    static async getLeadById(req, res) {
        try {
            const leadId = parseInt(req.params.id);
            const entityId = req.user.entity_id;

            if (isNaN(leadId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid lead ID'
                });
            }

            const lead = await LeadModel.getLeadById(leadId, entityId);

            if (!lead) {
                return res.status(404).json({
                    success: false,
                    message: 'Lead not found or access denied'
                });
            }

            return res.json({
                success: true,
                data: lead
            });
        } catch (error) {
            console.error('Error fetching lead:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching lead'
            });
        }
    }

    // Update lead basic information
    static async updateLead(req, res) {
        try {
            const leadId = parseInt(req.params.id);
            const entityId = req.user.entity_id;
            const updateData = req.body;

            if (isNaN(leadId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid lead ID'
                });
            }

            // Validate allowed fields for update
            const allowedFields = ['first_name', 'last_name', 'full_name', 'phone', 'email'];
            const fieldsToUpdate = {};

            for (const [key, value] of Object.entries(updateData)) {
                if (allowedFields.includes(key) && value !== undefined) {
                    fieldsToUpdate[key] = value;
                }
            }

            if (Object.keys(fieldsToUpdate).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No valid fields to update'
                });
            }

            // Verify lead exists and belongs to user's entity
            const existingLead = await LeadModel.getLeadById(leadId, entityId);
            if (!existingLead) {
                return res.status(404).json({
                    success: false,
                    message: 'Lead not found or access denied'
                });
            }

            // Update lead data
            const updateQuery = `
                UPDATE lead_data 
                SET ${Object.keys(fieldsToUpdate).map(field => `${field} = ?`).join(', ')}, updated_at = NOW()
                WHERE id = ? AND entity_id = ?
            `;

            const { executeQuery } = require('../config/database');
            const params = [...Object.values(fieldsToUpdate), leadId, entityId];
            await executeQuery(updateQuery, params);

            // Get updated lead
            const updatedLead = await LeadModel.getLeadById(leadId, entityId);

            return res.json({
                success: true,
                message: 'Lead updated successfully',
                data: updatedLead
            });
        } catch (error) {
            console.error('Error updating lead:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while updating lead'
            });
        }
    }

    // Get lead count by status for user's entity
    static async getLeadCountByStatus(req, res) {
        try {
            const entityId = req.user.entity_id;
            const counts = await LeadModel.getLeadCountByStatus(entityId);

            return res.json({
                success: true,
                data: counts
            });
        } catch (error) {
            console.error('Error fetching lead counts:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching lead counts'
            });
        }
    }

    // Get unassigned leads for user's entity
    static async getUnassignedLeads(req, res) {
        try {
            const entityId = req.user.entity_id;
            const limit = parseInt(req.query.limit) || 50;

            const leads = await LeadModel.getUnassignedLeads(entityId, limit);

            return res.json({
                success: true,
                data: leads,
                total: leads.length
            });
        } catch (error) {
            console.error('Error fetching unassigned leads:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching unassigned leads'
            });
        }
    }

    // Get leads assigned to current user
    static async getMyLeads(req, res) {
        try {
            const entityId = req.user.entity_id;
            const userId = req.user.id;
            const limit = parseInt(req.query.limit) || 50;

            const leads = await LeadModel.getLeadsByUser(userId, entityId, limit);

            return res.json({
                success: true,
                data: leads,
                total: leads.length
            });
        } catch (error) {
            console.error('Error fetching user leads:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching user leads'
            });
        }
    }

    // Get pipeline view (leads grouped by status)
    static async getPipeline(req, res) {
        try {
            const entityId = req.user.entity_id;

            // Get all leads with status grouping
            const leads = await LeadModel.getLeadsByEntity(entityId, { limit: 1000 });

            // Group leads by status
            const pipeline = {};
            leads.forEach(lead => {
                if (!pipeline[lead.status]) {
                    pipeline[lead.status] = [];
                }
                pipeline[lead.status].push(lead);
            });

            // Get status counts
            const statusCounts = await LeadModel.getLeadCountByStatus(entityId);

            return res.json({
                success: true,
                data: {
                    pipeline: pipeline,
                    statusCounts: statusCounts
                }
            });
        } catch (error) {
            console.error('Error fetching pipeline:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching pipeline'
            });
        }
    }
}

module.exports = LeadController;
