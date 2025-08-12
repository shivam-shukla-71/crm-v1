const router = require('express').Router();
const AuthController = require('../controllers/auth.controller');
const { validateRequest, registerUserSchema, loginUserSchema, verifyOTPSchema, passwordResetRequestSchema, passwordResetSchema, emailUpdateRequestSchema, emailUpdateVerifySchema } = require('../validations/auth.validation');
const { verifyToken, verifyShortLivedToken } = require('../middlewares/auth.middleware');
const { requireAdmin, requireManagerOrAdmin, canManageUser, canChangeRole, canDeleteUser } = require('../middlewares/role.middleware');

// Public auth
router.post('/register', validateRequest(registerUserSchema), AuthController.register);
router.post('/verify-otp', validateRequest(verifyOTPSchema), AuthController.verifyOTP);
router.post('/login', validateRequest(loginUserSchema), AuthController.login);

// Password reset (public)
router.post('/password/request', validateRequest(passwordResetRequestSchema), AuthController.requestPasswordReset);
router.post('/password/verify-otp', validateRequest(verifyOTPSchema.pick({ email: true, otp: true })), AuthController.verifyPasswordOTP);
router.post('/password/update', validateRequest(passwordResetSchema), verifyShortLivedToken, AuthController.updatePassword);

// Email update (authenticated)
router.post('/email/request', verifyToken, validateRequest(emailUpdateRequestSchema), AuthController.requestEmailUpdate);
router.post('/email/verify', verifyToken, validateRequest(emailUpdateVerifySchema), AuthController.verifyEmailUpdate);

// Admin/manager user management
router.get('/users', verifyToken, requireManagerOrAdmin, AuthController.listUsers);
router.post('/users', verifyToken, requireAdmin, validateRequest(registerUserSchema), AuthController.createUser);
router.put('/users/:id', verifyToken, canManageUser, AuthController.updateUser);
router.patch('/users/:id/role', verifyToken, canChangeRole, AuthController.changeUserRole);
router.delete('/users/:id', verifyToken, canDeleteUser, AuthController.deleteUser);

module.exports = router;
