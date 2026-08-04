import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

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

  static async getPendingAdmins(_req: Request, res: Response, next: NextFunction) {
    try {
      const pendingAdmins = await AuthService.getPendingAdmins();
      res.status(200).json({
        success: true,
        data: pendingAdmins,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.params.userId as string;
      const { approved } = req.body;
      const result = await AuthService.verifyAdmin(userId, approved);
      res.status(200).json({
        success: true,
        message: `Admin registration ${approved ? 'approved' : 'rejected'} successfully`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
