import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';

export interface CreateTeamDto {
  seasonId: string;
  ownerId: string;
  name: string;
  code: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  allocatedBudget: number;
  maxPlayerLimit?: number;
}

export class TeamService {
  static async createTeam(dto: CreateTeamDto) {
    const existingTeam = await prisma.team.findUnique({
      where: { ownerId: dto.ownerId },
    });

    if (existingTeam) {
      throw new AppError(400, 'Team owner already has a team assigned');
    }

    return await prisma.$transaction(async (tx) => {
      const team = await tx.team.create({
        data: {
          seasonId: dto.seasonId,
          ownerId: dto.ownerId,
          name: dto.name,
          code: dto.code.toUpperCase(),
          logoUrl: dto.logoUrl,
          primaryColor: dto.primaryColor,
          secondaryColor: dto.secondaryColor,
        },
      });

      const wallet = await tx.teamWallet.create({
        data: {
          teamId: team.id,
          allocatedBudget: dto.allocatedBudget,
          currentBalance: dto.allocatedBudget,
          spentAmount: 0,
          maxPlayerLimit: dto.maxPlayerLimit || 15,
          playersBoughtCount: 0,
        },
      });

      return { ...team, wallet };
    });
  }

  static async getTeams(seasonId?: string) {
    const where: any = { deletedAt: null };
    if (seasonId) where.seasonId = seasonId;

    return await prisma.team.findMany({
      where,
      include: {
        owner: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        wallet: true,
        players: {
          include: {
            user: { select: { fullName: true, avatarUrl: true } },
            category: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getTeamById(teamId: string) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        owner: { select: { id: true, fullName: true, email: true, phone: true } },
        wallet: true,
        players: {
          include: {
            user: { select: { fullName: true, avatarUrl: true } },
            category: true,
          },
        },
        bids: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { auctionSession: { include: { player: { include: { user: true } } } } },
        },
      },
    });

    if (!team || team.deletedAt) {
      throw new AppError(404, 'Team not found');
    }

    return team;
  }
}
