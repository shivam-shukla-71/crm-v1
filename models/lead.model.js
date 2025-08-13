const { executeQuery } = require('../config/database');

class LeadModel {
    static async upsertLeadMeta(meta) {
        const insertQuery = `
      INSERT INTO lead_meta (platform_key, source_lead_id, page_id, form_id, ad_id, campaign_id, created_time, status, page_url, utm_source, utm_medium, utm_campaign, utm_term, utm_content)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE page_id = VALUES(page_id), form_id = VALUES(form_id), ad_id = VALUES(ad_id), campaign_id = VALUES(campaign_id), created_time = COALESCE(lead_meta.created_time, VALUES(created_time)), status = VALUES(status), page_url = VALUES(page_url), utm_source = VALUES(utm_source), utm_medium = VALUES(utm_medium), utm_campaign = VALUES(utm_campaign), utm_term = VALUES(utm_term), utm_content = VALUES(utm_content)
    `;
        const params = [
            meta.platform_key,
            meta.source_lead_id,
            meta.page_id,
            meta.form_id,
            meta.ad_id,
            meta.campaign_id,
            meta.created_time || null,
            meta.status || 'received',
            meta.page_url || null,
            meta.utm_source || null,
            meta.utm_medium || null,
            meta.utm_campaign || null,
            meta.utm_term || null,
            meta.utm_content || null,
        ];
        const result = await executeQuery(insertQuery, params);
        if (result.insertId) return result.insertId;
        const row = await executeQuery('SELECT id FROM lead_meta WHERE platform_key = ? AND source_lead_id = ? LIMIT 1', [meta.platform_key, meta.source_lead_id]);
        return row[0]?.id;
    }

    static async upsertLeadData(leadMetaId, data) {
        const insertQuery = `
      INSERT INTO lead_data (lead_meta_id, email, phone, first_name, last_name, full_name, raw_field_data, consent_time, platform_key, source_page_id, source_page_name)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE email = VALUES(email), phone = VALUES(phone), first_name = VALUES(first_name), last_name = VALUES(last_name), full_name = VALUES(full_name), raw_field_data = VALUES(raw_field_data), consent_time = VALUES(consent_time), platform_key = VALUES(platform_key), source_page_id = VALUES(source_page_id), source_page_name = VALUES(source_page_name)
    `;
        const params = [
            leadMetaId,
            data.email || null,
            data.phone || null,
            data.first_name || null,
            data.last_name || null,
            data.full_name || null,
            JSON.stringify(data.raw_field_data || {}),
            data.consent_time || null,
            data.platform_key,
            data.source_page_id || null,
            data.source_page_name || null,
        ];
        return executeQuery(insertQuery, params);
    }
}

module.exports = LeadModel;


