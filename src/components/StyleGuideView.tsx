import React, { useState } from 'react';
import { Check, Copy, Download, Loader2 } from 'lucide-react';
import { FIGMA_REFERENCE_SCREENS, MASTER_STYLE_GUIDE } from '../data/noesisProjectData';
import { PROJECT_SCENE_VISUAL_ASSETS } from '../data/sceneAssets';
import { downloadRemoteFileViaBlob } from '../utils/browserDownload';

export const StyleGuideView: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [downloadingFigma, setDownloadingFigma] = useState<string | null>(null);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleDownloadFigmaPng = async (code: string, imagePath: string, filename: string) => {
    if (downloadingFigma) return;
    setDownloadingFigma(code);
    try {
      await downloadRemoteFileViaBlob(imagePath, filename);
    } finally {
      setDownloadingFigma(null);
    }
  };

  const pillars = [
    {
      id: 'clinic',
      titleAr: 'مرجع العيادة الواقعية والهاردوير (Master Environment)',
      summaryAr: MASTER_STYLE_GUIDE.clinicSummaryAr,
      promptEn: MASTER_STYLE_GUIDE.clinicPrompt,
      previewImg: PROJECT_SCENE_VISUAL_ASSETS.project1[4],
    },
    {
      id: 'doctor',
      titleAr: 'مرجع شخصية د. سالم (Photorealistic Reference)',
      summaryAr: MASTER_STYLE_GUIDE.doctorSummaryAr,
      promptEn: MASTER_STYLE_GUIDE.doctorPrompt,
      previewImg: PROJECT_SCENE_VISUAL_ASSETS.project1[7],
    },
    {
      id: 'patient',
      titleAr: 'مرجع شخصية نورة (Photorealistic Reference)',
      summaryAr: MASTER_STYLE_GUIDE.patientSummaryAr,
      promptEn: MASTER_STYLE_GUIDE.patientPrompt,
      previewImg: PROJECT_SCENE_VISUAL_ASSETS.project1[10],
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="style-guide-heading">
        <div className="mb-5">
          <h1 id="style-guide-heading" className="text-2xl font-bold text-slate-900">
            الهوية الواقعية ومرجع الشخصيات (Photorealistic Reference)
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm text-slate-600 leading-relaxed">
            صور فوتوغرافية سينمائية حقيقية متناسقة 100% عبر جميع مشاهد المشروعين (26 صورة واقعية مترابطة) لتثبيت ملامح د. سالم والمريضة نورة والعيادة وجهاز Raspberry Pi 5 عند الرفع إلى Grok Image-to-Video مع الصوت العربي.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {pillars.map((pillar) => (
            <article
              key={pillar.id}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="aspect-video w-full overflow-hidden bg-slate-100 border-b border-slate-100">
                <img
                  src={pillar.previewImg}
                  alt={pillar.titleAr}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between p-5 gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">{pillar.titleAr}</h2>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{pillar.summaryAr}</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-semibold text-slate-500">
                      Character & Style Lock
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(pillar.id, pillar.promptEn)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#2E5332] hover:underline cursor-pointer"
                    >
                      {copiedId === pillar.id ? (
                        <>
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>تم النسخ</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>نسخ النص</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p dir="ltr" className="text-xs font-display text-slate-700 leading-relaxed">
                    {pillar.promptEn}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="figma-plates-heading" className="border-t border-slate-200 pt-8">
        <div className="mb-5">
          <h2 id="figma-plates-heading" className="text-xl font-bold text-slate-900">
            شاشات Figma المقصوصة والنظيفة (1080p PNG جاهزة لـ CapCut)
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            تم قصّ جميع اللقطات الخمس بدقة 1920×1080 لإزالة شريط Chrome وشريط Figma الجانبي بالكامل — ومُدرجة تلقائياً داخل ملفات الـ ZIP.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FIGMA_REFERENCE_SCREENS.map((screen) => (
            <div
              key={screen.id}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="aspect-video w-full overflow-hidden bg-slate-50 border-b border-slate-100">
                <img
                  src={screen.imagePath}
                  alt={screen.titleAr}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="flex flex-1 flex-col justify-between p-4 gap-3">
                <div>
                  <div dir="ltr" className="text-xs font-mono-tabular text-slate-500 text-right">
                    {screen.code} · 1920×1080 PNG · Clean Crop
                  </div>
                  <h3 className="mt-1 text-sm font-bold text-slate-900">{screen.titleAr}</h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">{screen.conceptAr}</p>
                </div>

                <button
                  type="button"
                  disabled={Boolean(downloadingFigma)}
                  onClick={() =>
                    handleDownloadFigmaPng(screen.code, screen.imagePath, screen.filename)
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-100 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {downloadingFigma === screen.code ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Download className="h-3.5 w-3.5 text-[#2E5332]" aria-hidden="true" />
                  )}
                  <span>تنزيل {screen.code} (1080p PNG)</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
