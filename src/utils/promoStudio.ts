import type {
  MasterStyleGuide,
  ProjectDefinition,
  ProjectId,
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
  projectId?: ProjectId;
  threeTechSceneId?: 3 | 4 | 5;
  videoUrl: string;
  downloadUrl?: string;
  interactionId: string;
  source: 'omni_flash' | 'threejs_3d';
  modelUsed?: string;
  aspectRatio: '16:9' | '9:16';
  duration: string;
  resolution: string;
  width?: number;
  height?: number;
  fps?: number;
  durationSec?: number;
  hasAudio?: boolean;
  fileSizeBytes?: number;
  lipSyncEnabled?: boolean;
  characterReferenceUsed?: boolean;
  createdAt: string;
  promptUsed: string;
}

export interface AnimatedReelMeta {
  videoUrl: string;
  downloadUrl: string;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  fps: number;
  durationSec: number;
  fileSizeBytes: number;
  clipCount: number;
  hasAudio: boolean;
  createdAt: string;
}

export function getSceneStorageKey(projectId: ProjectId, sceneId: number): string {
  return `${projectId}:${sceneId}`;
}

export function resolveClipForScene(
  scene: Pick<PromoScene, 'id' | 'projectId' | 'threeTechSceneId'>,
  projectClips: Record<string, GeneratedClipRecord>,
  threeClips: Record<number, GeneratedClipRecord> = {},
): GeneratedClipRecord | undefined {
  const direct = projectClips[getSceneStorageKey(scene.projectId, scene.id)];
  if (direct) return direct;
  if (scene.threeTechSceneId && threeClips[scene.threeTechSceneId]) {
    return threeClips[scene.threeTechSceneId];
  }
  return undefined;
}

export function getDownloadHref(videoUrl: string): string {
  const cleanUrl = videoUrl.split('?')[0] ?? '';
  const filename = cleanUrl.split('/').filter(Boolean).pop();
  if (!filename) return videoUrl;
  return `/api/videos/download/${encodeURIComponent(filename)}`;
}

export function getZipDownloadHref(includePngs = true): string {
  return `/api/videos/download-all-zip?includePngs=${includePngs ? '1' : '0'}`;
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

export interface BuildOmniPromptOptions {
  includeMasterStyle?: boolean;
  enableLipSync?: boolean;
  includeArabicAudio?: boolean;
  customImagePrompt?: string;
  customMotionPrompt?: string;
}

export function buildOmniPrompt(
  scene: Pick<
    PromoScene,
    | 'characterAnchor'
    | 'imagePrompt'
    | 'motionPrompt'
    | 'lipSyncTargetAr'
    | 'voiceoverSegmentAr'
    | 'isSilentMusicalBeat'
  >,
  masterStyle: MasterStyleGuide,
  options: BuildOmniPromptOptions = {},
): string {
  const includeMasterStyle = options.includeMasterStyle ?? true;
  const enableLipSync = options.enableLipSync ?? Boolean(scene.lipSyncTargetAr);
  const includeArabicAudio = options.includeArabicAudio ?? true;
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
    segments.push(`True Live-Action Motion & Camera: ${motPrompt}`);
  }

  if (
    enableLipSync &&
    scene.lipSyncTargetAr &&
    (scene.characterAnchor === 'clinic_doctor' || scene.characterAnchor === 'clinic_patient')
  ) {
    segments.push(
      `Lip-Sync Articulation: synchronize natural Arabic mouth, jaw, and lip viseme movements smoothly with the spoken Arabic line ("${scene.lipSyncTargetAr}") while keeping facial identity locked.`,
    );
  }

  if (includeArabicAudio) {
    if (scene.isSilentMusicalBeat) {
      segments.push(
        'Native Arabic Audio Direction: warm emotional cinematic piano & subtle strings underscore swelling gently with soft authentic room tone, no spoken dialogue.',
      );
    } else if (scene.lipSyncTargetAr) {
      segments.push(
        `Native Arabic Audio & Speech: realistic calm Arabic female voice (Saudi Modern Standard Arabic, warm sincere tone) speaking directly on camera: "${scene.lipSyncTargetAr}" over soft natural clinic ambience.`,
      );
    } else if (scene.voiceoverSegmentAr) {
      segments.push(
        `Native Arabic Audio & Voiceover: calm, authoritative Saudi-accented Modern Standard Arabic documentary narrator speaking clearly at natural pacing: "${scene.voiceoverSegmentAr}" blended softly over subtle realistic clinic ambience.`,
      );
    }
  }

  const audioConstraint = includeArabicAudio
    ? 'clear synchronized Arabic audio'
    : 'silent output';

  segments.push(
    `Strict Constraints: photorealistic live-action 35mm cinema motion only (never static-image zoom/pan, zero cartoon/3D-animated style), natural 1x speed, zero camera jitter, ${audioConstraint}, strictly no on-screen text, no numbers, no UI screens, no subtitles.`,
  );

  return segments.join(' ').replace(/\s+/g, ' ').trim();
}

export function buildGrokScenePrompt(
  scene: PromoScene,
  masterStyle: MasterStyleGuide,
  options: BuildOmniPromptOptions = {},
): string {
  const basePrompt = buildOmniPrompt(scene, masterStyle, {
    includeArabicAudio: options.includeArabicAudio ?? true,
    ...options,
  });
  const figmaNote = scene.figmaOverlayCode
    ? ` Keep monitor/overlay area clean & blank for CapCut ${scene.figmaOverlayCode} overlay.`
    : '';
  return `${basePrompt}${figmaNote}`.trim();
}

export function buildProjectGrokPackText(
  project: ProjectDefinition,
  masterStyle: MasterStyleGuide,
): string {
  const lines: string[] = [
    '====================================================================',
    `NoesisAI — Grok Image-to-Video Complete Pack (Photorealistic + Arabic Audio)`,
    `${project.nameAr} (${project.scenes.length} Scenes · ${project.totalDurationSec}s)`,
    '====================================================================',
    '',
    '1) PHOTOREALISTIC CHARACTER & CLINIC LOCKS (ارفق صورة المرجع مع الصورة في Grok):',
    `- Clinic Cinematography: ${masterStyle.clinicPrompt}`,
    `- Dr. Salem (الأخصائي): ${masterStyle.doctorPrompt}`,
    `- Noura (المريضة): ${masterStyle.patientPrompt}`,
    '',
    '2) OFFICIAL THESIS NUMBERS (الأرقام المعتمدة من الرسالة — الفصل الرابع):',
    '- Emotion Recognition (FER): ViT 91.66% accuracy | 8.37 ms | Macro-F1 0.92 | ROC-AUC 0.98',
    '- Face Verification (FV): DeepFace VGG-Face 89.09% accuracy | 129.69 ms | TNR 0.99',
    '- Edge Scoring Speed: < 1.0 s | Peak RAM: 3.5 GB | Offline Raspberry Pi 5',
    '- Medical Standards: IEC 62304, ISO 14971, ISO/IEC 27001, IEC 62366-1, WCAG 2.1 AA, HL7 FHIR',
    '',
    '3) SCENE-BY-SCENE GROK PROMPTS WITH ARABIC AUDIO & CONTINUITY:',
    '--------------------------------------------------------------------',
  ];

  for (const scene of project.scenes) {
    const grokPrompt = buildGrokScenePrompt(scene, masterStyle, {
      includeMasterStyle: true,
      enableLipSync: Boolean(scene.lipSyncTargetAr),
      includeArabicAudio: true,
    });

    lines.push('');
    lines.push(`[${scene.code}] ${scene.titleAr} | ${scene.titleEn}`);
    lines.push(
      `Timecode: ${scene.timeRange} (${scene.durationSec}s) | Keyframe: ${scene.code}_1080p_reference.png`,
    );
    if (scene.figmaOverlayCode) {
      lines.push(
        `CapCut Figma UI Overlay: ${scene.figmaOverlayCode} (من مجلد 06_Figma_Clean_UI_1080p_PNG)`,
      );
    }
    if (scene.lipSyncTargetAr) {
      lines.push(`Lip-Sync Spoken Line (AR): «${scene.lipSyncTargetAr}»`);
    }
    if (scene.isSilentMusicalBeat) {
      lines.push(`Musical Direction: وقفة موسيقية بدون تعليق صوتي`);
    }
    lines.push(`Frame de raccord (نقطة الربط للمشهد التالي): ${scene.frameDeRaccordAr}`);
    lines.push(`Arabic Voiceover / Audio (مضمن في البرومبت): ${scene.voiceoverSegmentAr}`);
    lines.push('');
    lines.push('>>> GROK PROMPT WITH ARABIC AUDIO (انسخ والصق مباشرة في Grok):');
    lines.push(grokPrompt);
    lines.push('--------------------------------------------------------------------');
  }

  return `${lines.join('\n')}\n`;
}

export function buildProjectGrokPackJson(
  project: ProjectDefinition,
  masterStyle: MasterStyleGuide,
): string {
  const payload = {
    projectId: project.id,
    titleAr: project.nameAr,
    styleMode: 'photorealistic_live_action_1080p',
    includesArabicAudioInPrompt: true,
    totalDurationSec: project.totalDurationSec,
    sceneCount: project.scenes.length,
    characterLocks: {
      clinicEnvironment: masterStyle.clinicPrompt,
      drSalem: masterStyle.doctorPrompt,
      noura: masterStyle.patientPrompt,
    },
    scenes: project.scenes.map((scene) => ({
      id: scene.id,
      code: scene.code,
      titleAr: scene.titleAr,
      titleEn: scene.titleEn,
      timeRange: scene.timeRange,
      durationSec: scene.durationSec,
      characterAnchor: scene.characterAnchor,
      figmaOverlayCode: scene.figmaOverlayCode ?? null,
      threeTechSceneId: scene.threeTechSceneId ?? null,
      isSilentMusicalBeat: Boolean(scene.isSilentMusicalBeat),
      lipSyncTargetAr: scene.lipSyncTargetAr ?? null,
      frameDeRaccordAr: scene.frameDeRaccordAr,
      voiceoverSegmentAr: scene.voiceoverSegmentAr,
      grokPromptWithArabicAudio: buildGrokScenePrompt(scene, masterStyle, {
        includeMasterStyle: true,
        enableLipSync: Boolean(scene.lipSyncTargetAr),
        includeArabicAudio: true,
      }),
    })),
  };
  return `${JSON.stringify(payload, null, 2)}\n`;
}

export function buildProjectVoiceoverTxt(project: ProjectDefinition): string {
  const lines: string[] = [
    `NoesisAI — Arabic Voiceover Script (${project.nameAr})`,
    `Total Duration: ${project.totalDurationSec}s`,
    'Tone: فصحى مبسطة هادئة ورصينة (أسلوب وثائقي طبي راقٍ)',
    '',
    '=== FULL CONTINUOUS SCRIPT ===',
    project.voiceoverScriptAr,
    '',
    '=== SCENE-BY-SCENE TIMING GUIDE ===',
    ...project.scenes.map(
      (s) => `[${s.timeRange}] (${s.code} — ${s.titleAr})\n${s.voiceoverSegmentAr}`,
    ),
  ];
  return `${lines.join('\n')}\n`;
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
      scene.imagePrompt.toLowerCase().includes(normalizedQuery) ||
      scene.motionPrompt.toLowerCase().includes(normalizedQuery) ||
      (scene.figmaOverlayCode?.toLowerCase().includes(normalizedQuery) ?? false)
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
  generatedClips: Record<number, GeneratedClipRecord> | Record<string, GeneratedClipRecord>,
  threeClips: Record<number, GeneratedClipRecord> = {},
) {
  const totalScenes = scenes.length;
  const generatedCount = scenes.filter((s) => {
    const byNum = (generatedClips as Record<number, GeneratedClipRecord>)[s.id];
    const byKey = (generatedClips as Record<string, GeneratedClipRecord>)[
      getSceneStorageKey(s.projectId, s.id)
    ];
    const byThree = s.threeTechSceneId ? threeClips[s.threeTechSceneId] : undefined;
    return Boolean(byNum || byKey || byThree);
  }).length;
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
