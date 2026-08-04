import { Request, Response, NextFunction } from 'express';
import { TeamService } from '../services/team.service';

export class TeamController {
  static async createTeam(req: Request, res: Response, next: NextFunction) {
    try {
      const team = await TeamService.createTeam(req.body);
      res.status(201).json({
        success: true,
        message: 'Team created with wallet budget successfully',
        data: team,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeams(req: Request, res: Response, next: NextFunction) {
    try {
      const seasonId = req.query.seasonId as string | undefined;
      const teams = await TeamService.getTeams(seasonId);
      res.status(200).json({
        success: true,
        data: teams,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeamById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const team = await TeamService.getTeamById(id);
      res.status(200).json({
        success: true,
        data: team,
      });
    } catch (error) {
      next(error);
    }
  }
}
