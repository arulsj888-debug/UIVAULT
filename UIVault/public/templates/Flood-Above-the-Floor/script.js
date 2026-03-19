/*!
 * Flood Above the Floor
 * https://codepen.io/wakana-k/pen/Eayqjwr
 */
"use strict";

import * as THREE from "three/webgpu";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { WaterMesh } from "three/addons/objects/Water2Mesh.js";
import { GroundedSkybox } from "three/addons/objects/GroundedSkybox.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";

(function () {
  let camera, scene, renderer, controls;
  let skybox, water;

  init().then(animate);
  obj();

  async function obj() {
    const params = {
      color: "azure",
      scale: 5,
      flowX: 0.1,
      flowY: 0.3
    };

    const textureLoader = new THREE.TextureLoader();
    const [normalMap0, normalMap1] = await Promise.all([
      textureLoader.loadAsync("https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/water/Water_1_M_Normal.jpg"),
      textureLoader.loadAsync("https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/water/Water_2_M_Normal.jpg")
    ]);

    normalMap0.wrapS = normalMap0.wrapT = THREE.RepeatWrapping;
    normalMap1.wrapS = normalMap1.wrapT = THREE.RepeatWrapping;

    const waterGeometry = new THREE.CircleGeometry(camera.far / 2, 32);
    water = new WaterMesh(waterGeometry, {
      color: params.color,
      scale: params.scale,
      flowDirection: new THREE.Vector2(params.flowX, params.flowY),
      normalMap0: normalMap0,
      normalMap1: normalMap1
    });

    water.position.set(0, 0, 0);
    water.rotation.x = Math.PI * -0.5;
    water.renderOrder = Infinity;
    scene.add(water);
  }

  async function init() {
    scene = new THREE.Scene();

    renderer = new THREE.WebGPURenderer();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    document.body.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.set(0, 1.5, 8);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.maxDistance = camera.far / 2;
    controls.minDistance = 10;
    controls.maxPolarAngle = THREE.MathUtils.degToRad(90);
    controls.target.set(0, 1, 0);
    controls.update();

    window.addEventListener("resize", onWindowResize);

    const hdrLoader = new HDRLoader();
    const envMap = await hdrLoader.loadAsync(
      "https://happy358.github.io/Images/HDR/old_hall_2k.hdr"
    );
    envMap.mapping = THREE.EquirectangularReflectionMapping;

    const params = {
      height: 15,
      radius: camera.far / 2,
    };

    skybox = new GroundedSkybox(envMap, params.height, params.radius);
    skybox.position.y = params.height - 1;
    scene.add(skybox);
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate() {
    controls.update();
    renderer.render(scene, camera);
  }
})();
