import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/errorHandler.middleware';
import authRoutes from './routes/auth.routes';
import globalStateRoutes from './routes/globalState.routes';
import playerRoutes from './routes/player.routes';
import teamRoutes from './routes/team.routes';
import auctionRoutes from './routes/auction.routes';
import tournamentRoutes from './routes/tournament.routes';
import uploadRoutes from './routes/upload.routes';
import nukeRoutes from './routes/nuke.routes';
import newsRoutes from './routes/news.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/global-state', globalStateRoutes);
app.use('/api/v1/players', playerRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/auction', auctionRoutes);
app.use('/api/v1/tournaments', tournamentRoutes);
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/nuke', nukeRoutes);
app.use('/api/v1/news', newsRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;
