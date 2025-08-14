const express = require('express');
const router = express.Router();
const ReportingController = require('../controllers/reporting.controller');
const { verifyToken, requireEntityAccess } = require('../middlewares/auth.middleware');

// Apply authentication and entity access middleware to all routes
router.use(verifyToken);
router.use(requireEntityAccess);

// Report Templates
router.post('/templates', ReportingController.createReportTemplate);
router.get('/templates', ReportingController.getReportTemplates);
router.get('/templates/:templateId', ReportingController.getReportTemplateById);
router.put('/templates/:templateId', ReportingController.updateReportTemplate);
router.delete('/templates/:templateId', ReportingController.deleteReportTemplate);

// Generate Reports
router.post('/templates/:templateId/generate', ReportingController.generateReportFromTemplate);
router.post('/generate-and-save', ReportingController.generateAndSaveReport);

// Generated Reports
router.post('/reports', ReportingController.saveGeneratedReport);
router.get('/reports', ReportingController.getGeneratedReports);
router.get('/reports/:reportId', ReportingController.getGeneratedReportById);
router.delete('/reports/:reportId', ReportingController.deleteGeneratedReport);

// Report Statistics
router.get('/statistics', ReportingController.getReportStatistics);

// Report Scheduling
router.post('/schedules', ReportingController.scheduleReport);
router.get('/schedules', ReportingController.getScheduledReports);
router.put('/schedules/:scheduleId', ReportingController.updateReportSchedule);
router.delete('/schedules/:scheduleId', ReportingController.deleteReportSchedule);

module.exports = router;
