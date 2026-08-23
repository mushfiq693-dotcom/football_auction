"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const team_controller_1 = require("../controllers/team.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const roleGuard_middleware_1 = require("../middlewares/roleGuard.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const createTeamSchema = zod_1.z.object({
    body: zod_1.z.object({
        seasonId: zod_1.z.string().uuid(),
        ownerId: zod_1.z.string().uuid(),
        name: zod_1.z.string().min(2),
        code: zod_1.z.string().min(2).max(4),
        logoUrl: zod_1.z.string().optional(),
        primaryColor: zod_1.z.string().optional(),
        secondaryColor: zod_1.z.string().optional(),
        allocatedBudget: zod_1.z.number().positive(),
        maxPlayerLimit: zod_1.z.number().int().positive().optional(),
    }),
});
router.post('/', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN), (0, validate_middleware_1.validate)(createTeamSchema), team_controller_1.TeamController.createTeam);
router.get('/', team_controller_1.TeamController.getTeams);
router.get('/:id', team_controller_1.TeamController.getTeamById);
exports.default = router;
