const EntityModel = require('../models/entity.model');

class EntityService {
    static async listEntities() {
        try {
            return await EntityModel.findAll();
        } catch (error) {
            throw new Error(`Failed to list entities: ${error.message}`);
        }
    }

    static async getEntityById(id) {
        try {
            const entity = await EntityModel.findById(id);
            if (!entity) {
                throw new Error('Entity not found');
            }
            return entity;
        } catch (error) {
            throw new Error(`Failed to get entity: ${error.message}`);
        }
    }

    static async getEntityByName(name) {
        try {
            const entity = await EntityModel.findByName(name);
            if (!entity) {
                throw new Error('Entity not found');
            }
            return entity;
        } catch (error) {
            throw new Error(`Failed to get entity: ${error.message}`);
        }
    }

    static async createEntity(entityData) {
        try {
            // Validate required fields
            if (!entityData.name) {
                throw new Error('Entity name is required');
            }

            // Check if name already exists
            const nameExists = await EntityModel.nameExists(entityData.name);
            if (nameExists) {
                throw new Error('Entity name already exists');
            }

            // Validate name format (alphanumeric and underscores only)
            if (!/^[a-zA-Z0-9_]+$/.test(entityData.name)) {
                throw new Error('Entity name can only contain letters, numbers, and underscores');
            }

            return await EntityModel.create(entityData);
        } catch (error) {
            throw new Error(`Failed to create entity: ${error.message}`);
        }
    }

    static async updateEntity(id, updateData) {
        try {
            // Check if entity exists
            const entityExists = await EntityModel.exists(id);
            if (!entityExists) {
                throw new Error('Entity not found');
            }

            // If updating name, check for conflicts
            if (updateData.name) {
                const nameExists = await EntityModel.nameExists(updateData.name, id);
                if (nameExists) {
                    throw new Error('Entity name already exists');
                }

                // Validate name format
                if (!/^[a-zA-Z0-9_]+$/.test(updateData.name)) {
                    throw new Error('Entity name can only contain letters, numbers, and underscores');
                }
            }

            const success = await EntityModel.update(id, updateData);
            if (!success) {
                throw new Error('No valid fields to update');
            }

            return await EntityModel.findById(id);
        } catch (error) {
            throw new Error(`Failed to update entity: ${error.message}`);
        }
    }

    static async deleteEntity(id) {
        try {
            // Check if entity exists
            const entityExists = await EntityModel.exists(id);
            if (!entityExists) {
                throw new Error('Entity not found');
            }

            await EntityModel.delete(id);
            return true;
        } catch (error) {
            throw new Error(`Failed to delete entity: ${error.message}`);
        }
    }
}

module.exports = EntityService;
