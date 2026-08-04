import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';
import { MatchStatus } from '@prisma/client';

export class TournamentService {
  /**
   * Generate Round-Robin Fixtures for a Tournament
   */
  static async generateFixtures(tournamentId: string, seasonId: string) {
    const teams = await prisma.team.findMany({
      where: { seasonId, deletedAt: null },
    });

    if (teams.length < 2) {
      throw new AppError(400, 'At least 2 teams are required to generate fixtures');
    }

    const matchesData: any[] = [];
    const n = teams.length;

    // Single Round Robin algorithm
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        matchesData.push({
          tournamentId,
          homeTeamId: teams[i].id,
          awayTeamId: teams[j].id,
          scheduledAt: new Date(Date.now() + matchesData.length * 86400000), // Spaced by days
          roundName: `Matchday ${matchesData.length + 1}`,
          status: MatchStatus.SCHEDULED,
        });
      }
    }

    await prisma.match.createMany({ data: matchesData });

    // Initialize Standings Table for teams
    for (const team of teams) {
      await prisma.standings.upsert({
        where: { teamId: team.id },
        update: {},
        create: {
          tournamentId,
          teamId: team.id,
        },
      });
    }

    return await prisma.match.findMany({
      where: { tournamentId },
      include: {
        homeTeam: { select: { name: true, code: true, logoUrl: true } },
        awayTeam: { select: { name: true, code: true, logoUrl: true } },
      },
    });
  }

  /**
   * Record Match Result and Recalculate Standings Dynamically
   */
  static async updateMatchResult(matchId: string, homeScore: number, awayScore: number, status: MatchStatus) {
    return await prisma.$transaction(async (tx) => {
      const match = await tx.match.update({
        where: { id: matchId },
        data: { homeScore, awayScore, status },
        include: { homeTeam: true, awayTeam: true },
      });

      if (status === MatchStatus.COMPLETED) {
        // Recalculate Home Team Standings
        await this.updateTeamStanding(tx, match.tournamentId, match.homeTeamId, homeScore, awayScore);
        // Recalculate Away Team Standings
        await this.updateTeamStanding(tx, match.tournamentId, match.awayTeamId, awayScore, homeScore);
      }

      return match;
    });
  }

  private static async updateTeamStanding(
    tx: any,
    tournamentId: string,
    teamId: string,
    goalsFor: number,
    goalsAgainst: number
  ) {
    const isWin = goalsFor > goalsAgainst;
    const isDraw = goalsFor === goalsAgainst;
    const points = isWin ? 3 : isDraw ? 1 : 0;

    await tx.standings.upsert({
      where: { teamId },
      update: {
        played: { increment: 1 },
        won: isWin ? { increment: 1 } : undefined,
        drawn: isDraw ? { increment: 1 } : undefined,
        lost: (!isWin && !isDraw) ? { increment: 1 } : undefined,
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
        lost: (!isWin && !isDraw) ? 1 : 0,
        goalsFor,
        goalsAgainst,
        goalDiff: goalsFor - goalsAgainst,
        points,
      },
    });
  }

  static async getStandings(tournamentId: string) {
    return await prisma.standings.findMany({
      where: { tournamentId },
      include: {
        team: { select: { id: true, name: true, code: true, logoUrl: true } },
      },
      orderBy: [
        { points: 'desc' },
        { goalDiff: 'desc' },
        { goalsFor: 'desc' },
      ],
    });
  }
}
