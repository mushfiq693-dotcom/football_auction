"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerService = void 0;
const database_1 = require("../config/database");
const errorHandler_middleware_1 = require("../middlewares/errorHandler.middleware");
const client_1 = require("@prisma/client");
class PlayerService {
    static async registerPlayer(userId, dto) {
        const existingPlayer = await database_1.prisma.player.findUnique({
            where: { userId },
        });
        if (existingPlayer) {
            throw new errorHandler_middleware_1.AppError(400, 'Player profile already exists for this user');
        }
        if (dto.studentId) {
            const existingStudent = await database_1.prisma.player.findUnique({
                where: { studentId: dto.studentId },
            });
            if (existingStudent) {
                throw new errorHandler_middleware_1.AppError(400, 'A player with this Student ID has already registered');
            }
        }
        let targetSeasonId = dto.seasonId;
        if (!targetSeasonId || targetSeasonId.trim() === '') {
            let activeSeason = await database_1.prisma.season.findFirst({
                where: { isActive: true },
            });
            if (!activeSeason) {
                activeSeason = await database_1.prisma.season.findFirst({
                    orderBy: { createdAt: 'desc' },
                });
            }
            if (!activeSeason) {
                activeSeason = await database_1.prisma.season.create({
                    data: {
                        name: 'Season 2026',
                        year: 2026,
                        isActive: true,
                    },
                });
            }
            targetSeasonId = activeSeason.id;
        }
        const secPos = dto.secondaryPosition && dto.secondaryPosition.trim() !== '' ? dto.secondaryPosition : undefined;
        const jNum = dto.jerseyNumber && !isNaN(Number(dto.jerseyNumber)) && Number(dto.jerseyNumber) > 0 ? Number(dto.jerseyNumber) : undefined;
        const player = await database_1.prisma.player.create({
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
                registrationStatus: client_1.RegistrationStatus.PENDING,
            },
            include: {
                user: {
                    select: { fullName: true, email: true, avatarUrl: true },
                },
                category: true,
            },
        });
        return player;
    }
    static async getPlayers(filters) {
        const where = { deletedAt: null };
        if (filters.seasonId)
            where.seasonId = filters.seasonId;
        if (filters.status)
            where.registrationStatus = filters.status;
        if (filters.categoryId)
            where.categoryId = filters.categoryId;
        return await database_1.prisma.player.findMany({
            where,
            include: {
                user: { select: { fullName: true, email: true, avatarUrl: true } },
                category: true,
                team: { select: { id: true, name: true, code: true, logoUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async verifyPlayer(playerId, status, categoryId, rejectionReason) {
        const player = await database_1.prisma.player.findUnique({
            where: { id: playerId },
        });
        if (!player) {
            throw new errorHandler_middleware_1.AppError(404, 'Player not found');
        }
        const updatedPlayer = await database_1.prisma.player.update({
            where: { id: playerId },
            data: {
                registrationStatus: status,
                categoryId: categoryId || player.categoryId,
                rejectionReason: status === client_1.RegistrationStatus.REJECTED ? rejectionReason : null,
            },
            include: {
                user: { select: { id: true, fullName: true, email: true } },
                category: true,
            },
        });
        // Notify Player
        await database_1.prisma.notification.create({
            data: {
                userId: player.userId,
                title: `Registration ${status}`,
                message: status === client_1.RegistrationStatus.APPROVED
                    ? 'Your registration has been approved! You are now eligible for the live auction.'
                    : `Your registration was rejected. Reason: ${rejectionReason || 'N/A'}`,
            },
        });
        return updatedPlayer;
    }
}
exports.PlayerService = PlayerService;
