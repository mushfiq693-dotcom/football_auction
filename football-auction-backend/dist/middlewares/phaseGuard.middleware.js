"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.phaseGuard = phaseGuard;
const errorHandler_middleware_1 = require("./errorHandler.middleware");
const database_1 = require("../config/database");
const client_1 = require("@prisma/client");
function phaseGuard(...allowedPhases) {
    return async (req, _res, next) => {
        try {
            // Super admins and admins bypass phase restrictions for management
            if (req.user && (req.user.role === client_1.Role.SUPER_ADMIN || req.user.role === client_1.Role.ADMIN)) {
                return next();
            }
            const globalState = await database_1.prisma.globalState.findFirst({
                orderBy: { updatedAt: 'desc' },
            });
            const currentPhase = globalState?.activePhase || client_1.Phase.SETUP;
            if (!allowedPhases.includes(currentPhase)) {
                return next(new errorHandler_middleware_1.AppError(403, `Phase Conflict: Action not permitted in current phase '${currentPhase}'. Allowed phase(s): ${allowedPhases.join(', ')}`));
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
}
