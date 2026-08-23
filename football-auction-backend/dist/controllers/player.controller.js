"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerController = void 0;
const player_service_1 = require("../services/player.service");
class PlayerController {
    static async register(req, res, next) {
        try {
            const userId = req.user.userId;
            const player = await player_service_1.PlayerService.registerPlayer(userId, req.body);
            res.status(201).json({
                success: true,
                message: 'Player profile submitted successfully',
                data: player,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getPlayers(req, res, next) {
        try {
            const seasonId = req.query.seasonId;
            const status = req.query.status;
            const categoryId = req.query.categoryId;
            const players = await player_service_1.PlayerService.getPlayers({
                seasonId,
                status,
                categoryId,
            });
            res.status(200).json({
                success: true,
                data: players,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async verifyPlayer(req, res, next) {
        try {
            const id = req.params.id;
            const { status, categoryId, rejectionReason } = req.body;
            const player = await player_service_1.PlayerService.verifyPlayer(id, status, categoryId, rejectionReason);
            res.status(200).json({
                success: true,
                message: `Player ${status.toLowerCase()} successfully`,
                data: player,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.PlayerController = PlayerController;
