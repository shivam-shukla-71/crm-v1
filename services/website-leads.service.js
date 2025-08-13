const LeadModel = require('../models/lead.model');

exports.upsertWebsiteLead = async (leadMetaId, answers, meta) => {
    if (!leadMetaId || !answers) return;

    // Normalize website form answers
    const normalized = normalizeWebsiteAnswers(answers);

    // Prepare lead data
    const leadData = {
        email: normalized.email,
        phone: normalized.phone,
        first_name: normalized.first_name,
        last_name: normalized.last_name,
        full_name: normalized.full_name,
        raw_field_data: answers, // Store original answers
        consent_time: normalized.consent_time,
        platform_key: 'website',
        source_page_id: meta.page_id || null,
        source_page_name: meta.page_url ? new URL(meta.page_url).hostname : null,
    };

    // Save to database
    await LeadModel.upsertLeadData(leadMetaId, leadData);

    // Mark as processed in lead_meta
    const { executeQuery } = require('../config/database');
    await executeQuery('UPDATE lead_meta SET status = ? WHERE id = ?', ['processed', leadMetaId]);

    return leadMetaId;
};

function normalizeWebsiteAnswers(answers) {
    const normalized = {};

    // Map common field variations
    normalized.email = answers.email || answers['work_email'] || answers['business_email'] || answers['e-mail'] || null;
    normalized.phone = answers.phone || answers['phone_number'] || answers['mobile_phone'] || answers['cell_phone'] || answers['telephone'] || null;
    
    // Handle name fields
    let firstName = answers['first_name'] || answers['firstname'] || answers['fname'] || null;
    let lastName = answers['last_name'] || answers['lastname'] || answers['lname'] || null;
    let fullName = answers['full_name'] || answers['name'] || answers['fullname'] || null;

    // If we have full name but no first/last, split it
    if (!firstName && !lastName && fullName) {
        const parts = String(fullName).trim().split(/\s+/);
        firstName = parts[0] || null;
        lastName = parts.length > 1 ? parts.slice(1).join(' ') : null;
    } 
    // If we have first/last but no full name, combine them
    else if (!fullName && (firstName || lastName)) {
        fullName = [firstName, lastName].filter(Boolean).join(' ');
    }

    normalized.first_name = firstName;
    normalized.last_name = lastName;
    normalized.full_name = fullName;

    // Handle consent time if present
    normalized.consent_time = answers['consent_time'] || answers['consent_timestamp'] ? new Date(answers['consent_time'] || answers['consent_timestamp']) : null;

    return normalized;
}
