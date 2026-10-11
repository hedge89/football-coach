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
    id: uid(), name: 'Example: Tuesday training', date: nextWeekday(2), start: '18:00',
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
function niceDate(iso) {
  if (!iso) return 'No date';
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
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

// ---------- Diagram ----------
function diagram(dg) {
  let h = '';
  for (let i = 0; i < 8; i++) h += `<rect class="${i % 2 ? 'd-stripe-b' : 'd-stripe-a'}" x="-2" y="${i * 5}" width="34" height="5"></rect>`;
  h += `<rect class="d-stripe-b" x="-2" y="-2" width="34" height="2"></rect><rect class="d-stripe-a" x="-2" y="40" width="34" height="2"></rect>`;
  h += `<rect class="d-chalk" x="0" y="0" width="30" height="40"></rect><line class="d-chalk" x1="0" y1="20" x2="30" y2="20"></line>
    <circle class="d-chalk" cx="15" cy="20" r="4"></circle><rect class="d-chalk" x="8" y="0" width="14" height="7"></rect>
    <rect class="d-chalk" x="8" y="33" width="14" height="7"></rect><rect class="d-goal" x="12.5" y="-1" width="5" height="1"></rect>
    <rect class="d-goal" x="12.5" y="40" width="5" height="1"></rect>`;
  for (const [x, y] of [[0, 0], [30, 0], [0, 40], [30, 40], [0.2, 19.2], [3.5, 19.2]]) h += `<path class="d-cone" d="M${x - .5} ${y + .4} L${x} ${y - .6} L${x + .5} ${y + .4}z"></path>`;
  for (const a of dg.arrows || []) {
    const [[x1, y1], [x2, y2]] = a.p;
    let d;
    if (a.k === 'dribble') {
      const len = Math.hypot(x2 - x1, y2 - y1), n = Math.max(2, Math.floor(len / .9)), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
      d = `M${x1} ${y1}`;
      for (let i = 1; i < n; i++) { const t = i / n, o = (i % 2 ? .35 : -.35); d += ` L${x1 + (x2 - x1) * t - uy * o} ${y1 + (y2 - y1) * t + ux * o}`; }
      d += ` L${x2} ${y2}`;
    } else d = `M${x1} ${y1} L${x2} ${y2}`;
    h += `<path class="d-${a.k}" d="${d}" marker-end="url(#m-${a.k})"></path>`;
    if (a.n) { const mx = x1 + (x2 - x1) * .45, my = y1 + (y2 - y1) * .45; h += `<g class="d-p d-coach" transform="translate(${mx} ${my})"><circle r=".75"></circle><text>${a.n}</text></g>`; }
  }
  for (const p of dg.players) {
    h += `<g class="d-p d-${p.t}${p.wait ? ' d-wait' : ''}" transform="translate(${p.x} ${p.y})"><circle r="1.15"></circle><text>${esc(p.l)}</text></g>`;
    if (p.ball) h += `<circle class="d-ball" cx="${p.x + 1}" cy="${p.y - 1}" r=".5"></circle>`;
  }
  for (const n of dg.notes || []) h += `<text class="d-note" x="${n.x}" y="${n.y}">${esc(n.t)}</text>`;
  const mk = (id, col) => `<marker id="m-${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10z" fill="${col}"></path></marker>`;
  return `<svg class="diagram" viewBox="-2 -2 34 44" role="img" aria-label="Drill diagram"><defs>${mk('pass', '#fff')}${mk('run', '#ffe14d')}${mk('dribble', '#9dff9d')}</defs>${h}</svg>
    <div class="legend"><span><i class="lg" style="border-top-style:dashed;border-color:#8a9a90"></i>Pass</span><span><i class="lg" style="border-color:#e0b400"></i>Run</span><span><i class="lg" style="border-color:#3fbf74;border-top-style:dotted"></i>Dribble</span><span class="muted">Faded = waiting</span></div>`;
}

// ---------- Drill detail ----------
const ui = { tab: {}, phase: {} };
const roleSwatch = { blue: 'background:var(--kit);color:#fff', red: 'background:var(--opp);color:#fff', gk: 'background:#f2c94c;color:#1d1600', coach: 'background:#222;color:#fff' };

function drillView(d, ctx) {
  const tab = ui.tab[d.id] || 'run', ph = ui.phase[d.id] || 0;
  const tabs = [['run', 'Run it'], ['setup', 'Setup'], ['coach', 'Coach'], ['about', 'About']];
  let body = '';
  if (tab === 'run') {
    let n = 0;
    body = `<div class="seg" role="tablist" data-phases="${d.id}">${d.phases.map((p, i) => `<button role="tab" aria-selected="${i === ph}" data-phase="${i}">${esc(p.name.split('·')[1] || p.name)}</button>`).join('')}</div>
      ${diagram(d.phases[ph].diagram)}
      ${d.phases.map((p, i) => `<div class="card"><div class="phase-tag" style="color:${i ? 'var(--opp)' : 'var(--kit)'}">${esc(p.name)}</div>
        <ol class="steps" style="margin-top:8px;counter-reset:s ${n}">${p.steps.map(s => (n++, `<li class="${i ? 'p2' : ''}"><span>${esc(s)}</span></li>`)).join('')}</ol></div>`).join('')}
      <div class="card"><div class="label">Rotate</div><p style="margin:0">${esc(d.rotation)}</p></div>`;
  } else if (tab === 'setup') {
    body = `<div class="card"><div class="label">Setup</div><ol class="steps">${d.setup.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol></div>
      <div class="card"><div class="label">Who’s who</div><div class="stack">${d.roles.map(r => `<div class="role"><span class="swatch" style="${roleSwatch[r.t]}">${esc(r.l)}</span><div><b>${esc(r.name)}</b><br><span class="small">${esc(r.job)}</span></div></div>`).join('')}</div></div>
      <div class="card"><div class="label">Kit</div><ul class="ticks">${d.equipment.map(e => `<li><span>${esc(e)}</span></li>`).join('')}</ul></div>`;
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
  const t = e.target.closest('[data-tab]'), p = e.target.closest('[data-phase]');
  if (t) { ui.tab[t.parentElement.dataset.tabs] = t.dataset.tab; render(); }
  if (p) { ui.phase[p.parentElement.dataset.phases] = +p.dataset.phase; render(); }
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
    ${store.run && getSession(store.run.sid) ? `<a class="btn gold block" href="#run/${store.run.sid}" style="margin-bottom:12px">Resume: ${esc(getSession(store.run.sid).name)}</a>` : ''}
    <div class="stack">
    ${list.length ? list.map(s => `<a class="card list-item" href="#s/${s.id}"><div class="grow"><h3>${esc(s.name || 'Untitled session')}</h3>
      <p>${niceDate(s.date)}${s.start ? ' · ' + s.start + '–' + addMins(s.start, totalMins(s)) : ''} · ${s.blocks.length} blocks · ${totalMins(s)} min</p></div><span class="chev">›</span></a>`).join('')
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
      <div class="field"><label class="label" for="s-name">Session name</label><input type="text" id="s-name" value="${esc(s.name)}" placeholder="e.g. Tuesday training"></div>
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
    <div class="title-row"><a class="back" href="#s/${s.id}">‹ Plan</a><span class="spacer"></span><span class="muted small">${esc(s.name)}</span></div>
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
  clearInterval(tick);
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
      const n = { id: uid(), name: '', date: new Date().toISOString().slice(0, 10), start: '18:00', blocks: [] };
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
      const c = JSON.parse(JSON.stringify(s)); c.id = uid(); c.name = (s.name || 'Session') + ' (copy)'; c.blocks.forEach(b => b.id = uid());
      store.sessions.push(c); persist(); location.hash = 's/' + c.id; toast('Duplicated'); break;
    }
    case 'del':
      $('#delzone').innerHTML = `<span class="confirm"><span class="small">Delete for good?</span><button class="btn sm danger" data-act="del-yes">Yes, delete</button><button class="btn sm" data-act="del-no">Keep</button></span>`; break;
    case 'del-no': render(); break;
    case 'del-yes':
      store.sessions = store.sessions.filter(x => x.id !== s.id); if (store.run?.sid === s.id) store.run = null; persist(); location.hash = 'plan'; break;
    case 'share': {
      let t = 0;
      const text = `${s.name || 'Training'} – ${niceDate(s.date)}${s.start ? ' ' + s.start : ''}\n` +
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
document.addEventListener('input', e => { if (e.target.id === 's-name') { cur().name = e.target.value; persist(); } });

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
