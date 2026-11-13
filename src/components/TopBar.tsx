import React from 'react';
import { Play } from 'lucide-react';

export type StudioTab = 'storyboard' | 'style-guide' | 'benchmarks' | 'voiceover';

interface TopBarProps {
  activeTab: StudioTab;
  onSelectTab: (tab: StudioTab) => void;
  onOpenCinemaPlayer: () => void;
}

const NAV_ITEMS: Array<{ id: StudioTab; label: string }> = [
  { id: 'storyboard', label: 'لوحة المشاهد' },
  { id: 'style-guide', label: 'دليل الهوية' },
  { id: 'benchmarks', label: 'المعايير والنتائج' },
  { id: 'voiceover', label: 'التعليق والترجمة' },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenCinemaPlayer,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#storyboard"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('storyboard');
          }}
          className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2E5332]"
        >
          NoesisAI Studio
        </a>

        {/* Zone 2: 4 concise single-line nav links */}
        <nav aria-label="التنقل الرئيسي" className="hidden md:flex items-center gap-6">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-1 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2E5332] ${
                  isActive
                    ? 'text-[#2E5332] font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[15px] h-0.5 bg-[#2E5332]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary CTA action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onOpenCinemaPlayer}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2E5332] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#234126] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2E5332]"
          >
            <Play className="h-4 w-4 fill-current" aria-hidden="true" />
            <span>تشغيل البرومو الكامل</span>
          </button>
        </div>
      </div>

      {/* Mobile navigation row */}
      <nav
        aria-label="التنقل على الجوال"
        className="flex md:hidden items-center gap-4 overflow-x-auto border-t border-slate-100 px-4 py-2"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`text-xs font-medium py-1 px-2 rounded-md whitespace-nowrap shrink-0 cursor-pointer ${
                isActive ? 'bg-[#2E5332]/10 text-[#2E5332] font-semibold' : 'text-slate-600'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
