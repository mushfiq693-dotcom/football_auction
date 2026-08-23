import { Router } from 'express';
import { TournamentController } from '../controllers/tournament.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { roleGuard } from '../middlewares/roleGuard.middleware';
import { phaseGuard } from '../middlewares/phaseGuard.middleware';
import { validate } from '../middlewares/validate.middleware';
import { Role, Phase, MatchStatus } from '@prisma/client';
import { z } from 'zod';

const router = Router();

const createTournamentSchema = z.object({
  body: z.object({
    seasonId: z.string().uuid(),
    name: z.string().min(2),
    format: z.string().optional(),
  }),
});

const generateFixturesSchema = z.object({
  body: z.object({
    seasonId: z.string().uuid(),
    isTwoLegged: z.boolean().optional(),
  }),
});

const updateMatchSchema = z.object({
  body: z.object({
    homeScore: z.number().int().nonnegative(),
    awayScore: z.number().int().nonnegative(),
    status: z.nativeEnum(MatchStatus),
    playerPerformances: z
      .array(
        z.object({
          playerId: z.string().uuid(),
          goals: z.number().int().nonnegative().default(0),
          assists: z.number().int().nonnegative().default(0),
          yellowCards: z.number().int().nonnegative().default(0),
          redCards: z.number().int().nonnegative().default(0),
        })
      )
      .optional(),
  }),
});

router.post(
  '/',
  authenticate,
  roleGuard(Role.SUPER_ADMIN, Role.ADMIN),
  validate(createTournamentSchema),
  TournamentController.createTournament
);

router.post(
  '/:id/fixtures',
  authenticate,
  roleGuard(Role.SUPER_ADMIN, Role.ADMIN),
  validate(generateFixturesSchema),
  TournamentController.generateFixtures
);

router.patch(
  '/match/:matchId',
  authenticate,
  roleGuard(Role.SUPER_ADMIN, Role.ADMIN),
  phaseGuard(Phase.LIVE_TOURNAMENT),
  validate(updateMatchSchema),
  TournamentController.updateMatchResult
);

router.get('/:id/standings', TournamentController.getStandings);
router.get('/:id/matches', TournamentController.getMatches);
router.get('/:id/statistics', TournamentController.getPlayerStatistics);

export default router;
