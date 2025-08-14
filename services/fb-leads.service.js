const axios = require('axios');
const crypto = require('crypto');
const { executeQuery } = require('../config/database');
const LeadModel = require('../models/lead.model');

const FB_GRAPH_BASE = 'https://graph.facebook.com/v18.0';
const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN || '';
const FB_APP_SECRET = process.env.FB_APP_SECRET || '';
    
function buildAppSecretProof(token) {
    if (!token || !FB_APP_SECRET) return null;
    return crypto.createHmac('sha256', FB_APP_SECRET).update(token).digest('hex');
}

exports.upsertLeadMeta = async (meta) => LeadModel.upsertLeadMeta(meta);

exports.upsertLeadDataFromGraph = async ({ leadMetaId, leadgenId, pageId, formId, entityId }) => {
    if (!leadMetaId || !leadgenId || !entityId) return;

    const params = new URLSearchParams();
    params.append('fields', 'created_time,ad_id,adset_id,campaign_id,form_id,field_data');
    params.append('access_token', FB_PAGE_ACCESS_TOKEN);
    const proof = buildAppSecretProof(FB_PAGE_ACCESS_TOKEN);
    if (proof) params.append('appsecret_proof', proof);

    const url = `${FB_GRAPH_BASE}/${encodeURIComponent(leadgenId)}?${params.toString()}`;
    const { data } = await axios.get(url, { timeout: 10000 });

    const fieldArray = Array.isArray(data.field_data) ? data.field_data : [];
    const normalized = normalizeFieldData(fieldArray);

    const leadData = await LeadModel.upsertLeadData(leadMetaId, {
        entity_id: entityId,
        email: normalized.email,
        phone: normalized.phone,
        first_name: normalized.first_name,
        last_name: normalized.last_name,
        full_name: normalized.full_name,
        raw_field_data: fieldArray,
        consent_time: normalized.consent_time,
        platform_key: 'facebook',
        source_page_id: pageId || null,
        source_page_name: null,
        status: 'new',
        assigned_user_id: null,
        assigned_at: null,
    });

    // Mark as processed in lead_meta
    await executeQuery('UPDATE lead_meta SET processing_status = ? WHERE id = ?', ['processed', leadMetaId]);

    // Return the lead ID from lead_data (this is the main lead identifier)
    return leadData.insertId || leadData.affectedRows;
};

function normalizeFieldData(fieldArray) {
    const obj = {};
    for (const item of fieldArray) {
        const name = (item.name || '').toLowerCase();
        const value = Array.isArray(item.values) ? item.values[0] : item.value || item.values || null;
        if (!name) continue;
        obj[name] = value;
    }
    // Map variants
    const email = obj.email || obj['work_email'] || obj['business_email'] || null;
    const phone = obj.phone || obj['phone_number'] || obj['mobile_phone'] || null;
    let firstName = obj['first_name'] || null;
    let lastName = obj['last_name'] || null;
    let fullName = obj['full_name'] || obj['name'] || null;
    if (!firstName && !lastName && fullName) {
        const parts = String(fullName).trim().split(/\s+/);
        firstName = parts[0] || null;
        lastName = parts.length > 1 ? parts.slice(1).join(' ') : null;
    } else if (!fullName && (firstName || lastName)) {
        fullName = [firstName, lastName].filter(Boolean).join(' ');
    }

    // Consent time if present
    const consent_time = obj['consent_time'] ? new Date(obj['consent_time']) : null;

    return { email, phone, first_name: firstName, last_name: lastName, full_name: fullName, consent_time };
}


