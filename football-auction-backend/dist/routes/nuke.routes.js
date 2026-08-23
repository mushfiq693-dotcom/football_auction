"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const nuke_service_1 = require("../services/nuke.service");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const roleGuard_middleware_1 = require("../middlewares/roleGuard.middleware");
const client_1 = require("@prisma/client");
const errorHandler_middleware_1 = require("../middlewares/errorHandler.middleware");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
// Middleware to verify Super Admin password confirmation for destructive Nuke operations
async function verifyAdminPassword(req, _res, next) {
    try {
        const { password } = req.body;
        if (!password) {
            throw new errorHandler_middleware_1.AppError(400, 'Super Admin password is required to authorize lifecycle reset');
        }
        const user = await database_1.prisma.user.findUnique({
            where: { id: req.user.userId },
        });
        if (!user)
            throw new errorHandler_middleware_1.AppError(404, 'User not found');
        const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            throw new errorHandler_middleware_1.AppError(401, 'Invalid Super Admin password. Action aborted.');
        }
        next();
    }
    catch (err) {
        next(err);
    }
}
// Level 1: Tournament Wipe
router.post('/level1', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.SUPER_ADMIN), verifyAdminPassword, async (req, res, next) => {
    try {
        const result = await nuke_service_1.NukeService.level1TournamentWipe(req.user.userId);
        return res.status(200).json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
// Level 2: Roster Wipe
router.post('/level2', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.SUPER_ADMIN), verifyAdminPassword, async (req, res, next) => {
    try {
        const result = await nuke_service_1.NukeService.level2RosterWipe(req.user.userId);
        return res.status(200).json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
// Level 3: Factory Reset
router.post('/level3', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.SUPER_ADMIN), verifyAdminPassword, async (req, res, next) => {
    try {
        const result = await nuke_service_1.NukeService.level3FactoryReset(req.user.userId);
        return res.status(200).json({ success: true, data: result });
    }
    catch (err) {
        next(err);
    }
});
exports.default = router;
