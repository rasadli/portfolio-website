// The Living System: the hero's interactive model.
// An exploded axonometric of a concept backend. Copy comes from content/portfolio.mjs,
// so the 3D model and the rest of the site share one source of truth.
import { explorer } from '../content/portfolio.mjs';

const root = document.getElementById('top');
const stage = document.getElementById('ls-stage');
const labelLayer = document.getElementById('ls-labels');
const plateLayer = document.getElementById('ls-plates');
const panel = document.getElementById('ls-panel');
const traceEl = document.getElementById('ls-trace');
const motionBtn = document.getElementById('ls-motion');
const resetBtn = document.getElementById('ls-reset');
const hint = document.getElementById('ls-hint');

// The open panel must stop above the footer, whose height varies with width and copy.
const foot = root.querySelector('.ls-foot');
const setFoot = () => root.style.setProperty('--ls-foot', `${foot.offsetHeight}px`);
setFoot();
new ResizeObserver(setFoot).observe(foot);

const mqFlow = matchMedia('(max-width: 820px)');
const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
const coarse = matchMedia('(pointer: coarse)').matches;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = (n) => String(n).padStart(2, '0');
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeOut = (t) => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

/* ---------- Model: layers, placement, routes ---------- */
// Plates are stacked top to bottom as listed in content; y is each plate's top surface.
// The lowest plate is graphite: the durable layer.
const GAP = 2.4;
const LAYERS = explorer.layers.map((l, i, all) => ({ ...l, y: (all.length - 1 - i) * GAP, dark: i === all.length - 1 }));
const JOURNEYS = explorer.journeys;
const RISER_OFFSET = { 'service-events': [0, -0.3], 'worker-logs': [0.2, 0] }; // keeps parallel risers apart

const layerById = Object.fromEntries(LAYERS.map((l) => [l.id, l]));
const nodes = explorer.nodes.filter((n) => layerById[n.place[0]]).map((n) => {
  const [lid, x, z] = n.place;
  return { ...n, layer: layerById[lid], x, z };
});
const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
LAYERS.forEach((L) => nodes.filter((n) => n.layer === L).forEach((n, i) => { n.code = `${L.code}.${pad(i + 1)}`; }));
const edges = explorer.edges.filter((e) => byId[e.a] && byId[e.b]).map((e) => ({ ...e, key: `${e.a}-${e.b}` }));
const ASYNC = new Set(edges.filter((e) => e.async).map((e) => e.key));
const neighbours = (id) => edges.filter((e) => e.a === id || e.b === id).map((e) => (e.a === id ? e.b : e.a));

/* ---------- DOM: labels and panel. The component index is static HTML from build.mjs. ---------- */
const labels = new Map();
LAYERS.flatMap((L) => nodes.filter((n) => n.layer === L)).forEach((n) => {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'ls-label';
  b.dataset.node = n.id;
  b.setAttribute('aria-pressed', 'false');
  b.innerHTML = `<span class="ls-ref">${n.code}</span> ${esc(n.label)}`;
  labelLayer.append(b);
  labels.set(n.id, b);
});
const plateLabels = LAYERS.map((L) => {
  const d = document.createElement('div');
  d.className = 'ls-plate';
  d.innerHTML = `<b><span>${L.code}</span><em>${esc(L.name)}</em></b>`;
  plateLayer.append(d);
  return d;
});

let selected = null;
let scene = null;

function renderPanel(n) {
  const [href, text] = n.related;
  const nb = neighbours(n.id).map((id) => `<button type="button" class="ls-nb" data-node="${id}">${esc(byId[id].label)}</button>`).join('');
  panel.innerHTML = `<p class="ls-p-meta"><b>${n.code}</b><span>${esc(n.layer.name)} layer</span><span>Concept component</span></p>
    <h2 class="ls-p-title">${esc(n.label)}</h2>
    <p class="ls-p-role">${esc(n.role)}</p>
    <p class="ls-p-text">${esc(n.concept)}</p>
    <dl class="ls-p-dl">
      <div><dt>In my work</dt><dd>${esc(n.work)}</dd></div>
      <div><dt>Connects to</dt><dd>${nb}</dd></div>
    </dl>
    <p class="ls-p-links"><a class="link" href="${href}">${esc(text)} <span aria-hidden="true">→</span></a><button type="button" class="ls-back" data-reset>Back to overview</button></p>`;
}

function select(id) {
  selected = id && byId[id] ? id : null;
  const near = new Set(selected ? neighbours(selected) : []);
  root.querySelectorAll('[data-node][aria-pressed]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.node === selected)));
  labels.forEach((b, nid) => {
    b.classList.toggle('is-near', near.has(nid));
    b.classList.toggle('is-dim', !!selected && nid !== selected && !near.has(nid));
  });
  root.classList.toggle('has-sel', !!selected);
  if (selected) { renderPanel(byId[selected]); panel.hidden = false; } else { panel.hidden = true; panel.innerHTML = ''; }
  scene?.select(selected);
}

function reset() {
  const hadSel = selected;
  select(null);
  scene?.resetView();
  if (hadSel && labels.has(hadSel) && !root.classList.contains('is-flow')) labels.get(hadSel).focus({ preventScroll: true });
}

root.addEventListener('click', (e) => {
  if (e.target.closest('[data-reset]')) { reset(); return; }
  const b = e.target.closest('[data-node]');
  if (b) select(b.dataset.node);
});
labelLayer.addEventListener('pointerover', (e) => { const b = e.target.closest('[data-node]'); if (b) scene?.hover(b.dataset.node); });
labelLayer.addEventListener('pointerout', (e) => { if (e.target.closest('[data-node]')) scene?.hover(null); });
labelLayer.addEventListener('focusin', (e) => { const b = e.target.closest('[data-node]'); if (b) scene?.hover(b.dataset.node); });
labelLayer.addEventListener('focusout', () => scene?.hover(null));
resetBtn.addEventListener('click', reset);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && selected && !document.getElementById('nav').classList.contains('open')) reset();
});

const setFlow = () => { root.classList.toggle('is-flow', mqFlow.matches || root.classList.contains('is-nogl')); scene?.resize(); };
mqFlow.addEventListener('change', setFlow);

/* ---------- Trace readout ---------- */
function showTrace(j) {
  traceEl.innerHTML = `<span>Illustrative trace</span><b>${esc(j.name)}</b><ol>${j.ids.map((id) => `<li>${esc(byId[id].label)}</li>`).join('')}</ol>`;
}
function markHop(i) {
  traceEl.querySelectorAll('li').forEach((li, k) => li.classList.toggle('on', k === i));
}

/* ---------- 3D ---------- */
function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

async function boot() {
  if (!hasWebGL()) throw new Error('WebGL unavailable');
  const THREE = await import('three');
  scene = createScene(THREE);
}

function createScene(THREE) {
  const INK = new THREE.Color('#282d29');
  const CHALK = new THREE.Color('#ebe7dc');
  const LINE_ON_DARK = new THREE.Color('#d6d3c8');
  const VERM = new THREE.Color('#c7533d');
  const VERM_LIGHT = new THREE.Color('#e8826d');
  const BLUSH = new THREE.Color('#f3dcd2');

  const lowPower = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 4;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  stage.prepend(canvas);

  const world = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 120);
  const disposables = [];
  const keep = (x) => { disposables.push(x); return x; };

  /* Lighting: soft sky, one key light with contact shadows, a warm rim */
  world.add(new THREE.HemisphereLight(0xfffdf8, 0xcbc4b4, 1.25));
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(-3.5, 19, 6);
  key.target.position.set(0.5, 3.4, 0);
  key.castShadow = true;
  key.shadow.mapSize.set(lowPower ? 1024 : 2048, lowPower ? 1024 : 2048);
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 45 });
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.02;
  key.shadow.radius = 3;
  world.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xffe4d6, 0.55);
  rim.position.set(9, 6, -8);
  world.add(rim);

  // Soft baked contact shadow under the base plate, so only the model's footprint touches the "table"
  const shadowTex = (() => {
    const c = document.createElement('canvas');
    c.width = 256; c.height = 128;
    const g = c.getContext('2d');
    g.filter = 'blur(14px)';
    g.fillStyle = 'rgba(40,45,41,1)';
    g.fillRect(34, 30, 188, 68);
    return keep(new THREE.CanvasTexture(c));
  })();
  const ground = new THREE.Mesh(keep(new THREE.PlaneGeometry(13, 6.5).rotateX(-Math.PI / 2)), keep(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.2, depthWrite: false })));
  ground.position.set(0.7, -1.1, -0.35);
  world.add(ground);

  /* Plates */
  const PW = 8.4, PD = 4, PT = 0.1;
  const plateGeo = keep(new THREE.BoxGeometry(PW, PT, PD).translate(0, -PT / 2, 0));
  const plateEdgeGeo = keep(new THREE.EdgesGeometry(plateGeo));
  const layerGroups = [];
  const layerLineMats = [];
  LAYERS.forEach((L) => {
    const g = new THREE.Group();
    g.userData.y = L.y;
    const mat = keep(new THREE.MeshStandardMaterial({
      color: L.dark ? 0x28312e : 0xfbfaf6, roughness: L.dark ? 0.7 : 0.55, metalness: 0,
      transparent: true, opacity: L.dark ? 0.96 : 0.5, depthWrite: !!L.dark,
    }));
    const plate = new THREE.Mesh(plateGeo, mat);
    plate.receiveShadow = true;
    plate.renderOrder = L.dark ? 0 : 1;
    g.add(plate);
    const edgeMat = keep(new THREE.LineBasicMaterial({ color: L.dark ? 0x1d2422 : INK, transparent: true, opacity: L.dark ? 1 : 0.6 }));
    g.add(new THREE.LineSegments(plateEdgeGeo, edgeMat));

    // Drafting grid and dimension ticks
    const pts = [];
    const y = 0.003;
    for (let x = -PW / 2 + 0.6; x < PW / 2 - 0.01; x += 0.6) pts.push(x, y, -PD / 2, x, y, PD / 2);
    for (let z = -PD / 2 + 0.5; z < PD / 2 - 0.01; z += 0.5) pts.push(-PW / 2, y, z, PW / 2, y, z);
    const grid = new THREE.BufferGeometry();
    grid.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    const gridMat = keep(new THREE.LineBasicMaterial({ color: L.dark ? LINE_ON_DARK : INK, transparent: true, opacity: L.dark ? 0.1 : 0.075, depthWrite: false }));
    g.add(new THREE.LineSegments(keep(grid), gridMat));
    const ticks = [];
    for (let i = 0; i <= 28; i++) {
      const x = -PW / 2 + i * 0.3;
      const len = i % 4 === 0 ? 0.2 : 0.09;
      ticks.push(x, -PT, PD / 2, x, -PT, PD / 2 + len);
    }
    for (let i = 0; i <= 13; i++) {
      const z = -PD / 2 + i * (PD / 13);
      const len = i % 4 === 0 ? 0.2 : 0.09;
      ticks.push(PW / 2, -PT, z, PW / 2 + len, -PT, z);
    }
    const tg = new THREE.BufferGeometry();
    tg.setAttribute('position', new THREE.Float32BufferAttribute(ticks, 3));
    const tickMat = keep(new THREE.LineBasicMaterial({ color: INK, transparent: true, opacity: 0.45 }));
    g.add(new THREE.LineSegments(keep(tg), tickMat));
    layerLineMats.push([edgeMat, edgeMat.opacity], [gridMat, gridMat.opacity], [tickMat, tickMat.opacity]);
    world.add(g);
    layerGroups.push(g);
    L.group = g;
  });

  // Exploded-view alignment lines at the plate corners
  const corners = [[-PW / 2, -PD / 2], [PW / 2, -PD / 2], [PW / 2, PD / 2], [-PW / 2, PD / 2]];
  const alignMat = keep(new THREE.LineDashedMaterial({ color: INK, dashSize: 0.12, gapSize: 0.1, transparent: true, opacity: 0 }));
  corners.forEach(([x, z]) => {
    const l = new THREE.Line(keep(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, -PT, z), new THREE.Vector3(x, LAYERS[0].y, z)])), alignMat);
    l.computeLineDistances();
    world.add(l);
  });

  /* Components: procedural maquettes, one assembly per role */
  const box = (w, h, d) => keep(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0));
  const cyl = (r, h, s = 48) => keep(new THREE.CylinderGeometry(r, r, h, s).translate(0, h / 2, 0));
  const BUILD = {
    client: (p) => { p(box(1.2, 0.04, 0.56), 0, 0, 0); p(box(0.36, 0.74, 0.05), -0.32, 0.04, -0.02); p(box(0.62, 0.52, 0.05), 0.24, 0.04, 0.12); },
    api: (p) => {
      p(box(0.2, 0.92, 0.62), -0.5, 0, 0); p(box(0.2, 0.92, 0.62), 0.5, 0, 0); p(box(1.24, 0.16, 0.62), 0, 0.92, 0);
      [-0.2, 0, 0.2].forEach((x) => p(box(0.05, 0.02, 1.1), x, 0, 0));
    },
    verify: (p) => {
      p(cyl(0.46, 0.12), 0, 0, 0); p(cyl(0.3, 0.04), 0, 0.12, 0);
      p(keep(new THREE.TorusGeometry(0.3, 0.045, 18, 64)), 0, 0.5, 0, Math.PI / 4);
      p(box(0.08, 0.24, 0.06), 0, 0.38, 0, Math.PI / 4);
    },
    service: (p) => { [0.62, 0.46, 0.8, 0.5, 0.7, 0.38].forEach((h, i) => p(box(0.32, h, 0.32), ((i % 3) - 1) * 0.4, 0, (Math.floor(i / 3) - 0.5) * 0.4)); },
    cache: (p) => { p(cyl(0.04, 0.64, 12), 0, 0, 0); for (let i = 0; i < 4; i++) p(cyl(0.5, 0.06), 0, 0.03 + i * 0.15, 0); },
    events: (p) => {
      p(box(1.9, 0.06, 0.46), 0, 0, 0);
      for (let i = 0; i < 8; i++) p(box(0.04, 0.3, 0.46), -0.84 + i * 0.24, 0.06, 0);
      p(box(0.08, 0.4, 0.52), -0.97, 0, 0); p(box(0.08, 0.4, 0.52), 0.97, 0, 0);
    },
    worker: (p) => { p(box(1.0, 0.05, 0.44), 0, 0, 0); [0.5, 0.68, 0.42].forEach((h, i) => p(cyl(0.13, h, 32), (i - 1) * 0.3, 0.05, 0)); },
    data: (p) => { for (let i = 0; i < 3; i++) p(cyl(0.54, 0.2), 0, i * 0.25, 0); p(cyl(0.38, 0.05), 0, 0.75, 0); },
    logs: (p) => { for (let i = 0; i < 6; i++) p(box(0.78, 0.025, 0.54), i * 0.03, i * 0.07, -i * 0.02, i * 0.05); },
  };
  const hitMeshes = [];
  const hitMat = keep(new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }));
  nodes.forEach((n) => {
    const g = new THREE.Group();
    const body = keep(new THREE.MeshStandardMaterial({ color: CHALK.clone(), roughness: 0.82, metalness: 0 }));
    const line = keep(new THREE.LineBasicMaterial({ color: INK.clone(), transparent: true, opacity: 0.72 }));
    BUILD[n.id]((geo, x, y, z, ry = 0) => {
      const m = new THREE.Mesh(geo, body);
      m.position.set(x, y, z);
      m.rotation.y = ry;
      m.castShadow = true;
      m.receiveShadow = true;
      m.add(new THREE.LineSegments(keep(new THREE.EdgesGeometry(geo, 28)), line));
      g.add(m);
    });
    const bb = new THREE.Box3().setFromObject(g);
    const size = bb.getSize(new THREE.Vector3());
    const hit = new THREE.Mesh(keep(new THREE.BoxGeometry(size.x + 0.2, size.y + 0.25, size.z + 0.2)), hitMat);
    hit.position.copy(bb.getCenter(new THREE.Vector3()));
    hit.userData.id = n.id;
    g.add(hit);
    hitMeshes.push(hit);
    g.position.set(n.x, 0, n.z);
    n.layer.group.add(g);
    Object.assign(n, { g, body, line, height: size.y, lift: 0, liftT: 0, bump: 0 });
  });

  /* Routes: orthogonal paths on plate surfaces, risers through the plates */
  const SURF = 0.025;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchor = (n) => V(n.x, n.layer.y + SURF, n.z);
  const dedupe = (pts) => pts.filter((p, i) => i === 0 || p.distanceTo(pts[i - 1]) > 1e-4);
  const ringGeo = keep(new THREE.RingGeometry(0.06, 0.095, 28).rotateX(-Math.PI / 2));
  const ringInk = keep(new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0 }));
  const ringLight = keep(new THREE.MeshBasicMaterial({ color: LINE_ON_DARK, transparent: true, opacity: 0 }));
  const routes = {};
  edges.forEach((e) => {
    const a = anchor(byId[e.a]);
    const b = anchor(byId[e.b]);
    let pts;
    if (Math.abs(a.y - b.y) < 1e-3) {
      pts = [a, V(b.x, a.y, a.z), b];
    } else {
      const [up, lo] = a.y > b.y ? [a, b] : [b, a];
      const [ox, oz] = RISER_OFFSET[e.key] || [0, 0];
      const rx = up.x + ox, rz = up.z + oz;
      pts = [up, V(rx, up.y, rz)];
      if (lo.y < 0.1) pts.push(V(rx, 0.45, rz));
      pts.push(V(rx, lo.y, rz), V(lo.x, lo.y, rz), lo);
      if (a.y < b.y) pts.reverse();
      LAYERS.forEach((L) => {
        if (L.y > lo.y + 0.01 && L.y <= up.y + 0.01) {
          const r = new THREE.Mesh(ringGeo, L.dark ? ringLight : ringInk);
          r.position.set(rx, L.y + 0.004, rz);
          world.add(r);
        }
      });
    }
    pts = dedupe(pts);
    routes[e.key] = pts;
    const geo = keep(new THREE.BufferGeometry().setFromPoints(pts));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(pts.length * 3), 3));
    const mat = keep(ASYNC.has(e.key)
      ? new THREE.LineDashedMaterial({ vertexColors: true, dashSize: 0.14, gapSize: 0.09, transparent: true, opacity: 0 })
      : new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0 }));
    const lineObj = new THREE.Line(geo, mat);
    if (ASYNC.has(e.key)) lineObj.computeLineDistances();
    world.add(lineObj);
    Object.assign(e, { pts, geo, mat, base: 0.5, cur: 0.5, target: 0.5, hot: false });
  });
  const paintEdge = (e) => {
    const col = e.geo.attributes.color;
    e.pts.forEach((p, i) => {
      const dark = p.y < 0.1;
      const c = e.hot ? (dark ? VERM_LIGHT : VERM) : (dark ? LINE_ON_DARK : INK);
      col.setXYZ(i, c.r, c.g, c.b);
    });
    col.needsUpdate = true;
  };
  edges.forEach(paintEdge);

  /* Journeys as continuous paths */
  class Path {
    constructor(pts) {
      this.p = pts;
      this.c = [0];
      for (let i = 1; i < pts.length; i++) this.c.push(this.c[i - 1] + pts[i].distanceTo(pts[i - 1]));
      this.len = this.c[this.c.length - 1];
    }
    at(d, out) {
      d = clamp(d, 0, this.len);
      let i = 1;
      while (i < this.c.length - 1 && this.c[i] < d) i++;
      const span = this.c[i] - this.c[i - 1] || 1;
      return out.lerpVectors(this.p[i - 1], this.p[i], (d - this.c[i - 1]) / span);
    }
  }
  const journeys = JOURNEYS.map((j) => {
    const pts = [anchor(byId[j.ids[0]])];
    const stops = [{ id: j.ids[0], d: 0 }];
    let len = 0;
    for (let i = 1; i < j.ids.length; i++) {
      const a = j.ids[i - 1], b = j.ids[i];
      const e = edges.find((x) => (x.a === a && x.b === b) || (x.a === b && x.b === a));
      if (!e) throw new Error(`No edge ${a}-${b}`);
      const seg = e.a === a ? routes[e.key] : routes[e.key].slice().reverse();
      for (let k = 1; k < seg.length; k++) { len += seg[k].distanceTo(pts[pts.length - 1]); pts.push(seg[k]); }
      stops.push({ id: b, d: len });
    }
    return { ...j, path: new Path(pts), stops };
  });

  /* Request tokens with trails, and arrival pulses */
  const TRAIL = 12;
  const tokenGeo = keep(new THREE.BoxGeometry(0.13, 0.13, 0.13));
  const tokenMat = keep(new THREE.MeshBasicMaterial({ color: VERM }));
  const trailMat = keep(new THREE.LineBasicMaterial({ color: VERM, transparent: true, opacity: 0.85 }));
  const tokens = Array.from({ length: 5 }, () => {
    const mesh = new THREE.Mesh(tokenGeo, tokenMat);
    const tgeo = keep(new THREE.BufferGeometry());
    tgeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(TRAIL * 3), 3));
    const trail = new THREE.Line(tgeo, trailMat);
    mesh.visible = trail.visible = false;
    trail.frustumCulled = false;
    world.add(mesh, trail);
    return { mesh, trail, active: false, j: null, d: 0, next: 0 };
  });
  const pulseGeo = keep(new THREE.RingGeometry(0.62, 0.66, 64).rotateX(-Math.PI / 2));
  const pulses = Array.from({ length: 8 }, () => {
    const m = new THREE.Mesh(pulseGeo, keep(new THREE.MeshBasicMaterial({ color: VERM, transparent: true, opacity: 0, depthWrite: false })));
    m.visible = false;
    world.add(m);
    return { m, t: 1 };
  });
  const pulse = (id) => {
    const n = byId[id];
    const p = pulses.find((x) => x.t >= 1) || pulses[0];
    p.t = 0;
    p.m.position.set(n.x, n.layer.y + 0.006, n.z);
    p.m.visible = true;
    n.bump = 1;
  };

  /* Camera rig: constrained orbit around a target, orthographic for a drawn look */
  const DEF = { az: 0.7, el: 0.49, zoom: 1, t: V(0.4, 3.75, 0.2) };
  const cam = { az: DEF.az, el: 0.82, zoom: 1, t: DEF.t.clone() };
  const goal = { az: DEF.az, el: DEF.el, zoom: 1, t: DEF.t.clone() };
  const AZ_RANGE = 0.62, EL_MIN = 0.28, EL_MAX = 0.86;
  let W = 1, H = 1, flow = false;

  function resize() {
    flow = root.classList.contains('is-flow');
    const r = stage.getBoundingClientRect();
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, flow || lowPower ? 1.5 : 1.75));
    renderer.setSize(W, H, false);
    const R = 5.1;
    const f = flow ? 1 : 0.6;
    const aspect = W / H;
    const vh = Math.max(2.3 * R, (2.2 * R) / (aspect * f));
    camera.top = vh / 2; camera.bottom = -vh / 2;
    camera.left = (-vh * aspect) / 2; camera.right = (vh * aspect) / 2;
    if (flow) camera.clearViewOffset(); else camera.setViewOffset(W, H, -0.17 * W, 0, W, H);
    camera.updateProjectionMatrix();
    invalidate();
  }

  /* State and interaction */
  let motion = !mqReduce.matches;
  let hovered = null;
  let introT = mqReduce.matches ? 99 : 0;
  let introStart = 0;
  let spawnT = 0.4;
  let jCursor = 0;
  let traceOwner = null;
  let idle = 0;
  let clock = 0;
  let visible = true;

  const setMotionUI = () => {
    motionBtn.textContent = motion ? 'Pause requests' : 'Play requests';
    motionBtn.setAttribute('aria-pressed', String(!motion));
    if (!motion) traceEl.innerHTML = '<span>Requests paused</span><b>Press Play to watch them move</b>';
  };
  motionBtn.addEventListener('click', () => {
    motion = !motion;
    if (!motion) tokens.forEach((t) => { t.active = false; t.mesh.visible = t.trail.visible = false; });
    else spawnT = 0;
    setMotionUI();
    invalidate();
  });
  setMotionUI();

  function applyHighlight() {
    const near = new Set(selected ? neighbours(selected) : []);
    nodes.forEach((n) => {
      const isSel = n.id === selected;
      const isNear = near.has(n.id);
      n.body.color.copy(isSel ? VERM : isNear ? BLUSH : CHALK);
      n.line.color.copy(isNear ? VERM : INK);
      n.line.opacity = selected && !isSel && !isNear ? 0.32 : isSel ? 0.9 : 0.72;
      n.liftT = isSel ? 0.16 : n.id === hovered ? 0.1 : 0;
    });
    edges.forEach((e) => {
      const on = !!selected && (e.a === selected || e.b === selected);
      const hov = !selected && hovered && (e.a === hovered || e.b === hovered);
      if (e.hot !== (on || hov)) { e.hot = on || hov; paintEdge(e); }
      e.target = on || hov ? 1 : selected ? 0.13 : 0.5;
    });
    invalidate();
  }

  const frame = (vec) => {
    const n = byId[selected];
    vec.set(n.x, n.layer.y + 0.5, n.z);
  };
  function api_select(id) {
    if (id) {
      frame(goal.t);
      goal.zoom = flow ? 1.25 : 1.35;
    } else {
      goal.t.copy(DEF.t);
      goal.zoom = 1;
    }
    jCursor = 0;
    applyHighlight();
  }
  function resetView() {
    goal.az = DEF.az; goal.el = DEF.el; goal.zoom = 1; goal.t.copy(DEF.t);
    idle = 0;
    invalidate();
  }
  function hover(id) {
    if (hovered === id) return;
    hovered = id;
    labels.forEach((b, nid) => b.classList.toggle('is-hover', nid === id));
    canvas.classList.toggle('is-point', !!id);
    applyHighlight();
  }

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pick = (ev) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(hitMeshes, false)[0];
    return hit ? hit.object.userData.id : null;
  };
  let drag = null;
  const allowDrag = () => !coarse && !flow;
  if (coarse) canvas.style.touchAction = 'pan-y';
  if (!allowDrag()) hint.textContent = 'Tap a component.';
  canvas.addEventListener('pointerdown', (ev) => {
    drag = { x: ev.clientX, y: ev.clientY, moved: false };
    if (allowDrag()) canvas.setPointerCapture(ev.pointerId);
  });
  canvas.addEventListener('pointermove', (ev) => {
    idle = 0;
    if (drag && allowDrag()) {
      const dx = ev.clientX - drag.x, dy = ev.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 4) { drag.moved = true; canvas.classList.add('is-drag'); }
      if (drag.moved) {
        goal.az = clamp(goal.az - dx * 0.0055, DEF.az - AZ_RANGE, DEF.az + AZ_RANGE);
        goal.el = clamp(goal.el + dy * 0.004, EL_MIN, EL_MAX);
        drag.x = ev.clientX; drag.y = ev.clientY;
        invalidate();
      }
      return;
    }
    if (!coarse) hover(pick(ev));
  });
  const endDrag = (ev, cancelled) => {
    if (!drag) return;
    const wasMoved = drag.moved;
    drag = null;
    canvas.classList.remove('is-drag');
    if (cancelled || wasMoved) return;
    const id = pick(ev);
    if (id) select(id); else if (selected) reset();
  };
  canvas.addEventListener('pointerup', (ev) => endDrag(ev, false));
  canvas.addEventListener('pointercancel', (ev) => endDrag(ev, true));
  canvas.addEventListener('pointerleave', () => { if (!drag) hover(null); });

  /* Loop: renders only while something moves and the hero is on screen */
  let raf = 0, last = 0;
  function invalidate() { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick); }
  const tmp = V(0, 0, 0), tmp2 = V(0, 0, 0);

  function step(dt, now) {
    let active = false;
    clock += dt;
    idle += dt;
    const k = mqReduce.matches ? 1 : 1 - Math.exp(-dt * 5.5);

    // Assembly: plates settle from the bottom up, then the routes draw in
    if (introT < 3) {
      if (!introStart) introStart = now;
      introT = (now - introStart) / 1000; // wall clock, so slow frames do not stretch the intro
      active = true;
    }
    layerGroups.forEach((g, i) => {
      const order = LAYERS.length - 1 - i;
      const p = easeOut((introT - order * 0.16) / 1.35);
      g.position.y = g.userData.y + (1 - p) * (2.6 + order * 0.5);
    });
    const routesIn = clamp((introT - 1.2) / 0.8, 0, 1);
    if (introT > 1.25 && !root.classList.contains('is-ready')) root.classList.add('is-ready');

    // Camera with an idle drift that eases in after a few quiet seconds
    const drift = motion && !selected && !drag ? Math.sin(clock * 0.16) * 0.055 * clamp((idle - 4) / 3, 0, 1) : 0;
    const prev = cam.az + cam.el + cam.zoom + cam.t.x + cam.t.y + cam.t.z;
    cam.az += (goal.az - cam.az) * k;
    if (introT < 2.4) cam.el = 0.82 + (goal.el - 0.82) * easeOut(introT / 2.4);
    else cam.el += (goal.el - cam.el) * k;
    cam.zoom += (goal.zoom - cam.zoom) * k;
    cam.t.lerp(goal.t, k);
    const moved = Math.abs(prev - (cam.az + cam.el + cam.zoom + cam.t.x + cam.t.y + cam.t.z));
    if (moved > 1e-5 || drift) active = true;
    const az = cam.az + drift;
    const D = 40;
    camera.position.set(
      cam.t.x + Math.sin(az) * Math.cos(cam.el) * D,
      cam.t.y + Math.sin(cam.el) * D,
      cam.t.z + Math.cos(az) * Math.cos(cam.el) * D,
    );
    camera.lookAt(cam.t);
    if (Math.abs(camera.zoom - cam.zoom) > 1e-5) { camera.zoom = cam.zoom; camera.updateProjectionMatrix(); }

    // Lines and markers fade in after assembly
    edges.forEach((e) => {
      e.cur += (e.target - e.cur) * k;
      e.mat.opacity = e.cur * routesIn;
      if (Math.abs(e.target - e.cur) > 1e-3) active = true;
    });
    alignMat.opacity = 0.28 * routesIn;
    ringInk.opacity = 0.55 * routesIn;
    ringLight.opacity = 0.7 * routesIn;

    // Components: hover lift and arrival bump
    nodes.forEach((n) => {
      n.lift += (n.liftT - n.lift) * k;
      n.bump = Math.max(0, n.bump - dt * 3);
      n.g.position.y = n.lift + Math.sin(n.bump * Math.PI) * 0.05;
      if (Math.abs(n.liftT - n.lift) > 1e-4 || n.bump > 0) active = true;
    });

    // Requests
    if (motion && routesIn >= 1) {
      active = true;
      spawnT -= dt;
      if (spawnT <= 0) { spawn(); spawnT = 2.4; }
    }
    tokens.forEach((t) => {
      if (!t.active) return;
      active = true;
      t.d += dt * 3.6;
      const j = t.j;
      while (t.next < j.stops.length && t.d >= j.stops[t.next].d) {
        pulse(j.stops[t.next].id);
        if (traceOwner === t) markHop(t.next);
        t.next++;
      }
      j.path.at(t.d, tmp);
      t.mesh.position.copy(tmp).y += 0.07;
      t.mesh.rotation.y += dt * 2;
      const arr = t.trail.geometry.attributes.position;
      for (let i = 0; i < TRAIL; i++) {
        j.path.at(t.d - i * 0.09, tmp2);
        arr.setXYZ(i, tmp2.x, tmp2.y + 0.07, tmp2.z);
      }
      arr.needsUpdate = true;
      if (t.d > j.path.len + TRAIL * 0.09) {
        t.active = false;
        t.mesh.visible = t.trail.visible = false;
      } else if (t.d > j.path.len) {
        t.mesh.visible = false;
      }
    });
    pulses.forEach((p) => {
      if (p.t >= 1) { p.m.visible = false; return; }
      active = true;
      p.t = Math.min(1, p.t + dt * 1.25);
      const s = 0.55 + easeOut(p.t) * 0.9;
      p.m.scale.set(s, 1, s);
      p.m.material.opacity = 0.75 * (1 - p.t);
    });
    return active;
  }

  function spawn() {
    const pool = selected ? journeys.filter((j) => j.ids.includes(selected)) : journeys;
    const j = pool[jCursor++ % pool.length];
    const t = tokens.find((x) => !x.active);
    if (!t) return;
    Object.assign(t, { active: true, j, d: 0, next: 0 });
    t.mesh.visible = t.trail.visible = true;
    traceOwner = t;
    showTrace(j);
  }

  function placeLabels() {
    const toScreen = (v) => { v.project(camera); return [(v.x + 1) * 0.5 * W, (1 - v.y) * 0.5 * H]; };
    if (!flow) {
      nodes.forEach((n) => {
        tmp.set(n.x, n.layer.group.position.y + n.g.position.y + n.height + 0.12, n.z);
        const [x, y] = toScreen(tmp);
        labels.get(n.id).style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, calc(-100% - 16px))`;
      });
    }
    LAYERS.forEach((L, i) => {
      tmp.set(PW / 2, L.group.position.y, -PD / 2);
      const [x, y] = toScreen(tmp);
      plateLabels[i].style.transform = `translate3d(${(x + 14).toFixed(1)}px, ${y.toFixed(1)}px, 0) translateY(-50%)`;
    });
  }

  function tick(now) {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    const active = step(dt, now);
    renderer.render(world, camera);
    placeLabels();
    if (active) invalidate(); else last = 0;
  }

  /* Visibility, resize, cleanup */
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) invalidate(); else last = 0; });
  io.observe(stage);
  document.addEventListener('visibilitychange', () => { last = 0; invalidate(); });
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  mqReduce.addEventListener('change', () => { if (mqReduce.matches) { motion = false; introT = 99; setMotionUI(); } invalidate(); });
  addEventListener('pagehide', () => {
    cancelAnimationFrame(raf);
    io.disconnect(); ro.disconnect();
    disposables.forEach((d) => d.dispose?.());
    renderer.dispose();
  }, { once: true });

  resize();
  root.classList.add('is-live');
  applyHighlight();
  invalidate();
  return { select: api_select, resetView, hover, resize, invalidate };
}

boot().catch((err) => {
  console.warn('Living System: falling back to the component index.', err);
  scene = null;
  root.classList.add('is-nogl', 'is-ready');
  setFlow();
});
