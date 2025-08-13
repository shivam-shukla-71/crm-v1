const router = require('express').Router();
const { facebookWebhookGet, facebookWebhookPost, websiteWebhookPost } = require('../controllers/webhooks.controller');

// Facebook/Instagram Leadgen Webhooks
router.get('/facebook', facebookWebhookGet);
router.post('/facebook', facebookWebhookPost);

// Website Landing Page Lead Webhooks
router.post('/website', websiteWebhookPost);

module.exports = router;


