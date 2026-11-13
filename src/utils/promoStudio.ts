import type {
  MasterStyleGuide,
  PromoScene,
  SceneCategory,
  SubtitleCue,
} from '../data/noesisProjectData';

export interface ParsedTimeRange {
  startSec: number;
  endSec: number;
  durationSec: number;
}

export interface GeneratedClipRecord {
  sceneId: number;
  videoUrl: string;
  downloadUrl?: string;
  interactionId: string;
  source?: 'omni_flash' | 'local_ffmpeg';
  aspectRatio: '16:9' | '9:16';
  duration: string;
  resolution: string;
  createdAt: string;
  promptUsed: string;
}

export interface FullPromoMeta {
  videoUrl: string;
  downloadUrl?: string;
  aspectRatio: '16:9' | '9:16';
  resolution?: '720p' | '1080p';
  durationSec: number;
  fileSizeBytes?: number;
  aiClipsUsed: number;
  hasVoiceover: boolean;
  hasSubtitles: boolean;
  createdAt: string;
}

export function getDownloadHref(videoUrl: string): string {
  const cleanUrl = videoUrl.split('?')[0] ?? '';
  const filename = cleanUrl.split('/').filter(Boolean).pop();
  if (!filename) return videoUrl;
  return `/api/videos/download/${encodeURIComponent(filename)}`;
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb < 1) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${mb.toFixed(1)} MB`;
}

export function parseTimestampToSeconds(timestamp: string): number {
  const parts = timestamp.trim().split(':').map((p) => Number(p));
  if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

export function parseTimeRange(range: string): ParsedTimeRange {
  const [startRaw, endRaw] = range.split('-').map((part) => part.trim());
  const startSec = parseTimestampToSeconds(startRaw || '0:00');
  const endSec = parseTimestampToSeconds(endRaw || startRaw || '0:00');
  return {
    startSec,
    endSec,
    durationSec: Math.max(0, endSec - startSec),
  };
}

export function formatTimecode(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatSrtTimestamp(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const hours = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = Math.floor(clamped % 60);
  const millis = Math.round((clamped - Math.floor(clamped)) * 1000);
  return `${hours.toString().padStart(2, '0')}:${mins
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')},${millis
    .toString()
    .padStart(3, '0')}`;
}

export function generateCapCutSrt(subtitles: SubtitleCue[]): string {
  return subtitles
    .map((cue, idx) => {
      const start = formatSrtTimestamp(cue.startSec);
      const end = formatSrtTimestamp(cue.endSec);
      return `${idx + 1}\n${start} --> ${end}\n${cue.textEn}`;
    })
    .join('\n\n')
    .concat('\n');
}

export function buildOmniPrompt(
  scene: Pick<PromoScene, 'characterAnchor' | 'imagePrompt' | 'motionPrompt'>,
  masterStyle: MasterStyleGuide,
  options: {
    includeMasterStyle?: boolean;
    customImagePrompt?: string;
    customMotionPrompt?: string;
  } = {},
): string {
  const includeMasterStyle = options.includeMasterStyle ?? true;
  const imgPrompt = (options.customImagePrompt ?? scene.imagePrompt).trim();
  const motPrompt = (options.customMotionPrompt ?? scene.motionPrompt).trim();

  const segments: string[] = [];

  if (includeMasterStyle) {
    if (scene.characterAnchor === 'clinic_doctor') {
      segments.push(`${masterStyle.clinicPrompt}. ${masterStyle.doctorPrompt}, ${imgPrompt}.`);
    } else if (scene.characterAnchor === 'clinic_patient') {
      segments.push(`${masterStyle.clinicPrompt}. ${masterStyle.patientPrompt}, ${imgPrompt}.`);
    } else {
      segments.push(imgPrompt);
    }
  } else {
    segments.push(imgPrompt);
  }

  if (motPrompt.length > 0) {
    segments.push(`Camera & Motion: ${motPrompt}.`);
  }

  return segments.join(' ').replace(/\s+/g, ' ').trim();
}

export function filterScenes(
  scenes: PromoScene[],
  query: string,
  category: SceneCategory | 'all',
): PromoScene[] {
  const normalizedQuery = query.trim().toLowerCase();
  return scenes.filter((scene) => {
    const matchesCategory = category === 'all' || scene.category === category;
    if (!matchesCategory) return false;
    if (!normalizedQuery) return true;
    return (
      scene.titleAr.toLowerCase().includes(normalizedQuery) ||
      scene.titleEn.toLowerCase().includes(normalizedQuery) ||
      scene.conceptAr.toLowerCase().includes(normalizedQuery) ||
      scene.code.toLowerCase().includes(normalizedQuery) ||
      scene.voiceoverSegmentAr.toLowerCase().includes(normalizedQuery) ||
      scene.imagePrompt.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function findActiveSceneAtTime(scenes: PromoScene[], currentTimeSec: number): PromoScene {
  if (scenes.length === 0) {
    throw new Error('Scenes list cannot be empty');
  }
  const found = scenes.find(
    (s) => currentTimeSec >= s.startSec && currentTimeSec < s.endSec,
  );
  if (found) return found;
  if (currentTimeSec >= scenes[scenes.length - 1].endSec) {
    return scenes[scenes.length - 1];
  }
  return scenes[0];
}

export function findActiveSubtitleAtTime(
  subtitles: SubtitleCue[],
  currentTimeSec: number,
): SubtitleCue | null {
  return (
    subtitles.find((sub) => currentTimeSec >= sub.startSec && currentTimeSec < sub.endSec) ??
    null
  );
}

export function calculateStudioStats(
  scenes: PromoScene[],
  generatedClips: Record<number, GeneratedClipRecord>,
) {
  const totalScenes = scenes.length;
  const generatedCount = scenes.filter((s) => Boolean(generatedClips[s.id])).length;
  const totalDurationSec = scenes.reduce((maxEnd, s) => Math.max(maxEnd, s.endSec), 0);
  const completionPct =
    totalScenes === 0 ? 0 : Math.round((generatedCount / totalScenes) * 100);

  return {
    totalScenes,
    generatedCount,
    totalDurationSec,
    completionPct,
  };
}
