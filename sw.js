// Bump VERSION on every release: the app then shows a "New version available" bar
const VERSION = 2;
const CACHE = 'coach-hub-v' + VERSION;
const CORE = ['./', 'index.html', 'positions.html', 'app.js', 'drills.js', 'pwa.js', 'style.css', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('message', e => { if (e.data === 'update') self.skipWaiting(); });
// Serve the saved copy so the version only changes when the coach taps Update
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin && !/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) return;
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = await c.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await c.match('./') : null);
    if (hit) return hit;
    const res = await fetch(req);
    if (res.ok || res.type === 'opaque') c.put(req, res.clone());
    return res;
  }));
});
