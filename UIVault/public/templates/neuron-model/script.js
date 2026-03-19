import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const CONFIG = {
  points: 150000, dt: 0.008, scale: 9.0,
  a: 1.0, b: 3.0, c: 1.0, d: 5.0,
  r: 0.006, s: 4.0, x1: -1.6, I: 3.0
};

const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.012);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(40, 15, 60);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ReinhardToneMapping;
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.8;
controls.maxDistance = 150;
controls.minDistance = 10;

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.15;
bloomPass.strength = 0.8;
bloomPass.radius = 0.4;

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// === Attractor Data ===
function createAttractorData() {
  const positions = [], colors = [], lineDistances = [], particleOffsets = [], particleSizes = [];
  let x = -1, y = 0, z = 0;
  const color = new THREE.Color();
  let totalDist = 0;

  for (let i = 0; i < CONFIG.points; i++) {
    const dx = y - CONFIG.a * Math.pow(x, 3) + CONFIG.b * Math.pow(x, 2) - z + CONFIG.I;
    const dy = CONFIG.c - CONFIG.d * Math.pow(x, 2) - y;
    const dz = CONFIG.r * (CONFIG.s * (x - CONFIG.x1) - z);
    const prevX = x * CONFIG.scale, prevY = y * CONFIG.scale * 0.6, prevZ = z * CONFIG.scale * 2.0;
    x += dx * CONFIG.dt; y += dy * CONFIG.dt; z += dz * CONFIG.dt;
    const vx = y * CONFIG.scale * 0.6, vy = x * CONFIG.scale, vz = z * CONFIG.scale * 2.0;
    positions.push(vx, vy, vz);
    if (i > 0) {
      const dist = Math.sqrt(Math.pow(vx - prevY, 2) + Math.pow(vy - prevX, 2) + Math.pow(vz - prevZ, 2));
      totalDist += dist * 0.05;
    }
    lineDistances.push(totalDist);
    const normalizedHeight = (x + 2.0) / 4.0;
    color.setHSL(0.6 - (normalizedHeight * 0.4), 0.8, 0.5);
    colors.push(color.r, color.g, color.b);
    particleOffsets.push(Math.random() * 100);
    particleSizes.push((Math.random() > 0.95 || normalizedHeight > 0.6) ? Math.random() * 1.5 + (normalizedHeight * 2.0) : 0.0);
  }
  return { positions, colors, lineDistances, particleOffsets, particleSizes };
}

const data = createAttractorData();

const lineGeo = new THREE.BufferGeometry();
lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
lineGeo.setAttribute('color', new THREE.Float32BufferAttribute(data.colors, 3));
lineGeo.setAttribute('lineDistance', new THREE.Float32BufferAttribute(data.lineDistances, 1));
lineGeo.computeBoundingSphere();
const center = lineGeo.boundingSphere.center;
lineGeo.translate(-center.x, -center.y, -center.z);

const lineMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0.0 }, uEnergyColor: { value: new THREE.Color(0x00d2ff) } },
  vertexShader: document.getElementById('vertexshader').textContent,
  fragmentShader: document.getElementById('fragmentshader').textContent,
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
});
scene.add(new THREE.Line(lineGeo, lineMat));

const particlesGeo = new THREE.BufferGeometry();
particlesGeo.setAttribute('position', lineGeo.getAttribute('position'));
particlesGeo.setAttribute('color', lineGeo.getAttribute('color'));
particlesGeo.setAttribute('size', new THREE.Float32BufferAttribute(data.particleSizes, 1));
particlesGeo.setAttribute('offset', new THREE.Float32BufferAttribute(data.particleOffsets, 1));

const particlesMat = new THREE.ShaderMaterial({
  uniforms: { time: { value: 0.0 } },
  vertexShader: document.getElementById('particleVertex').textContent,
  fragmentShader: document.getElementById('particleFragment').textContent,
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
});
scene.add(new THREE.Points(particlesGeo, particlesMat));

// === Starfield ===
function createStarfield() {
  const starGeo = new THREE.BufferGeometry();
  const pos = [], cols = [];
  const c = new THREE.Color();
  for (let i = 0; i < 3000; i++) {
    const r = 200 + Math.random() * 300;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi));
    const type = Math.random();
    c.setHex(type > 0.9 ? 0xaaaaaa : type > 0.6 ? 0x4444ff : 0x221144);
    cols.push(c.r, c.g, c.b);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  starGeo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  return new THREE.Points(starGeo, new THREE.PointsMaterial({
    size: 1.5, vertexColors: true, transparent: true, opacity: 0.6,
    sizeAttenuation: true, blending: THREE.AdditiveBlending
  }));
}
const stars = createStarfield();
scene.add(stars);

// === Themes ===
const themes = [
  { primary: 0x00d2ff, secondary: 0xff00aa, bloomStr: 0.8, uiBorder: '#00d2ff', grad: 'radial-gradient(circle at center, #1a1a2e 0%, #000000 100%)' },
  { primary: 0xffaa00, secondary: 0xff4400, bloomStr: 1.0, uiBorder: '#ffaa00', grad: 'radial-gradient(circle at center, #2e1a1a 0%, #000000 100%)' },
  { primary: 0x55ff55, secondary: 0x00aa00, bloomStr: 0.6, uiBorder: '#55ff55', grad: 'radial-gradient(circle at center, #1a2e1a 0%, #000000 100%)' }
];

window.setTheme = (index) => {
  const t = themes[index];
  document.querySelectorAll('.btn').forEach((b, i) => {
    b.classList.remove('active');
    b.style.borderColor = 'rgba(255,255,255,0.15)';
    b.style.color = '#fff';
    b.style.boxShadow = 'none';
    if (i === index) {
      b.classList.add('active');
      b.style.borderColor = t.uiBorder;
      b.style.color = t.uiBorder;
      b.style.boxShadow = `0 0 15px ${t.uiBorder}40`;
    }
  });
  document.getElementById('ui-container').style.borderLeftColor = t.uiBorder;
  document.getElementById('canvas-container').style.background = t.grad;
  lineMat.uniforms.uEnergyColor.value.setHex(t.primary);
  bloomPass.strength = t.bloomStr;

  const colors = lineGeo.attributes.color.array;
  const tempColor = new THREE.Color();
  for (let i = 0; i < CONFIG.points; i++) {
    const yVal = lineGeo.attributes.position.array[i * 3 + 1];
    const h = (yVal / CONFIG.scale + 2.0) / 4.0;
    tempColor.setHex(t.secondary).lerp(new THREE.Color(t.primary), h);
    colors[i * 3] = tempColor.r; colors[i * 3 + 1] = tempColor.g; colors[i * 3 + 2] = tempColor.b;
  }
  lineGeo.attributes.color.needsUpdate = true;
  particlesGeo.attributes.color.needsUpdate = true;
};

// === Animate ===
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  lineMat.uniforms.time.value += delta;
  particlesMat.uniforms.time.value += delta;
  stars.rotation.y -= delta * 0.05;
  controls.update();
  composer.render();
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

animate();
