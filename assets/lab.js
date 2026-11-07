// Transaction Laboratory: a discrete-event simulation of fixed batching policies for settlement.
// Every figure on the page is drawn from simulate() output. The model is documented in
// content.lab.assumptions; keep the two in step if either changes.
import { lab } from '../content/portfolio.mjs';

/* ---------- Model ---------- */
export const HORIZON = 60; // seconds of simulated arrivals
export const PER_TX = 0.0002; // settlement time per payment, seconds (0.2 ms)

// mulberry32: small, fast, seedable PRNG, so a run is reproducible from its seed
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Poisson arrivals: exponential gaps with mean 1/rate
export function arrivals(rate, seed, horizon = HORIZON) {
  const r = rng(seed);
  const out = [];
  let t = 0;
  for (;;) {
    t += -Math.log(1 - r()) / rate;
    if (t > horizon) break;
    out.push(t);
  }
  return Float64Array.from(out);
}

// Decide when batches close, then settle them one at a time in close order.
// A batch is { from, to, close, start, end } over arr[from..to). Batches only close at or before HORIZON.
export function simulate(arr, { policy, size, wait, overhead }) {
  const n = arr.length;
  const batches = [];
  const close = (from, to, t) => batches.push({ from, to, close: t });
  if (policy === 'none') {
    for (let i = 0; i < n; i++) close(i, i + 1, arr[i]);
  } else if (policy === 'interval') {
    let i = 0;
    for (let k = 1; k * wait <= HORIZON + 1e-9; k++) {
      const t = k * wait;
      const from = i;
      while (i < n && arr[i] <= t) i++;
      if (i > from) close(from, i, t);
    }
  } else {
    const B = Math.max(1, Math.round(size));
    const W = policy === 'size' ? Infinity : wait;
    let from = 0;
    for (let i = 0; i < n; i++) {
      if (i > from && arr[i] > arr[from] + W) { close(from, i, arr[from] + W); from = i; }
      if (i + 1 - from >= B) { close(from, i + 1, arr[i]); from = i + 1; }
    }
    if (from < n && arr[from] + W <= HORIZON) close(from, n, arr[from] + W);
  }
  let free = 0;
  for (const b of batches) {
    b.start = Math.max(b.close, free);
    b.end = b.start + overhead + PER_TX * (b.to - b.from);
    free = b.end;
  }
  return batches;
}

export function measure(arr, batches, overhead, { tail = true } = {}) {
  let count = 0, sum = 0, done = 0, busy = 0;
  const delays = tail ? [] : null;
  for (const b of batches) {
    busy += b.end - b.start;
    for (let i = b.from; i < b.to; i++) {
      const d = b.end - arr[i];
      sum += d;
      count++;
      if (tail) delays.push(d);
    }
    if (b.end <= HORIZON) done += b.to - b.from;
  }
  let p95 = NaN;
  if (tail && delays.length) {
    delays.sort((a, b) => a - b);
    p95 = delays[Math.min(delays.length - 1, Math.floor(0.95 * delays.length))];
  }
  const meanBatch = batches.length ? count / batches.length : 0;
  return {
    offered: arr.length / HORIZON,
    mean: count ? sum / count : NaN,
    p95,
    throughput: done / HORIZON,
    batches: batches.length,
    meanBatch,
    overheadPerTx: meanBatch ? overhead / meanBatch : NaN,
    relative: meanBatch ? 1 / meanBatch : NaN,
    load: busy / HORIZON,
    open: arr.length - count,
  };
}

/* ---------- Formatting ---------- */
export const fmtTime = (s) => {
  if (!Number.isFinite(s)) return '–';
  if (s < 1) { const ms = s * 1000; return `${ms < 10 ? ms.toFixed(1) : Math.round(ms)} ms`; }
  return `${s < 10 ? s.toFixed(2) : s.toFixed(1)} s`;
};
// Axis ticks sit on powers of ten, so they need no decimals
const fmtTick = (s) => (s < 1 ? `${Math.round(s * 1000 * 1000) / 1000} ms` : `${Math.round(s)} s`);
const fmtNum = (v, d = 1) => (Number.isFinite(v) ? v.toLocaleString('en-US', { maximumFractionDigits: d }) : '–');
const fmtPct = (v) => (v >= 10 ? `${Math.round(v * 100).toLocaleString('en-US')}%` : `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`);

/* ---------- Page ---------- */
const app = typeof document !== 'undefined' ? document.getElementById('lab-app') : null;
if (app) initLab();

function initLab() {
  const form = document.getElementById('lab-form');
  const policyNote = document.getElementById('lab-policy-note');
  const metricsEl = document.getElementById('lab-metrics');
  const flagEl = document.getElementById('lab-flag');
  const chartsEl = document.getElementById('lab-charts');
  const tableEl = document.getElementById('lab-table');
  const capEl = document.getElementById('lab-curves-cap');
  const seedOut = document.getElementById('lab-seed-out');
  const canvas = document.getElementById('lab-timeline');
  const clockEl = document.getElementById('lab-clock');
  const playBtn = document.getElementById('lab-play');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');

  // Log-scaled sliders: 0..1000 maps onto [min, max]
  const FIELDS = {
    rate: { min: 1, max: 300, def: 40, round: (v) => (v < 10 ? Math.round(v * 10) / 10 : Math.round(v)), fmt: (v) => `${fmtNum(v)} /s` },
    size: { min: 1, max: 500, def: 50, round: (v) => Math.round(v), fmt: (v) => `${v}` },
    wait: { min: 0.01, max: 5, def: 0.5, round: (v) => (v < 0.1 ? Math.round(v * 1000) / 1000 : Math.round(v * 100) / 100), fmt: fmtTime },
    overhead: { min: 0.001, max: 1, def: 0.12, round: (v) => (v < 0.01 ? Math.round(v * 10000) / 10000 : Math.round(v * 1000) / 1000), fmt: fmtTime },
  };
  const toSlider = (f, v) => Math.round((1000 * Math.log(v / f.min)) / Math.log(f.max / f.min));
  const fromSlider = (f, s) => f.round(f.min * Math.pow(f.max / f.min, s / 1000));
  const USES = { hybrid: ['size', 'wait'], interval: ['wait'], size: ['size'], none: [] };

  const state = { policy: 'hybrid', seed: 2027, rate: 40, size: 50, wait: 0.5, overhead: 0.12 };
  Object.entries(FIELDS).forEach(([k, f]) => { form.elements[k].value = toSlider(f, f.def); });

  let run = null;

  function readForm() {
    state.policy = form.elements.policy.value;
    Object.entries(FIELDS).forEach(([k, f]) => {
      state[k] = fromSlider(f, Number(form.elements[k].value));
      document.getElementById(`lab-${k}-out`).textContent = f.fmt(state[k]);
    });
    const used = USES[state.policy];
    ['size', 'wait'].forEach((k) => {
      const on = used.includes(k);
      const field = form.querySelector(`[data-field="${k}"]`);
      field.classList.toggle('is-off', !on);
      form.elements[k].disabled = !on;
    });
    form.querySelector('[data-field="wait"] label').textContent = state.policy === 'interval' ? 'Interval' : 'Maximum wait';
    policyNote.textContent = lab.policies.find((p) => p.id === state.policy).text;
    seedOut.textContent = `seed ${state.seed}`;
  }

  function compute() {
    const arr = arrivals(state.rate, state.seed);
    const batches = simulate(arr, state);
    const m = measure(arr, batches, state.overhead);
    // Batch membership per payment, for colouring the replay
    const batchOf = new Int32Array(arr.length).fill(-1);
    batches.forEach((b, bi) => { for (let i = b.from; i < b.to; i++) batchOf[i] = bi; });
    const closes = Float64Array.from(batches.map((b) => b.close));
    const ends = Float64Array.from(batches.map((b) => b.end)); // settlement is sequential, so ends ascend
    const closedBefore = new Float64Array(batches.length + 1);
    batches.forEach((b, i) => { closedBefore[i + 1] = closedBefore[i] + (b.to - b.from); });
    let qMax = 1, q = 0, bi = 0;
    for (let i = 0; i < arr.length; i++) {
      while (bi < batches.length && batches[bi].close < arr[i]) { q -= batches[bi].to - batches[bi].from; bi++; }
      q++;
      if (q > qMax) qMax = q;
    }
    run = { arr, batches, m, batchOf, closes, ends, closedBefore, qMax };
    renderMetrics(m);
    renderSweep(arr);
    drawBench();
  }

  /* Results */
  function renderMetrics(m) {
    const rows = [
      ['Mean confirmation delay', fmtTime(m.mean)],
      ['95th-percentile delay', fmtTime(m.p95)],
      ['Throughput', `${fmtNum(m.throughput)} /s <small>of ${fmtNum(m.offered)} /s arriving</small>`],
      ['Mean batch size', fmtNum(m.meanBatch)],
      ['Overhead per payment', `${fmtTime(m.overheadPerTx)} <small>${fmtPct(m.relative)} of no batching</small>`],
      ['Channel load', fmtPct(m.load)],
    ];
    metricsEl.innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
    const notes = [];
    if (m.load > 1) notes.push(`Overloaded. Settling this run keeps the channel busy for ${fmtPct(m.load)} of its length, so batches queue for the channel and delay keeps growing for as long as the run lasts.`);
    if (m.open > 0) notes.push(`${fmtNum(m.open, 0)} ${m.open === 1 ? 'payment was' : 'payments were'} still in an open batch when arrivals stopped, so ${m.open === 1 ? 'it is' : 'they are'} not counted as confirmed.`);
    flagEl.hidden = !notes.length;
    flagEl.textContent = notes.join(' ');
  }

  /* Trade-off curves: the same model, re-run across the policy's main parameter */
  const SWEEP_N = 25;
  let sweep = null;
  function renderSweep(arr) {
    const key = state.policy === 'interval' ? 'wait' : state.policy === 'none' ? null : 'size';
    if (!key) {
      sweep = null;
      capEl.textContent = 'The trade-off, from the same model';
      chartsEl.innerHTML = '<p class="lab-empty">No batching has nothing to vary. Choose a batching policy to see how delay and overhead trade off.</p>';
      tableEl.innerHTML = '';
      return;
    }
    const f = FIELDS[key];
    const xs = [];
    for (let i = 0; i < SWEEP_N; i++) {
      const v = f.round(f.min * Math.pow(f.max / f.min, i / (SWEEP_N - 1)));
      if (!xs.length || v !== xs[xs.length - 1]) xs.push(v);
    }
    const rows = xs.map((x) => {
      const m = measure(arr, simulate(arr, { ...state, [key]: x }), state.overhead, { tail: false });
      return { x, mean: m.mean, over: m.overheadPerTx, load: m.load };
    });
    const label = key === 'size' ? 'Batch size limit' : 'Interval';
    sweep = { key, label, rows, fmtX: key === 'size' ? (v) => `${v}` : fmtTime, cur: state[key] };
    capEl.textContent = `The trade-off, from the same model: ${label.toLowerCase()} varied, everything else as set`;
    drawCharts();
    tableEl.innerHTML = `<table class="results"><thead><tr><th scope="col">${label}</th><th scope="col">Mean delay</th><th scope="col">Overhead per payment</th><th scope="col">Channel load</th></tr></thead><tbody>${
      rows.map((r) => `<tr><th scope="row">${sweep.fmtX(r.x)}</th><td>${fmtTime(r.mean)}</td><td>${fmtTime(r.over)}</td><td>${fmtPct(r.load)}</td></tr>`).join('')
    }</tbody></table>`;
  }

  function drawCharts() {
    if (!sweep) return;
    chartsEl.innerHTML = '';
    [['mean', 'Mean confirmation delay'], ['over', 'Settlement overhead per payment']].forEach(([field, title]) => {
      const wrap = document.createElement('div');
      wrap.className = 'lab-chart';
      wrap.innerHTML = `<h4>${title}</h4>`;
      chartsEl.append(wrap);
      lineChart(wrap, field);
    });
    chartsEl.insertAdjacentHTML('beforeend', '<p class="lab-chart-key"><i class="k-pt"></i>channel keeps up <i class="k-pt k-hollow"></i>channel overloaded <i class="k-cur"></i>current setting</p>');
  }

  function lineChart(wrap, field) {
    const W = Math.max(260, wrap.clientWidth), H = 190;
    const M = { l: 58, r: 14, t: 12, b: 30 };
    const rows = sweep.rows.filter((r) => Number.isFinite(r[field]) && r[field] > 0);
    const xMin = sweep.rows[0].x, xMax = sweep.rows[sweep.rows.length - 1].x;
    const ys = rows.map((r) => r[field]);
    const yLo = Math.pow(10, Math.floor(Math.log10(Math.min(...ys)))), yHi = Math.pow(10, Math.ceil(Math.log10(Math.max(...ys))));
    const X = (v) => M.l + ((Math.log(v) - Math.log(xMin)) / (Math.log(xMax) - Math.log(xMin))) * (W - M.l - M.r);
    const Y = (v) => H - M.b - ((Math.log(v) - Math.log(yLo)) / (Math.log(yHi) - Math.log(yLo) || 1)) * (H - M.t - M.b);
    const yTicks = [];
    for (let v = yLo; v <= yHi * 1.0001; v *= 10) yTicks.push(v);
    const xCand = sweep.key === 'size' ? [1, 2, 5, 10, 20, 50, 100, 200, 500] : [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5];
    const xTicks = xCand.filter((v) => v >= xMin && v <= xMax);
    // Overloaded runs as shaded spans
    let bands = '';
    sweep.rows.forEach((r, i) => {
      if (r.load <= 1) return;
      const a = i ? Math.sqrt(sweep.rows[i - 1].x * r.x) : xMin;
      const b = i < sweep.rows.length - 1 ? Math.sqrt(sweep.rows[i + 1].x * r.x) : xMax;
      bands += `<rect class="c-band" x="${X(a).toFixed(1)}" y="${M.t}" width="${(X(b) - X(a)).toFixed(1)}" height="${H - M.t - M.b}"/>`;
    });
    const path = rows.map((r, i) => `${i ? 'L' : 'M'}${X(r.x).toFixed(1)} ${Y(r[field]).toFixed(1)}`).join('');
    const pts = rows.map((r) => `<circle class="c-pt${r.load > 1 ? ' c-hollow' : ''}" cx="${X(r.x).toFixed(1)}" cy="${Y(r[field]).toFixed(1)}" r="4"/>`).join('');
    const cx = X(clamp(sweep.cur, xMin, xMax));
    wrap.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">
      ${bands}
      <g class="c-grid">${yTicks.map((v) => `<line x1="${M.l}" x2="${W - M.r}" y1="${Y(v).toFixed(1)}" y2="${Y(v).toFixed(1)}"/>`).join('')}</g>
      <g class="c-axis">${yTicks.map((v) => `<text x="${M.l - 8}" y="${(Y(v) + 3.5).toFixed(1)}" text-anchor="end">${fmtTick(v)}</text>`).join('')}
      ${xTicks.map((v) => `<text x="${X(v).toFixed(1)}" y="${H - 10}" text-anchor="middle">${sweep.key === 'size' ? v : fmtTick(v)}</text>`).join('')}</g>
      <line class="c-cur" x1="${cx.toFixed(1)}" x2="${cx.toFixed(1)}" y1="${M.t}" y2="${H - M.b}"/>
      <path class="c-line" d="${path}"/>${pts}
      <line class="c-hair" x1="0" x2="0" y1="${M.t}" y2="${H - M.b}" visibility="hidden"/>
      <rect class="c-hit" x="${M.l}" y="0" width="${W - M.l - M.r}" height="${H}"/>
    </svg><div class="c-tip" hidden></div>`);
    const svg = wrap.querySelector('svg');
    const hair = svg.querySelector('.c-hair');
    const tip = wrap.querySelector('.c-tip');
    const hit = svg.querySelector('.c-hit');
    const show = (ev) => {
      const r = svg.getBoundingClientRect();
      const px = ((ev.clientX - r.left) / r.width) * W;
      let best = rows[0];
      rows.forEach((row) => { if (Math.abs(X(row.x) - px) < Math.abs(X(best.x) - px)) best = row; });
      const x = X(best.x);
      hair.setAttribute('x1', x); hair.setAttribute('x2', x); hair.setAttribute('visibility', 'visible');
      tip.hidden = false;
      tip.innerHTML = `<b>${sweep.label} ${sweep.fmtX(best.x)}</b>Mean delay ${fmtTime(best.mean)}<br>Overhead per payment ${fmtTime(best.over)}<br>Channel load ${fmtPct(best.load)}`;
      const left = (x / W) * r.width;
      tip.style.left = `${Math.min(r.width - 190, Math.max(0, left + 12))}px`;
    };
    hit.addEventListener('pointermove', show);
    hit.addEventListener('pointerleave', () => { hair.setAttribute('visibility', 'hidden'); tip.hidden = true; });
  }

  /* Replay bench: the run, played back through a sliding window */
  let WINDOW = 6; // seconds shown; narrower on small screens
  let tp = 18, playing = !reduce.matches, raf = 0, last = 0, visible = false;
  const ctx = canvas.getContext('2d');
  const css = getComputedStyle(document.documentElement);
  const C = { fg: '#f2f0e9', fg2: '#c3c8c1', line: '#4c5853', hot: '#e8826d', done: '#9fb0a6', mono: css.getPropertyValue('--mono') || 'monospace' };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const bisect = (a, v) => { let lo = 0, hi = a.length; while (lo < hi) { const m = (lo + hi) >> 1; if (a[m] <= v) lo = m + 1; else hi = m; } return lo; };

  function sizeCanvas() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    WINDOW = w < 520 ? 3 : 6;
    return [w, h];
  }
  let CW = 0, CH = 0;

  function drawBench() {
    if (!run || !CW) return;
    const { arr, batches, batchOf, closes, ends, closedBefore, qMax } = run;
    ctx.clearRect(0, 0, CW, CH);
    const L = 86, R = 14;
    const t1 = tp, t0 = tp - WINDOW;
    const X = (t) => L + ((t - t0) / WINDOW) * (CW - L - R);
    const lanes = { arr: [16, 40], q: [58, 118], s: [138, 168] };
    ctx.font = `500 10.5px ${C.mono}`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = C.fg2;
    ctx.fillText('Arrivals', 0, (lanes.arr[0] + lanes.arr[1]) / 2);
    ctx.fillText('Waiting', 0, (lanes.q[0] + lanes.q[1]) / 2 - 6);
    ctx.fillText(`max ${qMax}`, 0, (lanes.q[0] + lanes.q[1]) / 2 + 8);
    ctx.fillText('Settlement', 0, (lanes.s[0] + lanes.s[1]) / 2);
    // time grid
    ctx.strokeStyle = C.line; ctx.lineWidth = 1;
    ctx.fillStyle = C.fg2; ctx.textAlign = 'center';
    for (let s = Math.ceil(t0); s <= t1; s++) {
      const x = Math.round(X(s)) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, lanes.arr[0] - 6); ctx.lineTo(x, lanes.s[1] + 4); ctx.stroke();
      ctx.fillText(`${s} s`, x, CH - 9);
    }
    ctx.textAlign = 'left';
    [lanes.q[1], lanes.s[1]].forEach((y) => { ctx.beginPath(); ctx.moveTo(L, y + 0.5); ctx.lineTo(CW - R, y + 0.5); ctx.stroke(); });

    // arrivals, coloured by state at the playhead
    const i0 = bisect(arr, t0), i1 = bisect(arr, t1);
    const dense = (i1 - i0) > (CW - L) / 2;
    for (let i = i0; i < i1; i++) {
      const b = batchOf[i] >= 0 ? batches[batchOf[i]] : null;
      ctx.fillStyle = !b || b.close > tp ? C.hot : b.end > tp ? C.fg : C.done;
      const x = X(arr[i]);
      ctx.fillRect(x - (dense ? 0.5 : 1), lanes.arr[0], dense ? 1 : 2, lanes.arr[1] - lanes.arr[0]);
    }
    // waiting queue as a step area: arrivals so far minus payments in closed batches
    const qh = lanes.q[1] - lanes.q[0];
    ctx.beginPath();
    ctx.moveTo(L, lanes.q[1]);
    for (let x = L; x <= CW - R; x += 2) {
      const t = t0 + ((x - L) / (CW - L - R)) * WINDOW;
      const q = bisect(arr, t) - closedBefore[bisect(closes, t)];
      ctx.lineTo(x, lanes.q[1] - (q / qMax) * qh);
    }
    ctx.lineTo(CW - R, lanes.q[1]);
    ctx.closePath();
    ctx.fillStyle = 'rgba(232,130,109,.28)';
    ctx.fill();
    ctx.strokeStyle = C.hot; ctx.lineWidth = 1.5; ctx.stroke();

    // settlements; a thin connector shows any wait for the channel after a batch closes
    for (let k = bisect(ends, t0); k < batches.length; k++) {
      const b = batches[k];
      if (b.close > t1) break;
      const xa = X(Math.max(b.start, t0)), xb = X(Math.min(b.end, t1));
      ctx.strokeStyle = C.fg2; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(X(b.close), lanes.q[1]); ctx.lineTo(X(b.start), lanes.s[0]); ctx.stroke();
      if (b.start > t1) continue;
      const settling = b.start <= tp && b.end > tp;
      const w = Math.max(1.5, xb - xa - 1);
      ctx.fillStyle = settling ? C.fg : 'rgba(159,176,166,.35)';
      ctx.fillRect(xa, lanes.s[0], w, lanes.s[1] - lanes.s[0]);
      if (w > 22) {
        ctx.fillStyle = settling ? '#28312e' : C.fg;
        ctx.fillText(String(b.to - b.from), xa + 5, (lanes.s[0] + lanes.s[1]) / 2);
      }
    }
    // playhead
    ctx.strokeStyle = C.fg; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(X(tp), lanes.arr[0] - 8); ctx.lineTo(X(tp), lanes.s[1] + 4); ctx.stroke();
    clockEl.textContent = `${tp.toFixed(1)} s of ${HORIZON} s`;
  }

  function frame(now) {
    raf = 0;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    tp += dt;
    if (tp > HORIZON) tp = WINDOW;
    drawBench();
    if (playing && visible && !document.hidden) raf = requestAnimationFrame(frame); else last = 0;
  }
  const kick = () => { if (!raf && playing && visible && !document.hidden) { last = 0; raf = requestAnimationFrame(frame); } };
  const setPlay = (on) => {
    playing = on;
    playBtn.textContent = on ? 'Pause' : 'Play';
    playBtn.setAttribute('aria-pressed', String(!on));
    kick();
  };
  playBtn.addEventListener('click', () => setPlay(!playing));

  /* Wiring */
  let pending = 0;
  const schedule = () => { clearTimeout(pending); pending = setTimeout(() => { readForm(); compute(); }, 16); };
  form.addEventListener('input', schedule);
  form.addEventListener('submit', (e) => e.preventDefault());
  document.getElementById('lab-seed').addEventListener('click', () => { state.seed = (Math.random() * 1e6) | 0; seedOut.textContent = `seed ${state.seed}`; compute(); });
  const reseed = () => { readForm(); compute(); };

  const ro = new ResizeObserver(() => { [CW, CH] = sizeCanvas(); drawBench(); drawCharts(); });
  ro.observe(canvas.parentElement);
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; kick(); }).observe(canvas);
  document.addEventListener('visibilitychange', kick);

  app.hidden = false;
  [CW, CH] = sizeCanvas();
  reseed();
  setPlay(playing);
}
