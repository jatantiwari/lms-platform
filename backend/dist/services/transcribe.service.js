"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTranscriptionJob = startTranscriptionJob;
exports.checkTranscriptionJob = checkTranscriptionJob;
const client_transcribe_1 = require("@aws-sdk/client-transcribe");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_1 = require("../config/s3");
const env_1 = require("../config/env");
const logger_1 = __importDefault(require("../config/logger"));
const transcribeClient = new client_transcribe_1.TranscribeClient({
    region: env_1.env.AWS_REGION,
    credentials: {
        accessKeyId: env_1.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env_1.env.AWS_SECRET_ACCESS_KEY,
    },
});
const SUPPORTED_FORMATS = ['mp3', 'mp4', 'wav', 'flac', 'ogg', 'amr', 'webm'];
function getMediaFormat(key) {
    const ext = key.split('.').pop()?.toLowerCase() ?? '';
    return SUPPORTED_FORMATS.includes(ext) ? ext : 'mp4';
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
async function startTranscriptionJob(videoKey, lectureId) {
    const jobName = `lms-${lectureId}-${Date.now()}`;
    const mediaUri = `s3://${s3_1.S3_BUCKET}/${videoKey}`;
    const outputKey = `transcripts/${lectureId}.json`;
    await transcribeClient.send(new client_transcribe_1.StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        LanguageCode: client_transcribe_1.LanguageCode.EN_US,
        MediaFormat: getMediaFormat(videoKey),
        Media: { MediaFileUri: mediaUri },
        OutputBucketName: s3_1.S3_BUCKET,
        OutputKey: outputKey,
    }));
    logger_1.default.info(`Transcription job "${jobName}" started for lecture ${lectureId}`);
    return jobName;
}
/**
 * Checks the status of a transcription job.
 * If complete, fetches the resulting transcript text directly from S3.
 */
async function checkTranscriptionJob(jobName, lectureId) {
    const { TranscriptionJob } = await transcribeClient.send(new client_transcribe_1.GetTranscriptionJobCommand({ TranscriptionJobName: jobName }));
    if (!TranscriptionJob)
        return { status: 'FAILED' };
    const status = TranscriptionJob.TranscriptionJobStatus ?? 'UNKNOWN';
    if (status === client_transcribe_1.TranscriptionJobStatus.COMPLETED) {
        try {
            const outputKey = `transcripts/${lectureId}.json`;
            const { Body } = await s3_1.s3Client.send(new client_s3_1.GetObjectCommand({ Bucket: s3_1.S3_BUCKET, Key: outputKey }));
            const raw = await Body?.transformToString();
            if (raw) {
                const parsed = JSON.parse(raw);
                const transcriptText = parsed.results?.transcripts?.[0]?.transcript ?? '';
                return { status: 'COMPLETED', transcriptText };
            }
        }
        catch (err) {
            logger_1.default.error('Failed to fetch transcript output from S3:', err);
            return { status: 'FAILED' };
        }
    }
    return { status };
}
//# sourceMappingURL=transcribe.service.js.map