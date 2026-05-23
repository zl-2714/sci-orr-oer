import * as THREE from 'https://unpkg.com/three@0.164.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.164.1/examples/jsm/controls/OrbitControls.js';

const viewer = document.getElementById('viewer');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0d1018);

const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
camera.position.set(6, 4, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
viewer.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1.2, 0);

scene.add(new THREE.HemisphereLight(0xcad8ff, 0x1a2230, 1.1));
const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
keyLight.position.set(4, 8, 5);
scene.add(keyLight);

const grid = new THREE.GridHelper(18, 18, 0x51638f, 0x2c3448);
grid.position.y = -1.3;
scene.add(grid);

const modelGroup = new THREE.Group();
scene.add(modelGroup);

function clearModels() {
  while (modelGroup.children.length) modelGroup.remove(modelGroup.children[0]);
}

function addFoldedStrip(width, depth, cols, rows, amp, mat) {
  const geo = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const x = (c / cols - 0.5) * width;
      const z = (r / rows - 0.5) * depth;
      const y = Math.sin((c + r) * Math.PI) * amp;
      vertices.push(x, y, z);
    }
  }
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * (cols + 1) + c;
      indices.push(i, i + cols + 1, i + 1, i + 1, i + cols + 1, i + cols + 2);
    }
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat);
}

function buildMiura() {
  clearModels();
  const mat = new THREE.MeshStandardMaterial({ color: 0x8195ff, metalness: 0.2, roughness: 0.45, side: THREE.DoubleSide });
  const sheet = addFoldedStrip(8, 5, 12, 8, 0.35, mat);
  sheet.rotation.x = -0.35;
  modelGroup.add(sheet);
}

function buildWaterbombTube() {
  clearModels();
  const mat = new THREE.MeshStandardMaterial({ color: 0x84e1bc, metalness: 0.15, roughness: 0.45, side: THREE.DoubleSide });
  const radius = 1.8;
  const height = 4.8;
  const seg = 20;
  const hSeg = 16;
  const geo = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  for (let y = 0; y <= hSeg; y++) {
    const v = y / hSeg;
    const yy = (v - 0.5) * height;
    for (let i = 0; i <= seg; i++) {
      const u = i / seg;
      const t = u * Math.PI * 2;
      const fold = Math.sin((u * seg + y) * Math.PI) * 0.22;
      const r = radius + fold;
      vertices.push(Math.cos(t) * r, yy, Math.sin(t) * r);
    }
  }
  for (let y = 0; y < hSeg; y++) {
    for (let i = 0; i < seg; i++) {
      const a = y * (seg + 1) + i;
      const b = a + seg + 1;
      indices.push(a, b, a + 1, a + 1, b, b + 1);
    }
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  modelGroup.add(new THREE.Mesh(geo, mat));
}

function buildKresling() {
  clearModels();
  const mat = new THREE.MeshStandardMaterial({ color: 0xb59cff, metalness: 0.25, roughness: 0.35, side: THREE.DoubleSide });
  const h = 5.2, n = 8, levels = 9, r = 1.5;
  const geo = new THREE.BufferGeometry();
  const vertices = [];
  const indices = [];
  for (let j = 0; j <= levels; j++) {
    const v = j / levels;
    const twist = v * Math.PI * 0.95;
    const yy = (v - 0.5) * h;
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 + twist;
      const rr = r + Math.sin((i + j) * Math.PI) * 0.16;
      vertices.push(Math.cos(angle) * rr, yy, Math.sin(angle) * rr);
    }
  }
  for (let j = 0; j < levels; j++) {
    for (let i = 0; i < n; i++) {
      const a = j * n + i;
      const b = j * n + ((i + 1) % n);
      const c = (j + 1) * n + i;
      const d = (j + 1) * n + ((i + 1) % n);
      indices.push(a, c, b, b, c, d);
    }
  }
  geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  modelGroup.add(new THREE.Mesh(geo, mat));
}

const builders = { miura: buildMiura, waterbomb: buildWaterbombTube, kresling: buildKresling };

document.querySelectorAll('button[data-model]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('button[data-model]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    builders[btn.dataset.model]();
  });
});

window.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'r') {
    camera.position.set(6, 4, 8);
    controls.target.set(0, 1.2, 0);
  }
});

function resize() {
  const w = viewer.clientWidth;
  const h = viewer.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', resize);
resize();
buildKresling();

(function animate() {
  requestAnimationFrame(animate);
  modelGroup.rotation.y += 0.002;
  controls.update();
  renderer.render(scene, camera);
})();
