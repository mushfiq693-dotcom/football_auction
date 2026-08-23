"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentService = void 0;
const database_1 = require("../config/database");
const errorHandler_middleware_1 = require("../middlewares/errorHandler.middleware");
const client_1 = require("@prisma/client");
class TournamentService {
    /**
     * Generate Round-Robin Fixtures for a Tournament (Supports Single or Two-Legged)
     */
    static async generateFixtures(tournamentId, seasonId, isTwoLegged = false) {
        const teams = await database_1.prisma.team.findMany({
            where: { seasonId, deletedAt: null },
        });
        if (teams.length < 2) {
            throw new errorHandler_middleware_1.AppError(400, 'At least 2 teams are required to generate tournament fixtures');
        }
        const matchesData = [];
        const n = teams.length;
        let matchdayCount = 1;
        // Leg 1: Single Round Robin
        for (let i = 0; i < n; i++) {
            for (let j = i + 1; j < n; j++) {
                matchesData.push({
                    tournamentId,
                    homeTeamId: teams[i].id,
                    awayTeamId: teams[j].id,
                    isTwoLegged,
                    scheduledAt: new Date(Date.now() + matchesData.length * 86400000),
                    roundName: isTwoLegged ? `Leg 1 - Matchday ${matchdayCount}` : `Matchday ${matchdayCount}`,
                    status: client_1.MatchStatus.SCHEDULED,
                });
                matchdayCount++;
            }
        }
        // Leg 2: Reverse Home/Away if Two-Legged is toggled
        if (isTwoLegged) {
            for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) {
                    matchesData.push({
                        tournamentId,
                        homeTeamId: teams[j].id,
                        awayTeamId: teams[i].id,
                        isTwoLegged: true,
                        scheduledAt: new Date(Date.now() + matchesData.length * 86400000),
                        roundName: `Leg 2 - Matchday ${matchdayCount}`,
                        status: client_1.MatchStatus.SCHEDULED,
                    });
                    matchdayCount++;
                }
            }
        }
        await database_1.prisma.match.createMany({ data: matchesData });
        // Initialize Standings Table for all participating teams
        for (const team of teams) {
            await database_1.prisma.standings.upsert({
                where: { teamId: team.id },
                update: {},
                create: {
                    tournamentId,
                    teamId: team.id,
                },
            });
        }
        return await database_1.prisma.match.findMany({
            where: { tournamentId },
            include: {
                homeTeam: { select: { id: true, name: true, code: true, logoUrl: true } },
                awayTeam: { select: { id: true, name: true, code: true, logoUrl: true } },
            },
            orderBy: { scheduledAt: 'asc' },
        });
    }
    /**
     * Record Match Result and Recalculate Standings & Player Stats
     */
    static async updateMatchResult(matchId, homeScore, awayScore, status, playerPerformances) {
        return await database_1.prisma.$transaction(async (tx) => {
            const match = await tx.match.update({
                where: { id: matchId },
                data: {
                    homeScore,
                    awayScore,
                    status,
                    aggregateHomeScore: homeScore,
                    aggregateAwayScore: awayScore,
                },
                include: { homeTeam: true, awayTeam: true },
            });
            // Record Player Performance Statistics if provided
            if (playerPerformances && playerPerformances.length > 0) {
                for (const perf of playerPerformances) {
                    await tx.playerPerformance.create({
                        data: {
                            matchId,
                            playerId: perf.playerId,
                            goals: perf.goals || 0,
                            assists: perf.assists || 0,
                            yellowCards: perf.yellowCards || 0,
                            redCards: perf.redCards || 0,
                        },
                    });
                }
            }
            if (status === client_1.MatchStatus.COMPLETED) {
                // Recalculate Home Team Standings
                await this.updateTeamStanding(tx, match.tournamentId, match.homeTeamId, homeScore, awayScore);
                // Recalculate Away Team Standings
                await this.updateTeamStanding(tx, match.tournamentId, match.awayTeamId, awayScore, homeScore);
            }
            return match;
        });
    }
    static async updateTeamStanding(tx, tournamentId, teamId, goalsFor, goalsAgainst) {
        const isWin = goalsFor > goalsAgainst;
        const isDraw = goalsFor === goalsAgainst;
        const points = isWin ? 3 : isDraw ? 1 : 0;
        await tx.standings.upsert({
            where: { teamId },
            update: {
                played: { increment: 1 },
                won: isWin ? { increment: 1 } : undefined,
                drawn: isDraw ? { increment: 1 } : undefined,
                lost: !isWin && !isDraw ? { increment: 1 } : undefined,
                goalsFor: { increment: goalsFor },
                goalsAgainst: { increment: goalsAgainst },
                goalDiff: { increment: goalsFor - goalsAgainst },
                points: { increment: points },
            },
            create: {
                tournamentId,
                teamId,
                played: 1,
                won: isWin ? 1 : 0,
                drawn: isDraw ? 1 : 0,
                lost: !isWin && !isDraw ? 1 : 0,
                goalsFor,
                goalsAgainst,
                goalDiff: goalsFor - goalsAgainst,
                points,
            },
        });
    }
    /**
     * Get Standings Table
     */
    static async getStandings(tournamentId) {
        const where = {};
        if (tournamentId && tournamentId !== 'default') {
            where.tournamentId = tournamentId;
        }
        return await database_1.prisma.standings.findMany({
            where,
            include: {
                team: { select: { id: true, name: true, code: true, logoUrl: true } },
            },
            orderBy: [{ points: 'desc' }, { goalDiff: 'desc' }, { goalsFor: 'desc' }],
        });
    }
    /**
     * Get Matches List
     */
    static async getMatches(tournamentId) {
        const where = {};
        if (tournamentId && tournamentId !== 'default') {
            where.tournamentId = tournamentId;
        }
        return await database_1.prisma.match.findMany({
            where,
            include: {
                homeTeam: { select: { id: true, name: true, code: true, logoUrl: true } },
                awayTeam: { select: { id: true, name: true, code: true, logoUrl: true } },
                performances: {
                    include: {
                        player: {
                            include: {
                                user: { select: { fullName: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { scheduledAt: 'asc' },
        });
    }
    /**
     * Get Player Tournament Statistics (Top Scorers, Top Assists, Clean Sheets, Cards)
     * PRD: "Track core football metrics assigned to individual players: Goals, Assists, Clean Sheets, Yellow Cards, Red Cards."
     */
    static async getPlayerStatistics(tournamentId) {
        const performances = await database_1.prisma.playerPerformance.findMany({
            include: {
                player: {
                    include: {
                        user: { select: { fullName: true, avatarUrl: true } },
                        team: { select: { name: true, code: true } },
                    },
                },
                match: true,
            },
        });
        // Aggregate statistics per player
        const statsMap = new Map();
        for (const p of performances) {
            const playerId = p.playerId;
            const current = statsMap.get(playerId) || {
                playerId,
                fullName: p.player.user.fullName,
                teamName: p.player.team?.name || 'Free Agent',
                teamCode: p.player.team?.code || 'FA',
                avatarUrl: p.player.user.avatarUrl,
                position: p.player.position,
                goals: 0,
                assists: 0,
                cleanSheets: 0,
                yellowCards: 0,
                redCards: 0,
                matchesPlayed: 0,
            };
            current.goals += p.goals;
            current.assists += p.assists;
            current.yellowCards += p.yellowCards;
            current.redCards += p.redCards;
            current.matchesPlayed += 1;
            // Clean sheet condition for GK or DEFENDER
            if ((p.player.position === client_1.Position.GOALKEEPER || p.player.position === client_1.Position.DEFENDER) &&
                p.match.status === client_1.MatchStatus.COMPLETED) {
                const isHome = p.match.homeTeamId === p.player.teamId;
                const opponentScore = isHome ? p.match.awayScore : p.match.homeScore;
                if (opponentScore === 0) {
                    current.cleanSheets += 1;
                }
            }
            statsMap.set(playerId, current);
        }
        const allStats = Array.from(statsMap.values());
        return {
            topScorers: [...allStats].sort((a, b) => b.goals - a.goals).slice(0, 10),
            topAssists: [...allStats].sort((a, b) => b.assists - a.assists).slice(0, 10),
            cleanSheets: [...allStats].filter((p) => p.cleanSheets > 0).sort((a, b) => b.cleanSheets - a.cleanSheets).slice(0, 10),
            cardsLeaderboard: [...allStats]
                .filter((p) => p.yellowCards > 0 || p.redCards > 0)
                .sort((a, b) => b.redCards * 3 + b.yellowCards - (a.redCards * 3 + a.yellowCards))
                .slice(0, 10),
        };
    }
}
exports.TournamentService = TournamentService;
