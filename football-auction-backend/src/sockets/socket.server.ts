import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { SOCKET_EVENTS, SOCKET_ROOMS } from '../constants/events';
import { AuctionEngineService } from '../services/auctionEngine.service';
import { AuthPayload } from '../middlewares/auth.middleware';

export function initSocketServer(httpServer: HttpServer): Server {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Socket Authentication Middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      // Allow unauthenticated guests into public room only
      socket.data.user = { userId: 'guest', role: 'PUBLIC_GUEST' };
      return next();
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Socket Connected: ${socket.id} (User: ${socket.data.user?.userId || 'Guest'})`);

    // Auto-join Public Room
    socket.join(SOCKET_ROOMS.PUBLIC);

    // Join Specific Rooms
    socket.on(SOCKET_EVENTS.JOIN_ROOM, (roomName: string) => {
      socket.join(roomName);
      console.log(`Socket ${socket.id} joined ${roomName}`);
    });

    socket.on(SOCKET_EVENTS.LEAVE_ROOM, (roomName: string) => {
      socket.leave(roomName);
      console.log(`Socket ${socket.id} left ${roomName}`);
    });

    // Handle Real-time Bidding over Socket
    socket.on(SOCKET_EVENTS.BID_PLACE, async (payload: { auctionSessionId: string; teamId: string; amount: number; isBlindBid?: boolean }) => {
      try {
        if (!socket.data.user || socket.data.user.userId === 'guest') {
          return socket.emit(SOCKET_EVENTS.BID_ERROR, { message: 'Authentication required to place bids' });
        }

        const result = await AuctionEngineService.placeBid({
          auctionSessionId: payload.auctionSessionId,
          teamId: payload.teamId,
          amount: payload.amount,
          isBlindBid: payload.isBlindBid,
        });

        // Broadcast to all auction room members
        io.to(SOCKET_ROOMS.AUCTION).emit(SOCKET_EVENTS.BID_BROADCAST, result);
      } catch (error: any) {
        socket.emit(SOCKET_EVENTS.BID_ERROR, { message: error.message || 'Bid failed' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket Disconnected: ${socket.id}`);
    });
  });

  return io;
}
