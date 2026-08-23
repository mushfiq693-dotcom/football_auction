import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME || 'football-auction',
  api_key: env.CLOUDINARY_API_KEY || 'mock-key',
  api_secret: env.CLOUDINARY_API_SECRET || 'mock-secret',
  secure: true,
});

export class CloudinaryService {
  /**
   * Upload image buffer or base64 data to Cloudinary
   */
  static async uploadImage(
    fileBuffer: Buffer,
    folder: string = 'football_players'
  ): Promise<{ url: string; publicId: string }> {
    // If Cloudinary credentials are not configured, provide an SVG/mock fallback
    if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || env.CLOUDINARY_API_KEY === 'mock-key') {
      const mockPublicId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      return {
        url: `https://api.dicebear.com/7.x/bottts/svg?seed=${mockPublicId}`,
        publicId: mockPublicId,
      };
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
          transformation: [{ width: 500, height: 500, crop: 'limit', quality: 'auto' }],
        },
        (error, result) => {
          if (error || !result) {
            return reject(error || new Error('Cloudinary upload failed'));
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );
      uploadStream.end(fileBuffer);
    });
  }

  /**
   * Delete single asset by publicId
   */
  static async deleteAsset(publicId: string): Promise<boolean> {
    if (!publicId || !env.CLOUDINARY_CLOUD_NAME || env.CLOUDINARY_API_KEY === 'mock-key') {
      return true;
    }
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (err) {
      console.error(`Failed to delete Cloudinary asset ${publicId}:`, err);
      return false;
    }
  }

  /**
   * Bulk delete assets by list of publicIds
   */
  static async deleteAssets(publicIds: string[]): Promise<void> {
    if (!publicIds || publicIds.length === 0 || !env.CLOUDINARY_CLOUD_NAME || env.CLOUDINARY_API_KEY === 'mock-key') {
      return;
    }
    try {
      const validIds = publicIds.filter(Boolean);
      if (validIds.length > 0) {
        await cloudinary.api.delete_resources(validIds);
      }
    } catch (err) {
      console.error('Failed to bulk delete Cloudinary assets:', err);
    }
  }
}
