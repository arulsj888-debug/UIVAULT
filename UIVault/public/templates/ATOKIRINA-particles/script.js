import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import { HDRLoader } from "jsm/loaders/HDRLoader.js";

// Scene & Camera
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector(".webgl"),
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Particles
const particlesGroup = new THREE.Group();
scene.add(particlesGroup);

const groupCount = 3;
const particlesPerGroup = 30;
const palette = [
  new THREE.Color(0x00ffcc),
  new THREE.Color(0x00e5ff),
  new THREE.Color(0xffffff),
];

for (let g = 0; g < groupCount; g++) {
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.src = "https://cdn.jsdelivr.net/gh/danielyl123/person@main/transparente.webm";
  video.loop = true;
  video.muted = true;
  video.playbackRate = 0.5 + Math.random() * 1.0;
  video.play();

  const videoTexture = new THREE.VideoTexture(video);
  videoTexture.colorSpace = THREE.SRGBColorSpace;
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;

  const particlesGeometry = new THREE.BufferGeometry();
  const positionsArray = new Float32Array(particlesPerGroup * 3);
  const colorsArray = new Float32Array(particlesPerGroup * 3);

  for (let i = 0; i < particlesPerGroup; i++) {
    const i3 = i * 3;
    positionsArray[i3]     = (Math.random() - 0.5) * 30;
    positionsArray[i3 + 1] = (Math.random() - 0.5) * 30;
    positionsArray[i3 + 2] = (Math.random() - 0.5) * 30;

    const randomColor = palette[Math.floor(Math.random() * palette.length)];
    colorsArray[i3]     = randomColor.r;
    colorsArray[i3 + 1] = randomColor.g;
    colorsArray[i3 + 2] = randomColor.b;
  }

  particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positionsArray, 3));
  particlesGeometry.setAttribute("color", new THREE.BufferAttribute(colorsArray, 3));

  const particlesMaterial = new THREE.PointsMaterial({
    size: 10,
    transparent: true,
    depthWrite: false,
    alphaTest: 0.001,
    alphaMap: videoTexture,
    vertexColors: true,
  });

  const particles = new THREE.Points(particlesGeometry, particlesMaterial);
  particles.frustumCulled = false;
  particlesGroup.add(particles);
}

// Environment map
const hdrLoader = new HDRLoader();
const hdrTexture = hdrLoader.load(
  "https://cdn.jsdelivr.net/gh/danielyl123/person@main/pan.hdr",
  () => {
    hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
    hdrTexture.colorSpace = THREE.SRGBColorSpace;
    scene.background = hdrTexture;
    scene.backgroundRotation.y = (Math.PI / 180) * -160;
    scene.backgroundRotation.x = (Math.PI / 180) * -20;
  }
);

// Clock
const clock = new THREE.Clock();

// Tick
const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  particlesGroup.rotation.x = elapsedTime * 0.1;
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
};
tick();

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
