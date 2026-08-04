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

    const player = await prisma.player.create({
      data: {
        userId,
        seasonId: dto.seasonId,
        position: dto.position,
        secondaryPosition: dto.secondaryPosition,
        jerseyNumber: dto.jerseyNumber,
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
