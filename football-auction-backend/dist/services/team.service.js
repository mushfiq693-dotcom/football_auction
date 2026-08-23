"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamService = void 0;
const database_1 = require("../config/database");
const errorHandler_middleware_1 = require("../middlewares/errorHandler.middleware");
class TeamService {
    static async createTeam(dto) {
        const existingTeam = await database_1.prisma.team.findUnique({
            where: { ownerId: dto.ownerId },
        });
        if (existingTeam) {
            throw new errorHandler_middleware_1.AppError(400, 'Team owner already has a team assigned');
        }
        return await database_1.prisma.$transaction(async (tx) => {
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
    static async getTeams(seasonId) {
        const where = { deletedAt: null };
        if (seasonId)
            where.seasonId = seasonId;
        return await database_1.prisma.team.findMany({
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
    static async getTeamById(teamId) {
        const team = await database_1.prisma.team.findUnique({
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
            throw new errorHandler_middleware_1.AppError(404, 'Team not found');
        }
        return team;
    }
}
exports.TeamService = TeamService;
