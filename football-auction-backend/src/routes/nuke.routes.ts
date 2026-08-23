import { Router } from 'express';
import { NukeService } from '../services/nuke.service';
import { authenticate } from '../middlewares/auth.middleware';
import { roleGuard } from '../middlewares/roleGuard.middleware';
import { Role } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler.middleware';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';

const router = Router();

// Middleware to verify Super Admin password confirmation for destructive Nuke operations
async function verifyAdminPassword(req: any, _res: any, next: any) {
  try {
    const { password } = req.body;
    if (!password) {
      throw new AppError(400, 'Super Admin password is required to authorize lifecycle reset');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user) throw new AppError(404, 'User not found');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new AppError(401, 'Invalid Super Admin password. Action aborted.');
    }

    next();
  } catch (err) {
    next(err);
  }
}

// Level 1: Tournament Wipe
router.post(
  '/level1',
  authenticate,
  roleGuard(Role.SUPER_ADMIN),
  verifyAdminPassword,
  async (req: any, res, next) => {
    try {
      const result = await NukeService.level1TournamentWipe(req.user.userId);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Level 2: Roster Wipe
router.post(
  '/level2',
  authenticate,
  roleGuard(Role.SUPER_ADMIN),
  verifyAdminPassword,
  async (req: any, res, next) => {
    try {
      const result = await NukeService.level2RosterWipe(req.user.userId);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

// Level 3: Factory Reset
router.post(
  '/level3',
  authenticate,
  roleGuard(Role.SUPER_ADMIN),
  verifyAdminPassword,
  async (req: any, res, next) => {
    try {
      const result = await NukeService.level3FactoryReset(req.user.userId);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
