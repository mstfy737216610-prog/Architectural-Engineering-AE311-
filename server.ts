import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import {
  CHARACTER_REFERENCE_ASSETS,
  PROJECTS,
  PROMO_SCENES,
} from './src/data/noesisProjectData.ts';
import {
  buildDeliverablesZipBuffer,
  concatenateAnimatedClipsMp4,
  encodeJpegFramesToMp4,
  normalizeGeneratedClipMp4,
  type ZipClipEntry,
  type ZipPngEntry,
} from './server/videoCompiler.ts';

function resolveServerPort(): number {
  const portFlagIdx = process.argv.indexOf('--port');
  if (portFlagIdx !== -1 && process.argv[portFlagIdx + 1]) {
    const cliPort = Number(process.argv[portFlagIdx + 1]);
    if (Number.isFinite(cliPort) && cliPort > 0) return cliPort;
  }
  const envPort = process.env.PORT ? Number(process.env.PORT) : NaN;
  const nginxPort = process.env.NGINX_PORT ? Number(process.env.NGINX_PORT) : NaN;
  const defaultPort = Number(process.env.DEFAULT_APP_PORT || 3000);
  if (Number.isFinite(envPort) && envPort > 0 && envPort !== nginxPort) {
    return envPort;
  }
  return Number.isFinite(defaultPort) && defaultPort > 0 ? defaultPort : 3000;
}

const PORT = resolveServerPort();
const WORKSPACE_ROOT = process.cwd();
const GENERATED_DIR = path.join(WORKSPACE_ROOT, '.generated-videos');
const MANIFEST_PATH = path.join(GENERATED_DIR, 'manifest.json');

fs.mkdirSync(GENERATED_DIR, { recursive: true });

interface StoredClipMeta {
  sceneId: number;
  videoUrl: string;
  downloadUrl: string;
  interactionId: string;
  source: 'omni_flash' | 'threejs_3d';
  modelUsed: string;
  aspectRatio: '16:9' | '9:16';
  duration: string;
  resolution: string;
  width: number;
  height: number;
  fps: number;
  durationSec: number;
  hasAudio: boolean;
  fileSizeBytes: number;
  lipSyncEnabled: boolean;
  characterReferenceUsed: boolean;
  createdAt: string;
  promptUsed: string;
}

interface AnimatedReelMeta {
  videoUrl: string;
  downloadUrl: string;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  fps: number;
  durationSec: number;
  fileSizeBytes: number;
  clipCount: number;
  hasAudio: boolean;
  createdAt: string;
}

interface StoredManifest {
  clips: Record<string, StoredClipMeta>;
  voiceoverUrl?: string;
  animatedReel?: AnimatedReelMeta;
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
      animatedReel: parsed.animatedReel,
    };
  } catch {
    return { clips: {} };
  }
}

function writeManifest(manifest: StoredManifest): void {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
}

// Clean up any legacy static-image Ken Burns promo files if present from earlier version
function cleanupLegacyKenBurnsFiles(): void {
  try {
    const manifest = readManifest();
    let changed = false;
    for (const [k, clip] of Object.entries(manifest.clips)) {
      if ((clip as { source?: string }).source === 'local_ffmpeg') {
        delete manifest.clips[k];
        changed = true;
      }
    }
    if (changed) {
      writeManifest(manifest);
    }
    for (const file of fs.readdirSync(GENERATED_DIR)) {
      if (file.startsWith('noesisai-full-promo-') || file.includes('-local-')) {
        fs.rmSync(path.join(GENERATED_DIR, file), { force: true });
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

cleanupLegacyKenBurnsFiles();

function getGenAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'مفتاح GEMINI_API_KEY غير مُعدّ. يرجى اختيار مفتاح API مدفوع في Settings > Secrets لتشغيل التوليد الفعلي.',
    );
  }
  return new GoogleGenAI({
    apiKey,
    apiVersion: 'v1beta',
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

function resolveSafeAssetPath(relativePath: string): string | null {
  const cleaned = relativePath.replace(/^\/+/, '');
  const allowedPrefixes = ['public/assets/', 'src/assets/images/'];
  if (!allowedPrefixes.some((prefix) => cleaned.startsWith(prefix))) {
    return null;
  }
  const resolved = path.resolve(WORKSPACE_ROOT, cleaned);
  if (!resolved.startsWith(WORKSPACE_ROOT) || !fs.existsSync(resolved)) {
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
        'فشل التحقق من صلاحيات مفتاح API أو أن نموذج gemini-omni-flash-preview يتطلب مفتاحاً مدفوعاً (Paid Tier). يرجى تفعيل مفتاح مدفوع في Settings > Secrets.',
    };
  }

  if (lower.includes('429') || lower.includes('resource_exhausted') || lower.includes('quota')) {
    return {
      status: 429,
      code: 'QUOTA_EXHAUSTED',
      message:
        'تم تجاوز حصة الاستخدام أو أن مفتاح API الحالي مجاني بدون حصة فيديو (Quota = 0). لتوليد مقاطع الأنيميشن الحقيقية عبر gemini-omni-flash-preview يرجى تفعيل مفتاح API مدفوع الفوترة من Settings > Secrets.',
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

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.use('/generated-videos', express.static(GENERATED_DIR));

  app.get('/api/videos/download/:filename', (req, res) => {
    const safeName = path.basename(req.params.filename);
    const targetPath = path.join(GENERATED_DIR, safeName);
    if (!targetPath.startsWith(GENERATED_DIR) || !fs.existsSync(targetPath)) {
      res.status(404).json({ error: 'الملف المطلوب غير موجود.' });
      return;
    }
    res.setHeader('Cache-Control', 'no-store');
    res.download(targetPath, safeName);
  });

  app.get('/api/health', (_req, res) => {
    const hasKey = Boolean(
      process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY',
    );
    res.json({ ok: true, hasApiKey: hasKey, model: 'gemini-omni-flash-preview' });
  });

  app.get('/api/videos/list', (_req, res) => {
    const manifest = readManifest();
    const validClips: Record<string, StoredClipMeta> = {};
    for (const [key, clip] of Object.entries(manifest.clips)) {
      if (
        (clip.source === 'omni_flash' || clip.source === 'threejs_3d') &&
        resolveGeneratedFile(clip.videoUrl)
      ) {
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
    const animatedReel =
      manifest.animatedReel && resolveGeneratedFile(manifest.animatedReel.videoUrl)
        ? manifest.animatedReel
        : undefined;

    res.json({
      clips: validClips,
      voiceoverUrl,
      animatedReel,
    });
  });

  // Download All (ZIP): bundles all generated 1080p 30fps MP4 scenes + high-res 1080p reference PNGs
  app.get('/api/videos/download-all-zip', async (req, res) => {
    try {
      const includePngs = req.query.includePngs !== '0';
      const manifest = readManifest();

      const zipClips: ZipClipEntry[] = [];
      const zipPngs: ZipPngEntry[] = [];

      for (const scene of PROMO_SCENES) {
        const clip = manifest.clips[String(scene.id)];
        const clipDiskPath = resolveGeneratedFile(clip?.videoUrl);
        if (
          clip &&
          (clip.source === 'omni_flash' || clip.source === 'threejs_3d') &&
          clipDiskPath
        ) {
          zipClips.push({
            sceneId: scene.id,
            filename: `NoesisAI_Scene_${String(scene.id).padStart(2, '0')}_1080p_30fps_silent.mp4`,
            diskPath: clipDiskPath,
          });
        }

        if (includePngs) {
          const imgPath = resolveSafeAssetPath(scene.serverImagePath);
          if (imgPath) {
            zipPngs.push({
              sceneId: scene.id,
              filename: `NoesisAI_Scene_${String(scene.id).padStart(2, '0')}_1080p_reference.png`,
              sourceImagePath: imgPath,
            });
          }
        }
      }

      if (zipClips.length === 0 && zipPngs.length === 0) {
        res.status(404).json({ error: 'لا توجد ملفات متاحة للتنزيل داخل الحزمة.' });
        return;
      }

      const zipBuffer = await buildDeliverablesZipBuffer({
        clips: zipClips,
        pngAssets: zipPngs,
      });

      const zipName =
        zipClips.length > 0
          ? 'NoesisAI_Animated_Scenes_1080p_30fps.zip'
          : 'NoesisAI_Reference_Keyframes_1080p_PNG.zip';

      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
      res.setHeader('Content-Length', String(zipBuffer.length));
      res.send(zipBuffer);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذر إنشاء ملف ZIP المجمّع.';
      res.status(500).json({ error: msg });
    }
  });

  // Concatenate ONLY real AI-generated animated clips (never static images)
  app.post('/api/videos/compile-animated-reel', async (req, res) => {
    const workDir = path.join(GENERATED_DIR, `tmp-reel-${Date.now()}`);
    try {
      const { aspectRatio = '16:9', resolution = '1080p' } = (req.body || {}) as {
        aspectRatio?: '16:9' | '9:16';
        resolution?: '720p' | '1080p';
      };

      const manifest = readManifest();
      const clipPaths: string[] = [];
      for (const scene of PROMO_SCENES) {
        const clip = manifest.clips[String(scene.id)];
        const diskPath = resolveGeneratedFile(clip?.videoUrl);
        if (clip && (clip.source === 'omni_flash' || clip.source === 'threejs_3d') && diskPath) {
          clipPaths.push(diskPath);
        }
      }

      if (clipPaths.length === 0) {
        res.status(400).json({
          error:
            'لم يتم توليد أي مقاطع أنيميشن حقيقية بعد. قم بتوليد المشاهد عبر Gemini Omni Flash أولاً (لا يُسمح بتجميع صور ثابتة).',
        });
        return;
      }

      const reelFilename = `noesisai-animated-reel-${aspectRatio.replace(':', 'x')}-${resolution}-${Date.now()}.mp4`;
      const reelOutputPath = path.join(GENERATED_DIR, reelFilename);

      const probe = await concatenateAnimatedClipsMp4({
        clipPaths,
        outputPath: reelOutputPath,
        tempDir: workDir,
        aspectRatio,
        resolution,
        targetFps: 30,
      });

      const meta: AnimatedReelMeta = {
        videoUrl: `/generated-videos/${reelFilename}`,
        downloadUrl: `/api/videos/download/${encodeURIComponent(reelFilename)}`,
        aspectRatio,
        resolution,
        fps: probe.fps || 30,
        durationSec: probe.durationSec,
        fileSizeBytes: probe.fileSizeBytes,
        clipCount: clipPaths.length,
        hasAudio: false,
        createdAt: new Date().toISOString(),
      };

      const latest = readManifest();
      latest.animatedReel = meta;
      writeManifest(latest);

      res.json(meta);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذر دمج مقاطع الأنيميشن.';
      res.status(500).json({ error: msg });
    } finally {
      fs.rmSync(workDir, { recursive: true, force: true });
    }
  });

  app.post('/api/videos/generate', async (req, res) => {
    let rawTempPath: string | null = null;
    try {
      const {
        sceneId,
        prompt,
        aspectRatio = '16:9',
        duration = '8s',
        resolution = '1080p',
        referenceImagePath,
        useReferenceImage = true,
        useCharacterReference = true,
        lipSyncEnabled = false,
        previousInteractionId,
      } = req.body as {
        sceneId?: number;
        prompt?: string;
        aspectRatio?: '16:9' | '9:16';
        duration?: string;
        resolution?: '360p' | '720p' | '1080p';
        referenceImagePath?: string;
        useReferenceImage?: boolean;
        useCharacterReference?: boolean;
        lipSyncEnabled?: boolean;
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
      const reqProjectId =
        (req.body as { projectId?: 'project1' | 'project2' }).projectId ?? 'project1';
      const sceneObj =
        PROJECTS[reqProjectId]?.scenes.find((s) => s.id === Number(sceneId)) ??
        PROMO_SCENES.find((s) => s.id === Number(sceneId));

      type InputPart =
        | { type: 'image'; mime_type: string; data: string }
        | { type: 'text'; text: string };

      let inputPayload: string | InputPart[] = trimmedPrompt;
      let attachedCharRef = false;

      if (!previousInteractionId && (useReferenceImage || useCharacterReference)) {
        const parts: InputPart[] = [];
        const addedDiskPaths = new Set<string>();
        const refNotes: string[] = [];

        if (useReferenceImage && referenceImagePath) {
          const safePath = resolveSafeAssetPath(referenceImagePath);
          if (!safePath) {
            res.status(400).json({ error: 'تعذر العثور على الصورة المرجعية المحددة للمشهد.' });
            return;
          }
          const imageBytes = fs.readFileSync(safePath);
          const ext = path.extname(safePath).toLowerCase();
          const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
          parts.push({
            type: 'image',
            mime_type: mimeType,
            data: imageBytes.toString('base64'),
          });
          addedDiskPaths.add(safePath);
          refNotes.push('Image 1 is the starting scene frame and environment composition.');
        }

        if (
          useCharacterReference &&
          sceneObj &&
          (sceneObj.characterAnchor === 'clinic_doctor' ||
            sceneObj.characterAnchor === 'clinic_patient')
        ) {
          const charPaths = CHARACTER_REFERENCE_ASSETS[sceneObj.characterAnchor] || [];
          for (const charRel of charPaths) {
            const safeCharPath = resolveSafeAssetPath(charRel);
            if (safeCharPath && !addedDiskPaths.has(safeCharPath)) {
              const charBytes = fs.readFileSync(safeCharPath);
              const ext = path.extname(safeCharPath).toLowerCase();
              const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
              parts.push({
                type: 'image',
                mime_type: mimeType,
                data: charBytes.toString('base64'),
              });
              addedDiskPaths.add(safeCharPath);
              attachedCharRef = true;
              refNotes.push(
                `Image ${parts.length} is the Character Identity Reference — lock the exact same face, eyes, hair/hijab, glasses, beard, and attire across the entire animation.`,
              );
            }
          }
        } else if (
          useCharacterReference &&
          sceneObj &&
          (sceneObj.characterAnchor === 'clinic_doctor' ||
            sceneObj.characterAnchor === 'clinic_patient') &&
          addedDiskPaths.size > 0
        ) {
          attachedCharRef = true;
        }

        if (parts.length > 0) {
          const combinedPrompt =
            refNotes.length > 0 ? `${refNotes.join(' ')} ${trimmedPrompt}` : trimmedPrompt;
          parts.push({ type: 'text', text: combinedPrompt });
          inputPayload = parts;
        }
      }

      const targetResolution: '720p' | '1080p' =
        resolution === '720p' ? '720p' : '1080p';

      const interaction = await ai.interactions.create(
        {
          model: 'gemini-omni-flash-preview',
          ...(previousInteractionId ? { previous_interaction_id: previousInteractionId } : {}),
          input: inputPayload,
          background: false,
          store: true,
          stream: false,
          response_format: {
            type: 'video',
            aspect_ratio: aspectRatio,
            duration,
            resolution: targetResolution,
          },
        },
        { timeout: 300000 },
      );

      const videoPart = interaction.output_video;
      if (!videoPart || (!videoPart.data && !videoPart.uri)) {
        res.status(502).json({
          error:
            'لم يُرجع نموذج gemini-omni-flash-preview بيانات فيديو صالحة. يرجى تعديل الوصف والمحاولة مجدداً.',
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
      const timestamp = Date.now();
      rawTempPath = path.join(GENERATED_DIR, `raw-scene-${safeSceneId}-${timestamp}.mp4`);
      fs.writeFileSync(rawTempPath, videoBuffer);

      const filename = `NoesisAI_Scene_${String(safeSceneId).padStart(2, '0')}_${targetResolution}_30fps_${timestamp}.mp4`;
      const outputPath = path.join(GENERATED_DIR, filename);

      const parsedDuration = Math.min(15, Math.max(3, Number.parseInt(duration, 10) || 8));
      const probe = await normalizeGeneratedClipMp4({
        inputPath: rawTempPath,
        outputPath,
        aspectRatio,
        resolution: targetResolution,
        targetFps: 30,
        durationSec: parsedDuration,
        stripAudio: true,
      });

      const videoUrl = `/generated-videos/${filename}`;
      const record: StoredClipMeta = {
        sceneId: safeSceneId,
        videoUrl,
        downloadUrl: `/api/videos/download/${encodeURIComponent(filename)}`,
        interactionId: interaction.id,
        source: 'omni_flash',
        modelUsed: 'gemini-omni-flash-preview',
        aspectRatio,
        duration: `${parsedDuration}s`,
        resolution: targetResolution,
        width: probe.width,
        height: probe.height,
        fps: probe.fps,
        durationSec: probe.durationSec,
        hasAudio: probe.hasAudio,
        fileSizeBytes: probe.fileSizeBytes,
        lipSyncEnabled: Boolean(lipSyncEnabled),
        characterReferenceUsed: attachedCharRef || Boolean(useCharacterReference),
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
    } finally {
      if (rawTempPath && fs.existsSync(rawTempPath)) {
        fs.rmSync(rawTempPath, { force: true });
      }
    }
  });

  // Free Local 3D Frame-to-MP4 Pipeline (Three.js PBR WebGL scenes SC-03, SC-04, SC-05)
  const threeSessions = new Map<string, { dir: string; sceneId: number }>();

  app.post('/api/videos/threejs/start', (req, res) => {
    const { sceneId } = (req.body || {}) as { sceneId?: number };
    if (sceneId !== 3 && sceneId !== 4 && sceneId !== 5) {
      res.status(400).json({ error: 'التصيير المحلي بـ Three.js متاح لمشاهد العناصر والهاردوير (3 و 4 و 5) فقط.' });
      return;
    }
    const sessionId = `3d-${sceneId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const sessionDir = path.join(GENERATED_DIR, `tmp-${sessionId}`);
    fs.mkdirSync(sessionDir, { recursive: true });
    threeSessions.set(sessionId, { dir: sessionDir, sceneId });
    res.json({ sessionId });
  });

  app.post('/api/videos/threejs/chunk', (req, res) => {
    const { sessionId, frames } = (req.body || {}) as {
      sessionId?: string;
      frames?: Array<{ index: number; jpegBase64: string }>;
    };
    const session = sessionId ? threeSessions.get(sessionId) : undefined;
    if (!session || !Array.isArray(frames)) {
      res.status(400).json({ error: 'جلسة التصيير الثلاثي الأبعاد غير صالحة.' });
      return;
    }
    for (const f of frames) {
      const idx = Number(f.index);
      if (!Number.isInteger(idx) || idx < 0 || idx > 600) continue;
      const cleanB64 = f.jpegBase64.replace(/^data:image\/\w+;base64,/, '');
      const framePath = path.join(session.dir, `frame_${String(idx).padStart(4, '0')}.jpg`);
      fs.writeFileSync(framePath, Buffer.from(cleanB64, 'base64'));
    }
    res.json({ ok: true, received: frames.length });
  });

  app.post('/api/videos/threejs/finish', async (req, res) => {
    const {
      sessionId,
      aspectRatio = '16:9',
      resolution = '1080p',
      durationSec = 8,
    } = (req.body || {}) as {
      sessionId?: string;
      aspectRatio?: '16:9' | '9:16';
      resolution?: '720p' | '1080p';
      durationSec?: number;
    };
    const session = sessionId ? threeSessions.get(sessionId) : undefined;
    if (!session) {
      res.status(400).json({ error: 'جلسة التصيير الثلاثي الأبعاد منتهية أو غير موجودة.' });
      return;
    }
    threeSessions.delete(sessionId!);
    try {
      const timestamp = Date.now();
      const filename = `NoesisAI_Scene_${String(session.sceneId).padStart(2, '0')}_3D_${resolution}_30fps_${timestamp}.mp4`;
      const outputPath = path.join(GENERATED_DIR, filename);

      const probe = await encodeJpegFramesToMp4({
        framesDir: session.dir,
        outputPath,
        aspectRatio,
        resolution,
        fps: 30,
        durationSec,
      });

      const sceneMeta = PROMO_SCENES.find((s) => s.id === session.sceneId);
      const record: StoredClipMeta = {
        sceneId: session.sceneId,
        videoUrl: `/generated-videos/${filename}`,
        downloadUrl: `/api/videos/download/${encodeURIComponent(filename)}`,
        interactionId: `threejs-3d-${timestamp}`,
        source: 'threejs_3d',
        modelUsed: 'threejs-webgl-pbr-3d',
        aspectRatio,
        duration: `${durationSec}s`,
        resolution,
        width: probe.width,
        height: probe.height,
        fps: probe.fps,
        durationSec: probe.durationSec,
        hasAudio: probe.hasAudio,
        fileSizeBytes: probe.fileSizeBytes,
        lipSyncEnabled: false,
        characterReferenceUsed: false,
        createdAt: new Date().toISOString(),
        promptUsed: sceneMeta?.motionPrompt || 'Procedural 3D WebGL PBR Scene',
      };

      const manifest = readManifest();
      manifest.clips[String(session.sceneId)] = record;
      writeManifest(manifest);

      res.json(record);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذر ترميز إطارات 3D إلى MP4.';
      res.status(500).json({ error: msg });
    } finally {
      fs.rmSync(session.dir, { recursive: true, force: true });
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
    const vitePromise = import('vite').then(({ createServer: createViteServer }) =>
      createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      }),
    );
    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });
  } else {
    const distDir = path.join(WORKSPACE_ROOT, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NoesisAI True Animation Studio running at http://localhost:${PORT}`);
  });
}

startServer();
