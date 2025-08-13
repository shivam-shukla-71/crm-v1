const router = require('express').Router();
const EntityController = require('../controllers/entity.controller');
const { requireAdmin } = require('../middlewares/role.middleware');
const { verifyToken } = require('../middlewares/auth.middleware');

// Import validation schemas
const {
    createEntitySchema,
    updateEntitySchema,
    entityIdSchema,
    entityNameSchema
} = require('../validations/entity.validation');

// Validation middleware function
const validateRequest = (schema) => {
    return (req, res, next) => {
        try {
            const validatedData = schema.parse({
                ...req.body,
                ...req.params,
                ...req.query
            });
            req.validatedData = validatedData;
            next();
        } catch (error) {
            if (error.errors) {
                const messages = error.errors.map(err => err.message);
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: messages
                });
            }
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    };
};

// Admin-only endpoints (require authentication and admin role)
router.get('/', verifyToken, requireAdmin, EntityController.listEntities);
router.get('/:id', verifyToken, requireAdmin, validateRequest(entityIdSchema), EntityController.getEntityById);
router.get('/name/:name', verifyToken, requireAdmin, validateRequest(entityNameSchema), EntityController.getEntityByName);

// Admin-only CRUD operations
router.post('/', verifyToken, requireAdmin, validateRequest(createEntitySchema), EntityController.createEntity);
router.put('/:id', verifyToken, requireAdmin, validateRequest(updateEntitySchema), EntityController.updateEntity);
router.delete('/:id', verifyToken, requireAdmin, validateRequest(entityIdSchema), EntityController.deleteEntity);

module.exports = router;
