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
function field() {
  let h = '';
  for (let i = 0; i < 8; i++) h += `<rect class="${i % 2 ? 'd-stripe-b' : 'd-stripe-a'}" x="-2" y="${i * 5}" width="35.4" height="5"></rect>`;
  h += `<rect class="d-stripe-b" x="-2" y="-3.6" width="35.4" height="3.6"></rect><rect class="d-stripe-a" x="-2" y="40" width="35.4" height="2.4"></rect>`;
  h += `<rect class="d-chalk" x="0" y="0" width="30" height="40"></rect><line class="d-chalk" x1="0" y1="20" x2="30" y2="20"></line>
    <circle class="d-chalk" cx="15" cy="20" r="4"></circle><rect class="d-chalk" x="8" y="0" width="14" height="7"></rect>
    <rect class="d-chalk" x="8" y="33" width="14" height="7"></rect><rect class="d-goal" x="12.5" y="-1" width="5" height="1"></rect>
    <rect class="d-goal" x="12.5" y="40" width="5" height="1"></rect>`;
  for (const c of [[0, 0], [30, 0], [0, 40], [30, 40]]) h += cone(c);
  return h;
}
const cone = ([x, y]) => `<path class="d-cone" d="M${x - .55} ${y + .45} L${x} ${y - .65} L${x + .55} ${y + .45}z"></path>`;
const person = (p, [x, y], id = '') => `<g class="d-p d-${p.t}${p.wait ? ' d-wait' : ''}" ${id ? `data-p="${id}"` : ''} transform="translate(${r2(x)} ${r2(y)})"><circle r="1.15"></circle><text>${esc(p.l)}</text></g>`;
function ballPile([x, y, n]) {
  let h = '';
  for (let i = 0; i < n; i++) h += `<circle class="d-ball" cx="${r2(x + (i % 3) * .75)}" cy="${r2(y + Math.floor(i / 3) * .7)}" r=".38"></circle>`;
  return h;
}

// Setup picture: starting spots, kit, measurements and labels
function setupImage(d) {
  const L = d.layout;
  let h = field();
  // measurements
  h += `<g class="d-dim"><line x1="0" y1="-2.6" x2="30" y2="-2.6"></line><line x1="0" y1="-3.1" x2="0" y2="-2.1"></line><line x1="30" y1="-3.1" x2="30" y2="-2.1"></line>
    <line x1="31.6" y1="0" x2="31.6" y2="40"></line><line x1="31.1" y1="0" x2="32.1" y2="0"></line><line x1="31.1" y1="40" x2="32.1" y2="40"></line></g>
    <text class="d-dimtxt" x="24" y="-2.6" text-anchor="middle" dominant-baseline="central">30 yd</text>
    <text class="d-dimtxt" transform="translate(31.6 27) rotate(-90)" text-anchor="middle" dominant-baseline="central">40 yd</text>`;
  for (const c of L.cones) h += cone(c);
  for (const b of L.balls) h += ballPile(b);
  for (const id in d.start) h += person(d.people[id], d.start[id]);
  h += `<circle class="d-ball" cx="${d.start[d.anim.ball][0] + .9}" cy="${d.start[d.anim.ball][1] - .9}" r=".5"></circle>`;
  for (const c of L.callouts) {
    const w = c.text.length * .58 + 1, [ax, ay] = c.at;
    h += `<line class="d-lead" x1="${c.to[0]}" y1="${c.to[1]}" x2="${ax}" y2="${ay}"></line><circle class="d-leaddot" cx="${c.to[0]}" cy="${c.to[1]}" r=".28"></circle>
      <rect class="d-tag" x="${ax}" y="${ay - .95}" width="${r2(w)}" height="1.9" rx=".5"></rect><text class="d-tagtxt" x="${ax + .5}" y="${ay + .05}">${esc(c.text)}</text>`;
  }
  return `<svg class="diagram" viewBox="${VB}" role="img" aria-label="Setup diagram for ${esc(d.name)}">${h}</svg>
    <div class="legend">
      <span><i class="sw" style="background:var(--kit)"></i>Blue bibs</span><span><i class="sw" style="background:var(--opp)"></i>Red bibs</span>
      <span><i class="sw" style="background:#f2c94c"></i>Keeper</span><span><i class="sw" style="background:#222"></i>Coach</span>
      <span><i class="tri"></i>Cone</span><span><i class="sw" style="background:#fff;border:1px solid #111;width:10px;height:10px"></i>Ball</span>
      <span class="muted">Faded = waiting</span></div>`;
}

// Animated walkthrough
function animMarkup(d) {
  const a = d.anim;
  return `<div class="anim" data-anim="${d.id}">
    <svg class="diagram" viewBox="${VB}" role="img" aria-label="Animation of ${esc(d.name)}">${field()}${d.layout.cones.map(cone).join('')}
      <g class="a-trails"></g>${Object.keys(d.start).map(id => person(d.people[id], d.start[id], id)).join('')}<circle class="d-ball a-ball" r=".55"></circle></svg>
    <div class="cap card"><div class="cap-top"><span class="phase-tag a-phase"></span><span class="muted small a-count"></span></div><p class="a-text"></p></div>
    <div class="dots">${a.steps.map((s, i) => `<button class="dot p${s.phase}" data-i="${i}" aria-label="Step ${i + 1}"></button>`).join('')}</div>
    <div class="anim-ctrls">
      <button class="btn" data-a="prev" aria-label="Previous step">‹ Step</button>
      <button class="btn primary" data-a="play">Pause</button>
      <button class="btn" data-a="next" aria-label="Next step">Step ›</button>
      <button class="btn" data-a="speed" aria-label="Playback speed">1×</button>
    </div>
    <div class="legend"><span><i class="lg" style="border-top-style:dashed;border-color:#8a9a90"></i>Ball</span><span><i class="lg" style="border-color:#e0b400"></i>Run</span><span><i class="lg" style="border-color:#3fbf74"></i>Dribble</span></div>
  </div>`;
}
const anims = [];
function stopAnims() { while (anims.length) anims.pop().stop(); }
function mountAnims() {
  document.querySelectorAll('[data-anim]').forEach(el => anims.push(animate(el, DRILL[el.dataset.anim])));
}
function animate(root, d) {
  const a = d.anim, steps = a.steps, N = steps.length;
  const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const off = p => [p[0] + .9, p[1] - .9];
  // Work out where everyone is after each step
  const st = [{ pos: { ...d.start }, holder: a.ball, bxy: null }];
  steps.forEach(s => {
    const prev = st[st.length - 1], n = { pos: { ...prev.pos, ...s.moves }, holder: prev.holder, bxy: prev.bxy };
    if (typeof s.ball === 'string') { n.holder = s.ball; n.bxy = null; } else if (s.ball) { n.holder = null; n.bxy = s.ball; }
    st.push(n);
  });
  const ballOf = (s, pos) => s.holder ? off(pos[s.holder]) : s.bxy;
  const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const els = {}; root.querySelectorAll('[data-p]').forEach(g => els[g.dataset.p] = g);
  const ball = root.querySelector('.a-ball'), trails = root.querySelector('.a-trails');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let i = 0, t = 0, hold = 900, playing = !reduce, once = false, speed = 1, last = performance.now(), raf, drawnTrail = -1;

  function posAt(k, e) { const f = st[k], g = st[k + 1], out = {}; for (const id in f.pos) out[id] = lerp(f.pos[id], g.pos[id], e); return out; }
  function frame() {
    const s = steps[i], e = ease(t), pos = posAt(i, e);
    for (const id in pos) els[id].setAttribute('transform', `translate(${r2(pos[id][0])} ${r2(pos[id][1])})`);
    let b;
    if (s.ball) {
      const at = s.ballAt || 0, bt = Math.max(0, Math.min(1, (t - at) / (1 - at)));
      const from = ballOf(st[i], posAt(i, ease(Math.min(t, at)))), to = ballOf(st[i + 1], st[i + 1].pos);
      b = lerp(from, to, 1 - Math.pow(1 - bt, 2));
    } else b = ballOf(st[i], pos);
    ball.setAttribute('cx', r2(b[0])); ball.setAttribute('cy', r2(b[1]));
    if (drawnTrail !== i) { drawTrails(); drawnTrail = i; }
  }
  function drawTrails() {
    const s = steps[i], f = st[i], g = st[i + 1];
    let h = '';
    for (const id in s.moves) {
      const p = f.pos[id], q = g.pos[id];
      if (Math.hypot(q[0] - p[0], q[1] - p[1]) < .3) continue;
      const dribble = f.holder === id && !s.ball;
      h += `<line class="${dribble ? 'd-dribble' : 'd-run'} a-tr" x1="${p[0]}" y1="${p[1]}" x2="${q[0]}" y2="${q[1]}" marker-end="url(#am-${dribble ? 'dribble' : 'run'})"></line>`;
    }
    if (s.ball) {
      const at = s.ballAt || 0, p = ballOf(f, posAt(i, ease(at))), q = ballOf(g, g.pos);
      h += `<line class="d-pass a-tr" x1="${r2(p[0])}" y1="${r2(p[1])}" x2="${r2(q[0])}" y2="${r2(q[1])}" marker-end="url(#am-pass)"></line>`;
    }
    trails.innerHTML = `<defs>${['pass:#fff', 'run:#ffe14d', 'dribble:#9dff9d'].map(m => { const [k, c] = m.split(':'); return `<marker id="am-${k}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10z" fill="${c}"></path></marker>`; }).join('')}</defs>${h}`;
    root.querySelector('.a-phase').textContent = s.phase === 1 ? d.phases[0].name : d.phases[1].name;
    root.querySelector('.a-phase').style.color = s.phase === 1 ? 'var(--kit)' : 'var(--opp)';
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
      else if (t < 1) { t = Math.min(1, t + dt * speed / (steps[i].dur * 1000)); if (t >= 1) { hold = i === N - 1 ? 2200 : 800; if (once) { once = false; } } }
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

// ---------- Drill detail ----------
const ui = { tab: {} };
const roleSwatch = { blue: 'background:var(--kit);color:#fff', red: 'background:var(--opp);color:#fff', gk: 'background:#f2c94c;color:#1d1600', coach: 'background:#222;color:#fff' };

function drillView(d, ctx) {
  const tab = ui.tab[d.id] || 'run';
  const tabs = [['run', 'Run it'], ['setup', 'Setup'], ['coach', 'Coach'], ['about', 'About']];
  let body = '';
  if (tab === 'run') {
    let n = 0;
    body = `${animMarkup(d)}
      ${d.phases.map((p, i) => `<div class="card"><div class="phase-tag" style="color:${i ? 'var(--opp)' : 'var(--kit)'}">${esc(p.name)}</div>
        <ol class="steps" style="margin-top:8px;counter-reset:s ${n}">${p.steps.map(s => (n++, `<li class="${i ? 'p2' : ''}"><span>${esc(s)}</span></li>`)).join('')}</ol></div>`).join('')}
      <div class="card"><div class="label">Rotate</div><p style="margin:0">${esc(d.rotation)}</p></div>`;
  } else if (tab === 'setup') {
    body = `<div>${setupImage(d)}</div>
      <div class="card"><div class="label">Kit</div><ul class="ticks">${d.equipment.map(e => `<li><span>${esc(e)}</span></li>`).join('')}</ul></div>
      <div class="card"><div class="label">Setup</div><ol class="steps">${d.setup.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol></div>
      <div class="card"><div class="label">Who’s who</div><div class="stack">${d.roles.map(r => `<div class="role"><span class="swatch" style="${roleSwatch[r.t]}">${esc(r.l)}</span><div><b>${esc(r.name)}</b><br><span class="small">${esc(r.job)}</span></div></div>`).join('')}</div></div>`;
  } else if (tab === 'coach') {
    body = `<div class="tips">${d.coaching.map(c => `<div class="card tip"><h4>${esc(c.who)}</h4><ul>${c.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>`).join('')}</div>
      <div class="card"><div class="label">Make it harder or easier</div><ul class="ticks">${d.progressions.map(e => `<li><span>${esc(e)}</span></li>`).join('')}</ul></div>`;
  } else {
    body = `<div class="card"><p style="margin:0 0 8px">${esc(d.summary)}</p><p class="muted small" style="margin:0">${esc(d.why)}</p></div>
      <div class="card quote"><div class="label">From the video</div><div class="stack small">${d.fromVideo.map(q => `<p style="margin:0">“${esc(q)}”</p>`).join('')}</div>
      <p class="small" style="margin:10px 0 0"><a href="${esc(d.source.url)}" target="_blank" rel="noopener">Watch at ${esc(d.source.at)}: ${esc(d.source.title)}</a> (${esc(d.source.channel)})</p></div>
      <p class="muted small">${esc(d.note)}</p>`;
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

function viewPlan() {
  const list = [...store.sessions].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  return `<div class="wrap">
    <div class="title-row"><h1>Sessions</h1><span class="spacer"></span><button class="btn primary sm" data-act="new">+ New</button></div>
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
function buzz() {
  try { navigator.vibrate?.([300, 150, 300, 150, 300]); } catch (e) {}
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    [0, .35, .7].forEach(t => { const o = audio.createOscillator(), g = audio.createGain(); o.frequency.value = 880; o.connect(g); g.connect(audio.destination);
      g.gain.setValueAtTime(.4, audio.currentTime + t); g.gain.exponentialRampToValueAtTime(.001, audio.currentTime + t + .3); o.start(audio.currentTime + t); o.stop(audio.currentTime + t + .3); });
  } catch (e) {}
}
async function keepAwake(on) {
  try {
    if (on && !wake && navigator.wakeLock) { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); }
    if (!on && wake) { await wake.release(); wake = null; }
  } catch (e) {}
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && store.run?.running) keepAwake(true); });

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
    keepAwake(store.run.running);
  } else keepAwake(false);
  mountAnims();
  window.scrollTo(0, same ? y : 0);
  render.last = location.hash;
}
window.addEventListener('hashchange', render);

// ---------- Actions ----------
const cur = () => getSession(route()[1]);
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act],[data-up],[data-down],[data-remove],[data-run],[data-pick],[data-preset]');
  if (!el) return;
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
    else { r.startedAt = Date.now(); r.running = true; try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch (e) {} }
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
