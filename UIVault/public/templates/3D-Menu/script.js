import * as THREE from 'https://esm.sh/three@0.160.0?bundle';
import { OrbitControls } from 'https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js?bundle';
import GUI from 'https://esm.sh/lil-gui@0.19';

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#000');

const camera = new THREE.PerspectiveCamera(28, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, -5, 35);
camera.lookAt(0, 0, 0);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableRotate = false;
controls.enablePan = false;
controls.enableDamping = true;

const params = {
  background: '#000000',
  textColor: '#ffffff',
  fontPx: 192,
  planeH: 2.6,
  letterSpacing: -0.28,
  gap: 0.6,
  curveRadius: 6.25,
  cameraZoom: 0.2,
  autoRotate: 8.0,
  minBackOpacity: 0.18,
  flipBackText: true
};

const items = [
  { label: 'Home',    href: 'https://www.google.com/' },
  { label: 'About',   href: 'https://www.google.com/' },
  { label: 'Work',    href: 'https://www.google.com/' },
  { label: 'Blog',    href: 'https://www.google.com/' },
  { label: 'Team',    href: 'https://www.google.com/' },
  { label: 'Contact', href: 'https://www.google.com/' },
];

// ---- canvas glyph → texture
function makeGlyphTexture(ch, { size = params.fontPx, color = params.textColor } = {}) {
  const fam = 'Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif';
  const pad = Math.floor(size * 0.2);
  const m = document.createElement('canvas').getContext('2d');
  m.font = `800 ${size}px ${fam}`;
  const w = Math.max(8, Math.ceil(m.measureText(ch).width + pad * 2));
  const h = Math.ceil(size * 1.6);
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.clearRect(0, 0, w, h);
  g.fillStyle = color;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = `800 ${size}px ${fam}`;
  g.fillText(ch, w / 2, h / 2 + size * 0.06);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy?.() || 1, 8);
  return { texture: tex, w, h };
}

// ---- shaders
const shared = { uBend: { value: 0.0 } };

const vshader = /* glsl */`
  varying vec2 vUv;
  uniform float uBend;
  void main() {
    vUv = uv;
    vec3 p = position;
    float k = uBend;
    if (abs(k) > 1e-6) {
      float r = 1.0 / k;
      float th = p.x * k;
      p.x = sin(th) * r;
      p.z += r - cos(th) * r;
    }
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fshader = /* glsl */`
  varying vec2 vUv;
  uniform sampler2D map;
  uniform float uOpacity;
  uniform float uMirror;
  void main() {
    vec2 uv = mix(vUv, vec2(1.0 - vUv.x, vUv.y), uMirror);
    vec4 c = texture2D(map, uv);
    gl_FragColor = vec4(c.rgb, c.a * uOpacity);
  }
`;

// ---- build scene
const belt = new THREE.Group();
scene.add(belt);
scene.add(new THREE.AmbientLight(0xffffff, 1));

const words = [];
const H = params.planeH;

function buildLayer(label, mirrorFlag) {
  const arr = [];
  for (const ch of label) {
    const { texture, w: tw, h: th } = makeGlyphTexture(ch);
    const aspect = tw / th, W = H * aspect;
    const geo = new THREE.PlaneGeometry(W, H, 64, 1);
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: texture },
        uBend: shared.uBend,
        uOpacity: { value: 1.0 },
        uMirror: { value: mirrorFlag ? 1.0 : 0.0 }
      },
      vertexShader: vshader,
      fragmentShader: fshader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { ch, W, H };
    arr.push({ mesh, mat, W, H, offset: 0 });
  }
  return arr;
}

for (const it of items) {
  const group = new THREE.Group();
  belt.add(group);
  const front = buildLayer(it.label, false);
  const back  = buildLayer(it.label, true);
  front.forEach(l => group.add(l.mesh));
  back.forEach(l => group.add(l.mesh));
  words.push({ group, front, back, width: 0, href: it.href, blend: 0 });
}

// ---- layout
function measureLayer(layer) {
  let x = 0;
  for (let i = 0; i < layer.length; i++) {
    const L = layer[i];
    L.offset = x + L.W / 2;
    x += L.W;
    if (i < layer.length - 1) x += params.letterSpacing * H;
  }
  return x;
}

function layout() {
  const r = Math.max(0, params.curveRadius);
  shared.uBend.value = r > 1e-4 ? 1.0 / r : 0.0;

  for (const w of words) {
    const wf = measureLayer(w.front);
    measureLayer(w.back);
    w.width = wf;
  }

  const total = words.reduce((s, w) => s + w.width, 0) + (words.length - 1) * params.gap * H;
  let s = -total / 2;

  for (let wi = 0; wi < words.length; wi++) {
    const w = words[wi];
    const wordMid = s + w.width / 2;

    const place = (lx) => {
      if (shared.uBend.value === 0) {
        return { pos: new THREE.Vector3(wordMid + lx, 0, 0), rotY: 0 };
      } else {
        const rad = 1.0 / shared.uBend.value;
        const th  = (wordMid + lx) / rad;
        return { pos: new THREE.Vector3(Math.sin(th) * rad, 0, Math.cos(th) * rad), rotY: th };
      }
    };

    for (const L of w.front) {
      const P = place(L.offset - w.width / 2);
      L.mesh.position.copy(P.pos);
      L.mesh.rotation.set(0, P.rotY, 0);
      L.mesh.position.z += 0.0005;
    }

    for (const L of w.back) {
      const mirroredLocal = -(L.offset - w.width / 2);
      const P = place(mirroredLocal);
      L.mesh.position.copy(P.pos);
      L.mesh.rotation.set(0, P.rotY, 0);
      L.mesh.position.z -= 0.0005;
    }

    s += w.width + (wi < words.length - 1 ? params.gap * H : 0);
  }
}

layout();

// ---- interaction
let dragging = false, lastX = 0, vel = 0, downAt = 0, moved = false;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function rayHit(e) {
  const r = renderer.domElement.getBoundingClientRect();
  mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const meshes = words.flatMap(w => [...w.front, ...w.back].map(L => L.mesh));
  const h = raycaster.intersectObjects(meshes, false);
  return h[0] || null;
}

let hoveredWord = -1;
renderer.domElement.style.cursor = 'grab';

renderer.domElement.addEventListener('pointerdown', e => {
  dragging = true; lastX = e.clientX; vel = 0;
  downAt = performance.now(); moved = false;
  renderer.domElement.style.cursor = 'grabbing';
  hoveredWord = -1;
});

renderer.domElement.addEventListener('pointermove', e => {
  if (!dragging) {
    const hit = rayHit(e);
    if (hit) {
      hoveredWord = words.findIndex(w => w.front.some(L => L.mesh === hit.object) || w.back.some(L => L.mesh === hit.object));
      renderer.domElement.style.cursor = 'pointer';
    } else {
      hoveredWord = -1;
      renderer.domElement.style.cursor = 'grab';
    }
  }
  if (!dragging) return;
  const dx = e.clientX - lastX; lastX = e.clientX;
  const d = dx / innerWidth * Math.PI * 1.8;
  belt.rotation.y -= d;
  vel = -d / (1 / 60);
  if (Math.abs(dx) > 3) moved = true;
});

addEventListener('pointerup', () => { dragging = false; renderer.domElement.style.cursor = 'grab'; });

renderer.domElement.addEventListener('click', e => {
  if (moved && performance.now() - downAt > 200) return;
  const hit = rayHit(e);
  if (hit) window.open('https://www.google.com/', '_blank');
});

// ---- GUI
const gui = new GUI({ title: 'Settings' });
gui.addColor(params, 'background').name('Background').onChange(v => scene.background.set(v));
gui.addColor(params, 'textColor').name('Text Color').onChange(v => {
  for (const w of words) {
    for (const L of [...w.front, ...w.back]) {
      const { texture } = makeGlyphTexture(L.mesh.userData.ch, { color: v, size: params.fontPx });
      L.mat.uniforms.map.value.dispose?.();
      L.mat.uniforms.map.value = texture;
      L.mat.needsUpdate = true;
    }
  }
});
gui.add(params, 'curveRadius', 0.0, 12.0, 0.05).name('Curve radius').onChange(layout);
gui.add(params, 'letterSpacing', -0.6, 0.8, 0.01).name('Letter Spacing').onChange(layout);
gui.add(params, 'gap', 0.0, 2.0, 0.01).name('Gap').onChange(layout);
gui.add(params, 'cameraZoom', 0.0, 2.0, 0.01).name('Camera Zoom').onChange(v => {
  camera.zoom = Math.max(0.01, v);
  camera.updateProjectionMatrix();
});
gui.add(params, 'autoRotate', -8, 8, 0.05).name('Auto Rotate');
gui.add(params, 'flipBackText').name('Flip Back Text').onChange(v => {
  for (const w of words)
    for (const L of w.back)
      L.mat.uniforms.uMirror.value = v ? 1.0 : 0.0;
});

// ---- render loop
const baseN = new THREE.Vector3(0, 0, 1);
const toCam = new THREE.Vector3();
const q = new THREE.Quaternion();
const wp = new THREE.Vector3();
let lastT = performance.now();
const BLEND_WIDTH = 0.18;

function tick(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000);
  lastT = now;

  if (!dragging) belt.rotation.y += THREE.MathUtils.degToRad(params.autoRotate) * dt;
  if (!dragging && Math.abs(vel) > 1e-4) {
    belt.rotation.y += vel * dt;
    vel *= Math.pow(0.06, dt);
  }

  for (let wi = 0; wi < words.length; wi++) {
    const w = words[wi];
    const mid = w.front[(w.front.length - 1) >> 1].mesh;
    mid.getWorldPosition(wp);
    toCam.copy(camera.position).sub(wp).normalize();
    mid.getWorldQuaternion(q);
    const dot = baseN.clone().applyQuaternion(q).dot(toCam);
    const target = params.flipBackText ? THREE.MathUtils.smoothstep(-dot, -BLEND_WIDTH, BLEND_WIDTH) : 0.0;
    w.blend += (target - w.blend) * Math.min(1, dt * 18);

    for (const pass of [0, 1]) {
      const layer = pass ? w.back : w.front;
      const weight = pass ? w.blend : (1 - w.blend);
      for (const L of layer) {
        const mesh = L.mesh, mat = L.mat;
        mesh.getWorldPosition(wp);
        toCam.copy(camera.position).sub(wp).normalize();
        mesh.getWorldQuaternion(q);
        const df = Math.max(0, baseN.clone().applyQuaternion(q).dot(toCam));
        let a = params.minBackOpacity + (1 - params.minBackOpacity) * df;
        if (hoveredWord === wi) a *= 0.6;
        mat.uniforms.uOpacity.value = a * weight;
        mesh.renderOrder = Math.round(df * 1000) + pass;
      }
    }
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

requestAnimationFrame(tick);

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});
