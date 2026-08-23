"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TeamController = void 0;
const team_service_1 = require("../services/team.service");
class TeamController {
    static async createTeam(req, res, next) {
        try {
            const team = await team_service_1.TeamService.createTeam(req.body);
            res.status(201).json({
                success: true,
                message: 'Team created with wallet budget successfully',
                data: team,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getTeams(req, res, next) {
        try {
            const seasonId = req.query.seasonId;
            const teams = await team_service_1.TeamService.getTeams(seasonId);
            res.status(200).json({
                success: true,
                data: teams,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getTeamById(req, res, next) {
        try {
            const id = req.params.id;
            const team = await team_service_1.TeamService.getTeamById(id);
            res.status(200).json({
                success: true,
                data: team,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.TeamController = TeamController;
