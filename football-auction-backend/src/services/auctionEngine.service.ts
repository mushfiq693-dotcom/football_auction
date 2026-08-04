import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';
import { AuctionStatus, Prisma } from '@prisma/client';

export interface PlaceBidDto {
  auctionSessionId: string;
  teamId: string;
  amount: number;
  isBlindBid?: boolean;
}

export class AuctionEngineService {
  static async placeBid(dto: PlaceBidDto) {
    return await prisma.$transaction(
      async (tx) => {
        const session = await tx.auctionSession.findUnique({
          where: { id: dto.auctionSessionId },
          include: {
            player: { include: { category: true } },
          },
        });

        if (!session || session.status !== AuctionStatus.ACTIVE) {
          throw new AppError(400, 'Auction session is not currently active for bidding');
        }

        const minIncrement = session.player.category?.minBidIncrement || 50;
        const basePrice = session.player.category?.basePrice || 100;

        if (session.currentBid === 0) {
          if (dto.amount < basePrice) {
            throw new AppError(400, `Bid amount must be at least the base price of $${basePrice}`);
          }
        } else {
          if (dto.amount <= session.currentBid) {
            throw new AppError(400, `Bid amount must be higher than current top bid ($${session.currentBid})`);
          }
          if (dto.amount < session.currentBid + minIncrement) {
            throw new AppError(400, `Bid must be higher than current bid by at least $${minIncrement}`);
          }
        }

        const wallet = await tx.teamWallet.findUnique({
          where: { teamId: dto.teamId },
        });

        if (!wallet) {
          throw new AppError(404, 'Team wallet not found');
        }

        if (wallet.currentBalance < dto.amount) {
          throw new AppError(400, `Insufficient budget balance. Available: $${wallet.currentBalance}`);
        }

        if (wallet.playersBoughtCount >= wallet.maxPlayerLimit) {
          throw new AppError(400, `Team has already reached max player limit of ${wallet.maxPlayerLimit}`);
        }

        const bid = await tx.auctionBid.create({
          data: {
            auctionSessionId: dto.auctionSessionId,
            teamId: dto.teamId,
            amount: dto.amount,
            isBlindBid: dto.isBlindBid || false,
          },
          include: {
            team: { select: { id: true, name: true, code: true, logoUrl: true } },
          },
        });

        const updatedSession = await tx.auctionSession.update({
          where: { id: dto.auctionSessionId },
          data: {
            currentBid: dto.amount,
            currentWinnerId: dto.teamId,
            timerSeconds: 30,
            version: { increment: 1 },
          },
          include: {
            player: { include: { user: { select: { fullName: true, avatarUrl: true } } } },
          },
        });

        return { bid, session: updatedSession };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 5000,
      }
    );
  }

  static async finalizeAuction(auctionSessionId: string) {
    return await prisma.$transaction(async (tx) => {
      const session = await tx.auctionSession.findUnique({
        where: { id: auctionSessionId },
        include: { player: true },
      });

      if (!session) throw new AppError(404, 'Auction session not found');

      if (!session.currentWinnerId || session.currentBid === 0) {
        const updatedSession = await tx.auctionSession.update({
          where: { id: auctionSessionId },
          data: { status: AuctionStatus.UNSOLD },
        });

        return { status: 'UNSOLD', session: updatedSession };
      }

      await tx.player.update({
        where: { id: session.playerId },
        data: {
          isSold: true,
          finalAuctionPrice: session.currentBid,
          teamId: session.currentWinnerId,
        },
      });

      await tx.teamWallet.update({
        where: { teamId: session.currentWinnerId },
        data: {
          spentAmount: { increment: session.currentBid },
          currentBalance: { decrement: session.currentBid },
          playersBoughtCount: { increment: 1 },
        },
      });

      const winner = await tx.auctionWinner.create({
        data: {
          auctionSessionId,
          teamId: session.currentWinnerId,
          winningAmount: session.currentBid,
        },
      });

      const completedSession = await tx.auctionSession.update({
        where: { id: auctionSessionId },
        data: { status: AuctionStatus.COMPLETED },
      });

      return { status: 'SOLD', session: completedSession, winner };
    });
  }

  static async rollbackAuction(auctionSessionId: string) {
    return await prisma.$transaction(async (tx) => {
      const bids = await tx.auctionBid.findMany({
        where: { auctionSessionId },
        orderBy: { createdAt: 'desc' },
      });

      if (bids.length === 0) {
        const session = await tx.auctionSession.update({
          where: { id: auctionSessionId },
          data: { currentBid: 0, currentWinnerId: null },
        });
        return session;
      }

      const topBid = bids[0];
      await tx.auctionBid.delete({ where: { id: topBid.id } });

      const nextTopBid = bids[1];
      const updatedSession = await tx.auctionSession.update({
        where: { id: auctionSessionId },
        data: {
          currentBid: nextTopBid ? nextTopBid.amount : 0,
          currentWinnerId: nextTopBid ? nextTopBid.teamId : null,
        },
      });

      return updatedSession;
    });
  }
}
