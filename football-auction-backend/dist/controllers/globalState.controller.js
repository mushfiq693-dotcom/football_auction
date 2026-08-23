"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalStateController = void 0;
const globalState_service_1 = require("../services/globalState.service");
class GlobalStateController {
    static async getState(_req, res, next) {
        try {
            const state = await globalState_service_1.GlobalStateService.getActiveState();
            res.status(200).json({
                success: true,
                data: state,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async updatePhase(req, res, next) {
        try {
            const { phase } = req.body;
            const updatedBy = req.user.userId;
            const state = await globalState_service_1.GlobalStateService.updatePhase(phase, updatedBy);
            // Emit realtime socket event if io is attached to app
            const io = req.app.get('io');
            if (io) {
                io.emit('phase:changed', state);
            }
            res.status(200).json({
                success: true,
                message: `Global phase changed to ${phase}`,
                data: state,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.GlobalStateController = GlobalStateController;
