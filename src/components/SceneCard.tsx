import React from 'react';
import { Film, Sparkles } from 'lucide-react';
import type { PromoScene } from '../data/noesisProjectData';
import type { GeneratedClipRecord } from '../utils/promoStudio';

interface SceneCardProps {
  scene: PromoScene;
  imageUrl: string;
  generatedClip?: GeneratedClipRecord;
  isSelected: boolean;
  isGenerating: boolean;
  onSelect: (sceneId: number) => void;
}

export const SceneCard: React.FC<SceneCardProps> = ({
  scene,
  imageUrl,
  generatedClip,
  isSelected,
  isGenerating,
  onSelect,
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(scene.id)}
      aria-pressed={isSelected}
      aria-label={`${scene.code}: ${scene.titleAr}`}
      className={`group flex flex-col text-right rounded-xl border bg-white overflow-hidden transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E5332] ${
        isSelected
          ? 'border-[#2E5332] ring-1 ring-[#2E5332]/30 shadow-sm'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* 16:9 Thumbnail Stage */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 border-b border-slate-100">
        <img
          src={imageUrl}
          alt={scene.titleAr}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="h-full w-full object-cover"
        />

        {/* Scrim & Minimal Bottom Metadata */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/70 via-black/30 to-transparent"
        />

        <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between text-[11px] font-medium text-white">
          <span dir="ltr" className="font-mono-tabular tracking-wide">
            {scene.code} · {scene.timeRange}
          </span>
          <span className="inline-flex items-center gap-1">
            {isGenerating ? (
              <span>جاري التحضير...</span>
            ) : generatedClip ? (
              <>
                <Film className="h-3.5 w-3.5 text-emerald-300" aria-hidden="true" />
                <span dir="ltr" className="font-mono-tabular">
                  {generatedClip.resolution} · {generatedClip.fps || 30}fps
                </span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-emerald-200" aria-hidden="true" />
                <span>{scene.threeTechSceneId ? 'جاهز للـ 3D' : 'جاهز لـ Grok'}</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Card Body with Zero-Pill Metadata */}
      <div className="flex flex-1 flex-col justify-between p-4 gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <span>{scene.categoryLabelAr}</span>
            <span aria-hidden="true">·</span>
            <span dir="ltr" className="tabular-nums text-slate-600 font-mono-tabular">
              {scene.durationSec}s · 1080p
            </span>
            {scene.figmaOverlayCode && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-[#2E5332]">
                  تركيب {scene.figmaOverlayCode}
                </span>
              </>
            )}
            {scene.lipSyncTargetAr && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-amber-700">Lip-Sync</span>
              </>
            )}
            {scene.isSilentMusicalBeat && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-slate-700">وقفة موسيقية</span>
              </>
            )}
          </div>
          <h3 className="mt-1 text-sm font-semibold text-slate-900 leading-snug">
            {scene.titleAr}
          </h3>
          <p className="mt-1 text-xs text-slate-600 line-clamp-2 leading-relaxed">
            {scene.conceptAr}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-display">{scene.titleEn}</span>
          <span className="font-semibold text-[#2E5332]">
            {isSelected ? 'قيد التحرير' : 'عرض البرومبت والصورة'}
          </span>
        </div>
      </div>
    </button>
  );
};
