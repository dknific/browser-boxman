import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const IDLE_BTN = document.getElementsByClassName('idle-btn')[0];
const PAUSE_BTN = document.getElementsByClassName('pause-btn')[0];
const RUN_BTN = document.getElementsByClassName('run-btn')[0];
const WALK_BTN = document.getElementsByClassName('walk-btn')[0];

let appState = {
  cameraIsLerping: true,
  currentAnimation: undefined,
  isMeshLoaded: false,
  isAnimationPaused: false,
}
let runAnimation, idleAnimation, walkAnimation, mixer;

// Instantiate & Configure Scene Utils:
const scene = new THREE.Scene();
scene.background = new THREE.Color('#c9c9c9');
const camera = new THREE.PerspectiveCamera(
  36,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(56, 14, 76);

// 3d Renderer:
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Orbit Controls:
const controls = new OrbitControls(camera, renderer.domElement);
controls.rotateSpeed = 0.5;
controls.enabled = true;
controls.target.set(0,0,0);

// Lights:
const ambientLight = new THREE.AmbientLight(0xffffff, 0.9); // Color and intensity
const hemisphereLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);

// Plane Mesh:
const planeGeometry = new THREE.PlaneGeometry(60,60);
const whiteMaterial = new THREE.MeshBasicMaterial({
  color: '#e6e6e6',
  side: THREE.DoubleSide
});
const plane = new THREE.Mesh(planeGeometry, whiteMaterial);
plane.rotation.x = 1.57;
plane.position.y = -1;

scene.add(ambientLight, hemisphereLight, plane);

// Load Character Mesh & Store Armature Actions:
const glbLoader = new GLTFLoader();
glbLoader.load('/boxman.glb', glbFile => {
  const glbMesh = glbFile.scene;
  glbMesh.scale.set(1,1,1);
  glbMesh.position.set(0,-1,0);
  scene.add(glbMesh);

  mixer = new THREE.AnimationMixer(glbMesh);
  runAnimation = mixer.clipAction(glbFile.animations[1]);
  runAnimation.timeScale = 1.25;
  idleAnimation = mixer.clipAction(glbFile.animations[0]);
  idleAnimation.timeScale = 1.25;
  walkAnimation = mixer.clipAction(glbFile.animations[2]);
  walkAnimation.timeScale = 1.25;
  runAnimation.play();

  appState = { ...appState, currentAnimation: runAnimation, isMeshLoaded: true };
});

// Event handlers for User Events:
function handleActionClick(actionName) {
  appState.currentAnimation.stop();

  if (actionName === 'IDLE') {
    idleAnimation.play();
    IDLE_BTN.classList.add('disabled-btn');
    RUN_BTN.classList.remove('disabled-btn');
    WALK_BTN.classList.remove('disabled-btn');
    appState = { ...appState, currentAnimation: idleAnimation};
  } else if (actionName === 'WALK') {
    walkAnimation.play();
    WALK_BTN.classList.add('disabled-btn');
    IDLE_BTN.classList.remove('disabled-btn');
    RUN_BTN.classList.remove('disabled-btn');
    appState = { ...appState, currentAnimation: walkAnimation};
  } else if (actionName === 'RUN') {
    runAnimation.play();
    RUN_BTN.classList.add('disabled-btn');
    IDLE_BTN.classList.remove('disabled-btn');
    WALK_BTN.classList.remove('disabled-btn');
    appState = { ...appState, currentAnimation: runAnimation};
  }
}

function handlePauseButton() {
  if (mixer) {
    appState.currentAnimation.paused = !appState.currentAnimation.paused;

    if (appState.currentAnimation.paused) {
      PAUSE_BTN.textContent = '⏵︎';
    } else {
      PAUSE_BTN.textContent = '⏸︎';
    }
  }
}

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

IDLE_BTN.addEventListener('click', () => handleActionClick('IDLE'), false);
PAUSE_BTN.addEventListener('click', () => handlePauseButton(), false);
RUN_BTN.addEventListener('click', () => handleActionClick('RUN'), false);
WALK_BTN.addEventListener('click', () => handleActionClick('WALK'), false);
window.addEventListener('resize', handleWindowResize, false);

// Append Three.js App to the DOM & call Animation function:
document.body.appendChild(renderer.domElement);

// Camera Lerp Settings:
const clock = new THREE.Clock();
const startVector = new THREE.Vector3(56.1, 14.3, 76.6);
const endVector = new THREE.Vector3(3.4, 0.9, 4.6);
let lerpFactor = 0;

// Animation loop:
function animate() {
  const delta = clock.getDelta();

  if (mixer) {
    mixer.update(delta);
  }

  if (appState.cameraIsLerping && appState.isMeshLoaded) {
    const lerpSpeed = 0.7;
    lerpFactor += lerpSpeed * delta;
    lerpFactor = Math.min(lerpFactor, 1);

    camera.position.lerpVectors(startVector, endVector, lerpFactor);
    camera.lookAt(controls.target);

    if (lerpFactor >= 1) {
      appState = { ...appState, cameraIsLerping: false };
      controls.maxDistance = 16;
      controls.maxPolarAngle = 1.7;
      controls.enablePan = false;
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);