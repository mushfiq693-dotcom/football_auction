"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
class AuthController {
    static async register(req, res, next) {
        try {
            const result = await auth_service_1.AuthService.register(req.body);
            res.status(201).json({
                success: true,
                message: result.message || 'User registered successfully',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async login(req, res, next) {
        try {
            const result = await auth_service_1.AuthService.login(req.body);
            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async me(req, res, next) {
        try {
            const user = await auth_service_1.AuthService.getCurrentUser(req.user.userId);
            res.status(200).json({
                success: true,
                data: user,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getAllUsers(req, res, next) {
        try {
            const roleFilter = req.query.role;
            const users = await auth_service_1.AuthService.getAllUsers(roleFilter);
            res.status(200).json({
                success: true,
                data: users,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getPendingUsers(req, res, next) {
        try {
            const roleFilter = req.query.role;
            const pendingUsers = await auth_service_1.AuthService.getPendingUsers(roleFilter);
            res.status(200).json({
                success: true,
                data: pendingUsers,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async verifyUser(req, res, next) {
        try {
            const userId = req.params.userId;
            const { approved } = req.body;
            const result = await auth_service_1.AuthService.verifyUser(userId, approved);
            res.status(200).json({
                success: true,
                message: `User registration ${approved ? 'approved' : 'rejected'} successfully`,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteUser(req, res, next) {
        try {
            const targetUserId = req.params.userId;
            const requestingUserId = req.user.userId;
            const result = await auth_service_1.AuthService.deleteUser(targetUserId, requestingUserId);
            res.status(200).json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
