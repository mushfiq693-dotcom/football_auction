"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const roleGuard_middleware_1 = require("../middlewares/roleGuard.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
        fullName: zod_1.z.string().min(2, 'Full name is required'),
        role: zod_1.z.enum(['SUPER_ADMIN', 'ADMIN', 'TEAM_OWNER', 'PLAYER', 'PUBLIC_GUEST']).optional(),
        phone: zod_1.z.string().optional(),
    }),
});
const loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
});
const verifyUserSchema = zod_1.z.object({
    body: zod_1.z.object({
        approved: zod_1.z.boolean(),
    }),
});
router.post('/register', (0, validate_middleware_1.validate)(registerSchema), auth_controller_1.AuthController.register);
router.post('/login', (0, validate_middleware_1.validate)(loginSchema), auth_controller_1.AuthController.login);
router.get('/me', auth_middleware_1.authenticate, auth_controller_1.AuthController.me);
// Super Admin & Admin User Directory Endpoints
router.get('/users', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN), auth_controller_1.AuthController.getAllUsers);
router.get('/pending-users', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.SUPER_ADMIN), auth_controller_1.AuthController.getPendingUsers);
router.patch('/verify-user/:userId', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.SUPER_ADMIN), (0, validate_middleware_1.validate)(verifyUserSchema), auth_controller_1.AuthController.verifyUser);
// Backward-compatible endpoints
router.get('/pending-admins', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.SUPER_ADMIN), auth_controller_1.AuthController.getPendingUsers);
router.patch('/verify-admin/:userId', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.SUPER_ADMIN), (0, validate_middleware_1.validate)(verifyUserSchema), auth_controller_1.AuthController.verifyUser);
exports.default = router;
