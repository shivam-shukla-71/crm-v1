const { z } = require('zod');

// Schemas
const registerUserSchema = z.object({
    username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_]+$/),
    email: z.string().email().max(100),
    password: z.string().min(8).max(100).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    first_name: z.string().min(2).max(50).regex(/^[a-zA-Z\s]+$/),
    last_name: z.string().min(2).max(50).regex(/^[a-zA-Z\s]+$/),
    phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/).max(20).optional(),
    role_id: z.number().int().min(1).max(4).optional().default(3),
    entity_id: z.number().int().positive()
});

const loginUserSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

const verifyOTPSchema = z.object({
    user_id: z.number().int().positive().optional(),
    email: z.string().email().optional(),
    otp: z.string().length(6).regex(/^\d{6}$/),
    type: z.enum(['verification', 'password_reset', 'email_update']).optional()
});

const passwordResetRequestSchema = z.object({
    email: z.string().email()
});

const passwordResetSchema = z.object({
    token: z.string().min(1),
    new_password: z.string().min(8).max(100).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
});

const emailUpdateRequestSchema = z.object({
    new_email: z.string().email().max(100)
});

const emailUpdateVerifySchema = z.object({
    otp: z.string().length(6).regex(/^\d{6}$/)
});

// Middleware
const validateRequest = (schema) => (req, res, next) => {
    try {
        const data = schema.parse(req.body);
        req.validatedData = data;
        next();
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
        }
        next(error);
    }
};

module.exports = {
    registerUserSchema,
    loginUserSchema,
    verifyOTPSchema,
    passwordResetRequestSchema,
    passwordResetSchema,
    emailUpdateRequestSchema,
    emailUpdateVerifySchema,
    validateRequest
};
