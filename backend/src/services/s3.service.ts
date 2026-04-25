import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET, deleteS3Object, getDownloadPresignedUrl } from '../config/s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import logger from '../config/logger';

export interface UploadResult {
  key: string;
  url: string; // Public URL or pre-signed URL
}

/**
 * Uploads a buffer directly to S3 and returns the object key and public URL.
 */
export async function uploadToS3(
  buffer: Buffer,
  folder: string,
  originalName: string,
  contentType: string,
): Promise<UploadResult> {
  const ext = path.extname(originalName) || '';
  const key = `${folder}/${uuidv4()}${ext}`;

  // Do NOT pass ACL — bucket has Object Ownership set to "Bucket owner enforced"
  // which disables ACLs entirely. Public access is controlled by the bucket policy.
  await s3Client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  // Images/thumbnails: use a direct public URL (requires the bucket policy to allow s3:GetObject for *)
  // All other assets (videos, attachments): use a pre-signed URL (valid 1 hour)
  const url = contentType.startsWith('image/')
    ? `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
    : await getDownloadPresignedUrl(key);

  logger.info(`Uploaded to S3: ${key}`);
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
