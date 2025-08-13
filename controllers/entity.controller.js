const EntityService = require('../services/entity.service');

class EntityController {
    // List all entities
    static async listEntities(req, res) {
        try {
            const entities = await EntityService.listEntities();
            return res.json({ success: true, data: entities });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // Get entity by ID
    static async getEntityById(req, res) {
        try {
            const entityId = parseInt(req.params.id);
            if (isNaN(entityId)) {
                return res.status(400).json({ success: false, message: 'Invalid entity ID' });
            }

            const entity = await EntityService.getEntityById(entityId);
            return res.json({ success: true, data: entity });
        } catch (error) {
            if (error.message === 'Entity not found') {
                return res.status(404).json({ success: false, message: error.message });
            }
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // Get entity by name
    static async getEntityByName(req, res) {
        try {
            const { name } = req.params;
            if (!name) {
                return res.status(400).json({ success: false, message: 'Entity name is required' });
            }

            const entity = await EntityService.getEntityByName(name);
            return res.json({ success: true, data: entity });
        } catch (error) {
            if (error.message === 'Entity not found') {
                return res.status(404).json({ success: false, message: error.message });
            }
            return res.status(500).json({ success: false, message: error.message });
        }
    }

    // Create new entity
    static async createEntity(req, res) {
        try {
            const entityData = req.validatedData;
            const created = await EntityService.createEntity(entityData);
            return res.status(201).json({ success: true, data: created });
        } catch (error) {
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    // Update entity
    static async updateEntity(req, res) {
        try {
            const entityId = parseInt(req.params.id);
            if (isNaN(entityId)) {
                return res.status(400).json({ success: false, message: 'Invalid entity ID' });
            }

            const updateData = req.validatedData;
            const updated = await EntityService.updateEntity(entityId, updateData);
            return res.json({ success: true, data: updated });
        } catch (error) {
            if (error.message === 'Entity not found') {
                return res.status(404).json({ success: false, message: error.message });
            }
            return res.status(400).json({ success: false, message: error.message });
        }
    }

    // Delete entity
    static async deleteEntity(req, res) {
        try {
            const entityId = parseInt(req.params.id);
            if (isNaN(entityId)) {
                return res.status(400).json({ success: false, message: 'Invalid entity ID' });
            }

            await EntityService.deleteEntity(entityId);
            return res.json({ success: true, message: 'Entity deleted successfully' });
        } catch (error) {
            if (error.message === 'Entity not found') {
                return res.status(404).json({ success: false, message: error.message });
            }
            return res.status(400).json({ success: false, message: error.message });
        }
    }
}

module.exports = EntityController;
