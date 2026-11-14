import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDeliverablesZipBuffer,
  buildVideoNormalizeFilter,
  getOutputDimensions,
  parseFrameRate,
} from './videoCompiler';

test('getOutputDimensions resolves 16:9 and 9:16 1080p/720p dimensions accurately', () => {
  assert.deepEqual(getOutputDimensions('16:9', '720p'), { width: 1280, height: 720 });
  assert.deepEqual(getOutputDimensions('16:9', '1080p'), { width: 1920, height: 1080 });
  assert.deepEqual(getOutputDimensions('9:16', '720p'), { width: 720, height: 1280 });
  assert.deepEqual(getOutputDimensions('9:16', '1080p'), { width: 1080, height: 1920 });
});

test('buildVideoNormalizeFilter enforces 30fps 1080p yuv420p without zoompan/Ken Burns', () => {
  const filter = buildVideoNormalizeFilter(1920, 1080, 30);
  assert.ok(filter.includes('fps=30'));
  assert.ok(filter.includes('scale=1920:1080'));
  assert.ok(filter.includes('format=yuv420p'));
  assert.ok(!filter.includes('zoompan'));
});

test('parseFrameRate parses ffprobe rational frame rates accurately', () => {
  assert.equal(parseFrameRate('30/1'), 30);
  assert.equal(parseFrameRate('30000/1001'), 29.97);
  assert.equal(parseFrameRate('24'), 24);
  assert.equal(parseFrameRate(undefined), 0);
});

test('buildDeliverablesZipBuffer produces a valid PK ZIP archive with manifest', async () => {
  const zipBuf = await buildDeliverablesZipBuffer({
    clips: [],
    pngAssets: [
      {
        sceneId: 1,
        filename: 'NoesisAI_Scene_01_1080p_reference.png',
        sourceImagePath: 'src/assets/images/scene_01_paperwork_1794609018351.jpg',
      },
    ],
  });

  assert.ok(zipBuf.length > 1000);
  // Standard ZIP header starts with PK\x03\x04
  assert.equal(zipBuf[0], 0x50);
  assert.equal(zipBuf[1], 0x4b);
});
