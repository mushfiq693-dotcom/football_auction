"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TournamentController = void 0;
const tournament_service_1 = require("../services/tournament.service");
const database_1 = require("../config/database");
class TournamentController {
    static async createTournament(req, res, next) {
        try {
            const { seasonId, name, format } = req.body;
            const tournament = await database_1.prisma.tournament.create({
                data: { seasonId, name, format: format || 'ROUND_ROBIN' },
            });
            res.status(201).json({
                success: true,
                message: 'Tournament created successfully',
                data: tournament,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async generateFixtures(req, res, next) {
        try {
            const id = req.params.id;
            const { seasonId, isTwoLegged } = req.body;
            const matches = await tournament_service_1.TournamentService.generateFixtures(id, seasonId, isTwoLegged || false);
            res.status(200).json({
                success: true,
                message: 'Fixtures and Standings initialized successfully',
                data: matches,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateMatchResult(req, res, next) {
        try {
            const matchId = req.params.matchId;
            const { homeScore, awayScore, status, playerPerformances } = req.body;
            const match = await tournament_service_1.TournamentService.updateMatchResult(matchId, homeScore, awayScore, status, playerPerformances);
            const io = req.app.get('io');
            if (io) {
                io.emit('match:score_update', match);
                const standings = await tournament_service_1.TournamentService.getStandings(match.tournamentId);
                io.emit('standings:update', standings);
                const statistics = await tournament_service_1.TournamentService.getPlayerStatistics(match.tournamentId);
                io.emit('statistics:update', statistics);
            }
            res.status(200).json({
                success: true,
                message: 'Match result updated successfully',
                data: match,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getStandings(req, res, next) {
        try {
            const id = req.params.id;
            const standings = await tournament_service_1.TournamentService.getStandings(id);
            res.status(200).json({
                success: true,
                data: standings,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getMatches(req, res, next) {
        try {
            const id = req.params.id;
            const matches = await tournament_service_1.TournamentService.getMatches(id);
            res.status(200).json({
                success: true,
                data: matches,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getPlayerStatistics(req, res, next) {
        try {
            const id = req.params.id;
            const statistics = await tournament_service_1.TournamentService.getPlayerStatistics(id);
            res.status(200).json({
                success: true,
                data: statistics,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TournamentController = TournamentController;
