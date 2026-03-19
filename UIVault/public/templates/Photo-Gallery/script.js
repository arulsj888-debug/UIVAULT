import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// === 1. SCENE SETUP ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
camera.position.set(0, 100, 120);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 50;
controls.maxDistance = 500;
controls.maxPolarAngle = Math.PI / 2;

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(20, 80, 50);
scene.add(dirLight);

// === 2. CUBE GENERATION ===
const cols = 12;
const rows = 8;
const cubeSize = 10;
const gap = 0.5;
const step = cubeSize + gap;

const gridWidth = cols * step - gap;
const gridDepth = rows * step - gap;
const startX = -gridWidth / 2 + cubeSize / 2;
const startZ = -gridDepth / 2 + cubeSize / 2;

const cubes = [];
const textureLoader = new THREE.TextureLoader();
const sideMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });
const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

for (let i = 0; i < cols; i++) {
  for (let j = 0; j < rows; j++) {
    const seed = `img_${i}_${j}`;
    const thumbUrl = `https://picsum.photos/seed/${seed}/200/200`;
    const fullUrl = `https://picsum.photos/seed/${seed}/1200/800`;

    const texture = textureLoader.load(thumbUrl);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const topMaterial = new THREE.MeshLambertMaterial({ map: texture });
    const materials = [sideMaterial, sideMaterial, topMaterial, sideMaterial, sideMaterial, sideMaterial];

    const cube = new THREE.Mesh(geometry, materials);
    cube.position.x = startX + i * step;
    cube.position.z = startZ + j * step;
    cube.position.y = 0;
    cube.userData = { targetY: 0, fullUrl };

    scene.add(cube);
    cubes.push(cube);
  }
}

// === 3. RAYCASTING ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(9999, 9999);
let hoveredCube = null;

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
});

// === 4. LIGHTBOX ===
const mouseDownPos = new THREE.Vector2();

window.addEventListener('mousedown', (event) => {
  mouseDownPos.x = event.clientX;
  mouseDownPos.y = event.clientY;
});

const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const closeBtn = document.getElementById('close-btn');

function openLightbox(url) {
  lightboxImg.src = url;
  lightbox.style.display = 'flex';
  requestAnimationFrame(() => lightbox.classList.add('active'));
}

function closeLightbox() {
  lightbox.classList.remove('active');
  setTimeout(() => {
    lightbox.style.display = 'none';
    lightboxImg.src = '';
  }, 300);
}

window.addEventListener('click', (event) => {
  const dx = event.clientX - mouseDownPos.x;
  const dy = event.clientY - mouseDownPos.y;
  if (Math.sqrt(dx * dx + dy * dy) < 5 && hoveredCube) {
    openLightbox(hoveredCube.userData.fullUrl);
  }
});

lightbox.addEventListener('click', (e) => { if (e.target !== lightboxImg) closeLightbox(); });
closeBtn.addEventListener('click', closeLightbox);

// === 5. ANIMATION LOOP ===
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(cubes);
  hoveredCube = intersects.length > 0 ? intersects[0].object : null;

  document.body.style.cursor = hoveredCube ? 'pointer' : 'default';

  cubes.forEach(cube => {
    cube.userData.targetY = cube === hoveredCube ? 5 : 0;
    cube.position.y += (cube.userData.targetY - cube.position.y) * 0.15;
  });

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
