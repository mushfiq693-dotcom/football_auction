"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocketServer = initSocketServer;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const events_1 = require("../constants/events");
const auctionEngine_service_1 = require("../services/auctionEngine.service");
function initSocketServer(httpServer) {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST'],
        },
    });
    // Socket Authentication Middleware
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        if (!token) {
            // Allow unauthenticated guests into public room only
            socket.data.user = { userId: 'guest', role: 'PUBLIC_GUEST' };
            return next();
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
            socket.data.user = decoded;
            next();
        }
        catch (err) {
            next(new Error('Authentication failed'));
        }
    });
    io.on('connection', (socket) => {
        console.log(`🔌 Socket Connected: ${socket.id} (User: ${socket.data.user?.userId || 'Guest'})`);
        // Auto-join Public Room
        socket.join(events_1.SOCKET_ROOMS.PUBLIC);
        // Join Specific Rooms
        socket.on(events_1.SOCKET_EVENTS.JOIN_ROOM, (roomName) => {
            socket.join(roomName);
            console.log(`Socket ${socket.id} joined ${roomName}`);
        });
        socket.on(events_1.SOCKET_EVENTS.LEAVE_ROOM, (roomName) => {
            socket.leave(roomName);
            console.log(`Socket ${socket.id} left ${roomName}`);
        });
        // Handle Real-time Bidding over Socket
        socket.on(events_1.SOCKET_EVENTS.BID_PLACE, async (payload) => {
            try {
                if (!socket.data.user || socket.data.user.userId === 'guest') {
                    return socket.emit(events_1.SOCKET_EVENTS.BID_ERROR, { message: 'Authentication required to place bids' });
                }
                const result = await auctionEngine_service_1.AuctionEngineService.placeBid({
                    auctionSessionId: payload.auctionSessionId,
                    teamId: payload.teamId,
                    amount: payload.amount,
                    isBlindBid: payload.isBlindBid,
                });
                // Broadcast to all auction room members
                io.to(events_1.SOCKET_ROOMS.AUCTION).emit(events_1.SOCKET_EVENTS.BID_BROADCAST, result);
            }
            catch (error) {
                socket.emit(events_1.SOCKET_EVENTS.BID_ERROR, { message: error.message || 'Bid failed' });
            }
        });
        socket.on('disconnect', () => {
            console.log(`🔌 Socket Disconnected: ${socket.id}`);
        });
    });
    return io;
}
