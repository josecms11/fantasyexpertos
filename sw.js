// Fantasy Expertos · service worker
// Siempre pide lo más nuevo a la red; si no hay internet, muestra lo último guardado.
const CACHE = 'fx-v52';
const BASE = ['./', 'index.html', 'assets/app.css', 'assets/app.js', 'assets/icons/icon-192.png', 'manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url);
  const propio = u.origin === location.origin, fuentes = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (!propio && !fuentes) return; // ESPN, YouTube, etc. van directo
  // Lo propio siempre se revalida con el servidor (no usa la copia vieja del navegador)
  e.respondWith((propio ? fetch(u.href, { cache: 'no-cache', credentials: 'same-origin' }) : fetch(r)).then(res => {
    if (res.ok) { const copia = res.clone(); const llave = propio ? u.origin + u.pathname : r.url; caches.open(CACHE).then(c => c.put(llave, copia)); }
    return res;
  }).catch(() => caches.match(propio ? u.origin + u.pathname : r.url).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
