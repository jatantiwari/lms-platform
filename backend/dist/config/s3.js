"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetObjectCommand = exports.DeleteObjectCommand = exports.PutObjectCommand = exports.S3_BUCKET = exports.s3Client = void 0;
exports.getUploadPresignedUrl = getUploadPresignedUrl;
exports.getDownloadPresignedUrl = getDownloadPresignedUrl;
exports.deleteS3Object = deleteS3Object;
const client_s3_1 = require("@aws-sdk/client-s3");
Object.defineProperty(exports, "PutObjectCommand", { enumerable: true, get: function () { return client_s3_1.PutObjectCommand; } });
Object.defineProperty(exports, "DeleteObjectCommand", { enumerable: true, get: function () { return client_s3_1.DeleteObjectCommand; } });
Object.defineProperty(exports, "GetObjectCommand", { enumerable: true, get: function () { return client_s3_1.GetObjectCommand; } });
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const env_1 = require("./env");
const s3Config = {
    region: env_1.env.AWS_REGION,
    credentials: {
        accessKeyId: env_1.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env_1.env.AWS_SECRET_ACCESS_KEY,
    },
};
// Support Cloudflare R2 or other S3-compatible storage
if (env_1.env.AWS_S3_ENDPOINT) {
    s3Config.endpoint = env_1.env.AWS_S3_ENDPOINT;
    s3Config.forcePathStyle = true;
}
exports.s3Client = new client_s3_1.S3Client(s3Config);
exports.S3_BUCKET = env_1.env.AWS_S3_BUCKET_NAME;
/**
 * Generates a pre-signed URL for direct browser-to-S3 uploads (PUT).
 * Expires in 5 minutes.
 */
async function getUploadPresignedUrl(key, contentType) {
    const command = new client_s3_1.PutObjectCommand({
        Bucket: exports.S3_BUCKET,
        Key: key,
        ContentType: contentType,
    });
    return (0, s3_request_presigner_1.getSignedUrl)(exports.s3Client, command, { expiresIn: 300 });
}
/**
 * Generates a pre-signed URL for downloading / streaming a private S3 object.
 * @param key    S3 object key
 * @param ttl    Expiry in seconds (default: 1 hour)
 */
async function getDownloadPresignedUrl(key, ttl = 3600) {
    const command = new client_s3_1.GetObjectCommand({ Bucket: exports.S3_BUCKET, Key: key });
    return (0, s3_request_presigner_1.getSignedUrl)(exports.s3Client, command, { expiresIn: ttl });
}
/**
 * Deletes an object from S3.
 */
async function deleteS3Object(key) {
    await exports.s3Client.send(new client_s3_1.DeleteObjectCommand({ Bucket: exports.S3_BUCKET, Key: key }));
}
//# sourceMappingURL=s3.js.map