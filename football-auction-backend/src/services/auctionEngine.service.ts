import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';
import { AuctionStatus, AuctionType, Prisma } from '@prisma/client';

export interface PlaceBidDto {
  auctionSessionId: string;
  teamId: string;
  amount: number;
  isBlindBid?: boolean;
}

export class AuctionEngineService {
  /**
   * Calculate dynamic bidding increments based on percentage of total team budget
   * PRD: "Define percentage-based raise tiers (e.g., If current bid is 0-3% of budget, min raise is 0.15%)."
   */
  static calculateDynamicIncrements(currentBid: number, totalBudget: number = 100000, categoryBasePrice: number = 1000) {
    const ratio = currentBid / totalBudget;
    let minRaise = 50;

    if (ratio < 0.05) {
      // 0 - 5% of budget: 0.25% min raise
      minRaise = Math.max(50, Math.round(totalBudget * 0.0025));
    } else if (ratio < 0.20) {
      // 5% - 20% of budget: 0.5% min raise
      minRaise = Math.max(100, Math.round(totalBudget * 0.005));
    } else if (ratio < 0.50) {
      // 20% - 50% of budget: 1.0% min raise
      minRaise = Math.max(250, Math.round(totalBudget * 0.01));
    } else {
      // > 50% of budget: 2.0% min raise
      minRaise = Math.max(500, Math.round(totalBudget * 0.02));
    }

    return {
      minRaise,
      nextMinimumBid: currentBid === 0 ? categoryBasePrice : currentBid + minRaise,
      suggestedIncrements: [minRaise, minRaise * 2, minRaise * 5],
    };
  }

  /**
   * Real-time Bidding Engine with Serializable Concurrency & Budget Guardrails
   */
  static async placeBid(dto: PlaceBidDto) {
    return await prisma.$transaction(
      async (tx) => {
        // 1. Fetch Auction Session with Player, Season, and Category
        const session = await tx.auctionSession.findUnique({
          where: { id: dto.auctionSessionId },
          include: {
            player: { include: { category: true } },
            season: {
              include: {
                playerCategories: true,
              },
            },
          },
        });

        if (!session || session.status !== AuctionStatus.ACTIVE) {
          throw new AppError(400, 'Auction session is not currently active for bidding');
        }

        const season = session.season;
        const totalBudget = season?.totalBudget || 100000;
        const minRosterSize = season?.minRosterSize || 11;
        const basePrice = session.player.category?.basePrice || 1000;

        // Find the absolute lowest base price across all categories in the season
        const allBasePrices = season?.playerCategories?.map((c) => c.basePrice) || [basePrice];
        const lowestBasePriceInSystem = Math.min(...allBasePrices, basePrice);

        // 2. Fetch and Lock Team Wallet
        const wallet = await tx.teamWallet.findUnique({
          where: { teamId: dto.teamId },
        });

        if (!wallet) {
          throw new AppError(404, 'Team wallet not found');
        }

        if (wallet.playersBoughtCount >= wallet.maxPlayerLimit) {
          throw new AppError(400, `Team has already reached maximum squad limit of ${wallet.maxPlayerLimit} players`);
        }

        if (wallet.currentBalance < dto.amount) {
          throw new AppError(400, `Insufficient budget balance. Available: $${wallet.currentBalance}, Bid: $${dto.amount}`);
        }

        // 3. PRD STRICT BUDGET GUARDRAIL:
        // "The API must mathematically block any bid that prevents a team from buying their remaining
        // required players at the absolute lowest base price in the system."
        const remainingSquadNeeded = Math.max(0, minRosterSize - (wallet.playersBoughtCount + 1));
        const requiredReserve = remainingSquadNeeded * lowestBasePriceInSystem;
        const remainingBalanceAfterBid = wallet.currentBalance - dto.amount;

        if (remainingBalanceAfterBid < requiredReserve) {
          throw new AppError(
            400,
            `Budget Guardrail Violation: Placing a bid of $${dto.amount} leaves $${remainingBalanceAfterBid}. You must retain at least $${requiredReserve} in reserve to buy your remaining ${remainingSquadNeeded} required squad slot(s) at lowest base price $${lowestBasePriceInSystem}.`
          );
        }

        // 4. Handle BLIND AUCTION vs NORMAL AUCTION
        if (session.auctionType === AuctionType.BLIND) {
          if (dto.amount < basePrice) {
            throw new AppError(400, `Sealed bid amount must be at least the base price of $${basePrice}`);
          }

          // In Blind Mode, create bid record and store in sealed envelope
          const bid = await tx.auctionBid.create({
            data: {
              auctionSessionId: dto.auctionSessionId,
              teamId: dto.teamId,
              amount: dto.amount,
              isBlindBid: true,
            },
            include: {
              team: { select: { id: true, name: true, code: true, logoUrl: true } },
            },
          });

          return {
            bid: { ...bid, amount: 0 }, // Mask amount for public stream in blind mode
            session,
            isBlindBid: true,
            message: 'Sealed bid submitted successfully. Envelope will be opened at T=0.',
          };
        }

        // NORMAL OPEN INCREMENTAL BIDDING
        const dynamicMath = this.calculateDynamicIncrements(session.currentBid, totalBudget, basePrice);

        if (session.currentBid === 0) {
          if (dto.amount < basePrice) {
            throw new AppError(400, `Opening bid must be at least the base price of $${basePrice}`);
          }
        } else {
          if (dto.amount <= session.currentBid) {
            throw new AppError(400, `Bid amount ($${dto.amount}) must be strictly higher than current top bid ($${session.currentBid})`);
          }
          if (dto.amount < session.currentBid + dynamicMath.minRaise) {
            throw new AppError(
              400,
              `Bid must be higher by at least the minimum raise of $${dynamicMath.minRaise} (Minimum next bid: $${session.currentBid + dynamicMath.minRaise})`
            );
          }
        }

        // Record valid bid
        const bid = await tx.auctionBid.create({
          data: {
            auctionSessionId: dto.auctionSessionId,
            teamId: dto.teamId,
            amount: dto.amount,
            isBlindBid: false,
          },
          include: {
            team: { select: { id: true, name: true, code: true, logoUrl: true } },
          },
        });

        // Update active session (reset timer to 30s)
        const updatedSession = await tx.auctionSession.update({
          where: { id: dto.auctionSessionId },
          data: {
            currentBid: dto.amount,
            currentWinnerId: dto.teamId,
            timerSeconds: 30,
            version: { increment: 1 },
          },
          include: {
            player: { include: { user: { select: { fullName: true, avatarUrl: true } }, category: true } },
          },
        });

        return { bid, session: updatedSession, dynamicIncrements: this.calculateDynamicIncrements(dto.amount, totalBudget, basePrice) };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 5000,
      }
    );
  }

  /**
   * Finalize Auction Session (handles Normal victory, Blind envelope reveal, or Unsold)
   */
  static async finalizeAuction(auctionSessionId: string) {
    return await prisma.$transaction(async (tx) => {
      const session = await tx.auctionSession.findUnique({
        where: { id: auctionSessionId },
        include: {
          player: true,
          bids: {
            include: { team: true },
            orderBy: [{ amount: 'desc' }, { createdAt: 'asc' }],
          },
        },
      });

      if (!session) throw new AppError(404, 'Auction session not found');

      // If Blind mode, determine the highest sealed envelope
      let winningTeamId = session.currentWinnerId;
      let winningAmount = session.currentBid;

      if (session.auctionType === AuctionType.BLIND && session.bids.length > 0) {
        const topBlindBid = session.bids[0];
        winningTeamId = topBlindBid.teamId;
        winningAmount = topBlindBid.amount;
      }

      if (!winningTeamId || winningAmount === 0) {
        const updatedSession = await tx.auctionSession.update({
          where: { id: auctionSessionId },
          data: { status: AuctionStatus.UNSOLD },
        });

        return { status: 'UNSOLD', session: updatedSession };
      }

      // Mark Player as Sold
      await tx.player.update({
        where: { id: session.playerId },
        data: {
          isSold: true,
          finalAuctionPrice: winningAmount,
          teamId: winningTeamId,
        },
      });

      // Atomically deduct budget and increment bought count
      await tx.teamWallet.update({
        where: { teamId: winningTeamId },
        data: {
          spentAmount: { increment: winningAmount },
          currentBalance: { decrement: winningAmount },
          playersBoughtCount: { increment: 1 },
        },
      });

      // Record Auction Winner
      const winner = await tx.auctionWinner.create({
        data: {
          auctionSessionId,
          teamId: winningTeamId,
          winningAmount,
        },
      });

      // Mark session as COMPLETED
      const completedSession = await tx.auctionSession.update({
        where: { id: auctionSessionId },
        data: {
          status: AuctionStatus.COMPLETED,
          currentBid: winningAmount,
          currentWinnerId: winningTeamId,
        },
      });

      return { status: 'SOLD', session: completedSession, winner, winningAmount, winningTeamId };
    });
  }

  /**
   * Podium Admin Overrides: Pause, Resume, Rollback, Mark Unsold
   */
  static async toggleAuctionStatus(auctionSessionId: string, status: AuctionStatus) {
    return await prisma.auctionSession.update({
      where: { id: auctionSessionId },
      data: { status },
      include: {
        player: { include: { user: true, category: true } },
      },
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
          timerSeconds: 30,
        },
        include: {
          player: { include: { user: true, category: true } },
        },
      });

      return updatedSession;
    });
  }
}
