import { Request, Response, NextFunction } from 'express';
import { GlobalStateService } from '../services/globalState.service';

export class GlobalStateController {
  static async getState(_req: Request, res: Response, next: NextFunction) {
    try {
      const state = await GlobalStateService.getActiveState();
      res.status(200).json({
        success: true,
        data: state,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updatePhase(req: Request, res: Response, next: NextFunction) {
    try {
      const { phase } = req.body;
      const updatedBy = req.user!.userId;

      const state = await GlobalStateService.updatePhase(phase, updatedBy);

      // Emit realtime socket event if io is attached to app
      const io = req.app.get('io');
      if (io) {
        io.emit('phase:changed', state);
      }

      res.status(200).json({
        success: true,
        message: `Global phase changed to ${phase}`,
        data: state,
      });
    } catch (error) {
      next(error);
    }
  }
}
