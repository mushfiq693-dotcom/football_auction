import { Router } from 'express';
import { PlayerController } from '../controllers/player.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { roleGuard } from '../middlewares/roleGuard.middleware';
import { validate } from '../middlewares/validate.middleware';
import { Role, Position, RegistrationStatus } from '@prisma/client';
import { z } from 'zod';

const router = Router();

const registerPlayerSchema = z.object({
  body: z.object({
    seasonId: z.string().uuid().optional().or(z.literal('')),
    studentId: z.string().min(2, 'Student ID is required').optional(),
    academicSession: z.string().min(4, 'Academic session is required').optional(),
    jerseyName: z.string().min(2, 'Jersey name is required').optional(),
    photoUrl: z.string().url().optional().or(z.literal('')),
    photoPublicId: z.string().optional().or(z.literal('')),
    position: z.nativeEnum(Position),
    secondaryPosition: z.nativeEnum(Position).optional().or(z.literal('')).nullable(),
    jerseyNumber: z.preprocess(
      (val) => (val === '' || val === null || val === undefined || Number.isNaN(Number(val)) ? undefined : Number(val)),
      z.number().int().positive().optional()
    ),
  }),
});

const verifyPlayerSchema = z.object({
  body: z.object({
    status: z.nativeEnum(RegistrationStatus),
    categoryId: z.string().uuid().optional(),
    rejectionReason: z.string().optional(),
  }),
});

// Player fetches their own profile
router.get('/me', authenticate, PlayerController.getMyProfile);

// Player creates/updates profile
router.post(
  '/register',
  authenticate,
  roleGuard(Role.PLAYER, Role.SUPER_ADMIN),
  validate(registerPlayerSchema),
  PlayerController.register
);

// Get player roster
router.get('/', PlayerController.getPlayers);

// Admin approves or rejects player profile
router.patch(
  '/:id/verify',
  authenticate,
  roleGuard(Role.SUPER_ADMIN, Role.ADMIN),
  validate(verifyPlayerSchema),
  PlayerController.verifyPlayer
);

export default router;
