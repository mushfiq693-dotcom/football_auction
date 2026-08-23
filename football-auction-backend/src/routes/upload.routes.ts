import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middlewares/auth.middleware';
import { CloudinaryService } from '../config/cloudinary';
import { AppError } from '../middlewares/errorHandler.middleware';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'Only image files (JPG, PNG, WEBP) are allowed'));
    }
  },
});

router.post('/', authenticate, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'No image file provided in upload');
    }

    const result = await CloudinaryService.uploadImage(req.file.buffer, 'player_profiles');
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
