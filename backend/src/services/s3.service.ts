import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET, deleteS3Object, getDownloadPresignedUrl } from '../config/s3';
import { env } from '../config/env';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import logger from '../config/logger';

export interface UploadResult {
  key: string;
  url: string; // Presigned URL valid for 7 days
}

/**
 * Extracts the S3 object key from any stored value:
 * - Raw key:           "thumbnails/id/uuid.png"   → "thumbnails/id/uuid.png"
 * - Public S3 URL:     "https://bucket.s3.region.amazonaws.com/thumbnails/..."  → "thumbnails/..."
 * - Presigned S3 URL:  same format but with query string                         → "thumbnails/..."
 */
export function extractS3Key(urlOrKey: string): string {
  if (urlOrKey.startsWith('https://')) {
    try {
      return new URL(urlOrKey).pathname.slice(1); // remove leading "/"
    } catch {
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
export async function s3ImageUrl(
  storedValue: string | null | undefined,
  ttl = 604800,
): Promise<string | null> {
  if (!storedValue) return null;
  try {
    const key = extractS3Key(storedValue);
    return await getDownloadPresignedUrl(key, ttl);
  } catch (err) {
    logger.warn(`s3ImageUrl: failed to presign "${storedValue}": ${(err as Error).message}`);
    return null;
  }
}

/**
 * Uploads a buffer directly to S3 and returns the object key and a presigned URL.
 * Presigned URLs work regardless of the bucket's public-access policy.
 */
export async function uploadToS3(
  buffer: Buffer,
  folder: string,
  originalName: string,
  contentType: string,
): Promise<UploadResult> {
  const ext = path.extname(originalName) || '';
  const key = `${folder}/${uuidv4()}${ext}`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  // Always use presigned URLs — works with any bucket ACL / public-access config.
  // Images use a longer TTL (7 days); videos/attachments use 1 hour.
  const ttl = contentType.startsWith('image/') ? 604800 : 3600;
  const url = await getDownloadPresignedUrl(key, ttl);

  logger.info(`Uploaded to S3: ${key} (${env.AWS_REGION})`);
  return { key, url };
}

/**
 * Removes an S3 object by key.
 */
export async function removeFromS3(key: string): Promise<void> {
  if (!key) return;
  await deleteS3Object(key);
  logger.info(`Deleted from S3: ${key}`);
}
