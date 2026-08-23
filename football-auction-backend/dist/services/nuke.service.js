"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NukeService = void 0;
const database_1 = require("../config/database");
const cloudinary_1 = require("../config/cloudinary");
const client_1 = require("@prisma/client");
class NukeService {
    /**
     * Level 1 (Tournament Wipe):
     * Deletes all match fixtures, match legs, player performance stats, standings, and news.
     * Reverts system state back to Phase 3 (LIVE_AUCTION).
     */
    static async level1TournamentWipe(adminUserId) {
        return await database_1.prisma.$transaction(async (tx) => {
            // 1. Delete player performances
            await tx.playerPerformance.deleteMany({});
            // 2. Delete match legs
            await tx.matchLeg.deleteMany({});
            // 3. Delete matches
            await tx.match.deleteMany({});
            // 4. Delete standings
            await tx.standings.deleteMany({});
            // 5. Delete tournaments
            await tx.tournament.deleteMany({});
            // 6. Delete news
            await tx.news.deleteMany({});
            // 7. Update Global Phase back to LIVE_AUCTION
            const globalState = await tx.globalState.findFirst({ orderBy: { updatedAt: 'desc' } });
            if (globalState) {
                await tx.globalState.update({
                    where: { id: globalState.id },
                    data: { activePhase: client_1.Phase.LIVE_AUCTION, updatedBy: adminUserId },
                });
            }
            // 8. Audit log
            await tx.auditLog.create({
                data: {
                    userId: adminUserId,
                    action: 'LIFECYCLE_RESET_LEVEL_1_TOURNAMENT_WIPE',
                    details: { message: 'All matches, legs, standings, and stats wiped. Reverted to LIVE_AUCTION phase.' },
                },
            });
            return {
                level: 1,
                message: 'Level 1 (Tournament Wipe) completed successfully. Matches and standings reset.',
                activePhase: client_1.Phase.LIVE_AUCTION,
            };
        });
    }
    /**
     * Level 2 (Roster Wipe):
     * Deletes all players, teams, wallets, auction sessions, bids, winners, and deletes player photos from Cloudinary.
     * Retains rules, seasons, player categories, and sessions.
     * Reverts system to Phase 1 (SETUP).
     */
    static async level2RosterWipe(adminUserId) {
        // 1. Collect all Cloudinary public IDs from players to delete them from cloud storage
        const playersWithPhotos = await database_1.prisma.player.findMany({
            where: { photoPublicId: { not: null } },
            select: { photoPublicId: true },
        });
        const publicIds = playersWithPhotos
            .map((p) => p.photoPublicId)
            .filter((id) => Boolean(id));
        // Delete photos from Cloudinary
        if (publicIds.length > 0) {
            await cloudinary_1.CloudinaryService.deleteAssets(publicIds);
        }
        return await database_1.prisma.$transaction(async (tx) => {
            // 1. Tournament stats and matches
            await tx.playerPerformance.deleteMany({});
            await tx.matchLeg.deleteMany({});
            await tx.match.deleteMany({});
            await tx.standings.deleteMany({});
            await tx.tournament.deleteMany({});
            // 2. Auction bids, winners, sessions
            await tx.auctionBid.deleteMany({});
            await tx.auctionWinner.deleteMany({});
            await tx.auctionSession.deleteMany({});
            // 3. Players
            await tx.player.deleteMany({});
            // 4. Team Wallets & Teams
            await tx.teamWallet.deleteMany({});
            await tx.team.deleteMany({});
            // 5. Delete Team Owner and Player Users (keep Super Admin and Admins)
            await tx.user.deleteMany({
                where: {
                    role: {
                        in: [client_1.Role.TEAM_OWNER, client_1.Role.PLAYER, client_1.Role.PUBLIC_GUEST],
                    },
                },
            });
            // 6. Reset Global Phase to SETUP
            const globalState = await tx.globalState.findFirst({ orderBy: { updatedAt: 'desc' } });
            if (globalState) {
                await tx.globalState.update({
                    where: { id: globalState.id },
                    data: { activePhase: client_1.Phase.SETUP, updatedBy: adminUserId },
                });
            }
            // 7. Audit log
            await tx.auditLog.create({
                data: {
                    userId: adminUserId,
                    action: 'LIFECYCLE_RESET_LEVEL_2_ROSTER_WIPE',
                    details: {
                        message: 'All players, teams, auction data, and cloud images deleted. Rules retained. Reverted to SETUP.',
                        deletedCloudAssetsCount: publicIds.length,
                    },
                },
            });
            return {
                level: 2,
                message: 'Level 2 (Roster Wipe) completed successfully. Players, teams, and media assets cleared.',
                deletedCloudAssetsCount: publicIds.length,
                activePhase: client_1.Phase.SETUP,
            };
        });
    }
    /**
     * Level 3 (Factory Reset):
     * Drops all data and wipes all media. Retains ONLY Super Admin user credentials.
     * Reverts system to Phase 1 (SETUP).
     */
    static async level3FactoryReset(adminUserId) {
        // 1. Collect all Cloudinary public IDs
        const playersWithPhotos = await database_1.prisma.player.findMany({
            where: { photoPublicId: { not: null } },
            select: { photoPublicId: true },
        });
        const publicIds = playersWithPhotos
            .map((p) => p.photoPublicId)
            .filter((id) => Boolean(id));
        if (publicIds.length > 0) {
            await cloudinary_1.CloudinaryService.deleteAssets(publicIds);
        }
        return await database_1.prisma.$transaction(async (tx) => {
            // Clear all child tables in order
            await tx.playerPerformance.deleteMany({});
            await tx.matchLeg.deleteMany({});
            await tx.match.deleteMany({});
            await tx.standings.deleteMany({});
            await tx.tournament.deleteMany({});
            await tx.news.deleteMany({});
            await tx.notification.deleteMany({});
            await tx.auctionBid.deleteMany({});
            await tx.auctionWinner.deleteMany({});
            await tx.auctionSession.deleteMany({});
            await tx.player.deleteMany({});
            await tx.playerCategory.deleteMany({});
            await tx.teamWallet.deleteMany({});
            await tx.team.deleteMany({});
            await tx.season.deleteMany({});
            // Delete all users except Super Admins
            await tx.user.deleteMany({
                where: {
                    role: { not: client_1.Role.SUPER_ADMIN },
                },
            });
            // Reset Global State
            await tx.globalState.deleteMany({});
            const newState = await tx.globalState.create({
                data: {
                    activePhase: client_1.Phase.SETUP,
                    updatedBy: adminUserId,
                },
            });
            // Create Fresh Default Season 2026
            await tx.season.create({
                data: {
                    name: 'Season 2026',
                    year: 2026,
                    totalBudget: 100000,
                    minRosterSize: 11,
                    maxRosterSize: 15,
                    isActive: true,
                    playerCategories: {
                        create: [
                            { name: 'Tier 1 - Platinum Elite', basePrice: 5000, minBidIncrement: 500, maxPlayersPerTeam: 15 },
                            { name: 'Tier 2 - Gold Pro', basePrice: 3000, minBidIncrement: 300, maxPlayersPerTeam: 15 },
                            { name: 'Tier 3 - Silver Challenger', basePrice: 1000, minBidIncrement: 100, maxPlayersPerTeam: 15 },
                        ],
                    },
                },
            });
            await tx.auditLog.create({
                data: {
                    userId: adminUserId,
                    action: 'LIFECYCLE_RESET_LEVEL_3_FACTORY_RESET',
                    details: { message: 'Complete factory reset executed. All tables wiped except Super Admin.' },
                },
            });
            return {
                level: 3,
                message: 'Level 3 (Factory Reset) completed. All season data, players, teams, and media wiped.',
                activePhase: newState.activePhase,
            };
        });
    }
}
exports.NukeService = NukeService;
