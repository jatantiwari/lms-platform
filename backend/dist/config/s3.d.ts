import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
export declare const s3Client: S3Client;
export declare const S3_BUCKET: string;
/**
 * Generates a pre-signed URL for direct browser-to-S3 uploads (PUT).
 * Expires in 5 minutes.
 */
export declare function getUploadPresignedUrl(key: string, contentType: string): Promise<string>;
/**
 * Generates a pre-signed URL for downloading / streaming a private S3 object.
 * @param key    S3 object key
 * @param ttl    Expiry in seconds (default: 1 hour)
 */
export declare function getDownloadPresignedUrl(key: string, ttl?: number): Promise<string>;
/**
 * Deletes an object from S3.
 */
export declare function deleteS3Object(key: string): Promise<void>;
export { PutObjectCommand, DeleteObjectCommand, GetObjectCommand };
//# sourceMappingURL=s3.d.ts.map