"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tournament_controller_1 = require("../controllers/tournament.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const roleGuard_middleware_1 = require("../middlewares/roleGuard.middleware");
const phaseGuard_middleware_1 = require("../middlewares/phaseGuard.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const createTournamentSchema = zod_1.z.object({
    body: zod_1.z.object({
        seasonId: zod_1.z.string().uuid(),
        name: zod_1.z.string().min(2),
        format: zod_1.z.string().optional(),
    }),
});
const generateFixturesSchema = zod_1.z.object({
    body: zod_1.z.object({
        seasonId: zod_1.z.string().uuid(),
        isTwoLegged: zod_1.z.boolean().optional(),
    }),
});
const updateMatchSchema = zod_1.z.object({
    body: zod_1.z.object({
        homeScore: zod_1.z.number().int().nonnegative(),
        awayScore: zod_1.z.number().int().nonnegative(),
        status: zod_1.z.nativeEnum(client_1.MatchStatus),
        playerPerformances: zod_1.z
            .array(zod_1.z.object({
            playerId: zod_1.z.string().uuid(),
            goals: zod_1.z.number().int().nonnegative().default(0),
            assists: zod_1.z.number().int().nonnegative().default(0),
            yellowCards: zod_1.z.number().int().nonnegative().default(0),
            redCards: zod_1.z.number().int().nonnegative().default(0),
        }))
            .optional(),
    }),
});
router.post('/', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN), (0, validate_middleware_1.validate)(createTournamentSchema), tournament_controller_1.TournamentController.createTournament);
router.post('/:id/fixtures', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN), (0, validate_middleware_1.validate)(generateFixturesSchema), tournament_controller_1.TournamentController.generateFixtures);
router.patch('/match/:matchId', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN), (0, phaseGuard_middleware_1.phaseGuard)(client_1.Phase.LIVE_TOURNAMENT), (0, validate_middleware_1.validate)(updateMatchSchema), tournament_controller_1.TournamentController.updateMatchResult);
router.get('/:id/standings', tournament_controller_1.TournamentController.getStandings);
router.get('/:id/matches', tournament_controller_1.TournamentController.getMatches);
router.get('/:id/statistics', tournament_controller_1.TournamentController.getPlayerStatistics);
exports.default = router;
