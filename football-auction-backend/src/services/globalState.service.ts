import { prisma } from '../config/database';
import { Phase } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler.middleware';

export class GlobalStateService {
  static async getActiveState() {
    let state = await prisma.globalState.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!state) {
      state = await prisma.globalState.create({
        data: {
          activePhase: Phase.SETUP,
        },
      });
    }

    return state;
  }

  static async updatePhase(newPhase: Phase, updatedBy: string) {
    const currentState = await this.getActiveState();

    const updatedState = await prisma.globalState.update({
      where: { id: currentState.id },
      data: {
        activePhase: newPhase,
        updatedBy,
      },
    });

    // Create Audit Log
    await prisma.auditLog.create({
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
