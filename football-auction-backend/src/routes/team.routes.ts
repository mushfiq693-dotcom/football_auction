import { Router } from 'express';
import { TeamController } from '../controllers/team.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { roleGuard } from '../middlewares/roleGuard.middleware';
import { validate } from '../middlewares/validate.middleware';
import { Role } from '@prisma/client';
import { z } from 'zod';

const router = Router();

const createTeamSchema = z.object({
  body: z.object({
    seasonId: z.string().uuid(),
    ownerId: z.string().uuid(),
    name: z.string().min(2),
    code: z.string().min(2).max(4),
    logoUrl: z.string().optional(),
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    allocatedBudget: z.number().positive(),
    maxPlayerLimit: z.number().int().positive().optional(),
  }),
});

router.post(
  '/',
  authenticate,
  roleGuard(Role.SUPER_ADMIN),
  validate(createTeamSchema),
  TeamController.createTeam
);

router.get('/', TeamController.getTeams);
router.get('/:id', TeamController.getTeamById);

export default router;
