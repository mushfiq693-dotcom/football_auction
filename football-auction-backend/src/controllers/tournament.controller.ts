import { Request, Response, NextFunction } from 'express';
import { TournamentService } from '../services/tournament.service';
import { prisma } from '../config/database';

export class TournamentController {
  static async createTournament(req: Request, res: Response, next: NextFunction) {
    try {
      const { seasonId, name, format } = req.body;
      const tournament = await prisma.tournament.create({
        data: { seasonId, name, format: format || 'ROUND_ROBIN' },
      });

      res.status(201).json({
        success: true,
        message: 'Tournament created successfully',
        data: tournament,
      });
    } catch (error) {
      next(error);
    }
  }

  static async generateFixtures(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { seasonId } = req.body;
      const matches = await TournamentService.generateFixtures(id, seasonId);

      res.status(200).json({
        success: true,
        message: 'Fixtures and Standings initialized successfully',
        data: matches,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMatchResult(req: Request, res: Response, next: NextFunction) {
    try {
      const matchId = req.params.matchId as string;
      const { homeScore, awayScore, status } = req.body;

      const match = await TournamentService.updateMatchResult(matchId, homeScore, awayScore, status);

      const io = req.app.get('io');
      if (io) {
        io.emit('match:score_update', match);
        const standings = await TournamentService.getStandings(match.tournamentId);
        io.emit('standings:update', standings);
      }

      res.status(200).json({
        success: true,
        message: 'Match result updated successfully',
        data: match,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getStandings(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const standings = await TournamentService.getStandings(id);

      res.status(200).json({
        success: true,
        data: standings,
      });
    } catch (error) {
      next(error);
    }
  }
}
