"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const errorHandler_middleware_1 = require("./middlewares/errorHandler.middleware");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const globalState_routes_1 = __importDefault(require("./routes/globalState.routes"));
const player_routes_1 = __importDefault(require("./routes/player.routes"));
const team_routes_1 = __importDefault(require("./routes/team.routes"));
const auction_routes_1 = __importDefault(require("./routes/auction.routes"));
const tournament_routes_1 = __importDefault(require("./routes/tournament.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const nuke_routes_1 = __importDefault(require("./routes/nuke.routes"));
const news_routes_1 = __importDefault(require("./routes/news.routes"));
const notification_routes_1 = __importDefault(require("./routes/notification.routes"));
const app = (0, express_1.default)();
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health Check
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
// API Routes
app.use('/api/v1/auth', auth_routes_1.default);
app.use('/api/v1/global-state', globalState_routes_1.default);
app.use('/api/v1/players', player_routes_1.default);
app.use('/api/v1/teams', team_routes_1.default);
app.use('/api/v1/auction', auction_routes_1.default);
app.use('/api/v1/tournaments', tournament_routes_1.default);
app.use('/api/v1/upload', upload_routes_1.default);
app.use('/api/v1/nuke', nuke_routes_1.default);
app.use('/api/v1/news', news_routes_1.default);
app.use('/api/v1/notifications', notification_routes_1.default);
// Global Error Handler
app.use(errorHandler_middleware_1.errorHandler);
exports.default = app;
