"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractS3Key = extractS3Key;
exports.s3ImageUrl = s3ImageUrl;
exports.uploadToS3 = uploadToS3;
exports.removeFromS3 = removeFromS3;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_1 = require("../config/s3");
const env_1 = require("../config/env");
const uuid_1 = require("uuid");
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../config/logger"));
/**
 * Extracts the S3 object key from any stored value:
 * - Raw key:           "thumbnails/id/uuid.png"   → "thumbnails/id/uuid.png"
 * - Public S3 URL:     "https://bucket.s3.region.amazonaws.com/thumbnails/..."  → "thumbnails/..."
 * - Presigned S3 URL:  same format but with query string                         → "thumbnails/..."
 */
function extractS3Key(urlOrKey) {
    if (urlOrKey.startsWith('https://')) {
        try {
            return new URL(urlOrKey).pathname.slice(1); // remove leading "/"
        }
        catch {
            return urlOrKey;
        }
    }
    return urlOrKey;
}
/**
 * Returns a fresh presigned URL for any stored image value (key, public URL, or old presigned URL).
 * TTL defaults to 7 days (maximum allowed by AWS SigV4).
 * Returns null if the value is empty or presigning fails.
 */
async function s3ImageUrl(storedValue, ttl = 604800) {
    if (!storedValue)
        return null;
    try {
        const key = extractS3Key(storedValue);
        return await (0, s3_1.getDownloadPresignedUrl)(key, ttl);
    }
    catch (err) {
        logger_1.default.warn(`s3ImageUrl: failed to presign "${storedValue}": ${err.message}`);
        return null;
    }
}
/**
 * Uploads a buffer directly to S3 and returns the object key and a presigned URL.
 * Presigned URLs work regardless of the bucket's public-access policy.
 */
async function uploadToS3(buffer, folder, originalName, contentType) {
    const ext = path_1.default.extname(originalName) || '';
    const key = `${folder}/${(0, uuid_1.v4)()}${ext}`;
    await s3_1.s3Client.send(new client_s3_1.PutObjectCommand({
        Bucket: s3_1.S3_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
    }));
    // Always use presigned URLs — works with any bucket ACL / public-access config.
    // Images use a longer TTL (7 days); videos/attachments use 1 hour.
    const ttl = contentType.startsWith('image/') ? 604800 : 3600;
    const url = await (0, s3_1.getDownloadPresignedUrl)(key, ttl);
    logger_1.default.info(`Uploaded to S3: ${key} (${env_1.env.AWS_REGION})`);
    return { key, url };
}
/**
 * Removes an S3 object by key.
 */
async function removeFromS3(key) {
    if (!key)
        return;
    await (0, s3_1.deleteS3Object)(key);
    logger_1.default.info(`Deleted from S3: ${key}`);
}
//# sourceMappingURL=s3.service.js.map