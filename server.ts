import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { CAPCUT_SUBTITLES, PROMO_SCENES } from './src/data/noesisProjectData.ts';
import { generateCapCutSrt } from './src/utils/promoStudio.ts';
import {
  compileFullPromoMp4,
  getSceneMotionPreset,
  renderSingleSceneMp4,
  type SceneRenderSpec,
} from './server/videoCompiler.ts';

const PORT = Number(process.env.PORT || 3000);
const WORKSPACE_ROOT = process.cwd();
const GENERATED_DIR = path.join(WORKSPACE_ROOT, '.generated-videos');
const MANIFEST_PATH = path.join(GENERATED_DIR, 'manifest.json');

fs.mkdirSync(GENERATED_DIR, { recursive: true });

interface StoredClipMeta {
  sceneId: number;
  videoUrl: string;
  downloadUrl?: string;
  interactionId: string;
  source?: 'omni_flash' | 'local_ffmpeg';
  aspectRatio: '16:9' | '9:16';
  duration: string;
  resolution: string;
  createdAt: string;
  promptUsed: string;
}

interface FullPromoMeta {
  videoUrl: string;
  downloadUrl: string;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  durationSec: number;
  fileSizeBytes: number;
  aiClipsUsed: number;
  hasVoiceover: boolean;
  hasSubtitles: boolean;
  createdAt: string;
}

interface StoredManifest {
  clips: Record<string, StoredClipMeta>;
  voiceoverUrl?: string;
  fullPromo?: FullPromoMeta;
}

function readManifest(): StoredManifest {
  try {
    if (!fs.existsSync(MANIFEST_PATH)) {
      return { clips: {} };
    }
    const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
    const parsed = JSON.parse(raw) as StoredManifest;
    return {
      clips: parsed.clips || {},
      voiceoverUrl: parsed.voiceoverUrl,
      fullPromo: parsed.fullPromo,
    };
  } catch {
    return { clips: {} };
  }
}

function writeManifest(manifest: StoredManifest): void {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
}

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'مفتاح GEMINI_API_KEY غير مُعدّ أو لا يزال بالقيمة الافتراضية. يرجى إعداد مفتاح API مدفوع في لوحة Settings > Secrets.',
    );
  }
  return new GoogleGenAI({ apiKey });
}

function resolveSafeAssetPath(relativePath: string): string | null {
  const cleaned = relativePath.replace(/^\/+/, '');
  const allowedPrefixes = ['public/assets/', 'src/assets/images/'];
  if (!allowedPrefixes.some((prefix) => cleaned.startsWith(prefix))) {
    return null;
  }
  const resolved = path.resolve(WORKSPACE_ROOT, cleaned);
  if (!resolved.startsWith(WORKSPACE_ROOT)) {
    return null;
  }
  if (!fs.existsSync(resolved)) {
    return null;
  }
  return resolved;
}

function resolveGeneratedFile(fileUrl: string | undefined): string | null {
  if (!fileUrl) return null;
  const fileName = path.basename(fileUrl);
  const fullPath = path.join(GENERATED_DIR, fileName);
  if (!fullPath.startsWith(GENERATED_DIR) || !fs.existsSync(fullPath)) {
    return null;
  }
  return fullPath;
}

function formatGeminiError(err: unknown): { status: number; message: string; code: string } {
  const rawMessage = err instanceof Error ? err.message : String(err);
  const lower = rawMessage.toLowerCase();

  if (lower.includes('403') || lower.includes('permission_denied') || lower.includes('api_key_invalid')) {
    return {
      status: 403,
      code: 'PAID_KEY_OR_PERMISSION_REQUIRED',
      message:
        'فشل التحقق من صلاحيات مفتاح API أو أن النموذج يتطلب مفتاحاً مدفوعاً (Paid Tier). يرجى التحقق من GEMINI_API_KEY في Settings > Secrets.',
    };
  }

  if (lower.includes('429') || lower.includes('resource_exhausted') || lower.includes('quota')) {
    return {
      status: 429,
      code: 'QUOTA_EXHAUSTED',
      message:
        'تم تجاوز حصة الاستخدام أو أن نموذج gemini-omni-1.2-flash يتطلب مفتاح API مدفوعاً مفعّل الفوترة في Settings > Secrets.',
    };
  }

  if (lower.includes('404') || lower.includes('not_found')) {
    return {
      status: 404,
      code: 'MODEL_OR_RESOURCE_NOT_FOUND',
      message: `تعذر الوصول إلى النموذج المطلوب: ${rawMessage}`,
    };
  }

  return {
    status: 500,
    code: 'GENERATION_FAILED',
    message: rawMessage || 'حدث خطأ غير متوقع أثناء التوليد.',
  };
}

let fullExportInProgress: Promise<FullPromoMeta> | null = null;

async function renderFullPromoVideo(options: {
  aspectRatio: '16:9' | '9:16';
  resolution?: '720p' | '1080p';
  burnSubtitles: boolean;
  includeVoiceover: boolean;
}): Promise<FullPromoMeta> {
  const { aspectRatio, resolution = '720p', burnSubtitles, includeVoiceover } = options;
  const manifest = readManifest();
  const workDir = path.join(GENERATED_DIR, `tmp-export-${Date.now()}`);
  fs.mkdirSync(workDir, { recursive: true });

  try {
    let aiClipsUsed = 0;
    const sceneSpecs: SceneRenderSpec[] = [];

    for (const scene of PROMO_SCENES) {
      const imagePath = resolveSafeAssetPath(scene.serverImagePath);
      if (!imagePath) {
        throw new Error(`Missing visual asset for scene ${scene.id}`);
      }

      const existingClip = manifest.clips[String(scene.id)];
      const existingClipDiskPath = resolveGeneratedFile(existingClip?.videoUrl);
      const canReuseClip =
        Boolean(existingClipDiskPath) &&
        (existingClip?.source === 'omni_flash' || existingClip?.aspectRatio === aspectRatio);

      if (canReuseClip && existingClip?.source !== 'local_ffmpeg') {
        aiClipsUsed += 1;
      }

      sceneSpecs.push({
        id: scene.id,
        durationSec: scene.durationSec,
        imagePath,
        omniVideoPath: canReuseClip ? existingClipDiskPath : null,
        isUiScreen: scene.visualSource === 'figma_ui',
        motionPreset: getSceneMotionPreset(scene.id),
      });
    }

    let srtPath: string | null = null;
    if (burnSubtitles) {
      srtPath = path.join(workDir, 'subtitles.srt');
      fs.writeFileSync(srtPath, generateCapCutSrt(CAPCUT_SUBTITLES), 'utf8');
    }

    const voiceoverDiskPath = includeVoiceover
      ? resolveGeneratedFile(manifest.voiceoverUrl)
      : null;

    const finalFilename = `noesisai-full-promo-${aspectRatio.replace(':', 'x')}-${resolution}-${Date.now()}.mp4`;
    const finalOutputPath = path.join(GENERATED_DIR, finalFilename);

    const compiled = await compileFullPromoMp4({
      scenes: sceneSpecs,
      outputPath: finalOutputPath,
      tempDir: path.join(workDir, 'segments'),
      srtPath,
      voiceoverWavPath: voiceoverDiskPath,
      aspectRatio,
      resolution,
    });

    const meta: FullPromoMeta = {
      videoUrl: `/generated-videos/${finalFilename}`,
      downloadUrl: `/api/videos/download/${encodeURIComponent(finalFilename)}`,
      aspectRatio,
      resolution,
      durationSec: compiled.totalDurationSec,
      fileSizeBytes: compiled.fileSizeBytes,
      aiClipsUsed,
      hasVoiceover: Boolean(voiceoverDiskPath),
      hasSubtitles: burnSubtitles,
      createdAt: new Date().toISOString(),
    };

    const latestManifest = readManifest();
    latestManifest.fullPromo = meta;
    writeManifest(latestManifest);

    return meta;
  } finally {
    fs.rmSync(workDir, { recursive: true, force: true });
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.use('/generated-videos', express.static(GENERATED_DIR));

  // Direct attachment download endpoint for guaranteed file download in any browser/iframe
  app.get('/api/videos/download/:filename', (req, res) => {
    const safeName = path.basename(req.params.filename);
    const targetPath = path.join(GENERATED_DIR, safeName);
    if (!targetPath.startsWith(GENERATED_DIR) || !fs.existsSync(targetPath)) {
      res.status(404).json({ error: 'الملف المطلوب غير موجود.' });
      return;
    }
    res.download(targetPath, safeName);
  });

  app.get('/api/health', (_req, res) => {
    const hasKey = Boolean(
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY',
    );
    res.json({ ok: true, hasApiKey: hasKey });
  });

  app.get('/api/videos/list', (_req, res) => {
    const manifest = readManifest();
    const validClips: Record<string, StoredClipMeta> = {};
    for (const [key, clip] of Object.entries(manifest.clips)) {
      if (resolveGeneratedFile(clip.videoUrl)) {
        validClips[key] = {
          ...clip,
          downloadUrl:
            clip.downloadUrl ||
            `/api/videos/download/${encodeURIComponent(path.basename(clip.videoUrl))}`,
        };
      }
    }
    const voiceoverUrl = resolveGeneratedFile(manifest.voiceoverUrl)
      ? manifest.voiceoverUrl
      : undefined;
    const fullPromo =
      manifest.fullPromo && resolveGeneratedFile(manifest.fullPromo.videoUrl)
        ? {
            ...manifest.fullPromo,
            downloadUrl:
              manifest.fullPromo.downloadUrl ||
              `/api/videos/download/${encodeURIComponent(path.basename(manifest.fullPromo.videoUrl))}`,
          }
        : undefined;

    res.json({
      clips: validClips,
      voiceoverUrl,
      fullPromo,
      isCompilingFull: Boolean(fullExportInProgress),
    });
  });

  app.post('/api/videos/export-full', async (req, res) => {
    try {
      const {
        aspectRatio = '16:9',
        resolution = '720p',
        burnSubtitles = true,
        includeVoiceover = true,
      } = (req.body || {}) as {
        aspectRatio?: '16:9' | '9:16';
        resolution?: '720p' | '1080p';
        burnSubtitles?: boolean;
        includeVoiceover?: boolean;
      };

      if (aspectRatio !== '16:9' && aspectRatio !== '9:16') {
        res.status(400).json({ error: 'الأبعاد يجب أن تكون 16:9 أو 9:16.' });
        return;
      }

      if (resolution !== '720p' && resolution !== '1080p') {
        res.status(400).json({ error: 'الدقة يجب أن تكون 720p أو 1080p.' });
        return;
      }

      if (!fullExportInProgress) {
        fullExportInProgress = renderFullPromoVideo({
          aspectRatio,
          resolution,
          burnSubtitles,
          includeVoiceover,
        }).finally(() => {
          fullExportInProgress = null;
        });
      }

      const result = await fullExportInProgress;
      res.json(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذر تصدير الفيديو الكامل.';
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/videos/render-local', async (req, res) => {
    try {
      const {
        sceneId,
        aspectRatio = '16:9',
        resolution = '720p',
        durationSec,
      } = (req.body || {}) as {
        sceneId?: number;
        aspectRatio?: '16:9' | '9:16';
        resolution?: '720p' | '1080p';
        durationSec?: number;
      };

      const scene = PROMO_SCENES.find((s) => s.id === Number(sceneId));
      if (!scene) {
        res.status(400).json({ error: 'المشهد المحدد غير موجود.' });
        return;
      }
      if (aspectRatio !== '16:9' && aspectRatio !== '9:16') {
        res.status(400).json({ error: 'نسبة العرض إلى الارتفاع يجب أن تكون 16:9 أو 9:16.' });
        return;
      }

      const safeResolution: '720p' | '1080p' = resolution === '1080p' ? '1080p' : '720p';
      const imagePath = resolveSafeAssetPath(scene.serverImagePath);
      if (!imagePath) {
        res.status(404).json({ error: 'تعذر العثور على الإطار البصري للمشهد.' });
        return;
      }

      const renderDuration =
        typeof durationSec === 'number' && durationSec >= 3 && durationSec <= 20
          ? durationSec
          : scene.durationSec;

      const filename = `noesis-scene-${String(scene.id).padStart(2, '0')}-local-${aspectRatio.replace(':', 'x')}-${Date.now()}.mp4`;
      const outputPath = path.join(GENERATED_DIR, filename);

      await renderSingleSceneMp4(
        {
          id: scene.id,
          durationSec: renderDuration,
          imagePath,
          isUiScreen: scene.visualSource === 'figma_ui',
          motionPreset: getSceneMotionPreset(scene.id),
        },
        outputPath,
        aspectRatio,
        safeResolution,
        true,
      );

      const record: StoredClipMeta = {
        sceneId: scene.id,
        videoUrl: `/generated-videos/${filename}`,
        downloadUrl: `/api/videos/download/${encodeURIComponent(filename)}`,
        interactionId: `local-ffmpeg-${Date.now()}`,
        source: 'local_ffmpeg',
        aspectRatio,
        duration: `${renderDuration}s`,
        resolution: safeResolution,
        createdAt: new Date().toISOString(),
        promptUsed: `${getSceneMotionPreset(scene.id)} (${aspectRatio})`,
      };

      const manifest = readManifest();
      manifest.clips[String(scene.id)] = record;
      writeManifest(manifest);

      res.json(record);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذر تصدير مقطع المشهد محلياً.';
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/videos/generate', async (req, res) => {
    try {
      const {
        sceneId,
        prompt,
        aspectRatio = '16:9',
        duration = '8s',
        resolution = '720p',
        referenceImagePath,
        useReferenceImage = false,
        previousInteractionId,
      } = req.body as {
        sceneId?: number;
        prompt?: string;
        aspectRatio?: '16:9' | '9:16';
        duration?: string;
        resolution?: '360p' | '720p' | '1080p';
        referenceImagePath?: string;
        useReferenceImage?: boolean;
        previousInteractionId?: string;
      };

      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        res.status(400).json({ error: 'يرجى إدخال وصف المشهد (Prompt) قبل التوليد.' });
        return;
      }

      if (aspectRatio !== '16:9' && aspectRatio !== '9:16') {
        res.status(400).json({ error: 'نسبة العرض إلى الارتفاع يجب أن تكون 16:9 أو 9:16.' });
        return;
      }

      const ai = getGenAIClient();
      const trimmedPrompt = prompt.trim();

      let inputPayload:
        | string
        | Array<
            | { type: 'image'; mime_type: string; data: string }
            | { type: 'text'; text: string }
          > = trimmedPrompt;

      if (useReferenceImage && referenceImagePath && !previousInteractionId) {
        const safePath = resolveSafeAssetPath(referenceImagePath);
        if (!safePath) {
          res.status(400).json({ error: 'تعذر العثور على الصورة المرجعية المحددة للمشهد.' });
          return;
        }
        const imageBytes = fs.readFileSync(safePath);
        const ext = path.extname(safePath).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
        inputPayload = [
          {
            type: 'image',
            mime_type: mimeType,
            data: imageBytes.toString('base64'),
          },
          {
            type: 'text',
            text: trimmedPrompt,
          },
        ];
      }

      const interaction = await ai.interactions.create(
        {
          model: 'gemini-omni-1.2-flash',
          ...(previousInteractionId ? { previous_interaction_id: previousInteractionId } : {}),
          input: inputPayload,
          background: false,
          store: true,
          stream: false,
          response_format: {
            type: 'video',
            aspect_ratio: aspectRatio,
            duration,
            resolution,
          },
        },
        { timeout: 300000 },
      );

      const videoPart = interaction.output_video;
      if (!videoPart || (!videoPart.data && !videoPart.uri)) {
        res.status(502).json({
          error: 'لم يُرجع نموذج gemini-omni-1.2-flash بيانات فيديو صالحة. حاول تعديل الوصف والمحاولة مجدداً.',
        });
        return;
      }

      let videoBuffer: Buffer;
      if (videoPart.data) {
        videoBuffer = Buffer.from(videoPart.data, 'base64');
      } else if (videoPart.uri) {
        const fetched = await fetch(videoPart.uri);
        if (!fetched.ok) {
          throw new Error(`Failed to fetch generated video URI: ${fetched.status}`);
        }
        videoBuffer = Buffer.from(await fetched.arrayBuffer());
      } else {
        throw new Error('Missing video payload');
      }

      const safeSceneId = typeof sceneId === 'number' ? sceneId : 0;
      const filename = `noesis-scene-${safeSceneId}-${Date.now()}.mp4`;
      const outputPath = path.join(GENERATED_DIR, filename);
      fs.writeFileSync(outputPath, videoBuffer);

      const videoUrl = `/generated-videos/${filename}`;
      const record: StoredClipMeta = {
        sceneId: safeSceneId,
        videoUrl,
        downloadUrl: `/api/videos/download/${encodeURIComponent(filename)}`,
        interactionId: interaction.id,
        source: 'omni_flash',
        aspectRatio,
        duration,
        resolution,
        createdAt: new Date().toISOString(),
        promptUsed: trimmedPrompt,
      };

      if (safeSceneId > 0) {
        const manifest = readManifest();
        manifest.clips[String(safeSceneId)] = record;
        writeManifest(manifest);
      }

      res.json(record);
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({
        error: formatted.message,
        code: formatted.code,
      });
    }
  });

  app.post('/api/voiceover/tts', async (req, res) => {
    try {
      const { text, style = 'Calm, authoritative, warm Arabic medical documentary narrator' } =
        req.body as {
          text?: string;
          style?: string;
        };

      if (!text || typeof text !== 'string' || !text.trim()) {
        res.status(400).json({ error: 'يرجى توفير نص التعليق الصوتي لتوليده.' });
        return;
      }

      const ai = getGenAIClient();
      const interaction = await ai.interactions.create({
        model: 'gemini-3.8-flash-lite-tts',
        input: [
          {
            type: 'text',
            text: text.trim(),
            annotations: [
              {
                type: 'speech_metadata',
                style,
              },
            ],
          },
        ],
        response_format: { type: 'audio' },
        generation_config: {
          speech_config: [
            {
              language: 'ar-SA',
              voice: 'Charon',
            },
          ],
        },
      });

      const audioPart = interaction.output_audio;
      if (!audioPart?.data) {
        res.status(502).json({ error: 'لم يُرجع نموذج الصوت بيانات WAV صالحة.' });
        return;
      }

      const wavBuffer = Buffer.from(audioPart.data, 'base64');
      const filename = `noesis-voiceover-${Date.now()}.wav`;
      const outputPath = path.join(GENERATED_DIR, filename);
      fs.writeFileSync(outputPath, wavBuffer);

      const audioUrl = `/generated-videos/${filename}`;
      const manifest = readManifest();
      manifest.voiceoverUrl = audioUrl;
      writeManifest(manifest);

      res.json({ audioUrl, mimeType: audioPart.mime_type || 'audio/wav' });
    } catch (err) {
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({
        error: formatted.message,
        code: formatted.code,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(WORKSPACE_ROOT, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NoesisAI Promo Video Studio server running at http://localhost:${PORT}`);
    // Pre-build the downloadable 90s MP4 on boot if not yet rendered so user always has a real downloadable MP4 immediately
    const manifest = readManifest();
    if (!manifest.fullPromo || !resolveGeneratedFile(manifest.fullPromo.videoUrl)) {
      if (!fullExportInProgress) {
        fullExportInProgress = renderFullPromoVideo({
          aspectRatio: '16:9',
          resolution: '720p',
          burnSubtitles: true,
          includeVoiceover: true,
        })
          .then((meta) => {
            console.log(`Pre-rendered 90s full promo MP4 ready: ${meta.videoUrl}`);
            return meta;
          })
          .catch((err) => {
            console.error('Background pre-render error:', err);
            throw err;
          })
          .finally(() => {
            fullExportInProgress = null;
          });
      }
    }
  });
}

startServer();
