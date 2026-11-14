import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export type TechSceneId = 3 | 4 | 5;

export function isTechThreeScene(sceneId: number): sceneId is TechSceneId {
  return sceneId === 3 || sceneId === 4 || sceneId === 5;
}

export interface TechSceneController {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  isSoftwareGl: boolean;
  updateAt: (timeSec: number) => void;
  renderFrame: (timeSec: number) => void;
  resize: (width: number, height: number) => void;
  dispose: () => void;
}

const _tmpVec = new THREE.Vector3();
const _tmpQuat = new THREE.Quaternion();
const _tmpMat = new THREE.Matrix4();

export function detectSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

function createRadialShadowTexture(colorRgba = 'rgba(15, 23, 42, 0.35)'): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 12, 128, 128, 120);
    grad.addColorStop(0, colorRgba);
    grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.14)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createMedicalCardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(12, 30, 52, 0.9)';
    ctx.fillRect(0, 0, 256, 320);

    // Subtle glowing border (strictly abstract geometry, zero text or numbers)
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 236, 300);

    // Abstract medical cross emblem
    ctx.fillStyle = 'rgba(125, 211, 252, 0.92)';
    ctx.fillRect(114, 52, 28, 72);
    ctx.fillRect(92, 74, 72, 28);

    // Abstract waveform & encrypted bar shapes (no readable text)
    ctx.fillStyle = 'rgba(186, 230, 253, 0.55)';
    ctx.fillRect(36, 158, 184, 14);
    ctx.fillRect(36, 188, 140, 12);
    ctx.fillRect(36, 216, 162, 12);
    ctx.fillStyle = 'rgba(52, 211, 153, 0.72)';
    ctx.fillRect(36, 248, 112, 16);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createRoundedRectShape(width: number, height: number, radius: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function createShieldShape(scale = 1): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 1.35 * scale);
  s.lineTo(1.05 * scale, 0.98 * scale);
  s.quadraticCurveTo(1.08 * scale, -0.35 * scale, 0, -1.35 * scale);
  s.quadraticCurveTo(-1.08 * scale, -0.35 * scale, -1.05 * scale, 0.98 * scale);
  s.closePath();
  return s;
}

function buildRaspberryPi5Unit(options: {
  includeStandAndTablet?: boolean;
  maxAnisotropy: number;
}): {
  root: THREE.Group;
  ledMesh: THREE.Mesh;
  ledMaterial: THREE.MeshStandardMaterial;
  ledLight: THREE.PointLight;
} {
  const root = new THREE.Group();

  // Palette & calibrated PBR materials (roughness varies >= 0.25 across parts)
  const matteWhiteShellMat = new THREE.MeshStandardMaterial({
    color: 0xf6f8f5,
    roughness: 0.36,
    metalness: 0.04,
  });
  const sageTrimMat = new THREE.MeshStandardMaterial({
    color: 0x3b6e44,
    roughness: 0.42,
    metalness: 0.28,
  });
  const brushedAlumMat = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.22,
    metalness: 0.88,
  });
  const darkRecessMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.65,
    metalness: 0.15,
  });
  const usbBlueMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.35,
    metalness: 0.1,
  });
  const lensGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f172a,
    roughness: 0.06,
    metalness: 0.15,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
  });
  const ledMaterial = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x10b981,
    emissiveIntensity: 1.6,
    roughness: 0.2,
    metalness: 0.1,
  });

  // 1. Primary Chassis Enclosure (bottom-center grounded at y = 0)
  const chassisGroup = new THREE.Group();
  const baseShape = createRoundedRectShape(2.2, 1.56, 0.22);
  const baseGeo = new THREE.ExtrudeGeometry(baseShape, {
    depth: 0.48,
    bevelEnabled: true,
    bevelThickness: 0.06,
    bevelSize: 0.06,
    bevelSegments: 4,
  });
  baseGeo.rotateX(Math.PI / 2);
  const baseMesh = new THREE.Mesh(baseGeo, matteWhiteShellMat);
  baseMesh.position.y = 0.54;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  chassisGroup.add(baseMesh);

  // 2. Sage Green Waist Accent Band
  const bandShape = createRoundedRectShape(2.28, 1.64, 0.23);
  const bandGeo = new THREE.ExtrudeGeometry(bandShape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
  });
  bandGeo.rotateX(Math.PI / 2);
  const bandMesh = new THREE.Mesh(bandGeo, sageTrimMat);
  bandMesh.position.y = 0.34;
  bandMesh.castShadow = true;
  chassisGroup.add(bandMesh);

  // 3. Top Ventilation Louvers (6 sleek recessed slots)
  const ventGeo = new THREE.BoxGeometry(0.9, 0.03, 0.055);
  for (let i = 0; i < 6; i++) {
    const vent = new THREE.Mesh(ventGeo, darkRecessMat);
    vent.position.set(-0.35, 0.605, -0.42 + i * 0.16);
    chassisGroup.add(vent);
  }

  // Top subtle sage status crest bar
  const crestGeo = new THREE.BoxGeometry(0.45, 0.025, 0.45);
  const crest = new THREE.Mesh(crestGeo, sageTrimMat);
  crest.position.set(0.55, 0.605, 0);
  chassisGroup.add(crest);

  // 4. Side I/O Ports (Right Side: 2x USB-A + RJ45 Ethernet)
  const usbHousingGeo = new THREE.BoxGeometry(0.12, 0.22, 0.24);
  const usbInnerGeo = new THREE.BoxGeometry(0.06, 0.05, 0.18);
  for (const zOff of [-0.4, -0.04]) {
    const port = new THREE.Mesh(usbHousingGeo, brushedAlumMat);
    port.position.set(1.12, 0.28, zOff);
    chassisGroup.add(port);

    const tongue = new THREE.Mesh(usbInnerGeo, usbBlueMat);
    tongue.position.set(1.16, 0.28, zOff);
    chassisGroup.add(tongue);
  }

  const rj45Geo = new THREE.BoxGeometry(0.14, 0.24, 0.28);
  const rj45 = new THREE.Mesh(rj45Geo, brushedAlumMat);
  rj45.position.set(1.12, 0.29, 0.38);
  chassisGroup.add(rj45);

  const rj45Hole = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.2), darkRecessMat);
  rj45Hole.position.set(1.17, 0.29, 0.38);
  chassisGroup.add(rj45Hole);

  // Front Side: USB-C & Micro-HDMI ports + Glowing Emerald Green LED
  const usbcPort = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.09, 0.08), brushedAlumMat);
  usbcPort.position.set(-0.55, 0.22, 0.82);
  chassisGroup.add(usbcPort);

  const hdmiPort = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 0.08), brushedAlumMat);
  hdmiPort.position.set(-0.22, 0.22, 0.82);
  chassisGroup.add(hdmiPort);

  // Emerald Green LED Bezel & Glowing Bulb (front-right corner)
  const ledBezel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.065, 0.075, 0.05, 20),
    brushedAlumMat,
  );
  ledBezel.rotation.x = Math.PI / 2;
  ledBezel.position.set(0.72, 0.28, 0.825);
  chassisGroup.add(ledBezel);

  const ledMesh = new THREE.Mesh(new THREE.SphereGeometry(0.045, 20, 16), ledMaterial);
  ledMesh.position.set(0.72, 0.28, 0.855);
  chassisGroup.add(ledMesh);

  const ledLight = new THREE.PointLight(0x10b981, 1.8, 3.2, 2);
  ledLight.position.set(0.72, 0.32, 1.05);
  chassisGroup.add(ledLight);

  // 5. Rubber Desk Feet
  const footGeo = new THREE.CylinderGeometry(0.08, 0.09, 0.04, 16);
  for (const [fx, fz] of [
    [-0.85, -0.55],
    [0.85, -0.55],
    [-0.85, 0.55],
    [0.85, 0.55],
  ]) {
    const foot = new THREE.Mesh(footGeo, darkRecessMat);
    foot.position.set(fx, 0.02, fz);
    chassisGroup.add(foot);
  }

  root.add(chassisGroup);

  // 6. Articulated Rear Camera Module Arm + Optical Camera Pod
  const cameraGroup = new THREE.Group();
  const baseCollar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.14, 0.17, 0.12, 24),
    brushedAlumMat,
  );
  baseCollar.position.set(-0.55, 0.64, -0.45);
  cameraGroup.add(baseCollar);

  const armCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.55, 0.68, -0.45),
    new THREE.Vector3(-0.55, 1.18, -0.52),
    new THREE.Vector3(-0.32, 1.48, -0.3),
    new THREE.Vector3(-0.08, 1.52, -0.05),
  ]);
  const armGeo = new THREE.TubeGeometry(armCurve, 28, 0.055, 14, false);
  const armMesh = new THREE.Mesh(armGeo, brushedAlumMat);
  armMesh.castShadow = true;
  cameraGroup.add(armMesh);

  // Camera head housing
  const camHeadGroup = new THREE.Group();
  camHeadGroup.position.set(-0.05, 1.52, 0.02);
  camHeadGroup.rotation.x = 0.12;

  const camBodyShape = createRoundedRectShape(0.64, 0.54, 0.12);
  const camBodyGeo = new THREE.ExtrudeGeometry(camBodyShape, {
    depth: 0.34,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 3,
  });
  const camBody = new THREE.Mesh(camBodyGeo, matteWhiteShellMat);
  camBody.position.z = -0.17;
  camBody.castShadow = true;
  camHeadGroup.add(camBody);

  const camTrimRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.17, 0.035, 14, 32),
    sageTrimMat,
  );
  camTrimRing.position.z = 0.21;
  camHeadGroup.add(camTrimRing);

  const camBarrel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.16, 0.1, 28),
    darkRecessMat,
  );
  camBarrel.rotation.x = Math.PI / 2;
  camBarrel.position.z = 0.22;
  camHeadGroup.add(camBarrel);

  const camLens = new THREE.Mesh(
    new THREE.SphereGeometry(0.125, 24, 18, 0, Math.PI * 2, 0, Math.PI * 0.45),
    lensGlassMat,
  );
  camLens.rotation.x = Math.PI / 2;
  camLens.position.z = 0.23;
  camHeadGroup.add(camLens);

  cameraGroup.add(camHeadGroup);
  root.add(cameraGroup);

  // 7. Optional Companion Blank Matte-Lit Touchscreen Tablet (Zero text/UI!)
  if (options.includeStandAndTablet) {
    const tabletGroup = new THREE.Group();
    tabletGroup.position.set(-2.05, 0, 0.15);
    tabletGroup.rotation.y = 0.24;

    const standFoot = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 0.05, 0.75),
      brushedAlumMat,
    );
    standFoot.position.y = 0.025;
    standFoot.castShadow = true;
    tabletGroup.add(standFoot);

    const standNeck = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.65, 0.08),
      brushedAlumMat,
    );
    standNeck.position.set(0, 0.34, -0.14);
    standNeck.rotation.x = -0.22;
    tabletGroup.add(standNeck);

    const bezelGroup = new THREE.Group();
    bezelGroup.position.set(0, 0.88, 0.02);
    bezelGroup.rotation.x = -0.28;

    const tabletBodyGeo = new THREE.ExtrudeGeometry(
      createRoundedRectShape(1.56, 1.08, 0.08),
      { depth: 0.07, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 },
    );
    const tabletBody = new THREE.Mesh(tabletBodyGeo, brushedAlumMat);
    tabletBody.position.z = -0.035;
    tabletBody.castShadow = true;
    bezelGroup.add(tabletBody);

    // Soft pastel sage blank-lit screen (explicitly zero text, zero numbers, zero UI!)
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 256;
    screenCanvas.height = 176;
    const sctx = screenCanvas.getContext('2d');
    if (sctx) {
      const g = sctx.createLinearGradient(0, 0, 256, 176);
      g.addColorStop(0, '#eef5ef');
      g.addColorStop(0.5, '#ddebe0');
      g.addColorStop(1, '#d2e4d6');
      sctx.fillStyle = g;
      sctx.fillRect(0, 0, 256, 176);
    }
    const screenTex = new THREE.CanvasTexture(screenCanvas);
    screenTex.colorSpace = THREE.SRGBColorSpace;
    screenTex.anisotropy = options.maxAnisotropy;

    const screenMat = new THREE.MeshStandardMaterial({
      map: screenTex,
      emissive: 0xdbeee0,
      emissiveIntensity: 0.35,
      roughness: 0.14,
      metalness: 0.05,
    });
    const screenPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.42, 0.94), screenMat);
    screenPlane.position.z = 0.058;
    bezelGroup.add(screenPlane);

    tabletGroup.add(bezelGroup);
    root.add(tabletGroup);
  }

  return { root, ledMesh, ledMaterial, ledLight };
}

export function createTechSceneStage(
  canvas: HTMLCanvasElement,
  sceneId: TechSceneId,
  options: { width?: number; height?: number } = {},
): TechSceneController {
  const isSoftwareGl = detectSoftwareWebGL();
  const width = options.width ?? 1920;
  const height = options.height ?? 1080;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 80);

  // Studio environment reflections (mandatory for crisp PBR metals & glass)
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  pmremGenerator.dispose();

  const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy() || 1);
  let updateFn: (t: number) => void = () => {};

  if (sceneId === 3) {
    // =========================================================================
    // SCENE 03: Digital Files Floating Toward Dark Storm Cloud + Cracked Shield
    // =========================================================================
    const bgColor = new THREE.Color(0x09111f);
    scene.background = bgColor;
    scene.fog = new THREE.FogExp2(0x09111f, 0.048);

    camera.position.set(0, 0.4, 9.6);
    camera.lookAt(0, 0.35, 0);

    const hemi = new THREE.HemisphereLight(0x60a5fa, 0x0f172a, 0.75);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xe0f2fe, 1.35);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const redAlarmLight = new THREE.PointLight(0xef4444, 2.8, 8, 2);
    redAlarmLight.position.set(0, -0.3, 1.6);
    scene.add(redAlarmLight);

    const cloudLightningA = new THREE.PointLight(0x38bdf8, 0.5, 9, 2);
    cloudLightningA.position.set(-1.6, 2.25, -0.5);
    scene.add(cloudLightningA);

    const cloudLightningB = new THREE.PointLight(0x818cf8, 0.4, 9, 2);
    cloudLightningB.position.set(1.7, 2.35, -0.4);
    scene.add(cloudLightningB);

    // 1. Dark Storm Cloud Cluster (16 sculpted overlapping lobes)
    const cloudGroup = new THREE.Group();
    cloudGroup.position.set(0, 2.25, -1.2);
    const cloudMatDark = new THREE.MeshStandardMaterial({
      color: 0x162238,
      roughness: 0.92,
      metalness: 0.08,
    });
    const cloudMatMid = new THREE.MeshStandardMaterial({
      color: 0x1f304d,
      roughness: 0.88,
      metalness: 0.1,
    });

    const cloudLobes: Array<{
      mesh: THREE.Mesh;
      basePos: [number, number, number];
      phase: number;
    }> = [];
    const lobeSpecs: Array<[number, number, number, number, boolean]> = [
      [0, 0.25, 0, 1.35, false],
      [-1.15, 0.05, 0.2, 1.05, true],
      [1.18, 0.08, 0.15, 1.08, true],
      [-2.15, -0.2, -0.1, 0.88, false],
      [2.2, -0.18, -0.15, 0.9, false],
      [-0.65, 0.68, -0.25, 0.95, true],
      [0.7, 0.62, -0.2, 0.92, true],
      [-1.65, 0.42, -0.35, 0.82, false],
      [1.65, 0.38, -0.3, 0.84, false],
      [0, -0.32, 0.5, 0.95, false],
      [-0.95, -0.34, 0.45, 0.78, true],
      [0.95, -0.3, 0.45, 0.8, true],
      [-2.85, -0.35, -0.35, 0.65, false],
      [2.85, -0.32, -0.3, 0.68, false],
    ];
    lobeSpecs.forEach(([x, y, z, r, useMid], idx) => {
      const m = new THREE.Mesh(
        new THREE.IcosahedronGeometry(r, 3),
        useMid ? cloudMatMid : cloudMatDark,
      );
      m.position.set(x, y, z);
      cloudGroup.add(m);
      cloudLobes.push({ mesh: m, basePos: [x, y, z], phase: idx * 0.7 });
    });
    scene.add(cloudGroup);

    // 2. Central Cracked Red Security Shield & Padlock
    const shieldGroup = new THREE.Group();
    shieldGroup.position.set(0, -0.25, 0.25);

    const shieldGeo = new THREE.ExtrudeGeometry(createShieldShape(0.88), {
      depth: 0.18,
      bevelEnabled: true,
      bevelThickness: 0.05,
      bevelSize: 0.05,
      bevelSegments: 3,
    });
    const shieldMat = new THREE.MeshPhysicalMaterial({
      color: 0x991b1b,
      emissive: 0x7f1d1d,
      emissiveIntensity: 0.45,
      roughness: 0.28,
      metalness: 0.55,
      clearcoat: 0.85,
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.position.z = -0.09;
    shieldGroup.add(shieldMesh);

    // Glowing crack veins across shield face
    const crackMat = new THREE.MeshStandardMaterial({
      color: 0xfca5a5,
      emissive: 0xef4444,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });
    const crackGroup = new THREE.Group();
    const crackSegments: Array<[number, number, number, number]> = [
      [0.02, 0.55, 0.06, -0.45],
      [-0.14, 0.22, 0.06, 0.52],
      [0.08, -0.15, 0.06, -0.35],
      [-0.08, -0.52, 0.06, 0.4],
      [0.24, 0.15, 0.06, 1.05],
      [-0.3, -0.18, 0.06, -0.95],
    ];
    for (const [cx, cy, len, rot] of crackSegments) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(len, 0.46, 0.04), crackMat);
      bar.position.set(cx, cy, 0.145);
      bar.rotation.z = rot;
      crackGroup.add(bar);
    }
    shieldGroup.add(crackGroup);

    // Center padlock icon over shield
    const lockBody = new THREE.Mesh(
      new THREE.ExtrudeGeometry(createRoundedRectShape(0.54, 0.44, 0.08), {
        depth: 0.14,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 2,
      }),
      new THREE.MeshStandardMaterial({
        color: 0xfef2f2,
        emissive: 0xdc2626,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.6,
      }),
    );
    lockBody.position.set(0, -0.12, 0.16);
    shieldGroup.add(lockBody);

    const shackleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.15, 0.08, 0.22),
      new THREE.Vector3(-0.15, 0.36, 0.22),
      new THREE.Vector3(0, 0.45, 0.22),
      new THREE.Vector3(0.15, 0.36, 0.22),
      new THREE.Vector3(0.15, 0.16, 0.22),
    ]);
    const shackleMesh = new THREE.Mesh(
      new THREE.TubeGeometry(shackleCurve, 24, 0.045, 12, false),
      new THREE.MeshStandardMaterial({ color: 0xfca5a5, roughness: 0.25, metalness: 0.85 }),
    );
    shieldGroup.add(shackleMesh);
    scene.add(shieldGroup);

    // 3. 18 Translucent Glowing Digital File Cards Rising Into Storm Cloud
    const fileTex = createMedicalCardTexture();
    fileTex.anisotropy = maxAnisotropy;
    const fileGeo = new THREE.BoxGeometry(0.46, 0.58, 0.025);
    const fileMat = new THREE.MeshStandardMaterial({
      map: fileTex,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.55,
      transparent: true,
      opacity: 0.88,
      roughness: 0.25,
      metalness: 0.15,
    });

    interface FloatingFile {
      mesh: THREE.Mesh;
      laneX: number;
      laneZ: number;
      speed: number;
      phase: number;
      swirlAmp: number;
    }

    const files: FloatingFile[] = [];
    for (let i = 0; i < 18; i++) {
      const mesh = new THREE.Mesh(fileGeo, fileMat);
      const side = i % 2 === 0 ? -1 : 1;
      const laneX = side * (0.9 + ((i * 0.67) % 2.9));
      const laneZ = -1.1 + ((i * 0.53) % 2.2);
      files.push({
        mesh,
        laneX,
        laneZ,
        speed: 0.42 + (i % 4) * 0.07,
        phase: (i / 18) * 1.0,
        swirlAmp: 0.25 + (i % 3) * 0.12,
      });
      scene.add(mesh);
    }

    updateFn = (t: number) => {
      // Smooth steady camera glide (zero jitter)
      camera.position.z = 9.6 - t * 0.14;
      camera.position.y = 0.4 + Math.sin(t * 0.35) * 0.06;
      camera.lookAt(0, 0.38, 0);

      // Billowing cloud & lightning pulse
      for (const lobe of cloudLobes) {
        lobe.mesh.position.y = lobe.basePos[1] + Math.sin(t * 0.9 + lobe.phase) * 0.06;
        lobe.mesh.position.x = lobe.basePos[0] + Math.cos(t * 0.6 + lobe.phase) * 0.04;
      }
      const pulseA = Math.max(0, Math.sin(t * 3.1) * Math.sin(t * 7.3));
      const pulseB = Math.max(0, Math.cos(t * 2.4 + 1.2) * Math.sin(t * 6.1));
      cloudLightningA.intensity = 0.6 + pulseA * 5.2;
      cloudLightningB.intensity = 0.5 + pulseB * 4.4;

      // Cracked shield subtle pulse & tilt
      shieldGroup.position.y = -0.28 + Math.sin(t * 1.4) * 0.05;
      shieldGroup.rotation.y = Math.sin(t * 0.7) * 0.08;
      crackMat.emissiveIntensity = 1.6 + Math.sin(t * 2.6) * 0.75 + t * 0.12;
      redAlarmLight.intensity = 2.2 + Math.sin(t * 2.6) * 0.7;

      // Digital files curving upward into the dark cloud
      for (const f of files) {
        const prog = (f.phase + t * 0.145 * f.speed * 2.2) % 1;
        const y = -2.45 + prog * 4.75;
        const funnel = 1 - Math.pow(prog, 1.35) * 0.65;
        const x = f.laneX * funnel + Math.sin(t * 1.6 + f.phase * 12) * f.swirlAmp * funnel;
        const z = f.laneZ * funnel - prog * 0.9;
        f.mesh.position.set(x, y, z);
        f.mesh.rotation.y = Math.sin(t * 1.1 + f.phase * 9) * 0.55;
        f.mesh.rotation.z = -x * 0.14;
        f.mesh.rotation.x = -0.18 + prog * 0.35;
        const s = prog > 0.82 ? Math.max(0.05, (1 - prog) / 0.18) : Math.min(1, prog / 0.12);
        f.mesh.scale.setScalar(s);
      }
    };
  } else if (sceneId === 4) {
    // =========================================================================
    // SCENE 04: Raspberry Pi 5 Slow Rotation & Green LED Blinking on Clinic Desk
    // =========================================================================
    const bgColor = new THREE.Color(0xeef4ef);
    scene.background = bgColor;
    scene.fog = new THREE.Fog(0xeef4ef, 10, 24);

    camera.position.set(2.3, 2.35, 5.2);
    camera.lookAt(-0.35, 0.65, 0);

    const hemi = new THREE.HemisphereLight(0xffffff, 0xcbd5c0, 0.95);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 2.1);
    keyLight.position.set(4.5, 6.5, 4.2);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(2048, 2048);
      keyLight.shadow.camera.left = -4;
      keyLight.shadow.camera.right = 4;
      keyLight.shadow.camera.top = 4;
      keyLight.shadow.camera.bottom = -4;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xd1fae5, 0.85);
    rimLight.position.set(-4, 3, -3);
    scene.add(rimLight);

    // Clean modern clinic desk surface
    const deskMat = new THREE.MeshStandardMaterial({
      color: 0xf7faf7,
      roughness: 0.55,
      metalness: 0.04,
    });
    const desk = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), deskMat);
    desk.rotation.x = -Math.PI / 2;
    desk.receiveShadow = true;
    scene.add(desk);

    // Soft radial contact shadow under unit & turntable
    const shadowTex = createRadialShadowTexture('rgba(30, 58, 33, 0.25)');
    const contactPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(5.6, 4.2),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    );
    contactPlane.rotation.x = -Math.PI / 2;
    contactPlane.position.set(-0.3, 0.015, 0);
    scene.add(contactPlane);

    // Turntable showcase group
    const turntable = new THREE.Group();
    turntable.position.set(0.3, 0, 0);

    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(1.75, 1.85, 0.09, 48),
      new THREE.MeshStandardMaterial({ color: 0xe2ebe2, roughness: 0.4, metalness: 0.12 }),
    );
    plinth.position.y = 0.045;
    plinth.receiveShadow = true;
    turntable.add(plinth);

    const plinthRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.78, 0.022, 12, 64),
      new THREE.MeshStandardMaterial({
        color: 0x3b6e44,
        roughness: 0.3,
        metalness: 0.4,
      }),
    );
    plinthRing.rotation.x = Math.PI / 2;
    plinthRing.position.y = 0.09;
    turntable.add(plinthRing);

    const { root: rpiUnit, ledMaterial, ledLight } = buildRaspberryPi5Unit({
      includeStandAndTablet: true,
      maxAnisotropy,
    });
    rpiUnit.position.y = 0.09;
    turntable.add(rpiUnit);
    scene.add(turntable);

    updateFn = (t: number) => {
      // Smooth 1x continuous slow turntable rotation (~52 deg over 8s, zero jitter)
      turntable.rotation.y = -0.35 + (t / 8.0) * (Math.PI * 0.34);

      // Gentle studio camera arc complementary to turntable
      camera.position.x = 2.3 - (t / 8.0) * 0.45;
      camera.position.y = 2.35 + Math.sin(t * 0.5) * 0.05;
      camera.lookAt(-0.2, 0.7, 0);

      // Emerald green LED soft double-heartbeat blink + realistic surface reflection
      const pulse = Math.pow(0.5 + 0.5 * Math.sin(t * Math.PI * 1.5), 2.2);
      ledMaterial.emissiveIntensity = 0.35 + pulse * 3.4;
      ledLight.intensity = 0.25 + pulse * 2.4;
    };
  } else {
    // =========================================================================
    // SCENE 05: Pulsing Emerald Security Dome & Digital Padlock Snap Shut
    // =========================================================================
    const bgColor = new THREE.Color(0xeaf3ec);
    scene.background = bgColor;
    scene.fog = new THREE.Fog(0xeaf3ec, 11, 26);

    camera.position.set(0.55, 2.45, 7.65);
    camera.lookAt(0, 1.28, 0);

    const hemi = new THREE.HemisphereLight(0xffffff, 0xb7d4be, 0.95);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.9);
    keyLight.position.set(4, 7, 5);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(2048, 2048);
      keyLight.shadow.bias = -0.0005;
    }
    scene.add(keyLight);

    const emeraldCoreLight = new THREE.PointLight(0x10b981, 2.6, 8, 2);
    emeraldCoreLight.position.set(0, 1.4, 0.6);
    scene.add(emeraldCoreLight);

    // Desk
    const desk = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.MeshStandardMaterial({ color: 0xf4f8f4, roughness: 0.55, metalness: 0.04 }),
    );
    desk.rotation.x = -Math.PI / 2;
    desk.receiveShadow = true;
    scene.add(desk);

    const shadowTex = createRadialShadowTexture('rgba(16, 185, 129, 0.24)');
    const contactPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(6.2, 6.2),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    );
    contactPlane.rotation.x = -Math.PI / 2;
    contactPlane.position.y = 0.015;
    scene.add(contactPlane);

    // Base Raspberry Pi 5 unit centered safely inside the dome
    const { root: rpiUnit, ledMaterial, ledLight } = buildRaspberryPi5Unit({
      includeStandAndTablet: false,
      maxAnisotropy,
    });
    rpiUnit.scale.setScalar(0.82);
    rpiUnit.position.set(0, 0, 0);
    scene.add(rpiUnit);

    // Base glow ring & expanding pulse ring on desk
    const baseRingMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 1.4,
      roughness: 0.25,
    });
    const baseRing = new THREE.Mesh(new THREE.TorusGeometry(2.15, 0.035, 14, 72), baseRingMat);
    baseRing.rotation.x = Math.PI / 2;
    baseRing.position.y = 0.035;
    scene.add(baseRing);

    const pulseRingMat = new THREE.MeshBasicMaterial({
      color: 0x34d399,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
    });
    const pulseRing = new THREE.Mesh(new THREE.RingGeometry(2.12, 2.26, 64), pulseRingMat);
    pulseRing.rotation.x = -Math.PI / 2;
    pulseRing.position.y = 0.025;
    pulseRing.renderOrder = 2;
    scene.add(pulseRing);

    // Multi-layer Emerald Security Dome (Outer translucent shell + inner geodesic lattice)
    const domeGeo = new THREE.SphereGeometry(2.15, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const domeMat = new THREE.MeshPhysicalMaterial({
      color: 0x34d399,
      emissive: 0x059669,
      emissiveIntensity: 0.28,
      roughness: 0.12,
      metalness: 0.05,
      transparent: true,
      opacity: isSoftwareGl ? 0.28 : 0.24,
      clearcoat: 1.0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const domeMesh = new THREE.Mesh(domeGeo, domeMat);
    domeMesh.renderOrder = 4;
    scene.add(domeMesh);

    const latticeGeo = new THREE.IcosahedronGeometry(2.08, 2);
    // Keep upper hemisphere visually clean with wireframe edges
    const latticeEdges = new THREE.EdgesGeometry(latticeGeo);
    const latticeMat = new THREE.LineBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.34,
      depthWrite: false,
    });
    const latticeMesh = new THREE.LineSegments(latticeEdges, latticeMat);
    latticeMesh.position.y = 0.02;
    latticeMesh.renderOrder = 3;
    // Clip visual lattice below ground via subtle clip or scale hemisphere
    const hemiLatticeGeo = new THREE.SphereGeometry(
      2.09,
      20,
      10,
      0,
      Math.PI * 2,
      0,
      Math.PI * 0.5,
    );
    const hemiLattice = new THREE.LineSegments(
      new THREE.WireframeGeometry(hemiLatticeGeo),
      latticeMat,
    );
    hemiLattice.renderOrder = 3;
    scene.add(hemiLattice);
    // Dispose unused full sphere edges immediately
    latticeGeo.dispose();
    latticeEdges.dispose();

    // 3D Glowing Emerald Padlock Centered Above Device (Shackle closes smoothly)
    const lockGroup = new THREE.Group();
    lockGroup.position.set(0, 1.82, 0.65);
    lockGroup.scale.setScalar(0.9);

    const lockBodyGeo = new THREE.ExtrudeGeometry(
      createRoundedRectShape(0.86, 0.72, 0.14),
      { depth: 0.24, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 3 },
    );
    const lockBodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x059669,
      emissive: 0x10b981,
      emissiveIntensity: 0.45,
      roughness: 0.22,
      metalness: 0.65,
      clearcoat: 0.9,
    });
    const lockBody = new THREE.Mesh(lockBodyGeo, lockBodyMat);
    lockBody.position.z = -0.12;
    lockGroup.add(lockBody);

    // Keyhole emblem inside lock body (pure geometric shapes, zero text)
    const keyholeMat = new THREE.MeshStandardMaterial({
      color: 0xecfdf5,
      emissive: 0x6ee7b7,
      emissiveIntensity: 1.8,
      roughness: 0.15,
    });
    const keyholeTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.085, 0.085, 0.05, 20),
      keyholeMat,
    );
    keyholeTop.rotation.x = Math.PI / 2;
    keyholeTop.position.set(0, 0.06, 0.17);
    lockGroup.add(keyholeTop);

    const keyholeStem = new THREE.Mesh(new THREE.BoxGeometry(0.075, 0.18, 0.05), keyholeMat);
    keyholeStem.position.set(0, -0.08, 0.17);
    lockGroup.add(keyholeStem);

    // Animated Lock Shackle
    const shackleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.24, -0.05, 0),
      new THREE.Vector3(-0.24, 0.42, 0),
      new THREE.Vector3(-0.14, 0.6, 0),
      new THREE.Vector3(0, 0.66, 0),
      new THREE.Vector3(0.14, 0.6, 0),
      new THREE.Vector3(0.24, 0.42, 0),
      new THREE.Vector3(0.24, 0.02, 0),
    ]);
    const shackleMesh = new THREE.Mesh(
      new THREE.TubeGeometry(shackleCurve, 32, 0.068, 16, false),
      new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.18,
        metalness: 0.92,
      }),
    );
    shackleMesh.position.set(0, 0.34, 0);
    lockGroup.add(shackleMesh);

    // Snap lock shockwave ring
    const snapRingMat = new THREE.MeshBasicMaterial({
      color: 0x6ee7b7,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const snapRing = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.68, 48), snapRingMat);
    snapRing.position.set(0, 0.05, 0.2);
    snapRing.renderOrder = 5;
    lockGroup.add(snapRing);

    scene.add(lockGroup);

    // Outer Disconnected Offline Emblem (fades cleanly as security dome locks)
    const offlineGroup = new THREE.Group();
    offlineGroup.position.set(-2.95, 1.55, -0.5);
    const offlineArcMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.5,
      transparent: true,
      opacity: 0.8,
    });
    for (const radius of [0.24, 0.4, 0.56]) {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(radius, 0.032, 10, 24, Math.PI * 0.65),
        offlineArcMat,
      );
      arc.rotation.z = Math.PI * 0.175;
      offlineGroup.add(arc);
    }
    const slashBar = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.055, 0.055),
      new THREE.MeshStandardMaterial({
        color: 0xef4444,
        emissive: 0xdc2626,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.85,
      }),
    );
    slashBar.rotation.z = Math.PI / 4;
    slashBar.position.y = 0.25;
    offlineGroup.add(slashBar);
    scene.add(offlineGroup);

    updateFn = (t: number) => {
      // Smooth steady camera orbit with generous headroom for open & locked shackle
      camera.position.x = 0.55 - Math.sin((t / 8) * Math.PI) * 0.65;
      camera.position.y = 2.45;
      camera.position.z = 7.65 - (t / 8) * 0.35;
      camera.lookAt(0, 1.28, 0);

      // Dome breathing & inner lattice rotation
      const breath = 1 + Math.sin(t * 2.2) * 0.018;
      domeMesh.scale.set(breath, breath, breath);
      domeMat.emissiveIntensity = 0.22 + (0.5 + 0.5 * Math.sin(t * 2.2)) * 0.22;
      hemiLattice.rotation.y = t * 0.16;

      // Desk pulse wave
      const waveProg = (t * 0.45) % 1;
      const waveScale = 1 + waveProg * 0.65;
      pulseRing.scale.set(waveScale, waveScale, 1);
      pulseRingMat.opacity = (1 - waveProg) * 0.55;

      // LED heartbeat
      const ledPulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
      ledMaterial.emissiveIntensity = 0.6 + ledPulse * 2.4;
      ledLight.intensity = 0.5 + ledPulse * 1.8;

      // Shackle smoothly descends and locks shut between t=1.6s and t=3.6s
      const closeAlpha = THREE.MathUtils.smoothstep(t, 1.6, 3.6);
      shackleMesh.position.y = THREE.MathUtils.lerp(0.50, 0.22, closeAlpha);
      lockGroup.position.y = 1.82 + Math.sin(t * 1.5) * 0.035;

      // Shockwave ring on lock closure at t >= 3.55s
      if (t >= 3.55 && t <= 5.1) {
        const snapP = (t - 3.55) / 1.55;
        snapRing.scale.setScalar(1 + snapP * 2.2);
        snapRingMat.opacity = (1 - snapP) * 0.9;
        emeraldCoreLight.intensity = 2.6 + (1 - snapP) * 3.5;
        lockBodyMat.emissiveIntensity = 0.45 + (1 - snapP) * 1.1;
      } else {
        snapRingMat.opacity = 0;
        emeraldCoreLight.intensity = 2.6 + Math.sin(t * 2.2) * 0.4;
        lockBodyMat.emissiveIntensity = t >= 3.6 ? 0.68 : 0.42;
      }

      // Fade out external offline signal gently
      const fadeOut = 1 - THREE.MathUtils.smoothstep(t, 2.5, 6.0) * 0.65;
      offlineArcMat.opacity = 0.8 * fadeOut;
      (slashBar.material as THREE.MeshStandardMaterial).opacity = 0.85 * fadeOut;
      offlineGroup.position.y = 1.55 + Math.sin(t * 1.1) * 0.04;
    };
  }

  // Warm up shaders when GPU is present
  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }
  updateFn(0);
  renderer.render(scene, camera);

  return {
    scene,
    camera,
    renderer,
    isSoftwareGl,
    updateAt: updateFn,
    renderFrame: (timeSec: number) => {
      updateFn(timeSec);
      renderer.render(scene, camera);
    },
    resize: (w: number, h: number) => {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    },
    dispose: () => {
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.LineSegments) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => {
              m.dispose();
            });
          } else {
            obj.material.dispose();
          }
        }
      });
      envTex.dispose();
      renderer.dispose();
    },
  };
}

// Keep unused module-scope helpers referenced for strict TS checks
void _tmpVec;
void _tmpQuat;
void _tmpMat;
