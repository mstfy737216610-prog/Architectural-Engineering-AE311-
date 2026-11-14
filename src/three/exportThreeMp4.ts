import { createTechSceneStage, type TechSceneId } from './techScenes';
import type { GeneratedClipRecord } from '../utils/promoStudio';

export async function exportThreeTechSceneToMp4(options: {
  sceneId: TechSceneId;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  durationSec?: number;
  onProgress?: (pct: number) => void;
}): Promise<GeneratedClipRecord> {
  const { sceneId, aspectRatio, resolution, durationSec = 8, onProgress } = options;
  const fps = 30;
  const totalFrames = durationSec * fps;

  const width =
    aspectRatio === '9:16'
      ? resolution === '1080p'
        ? 1080
        : 720
      : resolution === '1080p'
        ? 1920
        : 1280;
  const height =
    aspectRatio === '9:16'
      ? resolution === '1080p'
        ? 1920
        : 1280
      : resolution === '1080p'
        ? 1080
        : 720;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const controller = createTechSceneStage(canvas, sceneId, { width, height });
  try {
    const startRes = await fetch('/api/videos/threejs/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sceneId }),
    });
    const startData = (await startRes.json()) as { sessionId?: string; error?: string };
    if (!startRes.ok || !startData.sessionId) {
      throw new Error(startData.error || 'تعذر بدء جلسة تصيير 3D.');
    }

    const sessionId = startData.sessionId;
    const chunkSize = 12;
    let batch: Array<{ index: number; jpegBase64: string }> = [];

    for (let i = 0; i < totalFrames; i += 1) {
      const timeSec = (i / fps) % durationSec;
      controller.renderFrame(timeSec);
      const jpegBase64 = canvas.toDataURL('image/jpeg', 0.94);
      batch.push({ index: i, jpegBase64 });

      if (batch.length >= chunkSize || i === totalFrames - 1) {
        const chunkRes = await fetch('/api/videos/threejs/chunk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, frames: batch }),
        });
        if (!chunkRes.ok) {
          throw new Error('فشل إرسال دفعة إطارات 3D إلى الخادم.');
        }
        batch = [];
        onProgress?.(Math.round(((i + 1) / totalFrames) * 85));
        // Yield briefly to keep UI responsive during software WebGL frame export
        await new Promise((r) => window.setTimeout(r, 0));
      }
    }

    onProgress?.(92);
    const finishRes = await fetch('/api/videos/threejs/finish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, aspectRatio, resolution, durationSec }),
    });
    const finishData = (await finishRes.json()) as GeneratedClipRecord & { error?: string };
    if (!finishRes.ok || !finishData.videoUrl) {
      throw new Error(finishData.error || 'فشل ترميز فيديو 3D النهائي.');
    }
    onProgress?.(100);
    return finishData;
  } finally {
    controller.dispose();
  }
}
