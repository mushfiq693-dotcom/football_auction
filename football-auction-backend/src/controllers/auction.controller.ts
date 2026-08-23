import { Request, Response, NextFunction } from 'express';
import { AuctionEngineService } from '../services/auctionEngine.service';
import { prisma } from '../config/database';
import { AuctionStatus, AuctionType } from '@prisma/client';

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

      // In Blind mode, mask the amounts if user is not Super Admin
      let sanitizedBids = session.bids;
      if (session.auctionType === AuctionType.BLIND) {
        sanitizedBids = session.bids.map((b) => ({
          ...b,
          amount: 0, // masked until revealed
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
          registrationStatus: 'APPROVED',
          isSold: false,
          deletedAt: null,
        },
        include: {
          user: { select: { fullName: true, avatarUrl: true } },
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
      const { seasonId, playerId, auctionType, timerSeconds } = req.body;
      const session = await prisma.auctionSession.create({
        data: {
          seasonId,
          playerId,
          auctionType: auctionType || AuctionType.NORMAL,
          timerSeconds: timerSeconds || 30,
          status: AuctionStatus.ACTIVE,
        },
        include: {
          player: { include: { user: true, category: true } },
        },
      });

      const io = req.app.get('io');
      if (io) {
        io.to('room:auction').emit('auction:state_change', session);
      }

      res.status(201).json({
        success: true,
        message: 'Auction session created successfully',
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  static async placeBid(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuctionEngineService.placeBid(req.body);

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
