"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewsController = void 0;
const news_service_1 = require("../services/news.service");
class NewsController {
    static async getNews(_req, res, next) {
        try {
            await news_service_1.NewsService.seedDefaultNewsIfEmpty();
            const news = await news_service_1.NewsService.getPublishedNews();
            res.status(200).json({ success: true, data: news });
        }
        catch (error) {
            next(error);
        }
    }
    static async createNews(req, res, next) {
        try {
            const { title, content, imageUrl } = req.body;
            const news = await news_service_1.NewsService.createNews(title, content, imageUrl);
            res.status(201).json({ success: true, message: 'News article published', data: news });
        }
        catch (error) {
            next(error);
        }
    }
    static async deleteNews(req, res, next) {
        try {
            const id = req.params.id;
            await news_service_1.NewsService.deleteNews(id);
            res.status(200).json({ success: true, message: 'News article deleted' });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.NewsController = NewsController;
