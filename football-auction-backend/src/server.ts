import http from 'http';
import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { initSocketServer } from './sockets/socket.server';

const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocketServer(server);
app.set('io', io);

async function startServer() {
  await connectDatabase();

  server.listen(parseInt(env.PORT, 10), () => {
    console.log(`🚀 Football Auction Backend running on port ${env.PORT} in [${env.NODE_ENV}] mode`);
  });
}

// Start server with PgBouncer prepared statement fix
startServer();
