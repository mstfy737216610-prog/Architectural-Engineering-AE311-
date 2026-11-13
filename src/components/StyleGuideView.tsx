import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { MASTER_STYLE_GUIDE, PROMO_SCENES } from '../data/noesisProjectData';
import { SCENE_VISUAL_ASSETS } from '../data/sceneAssets';

export const StyleGuideView: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  const pillars = [
    {
      id: 'clinic',
      titleAr: 'وصف العيادة الثابت (Master Environment)',
      summaryAr: MASTER_STYLE_GUIDE.clinicSummaryAr,
      promptEn: MASTER_STYLE_GUIDE.clinicPrompt,
      previewImg: SCENE_VISUAL_ASSETS[1],
    },
    {
      id: 'doctor',
      titleAr: 'شخصية الدكتور / الأخصائي النفسي',
      summaryAr: MASTER_STYLE_GUIDE.doctorSummaryAr,
      promptEn: MASTER_STYLE_GUIDE.doctorPrompt,
      previewImg: SCENE_VISUAL_ASSETS[7],
    },
    {
      id: 'patient',
      titleAr: 'شخصية المريضة',
      summaryAr: MASTER_STYLE_GUIDE.patientSummaryAr,
      promptEn: MASTER_STYLE_GUIDE.patientPrompt,
      previewImg: SCENE_VISUAL_ASSETS[9],
    },
  ];

  const figmaScenes = PROMO_SCENES.filter((s) => s.visualSource === 'figma_ui');

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="style-guide-heading">
        <div className="mb-5">
          <h1 id="style-guide-heading" className="text-2xl font-bold text-slate-900">
            الهوية البصرية والقالب الموحد (Master Style Guide)
          </h1>
          <p className="mt-1.5 max-w-3xl text-sm text-slate-600 leading-relaxed">
            قوالب الوصف الثابتة المعتمدة لضمان تطابق الإضاءة والألوان وملامح الشخصيات عبر جميع مشاهد الفيديو الـ 12 دون أي اختلاف.
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
                      Prompt Lock
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
            واجهات Figma المرجعية المرفقة (المشاهد 6، 8، 10، 11، 12)
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            تُمرر هذه اللقطات مباشرة إلى نموذج gemini-omni-1.2-flash في وضع Image-to-Video لتحريك الواجهة الفعلية للنظام.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {figmaScenes.map((scene) => (
            <div
              key={scene.id}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <div className="aspect-video w-full overflow-hidden bg-slate-100 border-b border-slate-100">
                <img
                  src={SCENE_VISUAL_ASSETS[scene.id]}
                  alt={scene.titleAr}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-4">
                <div dir="ltr" className="text-xs font-mono-tabular text-slate-500 text-right">
                  {scene.code} · {scene.timeRange}
                </div>
                <h3 className="mt-1 text-sm font-bold text-slate-900">{scene.titleAr}</h3>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">{scene.conceptAr}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
