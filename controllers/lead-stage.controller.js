const LeadStageModel = require('../models/lead-stage.model');
const LeadStatusModel = require('../models/lead-status.model');
const LeadModel = require('../models/lead.model');

class LeadStageController {
    // Change lead status (enter new stage)
    static async changeLeadStatus(req, res) {
        try {
            const { leadId, statusId, notes, nextActionRequired } = req.body;
            const entityId = req.user.entity_id;
            const userId = req.user.id;

            // Validate required fields
            if (!leadId || !statusId) {
                return res.status(400).json({
                    success: false,
                    message: 'Lead ID and status ID are required'
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

            // Get current status and new status
            const currentStatus = await LeadStatusModel.getStatusByName(lead.status);
            const newStatus = await LeadStatusModel.getStatusById(statusId);

            if (!newStatus) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status ID'
                });
            }

            // Validate status transition
            const transitionValidation = await LeadStatusModel.validateStatusTransition(
                lead.status,
                newStatus.name
            );

            if (!transitionValidation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: transitionValidation.message,
                    data: {
                        currentStatus: lead.status,
                        requestedStatus: newStatus.name,
                        allowedStatuses: transitionValidation.allowedStatuses
                    }
                });
            }

            // Enter new stage
            const stageId = await LeadStageModel.enterStage({
                entityId,
                leadId,
                statusId,
                userId,
                notes: notes || '',
                nextActionRequired: nextActionRequired || null
            });

            // Get updated stage information
            const currentStage = await LeadStageModel.getCurrentStage(leadId, entityId);

            return res.json({
                success: true,
                message: `Lead status changed from '${lead.status}' to '${newStatus.name}' successfully`,
                data: {
                    stage_id: stageId,
                    current_stage: currentStage,
                    previous_status: lead.status,
                    new_status: newStatus.name,
                    transition_valid: true
                }
            });

        } catch (error) {
            console.error('Error changing lead status:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while changing lead status'
            });
        }
    }

    // Get current stage for a lead
    static async getLeadCurrentStage(req, res) {
        try {
            const leadId = parseInt(req.params.leadId);
            const entityId = req.user.entity_id;

            if (isNaN(leadId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid lead ID'
                });
            }

            const currentStage = await LeadStageModel.getCurrentStage(leadId, entityId);

            if (!currentStage) {
                return res.json({
                    success: true,
                    data: null,
                    message: 'Lead is not currently in any stage'
                });
            }

            return res.json({
                success: true,
                data: currentStage
            });

        } catch (error) {
            console.error('Error fetching lead current stage:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching lead stage'
            });
        }
    }

    // Get stage history for a lead
    static async getLeadStageHistory(req, res) {
        try {
            const leadId = parseInt(req.params.leadId);
            const entityId = req.user.entity_id;

            if (isNaN(leadId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid lead ID'
                });
            }

            const stageHistory = await LeadStageModel.getStageHistory(leadId, entityId);

            return res.json({
                success: true,
                data: stageHistory
            });

        } catch (error) {
            console.error('Error fetching lead stage history:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching stage history'
            });
        }
    }

    // Get next possible statuses for a lead
    static async getNextPossibleStatuses(req, res) {
        try {
            const leadId = parseInt(req.params.leadId);
            const entityId = req.user.entity_id;

            if (isNaN(leadId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid lead ID'
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

            const nextStatuses = await LeadStatusModel.getNextPossibleStatuses(lead.status);

            return res.json({
                success: true,
                data: {
                    current_status: lead.status,
                    next_possible_statuses: nextStatuses
                }
            });

        } catch (error) {
            console.error('Error fetching next possible statuses:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching next possible statuses'
            });
        }
    }

    // Get all stages for entity with filters
    static async getEntityStages(req, res) {
        try {
            const entityId = req.user.entity_id;
            const filters = {
                status_id: req.query.status_id,
                user_id: req.query.user_id,
                lead_id: req.query.lead_id,
                date_from: req.query.date_from,
                date_to: req.query.date_to,
                active_only: req.query.active_only === 'true',
                limit: req.query.limit || 50,
                offset: req.query.offset || 0
            };

            const stages = await LeadStageModel.getStagesByEntity(entityId, filters);

            return res.json({
                success: true,
                data: stages,
                filters: filters,
                total: stages.length
            });

        } catch (error) {
            console.error('Error fetching entity stages:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching stages'
            });
        }
    }

    // Get stage performance metrics
    static async getStagePerformanceMetrics(req, res) {
        try {
            const entityId = req.user.entity_id;
            const { date_from, date_to } = req.query;

            const metrics = await LeadStageModel.getStagePerformanceMetrics(
                entityId,
                date_from,
                date_to
            );

            return res.json({
                success: true,
                data: metrics
            });

        } catch (error) {
            console.error('Error fetching stage performance metrics:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching performance metrics'
            });
        }
    }

    // Get user performance metrics
    static async getUserPerformanceMetrics(req, res) {
        try {
            const entityId = req.user.entity_id;
            const { user_id, date_from, date_to } = req.query;

            const metrics = await LeadStageModel.getUserPerformanceMetrics(
                entityId,
                user_id,
                date_from,
                date_to
            );

            return res.json({
                success: true,
                data: metrics
            });

        } catch (error) {
            console.error('Error fetching user performance metrics:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching user performance metrics'
            });
        }
    }

    // Get stage transition matrix
    static async getStageTransitionMatrix(req, res) {
        try {
            const entityId = req.user.entity_id;
            const { date_from, date_to } = req.query;

            const matrix = await LeadStageModel.getStageTransitionMatrix(
                entityId,
                date_from,
                date_to
            );

            return res.json({
                success: true,
                data: matrix
            });

        } catch (error) {
            console.error('Error fetching stage transition matrix:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching transition matrix'
            });
        }
    }

    // Get leads exceeding SLA
    static async getLeadsExceedingSLA(req, res) {
        try {
            const entityId = req.user.entity_id;
            const slaHours = parseInt(req.query.sla_hours) || 24;

            const leads = await LeadStageModel.getLeadsExceedingSLA(entityId, slaHours);

            return res.json({
                success: true,
                data: {
                    leads: leads,
                    sla_hours: slaHours,
                    total_exceeding: leads.length
                }
            });

        } catch (error) {
            console.error('Error fetching leads exceeding SLA:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching SLA violations'
            });
        }
    }

    // Get stage conversion rates
    static async getStageConversionRates(req, res) {
        try {
            const entityId = req.user.entity_id;
            const { date_from, date_to } = req.query;

            const rates = await LeadStageModel.getStageConversionRates(
                entityId,
                date_from,
                date_to
            );

            return res.json({
                success: true,
                data: rates
            });

        } catch (error) {
            console.error('Error fetching stage conversion rates:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching conversion rates'
            });
        }
    }

    // Update stage notes
    static async updateStageNotes(req, res) {
        try {
            const { stageId, notes, nextActionRequired } = req.body;
            const entityId = req.user.entity_id;

            if (!stageId) {
                return res.status(400).json({
                    success: false,
                    message: 'Stage ID is required'
                });
            }

            await LeadStageModel.updateStageNotes(stageId, entityId, notes, nextActionRequired);

            return res.json({
                success: true,
                message: 'Stage notes updated successfully'
            });

        } catch (error) {
            console.error('Error updating stage notes:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while updating stage notes'
            });
        }
    }

    // Get stage summary for dashboard
    static async getStageSummary(req, res) {
        try {
            const entityId = req.user.entity_id;

            const summary = await LeadStageModel.getStageSummary(entityId);

            return res.json({
                success: true,
                data: summary
            });

        } catch (error) {
            console.error('Error fetching stage summary:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching stage summary'
            });
        }
    }

    // Get recent stage changes
    static async getRecentStageChanges(req, res) {
        try {
            const entityId = req.user.entity_id;
            const limit = parseInt(req.query.limit) || 20;

            const changes = await LeadStageModel.getRecentStageChanges(entityId, limit);

            return res.json({
                success: true,
                data: changes,
                total: changes.length
            });

        } catch (error) {
            console.error('Error fetching recent stage changes:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching recent changes'
            });
        }
    }

    // Get status statistics
    static async getStatusStatistics(req, res) {
        try {
            const entityId = req.user.entity_id;
            const { date_from, date_to } = req.query;

            const statistics = await LeadStatusModel.getStatusStatistics(
                entityId,
                date_from,
                date_to
            );

            return res.json({
                success: true,
                data: statistics
            });

        } catch (error) {
            console.error('Error fetching status statistics:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching status statistics'
            });
        }
    }

    // Get status SLA compliance
    static async getStatusSLACompliance(req, res) {
        try {
            const entityId = req.user.entity_id;
            const slaHours = parseInt(req.query.sla_hours) || 24;

            const compliance = await LeadStatusModel.getStatusSLACompliance(entityId, slaHours);

            return res.json({
                success: true,
                data: {
                    compliance: compliance,
                    sla_hours: slaHours
                }
            });

        } catch (error) {
            console.error('Error fetching status SLA compliance:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching SLA compliance'
            });
        }
    }

    // Get status workflow efficiency
    static async getStatusWorkflowEfficiency(req, res) {
        try {
            const entityId = req.user.entity_id;
            const { date_from, date_to } = req.query;

            const efficiency = await LeadStatusModel.getStatusWorkflowEfficiency(
                entityId,
                date_from,
                date_to
            );

            return res.json({
                success: true,
                data: efficiency
            });

        } catch (error) {
            console.error('Error fetching status workflow efficiency:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching workflow efficiency'
            });
        }
    }

    // Get status bottleneck analysis
    static async getStatusBottleneckAnalysis(req, res) {
        try {
            const entityId = req.user.entity_id;
            const { date_from, date_to } = req.query;

            const bottlenecks = await LeadStatusModel.getStatusBottleneckAnalysis(
                entityId,
                date_from,
                date_to
            );

            return res.json({
                success: true,
                data: bottlenecks
            });

        } catch (error) {
            console.error('Error fetching status bottleneck analysis:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error while fetching bottleneck analysis'
            });
        }
    }
}

module.exports = LeadStageController;
