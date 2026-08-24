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
    seasonId: z.string().optional().or(z.literal('')),
    studentId: z.string().optional().or(z.literal('')),
    academicSession: z.string().optional().or(z.literal('')),
    jerseyName: z.string().optional().or(z.literal('')),
    fullName: z.string().optional().or(z.literal('')),
    photoUrl: z.string().optional().or(z.literal('')), // Supports both Base64 Data URLs & web URLs
    photoPublicId: z.string().optional().or(z.literal('')),
    position: z.nativeEnum(Position).optional().default(Position.FORWARD),
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
    categoryId: z.string().optional().or(z.literal('')),
    rejectionReason: z.string().optional().or(z.literal('')),
  }),
});

const setRatingSchema = z.object({
  body: z.object({
    rating: z.number().min(1).max(99),
  }),
});

// Player fetches their own profile
router.get('/me', authenticate, PlayerController.getMyProfile);

// Player creates/updates profile (accepts direct photos & data URLs)
router.post(
  '/register',
  authenticate,
  roleGuard(Role.PLAYER, Role.SUPER_ADMIN, Role.ADMIN),
  validate(registerPlayerSchema),
  PlayerController.register
);

// Get player roster
router.get('/', PlayerController.getPlayers);

// Podium Admin / Super Admin sets rating & tier
router.patch(
  '/:id/rating',
  authenticate,
  roleGuard(Role.SUPER_ADMIN, Role.ADMIN),
  validate(setRatingSchema),
  PlayerController.setRating
);

// Admin approves or rejects player profile
router.patch(
  '/:id/verify',
  authenticate,
  roleGuard(Role.SUPER_ADMIN, Role.ADMIN),
  validate(verifyPlayerSchema),
  PlayerController.verifyPlayer
);

export default router;
