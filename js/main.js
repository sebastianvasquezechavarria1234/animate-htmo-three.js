import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const container = document.getElementById('viewer');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

const camera = new THREE.PerspectiveCamera(
  45,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);
camera.position.set(0, 2.5, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
container.appendChild(renderer.domElement);

camera.lookAt(0, 2, 0);

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

    scene.add(model);

    const loading = document.getElementById('loading');
    loading.style.opacity = '0';
    setTimeout(() => loading.style.display = 'none', 500);
  },
  (progress) => {
    if (progress.total) {
      const pct = (progress.loaded / progress.total) * 100;
      document.getElementById('loading').textContent =
        `Cargando modelo 3D... ${Math.round(pct)}%`;
    }
  },
  (error) => {
    console.error('Error cargando modelo:', error);
    document.getElementById('loading').textContent = 'Error al cargar el modelo.';
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

function updateContainerPosition() {
  const scrollY = window.scrollY;
  const vh = window.innerHeight;
  const totalScroll = vh * 2;

  const rawProgress = scrollY / totalScroll;
  const progress = Math.min(Math.max(rawProgress, 0), 1);

  if (model) {
    if (progress < 0.02) {
      model.position.x = 0;
      model.position.z = 0;
      model.scale.setScalar(1);
    } else if (progress <= 0.5) {
      const t = easeInOutCubic(progress * 2);
      model.position.x = lerp(0, 3, t);
      model.position.z = lerp(0, -1.5, t);
      model.scale.setScalar(lerp(1, 1.2, t));
    } else {
      const t = easeInOutCubic((progress - 0.5) * 2);
      model.position.x = lerp(3, 0, t);
      model.position.z = lerp(-1.5, 1.5, t);
      model.scale.setScalar(lerp(1.2, 1, t));
    }
  }

  updateTextAnimations(scrollY, vh);
}

function updateTextAnimations(scrollY, vh) {
  const sections = [
    { el: section1, start: 0 },
    { el: section2, start: vh },
    { el: section3, start: vh * 2 }
  ];

  sections.forEach((section, i) => {
    if (!section.el) return;
    const content = section.el.querySelector('.section-content');
    if (!content) return;

    const sectionScrollStart = section.start;
    const sectionScrollEnd = section.start + vh;
    const enterStart = sectionScrollStart - vh * 0.3;
    const enterEnd = sectionScrollStart;
    const exitStart = sectionScrollEnd - vh * 0.3;
    const exitEnd = sectionScrollEnd;

    if (scrollY < enterStart || scrollY > exitEnd + vh * 0.5) {
      content.classList.remove('visible', 'exit-left', 'exit-right');
    } else if (scrollY >= enterStart && scrollY <= enterEnd) {
      const t = (scrollY - enterStart) / (enterEnd - enterStart);
      const eased = easeInOutCubic(Math.min(t, 1));
      content.style.opacity = eased;
      content.style.transform = `translateX(${60 * (1 - eased)}px)`;
    } else if (scrollY > enterEnd && scrollY < exitStart) {
      content.classList.add('visible');
      content.style.opacity = 1;
      content.style.transform = 'translateX(0)';
    } else if (scrollY >= exitStart && scrollY <= exitEnd) {
      const t = (scrollY - exitStart) / (exitEnd - exitStart);
      const eased = easeInOutCubic(Math.min(t, 1));
      content.style.opacity = 1 - eased;
      content.style.transform = `translateX(${-60 * eased}px)`;
    }
  });
}

window.addEventListener('scroll', updateContainerPosition, { passive: true });

const section1Content = section1.querySelector('.section-content');
if (section1Content) {
  section1Content.style.opacity = '1';
  section1Content.style.transform = 'translateX(0)';
}

updateContainerPosition();

function onResize() {
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(container.clientWidth, container.clientHeight);
}
window.addEventListener('resize', onResize);

const camTarget = new THREE.Vector3(0, 2.5, 4);
const camLookTarget = new THREE.Vector3(0, 2, 0);

function animate() {
  requestAnimationFrame(animate);

  if (model) {
    const time = performance.now() * 0.001;
    model.position.y = baseY + Math.sin(time * 1.2) * 0.15;
    model.rotation.y = Math.sin(time * 0.5) * 0.3;

    camTarget.x = model.position.x;
    camTarget.z = model.position.z + 4;
    camLookTarget.x = model.position.x;

    camera.position.lerp(camTarget, 0.05);
    camera.lookAt(camLookTarget);
  }

  renderer.render(scene, camera);
}
animate();
