import { Router } from 'express';
import { PlayerController } from '../controllers/player.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { roleGuard } from '../middlewares/roleGuard.middleware';
import { phaseGuard } from '../middlewares/phaseGuard.middleware';
import { validate } from '../middlewares/validate.middleware';
import { Role, Phase, Position, RegistrationStatus } from '@prisma/client';
import { z } from 'zod';

const router = Router();

const registerPlayerSchema = z.object({
  body: z.object({
    seasonId: z.string().uuid(),
    position: z.nativeEnum(Position),
    secondaryPosition: z.nativeEnum(Position).optional(),
    jerseyNumber: z.number().int().positive().optional(),
  }),
});

const verifyPlayerSchema = z.object({
  body: z.object({
    status: z.nativeEnum(RegistrationStatus),
    categoryId: z.string().uuid().optional(),
    rejectionReason: z.string().optional(),
  }),
});

// Player submits profile during Phase 2 (REGISTRATION)
router.post(
  '/register',
  authenticate,
  roleGuard(Role.PLAYER),
  phaseGuard(Phase.PLAYER_REGISTRATION),
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
