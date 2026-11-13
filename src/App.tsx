import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Download,
  Film,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  Square,
} from 'lucide-react';
import {
  MASTER_STYLE_GUIDE,
  PROMO_SCENES,
  type SceneCategory,
} from './data/noesisProjectData';
import { SCENE_VISUAL_ASSETS } from './data/sceneAssets';
import { TopBar, type StudioTab } from './components/TopBar';
import { SceneCard } from './components/SceneCard';
import { SceneInspector } from './components/SceneInspector';
import { CinemaPlayerModal } from './components/CinemaPlayerModal';
import { StyleGuideView } from './components/StyleGuideView';
import { ResearchBenchmarksView } from './components/ResearchBenchmarksView';
import { VoiceoverSubtitlesView } from './components/VoiceoverSubtitlesView';
import {
  buildOmniPrompt,
  calculateStudioStats,
  filterScenes,
  formatFileSize,
  getDownloadHref,
  type FullPromoMeta,
  type GeneratedClipRecord,
} from './utils/promoStudio';

const CATEGORY_FILTERS: Array<{ id: SceneCategory | 'all'; label: string }> = [
  { id: 'all', label: 'جميع المشاهد' },
  { id: 'problem', label: 'التحديات' },
  { id: 'hardware', label: 'الهاردوير والذكاء' },
  { id: 'ui', label: 'واجهات Figma' },
  { id: 'compliance', label: 'المعايير' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<StudioTab>('storyboard');
  const [selectedSceneId, setSelectedSceneId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SceneCategory | 'all'>('all');
  const [generatedClips, setGeneratedClips] = useState<Record<number, GeneratedClipRecord>>({});
  const [generatingSceneId, setGeneratingSceneId] = useState<number | null>(null);
  const [renderingLocalSceneId, setRenderingLocalSceneId] = useState<number | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [voiceoverAudioUrl, setVoiceoverAudioUrl] = useState<string | null>(null);

  const [fullPromo, setFullPromo] = useState<FullPromoMeta | null>(null);
  const [isExportingFull, setIsExportingFull] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportAspectRatio, setExportAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [burnSubtitles, setBurnSubtitles] = useState<boolean>(true);

  const [batchProgress, setBatchProgress] = useState<{
    current: number;
    total: number;
    sceneCode: string;
  } | null>(null);
  const batchCancelRef = useRef(false);

  const [cinemaInitialMode, setCinemaInitialMode] = useState<'mp4' | 'storyboard' | undefined>(
    undefined,
  );
  const [isCinemaOpen, setIsCinemaOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('autostart') === '1';
    }
    return false;
  });

  // Load persisted generated videos, voiceover & full MP4 promo from backend manifest
  // Poll briefly if background pre-render on server startup hasn't completed yet
  useEffect(() => {
    let active = true;
    let pollTimer: number | undefined;
    let attempts = 0;

    const loadManifest = async () => {
      try {
        const res = await fetch('/api/videos/list');
        if (!res.ok || !active) return;
        const data = (await res.json()) as {
          clips?: Record<string, GeneratedClipRecord>;
          voiceoverUrl?: string;
          fullPromo?: FullPromoMeta;
        };
        if (!active || !data) return;

        if (data.clips) {
          const mapped: Record<number, GeneratedClipRecord> = {};
          for (const [k, v] of Object.entries(data.clips)) {
            mapped[Number(k)] = v;
          }
          setGeneratedClips(mapped);
        }
        if (data.voiceoverUrl) {
          setVoiceoverAudioUrl(data.voiceoverUrl);
        }
        if (data.fullPromo) {
          setFullPromo(data.fullPromo);
        } else if (attempts < 24) {
          attempts += 1;
          pollTimer = window.setTimeout(loadManifest, 2500);
        }
      } catch {
        // Ignore transient network errors
      }
    };

    loadManifest();

    return () => {
      active = false;
      if (pollTimer) {
        window.clearTimeout(pollTimer);
      }
    };
  }, []);

  const filteredScenes = useMemo(
    () => filterScenes(PROMO_SCENES, searchQuery, categoryFilter),
    [searchQuery, categoryFilter],
  );

  const selectedScene = useMemo(
    () => PROMO_SCENES.find((s) => s.id === selectedSceneId) ?? PROMO_SCENES[0],
    [selectedSceneId],
  );

  const stats = useMemo(
    () => calculateStudioStats(PROMO_SCENES, generatedClips),
    [generatedClips],
  );

  const handleExportFull = useCallback(
    async (overrides?: { aspectRatio?: '16:9' | '9:16'; burnSubtitles?: boolean }) => {
      const targetRatio = overrides?.aspectRatio ?? exportAspectRatio;
      const targetSubs = overrides?.burnSubtitles ?? burnSubtitles;
      setIsExportingFull(true);
      setExportError(null);
      try {
        const response = await fetch('/api/videos/export-full', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            aspectRatio: targetRatio,
            burnSubtitles: targetSubs,
            includeVoiceover: true,
          }),
        });
        const data = (await response.json()) as FullPromoMeta & { error?: string };
        if (!response.ok || !data.videoUrl) {
          throw new Error(data.error || 'تعذر تصدير ملف الفيديو الكامل MP4.');
        }
        setFullPromo(data);
      } catch (err) {
        setExportError(
          err instanceof Error ? err.message : 'حدث خطأ أثناء تصدير الفيديو الكامل.',
        );
      } finally {
        setIsExportingFull(false);
      }
    },
    [exportAspectRatio, burnSubtitles],
  );

  const handleGenerateVideo = async (params: {
    sceneId: number;
    prompt: string;
    aspectRatio: '16:9' | '9:16';
    duration: string;
    resolution: '360p' | '720p' | '1080p';
    useReferenceImage: boolean;
    referenceImagePath: string;
    previousInteractionId?: string;
  }) => {
    setGeneratingSceneId(params.sceneId);
    setGenerationError(null);
    try {
      const response = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = (await response.json()) as GeneratedClipRecord & { error?: string };
      if (!response.ok || !data.videoUrl) {
        throw new Error(data.error || 'تعذر توليد مقطع الفيديو عبر Gemini Omni Flash.');
      }
      setGeneratedClips((prev) => ({
        ...prev,
        [params.sceneId]: data,
      }));
      return data;
    } catch (err) {
      setGenerationError(
        err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء توليد الفيديو.',
      );
      return null;
    } finally {
      setGeneratingSceneId(null);
    }
  };

  const handleRenderLocalScene = async (params: {
    sceneId: number;
    aspectRatio: '16:9' | '9:16';
    resolution: '720p' | '1080p';
    durationSec: number;
  }) => {
    setRenderingLocalSceneId(params.sceneId);
    setGenerationError(null);
    try {
      const response = await fetch('/api/videos/render-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = (await response.json()) as GeneratedClipRecord & { error?: string };
      if (!response.ok || !data.videoUrl) {
        throw new Error(data.error || 'تعذر تصدير مقطع المشهد محلياً.');
      }
      setGeneratedClips((prev) => ({
        ...prev,
        [params.sceneId]: data,
      }));
    } catch (err) {
      setGenerationError(
        err instanceof Error ? err.message : 'حدث خطأ أثناء تصدير مقطع المشهد.',
      );
    } finally {
      setRenderingLocalSceneId(null);
    }
  };

  const handleBatchGenerateAll = async () => {
    if (batchProgress) {
      batchCancelRef.current = true;
      return;
    }

    const pendingScenes = PROMO_SCENES.filter((s) => !generatedClips[s.id]);
    const targets = pendingScenes.length > 0 ? pendingScenes : PROMO_SCENES;

    batchCancelRef.current = false;
    setGenerationError(null);
    setExportError(null);
    let generatedAny = false;

    for (let i = 0; i < targets.length; i += 1) {
      if (batchCancelRef.current) break;
      const scene = targets[i];
      setSelectedSceneId(scene.id);
      setBatchProgress({
        current: i + 1,
        total: targets.length,
        sceneCode: scene.code,
      });

      const prompt = buildOmniPrompt(scene, MASTER_STYLE_GUIDE, {
        includeMasterStyle:
          scene.characterAnchor === 'clinic_doctor' ||
          scene.characterAnchor === 'clinic_patient',
      });

      const created = await handleGenerateVideo({
        sceneId: scene.id,
        prompt,
        aspectRatio: exportAspectRatio,
        duration: scene.recommendedVideoDuration,
        resolution: '720p',
        useReferenceImage: true,
        referenceImagePath: scene.serverImagePath,
      });

      if (!created) {
        break;
      }
      generatedAny = true;
    }

    setBatchProgress(null);
    batchCancelRef.current = false;

    if (generatedAny) {
      await handleExportFull();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F6] text-slate-900">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenCinemaPlayer={() => {
          setCinemaInitialMode(undefined);
          setIsCinemaOpen(true);
        }}
      />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-6">
        {activeTab === 'storyboard' && (
          <div className="flex flex-col gap-5">
            {/* Workspace Header & Filter Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 text-balance">
                  استوديو إنتاج البرومو التعريفي — NoesisAI
                </h1>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-600 tabular-nums">
                  <span>{stats.totalScenes} مشهداً متسلسلاً</span>
                  <span aria-hidden="true">·</span>
                  <span>المدة الكلية 1:30</span>
                  <span aria-hidden="true">·</span>
                  <span>{stats.generatedCount} / 12 مقطع MP4 جاهز</span>
                  <span aria-hidden="true">·</span>
                  <span dir="ltr" className="font-mono-tabular">
                    gemini-omni-1.2-flash
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث في المشاهد..."
                    aria-label="ابحث في المشاهد"
                    className="w-full sm:w-56 rounded-lg border border-slate-200 bg-white pr-9 pl-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#2E5332] focus:outline-none"
                  />
                </div>

                {/* Category Segmented Filter */}
                <div
                  role="group"
                  aria-label="تصفية المشاهد حسب الفئة"
                  className="flex items-center gap-1 overflow-x-auto rounded-lg bg-slate-200/70 p-1"
                >
                  {CATEGORY_FILTERS.map((cat) => {
                    const active = categoryFilter === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryFilter(cat.id)}
                        className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          active
                            ? 'bg-white text-slate-900 shadow-xs font-semibold'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Full 90-Second Downloadable MP4 Video Production Bar */}
            <section
              aria-label="تصدير وتحميل الفيديو الكامل MP4"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 flex flex-col gap-2.5"
            >
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2E5332]/10 text-[#2E5332]">
                    <Film className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900">
                        الفيديو الترويجي الكامل (90 ثانية · H.264 MP4)
                      </h2>
                      <span className="text-xs font-medium text-[#2E5332]">
                        {isExportingFull
                          ? 'جاري التصدير...'
                          : fullPromo
                            ? 'جاهز للتحميل'
                            : 'جاري التجهيز...'}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-600 tabular-nums">
                      {fullPromo ? (
                        <>
                          <span dir="ltr" className="font-mono-tabular">
                            {fullPromo.aspectRatio}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>1:30 دقيقة</span>
                          {fullPromo.fileSizeBytes ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span dir="ltr" className="font-mono-tabular">
                                {formatFileSize(fullPromo.fileSizeBytes)}
                              </span>
                            </>
                          ) : null}
                          <span aria-hidden="true">·</span>
                          <span>
                            {fullPromo.aiClipsUsed > 0
                              ? `${fullPromo.aiClipsUsed}/12 Omni AI`
                              : 'إطارات 3D وواجهات Figma'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{fullPromo.hasSubtitles ? 'ترجمة مدمجة' : 'بدون ترجمة'}</span>
                        </>
                      ) : (
                        <span>
                          يقوم الخادم بتجميع المشاهد الـ 12 في ملف MP4 قابل للتحميل.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Export Options & Download Actions */}
                <div className="flex flex-wrap xl:flex-nowrap items-center gap-2 shrink-0">
                  <select
                    aria-label="أبعاد الفيديو الكامل"
                    value={exportAspectRatio}
                    onChange={(e) => setExportAspectRatio(e.target.value as '16:9' | '9:16')}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-mono-tabular text-slate-800 focus:border-[#2E5332] focus:outline-none"
                  >
                    <option value="16:9">16:9 أفقي</option>
                    <option value="9:16">9:16 عمودي</option>
                  </select>

                  <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700 cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      aria-label="دمج الترجمة الإنجليزية"
                      checked={burnSubtitles}
                      onChange={(e) => setBurnSubtitles(e.target.checked)}
                      className="h-3.5 w-3.5 accent-[#2E5332] rounded cursor-pointer"
                    />
                    <span>دمج الترجمة</span>
                  </label>

                  {fullPromo ? (
                    <>
                      <a
                        href={getDownloadHref(fullPromo.videoUrl)}
                        download="NoesisAI-Promo-90s.mp4"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#2E5332] px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#234126] whitespace-nowrap"
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        <span>تحميل الفيديو الكامل (MP4)</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          setCinemaInitialMode('mp4');
                          setIsCinemaOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Play className="h-3.5 w-3.5 text-[#2E5332]" aria-hidden="true" />
                        <span>مشاهدة MP4</span>
                      </button>
                    </>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 whitespace-nowrap">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2E5332]" aria-hidden="true" />
                      <span>جاري التجهيز...</span>
                    </span>
                  )}

                  <button
                    type="button"
                    disabled={isExportingFull}
                    onClick={() => handleExportFull()}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {isExportingFull ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2E5332]" aria-hidden="true" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
                    )}
                    <span>{fullPromo ? 'تحديث الملف' : 'تصدير الآن'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={generatingSceneId !== null && !batchProgress}
                    onClick={handleBatchGenerateAll}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {batchProgress ? (
                      <>
                        <Square className="h-3.5 w-3.5 text-red-600 fill-current" aria-hidden="true" />
                        <span>
                          إيقاف ({batchProgress.current}/{batchProgress.total})
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5 text-[#2E5332]" aria-hidden="true" />
                        <span>توليد الكل بـ AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {exportError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" aria-hidden="true" />
                  <span>{exportError}</span>
                </div>
              )}
            </section>

            {/* 2-Column Studio Grid: 12-Scene Storyboard + Right Scene Inspector */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_430px] gap-6 items-start">
              <section aria-label="شبكة المشاهد الـ 12">
                {filteredScenes.length === 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
                    <p className="text-sm font-semibold text-slate-800">
                      لا توجد مشاهد مطابقة لعبارة البحث الحالية.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setCategoryFilter('all');
                      }}
                      className="mt-3 rounded-lg bg-[#2E5332] px-4 py-2 text-xs font-semibold text-white hover:bg-[#234126] cursor-pointer"
                    >
                      عرض جميع المشاهد
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                    {filteredScenes.map((scene) => (
                      <SceneCard
                        key={scene.id}
                        scene={scene}
                        imageUrl={SCENE_VISUAL_ASSETS[scene.id]}
                        generatedClip={generatedClips[scene.id]}
                        isSelected={selectedScene.id === scene.id}
                        isGenerating={
                          generatingSceneId === scene.id || renderingLocalSceneId === scene.id
                        }
                        onSelect={(id) => {
                          setSelectedSceneId(id);
                          setGenerationError(null);
                        }}
                      />
                    ))}
                  </div>
                )}
              </section>

              <div className="xl:sticky xl:top-20 xl:max-h-[calc(100vh-5.5rem)] xl:overflow-y-auto rounded-xl">
                <SceneInspector
                  scene={selectedScene}
                  imageUrl={SCENE_VISUAL_ASSETS[selectedScene.id]}
                  generatedClip={generatedClips[selectedScene.id]}
                  isGenerating={generatingSceneId === selectedScene.id}
                  isRenderingLocal={renderingLocalSceneId === selectedScene.id}
                  errorMsg={generationError}
                  onGenerateVideo={async (params) => {
                    await handleGenerateVideo(params);
                  }}
                  onRenderLocalScene={handleRenderLocalScene}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'style-guide' && <StyleGuideView />}
        {activeTab === 'benchmarks' && <ResearchBenchmarksView />}
        {activeTab === 'voiceover' && (
          <VoiceoverSubtitlesView
            voiceoverAudioUrl={voiceoverAudioUrl}
            onVoiceoverGenerated={(url) => {
              setVoiceoverAudioUrl(url);
            }}
          />
        )}
      </main>

      <CinemaPlayerModal
        isOpen={isCinemaOpen}
        onClose={() => setIsCinemaOpen(false)}
        generatedClips={generatedClips}
        voiceoverAudioUrl={voiceoverAudioUrl}
        fullPromo={fullPromo}
        isExportingFull={isExportingFull}
        onExportFull={() => handleExportFull()}
        initialMode={cinemaInitialMode}
      />
    </div>
  );
}
