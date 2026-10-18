// Offline copy plus a "new version" bar, shared by every page
(function () {
  if (!('serviceWorker' in navigator)) return;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloading) { reloading = true; location.reload(); } });
  function showBar(worker) {
    if (document.getElementById('upd-bar')) return;
    const bar = document.createElement('div');
    bar.id = 'upd-bar';
    bar.setAttribute('role', 'status');
    bar.style.cssText = 'position:fixed;left:12px;right:12px;top:calc(env(safe-area-inset-top) + 10px);z-index:999;display:flex;gap:10px;align-items:center;'
      + 'background:#1c5fd4;color:#fff;border-radius:12px;padding:10px 10px 10px 16px;box-shadow:0 6px 24px rgba(0,0,0,.3);font:600 15px/1.3 Barlow,system-ui,sans-serif;max-width:560px;margin:0 auto';
    bar.innerHTML = '<span style="flex:1">New version available</span>'
      + '<button type="button" data-u="later" style="height:38px;padding:0 12px;border-radius:9px;border:1px solid rgba(255,255,255,.5);background:none;color:#fff;font:700 14px Barlow Condensed,system-ui;text-transform:uppercase;letter-spacing:.05em">Later</button>'
      + '<button type="button" data-u="go" style="height:38px;padding:0 14px;border-radius:9px;border:0;background:#fff;color:#1c5fd4;font:700 14px Barlow Condensed,system-ui;text-transform:uppercase;letter-spacing:.05em">Update</button>';
    bar.addEventListener('click', e => {
      const b = e.target.closest('[data-u]'); if (!b) return;
      if (b.dataset.u === 'go') { b.textContent = 'Updating…'; worker.postMessage('update'); } else bar.remove();
    });
    document.body.appendChild(bar);
  }
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('sw.js');
      const watch = w => w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) showBar(w); });
      if (reg.waiting && navigator.serviceWorker.controller) showBar(reg.waiting);
      reg.addEventListener('updatefound', () => watch(reg.installing));
      // An installed app can stay open for days, so look for updates whenever it comes back to the front
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
      setInterval(() => reg.update().catch(() => {}), 30 * 60 * 1000);
    } catch (e) {}
  });
})();
