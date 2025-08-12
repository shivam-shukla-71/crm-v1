const router = require('express').Router();
const { facebookWebhookGet, facebookWebhookPost } = require('../controllers/webhooks.controller');

// Facebook/Instagram Leadgen Webhooks
router.get('/facebook', facebookWebhookGet);
router.post('/facebook', facebookWebhookPost);

module.exports = router;


