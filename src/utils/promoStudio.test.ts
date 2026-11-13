import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOmniPrompt,
  calculateStudioStats,
  filterScenes,
  findActiveSceneAtTime,
  findActiveSubtitleAtTime,
  formatFileSize,
  formatSrtTimestamp,
  formatTimecode,
  generateCapCutSrt,
  getDownloadHref,
  parseTimeRange,
} from './promoStudio';
import {
  CAPCUT_SUBTITLES,
  MASTER_STYLE_GUIDE,
  PROMO_SCENES,
} from '../data/noesisProjectData';

test('parseTimeRange parses minutes and seconds accurately across all 12 scenes', () => {
  const first = parseTimeRange('0:00 - 0:08');
  assert.equal(first.startSec, 0);
  assert.equal(first.endSec, 8);
  assert.equal(first.durationSec, 8);

  const last = parseTimeRange('1:23 - 1:30');
  assert.equal(last.startSec, 83);
  assert.equal(last.endSec, 90);
  assert.equal(last.durationSec, 7);

  for (const scene of PROMO_SCENES) {
    const parsed = parseTimeRange(scene.timeRange);
    assert.equal(parsed.startSec, scene.startSec);
    assert.equal(parsed.endSec, scene.endSec);
    assert.equal(parsed.durationSec, scene.durationSec);
  }
});

test('formatTimecode and formatSrtTimestamp format durations cleanly', () => {
  assert.equal(formatTimecode(0), '0:00');
  assert.equal(formatTimecode(67), '1:07');
  assert.equal(formatTimecode(90), '1:30');

  assert.equal(formatSrtTimestamp(0), '00:00:00,000');
  assert.equal(formatSrtTimestamp(20), '00:00:20,000');
  assert.equal(formatSrtTimestamp(70.5), '00:01:10,500');
});

test('generateCapCutSrt generates valid SRT subtitle blocks', () => {
  const srt = generateCapCutSrt(CAPCUT_SUBTITLES);
  assert.match(srt, /^1\n00:00:00,000 --> 00:00:20,000\n/);
  assert.match(srt, /\n\n4\n00:01:10,000 --> 00:01:30,000\n/);
  assert.ok(srt.includes('IEC 62304 and ISO 27001'));
});

test('buildOmniPrompt injects Master Style Guide for doctor and patient scenes', () => {
  const doctorScene = PROMO_SCENES[0];
  const promptWithGuide = buildOmniPrompt(doctorScene, MASTER_STYLE_GUIDE, {
    includeMasterStyle: true,
  });
  assert.ok(promptWithGuide.includes('Pixar-inspired smooth rendering'));
  assert.ok(promptWithGuide.includes('40-year-old Arab male clinical psychologist'));
  assert.ok(promptWithGuide.includes('Camera & Motion: Slow camera push in'));

  const patientScene = PROMO_SCENES[8]; // Scene 9
  const patientPrompt = buildOmniPrompt(patientScene, MASTER_STYLE_GUIDE, {
    includeMasterStyle: true,
  });
  assert.ok(patientPrompt.includes('25-year-old Arab young woman'));
  assert.ok(patientPrompt.includes('sage green casual blazer'));

  const strippedPrompt = buildOmniPrompt(doctorScene, MASTER_STYLE_GUIDE, {
    includeMasterStyle: false,
  });
  assert.ok(!strippedPrompt.includes('40-year-old Arab male clinical psychologist'));
});

test('filterScenes filters by category and search query', () => {
  assert.equal(filterScenes(PROMO_SCENES, '', 'all').length, 12);
  assert.equal(filterScenes(PROMO_SCENES, '', 'problem').length, 3);
  assert.equal(filterScenes(PROMO_SCENES, 'Raspberry', 'all').length, 2);
  assert.equal(filterScenes(PROMO_SCENES, 'SC-04', 'all').length, 1);
  assert.equal(filterScenes(PROMO_SCENES, 'Y-BOCS', 'ui').length, 2);
});

test('findActiveSceneAtTime and findActiveSubtitleAtTime resolve timeline cues', () => {
  assert.equal(findActiveSceneAtTime(PROMO_SCENES, 0).id, 1);
  assert.equal(findActiveSceneAtTime(PROMO_SCENES, 25).id, 4);
  assert.equal(findActiveSceneAtTime(PROMO_SCENES, 89).id, 12);
  assert.equal(findActiveSceneAtTime(PROMO_SCENES, 95).id, 12);

  assert.equal(findActiveSubtitleAtTime(CAPCUT_SUBTITLES, 10)?.id, 1);
  assert.equal(findActiveSubtitleAtTime(CAPCUT_SUBTITLES, 40)?.id, 3);
  assert.equal(findActiveSubtitleAtTime(CAPCUT_SUBTITLES, 95), null);
});

test('calculateStudioStats tracks completion percentage accurately', () => {
  const emptyStats = calculateStudioStats(PROMO_SCENES, {});
  assert.equal(emptyStats.totalScenes, 12);
  assert.equal(emptyStats.generatedCount, 0);
  assert.equal(emptyStats.totalDurationSec, 90);
  assert.equal(emptyStats.completionPct, 0);

  const partialStats = calculateStudioStats(PROMO_SCENES, {
    1: {
      sceneId: 1,
      videoUrl: '/generated-videos/scene-1.mp4',
      interactionId: 'int_1',
      aspectRatio: '16:9',
      duration: '8s',
      resolution: '720p',
      createdAt: '2026-11-13T00:00:00Z',
      promptUsed: 'test',
    },
    4: {
      sceneId: 4,
      videoUrl: '/generated-videos/scene-4.mp4',
      interactionId: 'int_4',
      aspectRatio: '16:9',
      duration: '8s',
      resolution: '720p',
      createdAt: '2026-11-13T00:00:00Z',
      promptUsed: 'test',
    },
  });
  assert.equal(partialStats.generatedCount, 2);
  assert.equal(partialStats.completionPct, 17);
});

test('getDownloadHref maps generated video URLs to attachment download endpoint', () => {
  assert.equal(
    getDownloadHref('/generated-videos/noesisai-full-promo-123.mp4'),
    '/api/videos/download/noesisai-full-promo-123.mp4',
  );
  assert.equal(
    getDownloadHref('/generated-videos/scene%201.mp4?v=1'),
    '/api/videos/download/scene%25201.mp4',
  );
  assert.equal(getDownloadHref('/'), '/');
});

test('formatFileSize formats bytes into readable KB/MB strings', () => {
  assert.equal(formatFileSize(0), '0 MB');
  assert.equal(formatFileSize(512 * 1024), '512 KB');
  assert.equal(formatFileSize(14.6 * 1024 * 1024), '14.6 MB');
});
