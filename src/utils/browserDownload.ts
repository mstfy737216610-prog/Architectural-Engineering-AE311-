import JSZip from 'jszip';
import {
  FIGMA_REFERENCE_SCREENS,
  MASTER_STYLE_GUIDE,
  PROJECTS,
  type ProjectDefinition,
  type ProjectId,
} from '../data/noesisProjectData';
import { PROJECT_SCENE_VISUAL_ASSETS } from '../data/sceneAssets';
import {
  buildProjectGrokPackJson,
  buildProjectGrokPackText,
  buildProjectVoiceoverTxt,
  generateCapCutSrt,
  resolveClipForScene,
  type GeneratedClipRecord,
} from './promoStudio';

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 15_000);
}

export async function fetchUrlAsBlob(url: string): Promise<Blob> {
  const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`تعذر تحميل الملف (${res.status}).`);
  }
  const contentType = (res.headers.get('content-type') || '').toLowerCase();
  if (contentType.includes('text/html')) {
    throw new Error('استجاب الخادم بصفحة وصول بدلاً من الملف. يرجى المحاولة من داخل الجلسة النشطة.');
  }
  return res.blob();
}

export async function downloadRemoteFileViaBlob(url: string, filename: string): Promise<void> {
  const blob = await fetchUrlAsBlob(url);
  triggerBlobDownload(blob, filename);
}

export async function imageUrlTo1080pPngBlob(imageUrl: string): Promise<Blob> {
  const imgBlob = await fetchUrlAsBlob(imageUrl);
  const objUrl = URL.createObjectURL(imgBlob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('تعذر قراءة الصورة لتحويلها إلى PNG بدقة 1080p.'));
      el.src = objUrl;
    });

    const targetW = 1920;
    const targetH = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('تعذر تهيئة Canvas لتحويل الصورة.');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const srcAspect = img.naturalWidth / Math.max(1, img.naturalHeight);
    const dstAspect = targetW / targetH;
    let sx = 0;
    let sy = 0;
    let sw = img.naturalWidth;
    let sh = img.naturalHeight;

    if (srcAspect > dstAspect) {
      sw = Math.round(img.naturalHeight * dstAspect);
      sx = Math.round((img.naturalWidth - sw) / 2);
    } else if (srcAspect < dstAspect) {
      sh = Math.round(img.naturalWidth / dstAspect);
      sy = Math.round((img.naturalHeight - sh) / 2);
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetW, targetH);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('تعذر تصدير صورة PNG.'));
            return;
          }
          resolve(blob);
        },
        'image/png',
      );
    });
  } finally {
    URL.revokeObjectURL(objUrl);
  }
}

export async function downloadSingleScenePng1080p(
  sceneCode: string | number,
  imageUrl: string,
): Promise<void> {
  const pngBlob = await imageUrlTo1080pPngBlob(imageUrl);
  const label =
    typeof sceneCode === 'number'
      ? `NoesisAI_Scene_${String(sceneCode).padStart(2, '0')}`
      : `NoesisAI_${sceneCode}`;
  triggerBlobDownload(pngBlob, `${label}_1080p_reference.png`);
}

export type ZipBundleScope = ProjectId | 'both';

export interface BrowserZipResult {
  includedClips: number;
  includedPngs: number;
  includedFigmaPngs: number;
  filename: string;
}

async function appendProjectToZip(options: {
  rootFolder: JSZip;
  project: ProjectDefinition;
  projectClips: Record<string, GeneratedClipRecord>;
  threeClips: Record<number, GeneratedClipRecord>;
  includePngs: boolean;
  onProgress?: (label: string) => void;
}): Promise<{ clips: number; pngs: number }> {
  const { rootFolder, project, projectClips, threeClips, includePngs, onProgress } = options;
  let clipsCount = 0;
  let pngsCount = 0;

  const assetsMap = PROJECT_SCENE_VISUAL_ASSETS[project.id];
  const pngFolder = includePngs ? rootFolder.folder('01_Scenes_1080p_PNG') : null;
  const mp4Folder = rootFolder.folder('02_Animated_MP4_1080p_30fps');

  for (const scene of project.scenes) {
    const clip = resolveClipForScene(scene, projectClips, threeClips);
    if (clip && mp4Folder) {
      onProgress?.(`جاري إضافة فيديو ${scene.code}...`);
      const candidates = [clip.videoUrl, clip.downloadUrl].filter((u): u is string => Boolean(u));
      let loadedClipBlob: Blob | null = null;
      for (const candidateUrl of candidates) {
        try {
          loadedClipBlob = await fetchUrlAsBlob(candidateUrl);
          break;
        } catch {
          // Try next URL candidate
        }
      }
      if (loadedClipBlob) {
        mp4Folder.file(
          `NoesisAI_${scene.code}_1080p_30fps_silent.mp4`,
          loadedClipBlob,
          { compression: 'STORE' },
        );
        clipsCount += 1;
      }
    }

    if (includePngs && pngFolder) {
      const assetUrl = assetsMap[scene.id];
      if (assetUrl) {
        onProgress?.(`جاري تحويل صورة ${scene.code} إلى 1080p PNG...`);
        const pngBlob = await imageUrlTo1080pPngBlob(assetUrl);
        pngFolder.file(`${scene.code}_1080p_reference.png`, pngBlob, {
          compression: 'STORE',
        });
        pngsCount += 1;
      }
    }
  }

  onProgress?.(`جاري كتابة برومبتات Grok وملفات الصوت والترجمة (${project.shortNameAr})...`);
  rootFolder.file(
    '03_Grok_Prompts_Complete.txt',
    buildProjectGrokPackText(project, MASTER_STYLE_GUIDE),
  );
  rootFolder.file(
    '03_Grok_Prompts_Complete.json',
    buildProjectGrokPackJson(project, MASTER_STYLE_GUIDE),
  );
  rootFolder.file('04_Arabic_Voiceover_Timed.txt', buildProjectVoiceoverTxt(project));
  rootFolder.file('05_CapCut_Subtitles_EN.srt', generateCapCutSrt(project.subtitlesEn));

  return { clips: clipsCount, pngs: pngsCount };
}

export async function buildAndDownloadProjectZipInBrowser(options: {
  scope: ZipBundleScope;
  projectClips?: Record<string, GeneratedClipRecord>;
  threeClips?: Record<number, GeneratedClipRecord>;
  generatedClips?: Record<number, GeneratedClipRecord>;
  includePngs?: boolean;
  onProgress?: (label: string) => void;
}): Promise<BrowserZipResult> {
  const includePngs = options.includePngs !== false;
  const projectClips = { ...(options.projectClips || {}) };
  const threeClips = { ...(options.threeClips || {}) };

  if (options.generatedClips) {
    for (const [k, clip] of Object.entries(options.generatedClips)) {
      const idNum = Number(k);
      if (clip.source === 'threejs_3d') {
        threeClips[idNum] = clip;
      } else {
        projectClips[`project1:${idNum}`] = clip;
      }
    }
  }

  const zip = new JSZip();
  let includedClips = 0;
  let includedPngs = 0;
  let includedFigmaPngs = 0;

  const targetProjects: ProjectDefinition[] =
    options.scope === 'both'
      ? [PROJECTS.project1, PROJECTS.project2]
      : [PROJECTS[options.scope]];

  for (const project of targetProjects) {
    const folderName =
      options.scope === 'both'
        ? project.id === 'project1'
          ? 'Project_1_12Scenes_120s'
          : 'Project_2_FromSilenceToHope_14Scenes_182s'
        : '';
    const targetFolder = folderName ? zip.folder(folderName) ?? zip : zip;
    const res = await appendProjectToZip({
      rootFolder: targetFolder,
      project,
      projectClips,
      threeClips,
      includePngs,
      onProgress: options.onProgress,
    });
    includedClips += res.clips;
    includedPngs += res.pngs;
  }

  // Add clean 1080p cropped Figma UI PNGs (shared for CapCut montage)
  const figmaFolder = zip.folder('06_Figma_Clean_UI_1080p_PNG');
  if (figmaFolder) {
    for (const screen of FIGMA_REFERENCE_SCREENS) {
      try {
        options.onProgress?.(`جاري إرفاق شاشة Figma النظيفة ${screen.code}...`);
        const figBlob = await fetchUrlAsBlob(screen.imagePath);
        figmaFolder.file(screen.filename, figBlob, { compression: 'STORE' });
        includedFigmaPngs += 1;
      } catch {
        // Skip if unreachable
      }
    }
  }

  const readmeLines = [
    '====================================================================',
    'NoesisAI Studio — Complete Production Package (Project 1 & Project 2)',
    '====================================================================',
    `Included 1080p PNG Scene Keyframes: ${includedPngs}`,
    `Included Clean Cropped 1080p Figma UI Screens: ${includedFigmaPngs}`,
    `Included 1080p 30fps Silent MP4 Clips (Three.js 3D / AI): ${includedClips}`,
    '',
    'HOW TO USE THIS PACKAGE IN GROK & CAPCUT (مجاني 100% بدون مفتاح مدفوع):',
    '1. افتح مجلد 01_Scenes_1080p_PNG وارفق صورة المشهد الواقعية (1920×1080 PNG) داخل Grok Image-to-Video.',
    '2. افتح ملف 03_Grok_Prompts_Complete.txt وانسخ برومبت المشهد — يتضمن بالفعل توجيه الصوت والتعليق العربي والليب-سنك.',
    '   - في مشاهد د. سالم أو نورة، يمكنك إرفاق صورة المرجع الأولى مع صورة المشهد لتثبيت الملامح بدقة.',
    '   - في مشهد P2-12 (نورة: «أخيراً… أحد يفهمني دون خوف»)، جرى تضمين النص العربي ومزامنة الشفاه مباشرة داخل البرومبت.',
    '3. لقطات الهاردوير الثلاثية الأبعاد (SC-03, SC-04, SC-05) يمكنك تصييرها MP4 مجاناً 1080p/30fps من الاستوديو.',
    '4. في CapCut، استورد ملف الترجمة الإنجليزية 05_CapCut_Subtitles_EN.srt مباشرة.',
    '5. ركّب شاشات Figma النظيفة من مجلد 06_Figma_Clean_UI_1080p_PNG فوق الشاشات البيضاء الصافية.',
  ];
  zip.file('README.txt', `${readmeLines.join('\n')}\n`);

  options.onProgress?.('جاري ضغط الحزمة في ملف ZIP...');
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'STORE',
  });

  const filename =
    options.scope === 'project1'
      ? 'NoesisAI_Project1_12Scenes_Complete_Pack.zip'
      : options.scope === 'project2'
        ? 'NoesisAI_Project2_SilenceToHope_14Scenes_Pack.zip'
        : 'NoesisAI_Project1_and_Project2_Complete_Pack.zip';

  triggerBlobDownload(zipBlob, filename);

  return {
    includedClips,
    includedPngs,
    includedFigmaPngs,
    filename,
  };
}

export async function buildAndDownloadAllZipInBrowser(options: {
  generatedClips: Record<number, GeneratedClipRecord>;
  includePngs?: boolean;
  onProgress?: (label: string) => void;
}): Promise<BrowserZipResult> {
  return buildAndDownloadProjectZipInBrowser({
    scope: 'both',
    generatedClips: options.generatedClips,
    includePngs: options.includePngs,
    onProgress: options.onProgress,
  });
}
