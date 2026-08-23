"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auction_controller_1 = require("../controllers/auction.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const roleGuard_middleware_1 = require("../middlewares/roleGuard.middleware");
const phaseGuard_middleware_1 = require("../middlewares/phaseGuard.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const createSessionSchema = zod_1.z.object({
    body: zod_1.z.object({
        seasonId: zod_1.z.string().uuid(),
        playerId: zod_1.z.string().uuid(),
        auctionType: zod_1.z.nativeEnum(client_1.AuctionType).optional(),
        timerSeconds: zod_1.z.number().int().positive().optional(),
    }),
});
const placeBidSchema = zod_1.z.object({
    body: zod_1.z.object({
        auctionSessionId: zod_1.z.string().uuid(),
        teamId: zod_1.z.string().uuid(),
        amount: zod_1.z.number().positive(),
        isBlindBid: zod_1.z.boolean().optional(),
    }),
});
const updateStatusSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.nativeEnum(client_1.AuctionStatus),
    }),
});
// Get current active auction stage session
router.get('/active', auction_controller_1.AuctionController.getActiveSession);
// Get unsold players pool for Podium Admin
router.get('/unsold-pool', auction_controller_1.AuctionController.getUnsoldPool);
// Auction routes guarded for LIVE_AUCTION phase
router.post('/session', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN), (0, phaseGuard_middleware_1.phaseGuard)(client_1.Phase.LIVE_AUCTION), (0, validate_middleware_1.validate)(createSessionSchema), auction_controller_1.AuctionController.createSession);
router.post('/bid', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.TEAM_OWNER, client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN), (0, phaseGuard_middleware_1.phaseGuard)(client_1.Phase.LIVE_AUCTION), (0, validate_middleware_1.validate)(placeBidSchema), auction_controller_1.AuctionController.placeBid);
router.patch('/session/:id/status', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN), (0, phaseGuard_middleware_1.phaseGuard)(client_1.Phase.LIVE_AUCTION), (0, validate_middleware_1.validate)(updateStatusSchema), auction_controller_1.AuctionController.updateStatus);
router.post('/session/:id/finalize', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN), (0, phaseGuard_middleware_1.phaseGuard)(client_1.Phase.LIVE_AUCTION), auction_controller_1.AuctionController.finalizeAuction);
router.post('/session/:id/rollback', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN), (0, phaseGuard_middleware_1.phaseGuard)(client_1.Phase.LIVE_AUCTION), auction_controller_1.AuctionController.rollback);
exports.default = router;
