import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';
import { Position, RegistrationStatus } from '@prisma/client';

export interface CreatePlayerProfileDto {
  seasonId?: string;
  studentId?: string;
  academicSession?: string;
  jerseyName?: string;
  photoUrl?: string;
  photoPublicId?: string;
  position: Position;
  secondaryPosition?: Position;
  jerseyNumber?: number;
}

export class PlayerService {
  static async registerPlayer(userId: string, dto: CreatePlayerProfileDto) {
    const existingPlayer = await prisma.player.findUnique({
      where: { userId },
    });

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
    }

    const secPos = dto.secondaryPosition && (dto.secondaryPosition as string).trim() !== '' ? dto.secondaryPosition : undefined;
    const jNum = dto.jerseyNumber && !isNaN(Number(dto.jerseyNumber)) && Number(dto.jerseyNumber) > 0 ? Number(dto.jerseyNumber) : undefined;

    // If player already exists, update their profile
    if (existingPlayer) {
      return await prisma.player.update({
        where: { id: existingPlayer.id },
        data: {
          studentId: dto.studentId?.trim() || existingPlayer.studentId,
          academicSession: dto.academicSession?.trim() || existingPlayer.academicSession,
          jerseyName: dto.jerseyName?.trim() || existingPlayer.jerseyName,
          photoUrl: dto.photoUrl?.trim() || existingPlayer.photoUrl,
          photoPublicId: dto.photoPublicId?.trim() || existingPlayer.photoPublicId,
          position: dto.position || existingPlayer.position,
          secondaryPosition: secPos,
          jerseyNumber: jNum,
        },
        include: {
          user: {
            select: { fullName: true, email: true, avatarUrl: true },
          },
          category: true,
          team: { select: { id: true, name: true, code: true, logoUrl: true } },
        },
      });
    }

    // Check duplicate student ID for other users
    if (dto.studentId) {
      const existingStudent = await prisma.player.findUnique({
        where: { studentId: dto.studentId },
      });
      if (existingStudent && existingStudent.userId !== userId) {
        throw new AppError(400, 'A player with this Student ID has already registered');
      }
    }

    const player = await prisma.player.create({
      data: {
        userId,
        seasonId: targetSeasonId,
        studentId: dto.studentId?.trim() || undefined,
        academicSession: dto.academicSession?.trim() || undefined,
        jerseyName: dto.jerseyName?.trim() || undefined,
        photoUrl: dto.photoUrl?.trim() || undefined,
        photoPublicId: dto.photoPublicId?.trim() || undefined,
        position: dto.position,
        secondaryPosition: secPos,
        jerseyNumber: jNum,
        rating: 80,
        registrationStatus: RegistrationStatus.PENDING,
      },
      include: {
        user: {
          select: { fullName: true, email: true, avatarUrl: true },
        },
        category: true,
        team: { select: { id: true, name: true, code: true, logoUrl: true } },
      },
    });

    return player;
  }

  static async getMyProfile(userId: string) {
    const player = await prisma.player.findUnique({
      where: { userId },
      include: {
        user: { select: { id: true, fullName: true, email: true, avatarUrl: true } },
        category: true,
        team: { select: { id: true, name: true, code: true, logoUrl: true } },
      },
    });
    return player;
  }

  static async setPlayerRating(playerId: string, rating: number) {
    const player = await prisma.player.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new AppError(404, 'Player not found');
    }

    const clampedRating = Math.max(1, Math.min(99, Math.round(rating)));

    // Categorization logic:
    // Rating >= 88: ACE (Base Price: $5000, Increment: $500)
    // Rating >= 75: GOLD (Base Price: $3000, Increment: $300)
    // Rating < 75: SILVER (Base Price: $1000, Increment: $100)
    const tierName = clampedRating >= 88 ? 'ACE' : clampedRating >= 75 ? 'GOLD' : 'SILVER';
    const basePrice = clampedRating >= 88 ? 5000 : clampedRating >= 75 ? 3000 : 1000;
    const minBidIncrement = clampedRating >= 88 ? 500 : clampedRating >= 75 ? 300 : 100;

    // Find or create category for this season
    let category = await prisma.playerCategory.findFirst({
      where: {
        seasonId: player.seasonId,
        name: { contains: tierName, mode: 'insensitive' },
      },
    });

    if (!category) {
      category = await prisma.playerCategory.create({
        data: {
          seasonId: player.seasonId,
          name: `${tierName} Tier`,
          basePrice,
          minBidIncrement,
          maxPlayersPerTeam: 15,
        },
      });
    }

    const updated = await prisma.player.update({
      where: { id: playerId },
      data: {
        rating: clampedRating,
        categoryId: category.id,
        registrationStatus: RegistrationStatus.APPROVED,
      },
      include: {
        user: { select: { fullName: true, email: true, avatarUrl: true } },
        category: true,
        team: { select: { id: true, name: true, code: true, logoUrl: true } },
      },
    });

    return updated;
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
