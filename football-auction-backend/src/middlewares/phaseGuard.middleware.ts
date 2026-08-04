import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.middleware';
import { prisma } from '../config/database';
import { Phase, Role } from '@prisma/client';

export function phaseGuard(...allowedPhases: Phase[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Super admins and admins bypass phase restrictions for management
      if (req.user && (req.user.role === Role.SUPER_ADMIN || req.user.role === Role.ADMIN)) {
        return next();
      }

      const globalState = await prisma.globalState.findFirst({
        orderBy: { updatedAt: 'desc' },
      });

      const currentPhase = globalState?.activePhase || Phase.SETUP;

      if (!allowedPhases.includes(currentPhase)) {
        return next(
          new AppError(
            403,
            `Phase Conflict: Action not permitted in current phase '${currentPhase}'. Allowed phase(s): ${allowedPhases.join(', ')}`
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
