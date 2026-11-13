import React from 'react';
import { Film, Image as ImageIcon } from 'lucide-react';
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
  const paddedNum = String(scene.id).padStart(2, '0');

  return (
    <button
      type="button"
      onClick={() => onSelect(scene.id)}
      aria-pressed={isSelected}
      aria-label={`المشهد ${paddedNum}: ${scene.titleAr}`}
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
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />

        {/* Scrim & Minimal Top-Right Index / Video Status */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
        />

        <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between text-[11px] font-medium text-white">
          <span dir="ltr" className="font-mono-tabular tracking-wide">
            {paddedNum} · {scene.timeRange}
          </span>
          <span className="inline-flex items-center gap-1">
            {isGenerating ? (
              <span>جاري التوليد...</span>
            ) : generatedClip ? (
              <>
                <Film className="h-3.5 w-3.5" aria-hidden="true" />
                <span>MP4 جاهز</span>
              </>
            ) : (
              <>
                <ImageIcon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{scene.visualSource === 'figma_ui' ? 'واجهة Figma' : 'مشهد 3D'}</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Card Body with Zero-Pill Metadata */}
      <div className="flex flex-1 flex-col justify-between p-4 gap-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>{scene.categoryLabelAr}</span>
            {scene.keyMetricBadge && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums text-slate-600">{scene.keyMetricBadge}</span>
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
            {isSelected ? 'قيد التحرير' : 'فتح المحرر'}
          </span>
        </div>
      </div>
    </button>
  );
};
