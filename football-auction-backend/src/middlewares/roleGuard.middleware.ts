import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.middleware';
import { Role } from '@prisma/client';

export function roleGuard(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Unauthorized: User authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, `Forbidden: User role '${req.user.role}' is not authorized for this resource`));
    }

    next();
  };
}
