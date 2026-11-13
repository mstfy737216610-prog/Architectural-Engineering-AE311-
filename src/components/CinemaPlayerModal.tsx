import React, { useEffect, useRef, useState } from 'react';
import {
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
import {
  CAPCUT_SUBTITLES,
  PROMO_SCENES,
} from '../data/noesisProjectData';
import { SCENE_VISUAL_ASSETS } from '../data/sceneAssets';
import {
  findActiveSceneAtTime,
  findActiveSubtitleAtTime,
  formatFileSize,
  formatTimecode,
  getDownloadHref,
  type FullPromoMeta,
  type GeneratedClipRecord,
} from '../utils/promoStudio';

interface CinemaPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  generatedClips: Record<number, GeneratedClipRecord>;
  voiceoverAudioUrl: string | null;
  fullPromo: FullPromoMeta | null;
  isExportingFull: boolean;
  onExportFull: () => Promise<void>;
  initialSceneId?: number;
  initialMode?: 'mp4' | 'storyboard';
}

const TOTAL_DURATION_SEC = 90;

export const CinemaPlayerModal: React.FC<CinemaPlayerModalProps> = ({
  isOpen,
  onClose,
  generatedClips,
  voiceoverAudioUrl,
  fullPromo,
  isExportingFull,
  onExportFull,
  initialSceneId,
  initialMode,
}) => {
  const [playbackMode, setPlaybackMode] = useState<'mp4' | 'storyboard'>('storyboard');
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      return;
    }
    const preferredMode =
      initialMode ?? (fullPromo && !initialSceneId ? 'mp4' : 'storyboard');
    setPlaybackMode(preferredMode === 'mp4' && !fullPromo ? 'storyboard' : preferredMode);

    const startScene = initialSceneId
      ? PROMO_SCENES.find((s) => s.id === initialSceneId)
      : PROMO_SCENES[0];
    setCurrentTimeSec(startScene ? startScene.startSec : 0);
    setIsPlaying(true);
  }, [isOpen, initialSceneId, initialMode, fullPromo]);

  const activeScene = findActiveSceneAtTime(PROMO_SCENES, currentTimeSec);
  const activeSubtitle = findActiveSubtitleAtTime(CAPCUT_SUBTITLES, currentTimeSec);
  const activeClip = generatedClips[activeScene.id];

  // Advance master promo clock every 100ms while playing in storyboard mode
  useEffect(() => {
    if (!isOpen || !isPlaying || playbackMode !== 'storyboard') return;
    const interval = window.setInterval(() => {
      setCurrentTimeSec((prev) => {
        if (prev + 0.1 >= TOTAL_DURATION_SEC) {
          setIsPlaying(false);
          return TOTAL_DURATION_SEC;
        }
        return Number((prev + 0.1).toFixed(2));
      });
    }, 100);
    return () => window.clearInterval(interval);
  }, [isOpen, isPlaying, playbackMode]);

  // Sync generated WAV voiceover track in storyboard mode if available
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !voiceoverAudioUrl || !isOpen || playbackMode !== 'storyboard') {
      if (audio) audio.pause();
      return;
    }
    audio.muted = isMuted;
    if (isPlaying) {
      if (Math.abs(audio.currentTime - currentTimeSec) > 0.8) {
        audio.currentTime = Math.min(currentTimeSec, audio.duration || currentTimeSec);
      }
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, isMuted, voiceoverAudioUrl, isOpen, currentTimeSec, playbackMode]);

  // Sync active MP4 clip playback if the active scene has a generated clip in storyboard mode
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

  const progressPct = Math.min(100, (currentTimeSec / TOTAL_DURATION_SEC) * 100);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="عارض البرومو الكامل لمشروع NoesisAI"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 md:p-8 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 text-white shadow-2xl">
        {/* Top Cinema Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="font-display text-sm font-bold text-white">NoesisAI</span>
            <span aria-hidden="true" className="text-slate-500">·</span>
            <span className="text-xs text-slate-300">
              {playbackMode === 'mp4' && fullPromo
                ? 'ملف البرومو الكامل الجاهز للتحميل (MP4 · 1:30)'
                : `المشهد ${String(activeScene.id).padStart(2, '0')} من 12 — ${activeScene.titleAr}`}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {fullPromo && (
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
                  ملف MP4 النهائي
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
                  المعاينة التفاعلية
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
        {playbackMode === 'mp4' && fullPromo ? (
          <div className="relative aspect-video w-full overflow-hidden bg-black">
            <video
              key={fullPromo.videoUrl}
              src={fullPromo.videoUrl}
              controls
              autoPlay
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
                key={activeScene.id}
                src={SCENE_VISUAL_ASSETS[activeScene.id]}
                alt={activeScene.titleAr}
                referrerPolicy="no-referrer"
                className={`h-full w-full object-cover ${isPlaying ? 'animate-ken-burns' : ''}`}
              />
            )}

            {/* Scene 7 / Scene 10 subtle biometric scan overlay when previewing keyframe */}
            {!activeClip && (activeScene.id === 7 || activeScene.id === 10) && isPlaying && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-transparent via-emerald-400/20 to-transparent animate-scan-sweep"
              />
            )}

            {/* Measured contrast scrim for subtitles */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/85 via-black/45 to-transparent"
            />

            {/* Top-left subtle scene timing badge */}
            <div
              dir="ltr"
              className="absolute top-4 left-4 rounded-md bg-black/55 px-2.5 py-1 text-xs font-mono-tabular text-slate-200 backdrop-blur-xs"
            >
              {activeScene.code} · {activeScene.timeRange}
              {activeClip ? ' · Omni Flash MP4' : ' · Storyboard Animatic'}
            </div>

            {/* English Subtitle & Arabic Voiceover Overlay */}
            <div className="absolute inset-x-0 bottom-4 px-6 md:px-12 flex flex-col items-center gap-2 text-center">
              <p className="max-w-3xl text-sm md:text-base font-medium text-emerald-200 leading-relaxed">
                {activeScene.voiceoverSegmentAr}
              </p>
              {activeSubtitle && (
                <p
                  dir="ltr"
                  className="max-w-3xl rounded-md bg-black/60 px-3 py-1.5 text-xs md:text-sm font-display text-white/95 leading-snug"
                >
                  {activeSubtitle.textEn}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Hidden Voiceover Audio Element */}
        {voiceoverAudioUrl && <audio ref={audioRef} src={voiceoverAudioUrl} preload="auto" />}

        {/* Timeline & Download Footer */}
        <div className="flex flex-col gap-3 bg-slate-950 px-5 py-4">
          {playbackMode === 'storyboard' && (
            <>
              {/* Interactive Scene Markers Strip */}
              <div dir="ltr" className="flex items-center gap-1 overflow-x-auto pb-1">
                {PROMO_SCENES.map((scene) => {
                  const isCurrent = scene.id === activeScene.id;
                  const hasMp4 = Boolean(generatedClips[scene.id]);
                  return (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() => setCurrentTimeSec(scene.startSec)}
                      className={`flex-1 min-w-[54px] rounded-md px-2 py-1.5 text-center transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-[#2E5332] text-white'
                          : hasMp4
                            ? 'bg-emerald-950/70 text-emerald-300 hover:bg-emerald-900/70'
                            : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-[11px] font-mono-tabular font-semibold">
                        {String(scene.id).padStart(2, '0')}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Scrub Bar */}
              <div dir="ltr" className="flex items-center gap-3">
                <span className="font-mono-tabular text-xs text-slate-300 w-10 text-right">
                  {formatTimecode(currentTimeSec)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={TOTAL_DURATION_SEC}
                  step={0.5}
                  value={currentTimeSec}
                  aria-label="شريط التقدم الزمني للفيديو"
                  onChange={(e) => setCurrentTimeSec(Number(e.target.value))}
                  className="h-1.5 flex-1 cursor-pointer accent-[#4B8B52]"
                  style={{
                    background: `linear-gradient(to right, #4B8B52 ${progressPct}%, #334155 ${progressPct}%)`,
                  }}
                />
                <span className="font-mono-tabular text-xs text-slate-400 w-10">1:30</span>
              </div>
            </>
          )}

          {/* Transport & Direct MP4 Download Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {playbackMode === 'storyboard' ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (currentTimeSec >= TOTAL_DURATION_SEC) {
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
                    <span>{isMuted ? 'إلغاء الكتم' : 'الصوت نشط'}</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-300 tabular-nums">
                <span>H.264 MP4</span>
                <span aria-hidden="true">·</span>
                <span dir="ltr" className="font-mono-tabular">
                  {fullPromo?.aspectRatio || '16:9'}
                </span>
                {fullPromo?.fileSizeBytes ? (
                  <>
                    <span aria-hidden="true">·</span>
                    <span dir="ltr" className="font-mono-tabular">
                      {formatFileSize(fullPromo.fileSizeBytes)}
                    </span>
                  </>
                ) : null}
                <span aria-hidden="true">·</span>
                <span>{fullPromo?.aiClipsUsed || 0}/12 AI</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isExportingFull}
                onClick={onExportFull}
                className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {isExportingFull ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Film className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{isExportingFull ? 'جاري التصدير...' : 'إعادة تصدير MP4'}</span>
              </button>

              {fullPromo && (
                <a
                  href={getDownloadHref(fullPromo.videoUrl)}
                  download="NoesisAI-Promo-90s.mp4"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#2E5332] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3A683F] transition-colors"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  <span>تحميل الفيديو الكامل (MP4)</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
