import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';
import { Position, RegistrationStatus } from '@prisma/client';

export interface CreatePlayerProfileDto {
  seasonId: string;
  position: Position;
  secondaryPosition?: Position;
  jerseyNumber?: number;
}

export class PlayerService {
  static async registerPlayer(userId: string, dto: CreatePlayerProfileDto) {
    const existingPlayer = await prisma.player.findUnique({
      where: { userId },
    });

    if (existingPlayer) {
      throw new AppError(400, 'Player profile already exists for this user');
    }

    let targetSeasonId = dto.seasonId;

    if (!targetSeasonId || targetSeasonId.trim() === '') {
      let activeSeason = await prisma.season.findFirst({
        where: { isActive: true },
      });
      if (!activeSeason) {
        activeSeason = await prisma.season.findFirst({
          orderBy: { createdAt: 'desc' },
        });
      }
      if (!activeSeason) {
        activeSeason = await prisma.season.create({
          data: {
            name: 'Season 2026',
            year: 2026,
            isActive: true,
          },
        });
      }
      targetSeasonId = activeSeason.id;
    } else {
      const seasonExists = await prisma.season.findUnique({ where: { id: targetSeasonId } });
      if (!seasonExists) {
        let activeSeason = await prisma.season.findFirst({ where: { isActive: true } });
        if (!activeSeason) {
          activeSeason = await prisma.season.create({
            data: { id: targetSeasonId, name: 'Season 2026', year: 2026, isActive: true },
          });
        }
        targetSeasonId = activeSeason.id;
      }
    }

    const secPos = dto.secondaryPosition && dto.secondaryPosition.trim() !== '' ? dto.secondaryPosition : undefined;
    const jNum = dto.jerseyNumber && !isNaN(Number(dto.jerseyNumber)) && Number(dto.jerseyNumber) > 0 ? Number(dto.jerseyNumber) : undefined;

    const player = await prisma.player.create({
      data: {
        userId,
        seasonId: targetSeasonId,
        position: dto.position,
        secondaryPosition: secPos,
        jerseyNumber: jNum,
        registrationStatus: RegistrationStatus.PENDING,
      },
      include: {
        user: {
          select: { fullName: true, email: true, avatarUrl: true },
        },
      },
    });

    return player;
  }

  static async getPlayers(filters: { seasonId?: string; status?: RegistrationStatus; categoryId?: string }) {
    const where: any = { deletedAt: null };

    if (filters.seasonId) where.seasonId = filters.seasonId;
    if (filters.status) where.registrationStatus = filters.status;
    if (filters.categoryId) where.categoryId = filters.categoryId;

    return await prisma.player.findMany({
      where,
      include: {
        user: { select: { fullName: true, email: true, avatarUrl: true } },
        category: true,
        team: { select: { id: true, name: true, code: true, logoUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async verifyPlayer(playerId: string, status: RegistrationStatus, categoryId?: string, rejectionReason?: string) {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new AppError(404, 'Player not found');
    }

    const updatedPlayer = await prisma.player.update({
      where: { id: playerId },
      data: {
        registrationStatus: status,
        categoryId: categoryId || player.categoryId,
        rejectionReason: status === RegistrationStatus.REJECTED ? rejectionReason : null,
      },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        category: true,
      },
    });

    // Notify Player
    await prisma.notification.create({
      data: {
        userId: player.userId,
        title: `Registration ${status}`,
        message: status === RegistrationStatus.APPROVED
          ? 'Your registration has been approved! You are now eligible for the live auction.'
          : `Your registration was rejected. Reason: ${rejectionReason || 'N/A'}`,
      },
    });

    return updatedPlayer;
  }
}
