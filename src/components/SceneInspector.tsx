import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Box,
  Check,
  Copy,
  Download,
  Film,
  Loader2,
  Sparkles,
  Wand2,
} from 'lucide-react';
import {
  FIGMA_REFERENCE_SCREENS,
  MASTER_STYLE_GUIDE,
  type PromoScene,
} from '../data/noesisProjectData';
import {
  buildGrokScenePrompt,
  formatFileSize,
  type GeneratedClipRecord,
} from '../utils/promoStudio';
import {
  downloadRemoteFileViaBlob,
  downloadSingleScenePng1080p,
} from '../utils/browserDownload';
import type { TechSceneId } from '../three/techScenes';
import { ThreeTechViewport } from './ThreeTechViewport';

interface SceneInspectorProps {
  scene: PromoScene;
  imageUrl: string;
  generatedClip?: GeneratedClipRecord;
  isGenerating: boolean;
  threeRenderPct: number | null;
  errorMsg: string | null;
  onGenerateVideo: (params: {
    sceneId: number;
    projectId: PromoScene['projectId'];
    prompt: string;
    aspectRatio: '16:9' | '9:16';
    duration: string;
    resolution: '720p' | '1080p';
    useReferenceImage: boolean;
    useCharacterReference: boolean;
    lipSyncEnabled: boolean;
    referenceImagePath: string;
    previousInteractionId?: string;
  }) => Promise<unknown>;
  onRenderThreeScene: (params: {
    sceneId: TechSceneId;
    aspectRatio: '16:9' | '9:16';
    resolution: '720p' | '1080p';
    durationSec: number;
  }) => Promise<unknown>;
}

export const SceneInspector: React.FC<SceneInspectorProps> = ({
  scene,
  imageUrl,
  generatedClip,
  isGenerating,
  threeRenderPct,
  errorMsg,
  onGenerateVideo,
  onRenderThreeScene,
}) => {
  const isCharacterScene =
    scene.characterAnchor === 'clinic_doctor' || scene.characterAnchor === 'clinic_patient';
  const threeSceneId = scene.threeTechSceneId;
  const supportsThree3D = Boolean(threeSceneId);
  const figmaPlate = scene.figmaOverlayCode
    ? FIGMA_REFERENCE_SCREENS.find((f) => f.code === scene.figmaOverlayCode)
    : undefined;

  const [imagePrompt, setImagePrompt] = useState(scene.imagePrompt);
  const [motionPrompt, setMotionPrompt] = useState(scene.motionPrompt);
  const [includeMasterStyle, setIncludeMasterStyle] = useState(isCharacterScene);
  const [useReferenceImage, setUseReferenceImage] = useState(true);
  const [useCharacterReference, setUseCharacterReference] = useState(isCharacterScene);
  const [lipSyncEnabled, setLipSyncEnabled] = useState(Boolean(scene.lipSyncTargetAr));
  const [includeArabicAudio, setIncludeArabicAudio] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [duration, setDuration] = useState<'8s' | '10s'>(scene.recommendedVideoDuration);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
  const [viewMode, setViewMode] = useState<'video' | 'three3d' | 'keyframe'>(
    generatedClip ? 'video' : supportsThree3D ? 'three3d' : 'keyframe',
  );
  const [followUpPrompt, setFollowUpPrompt] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [downloadingType, setDownloadingType] = useState<'mp4' | 'png' | 'figma' | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    const hasChar =
      scene.characterAnchor === 'clinic_doctor' || scene.characterAnchor === 'clinic_patient';
    const has3D = Boolean(scene.threeTechSceneId);
    setImagePrompt(scene.imagePrompt);
    setMotionPrompt(scene.motionPrompt);
    setIncludeMasterStyle(hasChar);
    setUseCharacterReference(hasChar);
    setLipSyncEnabled(Boolean(scene.lipSyncTargetAr));
    setDuration(scene.recommendedVideoDuration);
    setResolution('1080p');
    setFollowUpPrompt('');
    setDownloadError(null);
    setViewMode(generatedClip ? 'video' : has3D ? 'three3d' : 'keyframe');
  }, [scene, generatedClip]);

  const assembledPrompt = buildGrokScenePrompt(scene, MASTER_STYLE_GUIDE, {
    includeMasterStyle,
    enableLipSync: lipSyncEnabled,
    includeArabicAudio,
    customImagePrompt: imagePrompt,
    customMotionPrompt: motionPrompt,
  });

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(assembledPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleGenerate = async () => {
    await onGenerateVideo({
      sceneId: scene.id,
      projectId: scene.projectId,
      prompt: assembledPrompt,
      aspectRatio,
      duration,
      resolution,
      useReferenceImage,
      useCharacterReference: isCharacterScene && useCharacterReference,
      lipSyncEnabled: isCharacterScene && lipSyncEnabled,
      referenceImagePath: scene.serverImagePath,
    });
  };

  const handleFollowUpEdit = async () => {
    if (!generatedClip || !followUpPrompt.trim()) return;
    await onGenerateVideo({
      sceneId: scene.id,
      projectId: scene.projectId,
      prompt: followUpPrompt.trim(),
      aspectRatio,
      duration,
      resolution,
      useReferenceImage: false,
      useCharacterReference: false,
      lipSyncEnabled,
      referenceImagePath: scene.serverImagePath,
      previousInteractionId: generatedClip.interactionId,
    });
    setFollowUpPrompt('');
  };

  const handleDownloadMp4 = async () => {
    if (!generatedClip || downloadingType) return;
    setDownloadingType('mp4');
    setDownloadError(null);
    const filename = `NoesisAI_${scene.code}_1080p_30fps.mp4`;
    try {
      await downloadRemoteFileViaBlob(generatedClip.videoUrl, filename);
    } catch (primaryErr) {
      if (generatedClip.downloadUrl) {
        try {
          await downloadRemoteFileViaBlob(generatedClip.downloadUrl, filename);
        } catch (err) {
          setDownloadError(
            err instanceof Error ? err.message : 'تعذر تنزيل ملف الفيديو.',
          );
        }
      } else {
        setDownloadError(
          primaryErr instanceof Error ? primaryErr.message : 'تعذر تنزيل ملف الفيديو.',
        );
      }
    } finally {
      setDownloadingType(null);
    }
  };

  const handleDownloadPng = async () => {
    if (downloadingType) return;
    setDownloadingType('png');
    setDownloadError(null);
    try {
      await downloadSingleScenePng1080p(scene.code, imageUrl);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : 'تعذر تنزيل الصورة المرجعية PNG.',
      );
    } finally {
      setDownloadingType(null);
    }
  };

  const handleDownloadFigmaPlate = async () => {
    if (!figmaPlate || downloadingType) return;
    setDownloadingType('figma');
    setDownloadError(null);
    try {
      await downloadRemoteFileViaBlob(figmaPlate.imagePath, figmaPlate.filename);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : 'تعذر تنزيل شاشة Figma المقصوصة.',
      );
    } finally {
      setDownloadingType(null);
    }
  };

  return (
    <aside
      aria-label="محرر وتفاصيل المشهد"
      className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden"
    >
      {/* Inspector Header */}
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div dir="ltr" className="text-xs text-slate-500 font-mono-tabular">
            {scene.code} · {scene.timeRange} ({scene.durationSec}s) · 1080p
          </div>
          {(generatedClip || supportsThree3D) && (
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
              {generatedClip && (
                <button
                  type="button"
                  onClick={() => setViewMode('video')}
                  className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    viewMode === 'video'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  MP4 النهائي
                </button>
              )}
              {supportsThree3D && (
                <button
                  type="button"
                  onClick={() => setViewMode('three3d')}
                  className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    viewMode === 'three3d'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  3D مباشر
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewMode('keyframe')}
                className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  viewMode === 'keyframe'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                المرجع
              </button>
            </div>
          )}
        </div>
        <h2 className="mt-1.5 text-base font-bold text-slate-900">
          {scene.code}: {scene.titleAr}
        </h2>
        <p className="mt-1 text-xs text-slate-600 leading-relaxed">{scene.conceptAr}</p>
      </div>

      {/* Stage Preview */}
      <div className="bg-slate-950 p-3 flex flex-col items-center justify-center gap-2">
        <div
          className={`relative overflow-hidden rounded-lg bg-slate-900 border border-white/10 ${
            aspectRatio === '9:16'
              ? 'aspect-[9/16] max-h-[240px]'
              : 'aspect-video w-full max-h-[220px]'
          }`}
        >
          {generatedClip && viewMode === 'video' ? (
            <video
              key={generatedClip.videoUrl}
              src={generatedClip.videoUrl}
              poster={imageUrl}
              preload="none"
              controls
              playsInline
              className="h-full w-full object-contain bg-black"
            />
          ) : supportsThree3D && threeSceneId && viewMode === 'three3d' ? (
            <ThreeTechViewport sceneId={threeSceneId} />
          ) : (
            <img
              src={imageUrl}
              alt={scene.titleAr}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          )}
          {isGenerating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/85 text-white p-4 text-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-400" aria-hidden="true" />
              <p className="text-xs font-semibold">
                {threeRenderPct !== null
                  ? `جاري تصيير إطارات 3D بدقة 1080p (${threeRenderPct}%)...`
                  : 'جاري التوليد...'}
              </p>
              <p className="text-[11px] text-slate-300">
                1080p · 30fps · {duration} · صامت (-an)
              </p>
            </div>
          )}
        </div>

        {generatedClip && (
          <div
            dir="ltr"
            className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono-tabular text-emerald-300"
          >
            <span>
              {generatedClip.width || 1920}×{generatedClip.height || 1080}
            </span>
            <span>·</span>
            <span>{generatedClip.fps || 30}fps</span>
            <span>·</span>
            <span>{generatedClip.durationSec || scene.durationSec}s</span>
            <span>·</span>
            <span>{generatedClip.hasAudio ? 'Audio' : 'Silent (-an)'}</span>
            {generatedClip.fileSizeBytes ? (
              <>
                <span>·</span>
                <span>{formatFileSize(generatedClip.fileSizeBytes)}</span>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Primary Free Student Workflow: Download 1080p PNG + Copy Ready Grok Prompt WITH Arabic Audio */}
      <div className="border-b border-slate-200 bg-[#F4F8F4] px-4 py-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-[#2E5332]">
            برومبت Grok الواقعي (مع الصوت العربي) جاهز للّصق
          </span>
          <button
            type="button"
            onClick={handleCopyPrompt}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#2E5332] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#234126] transition-colors cursor-pointer whitespace-nowrap"
          >
            {copiedPrompt ? (
              <>
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>نسخ برومبت Grok</span>
              </>
            )}
          </button>
        </div>

        <p
          dir="ltr"
          className="rounded-lg border border-[#2E5332]/20 bg-white p-2.5 text-[11px] font-display text-slate-800 leading-relaxed max-h-28 overflow-y-auto select-all"
        >
          {assembledPrompt}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={Boolean(downloadingType)}
            onClick={handleDownloadPng}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#2E5332]/30 bg-white px-3 py-2 text-xs font-semibold text-[#2E5332] hover:bg-emerald-50/50 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
          >
            {downloadingType === 'png' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>تنزيل الصورة (1080p PNG)</span>
          </button>

          {figmaPlate && (
            <button
              type="button"
              disabled={Boolean(downloadingType)}
              onClick={handleDownloadFigmaPlate}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
            >
              {downloadingType === 'figma' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-3.5 w-3.5 text-[#2E5332]" aria-hidden="true" />
              )}
              <span>شاشة {figmaPlate.code}</span>
            </button>
          )}
        </div>
      </div>

      {/* Continuity & Voiceover Metadata */}
      <div className="border-b border-slate-100 bg-white px-4 py-3 flex flex-col gap-2 text-xs">
        <div>
          <span className="font-semibold text-slate-800">نقطة الربط (Frame de raccord): </span>
          <span className="text-slate-600">{scene.frameDeRaccordAr}</span>
        </div>
        <div>
          <span className="font-semibold text-[#2E5332]">التعليق الصوتي المرافق: </span>
          <span className="text-slate-700">{scene.voiceoverSegmentAr}</span>
        </div>
        {scene.lipSyncTargetAr && (
          <div className="rounded-md bg-amber-50 border border-amber-200/80 px-2.5 py-1.5 text-amber-900">
            <span className="font-semibold">مزامنة الشفاه (Lip-Sync عربي): </span>
            <span>«{scene.lipSyncTargetAr}»</span>
          </div>
        )}
      </div>

      {/* Prompt Customization & Free 3D Render / Optional Studio Generation */}
      <div className="flex flex-col gap-3 p-4">
        {errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 leading-relaxed"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        {downloadError && (
          <p className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5">
            {downloadError}
          </p>
        )}

        <div className="flex flex-col gap-2.5">
          <div>
            <label
              htmlFor={`image-prompt-${scene.code}`}
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              تكوين المشهد (تعديل اختياري للبرومبت)
            </label>
            <textarea
              id={`image-prompt-${scene.code}`}
              rows={2}
              dir="ltr"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-display text-slate-800 focus:border-[#2E5332] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={`motion-prompt-${scene.code}`}
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              توجيه الحركة الفعلية والكاميرا (True Animation)
            </label>
            <textarea
              id={`motion-prompt-${scene.code}`}
              rows={3}
              dir="ltr"
              value={motionPrompt}
              onChange={(e) => setMotionPrompt(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-display text-slate-800 focus:border-[#2E5332] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Arabic Audio, Character Reference & Lip-Sync Toggles */}
        <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <label className="flex items-center justify-between gap-2 text-xs font-medium text-slate-800 cursor-pointer">
            <span>تضمين الصوت والتعليق العربي داخل برومبت Grok</span>
            <input
              type="checkbox"
              checked={includeArabicAudio}
              onChange={(e) => setIncludeArabicAudio(e.target.checked)}
              className="h-4 w-4 accent-[#2E5332] rounded cursor-pointer"
            />
          </label>
          {isCharacterScene && (
            <>
              <label className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer">
                <span>حقن وصف الهوية الواقعية الثابتة (د. سالم / نورة)</span>
                <input
                  type="checkbox"
                  checked={includeMasterStyle}
                  onChange={(e) => setIncludeMasterStyle(e.target.checked)}
                  className="h-4 w-4 accent-[#2E5332] rounded cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer">
                <span>إرفاق صورة Character Reference</span>
                <input
                  type="checkbox"
                  checked={useCharacterReference}
                  onChange={(e) => setUseCharacterReference(e.target.checked)}
                  className="h-4 w-4 accent-[#2E5332] rounded cursor-pointer"
                />
              </label>
              {scene.lipSyncTargetAr && (
                <label className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer">
                  <span>تفعيل تعليمات Lip-Sync العربي</span>
                  <input
                    type="checkbox"
                    checked={lipSyncEnabled}
                    onChange={(e) => setLipSyncEnabled(e.target.checked)}
                    className="h-4 w-4 accent-[#2E5332] rounded cursor-pointer"
                  />
                </label>
              )}
            </>
          )}
        </div>

        {/* Free Three.js 3D Export + Optional API Generation */}
        <div className="flex flex-col gap-2">
          {supportsThree3D && threeSceneId && (
            <button
              type="button"
              disabled={isGenerating}
              onClick={() =>
                onRenderThreeScene({
                  sceneId: threeSceneId,
                  aspectRatio,
                  resolution,
                  durationSec: duration === '10s' ? 10 : 8,
                })
              }
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#2E5332] px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#234126] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {isGenerating && threeRenderPct !== null ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>جاري تصيير 3D المجاني ({threeRenderPct}%)...</span>
                </>
              ) : (
                <>
                  <Box className="h-4 w-4" aria-hidden="true" />
                  <span>تصيير MP4 ثلاثي الأبعاد مجاناً (1080p · 30fps)</span>
                </>
              )}
            </button>
          )}

          {generatedClip && (
            <button
              type="button"
              disabled={Boolean(downloadingType)}
              onClick={handleDownloadMp4}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[#2E5332]/30 bg-[#F3F8F3] px-3.5 py-2 text-xs font-semibold text-[#2E5332] hover:bg-[#E7F1E7] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
            >
              {downloadingType === 'mp4' ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              <span>تحميل فيديو {scene.code} (MP4 صامت)</span>
            </button>
          )}

          <div className="grid grid-cols-3 gap-2 pt-1">
            <select
              aria-label="الأبعاد"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono-tabular text-slate-700"
            >
              <option value="16:9">16:9</option>
              <option value="9:16">9:16</option>
            </select>
            <select
              aria-label="المدة"
              value={duration}
              onChange={(e) => setDuration(e.target.value as '8s' | '10s')}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono-tabular text-slate-700"
            >
              <option value="10s">10 ثوانٍ</option>
              <option value="8s">8 ثوانٍ</option>
            </select>
            <select
              aria-label="الدقة"
              value={resolution}
              onChange={(e) => setResolution(e.target.value as '720p' | '1080p')}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-mono-tabular text-slate-700"
            >
              <option value="1080p">1080p</option>
              <option value="720p">720p</option>
            </select>
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerate}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer whitespace-nowrap"
          >
            {isGenerating && threeRenderPct === null ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                <span>جاري التوليد...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                <span>توليد اختياري عبر مفتاح API (إن وُجد)</span>
              </>
            )}
          </button>
        </div>

        {generatedClip && (
          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            <label
              htmlFor={`followup-${scene.code}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
            >
              <Wand2 className="h-3.5 w-3.5 text-[#2E5332]" aria-hidden="true" />
              <span>تعديل حركة المقطع (Multi-turn Edit)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id={`followup-${scene.code}`}
                type="text"
                dir="ltr"
                value={followUpPrompt}
                onChange={(e) => setFollowUpPrompt(e.target.value)}
                placeholder="e.g. Slower camera rotation"
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-display text-slate-800 focus:border-[#2E5332] focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                disabled={isGenerating || !followUpPrompt.trim()}
                onClick={handleFollowUpEdit}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 cursor-pointer whitespace-nowrap"
              >
                <Film className="h-3.5 w-3.5" aria-hidden="true" />
                <span>تطبيق</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
