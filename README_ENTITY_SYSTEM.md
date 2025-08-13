# Entity-Based User and Task Management System

## Overview

This document describes the implementation of an entity-based multi-tenant system for the CRM application. The system allows multiple companies (entities) to operate within the same CRM instance while maintaining data isolation and proper access control.

## Architecture

### Core Components

1. **Entities Table**: Central table storing company/entity information
2. **Users Table**: Enhanced with `entity_id` foreign key reference
3. **Leads Tables**: Enhanced with `entity_id` for data isolation
4. **JWT Tokens**: Include `entity_id` in payload for authorization
5. **Admin-Only Management**: Entity CRUD operations restricted to admin users

### Database Schema

#### Entities Table
```sql
CREATE TABLE entities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) UNIQUE NOT NULL           -- Internal identifier (e.g., 'fxcareers')
);
```

#### Enhanced Users Table
```sql
ALTER TABLE users ADD COLUMN entity_id INT NOT NULL;
ALTER TABLE users ADD CONSTRAINT fk_users_entity 
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE RESTRICT;
```

#### Enhanced Leads Tables
```sql
-- lead_meta table
ALTER TABLE lead_meta ADD COLUMN entity_id INT NOT NULL;
ALTER TABLE lead_meta ADD CONSTRAINT fk_leadmeta_entity 
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE RESTRICT;

-- lead_data table  
ALTER TABLE lead_data ADD COLUMN entity_id INT NOT NULL;
ALTER TABLE lead_data ADD CONSTRAINT fk_leaddata_entity 
    FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE RESTRICT;
```

## Default Entities

The system comes pre-configured with three entities:

1. **fxcareers** (ID: 1) - FX Careers company entity
2. **yamarkets** (ID: 2) - YA Markets company entity  
3. **nxgmarkets** (ID: 3) - NXG Markets company entity

## API Endpoints

### Entity Management (Admin Only)

#### List All Entities
```
GET /api/entities
Authorization: Bearer <admin_token>
```

#### Get Entity by ID
```
GET /api/entities/:id
Authorization: Bearer <admin_token>
```

#### Get Entity by Name
```
GET /api/entities/name/:name
Authorization: Bearer <admin_token>
```

#### Create New Entity
```
POST /api/entities
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "name": "newcompany"
}
```

#### Update Entity
```
PUT /api/entities/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "name": "updatedcompany"
}
```

#### Delete Entity
```
DELETE /api/entities/:id
Authorization: Bearer <admin_token>
```

### Enhanced User Management

#### List Users by Entity
```
GET /api/auth/users/entity/:entityId
Authorization: Bearer <manager_or_admin_token>
```

#### Create User with Entity
```
POST /api/auth/users
Authorization: Bearer <admin_token>
Content-Type: application/json

{
    "username": "newuser",
    "email": "user@company.com",
    "password": "SecurePass123",
    "first_name": "John",
    "last_name": "Doe",
    "role_id": 3,
    "entity_id": 1,
    "phone": "+1234567890"
}
```

## Authentication & Authorization

### JWT Token Payload
```json
{
    "user_id": 123,
    "email": "user@company.com",
    "role_id": 2,
    "entity_id": 1,
    "iat": 1234567890,
    "exp": 1234567890
}
```

### Login Response
```json
{
    "success": true,
    "data": {
        "user": {
            "username": "john_doe",
            "email": "john@company.com",
            "phone": "+1234567890",
            "role": "manager",
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

## Data Isolation

### User Isolation
- Users can only access data within their assigned entity
- User creation requires specifying an `entity_id`
- Users cannot be moved between entities without admin intervention

### Lead Isolation
- All leads are associated with a specific entity
- Lead queries automatically filter by user's entity
- Cross-entity data access is prevented

## Security Features

### Admin-Only Access
- Entity CRUD operations restricted to admin users (`role_id = 1`)
- Entity deletion prevented if users or leads exist
- Comprehensive validation and error handling

### Data Validation
- Entity names must be alphanumeric with underscores only
- Foreign key constraints prevent orphaned records
- Input sanitization and validation using Zod schemas

## Installation

### For New Installations
1. Run the complete `database.sql` script
2. The system will be ready with default entities

## Usage Examples

### Creating a New Entity
```javascript
// Admin user creates a new entity
const response = await fetch('/api/entities', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + adminToken,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        name: 'techcorp'
    })
});
```

### User Login and Entity Access
```javascript
// User logs in and receives entity information
const loginResponse = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'user@company.com',
        password: 'password123'
    })
});

const { user, access_token } = loginResponse.data;
console.log(`User belongs to: ${user.entity.name}`);

// Use entity_id in subsequent requests
const usersResponse = await fetch(`/api/auth/users/entity/${user.entity.id}`, {
    headers: { 'Authorization': 'Bearer ' + access_token }
});
```

## Error Handling

### Common Error Responses

#### Entity Not Found
```json
{
    "success": false,
    "message": "Entity not found"
}
```

#### Validation Errors
```json
{
    "success": false,
    "message": "Validation failed",
    "errors": [
        "Entity name can only contain letters, numbers, and underscores",
        "Entity name must be at least 2 characters"
    ]
}
```

#### Permission Denied
```json
{
    "success": false,
    "message": "Admin access required"
}
```

#### Entity Deletion Prevention
```json
{
    "success": false,
    "message": "Cannot delete entity with associated users"
}
```

## Best Practices

### Entity Naming
- Use lowercase with underscores (e.g., `fxcareers`, `yamarkets`)
- Keep names short and descriptive
- Avoid special characters except underscores

### User Management
- Always assign users to appropriate entities during creation
- Use entity-based user listing for better performance
- Implement entity-based access control in frontend

### Data Queries
- Always include entity filtering in lead queries
- Use entity_id from JWT token for data isolation
- Implement proper error handling for cross-entity access attempts

## Troubleshooting

### Common Issues

1. **Foreign Key Constraint Errors**
   - Ensure entities exist before creating users
   - Check entity_id values in existing data

2. **Authentication Issues**
   - Verify JWT token includes entity_id
   - Check user entity assignment
   - Validate role permissions

### Support

For technical support or questions about the entity system:
1. Check the application logs for detailed error messages
2. Verify database schema matches expected structure
3. Ensure all required middleware is properly configured

## Future Enhancements

### Planned Features
- Entity-specific configuration settings
- Cross-entity reporting (admin only)
- Entity-based billing and quotas
- Advanced entity management dashboard

### Scalability Considerations
- Entity-based caching strategies
- Database partitioning by entity
- Multi-region entity support
- Entity-specific API rate limiting
