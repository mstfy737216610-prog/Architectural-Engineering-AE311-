import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import JSZip from 'jszip';

const execFileAsync = promisify(execFile);

export interface VideoProbeInfo {
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  hasAudio: boolean;
  codec: string;
  fileSizeBytes: number;
}

export interface NormalizeClipOptions {
  inputPath: string;
  outputPath: string;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  targetFps?: number;
  durationSec?: number;
  stripAudio?: boolean;
}

export interface ZipClipEntry {
  sceneId: number;
  filename: string;
  diskPath: string;
}

export interface ZipPngEntry {
  sceneId: number;
  filename: string;
  sourceImagePath: string;
}

export function getOutputDimensions(
  aspectRatio: '16:9' | '9:16',
  resolution: '720p' | '1080p',
): { width: number; height: number } {
  if (aspectRatio === '9:16') {
    return resolution === '1080p'
      ? { width: 1080, height: 1920 }
      : { width: 720, height: 1280 };
  }
  return resolution === '1080p'
    ? { width: 1920, height: 1080 }
    : { width: 1280, height: 720 };
}

export function buildVideoNormalizeFilter(
  width: number,
  height: number,
  targetFps = 30,
): string {
  // Pure frame-rate and resolution standardization on an AI-animated video stream.
  // Never performs Ken Burns / zoompan on static images and never alters playback speed.
  return `fps=${targetFps},scale=${width}:${height}:flags=lanczos:force_original_aspect_ratio=increase,crop=${width}:${height},setsar=1,format=yuv420p`;
}

export function parseFrameRate(rawRate?: string): number {
  if (!rawRate) return 0;
  if (rawRate.includes('/')) {
    const [numStr, denStr] = rawRate.split('/');
    const num = Number(numStr);
    const den = Number(denStr);
    if (!Number.isNaN(num) && !Number.isNaN(den) && den > 0) {
      return Math.round((num / den) * 100) / 100;
    }
  }
  const parsed = Number(rawRate);
  return Number.isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
}

export async function probeVideoMetadata(videoPath: string): Promise<VideoProbeInfo> {
  const { stdout } = await execFileAsync('ffprobe', [
    '-v',
    'quiet',
    '-print_format',
    'json',
    '-show_format',
    '-show_streams',
    videoPath,
  ]);

  const parsed = JSON.parse(stdout) as {
    streams?: Array<{
      codec_type?: string;
      codec_name?: string;
      width?: number;
      height?: number;
      r_frame_rate?: string;
      avg_frame_rate?: string;
      duration?: string;
    }>;
    format?: {
      duration?: string;
      size?: string;
    };
  };

  const videoStream = parsed.streams?.find((s) => s.codec_type === 'video');
  const audioStream = parsed.streams?.find((s) => s.codec_type === 'audio');
  const stat = fs.statSync(videoPath);

  const fps = parseFrameRate(videoStream?.avg_frame_rate || videoStream?.r_frame_rate);
  const rawDuration = Number(parsed.format?.duration || videoStream?.duration || 0);

  return {
    width: videoStream?.width ?? 0,
    height: videoStream?.height ?? 0,
    fps,
    durationSec: Number.isNaN(rawDuration) ? 0 : Math.round(rawDuration * 100) / 100,
    hasAudio: Boolean(audioStream),
    codec: videoStream?.codec_name ?? 'unknown',
    fileSizeBytes: stat.size,
  };
}

export async function normalizeGeneratedClipMp4(
  options: NormalizeClipOptions,
): Promise<VideoProbeInfo> {
  const {
    inputPath,
    outputPath,
    aspectRatio,
    resolution,
    targetFps = 30,
    durationSec = 8,
    stripAudio = true,
  } = options;

  const { width, height } = getOutputDimensions(aspectRatio, resolution);
  const vf = buildVideoNormalizeFilter(width, height, targetFps);

  const args = [
    '-y',
    '-i',
    inputPath,
    '-vf',
    vf,
    '-t',
    String(durationSec),
    '-c:v',
    'libx264',
    '-preset',
    'medium',
    '-crf',
    '17',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    ...(stripAudio ? ['-an'] : ['-c:a', 'aac', '-b:a', '192k']),
    outputPath,
  ];

  await execFileAsync('ffmpeg', args, { maxBuffer: 1024 * 1024 * 20 });
  return probeVideoMetadata(outputPath);
}

export async function encodeJpegFramesToMp4(options: {
  framesDir: string;
  framePattern?: string;
  outputPath: string;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  fps?: number;
  durationSec?: number;
}): Promise<VideoProbeInfo> {
  const {
    framesDir,
    framePattern = 'frame_%04d.jpg',
    outputPath,
    aspectRatio,
    resolution,
    fps = 30,
    durationSec = 8,
  } = options;
  const { width, height } = getOutputDimensions(aspectRatio, resolution);
  const vf = buildVideoNormalizeFilter(width, height, fps);

  await execFileAsync(
    'ffmpeg',
    [
      '-y',
      '-framerate',
      String(fps),
      '-i',
      path.join(framesDir, framePattern),
      '-vf',
      vf,
      '-t',
      String(durationSec),
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '17',
      '-pix_fmt',
      'yuv420p',
      '-movflags',
      '+faststart',
      '-an',
      outputPath,
    ],
    { maxBuffer: 1024 * 1024 * 20 },
  );

  return probeVideoMetadata(outputPath);
}

export async function concatenateAnimatedClipsMp4(options: {
  clipPaths: string[];
  outputPath: string;
  tempDir: string;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  targetFps?: number;
}): Promise<VideoProbeInfo> {
  const { clipPaths, outputPath, tempDir, aspectRatio, resolution, targetFps = 30 } = options;
  if (clipPaths.length === 0) {
    throw new Error('لا توجد مقاطع أنيميشن مولدة لتجميعها.');
  }

  fs.mkdirSync(tempDir, { recursive: true });
  const { width, height } = getOutputDimensions(aspectRatio, resolution);
  const vf = buildVideoNormalizeFilter(width, height, targetFps);

  // Normalize each AI-generated video clip to identical stream parameters before concat
  const normalizedSegments: string[] = [];
  for (let i = 0; i < clipPaths.length; i += 1) {
    const segPath = path.join(tempDir, `norm-${String(i + 1).padStart(2, '0')}.mp4`);
    await execFileAsync(
      'ffmpeg',
      [
        '-y',
        '-i',
        clipPaths[i],
        '-vf',
        vf,
        '-c:v',
        'libx264',
        '-preset',
        'medium',
        '-crf',
        '17',
        '-pix_fmt',
        'yuv420p',
        '-an',
        segPath,
      ],
      { maxBuffer: 1024 * 1024 * 20 },
    );
    normalizedSegments.push(segPath);
  }

  const concatListPath = path.join(tempDir, 'concat.txt');
  const concatLines = normalizedSegments
    .map((p) => `file '${p.replace(/'/g, "'\\''")}'`)
    .join('\n');
  fs.writeFileSync(concatListPath, concatLines, 'utf8');

  await execFileAsync(
    'ffmpeg',
    [
      '-y',
      '-f',
      'concat',
      '-safe',
      '0',
      '-i',
      concatListPath,
      '-c',
      'copy',
      '-movflags',
      '+faststart',
      outputPath,
    ],
    { maxBuffer: 1024 * 1024 * 20 },
  );

  return probeVideoMetadata(outputPath);
}

export async function convertImageToHighResPngBuffer(
  imagePath: string,
  width = 1920,
  height = 1080,
): Promise<Buffer> {
  const tmpPng = path.join('/tmp', `noesis-png-${Date.now()}-${Math.random().toString(36).slice(2)}.png`);
  try {
    await execFileAsync(
      'ffmpeg',
      [
        '-y',
        '-i',
        imagePath,
        '-vf',
        `scale=${width}:${height}:flags=lanczos:force_original_aspect_ratio=increase,crop=${width}:${height}`,
        '-frames:v',
        '1',
        tmpPng,
      ],
      { maxBuffer: 1024 * 1024 * 10 },
    );
    return fs.readFileSync(tmpPng);
  } finally {
    if (fs.existsSync(tmpPng)) {
      fs.rmSync(tmpPng, { force: true });
    }
  }
}

export async function buildDeliverablesZipBuffer(options: {
  clips: ZipClipEntry[];
  pngAssets: ZipPngEntry[];
}): Promise<Buffer> {
  const zip = new JSZip();

  if (options.clips.length > 0) {
    const mp4Folder = zip.folder('scenes_mp4_1080p_30fps');
    for (const clip of options.clips) {
      if (fs.existsSync(clip.diskPath)) {
        mp4Folder?.file(clip.filename, fs.readFileSync(clip.diskPath));
      }
    }
  }

  if (options.pngAssets.length > 0) {
    const pngFolder = zip.folder('reference_keyframes_1080p_png');
    for (const asset of options.pngAssets) {
      if (fs.existsSync(asset.sourceImagePath)) {
        const pngBuf = await convertImageToHighResPngBuffer(asset.sourceImagePath, 1920, 1080);
        pngFolder?.file(asset.filename, pngBuf);
      }
    }
  }

  const manifestLines = [
    'NoesisAI True Character Animation Deliverables',
    `Generated MP4 clips included: ${options.clips.length} / 7`,
    `High-Res 1080p PNG keyframes included: ${options.pngAssets.length}`,
    'Video Spec: 16:9 | 1920x1080 (1080p) | 30fps | 8s per scene | Silent (-an) | H.264 MP4',
  ];
  zip.file('README.txt', manifestLines.join('\n'));

  return zip.generateAsync({
    type: 'nodebuffer',
    compression: 'STORE',
  });
}
