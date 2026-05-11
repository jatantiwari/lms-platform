/**
 * Returns a streamable URL for a stored HLS key.
 * Uses CloudFront if configured, otherwise routes through the backend HLS proxy
 * which signs each playlist and segment on-the-fly (private S3 bucket safe).
 *
 * hlsKey format: "hls/{courseId}/{lectureId}"
 * The lectureId is extracted to build the proxy URL.
 */
export declare function getHLSStreamUrl(hlsKey: string, token?: string): Promise<string>;
/**
 * Result from the HLS conversion process.
 */
export interface HLSResult {
    hlsKey: string;
    m3u8Url: string;
    duration: number;
}
/**
 * Converts an uploaded video buffer to HLS format (multiple qualities),
 * uploads all segments + playlist to S3, and returns streaming info.
 *
 * Requires ffmpeg to be installed on the server:
 *   apt-get install ffmpeg  OR  brew install ffmpeg
 */
export declare function convertToHLS(videoBuffer: Buffer, courseId: string, lectureId: string): Promise<HLSResult>;
//# sourceMappingURL=video.service.d.ts.map