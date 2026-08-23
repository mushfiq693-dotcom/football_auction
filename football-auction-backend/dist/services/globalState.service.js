"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobalStateService = void 0;
const database_1 = require("../config/database");
const client_1 = require("@prisma/client");
class GlobalStateService {
    static async getActiveState() {
        let state = await database_1.prisma.globalState.findFirst({
            orderBy: { updatedAt: 'desc' },
        });
        if (!state) {
            state = await database_1.prisma.globalState.create({
                data: {
                    activePhase: client_1.Phase.SETUP,
                },
            });
        }
        return state;
    }
    static async updatePhase(newPhase, updatedBy) {
        const currentState = await this.getActiveState();
        const updatedState = await database_1.prisma.globalState.update({
            where: { id: currentState.id },
            data: {
                activePhase: newPhase,
                updatedBy,
            },
        });
        // Create Audit Log
        await database_1.prisma.auditLog.create({
            data: {
                userId: updatedBy,
                action: 'PHASE_CHANGED',
                details: {
                    previousPhase: currentState.activePhase,
                    newPhase,
                },
            },
        });
        return updatedState;
    }
}
exports.GlobalStateService = GlobalStateService;
