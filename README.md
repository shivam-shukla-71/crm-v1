# CRM v1 - Lead Management System

A Node.js CRM application with MySQL database and unified lead ingestion from multiple sources.

## Features

1. **User Management**: Different user roles (admin, manager, sales_rep, support)
2. **Role Management**: Separate roles table for better flexibility
3. **User Verification**: is_verified field to track verified users
4. **User Status**: is_active field to enable/disable users
5. **OTP Management**: Support for verification, password reset, and email update
6. **Token Management**: Secure tokens for password reset and email update
7. **Security**: Password hashing support
8. **Audit Trail**: Timestamp tracking for created_at and updated_at
9. **Lead Ingestion**: Unified system for Facebook/Instagram Lead Ads and Website Landing Pages

## Lead Ingestion Sources

### Facebook/Instagram Lead Ads
- Webhook endpoint: `POST /webhooks/facebook`
- Verification endpoint: `GET /webhooks/facebook`
- Automatically fetches full lead data via Facebook Graph API
- Stores metadata and normalized lead information

### Website Landing Pages
- Webhook endpoint: `POST /webhooks/website`
- Accepts form submissions from landing pages
- Supports UTM parameters and page attribution
- Normalizes common field variations

## Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=crm_database
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=72h

# Bcrypt Configuration
BCRYPT_ROUNDS=12

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Facebook Lead Ads / Graph API
FB_APP_ID=your_facebook_app_id
FB_APP_SECRET=your_facebook_app_secret
FB_VERIFY_TOKEN=your_webhook_verify_token
FB_PAGE_ACCESS_TOKEN=your_long_lived_page_access_token
```

## Website Lead Submission Format

Send a POST request to `/webhooks/website` with the following structure:

```json
{
  "platform": "website",
  "page_url": "https://example.com/landing-page",
  "page_id": "landing_page_001",
  "form_id": "contact_form_001",
  "utm": {
    "source": "google",
    "medium": "cpc",
    "campaign": "summer_sale",
    "term": "crm software",
    "content": "banner_ad_001"
  },
  "answers": {
    "email": "user@example.com",
    "phone": "+15551234567",
    "first_name": "John",
    "last_name": "Doe",
    "full_name": "John Doe",
    "company": "Acme Corp",
    "consent_time": "2024-06-10T10:00:00Z"
  },
  "created_time": "2024-06-10T10:00:00Z"
}
```

## Database Schema

The system uses two main tables for leads:

### lead_meta
Stores non-PII metadata and attribution:
- `platform_key`: 'facebook', 'instagram', or 'website'
- `source_lead_id`: Unique identifier from the source
- `page_id`, `form_id`, `ad_id`, `campaign_id`: Attribution data
- `page_url`, `utm_*`: Website-specific tracking
- `status`: 'received', 'processed', or 'failed'

### lead_data
Stores PII and normalized lead information:
- `lead_meta_id`: Foreign key to lead_meta
- `email`, `phone`, `first_name`, `last_name`, `full_name`: Normalized contact data
- `raw_field_data`: Original form responses as JSON
- `platform_key`, `source_page_id`, `source_page_name`: Denormalized attribution

## Setup Instructions

1. Run the database setup script:
   ```bash
   mysql -u root -p < database.sql
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env` file

4. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/password/request` - Password reset request
- `POST /api/auth/password/update` - Password update

### Lead Webhooks
- `GET /webhooks/facebook` - Facebook webhook verification
- `POST /webhooks/facebook` - Facebook leadgen webhook
- `POST /webhooks/website` - Website landing page leads

## Testing

### Facebook Lead Ads
1. Set up Facebook app with Lead Ads permissions
2. Subscribe your Page to the `leadgen` webhook
3. Use Facebook's Test Lead tool to generate test leads
4. Verify data appears in database

### Website Leads
1. Send POST request to `/webhooks/website` with sample data
2. Verify lead appears in database with `platform_key: 'website'`
3. Check UTM parameters and page attribution are stored correctly

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- OTP verification for sensitive operations
- Role-based access control
- Facebook webhook signature verification
- Input validation and sanitization
