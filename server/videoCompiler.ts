import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export type MotionPreset =
  | 'push_in'
  | 'pull_out'
  | 'pan_right'
  | 'pan_left'
  | 'tilt_down'
  | 'orbit_drift';

export interface SceneRenderSpec {
  id: number;
  durationSec: number;
  imagePath: string;
  omniVideoPath?: string | null;
  isUiScreen: boolean;
  motionPreset: MotionPreset;
}

export interface CompileFullPromoOptions {
  scenes: SceneRenderSpec[];
  outputPath: string;
  tempDir: string;
  srtPath?: string | null;
  voiceoverWavPath?: string | null;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
}

export function getSceneMotionPreset(sceneId: number): MotionPreset {
  switch (sceneId) {
    case 1:
    case 3:
    case 5:
    case 7:
    case 10:
      return 'push_in';
    case 2:
    case 8:
      return 'pan_right';
    case 4:
      return 'orbit_drift';
    case 6:
    case 9:
      return 'pan_left';
    case 11:
      return 'tilt_down';
    case 12:
      return 'pull_out';
    default:
      return 'push_in';
  }
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

export function buildZoompanFilter(
  preset: MotionPreset,
  durationSec: number,
  width: number,
  height: number,
  fps = 25,
  isUiScreen = false,
): string {
  const frames = Math.max(25, Math.round(durationSec * fps));
  // Pre-scale to 1.5x output dimensions for jitter-free subpixel zoompan
  const preW = Math.round(width * 1.5);
  const preH = Math.round(height * 1.5);

  const scaleStep = isUiScreen
    ? `scale=${preW}:${preH}:force_original_aspect_ratio=decrease,pad=${preW}:${preH}:(ow-iw)/2:(oh-ih)/2:color=#F4F7F4,setsar=1`
    : `scale=${preW}:${preH}:force_original_aspect_ratio=increase,crop=${preW}:${preH},setsar=1`;

  let zoomExpr = '';
  switch (preset) {
    case 'pull_out':
      zoomExpr = `z='if(lte(on,1),1.14,max(1.001,zoom-0.0007))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`;
      break;
    case 'pan_right':
      zoomExpr = `z='1.10':x='min(iw-iw/zoom,(iw-iw/zoom)*(on/${frames}))':y='(ih-ih/zoom)/2'`;
      break;
    case 'pan_left':
      zoomExpr = `z='1.10':x='max(0,(iw-iw/zoom)*(1-on/${frames}))':y='(ih-ih/zoom)/2'`;
      break;
    case 'tilt_down':
      zoomExpr = `z='1.12':x='(iw-iw/zoom)/2':y='min(ih-ih/zoom,(ih-ih/zoom)*(on/${frames}))'`;
      break;
    case 'orbit_drift':
      zoomExpr = `z='min(zoom+0.0006,1.12)':x='(iw-iw/zoom)*(0.25+0.5*(on/${frames}))':y='(ih-ih/zoom)/2'`;
      break;
    case 'push_in':
    default:
      zoomExpr = `z='min(zoom+0.0007,1.14)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'`;
      break;
  }

  return `${scaleStep},zoompan=${zoomExpr}:d=${frames}:s=${width}x${height}:fps=${fps},format=yuv420p`;
}

export async function renderSingleSceneMp4(
  spec: SceneRenderSpec,
  outFile: string,
  aspectRatio: '16:9' | '9:16',
  resolution: '720p' | '1080p',
  includeSilentAudio = true,
): Promise<void> {
  const { width, height } = getOutputDimensions(aspectRatio, resolution);
  const fps = 25;

  if (spec.omniVideoPath && fs.existsSync(spec.omniVideoPath)) {
    const scaleFilter = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=#0B1110,fps=${fps},setsar=1,format=yuv420p`;

    const args = [
      '-y',
      '-stream_loop',
      '-1',
      '-i',
      spec.omniVideoPath,
      '-t',
      String(spec.durationSec),
      ...(includeSilentAudio ? ['-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo'] : []),
      '-vf',
      scaleFilter,
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '22',
      '-movflags',
      '+faststart',
      ...(includeSilentAudio ? ['-c:a', 'aac', '-b:a', '128k', '-shortest'] : ['-an']),
      outFile,
    ];
    await execFileAsync('ffmpeg', args, { maxBuffer: 1024 * 1024 * 10 });
    return;
  }

  const vf = buildZoompanFilter(
    spec.motionPreset,
    spec.durationSec,
    width,
    height,
    fps,
    spec.isUiScreen,
  );

  const args = [
    '-y',
    '-loop',
    '1',
    '-i',
    spec.imagePath,
    ...(includeSilentAudio ? ['-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo'] : []),
    '-vf',
    vf,
    '-t',
    String(spec.durationSec),
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '22',
    '-movflags',
    '+faststart',
    ...(includeSilentAudio ? ['-c:a', 'aac', '-b:a', '128k', '-shortest'] : ['-an']),
    outFile,
  ];

  await execFileAsync('ffmpeg', args, { maxBuffer: 1024 * 1024 * 10 });
}

export async function compileFullPromoMp4(options: CompileFullPromoOptions): Promise<{
  outputPath: string;
  fileSizeBytes: number;
  totalDurationSec: number;
}> {
  const { scenes, outputPath, tempDir, srtPath, voiceoverWavPath, aspectRatio, resolution } =
    options;

  fs.mkdirSync(tempDir, { recursive: true });
  const segmentPaths: string[] = [];

  for (const scene of scenes) {
    const segPath = path.join(tempDir, `seg-${String(scene.id).padStart(2, '0')}.mp4`);
    await renderSingleSceneMp4(scene, segPath, aspectRatio, resolution, false);
    segmentPaths.push(segPath);
  }

  const concatListPath = path.join(tempDir, 'concat.txt');
  const concatLines = segmentPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
  fs.writeFileSync(concatListPath, concatLines, 'utf8');

  const rawConcatPath = path.join(tempDir, 'raw-concat.mp4');
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
      rawConcatPath,
    ],
    { maxBuffer: 1024 * 1024 * 10 },
  );

  const totalDurationSec = scenes.reduce((sum, s) => sum + s.durationSec, 0);
  const hasVoiceover = Boolean(voiceoverWavPath && fs.existsSync(voiceoverWavPath));
  const hasSrt = Boolean(srtPath && fs.existsSync(srtPath));

  const finalArgs: string[] = ['-y', '-i', rawConcatPath];
  if (hasVoiceover && voiceoverWavPath) {
    finalArgs.push('-i', voiceoverWavPath);
  } else {
    finalArgs.push('-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo');
  }

  if (hasSrt && srtPath) {
    const escapedSrt = srtPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    const subtitleStyle =
      'FontName=Noto Sans Display,FontSize=12,PrimaryColour=&H00FFFFFF,BackColour=&H99000000,BorderStyle=4,Outline=1,Shadow=0,MarginV=30';
    finalArgs.push('-vf', `subtitles='${escapedSrt}':force_style='${subtitleStyle}'`);
    finalArgs.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21');
  } else {
    finalArgs.push('-c:v', 'copy');
  }

  finalArgs.push(
    '-c:a',
    'aac',
    '-b:a',
    '192k',
    '-t',
    String(totalDurationSec),
    '-movflags',
    '+faststart',
    outputPath,
  );

  await execFileAsync('ffmpeg', finalArgs, { maxBuffer: 1024 * 1024 * 20 });

  const stat = fs.statSync(outputPath);
  return {
    outputPath,
    fileSizeBytes: stat.size,
    totalDurationSec,
  };
}
