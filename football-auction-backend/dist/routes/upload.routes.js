"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const cloudinary_1 = require("../config/cloudinary");
const errorHandler_middleware_1 = require("../middlewares/errorHandler.middleware");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new errorHandler_middleware_1.AppError(400, 'Only image files (JPG, PNG, WEBP) are allowed'));
        }
    },
});
router.post('/', auth_middleware_1.authenticate, upload.single('image'), async (req, res, next) => {
    try {
        if (!req.file) {
            throw new errorHandler_middleware_1.AppError(400, 'No image file provided in upload');
        }
        const result = await cloudinary_1.CloudinaryService.uploadImage(req.file.buffer, 'player_profiles', req.file.mimetype);
        return res.status(200).json({
            success: true,
            data: result,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
