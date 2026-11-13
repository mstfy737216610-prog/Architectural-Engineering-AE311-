import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  Film,
  Loader2,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { MASTER_STYLE_GUIDE, type PromoScene } from '../data/noesisProjectData';
import {
  buildOmniPrompt,
  getDownloadHref,
  type GeneratedClipRecord,
} from '../utils/promoStudio';

interface SceneInspectorProps {
  scene: PromoScene;
  imageUrl: string;
  generatedClip?: GeneratedClipRecord;
  isGenerating: boolean;
  isRenderingLocal: boolean;
  errorMsg: string | null;
  onGenerateVideo: (params: {
    sceneId: number;
    prompt: string;
    aspectRatio: '16:9' | '9:16';
    duration: string;
    resolution: '360p' | '720p' | '1080p';
    useReferenceImage: boolean;
    referenceImagePath: string;
    previousInteractionId?: string;
  }) => Promise<void>;
  onRenderLocalScene: (params: {
    sceneId: number;
    aspectRatio: '16:9' | '9:16';
    resolution: '720p' | '1080p';
    durationSec: number;
  }) => Promise<void>;
}

export const SceneInspector: React.FC<SceneInspectorProps> = ({
  scene,
  imageUrl,
  generatedClip,
  isGenerating,
  isRenderingLocal,
  errorMsg,
  onGenerateVideo,
  onRenderLocalScene,
}) => {
  const [imagePrompt, setImagePrompt] = useState(scene.imagePrompt);
  const [motionPrompt, setMotionPrompt] = useState(scene.motionPrompt);
  const [includeMasterStyle, setIncludeMasterStyle] = useState(
    scene.characterAnchor === 'clinic_doctor' || scene.characterAnchor === 'clinic_patient',
  );
  const [useReferenceImage, setUseReferenceImage] = useState(true);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [duration, setDuration] = useState<'5s' | '8s' | '10s' | '15s'>(
    scene.recommendedVideoDuration,
  );
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [viewMode, setViewMode] = useState<'video' | 'keyframe'>(
    generatedClip ? 'video' : 'keyframe',
  );
  const [followUpPrompt, setFollowUpPrompt] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Sync local form state when active scene changes
  useEffect(() => {
    setImagePrompt(scene.imagePrompt);
    setMotionPrompt(scene.motionPrompt);
    setIncludeMasterStyle(
      scene.characterAnchor === 'clinic_doctor' || scene.characterAnchor === 'clinic_patient',
    );
    setDuration(scene.recommendedVideoDuration);
    setFollowUpPrompt('');
    setViewMode(generatedClip ? 'video' : 'keyframe');
  }, [scene, generatedClip]);

  const assembledPrompt = buildOmniPrompt(scene, MASTER_STYLE_GUIDE, {
    includeMasterStyle,
    customImagePrompt: imagePrompt,
    customMotionPrompt: motionPrompt,
  });

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(assembledPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 1800);
    } catch {
      // Ignore clipboard failures in restricted contexts
    }
  };

  const handleGenerate = async () => {
    await onGenerateVideo({
      sceneId: scene.id,
      prompt: assembledPrompt,
      aspectRatio,
      duration,
      resolution,
      useReferenceImage,
      referenceImagePath: scene.serverImagePath,
    });
  };

  const handleRenderLocal = async () => {
    const parsedSec = Number.parseInt(duration, 10) || scene.durationSec;
    await onRenderLocalScene({
      sceneId: scene.id,
      aspectRatio,
      resolution,
      durationSec: parsedSec,
    });
  };

  const handleFollowUpEdit = async () => {
    if (!generatedClip || !followUpPrompt.trim()) return;
    await onGenerateVideo({
      sceneId: scene.id,
      prompt: followUpPrompt.trim(),
      aspectRatio,
      duration,
      resolution,
      useReferenceImage: false,
      referenceImagePath: scene.serverImagePath,
      previousInteractionId: generatedClip.interactionId,
    });
    setFollowUpPrompt('');
  };

  const isBusy = isGenerating || isRenderingLocal;
  const paddedNum = String(scene.id).padStart(2, '0');

  return (
    <aside
      aria-label="محرر وتوليد المشهد"
      className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden"
    >
      {/* Inspector Header */}
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div dir="ltr" className="text-xs text-slate-500 font-mono-tabular">
            {scene.code} · {scene.timeRange} · {scene.durationSec}s
          </div>
          {generatedClip && (
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('video')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  viewMode === 'video'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الفيديو المُولَّد
              </button>
              <button
                type="button"
                onClick={() => setViewMode('keyframe')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  viewMode === 'keyframe'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                الإطار المرجعي
              </button>
            </div>
          )}
        </div>
        <h2 className="mt-1.5 text-base font-bold text-slate-900">
          المشهد {paddedNum}: {scene.titleAr}
        </h2>
        <p className="mt-1 text-xs text-slate-600 leading-relaxed">{scene.conceptAr}</p>
      </div>

      {/* Stage Preview */}
      <div className="bg-slate-950 p-3 flex items-center justify-center">
        <div
          className={`relative overflow-hidden rounded-lg bg-slate-900 border border-white/10 ${
            aspectRatio === '9:16' ? 'aspect-[9/16] max-h-[240px]' : 'aspect-video w-full max-h-[220px]'
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
          ) : (
            <img
              src={imageUrl}
              alt={scene.titleAr}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          )}
          {isBusy && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/75 text-white p-4 text-center">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-400" aria-hidden="true" />
              <p className="text-xs font-semibold">
                {isRenderingLocal
                  ? 'جاري تصدير مقطع MP4 محلياً بحركة الكاميرا...'
                  : 'جاري توليد مقطع الفيديو عبر gemini-omni-1.2-flash...'}
              </p>
              <p className="text-[11px] text-slate-300">
                {isRenderingLocal
                  ? 'يتم إنشاء ملف H.264 MP4 قابل للتنزيل مباشرة خلال ثوانٍ'
                  : 'قد يستغرق التوليد الفعلي 30 إلى 90 ثانية حسب المدة والدقة'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Voiceover Segment Sync */}
      <div className="border-b border-slate-100 bg-[#F8FAF8] px-4 py-2.5">
        <div className="text-[11px] font-semibold text-[#2E5332]">التعليق الصوتي المرافق</div>
        <p className="mt-0.5 text-xs text-slate-700 leading-relaxed">{scene.voiceoverSegmentAr}</p>
      </div>

      {/* Controls & Prompt Editor */}
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

        {/* Prompt Inputs */}
        <div className="flex flex-col gap-2.5">
          <div>
            <label
              htmlFor={`image-prompt-${scene.id}`}
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              وصف المشهد البصري (Image Prompt)
            </label>
            <textarea
              id={`image-prompt-${scene.id}`}
              rows={2}
              dir="ltr"
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-1.5 text-xs font-display text-slate-800 focus:border-[#2E5332] focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor={`motion-prompt-${scene.id}`}
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              توجيه الكاميرا والحركة (Motion Prompt)
            </label>
            <textarea
              id={`motion-prompt-${scene.id}`}
              rows={2}
              dir="ltr"
              value={motionPrompt}
              onChange={(e) => setMotionPrompt(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2 text-xs font-display text-slate-800 focus:border-[#2E5332] focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Consistency & Input Mode Toggles */}
        <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
          <label className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer">
            <span>تحريك الصورة المرجعية (Image-to-Video)</span>
            <input
              type="checkbox"
              checked={useReferenceImage}
              onChange={(e) => setUseReferenceImage(e.target.checked)}
              className="h-4 w-4 accent-[#2E5332] rounded cursor-pointer"
            />
          </label>
          {(scene.characterAnchor === 'clinic_doctor' ||
            scene.characterAnchor === 'clinic_patient') && (
            <label className="flex items-center justify-between gap-2 text-xs text-slate-700 cursor-pointer">
              <span>حقن دليل الهوية البصرية الثابت تلقائياً</span>
              <input
                type="checkbox"
                checked={includeMasterStyle}
                onChange={(e) => setIncludeMasterStyle(e.target.checked)}
                className="h-4 w-4 accent-[#2E5332] rounded cursor-pointer"
              />
            </label>
          )}
        </div>

        {/* Video Parameters Grid */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label
              htmlFor="video-aspect-ratio"
              className="block text-[11px] font-medium text-slate-600 mb-1"
            >
              الأبعاد
            </label>
            <select
              id="video-aspect-ratio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as '16:9' | '9:16')}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-mono-tabular text-slate-800 focus:border-[#2E5332] focus:outline-none"
            >
              <option value="16:9">16:9 أفقي</option>
              <option value="9:16">9:16 عمودي</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="video-duration"
              className="block text-[11px] font-medium text-slate-600 mb-1"
            >
              المدة
            </label>
            <select
              id="video-duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value as '5s' | '8s' | '10s' | '15s')}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-mono-tabular text-slate-800 focus:border-[#2E5332] focus:outline-none"
            >
              <option value="5s">5 ثوانٍ</option>
              <option value="8s">8 ثوانٍ</option>
              <option value="10s">10 ثوانٍ</option>
              <option value="15s">15 ثانية</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="video-resolution"
              className="block text-[11px] font-medium text-slate-600 mb-1"
            >
              الدقة
            </label>
            <select
              id="video-resolution"
              value={resolution}
              onChange={(e) => setResolution(e.target.value as '720p' | '1080p')}
              className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-mono-tabular text-slate-800 focus:border-[#2E5332] focus:outline-none"
            >
              <option value="720p">720p HD</option>
              <option value="1080p">1080p FHD</option>
            </select>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isBusy}
              onClick={handleRenderLocal}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-[#2E5332] px-3.5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#234126] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {isRenderingLocal ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>جاري التصدير...</span>
                </>
              ) : (
                <>
                  <Film className="h-4 w-4" aria-hidden="true" />
                  <span>تصدير المشهد MP4 فوري</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isBusy}
              onClick={handleGenerate}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Omni Flash...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-[#2E5332]" aria-hidden="true" />
                  <span>Omni Flash AI</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCopyPrompt}
              aria-label="نسخ الوصف الكامل للمشهد"
              title="نسخ الوصف الكامل للمشهد"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 py-2.5 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              {copiedPrompt ? (
                <Check className="h-4 w-4 text-[#2E5332]" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          </div>

          {generatedClip && (
            <a
              href={generatedClip.downloadUrl || getDownloadHref(generatedClip.videoUrl)}
              download={`noesis-scene-${paddedNum}.mp4`}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#2E5332]/30 bg-[#F3F8F3] px-4 py-2 text-xs font-semibold text-[#2E5332] hover:bg-[#E7F1E7] transition-colors"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              <span>تحميل فيديو المشهد {paddedNum} (MP4)</span>
            </a>
          )}
        </div>

        {/* Multi-turn Video Editing / Extension (when clip came from Omni Flash) */}
        {generatedClip && generatedClip.source !== 'local_ffmpeg' && (
          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            <label
              htmlFor={`followup-${scene.id}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700"
            >
              <Wand2 className="h-3.5 w-3.5 text-[#2E5332]" aria-hidden="true" />
              <span>تعديل أو تمديد المقطع المُولَّد (Multi-turn Edit)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id={`followup-${scene.id}`}
                type="text"
                dir="ltr"
                value={followUpPrompt}
                onChange={(e) => setFollowUpPrompt(e.target.value)}
                placeholder="e.g. Extend camera zoom slowly, warmer lighting"
                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-display text-slate-800 focus:border-[#2E5332] focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                disabled={isBusy || !followUpPrompt.trim()}
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
