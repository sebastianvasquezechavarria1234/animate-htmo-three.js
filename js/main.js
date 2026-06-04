import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const container = document.getElementById('viewer');
const loading = document.getElementById('loading');
const closeBtn = document.getElementById('close-viewer');

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

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enabled = false;

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
    hideLoading();
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
    hideLoading();
  }
);

function hideLoading() {
  loading.classList.add('hidden');
  setTimeout(() => { loading.style.display = 'none'; }, 800);
}

setTimeout(() => { hideLoading(); }, 4000);

document.querySelectorAll('h1').forEach(h1 => {
  const text = h1.textContent;
  h1.innerHTML = '';
  [...text].forEach((char, i) => {
    const span = document.createElement('span');
    span.className = 'char';
    span.textContent = char === ' ' ? '\u00A0' : char;
    span.style.transitionDelay = `${i * 0.03}s`;
    h1.appendChild(span);
  });
});

const section1 = document.getElementById('section1');
const section2 = document.getElementById('section2');
const section3 = document.getElementById('section3');
const sections = [section1, section2, section3];

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const camTarget = new THREE.Vector3(-2, 2.5, 7);
const camLookTarget = new THREE.Vector3(-2, 2, 0);

let isFullscreen = false;

function enterFullscreen() {
  isFullscreen = true;
  sections.forEach(s => s.classList.add('hidden'));
  document.querySelector('.credits').classList.add('hidden');
  container.style.left = '0';
  container.style.width = '100vw';
  container.style.height = '100vh';
  controls.enabled = true;
  closeBtn.classList.remove('hidden');
  camera.position.set(-2, 2.5, 7);
  camera.lookAt(-2, 2, 0);
  onResize();
}

function exitFullscreen() {
  isFullscreen = false;
  sections.forEach(s => s.classList.remove('hidden'));
  document.querySelector('.credits').classList.remove('hidden');
  container.style.height = '100vh';
  controls.enabled = false;
  closeBtn.classList.add('hidden');
  window.scrollTo(0, 0);
  onResize();
}

document.querySelectorAll('.ver-modelo').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    enterFullscreen();
  });
});

closeBtn.addEventListener('click', exitFullscreen);

function updateOnScroll() {
  if (isFullscreen) return;

  const scrollY = window.scrollY;
  const vh = window.innerHeight;
  const totalScroll = vh * 2;
  const progress = Math.min(Math.max(scrollY / totalScroll, 0), 1);

  if (progress <= 0.3) {
    container.style.left = '0';
    container.style.width = '50vw';
  } else if (progress <= 0.5) {
    const t = easeInOutCubic((progress - 0.3) / 0.2);
    container.style.left = `${lerp(0, 50, t)}vw`;
    container.style.width = '50vw';
  } else if (progress <= 0.8) {
    container.style.left = '50vw';
    container.style.width = '50vw';
  } else {
    const t = easeInOutCubic((progress - 0.8) / 0.2);
    container.style.left = `${lerp(50, 0, t)}vw`;
    container.style.width = `${lerp(50, 100, t)}vw`;
  }

  if (model) {
    camTarget.x = model.position.x;
    camTarget.z = 7;
    camLookTarget.x = model.position.x;
  }

  const s1 = section1.querySelector('.section-content');
  const s2 = section2.querySelector('.section-content');
  const s3 = section3.querySelector('.section-content');

  if (progress < 0.35) {
    s1.classList.add('visible');
    s2.classList.remove('visible');
    s3.classList.remove('visible');
  } else if (progress >= 0.35 && progress < 0.5) {
    s1.classList.remove('visible');
    s2.classList.remove('visible');
    s3.classList.remove('visible');
  } else if (progress >= 0.5 && progress < 0.75) {
    s1.classList.remove('visible');
    s2.classList.add('visible');
    s3.classList.remove('visible');
  } else if (progress >= 0.75 && progress < 0.85) {
    s1.classList.remove('visible');
    s2.classList.remove('visible');
    s3.classList.remove('visible');
  } else {
    s1.classList.remove('visible');
    s2.classList.remove('visible');
    s3.classList.add('visible');
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

  if (controls.enabled) {
    controls.update();
  }

  if (model && !isFullscreen) {
    const time = performance.now() * 0.001;
    model.position.y = baseY + Math.sin(time * 1.2) * 0.15;
    model.rotation.y = Math.sin(time * 0.5) * 0.3;

    const progress = Math.min(Math.max(window.scrollY / (window.innerHeight * 2), 0), 1);

    if (progress > 0.7) {
      const t = easeInOutCubic(Math.min((progress - 0.7) / 0.3, 1));
      camTarget.z = lerp(7, 4, t);
      camLookTarget.y = lerp(2, 2.5, t);
    } else {
      camTarget.z = 7;
      camLookTarget.y = 2;
    }

    camera.position.lerp(camTarget, 0.05);
    camera.lookAt(camLookTarget);
  }

  renderer.render(scene, camera);
}
animate();
