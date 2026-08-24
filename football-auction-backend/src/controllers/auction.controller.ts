import { Request, Response, NextFunction } from 'express';
import { AuctionEngineService } from '../services/auctionEngine.service';
import { prisma } from '../config/database';
import { AuctionStatus, AuctionType, Phase } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler.middleware';

export class AuctionController {
  static async getActiveSession(_req: Request, res: Response, next: NextFunction) {
    try {
      const session = await prisma.auctionSession.findFirst({
        where: {
          status: { in: [AuctionStatus.ACTIVE, AuctionStatus.PAUSED, AuctionStatus.SCHEDULED] },
        },
        include: {
          player: {
            include: {
              user: { select: { fullName: true, avatarUrl: true } },
              category: true,
            },
          },
          bids: {
            include: { team: { select: { id: true, name: true, code: true, logoUrl: true } } },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          season: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!session) {
        return res.status(200).json({ success: true, data: null });
      }

      const totalBudget = session.season?.totalBudget || 100000;
      const basePrice = session.player.category?.basePrice || 1000;
      const dynamicIncrements = AuctionEngineService.calculateDynamicIncrements(
        session.currentBid,
        totalBudget,
        basePrice
      );

      // In Blind mode, mask amounts for public view
      let sanitizedBids = session.bids;
      if (session.auctionType === AuctionType.BLIND) {
        sanitizedBids = session.bids.map((b) => ({
          ...b,
          amount: 0,
        })) as any;
      }

      return res.status(200).json({
        success: true,
        data: {
          ...session,
          bids: sanitizedBids,
          dynamicIncrements,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUnsoldPool(_req: Request, res: Response, next: NextFunction) {
    try {
      const unsoldPlayers = await prisma.player.findMany({
        where: {
          isSold: false,
          deletedAt: null,
        },
        include: {
          user: { select: { fullName: true, email: true, avatarUrl: true } },
          category: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      return res.status(200).json({
        success: true,
        data: unsoldPlayers,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createSession(req: Request, res: Response, next: NextFunction) {
    try {
      let { seasonId, playerId, auctionType, timerSeconds } = req.body;

      const player = await prisma.player.findUnique({
        where: { id: playerId },
        include: { user: true, category: true, season: true },
      });

      if (!player) {
        throw new AppError(404, 'Player not found');
      }

      // Auto-resolve seasonId if not a valid UUID
      if (!seasonId || seasonId === 'default-season' || seasonId.trim() === '') {
        seasonId = player.seasonId;
      }

      if (!seasonId) {
        let activeSeason = await prisma.season.findFirst({ where: { isActive: true } });
        if (!activeSeason) {
          activeSeason = await prisma.season.findFirst({ orderBy: { createdAt: 'desc' } });
        }
        seasonId = activeSeason?.id;
      }

      // Clear any previous active/paused sessions
      await prisma.auctionSession.updateMany({
        where: {
          status: { in: [AuctionStatus.ACTIVE, AuctionStatus.PAUSED] },
        },
        data: {
          status: AuctionStatus.UNSOLD,
        },
      });

      const session = await prisma.auctionSession.create({
        data: {
          seasonId: seasonId!,
          playerId,
          auctionType: auctionType || AuctionType.NORMAL,
          timerSeconds: timerSeconds || 30,
          status: AuctionStatus.ACTIVE,
          currentBid: 0,
        },
        include: {
          player: { include: { user: true, category: true } },
          season: true,
        },
      });

      // Update Global State to LIVE_AUCTION automatically
      await prisma.globalState.updateMany({
        data: { activePhase: Phase.LIVE_AUCTION },
      });

      const io = req.app.get('io');
      if (io) {
        io.to('room:auction').emit('auction:state_change', session);
      }

      res.status(201).json({
        success: true,
        message: `Auction started: ${auctionType || 'NORMAL'} Mode`,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  static async placeBid(req: Request, res: Response, next: NextFunction) {
    try {
      let { auctionSessionId, teamId, amount, isBlindBid } = req.body;

      // Auto-resolve team if not passed directly
      if (!teamId || teamId === 'undefined') {
        const userTeam = await prisma.team.findFirst({
          where: { ownerId: req.user!.userId },
        });
        if (userTeam) {
          teamId = userTeam.id;
        } else {
          // If admin placing testing bid, pick the first available franchise
          const firstTeam = await prisma.team.findFirst();
          if (firstTeam) {
            teamId = firstTeam.id;
          } else {
            throw new AppError(400, 'No franchise team available to place bids. Please create a team first.');
          }
        }
      }

      const result = await AuctionEngineService.placeBid({
        auctionSessionId,
        teamId,
        amount: Number(amount),
        isBlindBid,
      });

      const io = req.app.get('io');
      if (io) {
        io.to('room:auction').emit('bid:broadcast', result);
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;

      const session = await prisma.auctionSession.update({
        where: { id },
        data: { status },
        include: { player: { include: { user: true } } },
      });

      const io = req.app.get('io');
      if (io) {
        io.to('room:auction').emit('auction:state_change', session);
      }

      res.status(200).json({
        success: true,
        message: `Auction session status updated to ${status}`,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  static async finalizeAuction(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const result = await AuctionEngineService.finalizeAuction(id);

      const io = req.app.get('io');
      if (io) {
        io.to('room:auction').emit('auction:sold', result);
      }

      res.status(200).json({
        success: true,
        message: `Auction finalized: ${result.status}`,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async rollback(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const session = await AuctionEngineService.rollbackAuction(id);

      const io = req.app.get('io');
      if (io) {
        io.to('room:auction').emit('auction:rollback', session);
      }

      res.status(200).json({
        success: true,
        message: 'Auction top bid rolled back successfully',
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }
}
