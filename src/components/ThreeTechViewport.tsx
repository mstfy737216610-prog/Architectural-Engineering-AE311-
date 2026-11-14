import React, { useEffect, useRef } from 'react';
import {
  createTechSceneStage,
  type TechSceneController,
  type TechSceneId,
} from '../three/techScenes';

interface ThreeTechViewportProps {
  sceneId: TechSceneId;
}

export const ThreeTechViewport: React.FC<ThreeTechViewportProps> = ({ sceneId }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const rect = container.getBoundingClientRect();
    const w = Math.max(480, Math.round(rect.width || 640));
    const h = Math.max(270, Math.round((w * 9) / 16));

    let controller: TechSceneController | null = null;
    try {
      controller = createTechSceneStage(canvas, sceneId, { width: w, height: h });
    } catch {
      return;
    }

    let disposed = false;
    let frameId = 0;
    const startMs = performance.now();

    function afterDraw(cb: () => void) {
      if (!controller || disposed) return;
      const gl = controller.renderer.getContext() as WebGL2RenderingContext;
      if (typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 5);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 5);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    function tick() {
      if (disposed || !controller) return;
      const elapsedSec = ((performance.now() - startMs) / 1000) % 8.0;
      controller.renderFrame(elapsedSec);
      if (controller.isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = window.requestAnimationFrame(tick);
      }
    }

    if (controller.isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = window.requestAnimationFrame(tick);
    }

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      controller?.dispose();
    };
  }, [sceneId]);

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden bg-slate-950">
      <canvas ref={canvasRef} className="block h-full w-full object-contain" />
    </div>
  );
};
