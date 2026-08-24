"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const player_controller_1 = require("../controllers/player.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const roleGuard_middleware_1 = require("../middlewares/roleGuard.middleware");
const validate_middleware_1 = require("../middlewares/validate.middleware");
const client_1 = require("@prisma/client");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
const registerPlayerSchema = zod_1.z.object({
    body: zod_1.z.object({
        seasonId: zod_1.z.string().uuid().optional().or(zod_1.z.literal('')),
        studentId: zod_1.z.string().min(2, 'Student ID is required').optional(),
        academicSession: zod_1.z.string().min(4, 'Academic session is required').optional(),
        jerseyName: zod_1.z.string().min(2, 'Jersey name is required').optional(),
        photoUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
        photoPublicId: zod_1.z.string().optional().or(zod_1.z.literal('')),
        position: zod_1.z.nativeEnum(client_1.Position),
        secondaryPosition: zod_1.z.nativeEnum(client_1.Position).optional().or(zod_1.z.literal('')).nullable(),
        jerseyNumber: zod_1.z.preprocess((val) => (val === '' || val === null || val === undefined || Number.isNaN(Number(val)) ? undefined : Number(val)), zod_1.z.number().int().positive().optional()),
    }),
});
const verifyPlayerSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.nativeEnum(client_1.RegistrationStatus),
        categoryId: zod_1.z.string().uuid().optional(),
        rejectionReason: zod_1.z.string().optional(),
    }),
});
const setRatingSchema = zod_1.z.object({
    body: zod_1.z.object({
        rating: zod_1.z.number().min(1).max(99),
    }),
});
// Player fetches their own profile
router.get('/me', auth_middleware_1.authenticate, player_controller_1.PlayerController.getMyProfile);
// Player creates/updates profile
router.post('/register', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.PLAYER, client_1.Role.SUPER_ADMIN), (0, validate_middleware_1.validate)(registerPlayerSchema), player_controller_1.PlayerController.register);
// Get player roster
router.get('/', player_controller_1.PlayerController.getPlayers);
// Podium Admin / Super Admin sets rating & tier
router.patch('/:id/rating', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN), (0, validate_middleware_1.validate)(setRatingSchema), player_controller_1.PlayerController.setRating);
// Admin approves or rejects player profile
router.patch('/:id/verify', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN), (0, validate_middleware_1.validate)(verifyPlayerSchema), player_controller_1.PlayerController.verifyPlayer);
exports.default = router;
