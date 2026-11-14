import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  Loader2,
  Mic,
} from 'lucide-react';
import type { ProjectDefinition } from '../data/noesisProjectData';
import {
  buildProjectVoiceoverTxt,
  generateCapCutSrt,
} from '../utils/promoStudio';
import {
  downloadRemoteFileViaBlob,
  triggerBlobDownload,
} from '../utils/browserDownload';

interface VoiceoverSubtitlesViewProps {
  project: ProjectDefinition;
  voiceoverAudioUrl: string | null;
  onVoiceoverGenerated: (url: string) => void;
}

export const VoiceoverSubtitlesView: React.FC<VoiceoverSubtitlesViewProps> = ({
  project,
  voiceoverAudioUrl,
  onVoiceoverGenerated,
}) => {
  const [scriptText, setScriptText] = useState(project.voiceoverScriptAr);
  const [copiedScript, setCopiedScript] = useState(false);
  const [copiedSrt, setCopiedSrt] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  useEffect(() => {
    setScriptText(project.voiceoverScriptAr);
  }, [project]);

  const srtContent = generateCapCutSrt(project.subtitlesEn);

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(scriptText);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleDownloadVoiceoverTxt = () => {
    const content = buildProjectVoiceoverTxt({
      ...project,
      voiceoverScriptAr: scriptText,
    });
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    triggerBlobDownload(blob, `NoesisAI_${project.id}_Arabic_Voiceover.txt`);
  };

  const handleCopySrt = async () => {
    try {
      await navigator.clipboard.writeText(srtContent);
      setCopiedSrt(true);
      setTimeout(() => setCopiedSrt(false), 1800);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleDownloadSrt = () => {
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    triggerBlobDownload(blob, `NoesisAI_${project.id}_CapCut_EN.srt`);
  };

  const handleGenerateVoiceoverAudio = async () => {
    setIsGeneratingAudio(true);
    setAudioError(null);
    try {
      const response = await fetch('/api/voiceover/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scriptText }),
      });
      const data = (await response.json()) as { audioUrl?: string; error?: string };
      if (!response.ok || !data.audioUrl) {
        throw new Error(data.error || 'تعذر توليد التعليق الصوتي.');
      }
      onVoiceoverGenerated(data.audioUrl);
    } catch (err) {
      setAudioError(err instanceof Error ? err.message : 'حدث خطأ أثناء توليد الصوت.');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          التعليق الصوتي والترجمة — {project.shortNameAr}
        </h1>
        <p className="mt-1.5 max-w-3xl text-sm text-slate-600 leading-relaxed">
          {project.subtitleAr}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Arabic Voiceover Panel */}
        <section
          aria-labelledby="voiceover-heading"
          className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col gap-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="voiceover-heading" className="text-base font-bold text-slate-900">
              النص العربي للتعليق الصوتي ({project.totalDurationSec}s)
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyScript}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {copiedScript ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#2E5332]" aria-hidden="true" />
                    <span>تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>نسخ النص</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDownloadVoiceoverTxt}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-[#2E5332]" aria-hidden="true" />
                <span>تصدير .TXT</span>
              </button>
            </div>
          </div>

          <label htmlFor="arabic-voiceover-editor" className="sr-only">
            محرر النص العربي للتعليق الصوتي
          </label>
          <textarea
            id="arabic-voiceover-editor"
            rows={10}
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/70 p-3.5 text-sm text-slate-800 leading-loose focus:border-[#2E5332] focus:bg-white focus:outline-none"
          />

          {audioError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" aria-hidden="true" />
              <span>{audioError}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isGeneratingAudio || !scriptText.trim()}
              onClick={handleGenerateVoiceoverAudio}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
            >
              {isGeneratingAudio ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>جاري توليد الصوت...</span>
                </>
              ) : (
                <>
                  <Mic className="h-4 w-4 text-[#2E5332]" aria-hidden="true" />
                  <span>توليد صوت اختياري (يتطلب مفتاح API)</span>
                </>
              )}
            </button>

            {voiceoverAudioUrl && (
              <button
                type="button"
                onClick={() =>
                  downloadRemoteFileViaBlob(voiceoverAudioUrl, 'noesisai-arabic-voiceover.wav')
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
              >
                <Download className="h-4 w-4" aria-hidden="true" />
                <span>تنزيل WAV</span>
              </button>
            )}
          </div>

          {voiceoverAudioUrl && (
            <div className="pt-2 border-t border-slate-100">
              <audio controls src={voiceoverAudioUrl} className="w-full" />
            </div>
          )}

          {/* Scene-by-scene voiceover alignment */}
          <div className="pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 mb-2">
              توزيع التعليق على المشاهد ({project.scenes.length})
            </h3>
            <div className="flex flex-col divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {project.scenes.map((scene) => (
                <div key={scene.id} className="py-2 flex items-start gap-3 text-xs">
                  <span dir="ltr" className="font-mono-tabular text-slate-500 shrink-0">
                    {scene.code} · {scene.timeRange}
                  </span>
                  <span className="text-slate-700 leading-relaxed">
                    {scene.voiceoverSegmentAr}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* English CapCut Subtitles Panel */}
        <section
          aria-labelledby="subtitles-heading"
          className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col gap-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="subtitles-heading" className="text-base font-bold text-slate-900">
              الترجمة الإنجليزية (CapCut Subtitles .SRT)
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopySrt}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                {copiedSrt ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#2E5332]" aria-hidden="true" />
                    <span>تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>نسخ SRT</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleDownloadSrt}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2E5332] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#234126] cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>تصدير ملف .SRT</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
            {project.subtitlesEn.map((cue) => (
              <div key={cue.id} className="p-4 bg-white flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span dir="ltr" className="font-mono-tabular font-semibold text-[#2E5332]">
                    {cue.timeRange}
                  </span>
                  <span>المقطع {cue.id}</span>
                </div>
                <p dir="ltr" className="font-display text-sm text-slate-900 leading-relaxed">
                  {cue.textEn}
                </p>
                <p className="text-xs text-slate-500">{cue.textArHint}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
