import { Router } from 'express';
import { NewsController } from '../controllers/news.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { roleGuard } from '../middlewares/roleGuard.middleware';
import { Role } from '@prisma/client';

const router = Router();

// Public route for Spectators & Fans
router.get('/', NewsController.getNews);

// Admin route to publish news
router.post('/', authenticate, roleGuard(Role.SUPER_ADMIN, Role.ADMIN), NewsController.createNews);

// Admin route to delete news
router.delete('/:id', authenticate, roleGuard(Role.SUPER_ADMIN, Role.ADMIN), NewsController.deleteNews);

export default router;
