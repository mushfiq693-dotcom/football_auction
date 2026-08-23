"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuctionController = void 0;
const auctionEngine_service_1 = require("../services/auctionEngine.service");
const database_1 = require("../config/database");
const client_1 = require("@prisma/client");
class AuctionController {
    static async getActiveSession(_req, res, next) {
        try {
            const session = await database_1.prisma.auctionSession.findFirst({
                where: {
                    status: { in: [client_1.AuctionStatus.ACTIVE, client_1.AuctionStatus.PAUSED, client_1.AuctionStatus.SCHEDULED] },
                },
                include: {
                    player: {
                        include: {
                            user: { select: { fullName: true, avatarUrl: true } },
                            category: true,
                        },
                    },
                    bids: {
                        include: { team: { select: { id: true, name: true, code: true, logoUrl: true } } },
                        orderBy: { createdAt: 'desc' },
                        take: 20,
                    },
                    season: true,
                },
                orderBy: { createdAt: 'desc' },
            });
            if (!session) {
                return res.status(200).json({ success: true, data: null });
            }
            const totalBudget = session.season?.totalBudget || 100000;
            const basePrice = session.player.category?.basePrice || 1000;
            const dynamicIncrements = auctionEngine_service_1.AuctionEngineService.calculateDynamicIncrements(session.currentBid, totalBudget, basePrice);
            // In Blind mode, mask the amounts if user is not Super Admin
            let sanitizedBids = session.bids;
            if (session.auctionType === client_1.AuctionType.BLIND) {
                sanitizedBids = session.bids.map((b) => ({
                    ...b,
                    amount: 0, // masked until revealed
                }));
            }
            return res.status(200).json({
                success: true,
                data: {
                    ...session,
                    bids: sanitizedBids,
                    dynamicIncrements,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async getUnsoldPool(_req, res, next) {
        try {
            const unsoldPlayers = await database_1.prisma.player.findMany({
                where: {
                    registrationStatus: 'APPROVED',
                    isSold: false,
                    deletedAt: null,
                },
                include: {
                    user: { select: { fullName: true, avatarUrl: true } },
                    category: true,
                },
                orderBy: { createdAt: 'asc' },
            });
            return res.status(200).json({
                success: true,
                data: unsoldPlayers,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async createSession(req, res, next) {
        try {
            const { seasonId, playerId, auctionType, timerSeconds } = req.body;
            const session = await database_1.prisma.auctionSession.create({
                data: {
                    seasonId,
                    playerId,
                    auctionType: auctionType || client_1.AuctionType.NORMAL,
                    timerSeconds: timerSeconds || 30,
                    status: client_1.AuctionStatus.ACTIVE,
                },
                include: {
                    player: { include: { user: true, category: true } },
                },
            });
            const io = req.app.get('io');
            if (io) {
                io.to('room:auction').emit('auction:state_change', session);
            }
            res.status(201).json({
                success: true,
                message: 'Auction session created successfully',
                data: session,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async placeBid(req, res, next) {
        try {
            const result = await auctionEngine_service_1.AuctionEngineService.placeBid(req.body);
            const io = req.app.get('io');
            if (io) {
                io.to('room:auction').emit('bid:broadcast', result);
            }
            res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async updateStatus(req, res, next) {
        try {
            const id = req.params.id;
            const { status } = req.body;
            const session = await database_1.prisma.auctionSession.update({
                where: { id },
                data: { status },
                include: { player: { include: { user: true } } },
            });
            const io = req.app.get('io');
            if (io) {
                io.to('room:auction').emit('auction:state_change', session);
            }
            res.status(200).json({
                success: true,
                message: `Auction session status updated to ${status}`,
                data: session,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async finalizeAuction(req, res, next) {
        try {
            const id = req.params.id;
            const result = await auctionEngine_service_1.AuctionEngineService.finalizeAuction(id);
            const io = req.app.get('io');
            if (io) {
                io.to('room:auction').emit('auction:sold', result);
            }
            res.status(200).json({
                success: true,
                message: `Auction finalized: ${result.status}`,
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    }
    static async rollback(req, res, next) {
        try {
            const id = req.params.id;
            const session = await auctionEngine_service_1.AuctionEngineService.rollbackAuction(id);
            const io = req.app.get('io');
            if (io) {
                io.to('room:auction').emit('auction:rollback', session);
            }
            res.status(200).json({
                success: true,
                message: 'Auction top bid rolled back successfully',
                data: session,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuctionController = AuctionController;
