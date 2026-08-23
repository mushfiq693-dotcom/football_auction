"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
exports.connectDatabase = connectDatabase;
const client_1 = require("@prisma/client");
exports.prisma = new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});
async function connectDatabase() {
    try {
        await exports.prisma.$connect();
        console.log('✅ PostgreSQL Database connected successfully via Prisma');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
    }
}
