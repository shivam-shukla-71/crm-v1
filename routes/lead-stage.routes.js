const router = require('express').Router();
const LeadStageController = require('../controllers/lead-stage.controller');
const { verifyToken, requireEntityAccess } = require('../middlewares/auth.middleware');

// All stage routes require authentication and entity access
router.use(verifyToken);
router.use(requireEntityAccess);

// Lead stage operations
router.post('/change-status', LeadStageController.changeLeadStatus);                    // Change lead status
router.put('/update-notes', LeadStageController.updateStageNotes);                     // Update stage notes

// Stage information endpoints
router.get('/lead/:leadId/current', LeadStageController.getLeadCurrentStage);          // Get current stage for lead
router.get('/lead/:leadId/history', LeadStageController.getLeadStageHistory);         // Get stage history for lead
router.get('/lead/:leadId/next-statuses', LeadStageController.getNextPossibleStatuses); // Get next possible statuses
router.get('/entity', LeadStageController.getEntityStages);                           // Get all stages for entity

// Performance and analytics endpoints
router.get('/performance-metrics', LeadStageController.getStagePerformanceMetrics);    // Get stage performance metrics
router.get('/user-performance', LeadStageController.getUserPerformanceMetrics);        // Get user performance metrics
router.get('/transition-matrix', LeadStageController.getStageTransitionMatrix);        // Get stage transition matrix
router.get('/sla-violations', LeadStageController.getLeadsExceedingSLA);              // Get leads exceeding SLA
router.get('/conversion-rates', LeadStageController.getStageConversionRates);         // Get stage conversion rates

// Dashboard and summary endpoints
router.get('/summary', LeadStageController.getStageSummary);                          // Get stage summary for dashboard
router.get('/recent-changes', LeadStageController.getRecentStageChanges);             // Get recent stage changes
router.get('/status-statistics', LeadStageController.getStatusStatistics);            // Get status statistics
router.get('/sla-compliance', LeadStageController.getStatusSLACompliance);            // Get SLA compliance rates
router.get('/workflow-efficiency', LeadStageController.getStatusWorkflowEfficiency);  // Get workflow efficiency
router.get('/bottleneck-analysis', LeadStageController.getStatusBottleneckAnalysis);  // Get bottleneck analysis

module.exports = router;
