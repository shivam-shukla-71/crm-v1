# SalesMagnetCRM - Complete System & API Documentation

## 🚀 **System Overview**

SalesMagnetCRM is a comprehensive, multi-tenant Customer Relationship Management system designed for sales teams and businesses. The system provides unified lead ingestion from multiple sources (Facebook, Instagram, Website), complete lead lifecycle management, and robust entity-based multi-tenancy.

## 🏗️ **Architecture & Technology Stack**

### **Backend Technologies**
- **Node.js** with Express.js framework
- **MySQL** database with proper indexing and constraints
- **JWT** authentication with entity-based access control
- **RESTful API** design with comprehensive error handling

### **Core Features**
- **Multi-tenant Architecture** - Complete entity isolation
- **Unified Lead Ingestion** - Facebook, Instagram, Website forms
- **Lead Lifecycle Management** - Assignment, status tracking, stage progression
- **Entity-based Security** - Users can only access their entity's data
- **Comprehensive API** - Full CRUD operations with filtering and pagination

---

## 🗄️ **Database Schema**

### **Core Tables Structure**

#### **1. Entities Table** (Multi-tenancy foundation)
```sql
CREATE TABLE entities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL
);
```

#### **2. Users Table** (Entity-scoped user management)
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role_id INT NOT NULL,
    entity_id INT NOT NULL,                    -- Entity isolation
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (role_id) REFERENCES roles(id),
    FOREIGN KEY (entity_id) REFERENCES entities(id)
);
```

#### **3. Lead Management Tables**

##### **lead_meta** (Technical metadata)
```sql
CREATE TABLE lead_meta (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entity_id INT NOT NULL,                    -- Entity isolation
    platform_key ENUM('facebook','instagram','website'),
    source_lead_id VARCHAR(128) NOT NULL,
    page_id VARCHAR(64),
    form_id VARCHAR(64),
    ad_id VARCHAR(64),
    campaign_id VARCHAR(64),
    created_time DATETIME,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    page_url VARCHAR(512),
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(150),
    utm_term VARCHAR(100),
    utm_content VARCHAR(100),
    processing_status ENUM('received','processed','failed') DEFAULT 'received',
    
    FOREIGN KEY (entity_id) REFERENCES entities(id),
    UNIQUE KEY uq_platform_source_lead (platform_key, source_lead_id, entity_id)
);
```

##### **lead_data** (Main lead information - PRIMARY TABLE)
```sql
CREATE TABLE lead_data (
    id INT PRIMARY KEY AUTO_INCREMENT,         -- This is the MAIN LEAD ID
    entity_id INT NOT NULL,                    -- Entity isolation
    lead_meta_id INT NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(30),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(200),
    raw_field_data JSON,
    consent_time DATETIME,
    platform_key ENUM('facebook','instagram','website'),
    source_page_id VARCHAR(64),
    source_page_name VARCHAR(150),
    status ENUM('new','qualified','contacted','meeting_scheduled','proposal_sent','negotiation','won','lost') DEFAULT 'new',
    assigned_user_id INT NULL,
    assigned_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (entity_id) REFERENCES entities(id),
    FOREIGN KEY (lead_meta_id) REFERENCES lead_meta(id),
    FOREIGN KEY (assigned_user_id) REFERENCES users(id)
);
```

##### **lead_statuses** (Reference table)
```sql
CREATE TABLE lead_statuses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

##### **lead_assignments** (Assignment tracking)
```sql
CREATE TABLE lead_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entity_id INT NOT NULL,                    -- Entity isolation
    lead_id INT NOT NULL,                      -- References lead_data.id
    assigned_user_id INT NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by_user_id INT NOT NULL,
    previous_user_id INT NULL,
    reassignment_reason VARCHAR(255),
    notes TEXT,
    
    FOREIGN KEY (entity_id) REFERENCES entities(id),
    FOREIGN KEY (lead_id) REFERENCES lead_data(id),
    FOREIGN KEY (assigned_user_id) REFERENCES users(id),
    FOREIGN KEY (assigned_by_user_id) REFERENCES users(id),
    
    UNIQUE KEY uq_lead_assignment (lead_id)
);
```

##### **lead_stages** (Stage progression tracking)
```sql
CREATE TABLE lead_stages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entity_id INT NOT NULL,                    -- Entity isolation
    lead_id INT NOT NULL,                      -- References lead_data.id
    status_id INT NOT NULL,                    -- References lead_statuses
    entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    exited_at TIMESTAMP NULL,
    duration_hours DECIMAL(10,2) NULL,
    user_id INT NOT NULL,
    notes TEXT,
    next_action_required VARCHAR(255),
    
    FOREIGN KEY (entity_id) REFERENCES entities(id),
    FOREIGN KEY (lead_id) REFERENCES lead_data(id),
    FOREIGN KEY (status_id) REFERENCES lead_statuses(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

##### **lead_activities** (Activity logging) 🆕 **PHASE 4**
```sql
CREATE TABLE lead_activities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entity_id INT NOT NULL,                    -- Entity isolation
    lead_id INT NOT NULL,                      -- References lead_data.id
    user_id INT NOT NULL,
    activity_type ENUM('call','email','meeting','note','status_change','assignment','follow_up'),
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_follow_up_date DATETIME NULL,
    priority ENUM('low','medium','high','urgent') DEFAULT 'medium',
    status ENUM('pending','completed','cancelled') DEFAULT 'pending',
    
    FOREIGN KEY (entity_id) REFERENCES entities(id),
    FOREIGN KEY (lead_id) REFERENCES lead_data(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 🔐 **Authentication & Security**

### **JWT Token Structure**
```json
{
  "user_id": 123,
  "email": "user@company.com",
  "role_id": 2,
  "entity_id": 1,           // Entity isolation key
  "entity_name": "fxcareers",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### **Security Features**
- **Entity Isolation** - Users can never access other entities' data
- **JWT Authentication** - Secure token-based authentication
- **Role-based Access Control** - Admin, Manager, Sales Rep, Support roles
- **Input Validation** - Comprehensive request validation and sanitization
- **SQL Injection Protection** - Parameterized queries throughout

---

## 📡 **API Endpoints Reference**

### **Base URL**
```
https://your-domain.com/api
```

### **Authentication Endpoints**

#### **User Registration**
```http
POST /auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@company.com",
  "password": "SecurePass123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email for verification.",
  "data": {
    "user_id": 123,
    "username": "john_doe",
    "email": "john@company.com"
  }
}
```

#### **User Login**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@company.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 123,
      "username": "john_doe",
      "email": "john@company.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "sales_rep",
      "entity": {
        "id": 1,
        "name": "fxcareers"
      }
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": "72h"
  }
}
```

#### **Email Verification**
```http
POST /auth/verify-otp
Content-Type: application/json

{
  "email": "john@company.com",
  "otp": "123456"
}
```

### **Lead Management Endpoints**

#### **Get All Leads (Entity-scoped)**
```http
GET /leads?status=new&platform=facebook&limit=50&offset=0
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status` - Filter by lead status
- `platform` - Filter by platform (facebook, instagram, website)
- `assigned_user_id` - Filter by assigned user
- `search` - Search in email, names, phone
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 456,
      "email": "prospect@example.com",
      "first_name": "Jane",
      "last_name": "Smith",
      "status": "new",
      "platform_key": "facebook",
      "assigned_user_id": null,
      "created_at": "2024-06-10T10:00:00Z"
    }
  ],
  "filters": { "status": "new", "platform": "facebook", "limit": 50, "offset": 0 },
  "total": 1
}
```

#### **Get Lead by ID**
```http
GET /leads/456
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 456,
    "entity_id": 1,
    "email": "prospect@example.com",
    "first_name": "Jane",
    "last_name": "Smith",
    "full_name": "Jane Smith",
    "phone": "+15551234567",
    "status": "new",
    "platform_key": "facebook",
    "source_page_id": "123456789",
    "assigned_user_id": null,
    "created_at": "2024-06-10T10:00:00Z",
    "raw_field_data": { "company": "Acme Corp" }
  }
}
```

#### **Update Lead Information**
```http
PUT /leads/456
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone": "+15551234567"
}
```

#### **Get Lead Counts by Status**
```http
GET /leads/counts
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "status": "new", "count": 25 },
    { "status": "qualified", "count": 15 },
    { "status": "contacted", "count": 10 },
    { "status": "won", "count": 5 }
  ]
}
```

#### **Get Unassigned Leads**
```http
GET /leads/unassigned?limit=20
Authorization: Bearer <access_token>
```

#### **Get User's Assigned Leads**
```http
GET /leads/my-leads?limit=20
Authorization: Bearer <access_token>
```

#### **Get Pipeline View**
```http
GET /leads/pipeline
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pipeline": {
      "new": [
        { "id": 456, "email": "prospect@example.com", "status": "new" }
      ],
      "qualified": [
        { "id": 457, "email": "lead@example.com", "status": "qualified" }
      ]
    },
    "statusCounts": [
      { "status": "new", "count": 25 },
      { "status": "qualified", "count": 15 }
    ]
  }
}
```

### **Lead Assignment Endpoints** 🆕 **PHASE 2**

#### **Assign Lead to User**
```http
POST /assignments/assign
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "leadId": 456,
  "assignedUserId": 123,
  "reason": "New lead assignment",
  "notes": "High priority prospect"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead assigned successfully",
  "data": {
    "assignment": {
      "id": 1,
      "lead_id": 456,
      "assigned_user_id": 123,
      "assigned_at": "2024-06-10T10:00:00Z",
      "assigned_by_user_id": 456,
      "reassignment_reason": "New lead assignment",
      "notes": "High priority prospect"
    },
    "assigned_user": {
      "id": 123,
      "first_name": "John",
      "last_name": "Doe"
    }
  }
}
```

#### **Reassign Lead to Different User**
```http
POST /assignments/reassign
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "leadId": 456,
  "newAssignedUserId": 789,
  "reason": "Workload rebalancing",
  "notes": "Moving to senior sales rep"
}
```

#### **Unassign Lead**
```http
POST /assignments/unassign
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "leadId": 456,
  "reason": "Lead requires special handling"
}
```

#### **Bulk Assign Unassigned Leads**
```http
POST /assignments/bulk-assign
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "reason": "Weekly bulk assignment",
  "max_leads_per_user": 25
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully assigned 15 leads",
  "data": {
    "total_assigned": 15,
    "assignments": [
      { "lead_id": 456, "assigned_user_id": 123 },
      { "lead_id": 457, "assigned_user_id": 789 }
    ]
  }
}
```

#### **Get Lead Assignment Details**
```http
GET /assignments/lead/456
Authorization: Bearer <access_token>
```

#### **Get Assignment History for Lead**
```http
GET /assignments/lead/456/history
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "lead_id": 456,
      "assigned_user_id": 123,
      "assigned_at": "2024-06-10T10:00:00Z",
      "assigned_by_user_id": 456,
      "previous_user_id": null,
      "reassignment_reason": "Initial assignment",
      "assigned_user_email": "john@company.com",
      "assigned_by_first_name": "Manager",
      "assigned_by_last_name": "User"
    }
  ]
}
```

#### **Get All Entity Assignments**
```http
GET /assignments/entity?assigned_user_id=123&lead_status=new&limit=50
Authorization: Bearer <access_token>
```

#### **Get User's Assignments**
```http
GET /assignments/user?limit=20
Authorization: Bearer <access_token>
```

#### **Get Workload Statistics**
```http
GET /assignments/workload-stats
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "unassigned_leads": 15,
    "workload_distribution": [
      {
        "id": 123,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john@company.com",
        "assigned_leads": 25,
        "active_leads": 20,
        "closed_leads": 5
      }
    ],
    "total_users": 5,
    "average_leads_per_user": 20
  }
}
```

### **Lead Stage Management Endpoints** 🆕 **PHASE 3**

#### **Change Lead Status**
```http
POST /stages/change-status
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "leadId": 456,
  "statusId": 2,
  "notes": "Lead qualified after initial contact",
  "nextActionRequired": "Schedule follow-up call"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead status changed from 'new' to 'qualified' successfully",
  "data": {
    "stage_id": 1,
    "current_stage": {
      "id": 1,
      "lead_id": 456,
      "status_id": 2,
      "status_name": "qualified",
      "entered_at": "2024-06-10T10:00:00Z",
      "notes": "Lead qualified after initial contact",
      "next_action_required": "Schedule follow-up call"
    },
    "previous_status": "new",
    "new_status": "qualified",
    "transition_valid": true
  }
}
```

#### **Get Current Stage for Lead**
```http
GET /stages/lead/456/current
Authorization: Bearer <access_token>
```

#### **Get Stage History for Lead**
```http
GET /stages/lead/456/history
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "lead_id": 456,
      "status_id": 2,
      "status_name": "qualified",
      "entered_at": "2024-06-10T10:00:00Z",
      "exited_at": "2024-06-10T14:00:00Z",
      "duration_hours": 4.00,
      "notes": "Lead qualified after initial contact",
      "next_action_required": "Schedule follow-up call",
      "user_email": "john@company.com"
    }
  ]
}
```

#### **Get Next Possible Statuses**
```http
GET /stages/lead/456/next-statuses
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "current_status": "qualified",
    "next_possible_statuses": [
      {
        "id": 3,
        "name": "contacted",
        "description": "Initial contact made with prospect"
      },
      {
        "id": 8,
        "name": "lost",
        "description": "Lead lost or disqualified"
      }
    ]
  }
}
```

#### **Update Stage Notes**
```http
PUT /stages/update-notes
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "stageId": 1,
  "notes": "Updated notes for the stage",
  "nextActionRequired": "Updated next action"
}
```

#### **Get Stage Performance Metrics**
```http
GET /stages/performance-metrics?date_from=2024-06-01&date_to=2024-06-30
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "status_name": "new",
      "status_description": "New lead received",
      "total_entries": 150,
      "total_exits": 120,
      "currently_in_stage": 30,
      "avg_duration_hours": 18.5,
      "min_duration_hours": 1.0,
      "max_duration_hours": 72.0,
      "leads_exceeding_24h": 45,
      "leads_exceeding_48h": 15
    }
  ]
}
```

#### **Get User Performance Metrics**
```http
GET /stages/user-performance?user_id=123&date_from=2024-06-01&date_to=2024-06-30
Authorization: Bearer <access_token>
```

#### **Get Stage Transition Matrix**
```http
GET /stages/transition-matrix?date_from=2024-06-01&date_to=2024-06-30
Authorization: Bearer <access_token>
```

#### **Get Leads Exceeding SLA**
```http
GET /stages/sla-violations?sla_hours=24
Authorization: Bearer <access_token>
```

#### **Get Stage Conversion Rates**
```http
GET /stages/conversion-rates?date_from=2024-06-01&date_to=2024-06-30
Authorization: Bearer <access_token>
```

#### **Get Stage Summary for Dashboard**
```http
GET /stages/summary
Authorization: Bearer <access_token>
```

#### **Get Recent Stage Changes**
```http
GET /stages/recent-changes?limit=20
Authorization: Bearer <access_token>
```

#### **Get Status Statistics**
```http
GET /stages/status-statistics?date_from=2024-06-01&date_to=2024-06-30
Authorization: Bearer <access_token>
```

#### **Get SLA Compliance Rates**
```http
GET /stages/sla-compliance?sla_hours=24
Authorization: Bearer <access_token>
```

#### **Get Workflow Efficiency**
```http
GET /stages/workflow-efficiency?date_from=2024-06-01&date_to=2024-06-30
Authorization: Bearer <access_token>
```

#### **Get Bottleneck Analysis**
```http
GET /stages/bottleneck-analysis?date_from=2024-06-01&date_to=2024-06-30
Authorization: Bearer <access_token>
```

### **Lead Activity Management Endpoints** 🆕 **PHASE 4**

#### **Log New Activity**
```http
POST /activities/log
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "leadId": 456,
  "activityType": "call",
  "description": "Initial call made to prospect",
  "nextFollowUpDate": "2024-06-15T10:00:00Z",
  "priority": "high",
  "status": "pending"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Activity logged successfully",
  "data": {
    "activity_id": 1,
    "activity": {
      "id": 1,
      "lead_id": 456,
      "user_id": 123,
      "activity_type": "call",
      "description": "Initial call made to prospect",
      "next_follow_up_date": "2024-06-15T10:00:00Z",
      "priority": "high",
      "status": "pending",
      "created_at": "2024-06-10T10:00:00Z"
    }
  }
}
```

#### **Get Lead Activities**
```http
GET /activities/lead/456?activity_type=call&priority=high&limit=20
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `activity_type` - Filter by activity type (call, email, meeting, note, status_change, assignment, follow_up)
- `user_id` - Filter by user who performed the activity
- `priority` - Filter by priority (low, medium, high, urgent)
- `status` - Filter by status (pending, completed, cancelled)
- `date_from` - Filter by start date
- `date_to` - Filter by end date
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset (default: 0)

#### **Get Lead Activity Timeline**
```http
GET /activities/lead/456/timeline?limit=50
Authorization: Bearer <access_token>
```

#### **Get Entity Activities**
```http
GET /activities/entity?user_id=123&priority=urgent&limit=50
Authorization: Bearer <access_token>
```

#### **Get User Activities**
```http
GET /activities/user?activity_type=call&priority=high&limit=20
Authorization: Bearer <access_token>
```

#### **Get Pending Follow-ups**
```http
GET /activities/follow-ups/pending?priority=urgent&limit=20
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "lead_id": 456,
      "user_id": 123,
      "activity_type": "call",
      "description": "Follow-up call needed",
      "next_follow_up_date": "2024-06-12T10:00:00Z",
      "priority": "urgent",
      "status": "pending",
      "hours_until_follow_up": 24,
      "lead_email": "prospect@example.com",
      "lead_first_name": "Jane",
      "lead_last_name": "Smith"
    }
  ],
  "filters": { "priority": "urgent", "limit": 20 },
  "total": 1
}
```

#### **Get Overdue Follow-ups**
```http
GET /activities/follow-ups/overdue?user_id=123
Authorization: Bearer <access_token>
```

#### **Get Follow-ups Summary**
```http
GET /activities/follow-ups/summary
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_pending": 25,
    "urgent_pending": 5,
    "high_pending": 8,
    "due_within_24h": 12,
    "due_within_week": 20
  }
}
```

#### **Update Activity Status**
```http
PUT /activities/update-status
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "activityId": 1,
  "status": "completed",
  "notes": "Call completed successfully"
}
```

#### **Update Follow-up Date**
```http
PUT /activities/update-follow-up
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "activityId": 1,
  "nextFollowUpDate": "2024-06-20T10:00:00Z",
  "notes": "Rescheduled for next week"
}
```

#### **Bulk Update Follow-up Dates**
```http
PUT /activities/bulk-update-follow-ups
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "activityIds": [1, 2, 3],
  "nextFollowUpDate": "2024-06-25T10:00:00Z",
  "notes": "Bulk reschedule due to team availability"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully updated 3 follow-up dates",
  "data": {
    "updated_count": 3,
    "next_follow_up_date": "2024-06-25T10:00:00Z"
  }
}
```

#### **Get Activity Statistics**
```http
GET /activities/statistics?date_from=2024-06-01&date_to=2024-06-30
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "activity_type": "call",
      "total_activities": 150,
      "completed_activities": 120,
      "pending_activities": 25,
      "cancelled_activities": 5,
      "completion_rate": 80.00
    }
  ]
}
```

#### **Get User Activity Performance**
```http
GET /activities/user-performance?user_id=123&date_from=2024-06-01&date_to=2024-06-30
Authorization: Bearer <access_token>
```

#### **Get Priority Distribution**
```http
GET /activities/priority-distribution?date_from=2024-06-01&date_to=2024-06-30
Authorization: Bearer <access_token>
```

#### **Get Recent Activities**
```http
GET /activities/recent?limit=20
Authorization: Bearer <access_token>
```

#### **Get Activity Summary**
```http
GET /activities/summary
Authorization: Bearer <access_token>
```

### **Lead Activity Management Endpoints** 🆕 **PHASE 4**

#### **Log New Activity**
```http
POST /activities/log
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "leadId": 456,
  "activityType": "call",
  "description": "Initial call made to prospect",
  "nextFollowUpDate": "2024-06-15T10:00:00Z",
  "priority": "high",
  "status": "pending"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Activity logged successfully",
  "data": {
    "activity_id": 1,
    "activity": {
      "id": 1,
      "lead_id": 456,
      "user_id": 123,
      "activity_type": "call",
      "description": "Initial call made to prospect",
      "next_follow_up_date": "2024-06-15T10:00:00Z",
      "priority": "high",
      "status": "pending",
      "created_at": "2024-06-10T10:00:00Z"
    }
  }
}
```

#### **Get Lead Activities**
```http
GET /activities/lead/456?activity_type=call&priority=high&limit=20
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `activity_type` - Filter by activity type (call, email, meeting, note, status_change, assignment, follow_up)
- `user_id` - Filter by user who performed the activity
- `priority` - Filter by priority (low, medium, high, urgent)
- `status` - Filter by status (pending, completed, cancelled)
- `date_from` - Filter by start date
- `date_to` - Filter by end date
- `limit` - Number of results (default: 50)
- `offset` - Pagination offset (default: 0)

#### **Get Lead Activity Timeline**
```http
GET /activities/lead/456/timeline?limit=50
Authorization: Bearer <access_token>
```

#### **Get Entity Activities**
```http
GET /activities/entity?user_id=123&priority=urgent&limit=50
Authorization: Bearer <access_token>
```

#### **Get User Activities**
```http
GET /activities/user?activity_type=call&priority=high&limit=20
Authorization: Bearer <access_token>
```

#### **Get Pending Follow-ups**
```http
GET /activities/follow-ups/pending?priority=urgent&limit=20
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "lead_id": 456,
      "user_id": 123,
      "activity_type": "call",
      "description": "Follow-up call needed",
      "next_follow_up_date": "2024-06-12T10:00:00Z",
      "priority": "urgent",
      "status": "pending",
      "hours_until_follow_up": 24,
      "lead_email": "prospect@example.com",
      "lead_first_name": "Jane",
      "lead_last_name": "Smith"
    }
  ],
  "filters": { "priority": "urgent", "limit": 20 },
  "total": 1
}
```

#### **Get Overdue Follow-ups**
```http
GET /activities/follow-ups/overdue?user_id=123
Authorization: Bearer <access_token>
```

#### **Get Follow-ups Summary**
```http
GET /activities/follow-ups/summary
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_pending": 25,
    "urgent_pending": 5,
    "high_pending": 8,
    "due_within_24h": 12,
    "due_within_week": 20
  }
}
```

#### **Update Activity Status**
```http
PUT /activities/update-status
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "activityId": 1,
  "status": "completed",
  "notes": "Call completed successfully"
}
```

#### **Update Follow-up Date**
```http
PUT /activities/update-follow-up
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "activityId": 1,
  "nextFollowUpDate": "2024-06-20T10:00:00Z",
  "notes": "Rescheduled for next week"
}
```

#### **Bulk Update Follow-up Dates**
```http
PUT /activities/bulk-update-follow-ups
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "activityIds": [1, 2, 3],
  "nextFollowUpDate": "2024-06-25T10:00:00Z",
  "notes": "Bulk reschedule due to team availability"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully updated 3 follow-up dates",
  "data": {
    "updated_count": 3,
    "next_follow_up_date": "2024-06-25T10:00:00Z"
  }
}
```

#### **Get Activity Statistics**
```http
GET /activities/statistics?date_from=2024-06-01&date_to=2024-06-30
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "activity_type": "call",
      "total_activities": 150,
      "completed_activities": 120,
      "pending_activities": 25,
      "cancelled_activities": 5,
      "completion_rate": 80.00
    }
  ]
}
```

#### **Get User Activity Performance**
```http
GET /activities/user-performance?user_id=123&date_from=2024-06-01&date_to=2024-06-30
Authorization: Bearer <access_token>
```

#### **Get Priority Distribution**
```http
GET /activities/priority-distribution?date_from=2024-06-01&date_to=2024-06-30
Authorization: Bearer <access_token>
```

#### **Get Recent Activities**
```http
GET /activities/recent?limit=20
Authorization: Bearer <access_token>
```

#### **Get Activity Summary**
```http
GET /activities/summary
Authorization: Bearer <access_token>
```

### **Webhook Endpoints**

#### **Facebook Lead Ads Webhook**
```http
GET /webhooks/facebook?hub.mode=subscribe&hub.verify_token=<your_token>&hub.challenge=<challenge>
```

```http
POST /webhooks/facebook
Content-Type: application/json
X-Hub-Signature-256: sha256=<signature>

{
  "object": "page",
  "entry": [
    {
      "id": "PAGE_ID",
      "time": 1718033000000,
      "changes": [
        {
          "field": "leadgen",
          "value": {
            "leadgen_id": "LEAD_ID",
            "form_id": "FORM_ID",
            "page_id": "PAGE_ID",
            "ad_id": "AD_ID",
            "campaign_id": "CAMPAIGN_ID",
            "created_time": 1718032990
          }
        }
      ]
    }
  ]
}
```

#### **Website Landing Page Webhook**
```http
POST /webhooks/website
Content-Type: application/json

{
  "platform": "website",
  "entity_id": 1,
  "page_url": "https://example.com/landing-page",
  "page_id": "landing_page_001",
  "utm": {
    "source": "google",
    "medium": "cpc",
    "campaign": "summer_sale"
  },
  "answers": {
    "email": "user@example.com",
    "phone": "+15551234567",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

**Response:**
```json
{
  "success": true,
  "lead_id": 789,
  "message": "Lead received successfully"
}
```

---

### **Analytics & Reporting Endpoints** 🆕 **PHASE 5**

#### **Dashboard Summary**
```http
GET /analytics/dashboard
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_leads": 1250,
    "new_leads": 45,
    "contacted_leads": 89,
    "won_leads": 234,
    "lost_leads": 67,
    "conversion_rate": 18.7,
    "avg_cycle_time": 12.5,
    "avg_assignment_time": 2.3,
    "recent_activities": [...],
    "upcoming_follow_ups": [...]
  }
}
```

#### **Lead Analytics**
```http
GET /analytics/leads?status=new&platform=facebook&date_from=2024-01-01&date_to=2024-12-31
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `status` - Filter by lead status
- `platform` - Filter by platform
- `date_from` - Start date (YYYY-MM-DD)
- `date_to` - End date (YYYY-MM-DD)
- `assigned_user_id` - Filter by assigned user

**Response:**
```json
{
  "success": true,
  "data": {
    "total_leads": 1250,
    "new_leads": 45,
    "contacted_leads": 89,
    "won_leads": 234,
    "lost_leads": 67,
    "assigned_leads": 567,
    "unassigned_leads": 45,
    "avg_assignment_time": 2.3,
    "avg_cycle_time": 12.5
  }
}
```

#### **Platform Performance**
```http
GET /analytics/platforms?date_from=2024-01-01&date_to=2024-12-31
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "platform": "facebook",
      "total_leads": 567,
      "won_leads": 89,
      "lost_leads": 23,
      "conversion_rate": 15.7,
      "avg_cycle_time": 14.2,
      "avg_assignment_time": 2.1
    },
    {
      "platform": "website",
      "total_leads": 456,
      "won_leads": 78,
      "lost_leads": 34,
      "conversion_rate": 17.1,
      "avg_cycle_time": 11.8,
      "avg_assignment_time": 1.9
    }
  ]
}
```

#### **User Performance**
```http
GET /analytics/users?date_from=2024-01-01&date_to=2024-12-31
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "user_id": 123,
      "username": "john_doe",
      "leads_assigned": 89,
      "leads_won": 23,
      "leads_lost": 12,
      "conversion_rate": 25.8,
      "avg_cycle_time": 11.2,
      "avg_assignment_time": 1.8,
      "total_activities": 156,
      "pending_follow_ups": 8
    }
  ]
}
```

#### **Conversion Funnel**
```http
GET /analytics/funnel?date_from=2024-01-01&date_to=2024-12-31
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stages": [
      {
        "stage": "new",
        "count": 1250,
        "percentage": 100
      },
      {
        "stage": "qualified",
        "count": 890,
        "percentage": 71.2
      },
      {
        "stage": "contacted",
        "count": 567,
        "percentage": 45.4
      },
      {
        "stage": "won",
        "count": 234,
        "percentage": 18.7
      }
    ]
  }
}
```

#### **Time-based Analytics**
```http
GET /analytics/time-based?group_by=week&date_from=2024-01-01&date_to=2024-12-31
Authorization: Bearer <access_token>
```

**Query Parameters:**
- `group_by` - Group by day, week, or month
- `date_from` - Start date
- `date_to` - End date

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "period": "2024-W01",
      "new_leads": 45,
      "won_leads": 12,
      "lost_leads": 8,
      "conversion_rate": 26.7
    }
  ]
}
```

#### **Activity Analytics**
```http
GET /analytics/activities?date_from=2024-01-01&date_to=2024-12-31
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_activities": 2345,
    "by_type": {
      "call": 567,
      "email": 890,
      "meeting": 234,
      "note": 456,
      "follow_up": 198
    },
    "by_priority": {
      "urgent": 45,
      "high": 234,
      "medium": 1234,
      "low": 832
    },
    "by_status": {
      "pending": 234,
      "completed": 2012,
      "cancelled": 99
    }
  }
}
```

#### **SLA Compliance**
```http
GET /analytics/sla-compliance?date_from=2024-01-01&date_to=2024-12-31
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_leads": 1250,
    "within_sla": 1189,
    "exceeded_sla": 61,
    "compliance_rate": 95.1,
    "avg_exceeded_time": 4.2,
    "by_status": {
      "new": 98.5,
      "qualified": 94.2,
      "contacted": 96.8
    }
  }
}
```

#### **Custom Report Generation**
```http
POST /analytics/custom-report
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "report_type": "lead_performance",
  "filters": {
    "date_from": "2024-01-01",
    "date_to": "2024-12-31",
    "platform": "facebook",
    "status": ["new", "qualified"]
  }
}
```

#### **Data Export**
```http
POST /analytics/export
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "report_type": "lead_analytics",
  "format": "csv",
  "filters": {
    "date_from": "2024-01-01",
    "date_to": "2024-12-31"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "download_url": "/api/analytics/export/download/abc123",
    "expires_at": "2024-12-31T23:59:59Z"
  }
}
```

#### **Report Templates**
```http
POST /reporting/templates
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Monthly Lead Performance",
  "type": "lead_analytics",
  "filters": {
    "group_by": "month",
    "include_platforms": true,
    "include_conversion_funnel": true
  },
  "schedule": {
    "frequency": "monthly",
    "day_of_month": 1,
    "time": "09:00"
  }
}
```

#### **Scheduled Reports**
```http
GET /reporting/schedules
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Monthly Lead Performance",
      "frequency": "monthly",
      "next_run": "2024-02-01T09:00:00Z",
      "recipients": ["manager@company.com"],
      "status": "active"
    }
  ]
}
```

---

## 🔄 **Lead Lifecycle & Workflow**

### **Lead Status Progression**
```
New → Qualified → Contacted → Meeting Scheduled → Proposal Sent → Negotiation → Won/Lost
```

### **Status Descriptions**
- **new** - Lead received from webhook/ingestion
- **qualified** - Lead qualified and ready for contact
- **contacted** - Initial contact made
- **meeting_scheduled** - Meeting or call scheduled
- **proposal_sent** - Proposal or quote sent
- **negotiation** - In negotiation phase
- **won** - Lead converted to customer
- **lost** - Lead lost or disqualified

### **Assignment Workflow** 🆕 **PHASE 2**
1. **Auto-assignment** - New leads automatically assigned based on rules
2. **Manual assignment** - Managers can assign leads to specific users
3. **Reassignment** - Leads can be reassigned with reason tracking
4. **Workload balancing** - Automatic distribution based on user capacity
5. **Bulk assignment** - Mass assignment of unassigned leads
6. **Assignment history** - Complete tracking of all assignment changes

### **Assignment Rules & Logic** 🆕 **PHASE 2**
- **Round-robin distribution** - Even distribution across available users
- **Workload balancing** - Respects maximum leads per user limits
- **Entity isolation** - Users can only be assigned leads from their entity
- **Permission-based** - Only managers and admins can perform bulk assignments
- **Audit trail** - Complete history of who assigned what to whom and when

### **Stage Management Workflow** 🆕 **PHASE 3**
1. **Status validation** - Workflow rules prevent invalid status transitions
2. **Stage tracking** - Complete history of all stage changes with timestamps
3. **Duration monitoring** - Track time spent in each stage for SLA compliance
4. **Performance analytics** - Comprehensive metrics for stage efficiency
5. **Bottleneck identification** - Identify stages where leads get stuck
6. **Conversion tracking** - Monitor conversion rates at each stage

### **Stage Workflow Rules** 🆕 **PHASE 3**
- **Valid transitions only** - Enforced workflow prevents invalid status changes
- **Stage duration tracking** - Automatic calculation of time spent in each stage
- **SLA monitoring** - Track leads exceeding defined service level agreements
- **Performance metrics** - Comprehensive analytics for stage efficiency
- **Bottleneck analysis** - Identify and resolve workflow bottlenecks

### **Activity Management Workflow** 🆕 **PHASE 4**
1. **Comprehensive logging** - Track all interactions with leads
2. **Follow-up management** - Schedule and track follow-up activities
3. **Priority-based organization** - Urgent, high, medium, low priority levels
4. **Status tracking** - Pending, completed, cancelled activity states
5. **Timeline visualization** - Complete activity history for each lead
6. **Performance analytics** - User and team activity performance metrics

### **Activity Types & Priorities** 🆕 **PHASE 4**
- **Activity Types**: call, email, meeting, note, status_change, assignment, follow_up
- **Priority Levels**: urgent, high, medium, low
- **Status States**: pending, completed, cancelled
- **Follow-up Scheduling**: Automatic date calculation and overdue tracking
- **Bulk Operations**: Mass update follow-up dates and statuses

### **Activity Management Workflow** 🆕 **PHASE 4**
1. **Comprehensive logging** - Track all interactions with leads
2. **Follow-up management** - Schedule and track follow-up activities
3. **Priority-based organization** - Urgent, high, medium, low priority levels
4. **Status tracking** - Pending, completed, cancelled activity states
5. **Timeline visualization** - Complete activity history for each lead
6. **Performance analytics** - User and team activity performance metrics

### **Activity Types & Priorities** 🆕 **PHASE 4**
- **Activity Types**: call, email, meeting, note, status_change, assignment, follow_up
- **Priority Levels**: urgent, high, medium, low
- **Status States**: pending, completed, cancelled
- **Follow-up Scheduling**: Automatic date calculation and overdue tracking
- **Bulk Operations**: Mass update follow-up dates and statuses

---

## 🏢 **Entity Management**

### **Default Entities**
The system comes pre-configured with three entities:
1. **fxcareers** (ID: 1) - FX Careers company
2. **yamarkets** (ID: 2) - YA Markets company
3. **nxgmarkets** (ID: 3) - NXG Markets company

### **Entity Isolation Rules**
- Users can only access data within their assigned entity
- All API responses are automatically filtered by entity
- Cross-entity data access is prevented at middleware level
- Entity-specific configuration and settings

---

## 📊 **Data Models & Relationships**

### **Lead Data Flow**
```
Webhook → lead_meta (metadata) → lead_data (main lead) → lead_assignments (assignment) → lead_stages (progression) → lead_activities (interactions)
```

### **Key Relationships**
- **lead_data.id** is the primary lead identifier used throughout the system
- **lead_meta** stores technical metadata (platform, source, UTM params)
- **lead_assignments** tracks current and historical assignments
- **lead_stages** tracks stage progression and duration
- **lead_activities** logs all interactions and follow-ups

### **Entity Scoping**
All lead-related queries automatically include:
```sql
WHERE entity_id = ? AND [other conditions]
```

---

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crm-v1
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials and Facebook API keys
   ```

4. **Set up the database**
   ```bash
   mysql -u root -p < database.sql
   ```

5. **Start the application**
   ```bash
   npm run dev    # Development mode
   npm start      # Production mode
   ```

### **Environment Variables**
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

# Facebook Lead Ads / Graph API
FB_APP_ID=your_facebook_app_id
FB_APP_SECRET=your_facebook_app_secret
FB_VERIFY_TOKEN=your_webhook_verify_token
FB_PAGE_ACCESS_TOKEN=your_long_lived_page_access_token
```

---

## 🧪 **Testing & Development**

### **Testing Facebook Webhooks**
1. Set up Facebook app with Lead Ads permissions
2. Subscribe your Page to the `leadgen` webhook
3. Use Facebook's Test Lead tool to generate test leads
4. Verify data appears in database with proper entity isolation

### **Testing Website Webhooks**
1. Send POST request to `/webhooks/website` with sample data
2. Verify lead appears in database with `platform_key: 'website'`
3. Check UTM parameters and page attribution are stored correctly

### **Testing Lead Assignment** 🆕 **PHASE 2**
1. Create test leads through webhooks
2. Use assignment endpoints to assign leads to users
3. Test reassignment and unassignment functionality
4. Verify workload statistics and distribution

### **Testing Lead Stages** 🆕 **PHASE 3**
1. Create test leads and assign them to users
2. Test status transitions using workflow rules
3. Verify stage duration tracking and SLA compliance
4. Test performance metrics and bottleneck analysis

### **Testing Lead Activities** 🆕 **PHASE 4**
1. Create test leads and assign them to users
2. Log various types of activities (calls, emails, meetings)
3. Test follow-up scheduling and overdue tracking
4. Verify activity timeline and performance metrics

### **Testing Lead Activities** 🆕 **PHASE 4**
1. Create test leads and assign them to users
2. Log various types of activities (calls, emails, meetings)
3. Test follow-up scheduling and overdue tracking
4. Verify activity timeline and performance metrics

### **API Testing**
Use the provided Postman collection (`salesMagnet.postman_collection.json`) for comprehensive API testing.

---

## 🔧 **Development Phases**

### **Phase 1: Core Infrastructure ✅ COMPLETED**
- Entity-based multi-tenancy
- JWT authentication with entity isolation
- Basic lead CRUD operations
- Webhook ingestion (Facebook & Website)
- Database schema with proper relationships

### **Phase 2: Lead Assignment System ✅ COMPLETED** 🆕
- **Lead assignment and reassignment** - Complete assignment lifecycle management
- **Auto-assignment rules** - Round-robin distribution and workload balancing
- **Assignment history tracking** - Full audit trail of all assignment changes
- **Workload balancing** - Intelligent distribution based on user capacity
- **Bulk assignment operations** - Mass assignment of unassigned leads
- **Workload statistics** - Comprehensive workload distribution analytics
- **Permission-based access** - Role-based assignment operations

### **Phase 3: Status Management & Stage Tracking ✅ COMPLETED** 🆕
- **Complete stage workflow management** - Enforced status transition rules
- **Stage progression tracking** - Full history with duration monitoring
- **Performance metrics & analytics** - Comprehensive stage efficiency analysis
- **SLA tracking & compliance** - Service level agreement monitoring
- **Bottleneck identification** - Workflow optimization insights
- **Conversion rate tracking** - Stage-by-stage performance analysis
- **User performance metrics** - Individual and team performance tracking

### **Phase 4: Activity Logging & Follow-ups ✅ COMPLETED** 🆕
- **Comprehensive activity logging** - Track all lead interactions and communications
- **Follow-up management system** - Schedule, track, and manage follow-up activities
- **Priority-based organization** - Urgent, high, medium, low priority levels
- **Activity timeline visualization** - Complete interaction history for each lead
- **Performance analytics** - User and team activity performance metrics
- **Bulk operations** - Mass update follow-up dates and activity statuses
- **Overdue tracking** - Monitor and alert on overdue follow-up activities

### **Phase 5: Analytics & Reporting** ✅ COMPLETED
- **Comprehensive Analytics Dashboard** - Real-time performance metrics and KPIs
- **Lead Analytics** - Detailed lead performance analysis with filtering
- **Platform Performance** - Channel-specific performance metrics
- **User Performance Tracking** - Individual and team performance analytics
- **Conversion Funnel Analysis** - Lead progression through sales pipeline
- **Time-based Analytics** - Daily, weekly, monthly performance trends
- **Activity Analytics** - Comprehensive activity and follow-up metrics
- **SLA Compliance Tracking** - Performance against service level agreements
- **Custom Report Builder** - Create and save report templates
- **Scheduled Reports** - Automated report generation and delivery
- **Data Export** - JSON and CSV export functionality
- **Report Templates** - Reusable report configurations
- **Advanced Filtering** - Multi-dimensional data analysis

---

## 📝 **API Response Standards**

### **Success Response Format**
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Operation completed successfully" // optional
}
```

### **Error Response Format**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [ /* validation errors */ ] // optional
}
```

### **HTTP Status Codes**
- **200** - Success
- **201** - Created
- **400** - Bad Request (validation errors)
- **401** - Unauthorized (missing/invalid token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **500** - Internal Server Error

---

## 🔒 **Security & Best Practices**

### **API Security**
- Always use HTTPS in production
- Implement rate limiting for webhook endpoints
- Validate and sanitize all input data
- Use parameterized queries to prevent SQL injection

### **Entity Isolation**
- Never expose entity_id in public endpoints
- Always validate entity access in middleware
- Implement proper error handling for cross-entity access attempts

### **Assignment Security** 🆕 **PHASE 2**
- Only managers and admins can perform bulk assignments
- Users can only assign leads within their entity
- Complete audit trail of all assignment operations
- Workload limits prevent overloading users

### **Stage Management Security** 🆕 **PHASE 3**
- Workflow rules prevent invalid status transitions
- Complete audit trail of all stage changes
- SLA monitoring for compliance tracking
- Performance metrics for optimization insights

### **Activity Management Security** 🆕 **PHASE 4**
- Complete activity audit trail for all lead interactions
- Entity-scoped activity access and management
- Priority-based organization for efficient follow-up management
- Comprehensive performance tracking and analytics

### **Activity Management Security** 🆕 **PHASE 4**
- Complete activity audit trail for all lead interactions
- Entity-scoped activity access and management
- Priority-based organization for efficient follow-up management
- Comprehensive performance tracking and analytics

### **Token Management**
- Use short-lived access tokens (72h default)
- Implement token refresh mechanism
- Store sensitive tokens securely
- Rotate API keys regularly

---

## 📞 **Support & Documentation**

### **Technical Support**
For technical support or questions:
1. Check application logs for detailed error messages
2. Verify database schema matches expected structure
3. Ensure all required middleware is properly configured
4. Review entity isolation and access control setup

### **API Versioning**
Current API version: **v1.0**
- All endpoints are under `/api` prefix
- Backward compatibility maintained within major versions
- Breaking changes will be communicated in advance

---

## 🔮 **Future Enhancements**

### **Planned Features**
- Advanced assignment algorithms
- Workflow automation
- Predictive lead scoring
- Advanced reporting dashboard
- Mobile application
- Real-time notifications
- Integration with third-party tools

### **Scalability Considerations**
- Database partitioning by entity
- Caching strategies for frequently accessed data
- API rate limiting per entity
- Multi-region deployment support

---

**Last Updated**: June 2024  
**Version**: 1.0.0  
**Status**: Phase 1 Complete ✅, Phase 2 Complete ✅, Phase 3 Complete ✅, Phase 4 Complete ✅, Phase 5 Complete ✅
