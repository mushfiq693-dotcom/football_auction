import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { Role } from '@prisma/client';

export class NotificationController {
  static async getNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const userRole = req.user!.role;

      // 1. Fetch direct DB notifications
      const userNotifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 15,
      });

      // 2. If Super Admin or Admin, also aggregate real-time actionable system notifications
      let systemAlerts: any[] = [];
      if (userRole === Role.SUPER_ADMIN || userRole === Role.ADMIN) {
        const [pendingUsers, pendingPlayers, activeAuction, activeSeason] = await Promise.all([
          prisma.user.count({ where: { isAdminApproved: false, role: { not: Role.SUPER_ADMIN } } }),
          prisma.player.count({ where: { registrationStatus: 'PENDING' } }),
          prisma.auctionSession.findFirst({ where: { status: 'ACTIVE' }, include: { player: true } }),
          prisma.season.findFirst({ where: { isActive: true } }),
        ]);

        if (pendingUsers > 0) {
          systemAlerts.push({
            id: 'sys-pending-users',
            title: '👥 Pending User Approvals',
            message: `${pendingUsers} new user account${pendingUsers > 1 ? 's' : ''} awaiting Super Admin approval.`,
            type: 'USER_APPROVAL',
            link: '/admin',
            createdAt: new Date().toISOString(),
            isRead: false,
          });
        }

        if (pendingPlayers > 0) {
          systemAlerts.push({
            id: 'sys-pending-players',
            title: '⚽ Pending Player Registrations',
            message: `${pendingPlayers} football athlete${pendingPlayers > 1 ? 's' : ''} awaiting rating & roster approval.`,
            type: 'PLAYER_APPROVAL',
            link: '/admin',
            createdAt: new Date().toISOString(),
            isRead: false,
          });
        }

        if (activeAuction) {
          systemAlerts.push({
            id: `sys-auction-${activeAuction.id}`,
            title: '⚡ Live Auction in Progress',
            message: `Lot active for ${activeAuction.player.jerseyName || 'Player'}. Bidding stage is live!`,
            type: 'AUCTION_LIVE',
            link: '/auction',
            createdAt: activeAuction.createdAt.toISOString(),
            isRead: false,
          });
        }
      }

      const combined = [...systemAlerts, ...userNotifications];
      const unreadCount = combined.filter((n) => !n.isRead).length;

      return res.status(200).json({
        success: true,
        data: {
          notifications: combined,
          unreadCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      if (!id.startsWith('sys-')) {
        await prisma.notification.updateMany({
          where: { id, userId: req.user!.userId },
          data: { isRead: true },
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Notification marked as read',
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user!.userId },
        data: { isRead: true },
      });

      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  }
}
