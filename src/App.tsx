import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  Box,
  Loader2,
  Play,
  Search,
} from 'lucide-react';
import {
  PROJECTS,
  type ProjectId,
  type PromoScene,
  type SceneCategory,
} from './data/noesisProjectData';
import { PROJECT_SCENE_VISUAL_ASSETS } from './data/sceneAssets';
import { TopBar, type StudioTab } from './components/TopBar';
import { SceneCard } from './components/SceneCard';
import { SceneInspector } from './components/SceneInspector';
import { CinemaPlayerModal } from './components/CinemaPlayerModal';
import { StyleGuideView } from './components/StyleGuideView';
import { ResearchBenchmarksView } from './components/ResearchBenchmarksView';
import { VoiceoverSubtitlesView } from './components/VoiceoverSubtitlesView';
import {
  calculateStudioStats,
  filterScenes,
  formatTimecode,
  getSceneStorageKey,
  resolveClipForScene,
  type AnimatedReelMeta,
  type GeneratedClipRecord,
} from './utils/promoStudio';
import {
  buildAndDownloadProjectZipInBrowser,
  type ZipBundleScope,
} from './utils/browserDownload';
import { exportThreeTechSceneToMp4 } from './three/exportThreeMp4';
import type { TechSceneId } from './three/techScenes';

const CATEGORY_FILTERS: Array<{ id: SceneCategory | 'all'; label: string }> = [
  { id: 'all', label: 'الكل' },
  { id: 'problem', label: 'التحديات' },
  { id: 'hardware', label: 'الهاردوير' },
  { id: 'biometric', label: 'الشخصيات' },
  { id: 'montage', label: 'Figma' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<StudioTab>('storyboard');
  const [activeProjectId, setActiveProjectId] = useState<ProjectId>('project1');
  const [selectedSceneId, setSelectedSceneId] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<SceneCategory | 'all'>('all');

  const [projectClips, setProjectClips] = useState<Record<string, GeneratedClipRecord>>({});
  const [threeClips, setThreeClips] = useState<Record<number, GeneratedClipRecord>>({});
  const [generatingSceneKey, setGeneratingSceneKey] = useState<string | null>(null);
  const [threeRenderPct, setThreeRenderPct] = useState<number | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [voiceoverAudioUrl, setVoiceoverAudioUrl] = useState<string | null>(null);

  const [animatedReel, setAnimatedReel] = useState<AnimatedReelMeta | null>(null);
  const [isCompilingReel, setIsCompilingReel] = useState<boolean>(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [zipScopeLoading, setZipScopeLoading] = useState<ZipBundleScope | null>(null);
  const [zipProgressLabel, setZipProgressLabel] = useState<string | null>(null);

  const [cinemaInitialMode, setCinemaInitialMode] = useState<'mp4' | 'storyboard' | undefined>(
    undefined,
  );
  const [isCinemaOpen, setIsCinemaOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('autostart') === '1';
    }
    return false;
  });

  const activeProject = PROJECTS[activeProjectId];
  const activeScenes = activeProject.scenes;
  const activeAssets = PROJECT_SCENE_VISUAL_ASSETS[activeProjectId];

  // Load persisted clips from backend manifest
  useEffect(() => {
    let active = true;
    const loadManifest = async () => {
      try {
        const res = await fetch('/api/videos/list');
        if (!res.ok || !active) return;
        const data = (await res.json()) as {
          clips?: Record<string, GeneratedClipRecord>;
          voiceoverUrl?: string;
          animatedReel?: AnimatedReelMeta;
        };
        if (!active || !data) return;

        if (data.clips) {
          const nextThree: Record<number, GeneratedClipRecord> = {};
          const nextProj: Record<string, GeneratedClipRecord> = {};
          for (const [k, v] of Object.entries(data.clips)) {
            if (v.source === 'threejs_3d') {
              nextThree[Number(k)] = v;
            } else if (v.source === 'omni_flash') {
              const pId = v.projectId ?? 'project1';
              nextProj[getSceneStorageKey(pId, v.sceneId)] = v;
            }
          }
          setThreeClips(nextThree);
          setProjectClips(nextProj);
        }
        if (data.voiceoverUrl) {
          setVoiceoverAudioUrl(data.voiceoverUrl);
        }
        if (data.animatedReel) {
          setAnimatedReel(data.animatedReel);
        }
      } catch {
        // Ignore transient network errors
      }
    };

    loadManifest();
    return () => {
      active = false;
    };
  }, []);

  const filteredScenes = useMemo(
    () => filterScenes(activeScenes, searchQuery, categoryFilter),
    [activeScenes, searchQuery, categoryFilter],
  );

  const selectedScene = useMemo(
    () => activeScenes.find((s) => s.id === selectedSceneId) ?? activeScenes[0],
    [activeScenes, selectedSceneId],
  );

  const stats = useMemo(
    () => calculateStudioStats(activeScenes, projectClips, threeClips),
    [activeScenes, projectClips, threeClips],
  );

  const handleSelectProject = (projectId: ProjectId) => {
    setActiveProjectId(projectId);
    setSelectedSceneId(1);
    setCategoryFilter('all');
    setSearchQuery('');
    setGenerationError(null);
  };

  const handleCompileReel = useCallback(async () => {
    setIsCompilingReel(true);
    setCompileError(null);
    try {
      const response = await fetch('/api/videos/compile-animated-reel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aspectRatio: '16:9',
          resolution: '1080p',
        }),
      });
      const data = (await response.json()) as AnimatedReelMeta & { error?: string };
      if (!response.ok || !data.videoUrl) {
        throw new Error(data.error || 'تعذر تجميع المقاطع المتحركة.');
      }
      setAnimatedReel(data);
    } catch (err) {
      setCompileError(
        err instanceof Error ? err.message : 'حدث خطأ أثناء تجميع المقاطع المتحركة.',
      );
    } finally {
      setIsCompilingReel(false);
    }
  }, []);

  const handleGenerateVideo = async (params: {
    sceneId: number;
    projectId: ProjectId;
    prompt: string;
    aspectRatio: '16:9' | '9:16';
    duration: string;
    resolution: '720p' | '1080p';
    useReferenceImage: boolean;
    useCharacterReference: boolean;
    lipSyncEnabled: boolean;
    referenceImagePath: string;
    previousInteractionId?: string;
  }) => {
    const key = getSceneStorageKey(params.projectId, params.sceneId);
    setGeneratingSceneKey(key);
    setGenerationError(null);
    try {
      const response = await fetch('/api/videos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      const data = (await response.json()) as GeneratedClipRecord & { error?: string };
      if (!response.ok || !data.videoUrl) {
        throw new Error(
          data.error || 'تعذر توليد مقطع الأنيميشن عبر API. استخدم زر نسخ برومبت Grok + تنزيل PNG المجاني.',
        );
      }
      setProjectClips((prev) => ({
        ...prev,
        [key]: { ...data, projectId: params.projectId },
      }));
      return data;
    } catch (err) {
      setGenerationError(
        err instanceof Error ? err.message : 'حدث خطأ أثناء التوليد.',
      );
      return null;
    } finally {
      setGeneratingSceneKey(null);
    }
  };

  const handleRenderThreeScene = useCallback(
    async (params: {
      sceneId: TechSceneId;
      aspectRatio: '16:9' | '9:16';
      resolution: '720p' | '1080p';
      durationSec?: number;
    }) => {
      const key = `three:${params.sceneId}`;
      setGeneratingSceneKey(key);
      setThreeRenderPct(0);
      setGenerationError(null);
      try {
        const record = await exportThreeTechSceneToMp4({
          sceneId: params.sceneId,
          aspectRatio: params.aspectRatio,
          resolution: params.resolution,
          durationSec: params.durationSec ?? 8,
          onProgress: (pct) => setThreeRenderPct(pct),
        });
        setThreeClips((prev) => ({
          ...prev,
          [params.sceneId]: record,
        }));
        return record;
      } catch (err) {
        setGenerationError(
          err instanceof Error ? err.message : 'حدث خطأ أثناء تصيير مشهد 3D إلى MP4.',
        );
        return null;
      } finally {
        setGeneratingSceneKey(null);
        setThreeRenderPct(null);
      }
    },
    [],
  );

  const handleBatchRenderThreeScenes = async () => {
    const techIds: TechSceneId[] = [3, 4, 5];
    setGenerationError(null);
    setCompileError(null);
    for (const id of techIds) {
      const matchInCurrent = activeScenes.find((s) => s.threeTechSceneId === id);
      if (matchInCurrent) {
        setSelectedSceneId(matchInCurrent.id);
      }
      const ok = await handleRenderThreeScene({
        sceneId: id,
        aspectRatio: '16:9',
        resolution: '1080p',
        durationSec: 8,
      });
      if (!ok) break;
    }
  };

  const handleDownloadZipScope = useCallback(
    async (scope: ZipBundleScope) => {
      if (zipScopeLoading) return;
      setCompileError(null);
      setZipScopeLoading(scope);
      setZipProgressLabel('جاري تجهيز ملفات الحزمة...');
      try {
        await buildAndDownloadProjectZipInBrowser({
          scope,
          projectClips,
          threeClips,
          includePngs: true,
          onProgress: (label) => setZipProgressLabel(label),
        });
      } catch (err) {
        setCompileError(
          err instanceof Error ? err.message : 'تعذر تحميل ملف ZIP المجمّع.',
        );
      } finally {
        setZipScopeLoading(null);
        setZipProgressLabel(null);
      }
    },
    [projectClips, threeClips, zipScopeLoading],
  );

  const isSceneGenerating = (scene: PromoScene): boolean => {
    if (!generatingSceneKey) return false;
    if (generatingSceneKey === getSceneStorageKey(scene.projectId, scene.id)) return true;
    if (scene.threeTechSceneId && generatingSceneKey === `three:${scene.threeTechSceneId}`) {
      return true;
    }
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8F6] text-slate-900">
      <TopBar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'auto' });
          }
        }}
        onOpenCinemaPlayer={() => {
          setCinemaInitialMode(undefined);
          setIsCinemaOpen(true);
        }}
      />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-6 py-6">
        {/* Global Project Switcher + One-Click Deliverables Bar */}
        <section
          aria-label="اختيار المشروع وتحميل الحزم الكاملة"
          className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-4 flex flex-col gap-3.5"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Project Switcher */}
            <div
              role="group"
              aria-label="التبديل بين المشروع الأول والمشروع الثاني"
              className="flex flex-wrap items-center gap-1.5 rounded-lg bg-slate-100 p-1 self-start"
            >
              {(Object.values(PROJECTS) as Array<(typeof PROJECTS)[ProjectId]>).map((proj) => {
                const active = activeProjectId === proj.id;
                return (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => handleSelectProject(proj.id)}
                    aria-pressed={active}
                    className={`rounded-md px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#2E5332] text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-white/70'
                    }`}
                  >
                    {proj.nameAr}
                  </button>
                );
              })}
            </div>

            {/* Download All ZIP Buttons */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={Boolean(zipScopeLoading)}
                onClick={() => handleDownloadZipScope('project1')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#2E5332]/35 bg-[#F3F8F3] px-3.5 py-2 text-xs font-semibold text-[#2E5332] hover:bg-[#E7F1E7] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
              >
                {zipScopeLoading === 'project1' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>تحميل المشروع 1 (ZIP)</span>
              </button>

              <button
                type="button"
                disabled={Boolean(zipScopeLoading)}
                onClick={() => handleDownloadZipScope('project2')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#2E5332]/35 bg-[#F3F8F3] px-3.5 py-2 text-xs font-semibold text-[#2E5332] hover:bg-[#E7F1E7] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
              >
                {zipScopeLoading === 'project2' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Archive className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>تحميل المشروع 2 (ZIP)</span>
              </button>

              <button
                type="button"
                disabled={Boolean(zipScopeLoading)}
                onClick={() => handleDownloadZipScope('both')}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2E5332] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#234126] disabled:opacity-60 cursor-pointer whitespace-nowrap"
              >
                {zipScopeLoading === 'both' ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Archive className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{zipProgressLabel || 'تحميل المشروعين معاً (ZIP)'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-600">
            <p className="leading-relaxed">
              تحتوي كل حزمة ZIP على: صور واقعية سينمائية متناسقة (1080p PNG) + شاشات Figma المقصوصة (FIG-01..05) + برومبتات Grok بالصوت العربي + ملف Voiceover + الترجمة (.srt) + مقاطع 3D المجانية.
            </p>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={generatingSceneKey !== null}
                onClick={handleBatchRenderThreeScenes}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Box className="h-3.5 w-3.5 text-[#2E5332]" aria-hidden="true" />
                <span>تصيير مشاهد 3D المجانية (3, 4, 5)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCinemaInitialMode(animatedReel ? 'mp4' : 'storyboard');
                  setIsCinemaOpen(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Play className="h-3.5 w-3.5 text-[#2E5332]" aria-hidden="true" />
                <span>معاينة {activeProject.shortNameAr}</span>
              </button>
            </div>
          </div>

          {compileError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" aria-hidden="true" />
              <span>{compileError}</span>
            </div>
          )}
        </section>

        {activeTab === 'storyboard' && (
          <div className="flex flex-col gap-5">
            {/* Workspace Header & Filter Toolbar */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 text-balance">
                  {activeProject.nameAr}
                </h1>
                <p className="mt-1 text-xs text-slate-600 max-w-3xl leading-relaxed">
                  {activeProject.subtitleAr}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-600 tabular-nums">
                  <span>{stats.totalScenes} مشاهد واقعية</span>
                  <span aria-hidden="true">·</span>
                  <span>المدة الكلية {formatTimecode(activeProject.totalDurationSec)}</span>
                  <span aria-hidden="true">·</span>
                  <span>16:9 · 1080p PNG + Grok (صوت عربي)</span>
                  <span aria-hidden="true">·</span>
                  <span>{stats.generatedCount} / {stats.totalScenes} مقاطع MP4 جاهزة</span>
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
                    className="w-full sm:w-52 rounded-lg border border-slate-200 bg-white pr-9 pl-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-[#2E5332] focus:outline-none"
                  />
                </div>

                {/* Category Segmented Filter */}
                <div
                  role="group"
                  aria-label="تصفية المشاهد حسب الفئة"
                  className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-200/70 p-1"
                >
                  {CATEGORY_FILTERS.map((cat) => {
                    const active = categoryFilter === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoryFilter(cat.id)}
                        className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
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

            {/* 2-Column Studio Grid: Scenes + Right Scene Inspector */}
            <div className="grid grid-cols-1 xl:grid-cols-[1fr_440px] gap-6 items-start">
              <section aria-label="شبكة المشاهد">
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
                        key={`${scene.projectId}-${scene.id}`}
                        scene={scene}
                        imageUrl={activeAssets[scene.id]}
                        generatedClip={resolveClipForScene(scene, projectClips, threeClips)}
                        isSelected={selectedScene.id === scene.id}
                        isGenerating={isSceneGenerating(scene)}
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
                  imageUrl={activeAssets[selectedScene.id]}
                  generatedClip={resolveClipForScene(selectedScene, projectClips, threeClips)}
                  isGenerating={isSceneGenerating(selectedScene)}
                  threeRenderPct={isSceneGenerating(selectedScene) ? threeRenderPct : null}
                  errorMsg={generationError}
                  onGenerateVideo={handleGenerateVideo}
                  onRenderThreeScene={handleRenderThreeScene}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'style-guide' && <StyleGuideView />}
        {activeTab === 'benchmarks' && <ResearchBenchmarksView />}
        {activeTab === 'voiceover' && (
          <VoiceoverSubtitlesView
            project={activeProject}
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
        project={activeProject}
        projectClips={projectClips}
        threeClips={threeClips}
        voiceoverAudioUrl={voiceoverAudioUrl}
        animatedReel={animatedReel}
        isCompilingReel={isCompilingReel}
        onCompileReel={handleCompileReel}
        initialMode={cinemaInitialMode}
      />
    </div>
  );
}
