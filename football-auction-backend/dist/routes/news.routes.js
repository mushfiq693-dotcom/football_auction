"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const news_controller_1 = require("../controllers/news.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const roleGuard_middleware_1 = require("../middlewares/roleGuard.middleware");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
// Public route for Spectators & Fans
router.get('/', news_controller_1.NewsController.getNews);
// Admin route to publish news
router.post('/', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN), news_controller_1.NewsController.createNews);
// Admin route to delete news
router.delete('/:id', auth_middleware_1.authenticate, (0, roleGuard_middleware_1.roleGuard)(client_1.Role.SUPER_ADMIN, client_1.Role.ADMIN), news_controller_1.NewsController.deleteNews);
exports.default = router;
