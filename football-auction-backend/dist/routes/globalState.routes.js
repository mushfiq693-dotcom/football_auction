"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const globalState_controller_1 = require("../controllers/globalState.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const roleGuard_middleware_1 = require("../middlewares/roleGuard.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const updatePhaseSchema = zod_1.z.object({
    body: zod_1.z.object({
        phase: zod_1.z.nativeEnum(client_1.Phase),
    }),
});
router.get('/', globalState_controller_1.GlobalStateController.getState);
router.post('/phase', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.SUPER_ADMIN), (0, validate_middleware_1.validate)(updatePhaseSchema), globalState_controller_1.GlobalStateController.updatePhase);
exports.default = router;
