"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHLSStreamUrl = getHLSStreamUrl;
exports.convertToHLS = convertToHLS;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const ffmpeg_static_1 = __importDefault(require("ffmpeg-static"));
const ffprobe_static_1 = __importDefault(require("ffprobe-static"));
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const uuid_1 = require("uuid");
const s3_1 = require("../config/s3");
const client_s3_1 = require("@aws-sdk/client-s3");
const logger_1 = __importDefault(require("../config/logger"));
/**
 * Returns a streamable URL for a stored HLS key.
 * Uses CloudFront if configured, otherwise routes through the backend HLS proxy
 * which signs each playlist and segment on-the-fly (private S3 bucket safe).
 *
 * hlsKey format: "hls/{courseId}/{lectureId}"
 * The lectureId is extracted to build the proxy URL.
 */
async function getHLSStreamUrl(hlsKey) {
    if (process.env.CLOUDFRONT_URL) {
        return `${process.env.CLOUDFRONT_URL}/${hlsKey}/master.m3u8`;
    }
    // Extract lectureId — last segment of the hlsKey path
    const lectureId = hlsKey.split('/').pop();
    const apiBase = process.env.API_URL ?? 'http://localhost:5000/api/v1';
    return `${apiBase}/hls/${lectureId}/master.m3u8`;
}
// Prefer system-installed binaries (Homebrew on macOS) over static npm packages,
// because ffprobe-static ships an x86_64 binary that cannot run on Apple Silicon.
function resolveSystemBin(name) {
    try {
        return (0, child_process_1.execSync)(`which ${name}`, { encoding: 'utf8' }).trim() || null;
    }
    catch {
        return null;
    }
}
const ffmpegPath = resolveSystemBin('ffmpeg') ?? (ffmpeg_static_1.default || undefined);
const ffprobePath = resolveSystemBin('ffprobe') ?? ffprobe_static_1.default.path;
if (ffmpegPath)
    fluent_ffmpeg_1.default.setFfmpegPath(ffmpegPath);
fluent_ffmpeg_1.default.setFfprobePath(ffprobePath);
logger_1.default.info(`ffmpeg: ${ffmpegPath ?? 'default'}, ffprobe: ${ffprobePath}`);
/**
 * Converts an uploaded video buffer to HLS format (multiple qualities),
 * uploads all segments + playlist to S3, and returns streaming info.
 *
 * Requires ffmpeg to be installed on the server:
 *   apt-get install ffmpeg  OR  brew install ffmpeg
 */
async function convertToHLS(videoBuffer, courseId, lectureId) {
    const tmpDir = path_1.default.join(os_1.default.tmpdir(), (0, uuid_1.v4)());
    const inputPath = path_1.default.join(tmpDir, 'input.mp4');
    const outputDir = path_1.default.join(tmpDir, 'hls');
    const hlsPrefix = `hls/${courseId}/${lectureId}`;
    fs_1.default.mkdirSync(outputDir, { recursive: true });
    fs_1.default.writeFileSync(inputPath, videoBuffer);
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
        logger_1.default.info(`HLS conversion complete for lecture ${lectureId}`);
        return { hlsKey: hlsPrefix, m3u8Url, duration };
    }
    finally {
        // Always clean up temp files
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    }
}
function getVideoDuration(inputPath) {
    return new Promise((resolve, reject) => {
        fluent_ffmpeg_1.default.ffprobe(inputPath, (err, metadata) => {
            if (err)
                return reject(err);
            resolve(metadata.format.duration ?? 0);
        });
    });
}
function generateAdaptiveHLS(inputPath, outputDir) {
    return new Promise((resolve, reject) => {
        const masterPlaylist = `#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=1280x720
720p.m3u8
`;
        fs_1.default.writeFileSync(path_1.default.join(outputDir, 'master.m3u8'), masterPlaylist);
        // 360p + 720p only (1080p dropped — same content, 3× faster encoding).
        // veryfast preset cuts encode time by ~60% vs "fast" with marginal quality loss.
        const qualities = [
            { name: '360p', scale: '640x360', bitrate: '800k', audioBitrate: '96k' },
            { name: '720p', scale: '1280x720', bitrate: '2500k', audioBitrate: '128k' },
        ];
        const tasks = qualities.map((q) => new Promise((res, rej) => {
            (0, fluent_ffmpeg_1.default)(inputPath)
                .videoCodec('libx264')
                .audioCodec('aac')
                .videoBitrate(q.bitrate)
                .audioBitrate(q.audioBitrate)
                .size(q.scale)
                .outputOptions([
                '-profile:v main',
                '-preset veryfast', // ~3× faster than "fast"; good quality for LMS content
                '-crf 26', // slightly looser CRF for smaller files at veryfast
                '-threads 0', // use all available CPU cores
                '-hls_time 6',
                '-hls_list_size 0',
                '-hls_segment_filename',
                path_1.default.join(outputDir, `${q.name}_%03d.ts`),
                '-f hls',
            ])
                .output(path_1.default.join(outputDir, `${q.name}.m3u8`))
                .on('end', () => res())
                .on('error', (err) => rej(err))
                .run();
        }));
        Promise.all(tasks).then(() => resolve()).catch(reject);
    });
}
/**
 * Rewrites each quality playlist (360p.m3u8, etc.) so that segment lines
 * reference the full S3 key instead of a bare filename.
 * e.g.  "360p_000.ts"  →  "hls/courseId/lectureId/360p_000.ts"
 * hls.js will then be able to sign each segment URL independently.
 */
function rewritePlaylistsWithAbsoluteKeys(localDir, s3Prefix) {
    const playlists = fs_1.default.readdirSync(localDir).filter((f) => f.endsWith('.m3u8') && f !== 'master.m3u8');
    for (const playlist of playlists) {
        const fullPath = path_1.default.join(localDir, playlist);
        const original = fs_1.default.readFileSync(fullPath, 'utf8');
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
        fs_1.default.writeFileSync(fullPath, rewritten);
    }
}
async function uploadHLSToS3(localDir, s3Prefix) {
    const files = fs_1.default.readdirSync(localDir);
    await Promise.all(files.map(async (file) => {
        const filePath = path_1.default.join(localDir, file);
        const fileBuffer = fs_1.default.readFileSync(filePath);
        const contentType = file.endsWith('.m3u8')
            ? 'application/x-mpegURL'
            : 'video/MP2T';
        await s3_1.s3Client.send(new client_s3_1.PutObjectCommand({
            Bucket: s3_1.S3_BUCKET,
            Key: `${s3Prefix}/${file}`,
            Body: fileBuffer,
            ContentType: contentType,
        }));
    }));
}
//# sourceMappingURL=video.service.js.map