import React, { useEffect, useRef, useState } from 'react';
import {
  Archive,
  Download,
  Film,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { ProjectDefinition } from '../data/noesisProjectData';
import { PROJECT_SCENE_VISUAL_ASSETS } from '../data/sceneAssets';
import {
  findActiveSceneAtTime,
  formatFileSize,
  formatTimecode,
  resolveClipForScene,
  type AnimatedReelMeta,
  type GeneratedClipRecord,
} from '../utils/promoStudio';
import {
  buildAndDownloadProjectZipInBrowser,
  downloadRemoteFileViaBlob,
} from '../utils/browserDownload';

interface CinemaPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectDefinition;
  projectClips: Record<string, GeneratedClipRecord>;
  threeClips: Record<number, GeneratedClipRecord>;
  voiceoverAudioUrl: string | null;
  animatedReel: AnimatedReelMeta | null;
  isCompilingReel: boolean;
  onCompileReel: () => Promise<void>;
  initialSceneId?: number;
  initialMode?: 'mp4' | 'storyboard';
}

export const CinemaPlayerModal: React.FC<CinemaPlayerModalProps> = ({
  isOpen,
  onClose,
  project,
  projectClips,
  threeClips,
  voiceoverAudioUrl,
  animatedReel,
  isCompilingReel,
  onCompileReel,
  initialSceneId,
  initialMode,
}) => {
  const scenes = project.scenes;
  const totalDurationSec = project.totalDurationSec;
  const sceneAssets = PROJECT_SCENE_VISUAL_ASSETS[project.id];

  const [playbackMode, setPlaybackMode] = useState<'mp4' | 'storyboard'>('storyboard');
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [isDownloadingReel, setIsDownloadingReel] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const generatedCount = scenes.filter((s) =>
    Boolean(resolveClipForScene(s, projectClips, threeClips)),
  ).length;

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }
    const preferredMode =
      initialMode ?? (animatedReel && !initialSceneId ? 'mp4' : 'storyboard');
    setPlaybackMode(preferredMode === 'mp4' && !animatedReel ? 'storyboard' : preferredMode);

    const startScene = initialSceneId
      ? scenes.find((s) => s.id === initialSceneId)
      : scenes[0];
    setCurrentTimeSec(startScene ? startScene.startSec : 0);
    setIsPlaying(true);
  }, [isOpen, initialSceneId, initialMode, animatedReel, scenes]);

  const activeScene = findActiveSceneAtTime(scenes, currentTimeSec);
  const activeClip = resolveClipForScene(activeScene, projectClips, threeClips);

  useEffect(() => {
    if (!isOpen || !isPlaying || playbackMode !== 'storyboard') return;
    const interval = window.setInterval(() => {
      setCurrentTimeSec((prev) => {
        if (prev + 0.1 >= totalDurationSec) {
          setIsPlaying(false);
          return totalDurationSec;
        }
        return Number((prev + 0.1).toFixed(2));
      });
    }, 100);
    return () => window.clearInterval(interval);
  }, [isOpen, isPlaying, playbackMode, totalDurationSec]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !voiceoverAudioUrl || !isOpen || playbackMode !== 'storyboard') {
      if (audio) audio.pause();
      return;
    }
    audio.muted = isMuted;
    if (isPlaying && !isMuted) {
      if (Math.abs(audio.currentTime - currentTimeSec) > 0.8) {
        audio.currentTime = Math.min(currentTimeSec, audio.duration || currentTimeSec);
      }
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, isMuted, voiceoverAudioUrl, isOpen, currentTimeSec, playbackMode]);

  useEffect(() => {
    const vid = videoRef.current;
    if (!vid || !activeClip || !isOpen || playbackMode !== 'storyboard') return;
    if (isPlaying) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [activeClip, isPlaying, isOpen, activeScene.id, playbackMode]);

  if (!isOpen) return null;

  const progressPct = Math.min(100, (currentTimeSec / Math.max(1, totalDurationSec)) * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`عارض مشاهد ${project.shortNameAr}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 md:p-8 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 text-white shadow-2xl">
        {/* Top Cinema Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="font-display text-sm font-bold text-white">NoesisAI</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="text-xs text-slate-300">
              {playbackMode === 'mp4' && animatedReel
                ? `المقاطع المتحركة المجمّعة (${animatedReel.clipCount} مشاهد · 1080p · 30fps)`
                : `${activeScene.code} من ${scenes.length} — ${activeScene.titleAr}`}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {animatedReel && (
              <div
                role="group"
                aria-label="وضع العرض"
                className="flex items-center gap-1 rounded-lg bg-slate-800 p-1"
              >
                <button
                  type="button"
                  onClick={() => setPlaybackMode('mp4')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    playbackMode === 'mp4'
                      ? 'bg-[#2E5332] text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  المقاطع المجمّعة
                </button>
                <button
                  type="button"
                  onClick={() => setPlaybackMode('storyboard')}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    playbackMode === 'storyboard'
                      ? 'bg-[#2E5332] text-white'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  عرض لوحة المشاهد
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق العارض"
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* 16:9 Stage */}
        {playbackMode === 'mp4' && animatedReel ? (
          <div className="relative aspect-video w-full overflow-hidden bg-black">
            <video
              key={animatedReel.videoUrl}
              src={animatedReel.videoUrl}
              controls
              autoPlay
              muted
              playsInline
              className="h-full w-full object-contain bg-black"
            />
          </div>
        ) : (
          <div className="relative aspect-video w-full overflow-hidden bg-black">
            {activeClip ? (
              <video
                ref={videoRef}
                key={activeClip.videoUrl}
                src={activeClip.videoUrl}
                muted
                loop
                playsInline
                className="h-full w-full object-cover"
              />
            ) : (
              <img
                key={`${project.id}-${activeScene.id}`}
                src={sceneAssets[activeScene.id]}
                alt={activeScene.titleAr}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            )}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
            />

            <div
              dir="ltr"
              className="absolute top-4 left-4 rounded-md bg-black/60 px-2.5 py-1 text-xs font-mono-tabular text-slate-200 backdrop-blur-xs"
            >
              {activeScene.code} · {activeScene.durationSec}s
              {activeClip
                ? ` · True 3D MP4 (${activeClip.resolution} · ${activeClip.fps || 30}fps)`
                : ' · Clean 1080p Keyframe (Grok Ready)'}
            </div>

            <div className="absolute inset-x-0 bottom-4 px-6 md:px-12 flex flex-col items-center gap-1 text-center">
              <p className="max-w-3xl text-sm md:text-base font-medium text-emerald-200 leading-relaxed">
                {activeScene.titleAr}
              </p>
              <p className="max-w-2xl text-xs text-slate-300">
                {activeScene.conceptAr}
              </p>
            </div>
          </div>
        )}

        {voiceoverAudioUrl && <audio ref={audioRef} src={voiceoverAudioUrl} preload="auto" />}

        {/* Timeline & Download Footer */}
        <div className="flex flex-col gap-3 bg-slate-950 px-5 py-4">
          {playbackMode === 'storyboard' && (
            <>
              <div dir="ltr" className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {scenes.map((scene) => {
                  const isCurrent = scene.id === activeScene.id;
                  const hasMp4 = Boolean(resolveClipForScene(scene, projectClips, threeClips));
                  return (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() => setCurrentTimeSec(scene.startSec)}
                      className={`shrink-0 min-w-[60px] rounded-md px-2 py-1.5 text-center transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-[#2E5332] text-white'
                          : hasMp4
                            ? 'bg-emerald-950/70 text-emerald-300 hover:bg-emerald-900/70'
                            : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-[11px] font-mono-tabular font-semibold">
                        {scene.code}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div dir="ltr" className="flex items-center gap-3">
                <span className="font-mono-tabular text-xs text-slate-300 w-10 text-right">
                  {formatTimecode(currentTimeSec)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={totalDurationSec}
                  step={0.5}
                  value={currentTimeSec}
                  aria-label="شريط التقدم الزمني"
                  onChange={(e) => setCurrentTimeSec(Number(e.target.value))}
                  className="h-1.5 flex-1 cursor-pointer accent-[#4B8B52]"
                  style={{
                    background: `linear-gradient(to right, #4B8B52 ${progressPct}%, #334155 ${progressPct}%)`,
                  }}
                />
                <span className="font-mono-tabular text-xs text-slate-400 w-10">
                  {formatTimecode(totalDurationSec)}
                </span>
              </div>
            </>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {playbackMode === 'storyboard' ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (currentTimeSec >= totalDurationSec) {
                      setCurrentTimeSec(0);
                    }
                    setIsPlaying((p) => !p);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#2E5332] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3A683F] transition-colors cursor-pointer"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4" aria-hidden="true" />
                      <span>إيقاف مؤقت</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                      <span>تشغيل</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentTimeSec(0);
                    setIsPlaying(true);
                  }}
                  aria-label="إعادة التشغيل من البداية"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>من البداية</span>
                </button>

                {voiceoverAudioUrl && (
                  <button
                    type="button"
                    onClick={() => setIsMuted((m) => !m)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs text-slate-200 hover:bg-white/10 cursor-pointer"
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Volume2 className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>{isMuted ? 'صامت (الافتراضي)' : 'مع الصوت المرجعي'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-300 tabular-nums">
                <span>H.264 MP4 (Silent)</span>
                <span aria-hidden="true">·</span>
                <span dir="ltr" className="font-mono-tabular">
                  {animatedReel?.resolution || '1080p'} · {animatedReel?.fps || 30}fps
                </span>
                {animatedReel?.fileSizeBytes ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span dir="ltr" className="font-mono-tabular">
                      {formatFileSize(animatedReel.fileSizeBytes)}
                    </span>
                  </>
                ) : null}
              </div>
            )}

            <div className="flex items-center gap-2">
              {generatedCount > 0 && (
                <button
                  type="button"
                  disabled={isCompilingReel}
                  onClick={onCompileReel}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isCompilingReel ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Film className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                  <span>{isCompilingReel ? 'جاري التجميع...' : 'تجميع المقاطع المتحركة'}</span>
                </button>
              )}

              {animatedReel && (
                <button
                  type="button"
                  disabled={isDownloadingReel}
                  onClick={async () => {
                    setIsDownloadingReel(true);
                    try {
                      await downloadRemoteFileViaBlob(
                        animatedReel.videoUrl,
                        'NoesisAI_Animated_Reel_1080p_30fps.mp4',
                      );
                    } finally {
                      setIsDownloadingReel(false);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold text-white hover:bg-white/10 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {isDownloadingReel ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Download className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span>تنزيل المجمّع MP4</span>
                </button>
              )}

              <button
                type="button"
                disabled={isDownloadingZip}
                onClick={async () => {
                  setIsDownloadingZip(true);
                  try {
                    await buildAndDownloadProjectZipInBrowser({
                      scope: project.id,
                      projectClips,
                      threeClips,
                      includePngs: true,
                    });
                  } finally {
                    setIsDownloadingZip(false);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2E5332] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3A683F] disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isDownloadingZip ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Archive className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{isDownloadingZip ? 'جاري التجهيز...' : 'تحميل الحزمة (ZIP)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
