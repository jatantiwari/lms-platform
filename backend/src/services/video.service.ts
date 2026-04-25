import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { s3Client, S3_BUCKET } from '../config/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { env } from '../config/env';
import logger from '../config/logger';

/**
 * Returns a streamable URL for a stored HLS key.
 * Uses CloudFront if configured, otherwise routes through the backend HLS proxy
 * which signs each playlist and segment on-the-fly (private S3 bucket safe).
 *
 * hlsKey format: "hls/{courseId}/{lectureId}"
 * The lectureId is extracted to build the proxy URL.
 */
export async function getHLSStreamUrl(hlsKey: string): Promise<string> {
  if (process.env.CLOUDFRONT_URL) {
    return `${process.env.CLOUDFRONT_URL}/${hlsKey}/master.m3u8`;
  }
  // Extract lectureId — last segment of the hlsKey path
  const lectureId = hlsKey.split('/').pop()!;
  const apiBase = process.env.API_URL ?? 'http://localhost:5000/api/v1';
  return `${apiBase}/hls/${lectureId}/master.m3u8`;
}

// Prefer system-installed binaries (Homebrew on macOS) over static npm packages,
// because ffprobe-static ships an x86_64 binary that cannot run on Apple Silicon.
function resolveSystemBin(name: string): string | null {
  try {
    return execSync(`which ${name}`, { encoding: 'utf8' }).trim() || null;
  } catch {
    return null;
  }
}

const ffmpegPath = resolveSystemBin('ffmpeg') ?? (ffmpegStatic || undefined);
const ffprobePath = resolveSystemBin('ffprobe') ?? ffprobeStatic.path;

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);
logger.info(`ffmpeg: ${ffmpegPath ?? 'default'}, ffprobe: ${ffprobePath}`);

/**
 * Result from the HLS conversion process.
 */
export interface HLSResult {
  hlsKey: string;     // S3 prefix, e.g. "hls/courseId/lectureId/"
  m3u8Url: string;    // CloudFront / public URL to the master playlist
  duration: number;   // Video duration in seconds
}

/**
 * Converts an uploaded video buffer to HLS format (multiple qualities),
 * uploads all segments + playlist to S3, and returns streaming info.
 *
 * Requires ffmpeg to be installed on the server:
 *   apt-get install ffmpeg  OR  brew install ffmpeg
 */
export async function convertToHLS(
  videoBuffer: Buffer,
  courseId: string,
  lectureId: string,
): Promise<HLSResult> {
  const tmpDir = path.join(os.tmpdir(), uuidv4());
  const inputPath = path.join(tmpDir, 'input.mp4');
  const outputDir = path.join(tmpDir, 'hls');
  const hlsPrefix = `hls/${courseId}/${lectureId}`;

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(inputPath, videoBuffer);

  try {
    // Get video duration
    const duration = await getVideoDuration(inputPath);

    // Generate HLS with adaptive bitrate (360p, 720p, 1080p)
    await generateAdaptiveHLS(inputPath, outputDir);

    // Rewrite variant playlists so segment filenames become full S3 keys.
    // This is required because pre-signed URLs have query strings — relative
    // segment paths in a signed playlist URL would not resolve correctly.
    rewritePlaylistsWithAbsoluteKeys(outputDir, hlsPrefix);

    // Upload all generated files to S3
    await uploadHLSToS3(outputDir, hlsPrefix);

    // Generate a fresh pre-signed URL for the master playlist (6 h TTL)
    const m3u8Url = await getHLSStreamUrl(hlsPrefix);

    logger.info(`HLS conversion complete for lecture ${lectureId}`);

    return { hlsKey: hlsPrefix, m3u8Url, duration };
  } finally {
    // Always clean up temp files
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function getVideoDuration(inputPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) return reject(err);
      resolve(metadata.format.duration ?? 0);
    });
  });
}

function generateAdaptiveHLS(inputPath: string, outputDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const masterPlaylist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
720p.m3u8
`;
    fs.writeFileSync(path.join(outputDir, 'master.m3u8'), masterPlaylist);

    // 360p + 720p only (1080p dropped — same content, 3× faster encoding).
    // veryfast preset cuts encode time by ~60% vs "fast" with marginal quality loss.
    const qualities = [
      { name: '360p', scale: '640x360',   bitrate: '800k',  audioBitrate: '96k'  },
      { name: '720p', scale: '1280x720',  bitrate: '2500k', audioBitrate: '128k' },
    ];

    const tasks = qualities.map(
      (q) =>
        new Promise<void>((res, rej) => {
          ffmpeg(inputPath)
            .videoCodec('libx264')
            .audioCodec('aac')
            .videoBitrate(q.bitrate)
            .audioBitrate(q.audioBitrate)
            .size(q.scale)
            .outputOptions([
              '-profile:v main',
              '-preset veryfast',  // ~3× faster than "fast"; good quality for LMS content
              '-crf 26',           // slightly looser CRF for smaller files at veryfast
              '-threads 0',        // use all available CPU cores
              '-hls_time 6',
              '-hls_list_size 0',
              '-hls_segment_filename',
              path.join(outputDir, `${q.name}_%03d.ts`),
              '-f hls',
            ])
            .output(path.join(outputDir, `${q.name}.m3u8`))
            .on('end', () => res())
            .on('error', (err) => rej(err))
            .run();
        }),
    );

    Promise.all(tasks).then(() => resolve()).catch(reject);
  });
}

/**
 * Rewrites each quality playlist (360p.m3u8, etc.) so that segment lines
 * reference the full S3 key instead of a bare filename.
 * e.g.  "360p_000.ts"  →  "hls/courseId/lectureId/360p_000.ts"
 * hls.js will then be able to sign each segment URL independently.
 */
function rewritePlaylistsWithAbsoluteKeys(localDir: string, s3Prefix: string): void {
  const playlists = fs.readdirSync(localDir).filter((f) => f.endsWith('.m3u8') && f !== 'master.m3u8');
  for (const playlist of playlists) {
    const fullPath = path.join(localDir, playlist);
    const original = fs.readFileSync(fullPath, 'utf8');
    const rewritten = original
      .split('\n')
      .map((line) => {
        // Segment lines end with .ts and do not start with # or http
        if (line.trim().endsWith('.ts') && !line.startsWith('#') && !line.startsWith('http')) {
          return `${s3Prefix}/${line.trim()}`;
        }
        return line;
      })
      .join('\n');
    fs.writeFileSync(fullPath, rewritten);
  }
}

async function uploadHLSToS3(localDir: string, s3Prefix: string): Promise<void> {
  const files = fs.readdirSync(localDir);

  await Promise.all(
    files.map(async (file) => {
      const filePath = path.join(localDir, file);
      const fileBuffer = fs.readFileSync(filePath);
      const contentType = file.endsWith('.m3u8')
        ? 'application/x-mpegURL'
        : 'video/MP2T';

      await s3Client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: `${s3Prefix}/${file}`,
          Body: fileBuffer,
          ContentType: contentType,
        }),
      );
    }),
  );
}
