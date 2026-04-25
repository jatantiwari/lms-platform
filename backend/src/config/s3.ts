import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';

const s3Config: ConstructorParameters<typeof S3Client>[0] = {
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
};

// Support Cloudflare R2 or other S3-compatible storage
if (env.AWS_S3_ENDPOINT) {
  s3Config.endpoint = env.AWS_S3_ENDPOINT;
  s3Config.forcePathStyle = true;
}

export const s3Client = new S3Client(s3Config);
export const S3_BUCKET = env.AWS_S3_BUCKET_NAME;

/**
 * Generates a pre-signed URL for direct browser-to-S3 uploads (PUT).
 * Expires in 5 minutes.
 */
export async function getUploadPresignedUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 300 });
}

/**
 * Generates a pre-signed URL for downloading / streaming a private S3 object.
 * @param key    S3 object key
 * @param ttl    Expiry in seconds (default: 1 hour)
 */
export async function getDownloadPresignedUrl(key: string, ttl = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: S3_BUCKET, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: ttl });
}

/**
 * Deletes an object from S3.
 */
export async function deleteS3Object(key: string): Promise<void> {
  await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
}

export { PutObjectCommand, DeleteObjectCommand, GetObjectCommand };
