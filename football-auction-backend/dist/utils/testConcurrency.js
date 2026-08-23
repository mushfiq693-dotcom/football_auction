"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runConcurrencyTest = runConcurrencyTest;
const auctionEngine_service_1 = require("../services/auctionEngine.service");
const database_1 = require("../config/database");
const client_1 = require("@prisma/client");
async function runConcurrencyTest() {
    console.log('🧪 Starting Live Auction Concurrency Stress Test...');
    try {
        // 1. Create Test Season
        const season = await database_1.prisma.season.create({
            data: { name: 'Test Season 2026', year: 2026, isActive: true },
        });
        // 2. Create Player Category
        const category = await database_1.prisma.playerCategory.create({
            data: {
                seasonId: season.id,
                name: 'Elite Category',
                basePrice: 100,
                minBidIncrement: 50,
                maxPlayersPerTeam: 15,
            },
        });
        // 3. Create Player User & Profile
        const playerUser = await database_1.prisma.user.create({
            data: {
                email: `testplayer_${Date.now()}@test.com`,
                passwordHash: 'hashed',
                fullName: 'Test Player',
                role: client_1.Role.PLAYER,
            },
        });
        const player = await database_1.prisma.player.create({
            data: {
                userId: playerUser.id,
                seasonId: season.id,
                categoryId: category.id,
                position: client_1.Position.FORWARD,
            },
        });
        // 4. Create 3 Franchise Teams & Wallets ($1000 balance each)
        const teams = [];
        for (let i = 1; i <= 3; i++) {
            const owner = await database_1.prisma.user.create({
                data: {
                    email: `owner_${i}_${Date.now()}@test.com`,
                    passwordHash: 'hashed',
                    fullName: `Owner Team ${i}`,
                    role: client_1.Role.TEAM_OWNER,
                },
            });
            const team = await database_1.prisma.team.create({
                data: {
                    seasonId: season.id,
                    ownerId: owner.id,
                    name: `FC Franchise ${i}`,
                    code: `FC${i}`,
                },
            });
            await database_1.prisma.teamWallet.create({
                data: {
                    teamId: team.id,
                    allocatedBudget: 1000,
                    currentBalance: 1000,
                    spentAmount: 0,
                },
            });
            teams.push(team);
        }
        // 5. Create Auction Session
        const session = await database_1.prisma.auctionSession.create({
            data: {
                seasonId: season.id,
                playerId: player.id,
                auctionType: client_1.AuctionType.NORMAL,
                status: client_1.AuctionStatus.ACTIVE,
                currentBid: 0,
            },
        });
        console.log(`✅ Test Session created: ${session.id}`);
        // 6. Simulate 5 Simultaneous Bids
        const bidsToPlace = [
            { auctionSessionId: session.id, teamId: teams[0].id, amount: 150 },
            { auctionSessionId: session.id, teamId: teams[1].id, amount: 200 },
            { auctionSessionId: session.id, teamId: teams[2].id, amount: 250 },
            { auctionSessionId: session.id, teamId: teams[0].id, amount: 300 },
            { auctionSessionId: session.id, teamId: teams[1].id, amount: 400 },
        ];
        console.log('⚡ Placing 5 simultaneous bids with serializable transactions...');
        const results = await Promise.allSettled(bidsToPlace.map((b) => auctionEngine_service_1.AuctionEngineService.placeBid(b)));
        const succeeded = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;
        console.log(`📊 Test Results: Succeeded: ${succeeded}, Failed: ${failed}`);
        // 7. Verify Top Bid in Database
        const finalSession = await database_1.prisma.auctionSession.findUnique({
            where: { id: session.id },
        });
        console.log(`🏆 Final Session Current Bid: $${finalSession?.currentBid}`);
        // Clean up test data
        await database_1.prisma.season.delete({ where: { id: season.id } });
        console.log('🧹 Test Data Cleanup Complete.');
        return true;
    }
    catch (error) {
        console.error('❌ Concurrency Test Error:', error);
        return false;
    }
}
