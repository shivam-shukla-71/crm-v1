const { z } = require('zod');

// Schema for creating an entity
const createEntitySchema = z.object({
    name: z.string()
        .min(2, 'Entity name must be at least 2 characters')
        .max(100, 'Entity name must be less than 100 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Entity name can only contain letters, numbers, and underscores')
});

// Schema for updating an entity
const updateEntitySchema = z.object({
    name: z.string()
        .min(2, 'Entity name must be at least 2 characters')
        .max(100, 'Entity name must be less than 100 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Entity name can only contain letters, numbers, and underscores')
});

// Schema for entity ID parameter
const entityIdSchema = z.object({
    id: z.string().regex(/^\d+$/, 'Entity ID must be a number')
});

// Schema for entity name parameter
const entityNameSchema = z.object({
    name: z.string().min(1, 'Entity name is required')
});

module.exports = {
    createEntitySchema,
    updateEntitySchema,
    entityIdSchema,
    entityNameSchema
};
