"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const env_1 = require("../config/env");
const errorHandler_middleware_1 = require("../middlewares/errorHandler.middleware");
const client_1 = require("@prisma/client");
class AuthService {
    static async register(dto) {
        const existingUser = await database_1.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (existingUser) {
            throw new errorHandler_middleware_1.AppError(400, 'User with this email already exists');
        }
        const passwordHash = await bcryptjs_1.default.hash(dto.password, 10);
        const role = dto.role || client_1.Role.PLAYER;
        // Super Admin is auto-approved. All other roles require Super Admin approval.
        const isAdminApproved = role === client_1.Role.SUPER_ADMIN ? true : false;
        const user = await database_1.prisma.user.create({
            data: {
                email: dto.email.toLowerCase(),
                passwordHash,
                fullName: dto.fullName,
                role,
                isAdminApproved,
                phone: dto.phone,
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                isAdminApproved: true,
                createdAt: true,
            },
        });
        if (!isAdminApproved) {
            return {
                user,
                token: null,
                message: 'Account registered successfully! A Super Admin must approve your account before you can log in.',
            };
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRES_IN });
        return { user, token, message: 'Super Admin account created and logged in successfully!' };
    }
    static async login(dto) {
        const user = await database_1.prisma.user.findUnique({
            where: { email: dto.email.toLowerCase() },
        });
        if (!user || user.deletedAt) {
            throw new errorHandler_middleware_1.AppError(401, 'Invalid credentials');
        }
        const isMatch = await bcryptjs_1.default.compare(dto.password, user.passwordHash);
        if (!isMatch) {
            throw new errorHandler_middleware_1.AppError(401, 'Invalid credentials');
        }
        if (!user.isAdminApproved) {
            throw new errorHandler_middleware_1.AppError(403, `Your account (${user.role}) is pending Super Admin approval. Please wait for the Super Admin to approve your registration.`);
        }
        const token = jsonwebtoken_1.default.sign({ userId: user.id, email: user.email, role: user.role }, env_1.env.JWT_SECRET, { expiresIn: env_1.env.JWT_EXPIRES_IN });
        return {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
                avatarUrl: user.avatarUrl,
                isAdminApproved: user.isAdminApproved,
            },
            token,
        };
    }
    static async getCurrentUser(userId) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
            include: {
                playerProfile: true,
                teamOwner: {
                    include: { wallet: true },
                },
            },
        });
        if (!user || user.deletedAt) {
            throw new errorHandler_middleware_1.AppError(404, 'User not found');
        }
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    static async getPendingUsers(roleFilter) {
        const where = {
            isAdminApproved: false,
            deletedAt: null,
        };
        if (roleFilter) {
            where.role = roleFilter;
        }
        return await database_1.prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                createdAt: true,
                phone: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    static async verifyUser(userId, approved) {
        const user = await database_1.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || user.deletedAt) {
            throw new errorHandler_middleware_1.AppError(404, 'User not found');
        }
        if (approved) {
            const updatedUser = await database_1.prisma.user.update({
                where: { id: userId },
                data: { isAdminApproved: true },
                select: { id: true, email: true, fullName: true, role: true, isAdminApproved: true },
            });
            return { status: 'APPROVED', user: updatedUser };
        }
        else {
            await database_1.prisma.user.delete({
                where: { id: userId },
            });
            return { status: 'REJECTED', message: 'User registration request rejected and deleted.' };
        }
    }
}
exports.AuthService = AuthService;
