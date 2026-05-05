"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileExtension = exports.uploadAttachment = exports.uploadImage = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const AppError_1 = require("../utils/AppError");
// Store uploads in memory for piping directly to S3
const storage = multer_1.default.memoryStorage();
const fileFilter = (_req, file, cb) => {
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowed = [...allowedVideoTypes, ...allowedImageTypes];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new AppError_1.AppError(`Unsupported file type: ${file.mimetype}. Allowed: video/mp4, video/webm, image/jpeg, image/png`, 400));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 2 * 1024 * 1024 * 1024, // 2 GB max for video
    },
});
/** For single image uploads (course thumbnails, avatars) */
exports.uploadImage = (0, multer_1.default)({
    storage,
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new AppError_1.AppError('Only JPEG, PNG, and WebP images are allowed', 400));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});
/** For lecture attachment uploads (PDFs, ZIPs, DOCX, PPT, etc.) */
exports.uploadAttachment = (0, multer_1.default)({
    storage,
    fileFilter: (_req, file, cb) => {
        const allowed = [
            'application/pdf',
            'application/zip',
            'application/x-zip-compressed',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain',
            'image/jpeg',
            'image/png',
            'image/webp',
        ];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new AppError_1.AppError(`Unsupported attachment type: ${file.mimetype}`, 400));
        }
    },
    limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});
const getFileExtension = (mimetype) => {
    const map = {
        'video/mp4': '.mp4',
        'video/webm': '.webm',
        'video/quicktime': '.mov',
        'video/x-matroska': '.mkv',
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/webp': '.webp',
        'image/gif': '.gif',
    };
    return map[mimetype] ?? path_1.default.extname(mimetype);
};
exports.getFileExtension = getFileExtension;
//# sourceMappingURL=upload.js.map