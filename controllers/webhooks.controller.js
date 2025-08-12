const crypto = require('crypto');
const { upsertLeadMeta, upsertLeadDataFromGraph } = require('../services/fb-leads.service');

const FB_APP_SECRET = process.env.FB_APP_SECRET || '';
const FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || '';

function verifySignature(req) {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature || !FB_APP_SECRET) return false;
    const body = req.rawBody ? req.rawBody : Buffer.from(JSON.stringify(req.body));
    const expected = 'sha256=' + crypto.createHmac('sha256', FB_APP_SECRET).update(body).digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
        return false;
    }
}

exports.facebookWebhookGet = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];
    if (mode === 'subscribe' && token === FB_VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
};

exports.facebookWebhookPost = async (req, res) => {
    if (!verifySignature(req)) {
        return res.sendStatus(403);
    }
    res.sendStatus(200);

    try {
        const body = req.body;
        if (!body || body.object !== 'page' || !Array.isArray(body.entry)) return;
        for (const entry of body.entry) {
            if (!Array.isArray(entry.changes)) continue;
            for (const change of entry.changes) {
                if (change.field !== 'leadgen') continue;
                const val = change.value || {};
                const leadgenId = val.leadgen_id || val.lead_id || val.leadgenId;
                if (!leadgenId) continue;

                const meta = {
                    platform_key: 'facebook',
                    source_lead_id: String(leadgenId),
                    page_id: val.page_id ? String(val.page_id) : null,
                    form_id: val.form_id ? String(val.form_id) : null,
                    ad_id: val.ad_id ? String(val.ad_id) : null,
                    campaign_id: val.campaign_id ? String(val.campaign_id) : null,
                    created_time: val.created_time ? new Date(val.created_time * 1000) : null,
                    status: 'received',
                };
                const leadMetaId = await upsertLeadMeta(meta);
                await upsertLeadDataFromGraph({ leadMetaId, leadgenId: String(leadgenId), pageId: meta.page_id, formId: meta.form_id });
            }
        }
    } catch (err) {
        console.error('Webhook processing error:', err.message);
    }
};


