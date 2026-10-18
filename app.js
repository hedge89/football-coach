(() => {
const DRILLS = window.DRILLS;
const DRILL = Object.fromEntries(DRILLS.map(d => [d.id, d]));
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const uid = () => Math.random().toString(36).slice(2, 9);
const KEY = 'coach-hub-v1';

// ---------- Storage ----------
let store = { sessions: [], run: null, seeded: false };
try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.sessions)) store = { ...store, ...s }; } catch (e) {}
function persist() { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} }
if (!store.seeded) {
  store.sessions.push({
    id: uid(), date: nextWeekday(2), start: '18:00',
    blocks: [
      { id: uid(), kind: 'other', title: 'Warm-up: rondos and dynamic stretches', minutes: 10 },
      { id: uid(), kind: 'drill', drillId: 'cross-2v2-transition', minutes: 15 },
      { id: uid(), kind: 'other', title: 'Drinks', minutes: 3 },
      { id: uid(), kind: 'other', title: 'Positions talk (use the Positions tab)', minutes: 10 },
      { id: uid(), kind: 'other', title: 'Match', minutes: 20 },
    ],
  });
  store.seeded = true; persist();
}
function nextWeekday(dow) {
  const d = new Date(); d.setDate(d.getDate() + ((dow - d.getDay() + 7) % 7 || 7));
  return d.toISOString().slice(0, 10);
}
const getSession = id => store.sessions.find(s => s.id === id);

// ---------- Helpers ----------
const blockTitle = b => b.kind === 'drill' ? (DRILL[b.drillId]?.name || 'Missing drill') : (b.title || 'Untitled');
const totalMins = s => s.blocks.reduce((a, b) => a + (+b.minutes || 0), 0);
function addMins(hhmm, mins) {
  if (!hhmm) return '';
  const [h, m] = hhmm.split(':').map(Number), t = h * 60 + m + mins;
  return String(Math.floor(t / 60) % 24).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
}
function longDate(iso) {
  if (!iso) return 'No date set';
  return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
}
function toast(msg) {
  const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => t.remove(), 2000);
}
async function copyText(text, done) {
  try { await navigator.clipboard.writeText(text); toast(done); }
  catch (e) { openSheet(`<h2>Copy this</h2><textarea id="copybox" rows="10">${esc(text)}</textarea>`); $('#copybox').select(); }
}
function openSheet(html) {
  closeSheet();
  const bg = document.createElement('div'); bg.className = 'sheet-bg'; bg.id = 'sheetbg';
  bg.innerHTML = `<div class="sheet" role="dialog">${html}<button class="btn block" data-close>Close</button></div>`;
  bg.addEventListener('click', e => { if (e.target === bg || e.target.closest('[data-close]')) closeSheet(); });
  document.body.appendChild(bg);
  return bg;
}
function closeSheet() { $('#sheetbg')?.remove(); }

// ---------- Diagrams ----------
const VB = '-2 -3.6 35.4 46';
const r2 = n => Math.round(n * 100) / 100;
function field(L) {
  let h = '';
  for (let i = 0; i < 8; i++) h += `<rect class="${i % 2 ? 'd-stripe-b' : 'd-stripe-a'}" x="-2" y="${i * 5}" width="35.4" height="5"></rect>`;
  h += `<rect class="d-stripe-b" x="-2" y="-3.6" width="35.4" height="3.6"></rect><rect class="d-stripe-a" x="-2" y="40" width="35.4" height="2.4"></rect>`;
  if (L.field === 'goal') {
    h += `<line class="d-chalk" x1="0" y1="2" x2="30" y2="2"></line><rect class="d-chalk" x="2" y="2" width="26" height="13"></rect>
      <rect class="d-chalk" x="9" y="2" width="12" height="4"></rect><circle class="d-spot" cx="15" cy="11" r=".3"></circle>
      <path class="d-chalk" d="M11.8 15 A5 5 0 0 0 18.2 15"></path><rect class="d-goal" x="12.3" y="0.8" width="5.4" height="1.2"></rect>`;
  } else if (L.field !== 'grass') {
    h += `<rect class="d-chalk" x="0" y="0" width="30" height="40"></rect><line class="d-chalk" x1="0" y1="20" x2="30" y2="20"></line>
      <circle class="d-chalk" cx="15" cy="20" r="4"></circle><rect class="d-chalk" x="8" y="0" width="14" height="7"></rect>
      <rect class="d-chalk" x="8" y="33" width="14" height="7"></rect><rect class="d-goal" x="12.5" y="-1" width="5" height="1"></rect>
      <rect class="d-goal" x="12.5" y="40" width="5" height="1"></rect>`;
    for (const c of [[0, 0], [30, 0], [0, 40], [30, 40]]) h += cone(c);
  }
  for (const l of L.lines || []) h += `<line class="d-chalk${l.dash ? ' d-dash' : ''}" x1="${l.a[0]}" y1="${l.a[1]}" x2="${l.b[0]}" y2="${l.b[1]}"></line>`;
  if (L.track) h += `<polyline class="d-track" points="${L.track.map(p => p.join(',')).join(' ')}"></polyline>`;
  for (const c of L.cones || []) h += cone(c);
  for (const [x, y, w = 2.4, vert] of L.hurdles || []) {
    const [x1, y1, x2, y2] = vert ? [x, y - w / 2, x, y + w / 2] : [x - w / 2, y, x + w / 2, y];
    h += `<g class="d-hurdle"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"></line><circle cx="${x1}" cy="${y1}" r=".3"></circle><circle cx="${x2}" cy="${y2}" r=".3"></circle></g>`;
  }
  for (const b of L.balls || []) h += ballPile(b);
  return h;
}
const cone = ([x, y]) => `<path class="d-cone" d="M${x - .55} ${y + .45} L${x} ${y - .65} L${x + .55} ${y + .45}z"></path>`;
const person = (p, [x, y], id = '') => `<g class="d-p d-${p.t}${p.wait ? ' d-wait' : ''}" ${id ? `data-p="${id}"` : ''} transform="translate(${r2(x)} ${r2(y)})"><circle r="1.15"></circle><text>${esc(p.l)}</text></g>`;
function ballPile([x, y, n]) {
  let h = '';
  for (let i = 0; i < n; i++) h += `<circle class="d-ball" cx="${r2(x + (i % 3) * .75)}" cy="${r2(y + Math.floor(i / 3) * .7)}" r=".38"></circle>`;
  return h;
}
function dims(list) {
  let h = '';
  for (const { a, b, label } of list || []) {
    const vert = a[0] === b[0], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    const tick = vert ? (p => `<line x1="${p[0] - .5}" y1="${p[1]}" x2="${p[0] + .5}" y2="${p[1]}"></line>`) : (p => `<line x1="${p[0]}" y1="${p[1] - .5}" x2="${p[0]}" y2="${p[1] + .5}"></line>`);
    h += `<g class="d-dim"><line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}"></line>${tick(a)}${tick(b)}</g>
      <text class="d-dimtxt" ${vert ? `transform="translate(${mx} ${my}) rotate(-90)"` : `x="${mx}" y="${my}"`} text-anchor="middle" dominant-baseline="central">${esc(label)}</text>`;
  }
  return h;
}
const SW = { blue: 'var(--kit)', red: 'var(--opp)', gk: '#f2c94c', coach: '#222' };
const LEGEND_NAME = { blue: 'Blue bibs', red: 'Red bibs', gk: 'Keeper', coach: 'Coach' };
const legendItem = (d, t) => `<span><i class="sw" style="background:${SW[t]}"></i>${esc(d.legend?.[t] || LEGEND_NAME[t])}</span>`;
const initBalls = d => d.anim.balls || (d.anim.ball ? { ball: d.anim.ball } : {});

// Setup picture: starting spots, kit, measurements and labels
function setupImage(d) {
  const L = d.layout;
  let h = field(L) + dims(L.dims);
  for (const id in d.start) h += person(d.people[id], d.start[id]);
  for (const v of Object.values(initBalls(d))) {
    const [x, y] = typeof v === 'string' ? [d.start[v][0] + .9, d.start[v][1] - .9] : v;
    h += `<circle class="d-ball" cx="${x}" cy="${y}" r=".5"></circle>`;
  }
  for (const c of L.callouts) {
    const w = c.text.length * .58 + 1, [ax, ay] = c.at;
    h += `<line class="d-lead" x1="${c.to[0]}" y1="${c.to[1]}" x2="${ax}" y2="${ay}"></line><circle class="d-leaddot" cx="${c.to[0]}" cy="${c.to[1]}" r=".28"></circle>
      <rect class="d-tag" x="${ax}" y="${ay - .95}" width="${r2(w)}" height="1.9" rx=".5"></rect><text class="d-tagtxt" x="${ax + .5}" y="${ay + .05}">${esc(c.text)}</text>`;
  }
  const types = [...new Set(Object.values(d.people).map(p => p.t))];
  return `<svg class="diagram" viewBox="${VB}" role="img" aria-label="Setup diagram for ${esc(d.name)}">${h}</svg>
    <div class="legend">${types.map(t => legendItem(d, t)).join('')}
      ${L.cones?.length || !L.field || L.field === 'pitch' ? '<span><i class="tri"></i>Cone</span>' : ''}
      ${L.hurdles ? '<span><i class="lg" style="border-color:#fff;border-top-width:4px;background:transparent"></i>Hurdle</span>' : ''}
      ${Object.keys(initBalls(d)).length || L.balls ? '<span><i class="sw" style="background:#fff;border:1px solid #111;width:10px;height:10px"></i>Ball</span>' : ''}
      ${Object.values(d.people).some(p => p.wait) ? '<span class="muted">Faded = waiting</span>' : ''}</div>`;
}

// Animated walkthrough
function ballKeys(d) {
  const ks = new Set(Object.keys(initBalls(d)));
  for (const s of d.anim.steps) for (const k of Object.keys(s.balls || (s.ball !== undefined ? { ball: 1 } : {}))) ks.add(k);
  return [...ks];
}
function animMarkup(d) {
  const a = d.anim, hasBall = ballKeys(d).length > 0;
  return `<div class="anim" data-anim="${d.id}">
    <svg class="diagram" viewBox="${VB}" role="img" aria-label="Animation of ${esc(d.name)}">${field(d.layout)}
      <g class="a-trails"></g>${Object.keys(d.start).map(id => person(d.people[id], d.start[id], id)).join('')}${ballKeys(d).map(k => `<circle class="d-ball" data-b="${k}" r=".55"></circle>`).join('')}</svg>
    <div class="cap card"><div class="cap-top"><span class="phase-tag a-phase"></span><span class="muted small a-count"></span></div><p class="a-text"></p></div>
    <div class="dots">${a.steps.map((s, i) => `<button class="dot p${s.phase}" data-i="${i}" aria-label="Step ${i + 1}"></button>`).join('')}</div>
    <div class="anim-ctrls">
      <button class="btn" data-a="prev" aria-label="Previous step">‹ Step</button>
      <button class="btn primary" data-a="play">Pause</button>
      <button class="btn" data-a="next" aria-label="Next step">Step ›</button>
      <button class="btn" data-a="speed" aria-label="Playback speed">1×</button>
    </div>
    <div class="legend">${hasBall ? '<span><i class="lg" style="border-top-style:dashed;border-color:#8a9a90"></i>Ball</span>' : ''}<span><i class="lg" style="border-color:#e0b400"></i>Run</span>${hasBall ? '<span><i class="lg" style="border-color:#3fbf74"></i>Dribble</span>' : ''}</div>
  </div>`;
}
const anims = [];
function stopAnims() { while (anims.length) anims.pop().stop(); }
function mountAnims() {
  document.querySelectorAll('[data-anim]').forEach(el => anims.push(animate(el, DRILL[el.dataset.anim])));
}
const isPath = v => Array.isArray(v[0]);
function along(pts, e) {
  const seg = []; let tot = 0;
  for (let k = 1; k < pts.length; k++) { const l = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); seg.push(l); tot += l; }
  let d = e * tot;
  for (let k = 0; k < seg.length; k++) {
    if (d <= seg[k] || k === seg.length - 1) { const f = seg[k] ? Math.min(1, d / seg[k]) : 1; return [pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f]; }
    d -= seg[k];
  }
  return pts[pts.length - 1];
}
function animate(root, d) {
  const a = d.anim, steps = a.steps, N = steps.length;
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const off = p => [p[0] + .9, p[1] - .9];
  const toBall = v => typeof v === 'string' ? { holder: v, bxy: null } : { holder: null, bxy: v };
  const targets = s => s.balls || (s.ball !== undefined ? { ball: s.ball } : {});
  // Work out where everyone and every ball is after each step; moves can be a point or a path of points
  const st = [{ pos: { ...d.start }, balls: Object.fromEntries(Object.entries(initBalls(d)).map(([k, v]) => [k, toBall(v)])) }], paths = [];
  steps.forEach(s => {
    const prev = st[st.length - 1], n = { pos: { ...prev.pos }, balls: { ...prev.balls } }, pp = {};
    for (const id in s.moves || {}) {
      const v = s.moves[id];
      if (isPath(v)) { pp[id] = [prev.pos[id], ...v]; n.pos[id] = v[v.length - 1]; } else n.pos[id] = v;
    }
    const tg = targets(s);
    for (const k in tg) n.balls[k] = toBall(tg[k]);
    st.push(n); paths.push(pp);
  });
  const ballOf = (b, pos) => b ? (b.holder ? off(pos[b.holder]) : b.bxy) : null;
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const els = {}; root.querySelectorAll('[data-p]').forEach(g => els[g.dataset.p] = g);
  const bEls = {}; root.querySelectorAll('[data-b]').forEach(c => bEls[c.dataset.b] = c);
  const trails = root.querySelector('.a-trails');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let i = 0, t = 0, hold = 900, playing = !reduce, once = false, speed = 1, last = performance.now(), raf, drawnTrail = -1;

  function posAt(k, e) {
    const f = st[k], g = st[k + 1], out = {};
    for (const id in f.pos) out[id] = paths[k][id] ? along(paths[k][id], e) : lerp(f.pos[id], g.pos[id], e);
    return out;
  }
  function ballFlight(k, key) {
    const s = steps[k], at = s.ballAt || 0;
    return [ballOf(st[k].balls[key], posAt(k, ease(at))), ballOf(st[k + 1].balls[key], st[k + 1].pos)];
  }
  function frame() {
    const s = steps[i], e = s.linear ? t : ease(t), pos = posAt(i, e), tg = targets(s);
    const sc = s.pulse && t > 0 && t < 1 ? 1 + .18 * Math.abs(Math.sin(t * s.dur * Math.PI * 1.6)) : 1;
    for (const id in pos) els[id].setAttribute('transform', `translate(${r2(pos[id][0])} ${r2(pos[id][1])})${sc !== 1 && !d.people[id].wait && d.people[id].t !== 'coach' ? ` scale(${r2(sc)})` : ''}`);
    for (const key in bEls) {
      let b;
      if (key in tg) {
        if (s.ballJump) b = t >= 1 ? ballOf(st[i + 1].balls[key], st[i + 1].pos) : null;
        else {
          const at = s.ballAt || 0, bt = Math.max(0, Math.min(1, (t - at) / (1 - at)));
          const fl = ballFlight(i, key), from = t < at ? ballOf(st[i].balls[key], pos) : fl[0];
          b = lerp(from, fl[1], 1 - Math.pow(1 - bt, 2));
        }
      } else b = ballOf(st[i].balls[key], pos);
      bEls[key].style.display = b ? '' : 'none';
      if (b) { bEls[key].setAttribute('cx', r2(b[0])); bEls[key].setAttribute('cy', r2(b[1])); }
    }
    if (drawnTrail !== i) { drawTrails(); drawnTrail = i; }
  }
  function drawTrails() {
    const s = steps[i], f = st[i], g = st[i + 1], tg = targets(s);
    let h = '';
    for (const id in s.moves || {}) {
      const pts = paths[i][id] || [f.pos[id], g.pos[id]];
      if (!paths[i][id] && Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]) < .3) continue;
      const dribble = Object.entries(f.balls).some(([k, b]) => b.holder === id && !(k in tg)), k = dribble ? 'dribble' : 'run';
      h += `<polyline class="d-${k} a-tr" points="${pts.map(p => r2(p[0]) + ',' + r2(p[1])).join(' ')}" marker-end="url(#am-${k})"></polyline>`;
    }
    if (!s.ballJump) for (const key in tg) {
      const [p, q] = ballFlight(i, key);
      if (p && q && Math.hypot(q[0] - p[0], q[1] - p[1]) > .5) h += `<line class="d-pass a-tr" x1="${r2(p[0])}" y1="${r2(p[1])}" x2="${r2(q[0])}" y2="${r2(q[1])}" marker-end="url(#am-pass)"></line>`;
    }
    trails.innerHTML = `<defs>${['pass:#fff', 'run:#ffe14d', 'dribble:#9dff9d'].map(m => { const [k, c] = m.split(':'); return `<marker id="am-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10z" fill="${c}"></path></marker>`; }).join('')}</defs>${h}`;
    const tag = root.querySelector('.a-phase');
    tag.textContent = s.tag || d.phases?.[s.phase - 1]?.name || '';
    tag.style.color = s.phase === 1 ? 'var(--kit)' : 'var(--opp)';
    root.querySelector('.a-count').textContent = `Step ${i + 1} of ${N}`;
    root.querySelector('.a-text').textContent = s.text;
    root.querySelectorAll('.dot').forEach((b, k) => b.setAttribute('aria-current', k === i));
  }
  function setPlay(p) { playing = p; once = false; root.querySelector('[data-a=play]').textContent = p ? 'Pause' : 'Play'; }
  function go(k) { i = (k + N) % N; t = reduce ? 1 : 0; hold = 250; drawnTrail = -1; }
  function loop(now) {
    const dt = Math.min(100, now - last); last = now;
    if (playing || once) {
      if (hold > 0) hold -= dt * speed;
      else if (t < 1) { t = Math.min(1, t + dt * speed / (steps[i].dur * 1000)); if (t >= 1) { hold = i === N - 1 ? 2200 : 800; once = false; } }
      else if (playing) { if (i === N - 1) { go(0); hold = 900; } else go(i + 1); }
    }
    frame();
    raf = requestAnimationFrame(loop);
  }
  root.addEventListener('click', e => {
    const b = e.target.closest('[data-a],[data-i]'); if (!b) return;
    const act = b.dataset.a;
    if (b.dataset.i) { setPlay(false); go(+b.dataset.i); once = true; }
    else if (act === 'play') { if (!playing && i === N - 1 && t >= 1) go(0); setPlay(!playing); }
    else if (act === 'next') { setPlay(false); go(i + 1); once = true; }
    else if (act === 'prev') { setPlay(false); go(i - 1); once = true; }
    else if (act === 'speed') { speed = speed === 1 ? .5 : 1; b.textContent = speed === 1 ? '1×' : '½×'; }
  });
  if (reduce) { t = 1; root.querySelector('[data-a=play]').textContent = 'Play'; }
  frame();
  raf = requestAnimationFrame(loop);
  return { stop: () => cancelAnimationFrame(raf) };
}

// ---------- Interval timer (fitness drills) ----------
const timers = {};
function timeline(iv) {
  const out = [];
  for (let r = 0; r < iv.rounds; r++) {
    iv.segments.forEach((s, k) => {
      if (r === iv.rounds - 1 && s.skipLast) return;
      out.push({ label: s.label.replace('{ex}', iv.exercises ? iv.exercises[r % iv.exercises.length] : ''), secs: s.secs, work: !!s.work, round: r + 1 });
    });
  }
  return out;
}
const fmt = ms => { const s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function timerMarkup(d) {
  const iv = d.interval, tl = timeline(iv), total = tl.reduce((a, s) => a + s.secs, 0);
  return `<div class="itimer card" data-timer="${d.id}">
    <div class="row" style="justify-content:space-between"><span class="label" style="margin:0">Interval timer</span><span class="muted small">${iv.rounds} rounds · ${Math.round(total / 60)} min</span></div>
    <div class="it-label">Ready</div><div class="it-clock">--:--</div>
    <div class="it-sub muted"></div>
    <div class="bar"><i class="it-bar"></i></div>
    <div class="grid2" style="margin-top:10px"><button class="btn primary" data-t="toggle">Start</button><button class="btn" data-t="reset">Reset</button></div>
  </div>`;
}
function timerUpdate(el) {
  const d = DRILL[el.dataset.timer], tl = timeline(d.interval), T = timers[d.id] || (timers[d.id] = { running: false, startedAt: 0, before: 0, seg: -1, beep: -1 });
  const el2 = T.before + (T.running ? Date.now() - T.startedAt : 0);
  let acc = 0, k = 0;
  while (k < tl.length && el2 >= acc + tl[k].secs * 1000) { acc += tl[k].secs * 1000; k++; }
  const q = s => el.querySelector(s);
  el.classList.toggle('work', k < tl.length && tl[k].work && (T.running || el2 > 0));
  el.classList.toggle('rest', k < tl.length && !tl[k].work && (T.running || el2 > 0));
  if (k >= tl.length) {
    q('.it-label').textContent = 'Done!'; q('.it-clock').textContent = '0:00'; q('.it-sub').textContent = 'Great work. Grab a drink.'; q('.it-bar').style.width = '100%';
    if (T.running) { T.running = false; T.before = el2; buzz(); keepAwake(anyAwake()); q('[data-t=toggle]').textContent = 'Start'; }
    return;
  }
  const seg = tl[k], left = acc + seg.secs * 1000 - el2;
  q('.it-label').textContent = (T.running || el2 > 0) ? seg.label : 'Ready: ' + seg.label;
  q('.it-clock').textContent = fmt(left);
  const next = tl[k + 1];
  q('.it-sub').textContent = `Round ${seg.round} of ${d.interval.rounds}` + (next ? ` · Next: ${next.label}` : ' · Last one!');
  q('.it-bar').style.width = (100 - left / (seg.secs * 10)) + '%';
  q('[data-t=toggle]').textContent = T.running ? 'Pause' : el2 > 0 ? 'Resume' : 'Start';
  if (T.running) {
    if (T.seg !== k) { if (T.seg >= 0) beep(2, 660); T.seg = k; }
    const s = Math.ceil(left / 1000);
    if (s <= 3 && s >= 1 && T.beep !== k * 10 + s) { T.beep = k * 10 + s; beep(1, 880, .12); }
  }
}
setInterval(() => document.querySelectorAll('[data-timer]').forEach(timerUpdate), 200);
document.addEventListener('click', e => {
  const b = e.target.closest('[data-t]'); if (!b) return;
  const el = b.closest('[data-timer]'), id = el.dataset.timer, T = timers[id] || (timers[id] = { running: false, startedAt: 0, before: 0, seg: -1, beep: -1 });
  if (b.dataset.t === 'toggle') {
    if (T.running) { T.before += Date.now() - T.startedAt; T.running = false; }
    else {
      const tl = timeline(DRILL[id].interval), total = tl.reduce((a, s) => a + s.secs * 1000, 0);
      if (T.before >= total) { T.before = 0; T.seg = -1; }
      T.startedAt = Date.now(); T.running = true; unlockAudio(); beep(1, 660, .25);
    }
  } else { T.running = false; T.before = 0; T.seg = -1; T.beep = -1; }
  keepAwake(anyAwake());
  timerUpdate(el);
});
const anyTimer = () => Object.values(timers).some(t => t.running);

// ---------- Penalty shootout scorer ----------
const so = { kicks: [] };
const SO_NAMES = ['Blues', 'Reds'];
function soStatus() {
  const g = [0, 0], n = [0, 0];
  so.kicks.forEach(x => { n[x.team]++; if (x.goal) g[x.team]++; });
  let win = -1;
  if (n[0] <= 5 && n[1] <= 5) { if (g[0] > g[1] + (5 - n[1])) win = 0; else if (g[1] > g[0] + (5 - n[0])) win = 1; }
  if (win < 0 && n[0] >= 5 && n[0] === n[1] && g[0] !== g[1]) win = g[0] > g[1] ? 0 : 1;
  return { g, n, win, next: so.kicks.length % 2 };
}
function shootoutMarkup() {
  const s = soStatus();
  const row = t => {
    const mine = so.kicks.filter(x => x.team === t), len = Math.max(5, mine.length + (s.win < 0 && s.next === t ? 1 : 0));
    let dots = '';
    for (let i = 0; i < len; i++) { const x = mine[i]; dots += `<span class="so-dot ${x ? (x.goal ? 'g' : 'm') : ''}">${x ? (x.goal ? '\u2713' : '\u2717') : ''}</span>`; }
    return `<div class="so-row"><b style="color:${t ? 'var(--opp)' : 'var(--kit)'}">${SO_NAMES[t]}</b><div class="so-dots">${dots}</div><b class="so-score">${s.g[t]}</b></div>`;
  };
  const status = s.win >= 0 ? `${SO_NAMES[s.win]} win ${s.g[s.win]}\u2013${s.g[1 - s.win]}!`
    : (s.n[0] >= 5 && s.n[1] >= 5 ? 'Sudden death \u00b7 ' : '') + `${SO_NAMES[s.next]} to take kick ${s.n[s.next] + 1}`;
  const off = s.win >= 0 ? 'disabled' : '';
  return `<div class="card so" id="shootout">
    <div class="row" style="justify-content:space-between"><span class="label" style="margin:0">Shootout scorer</span><span class="small muted">5 each, then sudden death</span></div>
    ${row(0)}${row(1)}<p class="so-status">${status}</p>
    <div class="grid2"><button class="btn primary" data-so="goal" ${off}>Goal</button><button class="btn" data-so="miss" ${off}>Miss / saved</button></div>
    <div class="row" style="margin-top:8px"><button class="btn sm" data-so="undo" ${so.kicks.length ? '' : 'disabled'}>Undo</button><button class="btn sm" data-so="reset">New shootout</button></div>
  </div>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-so]'); if (!b) return;
  const a = b.dataset.so;
  if (a === 'goal' || a === 'miss') so.kicks.push({ team: soStatus().next, goal: a === 'goal' });
  else if (a === 'undo') so.kicks.pop();
  else so.kicks = [];
  $('#shootout').outerHTML = shootoutMarkup();
});

// ---------- Drill detail ----------
const ui = { tab: {} };
const roleSwatch = { blue: 'background:var(--kit);color:#fff', red: 'background:var(--opp);color:#fff', gk: 'background:#f2c94c;color:#1d1600', coach: 'background:#222;color:#fff' };

function drillView(d, ctx) {
  const tab = ui.tab[d.id] || 'run';
  const tabs = [['run', 'Run it'], ['setup', 'Setup'], ['coach', 'Coach'], ['about', 'About']];
  let body = '';
  if (tab === 'run') {
    let n = 0;
    const steps = d.phases
      ? d.phases.map((p, i) => `<div class="card"><div class="phase-tag" style="color:${i ? 'var(--opp)' : 'var(--kit)'}">${esc(p.name)}</div>
        <ol class="steps" style="margin-top:8px;counter-reset:s ${n}">${p.steps.map(s => (n++, `<li class="${i ? 'p2' : ''}"><span>${esc(s)}</span></li>`)).join('')}</ol></div>`).join('')
      : `<div class="card"><div class="label">How it works</div><ol class="steps">${d.how.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol></div>`;
    body = `${d.interval ? timerMarkup(d) : ''}${d.tool === 'shootout' ? shootoutMarkup() : ''}${animMarkup(d)}${steps}
      ${d.interval?.exercises ? `<div class="card"><div class="label">Exercises (in order)</div><ol class="steps">${d.interval.exercises.map(x => `<li><span>${esc(x)}</span></li>`).join('')}</ol></div>` : ''}
      ${d.rotation ? `<div class="card"><div class="label">Rotate</div><p style="margin:0">${esc(d.rotation)}</p></div>` : ''}`;
  } else if (tab === 'setup') {
    body = `<div>${setupImage(d)}</div>
      <div class="card"><div class="label">Kit</div><ul class="ticks">${d.equipment.map(e => `<li><span>${esc(e)}</span></li>`).join('')}</ul></div>
      <div class="card"><div class="label">Setup</div><ol class="steps">${d.setup.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol></div>
      ${d.roles ? `<div class="card"><div class="label">Who’s who</div><div class="stack">${d.roles.map(r => `<div class="role"><span class="swatch" style="${roleSwatch[r.t]}">${esc(r.l)}</span><div><b>${esc(r.name)}</b><br><span class="small">${esc(r.job)}</span></div></div>`).join('')}</div></div>` : ''}`;
  } else if (tab === 'coach') {
    body = `<div class="tips">${d.coaching.map(c => `<div class="card tip"><h4>${esc(c.who)}</h4><ul>${c.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>`).join('')}</div>
      <div class="card"><div class="label">Make it harder or easier</div><ul class="ticks">${d.progressions.map(e => `<li><span>${esc(e)}</span></li>`).join('')}</ul></div>`;
  } else {
    body = `<div class="card"><p style="margin:0 0 8px">${esc(d.summary)}</p><p class="muted small" style="margin:0">${esc(d.why)}</p></div>
      ${d.fromVideo ? `<div class="card quote"><div class="label">From the video</div><div class="stack small">${d.fromVideo.map(q => `<p style="margin:0">“${esc(q)}”</p>`).join('')}</div></div>` : ''}
      ${d.sources ? `<div class="card"><div class="label">Sources</div><ul class="ticks small">${d.sources.map(s => `<li><span><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>${s.at ? ` (from ${esc(s.at)})` : ''}</span></li>`).join('')}</ul></div>` : ''}
      ${d.note ? `<p class="muted small">${esc(d.note)}</p>` : ''}`;
  }
  return `<div class="stack">
    ${ctx === 'run' ? '' : `<p style="margin:0">${esc(d.summary)}</p>`}
    <div class="facts">
      <div class="fact"><b>Time</b>${d.minutes} min</div><div class="fact"><b>Intensity</b>${esc(d.intensity)}</div>
      <div class="fact" style="grid-column:span 2"><b>Players</b>${esc(d.players)}</div>
      <div class="fact" style="grid-column:span 2"><b>Area</b>${esc(d.area)}</div>
    </div>
    <div class="seg" role="tablist" data-tabs="${d.id}">${tabs.map(([k, l]) => `<button role="tab" aria-selected="${k === tab}" data-tab="${k}">${l}</button>`).join('')}</div>
    ${body}
  </div>`;
}
document.addEventListener('click', e => {
  const t = e.target.closest('[data-tab]');
  if (t) { ui.tab[t.parentElement.dataset.tabs] = t.dataset.tab; render(); }
});

// ---------- Views ----------
const ICON = {
  plan: '<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="16" rx="2"></rect><path d="M8 3v4M16 3v4M4 10h16M8 14h3M8 17h6"></path></svg>',
  drills: '<svg viewBox="0 0 24 24"><path d="M5 20l3-9 4 3 3-8 4 14"></path><circle cx="15" cy="4" r="1.5"></circle></svg>',
  pos: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 12h18"></path><circle cx="12" cy="12" r="3"></circle></svg>',
};
function tabs(cur) {
  return `<div class="tabs"><nav>
    <a href="#plan" ${cur === 'plan' ? 'aria-current="page"' : ''}>${ICON.plan}Plan</a>
    <a href="#drills" ${cur === 'drills' ? 'aria-current="page"' : ''}>${ICON.drills}Drills</a>
    <a href="positions.html">${ICON.pos}Positions</a></nav></div>`;
}

// ---------- Install as an app ----------
let installEvt = null;
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isAndroid = /Android/i.test(navigator.userAgent);
const installDismissed = () => { try { return localStorage.getItem('coach-hub-install') === 'no'; } catch (e) { return false; } };
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; if (route()[0] === 'plan' || !location.hash) render(); });
window.addEventListener('appinstalled', () => { installEvt = null; toast('Installed. Open Coach Hub from your home screen.'); render(); });
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
function installCard() {
  if (standalone() || installDismissed()) return '';
  if (installEvt) return `<div class="card install"><div class="grow"><h3>Install Coach Hub</h3><p class="muted small">Adds it to your home screen and opens full screen, like a normal app. Works offline at the pitch.</p></div>
    <div class="row"><button class="btn primary sm" data-act="install">Install</button><button class="btn sm" data-act="install-no">Not now</button></div></div>`;
  if (isAndroid) return `<div class="card install"><div class="grow"><h3>Install Coach Hub</h3><p class="muted small">Open the browser menu <b>⋮</b> and tap <b>Install app</b> or <b>Add to Home screen</b>.</p></div>
    <div class="row"><button class="btn sm" data-act="install-no">Got it</button></div></div>`;
  return '';
}

function viewPlan() {
  const list = [...store.sessions].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  return `<div class="wrap">
    <div class="title-row"><h1>Sessions</h1><span class="spacer"></span><button class="btn primary sm" data-act="new">+ New</button></div>
    ${installCard()}
    ${store.run && getSession(store.run.sid) ? `<a class="btn gold block" href="#run/${store.run.sid}" style="margin-bottom:12px">Resume: ${longDate(getSession(store.run.sid).date)}</a>` : ''}
    <div class="stack">
    ${list.length ? list.map(s => `<a class="card list-item" href="#s/${s.id}"><div class="grow"><h3>${longDate(s.date)}</h3>
      <p>${s.start ? s.start + '–' + addMins(s.start, totalMins(s)) : ''} · ${s.blocks.length} blocks · ${totalMins(s)} min</p></div><span class="chev">›</span></a>`).join('')
      : `<div class="card empty"><p>No sessions yet.</p><p class="muted small">Tap <b>+ New</b> to plan your first one.</p></div>`}
    </div>
    <h2 class="sec">Backup</h2>
    <p class="muted small" style="margin-top:0">Plans are saved on this phone only. Copy a backup to move them to another device.</p>
    <div class="row"><button class="btn sm" data-act="backup">Copy backup</button><button class="btn sm" data-act="restore">Restore</button></div>
  </div>${tabs('plan')}`;
}

function viewSession(s) {
  let t = 0;
  const end = addMins(s.start, totalMins(s));
  return `<div class="wrap">
    <div class="title-row"><a class="back" href="#plan">‹ Sessions</a><span class="spacer"></span><button class="btn sm" data-act="share">Share</button></div>
    <div class="stack">
      <h1 style="font-family:var(--display);font-size:28px;margin:0;text-transform:uppercase">${longDate(s.date)}</h1>
      <div class="grid2">
        <div class="field"><label class="label" for="s-date">Date</label><input type="date" id="s-date" value="${esc(s.date)}"></div>
        <div class="field"><label class="label" for="s-start">Start</label><input type="time" id="s-start" value="${esc(s.start)}"></div>
      </div>
    </div>
    <h2 class="sec">Schedule</h2>
    <p class="muted small" style="margin-top:-4px">${s.blocks.length} blocks · ${totalMins(s)} min${s.start ? ` · ${s.start} to ${end}` : ''}</p>
    <div class="stack">
    ${s.blocks.map((b, i) => {
      const st = addMins(s.start, t); t += +b.minutes || 0;
      const d = b.kind === 'drill' && DRILL[b.drillId];
      return `<div class="card block-card ${d ? 'drill' : 'other'}"><div class="block">
        <div class="time">${st || '+' + (t - (+b.minutes || 0))}<small>${b.minutes} min</small></div>
        <div style="min-width:0">${d ? `<a href="#d/${d.id}" style="color:inherit;text-decoration:none"><h3>${esc(d.name)}</h3><div class="meta">${esc(d.category)} drill · tap for details</div></a>`
          : `<input type="text" data-title="${b.id}" value="${esc(b.title)}" aria-label="Block title" style="height:38px;font-weight:600">`}</div>
        <div class="ctrls"><button class="icon" data-up="${i}" aria-label="Move up" ${i ? '' : 'disabled'}>↑</button><button class="icon" data-down="${i}" aria-label="Move down" ${i < s.blocks.length - 1 ? '' : 'disabled'}>↓</button></div>
      </div>
      <div class="row" style="margin-top:8px;justify-content:space-between">
        <label class="row small muted">Minutes <input type="number" class="mins" min="1" max="120" data-mins="${b.id}" value="${b.minutes}"></label>
        <button class="btn sm danger" data-remove="${b.id}">Remove</button></div></div>`;
    }).join('') || `<div class="card empty muted">Add drills and breaks to build the session.</div>`}
    </div>
    <div class="grid2" style="margin-top:10px"><button class="btn primary" data-act="add-drill">+ Drill</button><button class="btn" data-act="add-other">+ Break / other</button></div>
    <button class="btn gold block" style="margin-top:18px;height:56px;font-size:20px" data-act="start" ${s.blocks.length ? '' : 'disabled'}>Start session</button>
    <div class="row" style="margin-top:22px"><button class="btn sm" data-act="dup">Duplicate</button><span id="delzone"><button class="btn sm danger" data-act="del">Delete session</button></span></div>
  </div>${tabs('plan')}`;
}

function viewDrills() {
  return `<div class="wrap"><div class="title-row"><h1>Drills</h1></div><div class="stack">
    ${DRILLS.map(d => `<a class="card list-item" href="#d/${d.id}"><div class="grow"><div class="row" style="margin-bottom:4px"><span class="pill cat">${esc(d.category)}</span><span class="pill ${d.intensity === 'High' ? 'hi' : ''}">${esc(d.intensity)}</span><span class="pill">${d.minutes} min</span></div>
      <h3>${esc(d.name)}</h3><p>${esc(d.summary)}</p></div><span class="chev">›</span></a>`).join('')}
    </div><p class="muted small" style="margin-top:16px">More drills get added to this list over time.</p></div>${tabs('drills')}`;
}

function viewDrill(d) {
  return `<div class="wrap"><div class="title-row"><a class="back" href="javascript:history.back()">‹ Back</a></div>
    <div class="title-row"><h1>${esc(d.name)}</h1></div>${drillView(d)}</div>${tabs('drills')}`;
}

// ---------- Run mode ----------
let tick = null, wake = null, beeped = -1;
function runState(s) {
  if (!store.run || store.run.sid !== s.id) store.run = { sid: s.id, idx: 0, running: false, startedAt: 0, before: 0 };
  return store.run;
}
const elapsed = r => r.before + (r.running ? Date.now() - r.startedAt : 0);
function viewRun(s) {
  const r = runState(s);
  if (r.idx >= s.blocks.length) {
    return `<div class="wrap"><div class="card empty"><h1 style="font-family:var(--display);text-transform:uppercase">Session done</h1><p class="muted">Nice work. ${totalMins(s)} minutes planned.</p>
      <div class="row" style="justify-content:center"><button class="btn" data-run="prev">‹ Back</button><button class="btn primary" data-run="finish">Finish</button></div></div></div>`;
  }
  const b = s.blocks[r.idx], d = b.kind === 'drill' && DRILL[b.drillId], next = s.blocks[r.idx + 1];
  return `<div class="wrap">
    <div class="title-row"><a class="back" href="#s/${s.id}">‹ Plan</a><span class="spacer"></span><span class="muted small">${longDate(s.date)}</span></div>
    <div class="run-head">
      <div class="label">Block ${r.idx + 1} of ${s.blocks.length}</div>
      <h1 style="font-family:var(--display);font-size:26px;margin:0;text-transform:uppercase;text-wrap:balance">${esc(blockTitle(b))}</h1>
      <div class="clock" id="clock">--:--</div>
      <div class="bar"><i id="bar" style="width:0"></i></div>
    </div>
    <div class="run-ctrls" style="margin-top:12px">
      <button class="btn" data-run="prev" ${r.idx ? '' : 'disabled'}>‹ Prev</button>
      <button class="btn ${r.running ? '' : 'primary'}" data-run="toggle" style="height:56px;font-size:20px">${r.running ? 'Pause' : elapsed(r) ? 'Resume' : 'Start'}</button>
      <button class="btn" data-run="next">Next ›</button>
    </div>
    <div class="row" style="justify-content:center;margin-top:8px"><button class="btn sm" data-run="plus">+1 min</button><button class="btn sm" data-run="restart">Restart timer</button></div>
    <div class="upnext card" style="margin-top:12px"><span>Up next</span><b style="text-align:right">${next ? esc(blockTitle(next)) + ' · ' + next.minutes + ' min' : 'End of session'}</b></div>
    <div style="margin-top:14px">${d ? drillView(d, 'run') : ''}</div>
  </div>`;
}
function updateClock(s) {
  const r = store.run, b = s.blocks[r.idx], el = $('#clock');
  if (!b || !el) return;
  const total = (+b.minutes || 0) * 60000, left = total - elapsed(r), over = left < 0, a = Math.abs(left);
  const m = Math.floor(a / 60000), sec = Math.floor(a % 60000 / 1000);
  el.textContent = (over ? '+' : '') + m + ':' + String(sec).padStart(2, '0');
  el.classList.toggle('over', over);
  $('#bar').style.width = Math.max(0, Math.min(100, elapsed(r) / total * 100)) + '%';
  if (over && r.running && beeped !== r.idx) { beeped = r.idx; buzz(); }
}
let audio;
function unlockAudio() { try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch (e) {} }
function beep(n = 1, freq = 880, len = .3) {
  try {
    unlockAudio();
    for (let k = 0; k < n; k++) {
      const t = audio.currentTime + k * (len + .12), o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = freq; o.connect(g); g.connect(audio.destination);
      g.gain.setValueAtTime(.4, t); g.gain.exponentialRampToValueAtTime(.001, t + len); o.start(t); o.stop(t + len);
    }
  } catch (e) {}
}
function buzz() {
  try { navigator.vibrate?.([300, 150, 300, 150, 300]); } catch (e) {}
  beep(3);
}
const anyAwake = () => (route()[0] === 'run' && store.run?.running) || anyTimer();
async function keepAwake(on) {
  try {
    if (on && !wake && navigator.wakeLock) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); }
    if (!on && wake) { await wake.release(); wake = null; }
  } catch (e) {}
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && anyAwake()) keepAwake(true); });

// ---------- Router ----------
function route() { return (location.hash || '#plan').slice(1).split('/'); }
function render() {
  const [r, id] = route(), y = window.scrollY, same = render.last === location.hash;
  clearInterval(tick); stopAnims();
  let html;
  if (r === 's' && getSession(id)) html = viewSession(getSession(id));
  else if (r === 'run' && getSession(id)) html = viewRun(getSession(id));
  else if (r === 'd' && DRILL[id]) html = viewDrill(DRILL[id]);
  else if (r === 'drills') html = viewDrills();
  else html = viewPlan();
  $('#app').innerHTML = html;
  if (r === 'run' && getSession(id)) {
    const s = getSession(id); updateClock(s); tick = setInterval(() => updateClock(s), 250);
  }
  keepAwake(anyAwake());
  mountAnims();
  document.querySelectorAll('[data-timer]').forEach(timerUpdate);
  window.scrollTo(0, same ? y : 0);
  render.last = location.hash;
}
window.addEventListener('hashchange', render);

// ---------- Actions ----------
const cur = () => getSession(route()[1]);
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act],[data-up],[data-down],[data-remove],[data-run],[data-pick],[data-preset]');
  if (!el) return;
  if (el.dataset.act === 'install') {
    const ev = installEvt; installEvt = null;
    if (ev) { ev.prompt(); ev.userChoice.finally(render); }
    return;
  }
  if (el.dataset.act === 'install-no') { try { localStorage.setItem('coach-hub-install', 'no'); } catch (e) {} render(); return; }
  const s = cur();
  if (el.dataset.up || el.dataset.down) {
    const i = +(el.dataset.up ?? el.dataset.down), j = el.dataset.up ? i - 1 : i + 1;
    [s.blocks[i], s.blocks[j]] = [s.blocks[j], s.blocks[i]]; persist(); render(); return;
  }
  if (el.dataset.remove) { s.blocks = s.blocks.filter(b => b.id !== el.dataset.remove); persist(); render(); return; }
  if (el.dataset.pick) { const d = DRILL[el.dataset.pick]; s.blocks.push({ id: uid(), kind: 'drill', drillId: d.id, minutes: d.minutes }); persist(); closeSheet(); render(); toast('Added ' + d.name); return; }
  if (el.dataset.preset) {
    const [title, m] = el.dataset.preset.split('|');
    s.blocks.push({ id: uid(), kind: 'other', title, minutes: +m }); persist(); closeSheet(); render(); return;
  }
  if (el.dataset.run) return runAction(el.dataset.run);
  switch (el.dataset.act) {
    case 'new': {
      const n = { id: uid(), date: new Date().toISOString().slice(0, 10), start: '18:00', blocks: [] };
      store.sessions.push(n); persist(); location.hash = 's/' + n.id; break;
    }
    case 'add-drill':
      openSheet(`<h2>Add a drill</h2>${DRILLS.map(d => `<button class="card pick list-item" data-pick="${d.id}"><div class="grow"><h3>${esc(d.name)}</h3><p>${esc(d.category)} · ${d.minutes} min · ${esc(d.intensity)}</p></div><span class="chev">+</span></button>`).join('')}`);
      break;
    case 'add-other':
      openSheet(`<h2>Add a block</h2>${[['Warm-up', 10], ['Drinks', 3], ['Match', 20], ['Positions talk', 10], ['Cool-down', 5], ['Other', 10]]
        .map(([t, m]) => `<button class="card pick list-item" data-preset="${t}|${m}"><div class="grow"><h3>${t}</h3><p>${m} min</p></div><span class="chev">+</span></button>`).join('')}`);
      break;
    case 'start':
      store.run = { sid: s.id, idx: 0, running: false, startedAt: 0, before: 0 }; persist(); location.hash = 'run/' + s.id; break;
    case 'dup': {
      const c = JSON.parse(JSON.stringify(s)); c.id = uid(); c.blocks.forEach(b => b.id = uid());
      store.sessions.push(c); persist(); location.hash = 's/' + c.id; toast('Duplicated'); break;
    }
    case 'del':
      $('#delzone').innerHTML = `<span class="confirm"><span class="small">Delete for good?</span><button class="btn sm danger" data-act="del-yes">Yes, delete</button><button class="btn sm" data-act="del-no">Keep</button></span>`; break;
    case 'del-no': render(); break;
    case 'del-yes':
      store.sessions = store.sessions.filter(x => x.id !== s.id); if (store.run?.sid === s.id) store.run = null; persist(); location.hash = 'plan'; break;
    case 'share': {
      let t = 0;
      const text = `Training – ${longDate(s.date)}${s.start ? ' ' + s.start : ''}\n` +
        s.blocks.map(b => { const st = addMins(s.start, t); t += +b.minutes; return `${st || ''} ${blockTitle(b)} (${b.minutes} min)`.trim(); }).join('\n');
      if (navigator.share) navigator.share({ text }).catch(() => {}); else copyText(text, 'Schedule copied');
      break;
    }
    case 'backup': copyText(JSON.stringify({ sessions: store.sessions }), 'Backup copied. Paste it somewhere safe.'); break;
    case 'restore':
      openSheet(`<h2>Restore backup</h2><p class="muted small" style="margin:0">Paste a backup. Sessions in it are added to the ones already here.</p><textarea id="restorebox" rows="8"></textarea><button class="btn primary block" data-act="restore-go">Restore</button>`); break;
    case 'restore-go':
      try {
        const data = JSON.parse($('#restorebox').value);
        let n = 0; for (const x of data.sessions || []) { if (!getSession(x.id)) { store.sessions.push(x); n++; } }
        persist(); closeSheet(); render(); toast(`Restored ${n} session${n === 1 ? '' : 's'}`);
      } catch (err) { toast('That doesn’t look like a backup. Copy the whole thing and try again.'); }
      break;
  }
});
document.addEventListener('change', e => {
  const s = cur(); if (!s) return;
  const t = e.target;
  if (t.id === 's-date') s.date = t.value;
  else if (t.id === 's-start') s.start = t.value;
  else if (t.dataset.mins) { const b = s.blocks.find(b => b.id === t.dataset.mins); b.minutes = Math.max(1, Math.min(120, +t.value || 1)); }
  else if (t.dataset.title) { s.blocks.find(b => b.id === t.dataset.title).title = t.value; persist(); return; }
  else return;
  persist(); render();
});

function runAction(a) {
  const s = cur(), r = runState(s);
  if (a === 'toggle') {
    if (r.running) { r.before = elapsed(r); r.running = false; }
    else { r.startedAt = Date.now(); r.running = true; unlockAudio(); }
  } else if (a === 'next' || a === 'prev') {
    r.idx = Math.max(0, r.idx + (a === 'next' ? 1 : -1)); r.before = 0; r.startedAt = Date.now();
    if (r.idx >= s.blocks.length) r.running = false;
  } else if (a === 'plus') { r.before -= 60000; }
  else if (a === 'restart') { r.before = 0; r.startedAt = Date.now(); }
  else if (a === 'finish') { store.run = null; persist(); location.hash = 's/' + s.id; return; }
  persist(); render();
}

render();
})();
