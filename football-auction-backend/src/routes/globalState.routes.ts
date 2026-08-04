import { Router } from 'express';
import { GlobalStateController } from '../controllers/globalState.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { roleGuard } from '../middlewares/roleGuard.middleware';
import { validate } from '../middlewares/validate.middleware';
import { Role, Phase } from '@prisma/client';
import { z } from 'zod';

const router = Router();

const updatePhaseSchema = z.object({
  body: z.object({
    phase: z.nativeEnum(Phase),
  }),
});

router.get('/', GlobalStateController.getState);
router.post(
  '/phase',
  authenticate,
  roleGuard(Role.SUPER_ADMIN, Role.ADMIN),
  validate(updatePhaseSchema),
  GlobalStateController.updatePhase
);

export default router;
