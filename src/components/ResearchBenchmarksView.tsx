import React from 'react';
import {
  EDGE_RUNTIME_STATS,
  MEDICAL_STANDARDS,
  MODEL_BENCHMARKS,
} from '../data/noesisProjectData';

export const ResearchBenchmarksView: React.FC = () => {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          الأرقام الرسمية والمعايير الهندسية والطبية (NoesisAI)
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm text-slate-600 leading-relaxed">
          المرجع الموثق من مستند التقييم والتجارب العلمية (الفصل الرابع والملخص التنفيذي) لضمان دقة الأرقام المذكورة في التعليق الصوتي والترجمة والمشاهد.
        </p>
        <p className="mt-2 max-w-3xl rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-600 leading-relaxed">
          ملاحظة التوثيق: الأرقام الرسمية المعتمدة في الإعلان هي نتائج التحقق النهائي في الفصل الرابع (ViT بنسبة <span dir="ltr" className="font-mono-tabular font-semibold text-slate-900">91.66%</span> وزمن <span dir="ltr" className="font-mono-tabular font-semibold text-slate-900">8.37 ms</span>، وVGG-Face بنسبة <span dir="ltr" className="font-mono-tabular font-semibold text-slate-900">89.09%</span>)، وليست أرقام المحاكاة الأولية في الفصل الثالث (<span dir="ltr" className="font-mono-tabular">91.72% / 87.18%</span>).
        </p>
      </div>

      {/* Edge Performance Stats Grid */}
      <section aria-labelledby="edge-stats-heading">
        <h2 id="edge-stats-heading" className="text-base font-bold text-slate-900 mb-3">
          مؤشرات الأداء التشغيلي على الحوسبة الطرفية (Raspberry Pi)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EDGE_RUNTIME_STATS.map((stat) => (
            <div
              key={stat.labelAr}
              className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between gap-2"
            >
              <span className="text-xs font-medium text-slate-500">{stat.labelAr}</span>
              <span dir="ltr" className="font-mono-tabular text-2xl font-bold text-[#2E5332] text-right">
                {stat.value}
              </span>
              <span className="text-xs text-slate-600">{stat.detailAr}</span>
            </div>
          ))}
        </div>
      </section>

      {/* AI Model Benchmarks Table */}
      <section aria-labelledby="benchmarks-table-heading">
        <h2 id="benchmarks-table-heading" className="text-base font-bold text-slate-900 mb-3">
          مقارنة نماذج التعرف على تعابير الوجه (FER) والتحقق من الهوية (FV)
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">المهمة</th>
                <th className="px-4 py-3 font-semibold">النموذج</th>
                <th className="px-4 py-3 font-semibold">مجموعة البيانات</th>
                <th className="px-4 py-3 font-semibold">الدقة الكلية</th>
                <th className="px-4 py-3 font-semibold">المؤشر المساعد</th>
                <th className="px-4 py-3 font-semibold">زمن الاستدلال</th>
                <th className="px-4 py-3 font-semibold">الاعتماد</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MODEL_BENCHMARKS.map((row) => (
                <tr
                  key={row.modelName}
                  className={row.selected ? 'bg-[#2E5332]/[0.04]' : 'hover:bg-slate-50/70'}
                >
                  <td className="px-4 py-3 font-mono-tabular font-semibold text-slate-700">
                    {row.task}
                  </td>
                  <td className="px-4 py-3">
                    <div dir="ltr" className="font-display font-semibold text-slate-900 text-right">
                      {row.modelName}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-500">{row.notesAr}</div>
                  </td>
                  <td dir="ltr" className="px-4 py-3 font-display text-slate-600 text-right">
                    {row.dataset}
                  </td>
                  <td dir="ltr" className="px-4 py-3 font-mono-tabular font-bold text-slate-900 text-right">
                    {row.accuracy}
                  </td>
                  <td dir="ltr" className="px-4 py-3 font-mono-tabular text-slate-700 text-right">
                    <span className="text-slate-500">{row.secondaryMetricLabel}: </span>
                    {row.secondaryMetricValue}
                  </td>
                  <td dir="ltr" className="px-4 py-3 font-mono-tabular text-slate-800 text-right">
                    {row.inferenceTimeMs}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {row.selected ? (
                      <span className="text-[#2E5332]">معتمد في النظام</span>
                    ) : (
                      <span className="text-slate-400">نموذج مقارنة</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Medical & Engineering Standards */}
      <section aria-labelledby="standards-heading">
        <h2 id="standards-heading" className="text-base font-bold text-slate-900 mb-3">
          المعايير الطبية والهندسية والأمنية المعتمدة
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MEDICAL_STANDARDS.map((std) => (
            <div
              key={std.code}
              className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span dir="ltr" className="font-mono-tabular text-sm font-bold text-[#2E5332]">
                  {std.code}
                </span>
                <span dir="ltr" className="font-display text-[11px] text-slate-500">{std.titleEn}</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{std.titleAr}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{std.scopeAr}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
