import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const container = document.getElementById('viewer');
const loading = document.getElementById('loading');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);
camera.position.set(-2, 2.5, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

camera.lookAt(-2, 2, 0);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

const fillLight = new THREE.DirectionalLight(0x8888ff, 0.4);
fillLight.position.set(-3, 2, -3);
scene.add(fillLight);

let model = null;
const baseY = 1.5;

const loader = new GLTFLoader();
loader.load(
  'model/psxwnauq_inspyrenet_upscayl_2x_Stone_tower_covered_in_vines_and_.glb',
  (gltf) => {
    model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 4 / maxDim;
    model.scale.setScalar(scale);
    model.position.sub(center.multiplyScalar(scale));
    model.position.y -= box.min.y;
    model.position.y += baseY;
    model.position.x = -2;

    scene.add(model);

    setTimeout(() => {
      loading.classList.add('hidden');
      setTimeout(() => loading.style.display = 'none', 800);
    }, 500);
  },
  (progress) => {
    if (progress.total) {
      const pct = (progress.loaded / progress.total) * 100;
      loading.querySelector('.loading-text').textContent =
        `Cargando... ${Math.round(pct)}%`;
    }
  },
  (error) => {
    console.error('Error cargando modelo:', error);
    loading.querySelector('.loading-text').textContent = 'Error al cargar.';
  }
);

const section1 = document.getElementById('section1');
const section2 = document.getElementById('section2');
const section3 = document.getElementById('section3');

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const camTarget = new THREE.Vector3(-2, 2.5, 7);
const camLookTarget = new THREE.Vector3(-2, 2, 0);

function updateOnScroll() {
  const scrollY = window.scrollY;
  const vh = window.innerHeight;
  const totalScroll = vh * 2;
  const progress = Math.min(Math.max(scrollY / totalScroll, 0), 1);

  const eased = easeInOutCubic(progress);

  // Split screen logic
  if (progress <= 0.5) {
    container.style.left = `${lerp(0, 50, eased * 2)}vw`;
    container.style.width = '50vw';
  } else {
    container.style.left = '0';
    const t = easeInOutCubic((progress - 0.5) * 2);
    container.style.width = `${lerp(50, 100, t)}vw`;
  }

  if (model) {
    // Keep camera following model
    camTarget.x = model.position.x;
    camTarget.z = 7;
    camLookTarget.x = model.position.x;
  }

  const s1Content = section1.querySelector('.section-content');
  const s2Content = section2.querySelector('.section-content');
  const s3Content = section3.querySelector('.section-content');

  // Text Visibility Logic
  if (progress < 0.25) {
    s1Content.classList.add('visible');
    s2Content.classList.remove('visible');
    s3Content.classList.remove('visible');
  } else if (progress >= 0.25 && progress < 0.5) {
    s1Content.classList.remove('visible');
    s2Content.classList.remove('visible');
    s3Content.classList.remove('visible');
  } else if (progress >= 0.5 && progress < 0.75) {
    s1Content.classList.remove('visible');
    s2Content.classList.add('visible');
    s3Content.classList.remove('visible');
  } else if (progress >= 0.75 && progress < 0.9) {
    s2Content.classList.remove('visible');
    s3Content.classList.remove('visible');
  } else {
    s2Content.classList.remove('visible');
    s3Content.classList.add('visible');
  }
}

window.addEventListener('scroll', updateOnScroll, { passive: true });

function onResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}
window.addEventListener('resize', onResize);

function animate() {
  requestAnimationFrame(animate);

  if (model) {
    const time = performance.now() * 0.001;
    model.position.y = baseY + Math.sin(time * 1.2) * 0.15;
    model.rotation.y = Math.sin(time * 0.5) * 0.3;

    camera.position.lerp(camTarget, 0.05);
    camera.lookAt(camLookTarget);
  }

  renderer.render(scene, camera);
}
animate();
