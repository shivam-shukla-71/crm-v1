const router = require('express').Router();
const LeadController = require('../controllers/lead.controller');
const { verifyToken, requireEntityAccess } = require('../middlewares/auth.middleware');

// All lead routes require authentication and entity access
router.use(verifyToken);
router.use(requireEntityAccess);

// Lead CRUD operations
router.get('/', LeadController.getLeads);                           // Get all leads (entity-scoped)
router.get('/counts', LeadController.getLeadCountByStatus);         // Get lead counts by status
router.get('/unassigned', LeadController.getUnassignedLeads);       // Get unassigned leads
router.get('/my-leads', LeadController.getMyLeads);                 // Get user's assigned leads
router.get('/pipeline', LeadController.getPipeline);                // Get pipeline view

// Individual lead operations
router.get('/:id', LeadController.getLeadById);                     // Get lead by ID
router.put('/:id', LeadController.updateLead);                     // Update lead basic info

module.exports = router;
