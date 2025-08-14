const { executeQuery } = require('../config/database');

class LeadModel {
    static async upsertLeadMeta(meta) {
        const insertQuery = `
      INSERT INTO lead_meta (entity_id, platform_key, source_lead_id, page_id, form_id, ad_id, campaign_id, created_time, processing_status, page_url, utm_source, utm_medium, utm_campaign, utm_term, utm_content)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE page_id = VALUES(page_id), form_id = VALUES(form_id), ad_id = VALUES(ad_id), campaign_id = VALUES(campaign_id), created_time = COALESCE(lead_meta.created_time, VALUES(created_time)), processing_status = VALUES(processing_status), page_url = VALUES(page_url), utm_source = VALUES(utm_source), utm_medium = VALUES(utm_medium), utm_campaign = VALUES(utm_campaign), utm_term = VALUES(utm_term), utm_content = VALUES(utm_content)
    `;
        const params = [
            meta.entity_id,
            meta.platform_key,
            meta.source_lead_id,
            meta.page_id,
            meta.form_id,
            meta.ad_id,
            meta.campaign_id,
            meta.created_time || null,
            meta.processing_status || 'received',
            meta.page_url || null,
            meta.utm_source || null,
            meta.utm_medium || null,
            meta.utm_campaign || null,
            meta.utm_term || null,
            meta.utm_content || null,
        ];
        const result = await executeQuery(insertQuery, params);
        if (result.insertId) return result.insertId;
        const row = await executeQuery('SELECT id FROM lead_meta WHERE platform_key = ? AND source_lead_id = ? AND entity_id = ? LIMIT 1', [meta.platform_key, meta.source_lead_id, meta.entity_id]);
        return row[0]?.id;
    }

    static async upsertLeadData(leadMetaId, data) {
        const insertQuery = `
      INSERT INTO lead_data (entity_id, lead_meta_id, email, phone, first_name, last_name, full_name, raw_field_data, consent_time, platform_key, source_page_id, source_page_name, status, assigned_user_id, assigned_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE email = VALUES(email), phone = VALUES(phone), first_name = VALUES(first_name), last_name = VALUES(last_name), full_name = VALUES(full_name), raw_field_data = VALUES(raw_field_data), consent_time = VALUES(consent_time), platform_key = VALUES(platform_key), source_page_id = VALUES(source_page_id), source_page_name = VALUES(source_page_name), status = VALUES(status), assigned_user_id = VALUES(assigned_user_id), assigned_at = VALUES(assigned_at)
    `;
        const params = [
            data.entity_id,
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
            data.status || 'new',
            data.assigned_user_id || null,
            data.assigned_at || null,
        ];
        const result = await executeQuery(insertQuery, params);
        return result;
    }

    // Get lead by ID with entity isolation
    static async getLeadById(leadId, entityId) {
        const query = `
            SELECT ld.*, lm.platform_key, lm.source_lead_id, lm.page_id, lm.form_id, lm.ad_id, lm.campaign_id, 
                   lm.page_url, lm.utm_source, lm.utm_medium, lm.utm_campaign, lm.utm_term, lm.utm_content
            FROM lead_data ld
            LEFT JOIN lead_meta lm ON ld.lead_meta_id = lm.id
            WHERE ld.id = ? AND ld.entity_id = ?
        `;
        const leads = await executeQuery(query, [leadId, entityId]);
        return leads[0] || null;
    }

    // Get leads by entity with optional filters
    static async getLeadsByEntity(entityId, filters = {}) {
        let query = `
            SELECT ld.*, lm.platform_key, lm.source_lead_id, lm.page_id, lm.form_id, lm.ad_id, lm.campaign_id,
                   lm.page_url, lm.utm_source, lm.utm_medium, lm.utm_campaign, lm.utm_term, lm.utm_content,
                   u.first_name as assigned_user_first_name, u.last_name as assigned_user_last_name
            FROM lead_data ld
            LEFT JOIN lead_meta lm ON ld.lead_meta_id = lm.id
            LEFT JOIN users u ON ld.assigned_user_id = u.id
            WHERE ld.entity_id = ?
        `;

        const params = [entityId];

        // Add filters
        if (filters.status) {
            query += ` AND ld.status = ?`;
            params.push(filters.status);
        }

        if (filters.platform_key) {
            query += ` AND ld.platform_key = ?`;
            params.push(filters.platform_key);
        }

        if (filters.assigned_user_id) {
            query += ` AND ld.assigned_user_id = ?`;
            params.push(filters.assigned_user_id);
        }

        if (filters.search) {
            query += ` AND (ld.email LIKE ? OR ld.first_name LIKE ? OR ld.last_name LIKE ? OR ld.full_name LIKE ?)`;
            const searchTerm = `%${filters.search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        // Add ordering
        query += ` ORDER BY ld.created_at DESC`;

        // Add pagination
        if (filters.limit) {
            query += ` LIMIT ?`;
            params.push(parseInt(filters.limit));
        }

        if (filters.offset) {
            query += ` OFFSET ?`;
            params.push(parseInt(filters.offset));
        }

        return executeQuery(query, params);
    }

    // Update lead status
    static async updateLeadStatus(leadId, entityId, status) {
        const query = `UPDATE lead_data SET status = ?, updated_at = NOW() WHERE id = ? AND entity_id = ?`;
        return executeQuery(query, [status, leadId, entityId]);
    }

    // Update lead assignment
    static async updateLeadAssignment(leadId, entityId, assignedUserId, assignedAt) {
        const query = `UPDATE lead_data SET assigned_user_id = ?, assigned_at = ?, updated_at = NOW() WHERE id = ? AND entity_id = ?`;
        return executeQuery(query, [assignedUserId, assignedAt, leadId, entityId]);
    }

    // Get lead count by entity and status
    static async getLeadCountByStatus(entityId) {
        const query = `
            SELECT status, COUNT(*) as count
            FROM lead_data
            WHERE entity_id = ?
            GROUP BY status
        `;
        return executeQuery(query, [entityId]);
    }

    // Get unassigned leads by entity
    static async getUnassignedLeads(entityId, limit = 50) {
        const query = `
            SELECT ld.*, lm.platform_key, lm.source_lead_id
            FROM lead_data ld
            LEFT JOIN lead_meta lm ON ld.lead_meta_id = lm.id
            WHERE ld.entity_id = ? AND ld.assigned_user_id IS NULL
            ORDER BY ld.created_at ASC
            LIMIT ?
        `;
        return executeQuery(query, [entityId, limit]);
    }

    // Get leads assigned to specific user
    static async getLeadsByUser(userId, entityId, limit = 50) {
        const query = `
            SELECT ld.*, lm.platform_key, lm.source_lead_id
            FROM lead_data ld
            LEFT JOIN lead_meta lm ON ld.lead_meta_id = lm.id
            WHERE ld.entity_id = ? AND ld.assigned_user_id = ?
            ORDER BY ld.created_at DESC
            LIMIT ?
        `;
        return executeQuery(query, [entityId, userId, limit]);
    }
}

module.exports = LeadModel;


