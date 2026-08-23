import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { roleGuard } from '../middlewares/roleGuard.middleware';
import { validate } from '../middlewares/validate.middleware';
import { Role } from '@prisma/client';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(2, 'Full name is required'),
    role: z.enum(['SUPER_ADMIN', 'ADMIN', 'TEAM_OWNER', 'PLAYER', 'PUBLIC_GUEST']).optional(),
    phone: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const verifyUserSchema = z.object({
  body: z.object({
    approved: z.boolean(),
  }),
});

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.get('/me', authenticate, AuthController.me);

// Super Admin User Approval Endpoints
router.get('/pending-users', authenticate, roleGuard(Role.SUPER_ADMIN), AuthController.getPendingUsers);
router.patch('/verify-user/:userId', authenticate, roleGuard(Role.SUPER_ADMIN), validate(verifyUserSchema), AuthController.verifyUser);

// Backward-compatible endpoints
router.get('/pending-admins', authenticate, roleGuard(Role.SUPER_ADMIN), AuthController.getPendingUsers);
router.patch('/verify-admin/:userId', authenticate, roleGuard(Role.SUPER_ADMIN), validate(verifyUserSchema), AuthController.verifyUser);

export default router;
