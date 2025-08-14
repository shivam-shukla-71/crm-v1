const router = require('express').Router();
const LeadActivityController = require('../controllers/lead-activity.controller');
const { verifyToken, requireEntityAccess } = require('../middlewares/auth.middleware');

// All activity routes require authentication and entity access
router.use(verifyToken);
router.use(requireEntityAccess);

// Activity logging and management
router.post('/log', LeadActivityController.logActivity);                           // Log new activity
router.put('/update-status', LeadActivityController.updateActivityStatus);          // Update activity status
router.put('/update-follow-up', LeadActivityController.updateFollowUpDate);        // Update follow-up date
router.put('/bulk-update-follow-ups', LeadActivityController.bulkUpdateFollowUpDates); // Bulk update follow-up dates

// Activity retrieval endpoints
router.get('/lead/:leadId', LeadActivityController.getLeadActivities);             // Get activities for specific lead
router.get('/lead/:leadId/timeline', LeadActivityController.getLeadActivityTimeline); // Get lead activity timeline
router.get('/entity', LeadActivityController.getEntityActivities);                 // Get all entity activities
router.get('/user', LeadActivityController.getUserActivities);                     // Get current user's activities

// Follow-up management endpoints
router.get('/follow-ups/pending', LeadActivityController.getPendingFollowUps);     // Get pending follow-ups
router.get('/follow-ups/overdue', LeadActivityController.getOverdueFollowUps);     // Get overdue follow-ups
router.get('/follow-ups/summary', LeadActivityController.getUpcomingFollowUpsSummary); // Get follow-ups summary

// Analytics and reporting endpoints
router.get('/statistics', LeadActivityController.getActivityStatistics);           // Get activity statistics
router.get('/user-performance', LeadActivityController.getUserActivityPerformance); // Get user performance
router.get('/priority-distribution', LeadActivityController.getPriorityDistribution); // Get priority distribution

// Dashboard endpoints
router.get('/recent', LeadActivityController.getRecentActivities);                 // Get recent activities
router.get('/summary', LeadActivityController.getActivitySummary);                 // Get activity summary

module.exports = router;
