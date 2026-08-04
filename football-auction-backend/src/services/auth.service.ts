import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../middlewares/errorHandler.middleware';
import { Role } from '@prisma/client';

export interface RegisterDto {
  email: string;
  password: string;
  fullName: string;
  role?: Role;
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export class AuthService {
  static async register(dto: RegisterDto) {
    const existingUser = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError(400, 'User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const role = dto.role || Role.PLAYER;
    const isAdminApproved = role === Role.ADMIN ? false : true;

    const user = await prisma.user.create({
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

    if (role === Role.ADMIN && !isAdminApproved) {
      return {
        user,
        token: null,
        message: 'Admin registration submitted! A Super Admin must approve your account before you can log in.',
      };
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

    return { user, token };
  }

  static async login(dto: LoginDto) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || user.deletedAt) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError(401, 'Invalid credentials');
    }

    if (user.role === Role.ADMIN && !user.isAdminApproved) {
      throw new AppError(403, 'Your Admin account is pending approval by a Super Admin');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN as any }
    );

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

  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        playerProfile: true,
        teamOwner: {
          include: { wallet: true },
        },
      },
    });

    if (!user || user.deletedAt) {
      throw new AppError(404, 'User not found');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async getPendingAdmins() {
    return await prisma.user.findMany({
      where: {
        role: Role.ADMIN,
        isAdminApproved: false,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async verifyAdmin(userId: string, approved: boolean) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.deletedAt) {
      throw new AppError(404, 'User not found');
    }

    if (approved) {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { isAdminApproved: true },
        select: { id: true, email: true, fullName: true, role: true, isAdminApproved: true },
      });
      return { status: 'APPROVED', user: updatedUser };
    } else {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role: Role.PLAYER, isAdminApproved: true },
        select: { id: true, email: true, fullName: true, role: true, isAdminApproved: true },
      });
      return { status: 'REJECTED', user: updatedUser };
    }
  }
}
