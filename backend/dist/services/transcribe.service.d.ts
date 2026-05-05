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
export declare function startTranscriptionJob(videoKey: string, lectureId: string): Promise<string>;
/**
 * Checks the status of a transcription job.
 * If complete, fetches the resulting transcript text directly from S3.
 */
export declare function checkTranscriptionJob(jobName: string, lectureId: string): Promise<{
    status: string;
    transcriptText?: string;
}>;
//# sourceMappingURL=transcribe.service.d.ts.map