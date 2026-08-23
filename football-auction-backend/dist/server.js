"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const database_1 = require("./config/database");
const socket_server_1 = require("./sockets/socket.server");
const server = http_1.default.createServer(app_1.default);
// Initialize Socket.IO
const io = (0, socket_server_1.initSocketServer)(server);
app_1.default.set('io', io);
async function startServer() {
    await (0, database_1.connectDatabase)();
    server.listen(parseInt(env_1.env.PORT, 10), () => {
        console.log(`🚀 Football Auction Backend running on port ${env_1.env.PORT} in [${env_1.env.NODE_ENV}] mode`);
    });
}
// Start server with PgBouncer prepared statement fix
startServer();
