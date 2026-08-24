"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudinaryService = void 0;
const cloudinary_1 = require("cloudinary");
const env_1 = require("./env");
cloudinary_1.v2.config({
    cloud_name: env_1.env.CLOUDINARY_CLOUD_NAME || 'football-auction',
    api_key: env_1.env.CLOUDINARY_API_KEY || 'mock-key',
    api_secret: env_1.env.CLOUDINARY_API_SECRET || 'mock-secret',
    secure: true,
});
class CloudinaryService {
    /**
     * Upload image buffer or base64 data to Cloudinary, with direct Data URL fallback
     */
    static async uploadImage(fileBuffer, folder = 'football_players', mimetype = 'image/jpeg') {
        const isMock = !env_1.env.CLOUDINARY_CLOUD_NAME ||
            !env_1.env.CLOUDINARY_API_KEY ||
            env_1.env.CLOUDINARY_API_KEY === 'mock-key' ||
            env_1.env.CLOUDINARY_API_KEY === '123456789' ||
            env_1.env.CLOUDINARY_CLOUD_NAME === 'demo';
        // If Cloudinary credentials are not configured or demo, store directly as high-res Base64 Data URL
        if (isMock) {
            const mockPublicId = `player_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
            const base64Data = `data:${mimetype};base64,${fileBuffer.toString('base64')}`;
            return {
                url: base64Data,
                publicId: mockPublicId,
            };
        }
        return new Promise((resolve, _reject) => {
            const uploadStream = cloudinary_1.v2.uploader.upload_stream({
                folder,
                resource_type: 'image',
                transformation: [{ width: 600, height: 600, crop: 'limit', quality: 'auto' }],
            }, (error, result) => {
                if (error || !result) {
                    // Fallback cleanly to Base64 data URL so user's image is never lost
                    const fallbackPublicId = `player_${Date.now()}`;
                    return resolve({
                        url: `data:${mimetype};base64,${fileBuffer.toString('base64')}`,
                        publicId: fallbackPublicId,
                    });
                }
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            });
            uploadStream.end(fileBuffer);
        });
    }
    /**
     * Delete single asset by publicId
     */
    static async deleteAsset(publicId) {
        if (!publicId || !env_1.env.CLOUDINARY_CLOUD_NAME || env_1.env.CLOUDINARY_API_KEY === 'mock-key' || publicId.startsWith('player_')) {
            return true;
        }
        try {
            const result = await cloudinary_1.v2.uploader.destroy(publicId);
            return result.result === 'ok';
        }
        catch (err) {
            console.error(`Failed to delete Cloudinary asset ${publicId}:`, err);
            return false;
        }
    }
    /**
     * Bulk delete assets by list of publicIds
     */
    static async deleteAssets(publicIds) {
        if (!publicIds || publicIds.length === 0 || !env_1.env.CLOUDINARY_CLOUD_NAME || env_1.env.CLOUDINARY_API_KEY === 'mock-key') {
            return;
        }
        try {
            const validIds = publicIds.filter((id) => id && !id.startsWith('player_'));
            if (validIds.length > 0) {
                await cloudinary_1.v2.api.delete_resources(validIds);
            }
        }
        catch (err) {
            console.error('Failed to bulk delete Cloudinary assets:', err);
        }
    }
}
exports.CloudinaryService = CloudinaryService;
