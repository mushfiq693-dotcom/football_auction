import { Router } from 'express';
import { AuctionController } from '../controllers/auction.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { roleGuard } from '../middlewares/roleGuard.middleware';
import { validate } from '../middlewares/validate.middleware';
import { Role, AuctionType, AuctionStatus } from '@prisma/client';
import { z } from 'zod';

const router = Router();

const createSessionSchema = z.object({
  body: z.object({
    seasonId: z.string().optional().or(z.literal('')).or(z.literal('default-season')),
    playerId: z.string().min(1, 'Player ID is required'),
    auctionType: z.nativeEnum(AuctionType).optional(),
    timerSeconds: z.number().int().positive().optional(),
  }),
});

const placeBidSchema = z.object({
  body: z.object({
    auctionSessionId: z.string().min(1, 'Auction Session ID is required'),
    teamId: z.string().optional().or(z.literal('')),
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

// Podium Admin launches lot (Open Bid or Blind Bid)
router.post(
  '/session',
  authenticate,
  roleGuard(Role.SUPER_ADMIN, Role.ADMIN),
  validate(createSessionSchema),
  AuctionController.createSession
);

// Place Real-time Bid
router.post(
  '/bid',
  authenticate,
  roleGuard(Role.TEAM_OWNER, Role.SUPER_ADMIN, Role.ADMIN),
  validate(placeBidSchema),
  AuctionController.placeBid
);

// Pause / Resume Stage
router.patch(
  '/session/:id/status',
  authenticate,
  roleGuard(Role.SUPER_ADMIN, Role.ADMIN),
  validate(updateStatusSchema),
  AuctionController.updateStatus
);

// Finalize Lot (Hammer Knock)
router.post(
  '/session/:id/finalize',
  authenticate,
  roleGuard(Role.SUPER_ADMIN, Role.ADMIN),
  AuctionController.finalizeAuction
);

// Rollback Lot
router.post(
  '/session/:id/rollback',
  authenticate,
  roleGuard(Role.SUPER_ADMIN, Role.ADMIN),
  AuctionController.rollback
);

// On-the-fly Dynamic Overrides (Timer / Base Price Adjustments for Live Disputes)
router.patch(
  '/session/:id/override',
  authenticate,
  roleGuard(Role.SUPER_ADMIN, Role.ADMIN),
  AuctionController.overrideSession
);

export default router;
