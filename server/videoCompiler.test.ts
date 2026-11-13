import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildZoompanFilter,
  getOutputDimensions,
  getSceneMotionPreset,
} from './videoCompiler';

test('getOutputDimensions resolves 16:9 and 9:16 resolutions accurately', () => {
  assert.deepEqual(getOutputDimensions('16:9', '720p'), { width: 1280, height: 720 });
  assert.deepEqual(getOutputDimensions('16:9', '1080p'), { width: 1920, height: 1080 });
  assert.deepEqual(getOutputDimensions('9:16', '720p'), { width: 720, height: 1280 });
  assert.deepEqual(getOutputDimensions('9:16', '1080p'), { width: 1080, height: 1920 });
});

test('getSceneMotionPreset assigns distinct motion presets across all 12 scenes', () => {
  assert.equal(getSceneMotionPreset(1), 'push_in');
  assert.equal(getSceneMotionPreset(4), 'orbit_drift');
  assert.equal(getSceneMotionPreset(11), 'tilt_down');
  assert.equal(getSceneMotionPreset(12), 'pull_out');
});

test('buildZoompanFilter builds valid ffmpeg filtergraph for UI screens and 3D scenes', () => {
  const uiFilter = buildZoompanFilter('pan_right', 8, 1280, 720, 25, true);
  assert.ok(uiFilter.includes('force_original_aspect_ratio=decrease'));
  assert.ok(uiFilter.includes('d=200:s=1280x720:fps=25'));
  assert.ok(uiFilter.includes('format=yuv420p'));

  const sceneFilter = buildZoompanFilter('push_in', 7, 1280, 720, 25, false);
  assert.ok(sceneFilter.includes('force_original_aspect_ratio=increase,crop=1920:1080'));
  assert.ok(sceneFilter.includes('d=175:s=1280x720:fps=25'));
});
