import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, NotificationController.getNotifications);
router.patch('/:id/read', authenticate, NotificationController.markAsRead);
router.patch('/read-all', authenticate, NotificationController.markAllAsRead);

export default router;
