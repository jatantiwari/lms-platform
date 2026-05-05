export interface UploadResult {
    key: string;
    url: string;
}
/**
 * Extracts the S3 object key from any stored value:
 * - Raw key:           "thumbnails/id/uuid.png"   → "thumbnails/id/uuid.png"
 * - Public S3 URL:     "https://bucket.s3.region.amazonaws.com/thumbnails/..."  → "thumbnails/..."
 * - Presigned S3 URL:  same format but with query string                         → "thumbnails/..."
 */
export declare function extractS3Key(urlOrKey: string): string;
/**
 * Returns a fresh presigned URL for any stored image value (key, public URL, or old presigned URL).
 * TTL defaults to 7 days (maximum allowed by AWS SigV4).
 * Returns null if the value is empty or presigning fails.
 */
export declare function s3ImageUrl(storedValue: string | null | undefined, ttl?: number): Promise<string | null>;
/**
 * Uploads a buffer directly to S3 and returns the object key and a presigned URL.
 * Presigned URLs work regardless of the bucket's public-access policy.
 */
export declare function uploadToS3(buffer: Buffer, folder: string, originalName: string, contentType: string): Promise<UploadResult>;
/**
 * Removes an S3 object by key.
 */
export declare function removeFromS3(key: string): Promise<void>;
//# sourceMappingURL=s3.service.d.ts.map