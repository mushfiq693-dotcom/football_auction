import { Request, Response, NextFunction } from 'express';
import { NewsService } from '../services/news.service';

export class NewsController {
  static async getNews(_req: Request, res: Response, next: NextFunction) {
    try {
      await NewsService.seedDefaultNewsIfEmpty();
      const news = await NewsService.getPublishedNews();
      res.status(200).json({ success: true, data: news });
    } catch (error) {
      next(error);
    }
  }

  static async createNews(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, content, imageUrl } = req.body;
      const news = await NewsService.createNews(title, content, imageUrl);
      res.status(201).json({ success: true, message: 'News article published', data: news });
    } catch (error) {
      next(error);
    }
  }

  static async deleteNews(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      await NewsService.deleteNews(id);
      res.status(200).json({ success: true, message: 'News article deleted' });
    } catch (error) {
      next(error);
    }
  }
}
