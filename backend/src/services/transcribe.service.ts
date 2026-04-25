import {
  TranscribeClient,
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
  TranscriptionJobStatus,
  LanguageCode,
} from '@aws-sdk/client-transcribe';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '../config/s3';
import { env } from '../config/env';
import logger from '../config/logger';

const transcribeClient = new TranscribeClient({
  region: env.AWS_REGION,
  credentials: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  },
});

type SupportedFormat = 'mp3' | 'mp4' | 'wav' | 'flac' | 'ogg' | 'amr' | 'webm';
const SUPPORTED_FORMATS: SupportedFormat[] = ['mp3', 'mp4', 'wav', 'flac', 'ogg', 'amr', 'webm'];

function getMediaFormat(key: string): SupportedFormat {
  const ext = key.split('.').pop()?.toLowerCase() ?? '';
  return (SUPPORTED_FORMATS as string[]).includes(ext) ? (ext as SupportedFormat) : 'mp4';
}

/**
 * Starts an AWS Transcribe job for a stored video in S3.
 * Returns the job name to be stored in the DB for later polling.
 *
 * Required IAM permissions on the AWS user:
 *   transcribe:StartTranscriptionJob
 *   transcribe:GetTranscriptionJob
 *   s3:GetObject (for input bucket)
 *   s3:PutObject (for output bucket)
 */
export async function startTranscriptionJob(videoKey: string, lectureId: string): Promise<string> {
  const jobName = `lms-${lectureId}-${Date.now()}`;
  const mediaUri = `s3://${S3_BUCKET}/${videoKey}`;
  const outputKey = `transcripts/${lectureId}.json`;

  await transcribeClient.send(
    new StartTranscriptionJobCommand({
      TranscriptionJobName: jobName,
      LanguageCode: LanguageCode.EN_US,
      MediaFormat: getMediaFormat(videoKey),
      Media: { MediaFileUri: mediaUri },
      OutputBucketName: S3_BUCKET,
      OutputKey: outputKey,
    }),
  );

  logger.info(`Transcription job "${jobName}" started for lecture ${lectureId}`);
  return jobName;
}

/**
 * Checks the status of a transcription job.
 * If complete, fetches the resulting transcript text directly from S3.
 */
export async function checkTranscriptionJob(
  jobName: string,
  lectureId: string,
): Promise<{ status: string; transcriptText?: string }> {
  const { TranscriptionJob } = await transcribeClient.send(
    new GetTranscriptionJobCommand({ TranscriptionJobName: jobName }),
  );

  if (!TranscriptionJob) return { status: 'FAILED' };

  const status = TranscriptionJob.TranscriptionJobStatus ?? 'UNKNOWN';

  if (status === TranscriptionJobStatus.COMPLETED) {
    try {
      const outputKey = `transcripts/${lectureId}.json`;
      const { Body } = await s3Client.send(
        new GetObjectCommand({ Bucket: S3_BUCKET, Key: outputKey }),
      );
      const raw = await Body?.transformToString();
      if (raw) {
        const parsed = JSON.parse(raw) as {
          results: { transcripts: { transcript: string }[] };
        };
        const transcriptText = parsed.results?.transcripts?.[0]?.transcript ?? '';
        return { status: 'COMPLETED', transcriptText };
      }
    } catch (err) {
      logger.error('Failed to fetch transcript output from S3:', err);
      return { status: 'FAILED' };
    }
  }

  return { status };
}
