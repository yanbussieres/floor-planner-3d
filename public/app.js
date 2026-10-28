import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Sizes are stored in metres; the UI shows feet and inches.
const IN = 0.0254;
const FT = 12 * IN;
const WALL_H = 8 * FT;
const LOW_WALL_H = 3 * FT;
const WALL_T = 0.12;
const WINDOW_SILL = 36 * IN;
const STORE_KEY = 'floor-planner-3d-v17';

// Real-world sizes in inches. "back" is the item's -z side at 0° (top of the screen in plan).
const CATALOG = [
  { group: 'Living', type: 'sofa3', name: 'Sofa, 3-seat', w: 84, d: 36, h: 34, color: '#7d8fa6', shape: 'sofa' },
  { group: 'Living', type: 'sofa2', name: 'Loveseat', w: 64, d: 35, h: 34, color: '#7d8fa6', shape: 'sofa' },
  { group: 'Living', type: 'armchair', name: 'Armchair', w: 32, d: 33, h: 33, color: '#a3866a', shape: 'sofa' },
  { group: 'Living', type: 'coffee', name: 'Coffee table', w: 44, d: 24, h: 18, color: '#b08d68', shape: 'table' },
  { group: 'Living', type: 'console', name: 'Console table', w: 36, d: 14, h: 30, color: '#4a2f22', shape: 'table' },
  { group: 'Living', type: 'tv', name: 'TV unit', w: 70, d: 16, h: 20, color: '#4a4f57' },
  { group: 'Living', type: 'bookshelf', name: 'Bookshelf', w: 32, d: 12, h: 72, color: '#c9b28f' },
  { group: 'Living', type: 'rug', name: 'Rug 5×8', w: 96, d: 60, h: 0.4, color: '#cbbba4', flat: true },
  { group: 'Bedroom', type: 'queen', name: 'Queen bed', w: 60, d: 80, h: 20, color: '#b9b0a2', shape: 'bed' },
  { group: 'Bedroom', type: 'full', name: 'Double bed', w: 54, d: 75, h: 20, color: '#b9b0a2', shape: 'bed' },
  { group: 'Bedroom', type: 'twin', name: 'Twin bed', w: 39, d: 75, h: 20, color: '#b9b0a2', shape: 'bed' },
  { group: 'Bedroom', type: 'nightstand', name: 'Nightstand', w: 18, d: 16, h: 24, color: '#c9b28f' },
  { group: 'Bedroom', type: 'dresser', name: 'Dresser', w: 48, d: 18, h: 32, color: '#c9b28f' },
  { group: 'Bedroom', type: 'wardrobe', name: 'Wardrobe', w: 48, d: 24, h: 78, color: '#d8d0c4' },
  { group: 'Kitchen & dining', type: 'dining', name: 'Dining table', w: 48, d: 30, h: 30, color: '#a07b56', shape: 'table', under: true },
  { group: 'Kitchen & dining', type: 'chair', name: 'Dining chair', w: 18, d: 20, h: 35, color: '#6f6a64', shape: 'chair', tuck: true },
  { group: 'Kitchen & dining', type: 'counter', name: 'Kitchen counter', w: 72, d: 25, h: 36, color: '#c9ccd1' },
  { group: 'Kitchen & dining', type: 'fridge', name: 'Fridge', w: 30, d: 30, h: 68, color: '#eef0f2', shape: 'fridge' },
  { group: 'Kitchen & dining', type: 'stove', name: 'Stove', w: 30, d: 26, h: 36, color: '#eef0f2', shape: 'stove' },
  { group: 'Kitchen & dining', type: 'stack', name: 'Washer + dryer', w: 27, d: 30, h: 77, color: '#eef1f4' },
  { group: 'Work', type: 'desk', name: 'Desk', w: 48, d: 24, h: 30, color: '#d2b48c', shape: 'table', under: true },
  { group: 'Work', type: 'officechair', name: 'Office chair', w: 24, d: 24, h: 40, color: '#3b3f46', shape: 'chair', tuck: true },
  { group: 'Bathroom', type: 'bathtub', name: 'Bathtub', w: 60, d: 30, h: 20, color: '#f2f4f6' },
  { group: 'Bathroom', type: 'shower', name: 'Shower', w: 36, d: 36, h: 78, color: '#e6ecf1', shape: 'shower' },
  { group: 'Bathroom', type: 'toilet', name: 'Toilet', w: 16, d: 26, h: 30, color: '#f2f4f6' },
  { group: 'Bathroom', type: 'vanity', name: 'Sink vanity', w: 30, d: 20, h: 34, color: '#d8d0c4' },
  { group: 'Built-in', type: 'closet', name: 'Closet', w: 48, d: 24, h: 96, color: '#e9e4dc' },
  { group: 'Built-in', type: 'heater', name: 'Baseboard heater', w: 48, d: 4, h: 8, color: '#cdbf9f' },
  { group: 'Built-in', type: 'window', name: 'Window', w: 36, d: 6, h: 48, color: '#9cc7e8', shape: 'window', flat: true },
  { group: 'Built-in', type: 'door', name: 'Door swing', w: 32, d: 32, h: 0.4, color: '#f59e0b', shape: 'door', flat: true, clearance: true },
  { group: 'Other', type: 'plant', name: 'Plant', w: 16, d: 16, h: 48, color: '#5f8f5a', shape: 'plant' },
  { group: 'Other', type: 'box', name: 'Custom box', w: 36, d: 36, h: 36, color: '#9aa3ae' },
].map((c) => ({ ...c, w: c.w * IN, d: c.d * IN, h: c.h * IN }));
const byType = Object.fromEntries(CATALOG.map((c) => [c.type, c]));
const spec = (it) => byType[it.type] ?? byType.box;

const $ = (s) => document.querySelector(s);
const uid = () => Math.random().toString(36).slice(2, 9);
const snap = (v, step) => Math.round(v / step) * step;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const inch = (m) => Math.round((m / IN) * 2) / 2; // to the nearest half inch
const deg2rad = (d) => (d * Math.PI) / 180;

function fmtLen(m) {
  return `${Math.round(Math.abs(m) / IN)}″`;
}

// Accepts inches ("134") or feet and inches ("11'2", "11' 2\"", "11'").
function parseLen(s) {
  const m = String(s).trim().match(/^(\d+(?:\.\d+)?)\s*'\s*(?:(\d+(?:\.\d+)?)\s*"?)?$/);
  const inches = m ? parseFloat(m[1]) * 12 + (m[2] ? parseFloat(m[2]) : 0) : parseFloat(s);
  return Number.isFinite(inches) ? inches * IN : NaN;
}
const dist = (a, b) => Math.hypot(b.x - a.x, b.z - a.z);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function wall(x1, z1, x2, z2, t = WALL_T) {
  return { id: uid(), x1, z1, x2, z2, t };
}

function item(type, x, z, rot = 0, extra = {}) {
  const c = byType[type];
  return { id: uid(), type, name: c.name, x, z, rot, w: c.w, d: c.d, h: c.h, color: c.color, ...extra };
}

// The apartment from the hand sketch, the walkthrough video and your edits, in inches.
// Origin is the outside top-left corner of the salon; x runs right, z runs down the page.
// Measured: 190 deep; the middle wall line is 80 from the top wall; 132 from the stove to
// the right wall; 40 + 38 window + 56 = 134 along the salon's top wall; 99 glass half-wall.
// Everything else is estimated.
function apartmentState() {
  const t2 = (WALL_T / IN) / 2; // half a wall, so furniture sits on the face, not the centre line
  const W = 334; // width of the whole apartment
  const D = 190; // depth of the whole apartment
  const N = 80; // middle wall line: laundry nook wall and glass half-wall
  const walls = [];
  const w = (x1, z1, x2, z2, extra = {}) => walls.push({ ...wall(x1 * IN, z1 * IN, x2 * IN, z2 * IN), ...extra });
  const items = [];
  const put = (type, x, z, rot = 0, extra = {}) => {
    const sized = Object.fromEntries(Object.entries(extra).map(([k, v]) => [k, ['w', 'd', 'h'].includes(k) ? v * IN : v]));
    items.push(item(type, x * IN, z * IN, rot, sized));
  };

  // Outside: salon on the left (164 wide), the rest on the right (170 wide).
  w(0, 0, W, 0);
  w(0, 0, 0, D);
  w(0, D, 6, D); // main entry door 6–42
  w(42, D, W, D);
  w(W, 0, W, D);

  // Inside walls stop at 6′ (3/4 of the ceiling height), open above, so the rooms see each other.
  const inner = { h: 72 * IN };

  // Shared wall between the salon and the kitchen; doorway to the kitchenette 138–174.
  w(164, 0, 164, 138, inner);
  w(164, 174, 164, D, inner);

  // Middle wall line: laundry nook wall, then the bedroom's 99″ glass half-wall
  // (38″ solid with glass above) right up to the outside wall.
  w(164, N, W - 99, N, inner);
  w(W - 99, N, W, N, { ...inner, solidH: 38 * IN, name: 'Glass half-wall' });

  // Bathroom, bottom right corner, 80 × 60.
  w(W - 79, D - 5, W - 79, D - 60, inner);
  w(W - 79, D - 60, W, D - 60, inner);

  // Doors and windows
  put('door', 24, D - 18, 180, { name: 'Main entry', w: 36, d: 36 });
  put('window', 89, 0, 0, { name: 'Salon window', w: 38 });
  put('window', 0, 146, 90, { name: 'Salon side window', w: 38 });
  put('window', W - 50, 0, 0, { name: 'Bedroom window', w: 38 });
  put('window', W, 155, 90, { name: 'Bathroom window', w: 23, h: 36 });

  // Salon built-ins, and the half-moon console table beside the kitchenette doorway
  put('closet', t2 + 15, t2 + 39, 270, { w: 78, d: 30 });
  put('closet', 164 - t2 - 26, D - t2 - 12, 180, { w: 52, d: 24 });
  put('console', 164 - t2 - 7, 138 - 18 - 2, 90);

  // Kitchen: laundry nook above the middle wall; fridge and stove below it, along the shared wall.
  put('stack', 164 + t2 + 15, t2 + 37.5, 270, { name: 'Laundry nook', w: 75 });
  put('fridge', 164 + t2 + 15, N + t2 + 15, 270);
  put('stove', 164 + t2 + 15, N + t2 + 45, 270);

  // Bedroom: head of the bed against the right wall, along the top wall.
  put('full', W - t2 - 37.5, t2 + 27, 90);
  put('heater', W - 50, N - t2 - 2, 180, { w: 48 });

  // Kitchenette: the sink counter is against the bathroom wall, facing the doorway from the
  // salon (as seen from the doorway in the video).
  put('counter', W - 79 - t2 - 12.5, 159, 90, { name: 'Sink counter', w: 48 });

  // Bathroom
  put('shower', W - t2 - 18, D - t2 - 18, 180); // corner; glass faces the room (top and left)
  put('toilet', W - 55, D - t2 - 13, 180); // beside the shower, as in the video
  put('vanity', W - 26, D - 60 + t2 + 9, 0, { name: 'Sink', w: 24, d: 18 });

  return { walls, items, underlay: null };
}

// ---------- State, undo, persistence ----------

let state = loadLocal() ?? apartmentState();
const undoStack = [];
const redoStack = [];

function snapshot() {
  return JSON.stringify({ walls: state.walls, items: state.items });
}

function checkpoint() {
  undoStack.push(snapshot());
  if (undoStack.length > 200) undoStack.shift();
  redoStack.length = 0;
}

function restore(json) {
  const s = JSON.parse(json);
  state.walls = s.walls;
  state.items = s.items;
  if (selection && !findSel(selection)) selection = null;
  changed();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
}

function changed() {
  saveLocal();
  rebuild();
  renderPanel();
  updateButtons();
}

function saveLocal() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    // Usually the traced image is too big for storage; keep the plan at least.
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ ...state, underlay: null })); } catch {}
  }
}

function loadLocal() {
  try {
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && Array.isArray(s.walls) && Array.isArray(s.items)) return { underlay: null, ...s };
  } catch {}
  return null;
}

const getItem = (id) => state.items.find((it) => it.id === id);
const getWall = (id) => state.walls.find((w) => w.id === id);
const findSel = (sel) => (sel.kind === 'item' ? getItem(sel.id) : getWall(sel.id));

// ---------- Three.js scene ----------

const canvas = $('#scene');
const stage = $('.stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#eef0f3');
scene.add(new THREE.HemisphereLight(0xffffff, 0xaab0ba, 1.1));
const sun = new THREE.DirectionalLight(0xffffff, 1.6);
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0005;
scene.add(sun, sun.target);

const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#f6f4f0' }));
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);
const grid = new THREE.GridHelper(60 * FT, 60, 0xcfd3da, 0xe2e5ea); // 1 ft squares
grid.position.y = 0.002;
scene.add(grid);

const wallsGroup = new THREE.Group();
const itemsGroup = new THREE.Group();
const previewGroup = new THREE.Group();
scene.add(wallsGroup, itemsGroup, previewGroup);
const itemMeshes = new Map();
let underlayMesh = null;

const edgeMat = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 });

const ortho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
ortho.up.set(0, 0, -1); // screen-up is -z, so +x is right and +z is down, like a drawing
const persp = new THREE.PerspectiveCamera(50, 1, 0.05, 300);
persp.position.set(4.5, 9, 14);
const plan = { cx: 4.5, cz: 3.5, viewH: 10 };

let view = 'plan';
let camera = ortho;
let tool = 'select';
let selection = null; // { kind: 'item' | 'wall', id }
let lowWalls = false;

let drag = null;
let pan = null;
let roomDrag = null;
let wallDraft = null; // corners placed so far in the current wall chain
let typed = ''; // length typed while drawing a wall, in inches or feet'inches
let lastPointer = null;
let measure = null;
let measuring = false;
let previewLabels = [];

// Our pointer handlers are registered before OrbitControls so they can switch it off
// when a press lands on furniture or starts a drawing gesture.
canvas.addEventListener('pointerdown', onPointerDown);
canvas.addEventListener('pointermove', onPointerMove);
canvas.addEventListener('pointerup', onPointerUp);
canvas.addEventListener('pointercancel', onPointerUp);
canvas.addEventListener('dblclick', () => { if (tool === 'wall') finishWallChain(); });
canvas.addEventListener('wheel', onWheel, { passive: false });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  const type = e.dataTransfer.getData('text/x-item');
  const p = floorPoint(e);
  if (byType[type] && p) addItem(type, p);
});

const orbit = new OrbitControls(persp, canvas);
orbit.enableDamping = true;
orbit.maxPolarAngle = Math.PI / 2 - 0.03;
orbit.minDistance = 1;
orbit.maxDistance = 60;
orbit.enabled = false;

function resize() {
  const w = stage.clientWidth;
  const h = stage.clientHeight;
  renderer.setSize(w, h, false);
  persp.aspect = w / Math.max(1, h);
  persp.updateProjectionMatrix();
  updateOrtho();
}
new ResizeObserver(resize).observe(stage);

function updateOrtho() {
  const aspect = stage.clientWidth / Math.max(1, stage.clientHeight);
  const hh = plan.viewH / 2;
  const hw = hh * aspect;
  Object.assign(ortho, { left: -hw, right: hw, top: hh, bottom: -hh });
  ortho.position.set(plan.cx, 50, plan.cz);
  ortho.lookAt(plan.cx, 0, plan.cz);
  ortho.updateProjectionMatrix();
}

// ---------- Building meshes ----------

function clearGroup(g) {
  for (const c of [...g.children]) {
    c.traverse((o) => {
      o.geometry?.dispose();
      if (o.material && o.material !== edgeMat) o.material.dispose();
    });
    g.remove(c);
  }
}

function wallColor() {
  return view === 'plan' ? '#3d4450' : '#ece8e1';
}

function currentWallH() {
  return view === '3d' && lowWalls ? LOW_WALL_H : WALL_H;
}

function buildWall(w, height) {
  const dx = w.x2 - w.x1;
  const dz = w.z2 - w.z1;
  const len = Math.hypot(dx, dz);
  const mat = new THREE.MeshStandardMaterial({ color: wallColor(), roughness: 0.95 });
  // A wall can stop short of the ceiling (w.h), and a half-wall is solid up to solidH with glass above.
  const top = Math.min(w.h ?? height, height);
  const solid = w.solidH ? Math.min(w.solidH, top) : top;
  // Extend by half the thickness at each end so corners close up.
  const m = new THREE.Mesh(new THREE.BoxGeometry(len + w.t, solid, w.t), mat);
  m.position.set((w.x1 + w.x2) / 2, solid / 2, (w.z1 + w.z2) / 2);
  m.rotation.y = -Math.atan2(dz, dx);
  m.castShadow = true;
  m.receiveShadow = true;
  m.userData = { kind: 'wall', id: w.id, mat };
  if (solid < top) {
    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(len, top - solid, 0.02),
      new THREE.MeshStandardMaterial({ color: '#cfe3ef', transparent: true, opacity: 0.35, roughness: 0.1, depthWrite: false }),
    );
    glass.position.y = top / 2;
    m.add(glass);
  }
  return m;
}

function buildItem(it) {
  const s = spec(it);
  const { w, d, h } = it;
  const g = new THREE.Group();
  g.userData = { kind: 'item', id: it.id, mats: [] };
  const base = new THREE.Color(it.color);
  const shade = (k) => base.clone().multiplyScalar(k);

  const part = (geom, x, y, z, color = base, opts = {}) => {
    const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...opts });
    const m = new THREE.Mesh(geom, mat);
    m.position.set(x, y, z);
    m.castShadow = !s.flat;
    m.receiveShadow = true;
    g.userData.mats.push(mat);
    g.add(m);
    return m;
  };
  const box = (bw, bh, bd, x, y, z, color) => {
    const m = part(new THREE.BoxGeometry(bw, bh, bd), x, y, z, color);
    m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry), edgeMat));
    return m;
  };

  switch (s.shape) {
    case 'sofa': {
      const arm = Math.min(0.15, w * 0.12);
      const back = Math.min(0.22, d * 0.25);
      const seat = Math.min(0.45, h * 0.55);
      const armH = Math.min(h, seat + 0.18);
      box(w - 2 * arm, seat, d - back, 0, seat / 2, back / 2);
      box(w - 2 * arm, h, back, 0, h / 2, -d / 2 + back / 2, shade(0.9));
      box(arm, armH, d, -w / 2 + arm / 2, armH / 2, 0, shade(0.9));
      box(arm, armH, d, w / 2 - arm / 2, armH / 2, 0, shade(0.9));
      break;
    }
    case 'bed': {
      const hb = 0.08;
      const headH = Math.max(h + 0.45, 0.9);
      box(w, h, d - hb, 0, h / 2, hb / 2);
      box(w, headH, hb, 0, headH / 2, -d / 2 + hb / 2, shade(0.75));
      const pw = w >= 1.2 ? (w - 0.3) / 2 : w - 0.2;
      const xs = w >= 1.2 ? [-(pw / 2 + 0.05), pw / 2 + 0.05] : [0];
      for (const px of xs) box(pw, 0.12, 0.4, px, h + 0.06, -d / 2 + hb + 0.25, new THREE.Color('#ffffff'));
      break;
    }
    case 'chair': {
      const seat = Math.min(0.46, h);
      const back = Math.min(0.06, d * 0.2);
      box(w, seat, d - back, 0, seat / 2, back / 2);
      box(w, h, back, 0, h / 2, -d / 2 + back / 2, shade(0.85));
      break;
    }
    case 'table': {
      const top = 0.04;
      const leg = 0.05;
      const ix = w / 2 - leg / 2 - 0.03;
      const iz = d / 2 - leg / 2 - 0.03;
      box(w, top, d, 0, h - top / 2, 0);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(leg, h - top, leg, sx * ix, (h - top) / 2, sz * iz, shade(0.8));
      break;
    }
    case 'plant': {
      const r = Math.min(w, d) / 2;
      const potH = Math.min(0.35, h * 0.4);
      part(new THREE.CylinderGeometry(r * 0.6, r * 0.45, potH, 20), 0, potH / 2, 0, new THREE.Color('#b5835a'));
      const leaves = part(new THREE.SphereGeometry(r, 20, 14), 0, potH + (h - potH) / 2, 0);
      leaves.scale.y = (h - potH) / (2 * r);
      break;
    }
    case 'door': {
      // Hinge at the back-left corner; the leaf swings through the item's footprint.
      const sector = part(new THREE.CircleGeometry(1, 32, 0, Math.PI / 2), -w / 2, 0.006, -d / 2, base, {
        transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false,
      });
      sector.rotation.x = Math.PI / 2;
      sector.scale.set(w, d, 1);
      box(0.04, 0.04, d, -w / 2 + 0.02, 0.02, 0, shade(0.7));
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const a = (i / 24) * (Math.PI / 2);
        pts.push(new THREE.Vector3(-w / 2 + w * Math.cos(a), 0.008, -d / 2 + d * Math.sin(a)));
      }
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: shade(0.7) })));
      break;
    }
    case 'fridge': {
      // Top-freezer fridge: the doors face the front (+z), with a seam and two handles.
      const steel = new THREE.Color('#9aa3ae');
      const seamY = h * 0.7;
      box(w, h, d, 0, h / 2, 0);
      part(new THREE.BoxGeometry(w * 0.98, 0.008, 0.006), 0, seamY, d / 2 + 0.003, new THREE.Color('#5b626b'));
      box(0.025, Math.min(0.22, (h - seamY) * 0.6), 0.035, w / 2 - 0.06, seamY + (h - seamY) / 2, d / 2 + 0.02, steel);
      box(0.025, Math.min(0.45, seamY * 0.4), 0.035, w / 2 - 0.06, seamY - Math.min(0.45, seamY * 0.4) / 2 - 0.08, d / 2 + 0.02, steel);
      break;
    }
    case 'stove': {
      // Range: oven door with window and handle at the front, cooktop with four burners,
      // and a back panel with knobs.
      const black = new THREE.Color('#1f2328');
      const steel = new THREE.Color('#9aa3ae');
      const panelH = 11 * IN;
      const panelD = 0.07;
      box(w, h, d, 0, h / 2, 0);
      part(new THREE.BoxGeometry(w * 0.96, 0.01, d - panelD - 0.02), 0, h + 0.005, panelD / 2, black);
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          const r = sz < 0 ? 0.075 : 0.095;
          const burner = part(new THREE.CylinderGeometry(r, r, 0.006, 24), sx * w * 0.23, h + 0.013, panelD / 2 + sz * (d - panelD) * 0.22, new THREE.Color('#3a3f46'));
          burner.castShadow = false;
        }
      }
      box(w, panelH, panelD, 0, h + panelH / 2, -d / 2 + panelD / 2);
      for (let i = 0; i < 4; i++) {
        const knob = part(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 16), (i - 1.5) * w * 0.2, h + panelH * 0.5, -d / 2 + panelD + 0.01, black);
        knob.rotation.x = Math.PI / 2;
      }
      part(new THREE.BoxGeometry(w * 0.6, h * 0.28, 0.006), 0, h * 0.48, d / 2 + 0.003, black, { roughness: 0.2 });
      box(w * 0.8, 0.02, 0.03, 0, h * 0.8, d / 2 + 0.025, steel);
      part(new THREE.BoxGeometry(w * 0.96, 0.006, 0.006), 0, h * 0.2, d / 2 + 0.003, new THREE.Color('#5b626b'));
      break;
    }
    case 'shower': {
      // White tray, then glass on the two open sides (back and left sit against walls by default).
      const tray = 4 * IN;
      const glass = 0.01;
      box(w, tray, d, 0, tray / 2, 0);
      const pane = { transparent: true, opacity: 0.3, roughness: 0.05, depthWrite: false };
      const gh = Math.max(h - tray, 0.1);
      part(new THREE.BoxGeometry(w, gh, glass), 0, tray + gh / 2, d / 2 - glass / 2, new THREE.Color('#cfe3ef'), pane);
      part(new THREE.BoxGeometry(glass, gh, d), w / 2 - glass / 2, tray + gh / 2, 0, new THREE.Color('#cfe3ef'), pane);
      const drain = part(new THREE.CylinderGeometry(0.04, 0.04, 0.005, 16), 0, tray + 0.003, 0, new THREE.Color('#9aa3ae'));
      drain.castShadow = false;
      break;
    }
    case 'window': {
      // Sits on a wall's centre line and pokes through both faces so it shows on each side.
      // In plan it also draws a strip on top of the wall.
      const top = Math.min(WINDOW_SILL + h, currentWallH());
      if (top > WINDOW_SILL) {
        part(new THREE.BoxGeometry(w, top - WINDOW_SILL, d), 0, (WINDOW_SILL + top) / 2, 0, base, {
          transparent: true, opacity: 0.55, roughness: 0.1,
        });
      }
      if (view === 'plan') part(new THREE.BoxGeometry(w, 0.01, d), 0, WALL_H + 0.01, 0, base);
      break;
    }
    default:
      box(w, Math.max(h, 0.005), d, 0, h / 2, 0);
  }

  g.position.set(it.x, 0, it.z);
  g.rotation.y = -deg2rad(it.rot);
  return g;
}

function placeItemMesh(it) {
  const g = itemMeshes.get(it.id);
  if (!g) return;
  g.position.set(it.x, 0, it.z);
  g.rotation.y = -deg2rad(it.rot);
}

function rebuild() {
  clearGroup(wallsGroup);
  clearGroup(itemsGroup);
  itemMeshes.clear();
  const wh = currentWallH();
  for (const w of state.walls) wallsGroup.add(buildWall(w, wh));
  for (const it of state.items) {
    const g = buildItem(it);
    itemMeshes.set(it.id, g);
    itemsGroup.add(g);
  }
  refreshHighlights();
}

function buildUnderlay() {
  if (underlayMesh) {
    scene.remove(underlayMesh);
    underlayMesh.geometry.dispose();
    underlayMesh.material.map?.dispose();
    underlayMesh.material.dispose();
    underlayMesh = null;
  }
  const u = state.underlay;
  if (!u) return;
  const tex = new THREE.TextureLoader().load(u.src);
  tex.colorSpace = THREE.SRGBColorSpace;
  const h = u.width * u.aspect;
  underlayMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(u.width, h),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: u.opacity, depthWrite: false }),
  );
  underlayMesh.rotation.x = -Math.PI / 2;
  underlayMesh.position.set(u.x + u.width / 2, 0.004, u.z + h / 2);
  scene.add(underlayMesh);
}

// ---------- Overlap checks ----------

function itemRect(it) {
  const a = -deg2rad(it.rot);
  return { cx: it.x, cz: it.z, hw: it.w / 2, hd: it.d / 2, u: [Math.cos(a), -Math.sin(a)], v: [Math.sin(a), Math.cos(a)] };
}

function wallRect(w) {
  const dx = w.x2 - w.x1;
  const dz = w.z2 - w.z1;
  const len = Math.hypot(dx, dz) || 1e-6;
  return {
    cx: (w.x1 + w.x2) / 2, cz: (w.z1 + w.z2) / 2, hw: (len + w.t) / 2, hd: w.t / 2,
    u: [dx / len, dz / len], v: [-dz / len, dx / len],
  };
}

// Separating-axis test for two rotated rectangles. Touching counts as clear.
function overlaps(A, B) {
  const radius = (R, n) => R.hw * Math.abs(R.u[0] * n[0] + R.u[1] * n[1]) + R.hd * Math.abs(R.v[0] * n[0] + R.v[1] * n[1]);
  for (const n of [A.u, A.v, B.u, B.v]) {
    const gap = Math.abs((B.cx - A.cx) * n[0] + (B.cz - A.cz) * n[1]);
    if (gap >= radius(A, n) + radius(B, n) - 0.005) return false;
  }
  return true;
}

function findConflicts() {
  const bad = new Set();
  const solid = state.items.filter((it) => !spec(it).flat || spec(it).clearance);
  const rects = new Map(solid.map((it) => [it.id, itemRect(it)]));
  for (let i = 0; i < solid.length; i++) {
    for (let j = i + 1; j < solid.length; j++) {
      const a = spec(solid[i]);
      const b = spec(solid[j]);
      if (a.clearance && b.clearance) continue;
      if ((a.tuck && b.under) || (a.under && b.tuck)) continue; // chairs tuck under tables
      if (overlaps(rects.get(solid[i].id), rects.get(solid[j].id))) {
        bad.add(solid[i].id);
        bad.add(solid[j].id);
      }
    }
  }
  const wallRects = state.walls.map(wallRect);
  for (const it of solid) {
    if (spec(it).flat) continue;
    if (wallRects.some((wr) => overlaps(rects.get(it.id), wr))) bad.add(it.id);
  }
  return bad;
}

function refreshHighlights() {
  const bad = findConflicts();
  for (const [id, g] of itemMeshes) {
    const sel = selection?.kind === 'item' && selection.id === id;
    for (const m of g.userData.mats) {
      m.emissive.set(bad.has(id) ? 0xd11a1a : sel ? 0x2b5cff : 0x000000);
      m.emissiveIntensity = bad.has(id) ? 0.55 : sel ? 0.35 : 0;
    }
  }
  for (const m of wallsGroup.children) {
    const sel = selection?.kind === 'wall' && selection.id === m.userData.id;
    m.userData.mat.color.set(sel ? '#2563eb' : wallColor());
  }
  $('#conflicts').textContent = bad.size ? `⚠ ${bad.size} piece${bad.size > 1 ? 's' : ''} overlap a wall or each other` : '';
}

// Pull an item flush against a nearby wall face (only when square to the axes).
function magnet(it, x, z) {
  const r = ((it.rot % 360) + 360) % 360;
  if (r % 90 !== 0) return { x, z };
  const [hx, hz] = r % 180 === 0 ? [it.w / 2, it.d / 2] : [it.d / 2, it.w / 2];
  let bx = null;
  let bz = null;
  let bdx = 0.12;
  let bdz = 0.12;
  for (const w of state.walls) {
    const t = w.t / 2;
    if (Math.abs(w.z1 - w.z2) < 1e-6) {
      const lo = Math.min(w.x1, w.x2) - t;
      const hi = Math.max(w.x1, w.x2) + t;
      if (x + hx <= lo || x - hx >= hi) continue;
      for (const target of [w.z1 + t + hz, w.z1 - t - hz]) {
        if (Math.abs(z - target) < bdz) { bdz = Math.abs(z - target); bz = target; }
      }
    } else if (Math.abs(w.x1 - w.x2) < 1e-6) {
      const lo = Math.min(w.z1, w.z2) - t;
      const hi = Math.max(w.z1, w.z2) + t;
      if (z + hz <= lo || z - hz >= hi) continue;
      for (const target of [w.x1 + t + hx, w.x1 - t - hx]) {
        if (Math.abs(x - target) < bdx) { bdx = Math.abs(x - target); bx = target; }
      }
    }
  }
  return { x: bx ?? x, z: bz ?? z };
}

// ---------- Pointer input ----------

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function setRay(e) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
}

function floorPoint(e) {
  setRay(e);
  const v = new THREE.Vector3();
  return raycaster.ray.intersectPlane(floorPlane, v) ? { x: v.x, z: v.z } : null;
}

function pick(e) {
  setRay(e);
  const hits = raycaster.intersectObjects([...itemsGroup.children, ...wallsGroup.children], true);
  for (const h of hits) {
    if (h.object.isLine) continue;
    let o = h.object;
    while (o && !o.userData.kind) o = o.parent;
    if (o) return { kind: o.userData.kind, id: o.userData.id };
  }
  return null;
}

function axisLock(dx, dz) {
  if (Math.abs(dz) < Math.abs(dx) * 0.15) return { dx, dz: 0 };
  if (Math.abs(dx) < Math.abs(dz) * 0.15) return { dx: 0, dz };
  return { dx, dz };
}

function nearestEndpoint(p, radius) {
  let best = null;
  let bd = radius;
  for (const w of state.walls) {
    for (const q of [{ x: w.x1, z: w.z1 }, { x: w.x2, z: w.z2 }]) {
      const d = dist(p, q);
      if (d < bd) { bd = d; best = q; }
    }
  }
  return best;
}

function wallTarget(p, free) {
  const prev = wallDraft ? wallDraft[wallDraft.length - 1] : null;
  if (prev && typed) {
    let { dx, dz } = free ? { dx: p.x - prev.x, dz: p.z - prev.z } : axisLock(p.x - prev.x, p.z - prev.z);
    if (Math.hypot(dx, dz) < 1e-6) { dx = 1; dz = 0; }
    const n = Math.hypot(dx, dz);
    const L = parseLen(typed) || 0;
    return { x: prev.x + (dx / n) * L, z: prev.z + (dz / n) * L };
  }
  const near = nearestEndpoint(p, 0.2);
  if (near) return near;
  let x = snap(p.x, IN);
  let z = snap(p.z, IN);
  if (prev && !free) {
    const l = axisLock(x - prev.x, z - prev.z);
    x = prev.x + l.dx;
    z = prev.z + l.dz;
  }
  return { x, z };
}

function measurePoint(p, from, free) {
  let x = snap(p.x, IN / 2);
  let z = snap(p.z, IN / 2);
  if (from && !free) {
    const l = axisLock(x - from.x, z - from.z);
    x = from.x + l.dx;
    z = from.z + l.dz;
  }
  return { x, z };
}

function onPointerDown(e) {
  canvas.setPointerCapture(e.pointerId);
  const p = floorPoint(e);
  if (e.button !== 0) {
    if (view === 'plan') startPan(e);
    return;
  }
  if (tool === 'wall') {
    orbit.enabled = false;
    if (p) addWallPoint(p, e.shiftKey);
    return;
  }
  if (tool === 'room') {
    orbit.enabled = false;
    if (p) {
      const x = snap(p.x, IN);
      const z = snap(p.z, IN);
      roomDrag = { x0: x, z0: z, x1: x, z1: z };
    }
    return;
  }
  if (tool === 'measure') {
    orbit.enabled = false;
    if (p) {
      const a = measurePoint(p);
      measure = { a, b: a };
      measuring = true;
      drawPreview();
    }
    return;
  }
  const hit = pick(e);
  if (hit) {
    orbit.enabled = false;
    select(hit);
    if (hit.kind === 'item' && p) {
      const it = getItem(hit.id);
      drag = { id: it.id, dx: it.x - p.x, dz: it.z - p.z, before: snapshot(), moved: false };
    }
    return;
  }
  select(null);
  if (view === 'plan') startPan(e);
}

function startPan(e) {
  pan = { x: e.clientX, y: e.clientY, cx: plan.cx, cz: plan.cz };
  canvas.style.cursor = 'grabbing';
}

function onPointerMove(e) {
  const p = floorPoint(e);
  if (p) $('#coords').textContent = `x ${fmtLen(p.x)} · z ${fmtLen(p.z)}`;

  if (pan) {
    const mPerPx = plan.viewH / canvas.clientHeight;
    plan.cx = pan.cx - (e.clientX - pan.x) * mPerPx;
    plan.cz = pan.cz - (e.clientY - pan.y) * mPerPx;
    updateOrtho();
    return;
  }
  if (drag) {
    const it = getItem(drag.id);
    if (!it || !p) return;
    let x = p.x + drag.dx;
    let z = p.z + drag.dz;
    if (!e.altKey) {
      x = snap(x, IN / 2);
      z = snap(z, IN / 2);
      ({ x, z } = magnet(it, x, z));
    }
    if (!drag.moved) {
      if (Math.hypot(x - it.x, z - it.z) < 0.005) return;
      undoStack.push(drag.before);
      redoStack.length = 0;
      drag.moved = true;
    }
    it.x = x;
    it.z = z;
    placeItemMesh(it);
    refreshHighlights();
    return;
  }
  if (roomDrag) {
    if (p) {
      roomDrag.x1 = snap(p.x, IN);
      roomDrag.z1 = snap(p.z, IN);
      drawPreview();
    }
    return;
  }
  if (measuring) {
    if (p) {
      measure.b = measurePoint(p, measure.a, e.shiftKey);
      drawPreview();
    }
    return;
  }
  if (tool === 'wall' && p) {
    lastPointer = { p, free: e.shiftKey };
    drawPreview();
  }
}

function onPointerUp(e) {
  if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  if (drag?.moved) {
    saveLocal();
    updateButtons();
  }
  drag = null;
  if (pan) {
    pan = null;
    canvas.style.cursor = tool === 'select' ? '' : 'crosshair';
  }
  if (roomDrag) finishRoom();
  if (measuring) {
    measuring = false;
    renderPanel();
  }
  orbit.enabled = view === '3d';
}

function onWheel(e) {
  if (view !== 'plan') return;
  e.preventDefault();
  const before = floorPoint(e);
  plan.viewH = clamp(plan.viewH * Math.exp(e.deltaY * 0.0015), 1.5, 80);
  updateOrtho();
  const after = floorPoint(e);
  if (before && after) {
    plan.cx += before.x - after.x;
    plan.cz += before.z - after.z;
    updateOrtho();
  }
}

// ---------- Drawing tools ----------

function addWallPoint(p, free) {
  const q = wallTarget(p, free);
  if (!wallDraft) {
    wallDraft = [q];
    typed = '';
    drawPreview();
    return;
  }
  const prev = wallDraft[wallDraft.length - 1];
  if (dist(prev, q) < 0.05) return;
  checkpoint();
  state.walls.push(wall(prev.x, prev.z, q.x, q.z));
  wallDraft.push(q);
  typed = '';
  changed();
  if (dist(q, wallDraft[0]) < 1e-6) finishWallChain(); // closed the loop
  else drawPreview();
}

function finishWallChain() {
  wallDraft = null;
  typed = '';
  drawPreview();
}

function finishRoom() {
  const { x0, z0, x1, z1 } = roomDrag;
  roomDrag = null;
  drawPreview();
  if (Math.abs(x1 - x0) < 0.5 || Math.abs(z1 - z0) < 0.5) return;
  checkpoint();
  const pts = [[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0, z0]];
  for (let i = 1; i < pts.length; i++) state.walls.push(wall(...pts[i - 1], ...pts[i]));
  changed();
}

function ghostWall(a, b, height) {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(Math.hypot(dx, dz) + WALL_T, height, WALL_T),
    new THREE.MeshBasicMaterial({ color: 0x2563eb, transparent: true, opacity: 0.45, depthWrite: false }),
  );
  m.position.set((a.x + b.x) / 2, height / 2, (a.z + b.z) / 2);
  m.rotation.y = -Math.atan2(dz, dx);
  return m;
}

function marker(p, color = 0x2563eb) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 20), new THREE.MeshBasicMaterial({ color }));
  m.position.set(p.x, 0.03, p.z);
  return m;
}

function drawPreview() {
  clearGroup(previewGroup);
  previewLabels = [];
  const h = currentWallH();

  if (tool === 'wall' && lastPointer) {
    const q = wallTarget(lastPointer.p, lastPointer.free);
    previewGroup.add(marker(q));
    if (wallDraft) {
      const prev = wallDraft[wallDraft.length - 1];
      previewGroup.add(ghostWall(prev, q, h));
      previewLabels.push({
        key: 'pw', cls: 'lbl dim', text: typed ? `${/'/.test(typed) ? typed : `${typed}″`} ↵` : fmtLen(dist(prev, q)),
        x: (prev.x + q.x) / 2, y: h, z: (prev.z + q.z) / 2,
      });
    }
  }

  if (roomDrag) {
    const { x0, z0, x1, z1 } = roomDrag;
    const c = [{ x: x0, z: z0 }, { x: x1, z: z0 }, { x: x1, z: z1 }, { x: x0, z: z1 }];
    for (let i = 0; i < 4; i++) previewGroup.add(ghostWall(c[i], c[(i + 1) % 4], h));
    previewLabels.push({
      key: 'pr', cls: 'lbl dim', text: `${fmtLen(Math.abs(x1 - x0))} × ${fmtLen(Math.abs(z1 - z0))}`,
      x: (x0 + x1) / 2, y: 0.05, z: (z0 + z1) / 2,
    });
  }

  if (measure) {
    const { a, b } = measure;
    const len = dist(a, b);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(len, 0.02, 0.025), new THREE.MeshBasicMaterial({ color: 0x111827 }));
    bar.position.set((a.x + b.x) / 2, 0.04, (a.z + b.z) / 2);
    bar.rotation.y = -Math.atan2(b.z - a.z, b.x - a.x);
    previewGroup.add(bar, marker(a, 0x111827), marker(b, 0x111827));
    previewLabels.push({ key: 'pm', cls: 'lbl measure', text: fmtLen(len), x: (a.x + b.x) / 2, y: 0.05, z: (a.z + b.z) / 2 });
  }
}

// ---------- Labels ----------

const labelsEl = $('#labels');
const labelPool = new Map();
const tmpV = new THREE.Vector3();

function updateLabels() {
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  const want = [];
  const add = (key, cls, text, x, y, z, dy = 0) => want.push({ key, cls, text, x, y, z, dy });

  if (view === 'plan') {
    const ppm = H / plan.viewH;
    for (const w of state.walls) {
      const len = Math.hypot(w.x2 - w.x1, w.z2 - w.z1);
      if (len * ppm > 48) add(`w${w.id}`, 'lbl', fmtLen(len), (w.x1 + w.x2) / 2, WALL_H, (w.z1 + w.z2) / 2);
    }
    for (const it of state.items) {
      if (!spec(it).flat && Math.max(it.w, it.d) * ppm > 60) add(`n${it.id}`, 'lbl name', it.name, it.x, it.h, it.z);
    }
  }
  const sel = selection?.kind === 'item' && getItem(selection.id);
  if (sel) add('dim', 'lbl dim', `${inch(sel.w)} × ${inch(sel.d)} × ${inch(sel.h)} in`, sel.x, sel.h + 0.15, sel.z, view === 'plan' ? 16 : -14);
  for (const l of previewLabels) add(l.key, l.cls, l.text, l.x, l.y, l.z);

  const seen = new Set();
  for (const l of want) {
    tmpV.set(l.x, l.y, l.z).project(camera);
    if (tmpV.z > 1 || tmpV.z < -1) continue;
    let el = labelPool.get(l.key);
    if (!el) {
      el = document.createElement('div');
      labelsEl.appendChild(el);
      labelPool.set(l.key, el);
    }
    if (el.className !== l.cls) el.className = l.cls;
    if (el.textContent !== l.text) el.textContent = l.text;
    el.style.left = `${((tmpV.x + 1) / 2) * W}px`;
    el.style.top = `${((1 - tmpV.y) / 2) * H + l.dy}px`;
    seen.add(l.key);
  }
  for (const [k, el] of labelPool) {
    if (!seen.has(k)) {
      el.remove();
      labelPool.delete(k);
    }
  }
}

// ---------- Actions ----------

function select(sel) {
  selection = sel;
  refreshHighlights();
  renderPanel();
}

function addItem(type, at) {
  const p = at ?? (view === 'plan' ? { x: plan.cx, z: plan.cz } : { x: orbit.target.x, z: orbit.target.z });
  checkpoint();
  const it = item(type, snap(p.x, IN), snap(p.z, IN));
  state.items.push(it);
  selection = { kind: 'item', id: it.id };
  setTool('select');
  changed();
}

function deleteSel() {
  if (!selection) return;
  checkpoint();
  if (selection.kind === 'item') state.items = state.items.filter((it) => it.id !== selection.id);
  else state.walls = state.walls.filter((w) => w.id !== selection.id);
  selection = null;
  changed();
}

function duplicateSel() {
  if (selection?.kind !== 'item') return;
  const it = getItem(selection.id);
  checkpoint();
  const copy = { ...it, id: uid(), x: it.x + 0.25, z: it.z + 0.25 };
  state.items.push(copy);
  selection = { kind: 'item', id: copy.id };
  changed();
}

function rotateSel(delta) {
  if (selection?.kind !== 'item') return;
  const it = getItem(selection.id);
  checkpoint();
  it.rot = (((it.rot + delta) % 360) + 360) % 360;
  changed();
}

function nudgeSel(dx, dz) {
  if (selection?.kind !== 'item') return;
  const it = getItem(selection.id);
  checkpoint();
  it.x += dx;
  it.z += dz;
  changed();
}

// Moves the wall's far end; walls joined at that corner follow it.
function setWallLength(w, L) {
  const dx = w.x2 - w.x1;
  const dz = w.z2 - w.z1;
  const len = Math.hypot(dx, dz) || 1;
  const nx = w.x1 + (dx / len) * L;
  const nz = w.z1 + (dz / len) * L;
  const at = (x, z) => Math.hypot(x - w.x2, z - w.z2) < 1e-3;
  for (const o of state.walls) {
    if (o === w) continue;
    if (at(o.x1, o.z1)) { o.x1 = nx; o.z1 = nz; }
    if (at(o.x2, o.z2)) { o.x2 = nx; o.z2 = nz; }
  }
  w.x2 = nx;
  w.z2 = nz;
}

function bounds() {
  const xs = [];
  const zs = [];
  for (const w of state.walls) xs.push(w.x1, w.x2), zs.push(w.z1, w.z2);
  for (const it of state.items) {
    const r = Math.max(it.w, it.d) / 2;
    xs.push(it.x - r, it.x + r);
    zs.push(it.z - r, it.z + r);
  }
  const u = state.underlay;
  if (u) xs.push(u.x, u.x + u.width), zs.push(u.z, u.z + u.width * u.aspect);
  if (!xs.length) return { x0: 0, z0: 0, x1: 10, z1: 8 };
  return { x0: Math.min(...xs), z0: Math.min(...zs), x1: Math.max(...xs), z1: Math.max(...zs) };
}

function fit() {
  const b = bounds();
  const cx = (b.x0 + b.x1) / 2;
  const cz = (b.z0 + b.z1) / 2;
  const w = b.x1 - b.x0;
  const d = b.z1 - b.z0;
  const aspect = stage.clientWidth / Math.max(1, stage.clientHeight);
  Object.assign(plan, { cx, cz, viewH: Math.max(d, w / aspect, 3) * 1.2 });
  updateOrtho();

  const size = Math.max(w, d, 4);
  orbit.target.set(cx, 0, cz);
  persp.position.set(cx + size * 0.2, size * 1.05 + 1, cz + size * 1.2 + 1);
  orbit.update();

  sun.position.set(cx + 5, 14, cz + 4);
  sun.target.position.set(cx, 0, cz);
  const half = size / 2 + 4;
  Object.assign(sun.shadow.camera, { left: -half, right: half, top: half, bottom: -half, near: 1, far: 50 });
  sun.shadow.camera.updateProjectionMatrix();
}

function setView(v) {
  if (v === '3d' && view !== '3d') {
    // Keep the 3D camera's angle but centre it on what the plan was showing.
    const offset = persp.position.clone().sub(orbit.target);
    orbit.target.set(plan.cx, 0, plan.cz);
    persp.position.copy(orbit.target).add(offset);
    orbit.update();
  }
  view = v;
  camera = v === 'plan' ? ortho : persp;
  orbit.enabled = v === '3d';
  sun.castShadow = v === '3d';
  for (const b of document.querySelectorAll('#viewSeg button')) b.classList.toggle('on', b.dataset.view === v);
  rebuild();
  drawPreview();
  updateButtons();
  updateHint();
}

function setTool(t) {
  tool = t;
  if (t !== 'wall') {
    wallDraft = null;
    typed = '';
    lastPointer = null;
  }
  if (t !== 'measure') measure = null;
  if (t !== 'select') {
    selection = null;
    refreshHighlights();
  }
  for (const b of document.querySelectorAll('#toolSeg button')) b.classList.toggle('on', b.dataset.tool === t);
  canvas.style.cursor = t === 'select' ? '' : 'crosshair';
  drawPreview();
  updateHint();
  renderPanel();
}

function toggleLowWalls() {
  lowWalls = !lowWalls;
  rebuild();
  updateButtons();
}

function updateButtons() {
  $('#undoBtn').disabled = !undoStack.length;
  $('#redoBtn').disabled = !redoStack.length;
  const low = $('#lowBtn');
  low.disabled = view !== '3d';
  low.classList.toggle('on', lowWalls && view === '3d');
}

const HINTS = {
  select: {
    plan: 'Click to select · drag furniture to move (snaps to walls, ⌥ for free) · R rotates · drag empty space to pan · scroll to zoom',
    '3d': 'Drag to orbit · right-drag to pan · scroll to zoom · drag furniture to move it · R rotates',
  },
  wall: "Click to place corners · type a length (134 for inches, 11'2 for feet) then Enter · double-click or Esc to finish · ⇧ for any angle",
  room: 'Drag to draw a rectangular room',
  measure: 'Drag to measure · ⇧ for any angle',
};

let flashTimer = 0;
function updateHint() {
  if (flashTimer) return;
  const h = HINTS[tool];
  $('#hint').textContent = typeof h === 'string' ? h : h[view];
}

function flash(msg) {
  clearTimeout(flashTimer);
  $('#hint').textContent = msg;
  flashTimer = setTimeout(() => {
    flashTimer = 0;
    updateHint();
  }, 3500);
}

// ---------- Side panels ----------

function renderLibrary() {
  const groups = [...new Set(CATALOG.map((c) => c.group))];
  $('#library').innerHTML = groups
    .map((g) => `<h3>${esc(g)}</h3>${CATALOG.filter((c) => c.group === g)
      .map((c) => `<button class="lib-item" draggable="true" data-type="${c.type}" title="Click to add, or drag onto the plan"><span>${esc(c.name)}</span><small>${inch(c.w)}×${inch(c.d)}″</small></button>`)
      .join('')}`)
    .join('');
}

function renderPanel() {
  const el = $('#panel');
  const sel = selection && findSel(selection);
  if (selection && !sel) selection = null;

  if (selection?.kind === 'item') {
    const it = sel;
    el.innerHTML = `
      <h2>${esc(it.name)}</h2>
      <div class="row"><label>Name<input type="text" data-f="name" value="${esc(it.name)}"></label></div>
      <div class="row">
        <label>Width (in)<input type="number" data-f="w" min="0.5" step="0.5" value="${inch(it.w)}"></label>
        <label>Depth (in)<input type="number" data-f="d" min="0.5" step="0.5" value="${inch(it.d)}"></label>
        <label>Height (in)<input type="number" data-f="h" min="0.5" step="0.5" value="${inch(it.h)}"></label>
      </div>
      <div class="row">
        <label>Rotation (°)<input type="number" data-f="rot" step="15" value="${it.rot}"></label>
        <label>Colour<input type="color" data-f="color" value="${esc(it.color)}"></label>
      </div>
      <div class="row"><button data-act="rotL">⟲ 90°</button><button data-act="rotR">⟳ 90°</button></div>
      <div class="row"><button data-act="dup">Duplicate</button><button data-act="del" class="danger">Delete</button></div>
      <p class="note">Drag it to move. It snaps flush against walls; hold ⌥ to place it freely. Arrow keys nudge by 1″ (⇧ for 12″). Red means it overlaps a wall or another piece.</p>`;
    return;
  }

  if (selection?.kind === 'wall') {
    const w = sel;
    el.innerHTML = `
      <h2>${esc(w.name ?? 'Wall')}</h2>
      <div class="row">
        <label>Length (in)<input type="number" data-f="len" min="4" step="0.5" value="${inch(dist({ x: w.x1, z: w.z1 }, { x: w.x2, z: w.z2 }))}"></label>
        <label>Thickness (in)<input type="number" data-f="t" min="1" max="24" step="0.5" value="${inch(w.t)}"></label>
      </div>
      <div class="row">
        <label>Height (in)<input type="number" data-f="wh" min="1" step="1" placeholder="ceiling" value="${w.h ? inch(w.h) : ''}"></label>
        <label>Solid height (in)<input type="number" data-f="solid" min="0" step="1" placeholder="full" value="${w.solidH ? inch(w.solidH) : ''}"></label>
      </div>
      <div class="row"><button data-act="del" class="danger">Delete wall</button></div>
      <p class="note">Changing the length moves the wall's far end. Walls joined at that corner move with it. Lengths are measured along the centre of the wall. Set a solid height for a half-wall with glass above; leave it empty for a full wall.</p>`;
    return;
  }

  const b = bounds();
  const u = state.underlay;
  const mlen = measure ? dist(measure.a, measure.b) : 0;
  el.innerHTML = `
    <h2>Your floor</h2>
    <p class="note" style="margin-top:0">${state.walls.length} walls · ${state.items.length} pieces${state.walls.length ? ` · outline ${fmtLen(b.x1 - b.x0)} × ${fmtLen(b.z1 - b.z0)}` : ''}</p>
    ${u ? `
      <h3>Traced image</h3>
      ${mlen > 0.05 ? `
        <div class="calib">
          <p>Your measured line is <b>${fmtLen(mlen)}</b> on the image. What is it really?</p>
          <div class="row"><label>Real length (in, or 11'2)<input type="text" id="calibLen" value="${inch(mlen)}"></label><button data-act="calibrate">Scale image</button></div>
        </div>` : `<p class="note" style="margin:0 0 8px">To scale it, pick <b>Measure</b> and drag along a wall whose length is printed on the plan. Then enter that length here.</p>`}
      <div class="row">
        <label>Width (in)<input type="number" data-u="width" min="24" step="1" value="${Math.round(u.width / IN)}"></label>
        <label>Opacity<input type="range" data-u="opacity" min="0.1" max="1" step="0.05" value="${u.opacity}"></label>
      </div>
      <div class="row">
        <label>Left (in)<input type="number" data-u="x" step="1" value="${Math.round(u.x / IN)}"></label>
        <label>Top (in)<input type="number" data-u="z" step="1" value="${Math.round(u.z / IN)}"></label>
      </div>
      <div class="row"><button data-act="rmUnderlay" class="danger">Remove image</button></div>` : ''}
    <h3>Getting started</h3>
    <ol>
      <li><b>Walls.</b> Use <b>Room</b> to drag out a rectangle, or <b>Wall</b> to click corner by corner. To copy a listing, use <b>Trace image…</b> and draw over it.</li>
      <li><b>Furniture.</b> Click or drag pieces in from the left. Sizes are real; select a piece to type its exact size in inches.</li>
      <li><b>Look around.</b> Switch to <b>3D</b> and orbit. Use <b>Low walls</b> to see into rooms.</li>
    </ol>
    <h3>Shortcuts</h3>
    <div class="keys">
      <kbd>V W M D</kbd><span>Select, wall, room, measure</span>
      <kbd>P / 3</kbd><span>Plan or 3D view</span>
      <kbd>R / ⇧R</kbd><span>Rotate 90°</span>
      <kbd>⌘D</kbd><span>Duplicate</span>
      <kbd>⌫</kbd><span>Delete</span>
      <kbd>⌘Z / ⇧⌘Z</kbd><span>Undo / redo</span>
      <kbd>F</kbd><span>Fit plan in view</span>
      <kbd>C</kbd><span>Low walls (3D)</span>
    </div>
    <p class="note">Everything saves in this browser automatically. Use <b>Save file</b> to keep a copy or move it to another computer.</p>`;
}

const panel = $('#panel');

panel.addEventListener('input', (e) => {
  if (e.target.dataset.u === 'opacity' && state.underlay) {
    state.underlay.opacity = parseFloat(e.target.value);
    if (underlayMesh) underlayMesh.material.opacity = state.underlay.opacity;
    saveLocal();
  }
});

panel.addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.u && t.dataset.u !== 'opacity' && state.underlay) {
    const v = parseFloat(t.value);
    if (Number.isFinite(v)) state.underlay[t.dataset.u] = t.dataset.u === 'width' ? Math.max(24, v) * IN : v * IN;
    buildUnderlay();
    saveLocal();
    return;
  }
  const f = t.dataset.f;
  if (!f || !selection) return;
  const sel = findSel(selection);
  if (!sel) return;
  const v = parseFloat(t.value);

  if (selection.kind === 'item') {
    if (f === 'name') {
      if (!t.value.trim()) return renderPanel();
      checkpoint();
      sel.name = t.value.trim();
    } else if (f === 'color') {
      checkpoint();
      sel.color = t.value;
    } else {
      if (!Number.isFinite(v)) return renderPanel();
      checkpoint();
      if (f === 'rot') sel.rot = ((v % 360) + 360) % 360;
      else sel[f] = Math.max(0.5, v) * IN;
    }
  } else {
    if (!Number.isFinite(v) && f !== 'solid' && f !== 'wh') return renderPanel();
    checkpoint();
    if (f === 'len') setWallLength(sel, Math.max(4, v) * IN);
    if (f === 't') sel.t = clamp(v, 1, 24) * IN;
    if (f === 'solid') sel.solidH = v > 0 && v < WALL_H / IN ? v * IN : undefined;
    if (f === 'wh') sel.h = v > 0 && v < WALL_H / IN ? v * IN : undefined;
  }
  changed();
});

panel.addEventListener('click', (e) => {
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act === 'rotL') rotateSel(-90);
  if (act === 'rotR') rotateSel(90);
  if (act === 'dup') duplicateSel();
  if (act === 'del') deleteSel();
  if (act === 'rmUnderlay') {
    state.underlay = null;
    buildUnderlay();
    saveLocal();
    renderPanel();
  }
  if (act === 'calibrate' && measure && state.underlay) {
    const real = parseLen($('#calibLen').value);
    const measured = dist(measure.a, measure.b);
    if (!(real > 0) || measured < 0.01) return;
    const u = state.underlay;
    const k = real / measured;
    // Scale about the measured line's start so that spot stays under the cursor.
    u.x = measure.a.x + (u.x - measure.a.x) * k;
    u.z = measure.a.z + (u.z - measure.a.z) * k;
    u.width *= k;
    measure = null;
    buildUnderlay();
    saveLocal();
    drawPreview();
    fit();
    setTool('wall');
    flash('Image scaled. Now trace the walls: click each corner, double-click to finish.');
  }
});

// ---------- Toolbar, library, files, keyboard ----------

for (const b of document.querySelectorAll('#viewSeg button')) b.addEventListener('click', () => setView(b.dataset.view));
for (const b of document.querySelectorAll('#toolSeg button')) b.addEventListener('click', () => setTool(b.dataset.tool));
$('#undoBtn').addEventListener('click', undo);
$('#redoBtn').addEventListener('click', redo);
$('#fitBtn').addEventListener('click', fit);
$('#lowBtn').addEventListener('click', toggleLowWalls);

const library = $('#library');
library.addEventListener('click', (e) => {
  const b = e.target.closest('[data-type]');
  if (b) addItem(b.dataset.type);
});
library.addEventListener('dragstart', (e) => {
  const b = e.target.closest('[data-type]');
  if (b) e.dataTransfer.setData('text/x-item', b.dataset.type);
});

$('#sampleBtn').addEventListener('click', () => {
  checkpoint();
  const s = apartmentState();
  state.walls = s.walls;
  state.items = s.items;
  selection = null;
  changed();
  fit();
  flash('Your apartment plan is reloaded. ⌘Z brings back what you had.');
});

$('#clearBtn').addEventListener('click', () => {
  checkpoint();
  state.walls = [];
  state.items = [];
  selection = null;
  changed();
  setTool('room');
  flash('Empty plan. Drag out your first room, or ⌘Z to undo.');
});

$('#exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'floor-plan.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

$('#importBtn').addEventListener('click', () => $('#importFile').click());
$('#importFile').addEventListener('change', async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const s = JSON.parse(await f.text());
    if (!Array.isArray(s.walls) || !Array.isArray(s.items)) throw new Error('not a floor plan');
    checkpoint();
    state = { walls: s.walls, items: s.items, underlay: s.underlay ?? null };
    selection = null;
    buildUnderlay();
    changed();
    fit();
    flash(`Opened ${f.name}`);
  } catch {
    flash(`Couldn't open ${f.name}: it isn't a floor-plan file saved from this app.`);
  }
});

$('#underlayBtn').addEventListener('click', () => $('#underlayFile').click());
$('#underlayFile').addEventListener('change', (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  const img = new Image();
  img.onload = () => {
    // Shrink big images so the plan still fits in browser storage.
    const k = Math.min(1, 2000 / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    URL.revokeObjectURL(img.src);
    state.underlay = { src: c.toDataURL('image/jpeg', 0.85), aspect: c.height / c.width, width: 10, x: 0, z: 0, opacity: 0.6 };
    buildUnderlay();
    saveLocal();
    selection = null;
    if (view !== 'plan') setView('plan');
    fit();
    setTool('measure');
    flash('Image added. Drag along a wall with a known length to scale it.');
  };
  img.onerror = () => flash(`Couldn't read ${f.name} as an image.`);
  img.src = URL.createObjectURL(f);
});

addEventListener('keydown', (e) => {
  if (e.target.closest?.('input, textarea, select')) return;
  const mod = e.metaKey || e.ctrlKey;
  const k = e.key.toLowerCase();
  if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && k === 'y') { e.preventDefault(); redo(); return; }
  if (mod && k === 'd') { e.preventDefault(); duplicateSel(); return; }
  if (mod) return;

  if (tool === 'wall' && wallDraft) {
    if (/^[0-9.'" ]$/.test(e.key)) { typed += e.key; drawPreview(); return; }
    if (e.key === 'Backspace' && typed) { typed = typed.slice(0, -1); drawPreview(); return; }
    if (e.key === 'Enter') {
      if (typed && lastPointer) addWallPoint(lastPointer.p, lastPointer.free);
      else finishWallChain();
      return;
    }
  }

  const step = e.shiftKey ? FT : IN;
  switch (e.key) {
    case 'Escape':
      if (wallDraft) finishWallChain();
      else if (measure) { measure = null; drawPreview(); renderPanel(); }
      else if (tool !== 'select') setTool('select');
      else select(null);
      return;
    case 'Delete':
    case 'Backspace':
      e.preventDefault();
      deleteSel();
      return;
    case 'ArrowLeft': e.preventDefault(); nudgeSel(-step, 0); return;
    case 'ArrowRight': e.preventDefault(); nudgeSel(step, 0); return;
    case 'ArrowUp': e.preventDefault(); nudgeSel(0, -step); return;
    case 'ArrowDown': e.preventDefault(); nudgeSel(0, step); return;
  }
  switch (k) {
    case 'v': setTool('select'); break;
    case 'w': setTool('wall'); break;
    case 'm': setTool('room'); break;
    case 'd': setTool('measure'); break;
    case 'p': setView('plan'); break;
    case '3': setView('3d'); break;
    case 'f': fit(); break;
    case 'c': if (view === '3d') toggleLowWalls(); break;
    case 'r': rotateSel(e.shiftKey ? -90 : 90); break;
  }
});

// ---------- Start ----------

function frame() {
  requestAnimationFrame(frame);
  if (view === '3d') orbit.update();
  renderer.render(scene, camera);
  updateLabels();
}

renderLibrary();
resize();
buildUnderlay();
fit();
setView('plan');
setTool('select');
updateButtons();
frame();
