import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGrokScenePrompt,
  buildOmniPrompt,
  buildProjectGrokPackJson,
  buildProjectGrokPackText,
  buildProjectVoiceoverTxt,
  calculateStudioStats,
  filterScenes,
  findActiveSceneAtTime,
  findActiveSubtitleAtTime,
  formatFileSize,
  formatSrtTimestamp,
  formatTimecode,
  generateCapCutSrt,
  getDownloadHref,
  getZipDownloadHref,
  parseTimeRange,
  resolveClipForScene,
} from './promoStudio';
import {
  CHARACTER_REFERENCE_ASSETS,
  FIGMA_REFERENCE_SCREENS,
  MASTER_STYLE_GUIDE,
  PROJECT_1_SCENES,
  PROJECT_2_SCENES,
  PROJECTS,
} from '../data/noesisProjectData';

test('Project 1 has 12 unique photorealistic 10-second scenes totaling 120 seconds', () => {
  assert.equal(PROJECT_1_SCENES.length, 12);
  assert.equal(PROJECTS.project1.totalDurationSec, 120);
  const paths = new Set<string>();
  for (const scene of PROJECT_1_SCENES) {
    const parsed = parseTimeRange(scene.timeRange);
    assert.equal(parsed.startSec, scene.startSec);
    assert.equal(parsed.endSec, scene.endSec);
    assert.equal(parsed.durationSec, 10);
    assert.equal(scene.durationSec, 10);
    assert.ok(scene.serverImagePath.includes('real_p1_'));
    paths.add(scene.serverImagePath);
  }
  assert.equal(paths.size, 12);
});

test('Project 2 (Journey of Peace) is built from scratch with 14 unique photorealistic scenes totaling 182s', () => {
  assert.equal(PROJECT_2_SCENES.length, 14);
  assert.equal(PROJECTS.project2.totalDurationSec, 182);
  assert.equal(PROJECT_2_SCENES[PROJECT_2_SCENES.length - 1].endSec, 182);

  const p1Paths = new Set(PROJECT_1_SCENES.map((s) => s.serverImagePath));
  const p2Paths = new Set<string>();
  for (const scene of PROJECT_2_SCENES) {
    assert.ok(scene.serverImagePath.includes('real_p2_'));
    assert.ok(!p1Paths.has(scene.serverImagePath));
    p2Paths.add(scene.serverImagePath);
  }
  assert.equal(p2Paths.size, 14);

  const silentBeats = PROJECT_2_SCENES.filter((s) => s.isSilentMusicalBeat);
  assert.equal(silentBeats.length, 2);

  const lipSyncScenes = PROJECT_2_SCENES.filter((s) => Boolean(s.lipSyncTargetAr));
  assert.equal(lipSyncScenes.length, 1);
  assert.equal(lipSyncScenes[0].code, 'P2-12');
  assert.ok(lipSyncScenes[0].lipSyncTargetAr?.includes('أخيراً'));
});

test('Master Style Guide and Character Reference Assets enforce live-action photorealism (zero Pixar/cartoon)', () => {
  assert.ok(!MASTER_STYLE_GUIDE.clinicPrompt.toLowerCase().includes('pixar'));
  assert.ok(MASTER_STYLE_GUIDE.clinicPrompt.toLowerCase().includes('photorealistic'));
  assert.ok(CHARACTER_REFERENCE_ASSETS.clinic_doctor.every((p) => p.includes('real_')));
  assert.ok(CHARACTER_REFERENCE_ASSETS.clinic_patient.every((p) => p.includes('real_')));
});

test('FIGMA_REFERENCE_SCREENS point to clean cropped 1080p PNG plates', () => {
  assert.equal(FIGMA_REFERENCE_SCREENS.length, 5);
  for (const fig of FIGMA_REFERENCE_SCREENS) {
    assert.ok(fig.imagePath.startsWith('/assets/figma-clean/'));
    assert.ok(fig.imagePath.endsWith('.png'));
  }
});

test('formatTimecode and formatSrtTimestamp format durations cleanly', () => {
  assert.equal(formatTimecode(0), '0:00');
  assert.equal(formatTimecode(120), '2:00');
  assert.equal(formatTimecode(182), '3:02');

  assert.equal(formatSrtTimestamp(0), '00:00:00,000');
  assert.equal(formatSrtTimestamp(20), '00:00:20,000');
  assert.equal(formatSrtTimestamp(70.5), '00:01:10,500');
});

test('generateCapCutSrt generates valid SRT subtitle blocks for both projects', () => {
  const srt1 = generateCapCutSrt(PROJECTS.project1.subtitlesEn);
  assert.match(srt1, /^1\n00:00:00,000 --> 00:00:20,000\n/);
  assert.ok(srt1.includes('91.66% accuracy'));
  assert.ok(srt1.includes('IEC 62304'));

  const srt2 = generateCapCutSrt(PROJECTS.project2.subtitlesEn);
  assert.ok(srt2.includes('Finally… someone understands me without fear.'));
  assert.ok(srt2.includes('00:02:44,000 --> 00:03:02,000'));
});

test('buildOmniPrompt and buildGrokScenePrompt inject Photorealistic Lock, Figma blank constraint, Lip-Sync, and Arabic Audio by default', () => {
  const p1Doctor = PROJECT_1_SCENES[0];
  const grokWithArabicAudio = buildGrokScenePrompt(p1Doctor, MASTER_STYLE_GUIDE, {
    includeMasterStyle: true,
    enableLipSync: false,
  });
  assert.ok(grokWithArabicAudio.includes('1080p, 30fps'));
  assert.ok(grokWithArabicAudio.includes('Dr. Salem'));
  assert.ok(grokWithArabicAudio.includes('never static-image zoom/pan'));
  assert.ok(grokWithArabicAudio.includes('Native Arabic Audio & Voiceover:'));
  assert.ok(grokWithArabicAudio.includes(p1Doctor.voiceoverSegmentAr));
  assert.ok(!grokWithArabicAudio.includes('Pixar'));

  const grokSilentOverride = buildGrokScenePrompt(p1Doctor, MASTER_STYLE_GUIDE, {
    includeArabicAudio: false,
  });
  assert.ok(!grokSilentOverride.includes('Native Arabic Audio'));
  assert.ok(grokSilentOverride.includes('silent output'));

  const p1FigmaScene = PROJECT_1_SCENES[5]; // P1-06 FIG-01
  const grokFigma = buildGrokScenePrompt(p1FigmaScene, MASTER_STYLE_GUIDE);
  assert.ok(grokFigma.includes('CapCut FIG-01 overlay'));

  const p2LipSync = PROJECT_2_SCENES[11]; // P2-12
  const grokLipSync = buildOmniPrompt(p2LipSync, MASTER_STYLE_GUIDE, {
    includeMasterStyle: true,
    enableLipSync: true,
  });
  assert.ok(grokLipSync.includes('Noura'));
  assert.ok(grokLipSync.includes('Lip-Sync Articulation:'));
  assert.ok(grokLipSync.includes('Native Arabic Audio & Speech:'));
  assert.ok(grokLipSync.includes('أخيراً'));
});

test('Grok pack text, JSON, and voiceover TXT builders include Arabic audio prompts and complete deliverables', () => {
  const txt = buildProjectGrokPackText(PROJECTS.project2, MASTER_STYLE_GUIDE);
  assert.ok(txt.includes('P2-14'));
  assert.ok(txt.includes('91.66%'));
  assert.ok(txt.includes('Frame de raccord'));
  assert.ok(txt.includes('Native Arabic Audio'));

  const jsonRaw = buildProjectGrokPackJson(PROJECTS.project1, MASTER_STYLE_GUIDE);
  const parsed = JSON.parse(jsonRaw) as {
    styleMode: string;
    includesArabicAudioInPrompt: boolean;
    sceneCount: number;
    scenes: Array<{ code: string; grokPromptWithArabicAudio: string }>;
  };
  assert.equal(parsed.styleMode, 'photorealistic_live_action_1080p');
  assert.equal(parsed.includesArabicAudioInPrompt, true);
  assert.equal(parsed.sceneCount, 12);
  assert.equal(parsed.scenes[0].code, 'P1-01');
  assert.equal(parsed.scenes[11].code, 'P1-12');
  assert.ok(parsed.scenes[0].grokPromptWithArabicAudio.includes('Native Arabic Audio'));

  const voTxt = buildProjectVoiceoverTxt(PROJECTS.project2);
  assert.ok(voTxt.includes('أخيراً… أحد يفهمني دون خوف'));
});

test('filterScenes filters by category and query accurately', () => {
  assert.equal(filterScenes(PROJECT_1_SCENES, '', 'all').length, 12);
  assert.equal(filterScenes(PROJECT_1_SCENES, 'FIG-03', 'all').length, 1);
  assert.equal(filterScenes(PROJECT_1_SCENES, '', 'hardware').length, 2);
  assert.equal(filterScenes(PROJECT_2_SCENES, 'P2-12', 'all').length, 1);
});

test('findActiveSceneAtTime, findActiveSubtitleAtTime, and resolveClipForScene work across projects', () => {
  assert.equal(findActiveSceneAtTime(PROJECT_1_SCENES, 0).id, 1);
  assert.equal(findActiveSceneAtTime(PROJECT_1_SCENES, 35).id, 4);
  assert.equal(findActiveSceneAtTime(PROJECT_1_SCENES, 150).id, 12);

  assert.equal(findActiveSubtitleAtTime(PROJECTS.project2.subtitlesEn, 138)?.id, 5);
  assert.equal(findActiveSubtitleAtTime(PROJECTS.project2.subtitlesEn, 200), null);

  const mockThreeClip = {
    sceneId: 4,
    videoUrl: '/generated-videos/pi5.mp4',
    interactionId: 'threejs-1',
    source: 'threejs_3d' as const,
    aspectRatio: '16:9' as const,
    duration: '8s',
    resolution: '1080p',
    createdAt: '2026-11-14T00:00:00Z',
    promptUsed: 'pi5',
  };
  const p2Scene6 = PROJECT_2_SCENES[5]; // P2-06 has threeTechSceneId: 4
  assert.equal(resolveClipForScene(p2Scene6, {}, { 4: mockThreeClip })?.videoUrl, '/generated-videos/pi5.mp4');
});

test('calculateStudioStats tracks completion accurately', () => {
  const empty = calculateStudioStats(PROJECT_1_SCENES, {});
  assert.equal(empty.totalScenes, 12);
  assert.equal(empty.totalDurationSec, 120);
  assert.equal(empty.generatedCount, 0);

  const withThree = calculateStudioStats(PROJECT_2_SCENES, {}, {
    3: {
      sceneId: 3,
      videoUrl: '/generated-videos/s3.mp4',
      interactionId: '3d-3',
      source: 'threejs_3d',
      aspectRatio: '16:9',
      duration: '8s',
      resolution: '1080p',
      createdAt: '2026-11-14T00:00:00Z',
      promptUsed: 'cloud',
    },
  });
  assert.equal(withThree.generatedCount, 1);
  assert.equal(withThree.totalScenes, 14);
});

test('getDownloadHref, getZipDownloadHref, and formatFileSize format cleanly', () => {
  assert.equal(
    getDownloadHref('/generated-videos/NoesisAI_Scene_01_1080p_30fps.mp4'),
    '/api/videos/download/NoesisAI_Scene_01_1080p_30fps.mp4',
  );
  assert.equal(getZipDownloadHref(true), '/api/videos/download-all-zip?includePngs=1');
  assert.equal(formatFileSize(512 * 1024), '512 KB');
  assert.equal(formatFileSize(14.6 * 1024 * 1024), '14.6 MB');
});
