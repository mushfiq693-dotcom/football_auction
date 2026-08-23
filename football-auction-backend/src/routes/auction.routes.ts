import { Router } from 'express';
import { AuctionController } from '../controllers/auction.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { roleGuard } from '../middlewares/roleGuard.middleware';
import { phaseGuard } from '../middlewares/phaseGuard.middleware';
import { validate } from '../middlewares/validate.middleware';
import { Role, Phase, AuctionType, AuctionStatus } from '@prisma/client';
import { z } from 'zod';

const router = Router();

const createSessionSchema = z.object({
  body: z.object({
    seasonId: z.string().uuid(),
    playerId: z.string().uuid(),
    auctionType: z.nativeEnum(AuctionType).optional(),
    timerSeconds: z.number().int().positive().optional(),
  }),
});

const placeBidSchema = z.object({
  body: z.object({
    auctionSessionId: z.string().uuid(),
    teamId: z.string().uuid(),
    amount: z.number().positive(),
    isBlindBid: z.boolean().optional(),
  }),
});

const updateStatusSchema = z.object({
  body: z.object({
    status: z.nativeEnum(AuctionStatus),
  }),
});

// Get current active auction stage session
router.get('/active', AuctionController.getActiveSession);

// Get unsold players pool for Podium Admin
router.get('/unsold-pool', AuctionController.getUnsoldPool);

// Auction routes guarded for LIVE_AUCTION phase
router.post(
  '/session',
  authenticate,
  roleGuard(Role.SUPER_ADMIN, Role.ADMIN),
  phaseGuard(Phase.LIVE_AUCTION),
  validate(createSessionSchema),
  AuctionController.createSession
);

router.post(
  '/bid',
  authenticate,
  roleGuard(Role.TEAM_OWNER, Role.SUPER_ADMIN, Role.ADMIN),
  phaseGuard(Phase.LIVE_AUCTION),
  validate(placeBidSchema),
  AuctionController.placeBid
);

router.patch(
  '/session/:id/status',
  authenticate,
  roleGuard(Role.SUPER_ADMIN, Role.ADMIN),
  phaseGuard(Phase.LIVE_AUCTION),
  validate(updateStatusSchema),
  AuctionController.updateStatus
);

router.post(
  '/session/:id/finalize',
  authenticate,
  roleGuard(Role.SUPER_ADMIN, Role.ADMIN),
  phaseGuard(Phase.LIVE_AUCTION),
  AuctionController.finalizeAuction
);

router.post(
  '/session/:id/rollback',
  authenticate,
  roleGuard(Role.SUPER_ADMIN, Role.ADMIN),
  phaseGuard(Phase.LIVE_AUCTION),
  AuctionController.rollback
);

export default router;
