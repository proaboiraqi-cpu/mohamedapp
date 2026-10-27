// يخزّن ملفات التطبيق حتى يفتح بدون إنترنت. الفيديوهات تنحفظ بشكل منفصل داخل التطبيق (IndexedDB).
const CACHE = 'utyub-v14';
const SHELL = [
  './', 'index.html', 'style.css', 'app.js', 'cloud.js', 'manifest.json',
  'logo.png', 'wordmark.png', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png',
  'kid-point.webp', 'kid-happy.webp', 'kid-clap.webp', 'kid-angry.webp', 'kid-eat.webp'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    // مكتبة Firebase تنحفظ حتى تشتغل بدون إنترنت. روابط الفيديو الخارجية تمر مباشرة
    if (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/')) e.respondWith(handleLib(e));
    return;
  }
  e.respondWith(handle(e));
});

async function handle(e) {
  const req = e.request;
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req, { ignoreSearch: true });
  const net = fetch(req, { cache: 'no-cache' })
    .then(r => { if (r && r.ok) cache.put(req, r.clone()); return r; })
    .catch(() => null);
  if (cached) { e.waitUntil(net); return cached; }
  const r = await net;
  if (r) return r;
  if (req.mode === 'navigate') {
    const idx = await cache.match('index.html');
    if (idx) return idx;
  }
  return new Response('', { status: 504 });
}

async function handleLib(e) {
  const cache = await caches.open(CACHE);
  const c = await cache.match(e.request);
  if (c) return c;
  try {
    const r = await fetch(e.request);
    if (r && (r.ok || r.type === 'opaque')) cache.put(e.request, r.clone());
    return r;
  } catch (err) { return new Response('', { status: 504 }); }
}
