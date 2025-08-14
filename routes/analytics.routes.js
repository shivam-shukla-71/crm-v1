const express = require('express');
const router = express.Router();
const AnalyticsController = require('../controllers/analytics.controller');
const { verifyToken, requireEntityAccess } = require('../middlewares/auth.middleware');

// Apply authentication and entity access middleware to all routes
router.use(verifyToken);
router.use(requireEntityAccess);

// Dashboard Summary
router.get('/dashboard', AnalyticsController.getDashboardSummary);

// Lead Analytics
router.get('/leads', AnalyticsController.getLeadAnalytics);

// Platform Performance Analytics
router.get('/platforms', AnalyticsController.getPlatformPerformance);

// User Performance Analytics
router.get('/users', AnalyticsController.getUserPerformance);

// Conversion Funnel Analytics
router.get('/funnel', AnalyticsController.getConversionFunnel);

// Time-based Analytics
router.get('/time-based', AnalyticsController.getTimeBasedAnalytics);

// Activity Analytics
router.get('/activities', AnalyticsController.getActivityAnalytics);

// SLA Compliance Analytics
router.get('/sla-compliance', AnalyticsController.getSLACompliance);

// Recent Activities
router.get('/recent-activities', AnalyticsController.getRecentActivities);

// Upcoming Follow-ups
router.get('/upcoming-follow-ups', AnalyticsController.getUpcomingFollowUps);

// Custom Report Builder
router.post('/custom-report', AnalyticsController.generateCustomReport);

// Export Report Data
router.post('/export', AnalyticsController.exportReportData);

module.exports = router;
