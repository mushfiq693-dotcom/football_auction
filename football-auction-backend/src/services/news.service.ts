import { prisma } from '../config/database';
import { AppError } from '../middlewares/errorHandler.middleware';

export class NewsService {
  static async getPublishedNews() {
    return await prisma.news.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async createNews(title: string, content: string, imageUrl?: string) {
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;

    return await prisma.news.create({
      data: {
        title,
        slug,
        content,
        imageUrl,
        isPublished: true,
      },
    });
  }

  static async deleteNews(id: string) {
    const news = await prisma.news.findUnique({ where: { id } });
    if (!news) throw new AppError(404, 'News article not found');

    return await prisma.news.delete({ where: { id } });
  }

  /**
   * Seed default news articles if table is empty
   */
  static async seedDefaultNewsIfEmpty() {
    const count = await prisma.news.count();
    if (count === 0) {
      await prisma.news.createMany({
        data: [
          {
            title: 'University Football League 2026 Officially Kicks Off!',
            slug: 'university-football-league-2026-kicks-off',
            content:
              'The prestigious university football franchise tournament returns with 6 powerhouse franchises battling across round-robin fixtures and high-intensity bidding.',
            imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=800&q=80',
            isPublished: true,
          },
          {
            title: 'Record Bids at the Live Franchise Auction',
            slug: 'record-bids-at-live-franchise-auction',
            content:
              'Top strikers and star midfielders command record franchise valuations on the live podium with intense bidding wars among franchise owners.',
            imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80',
            isPublished: true,
          },
          {
            title: 'Golden Boot & Golden Glove Race Heats Up',
            slug: 'golden-boot-golden-glove-race',
            content:
              'Check out the real-time player statistics leaderboard featuring golden boot contenders and top clean sheet goalkeepers.',
            imageUrl: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=800&q=80',
            isPublished: true,
          },
        ],
      });
    }
  }
}
