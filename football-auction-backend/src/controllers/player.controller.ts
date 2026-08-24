import { Request, Response, NextFunction } from 'express';
import { PlayerService } from '../services/player.service';
import { RegistrationStatus } from '@prisma/client';

export class PlayerController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const player = await PlayerService.registerPlayer(userId, req.body);
      res.status(201).json({
        success: true,
        message: 'Player profile saved successfully',
        data: player,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const player = await PlayerService.getMyProfile(userId);
      res.status(200).json({
        success: true,
        data: player,
      });
    } catch (error) {
      next(error);
    }
  }

  static async setRating(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { rating } = req.body;
      const player = await PlayerService.setPlayerRating(id, Number(rating));
      res.status(200).json({
        success: true,
        message: `Player rating set to ${rating} (${player.category?.name || 'Tier'})`,
        data: player,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPlayers(req: Request, res: Response, next: NextFunction) {
    try {
      const seasonId = req.query.seasonId as string | undefined;
      const status = req.query.status as RegistrationStatus | undefined;
      const categoryId = req.query.categoryId as string | undefined;

      const players = await PlayerService.getPlayers({
        seasonId,
        status,
        categoryId,
      });
      res.status(200).json({
        success: true,
        data: players,
      });
    } catch (error) {
      next(error);
    }
  }

  static async verifyPlayer(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { status, categoryId, rejectionReason } = req.body;
      const player = await PlayerService.verifyPlayer(id, status, categoryId, rejectionReason);
      res.status(200).json({
        success: true,
        message: `Player ${status.toLowerCase()} successfully`,
        data: player,
      });
    } catch (error) {
      next(error);
    }
  }
}
