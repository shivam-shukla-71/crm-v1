const router = require('express').Router();
const LeadAssignmentController = require('../controllers/lead-assignment.controller');
const { verifyToken, requireEntityAccess } = require('../middlewares/auth.middleware');

// All assignment routes require authentication and entity access
router.use(verifyToken);
router.use(requireEntityAccess);

// Lead assignment operations
router.post('/assign', LeadAssignmentController.assignLead);                    // Assign lead to user
router.post('/reassign', LeadAssignmentController.reassignLead);               // Reassign lead to different user
router.post('/unassign', LeadAssignmentController.unassignLead);               // Unassign lead
router.post('/bulk-assign', LeadAssignmentController.bulkAssignUnassignedLeads); // Bulk assign unassigned leads

// Assignment information endpoints
router.get('/lead/:leadId', LeadAssignmentController.getLeadAssignment);       // Get assignment for specific lead
router.get('/lead/:leadId/history', LeadAssignmentController.getAssignmentHistory); // Get assignment history for lead
router.get('/entity', LeadAssignmentController.getEntityAssignments);          // Get all assignments for entity
router.get('/user', LeadAssignmentController.getUserAssignments);              // Get current user's assignments

// Workload and statistics
router.get('/workload-stats', LeadAssignmentController.getWorkloadStats);      // Get workload distribution and stats

module.exports = router;
