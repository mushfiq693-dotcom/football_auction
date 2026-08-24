import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { Role } from '@prisma/client';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({
        success: true,
        message: result.message || 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(req.body);
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.getCurrentUser(req.user!.userId);
      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const roleFilter = req.query.role as Role | undefined;
      const users = await AuthService.getAllUsers(roleFilter);
      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPendingUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const roleFilter = req.query.role as Role | undefined;
      const pendingUsers = await AuthService.getPendingUsers(roleFilter);
      res.status(200).json({
        success: true,
        data: pendingUsers,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyUser(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const { approved } = req.body;
      const result = await AuthService.verifyUser(userId, approved);
      res.status(200).json({
        success: true,
        message: `User registration ${approved ? 'approved' : 'rejected'} successfully`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const targetUserId = req.params.userId as string;
      const requestingUserId = req.user!.userId;
      const result = await AuthService.deleteUser(targetUserId, requestingUserId);
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}
