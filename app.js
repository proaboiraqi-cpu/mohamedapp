'use strict';
(function () {

/* ================= أدوات ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const LS = {
  get(k, d) { try { const v = localStorage.getItem('u_' + k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('u_' + k, v); } catch (e) {} }
};
if (LS.get('code', null) === null) LS.set('code', '1234');
const channel = () => LS.get('channel', 'الفيديوهات');
const chInitial = () => (channel().trim()[0] || 'ي');
const KID = () => LS.get('kid', '0') === '1';
const applyLite = () => document.body.classList.toggle('lite', KID());
const lsJSON = (k, d) => { try { return JSON.parse(LS.get(k, '')) || d; } catch (e) { return d; } };
const CL = window.CLOUD || { ok: false, offset: 0, now: () => Date.now() };
const withTimeout = (p, ms = 10000) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2800);
}

function fmtDur(s) {
  s = Math.max(0, Math.round(s || 0));
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`;
}
function fmtSize(b) {
  if (!b) return '';
  return b >= 1073741824 ? (b / 1073741824).toFixed(1) + ' GB' : Math.max(1, Math.round(b / 1048576)) + ' MB';
}
const UNITS = [
  [31536000, 'سنة', 'سنتين', 'سنوات', 'سنة'], [2592000, 'شهر', 'شهرين', 'أشهر', 'شهرًا'],
  [604800, 'أسبوع', 'أسبوعين', 'أسابيع', 'أسبوعًا'], [86400, 'يوم', 'يومين', 'أيام', 'يومًا'],
  [3600, 'ساعة', 'ساعتين', 'ساعات', 'ساعة'], [60, 'دقيقة', 'دقيقتين', 'دقائق', 'دقيقة']
];
function rel(ts) {
  const s = (Date.now() - ts) / 1000;
  for (const [sec, a, b, c, d] of UNITS) {
    if (s >= sec) {
      const n = Math.floor(s / sec);
      return 'قبل ' + (n === 1 ? a : n === 2 ? b : n <= 10 ? `${n} ${c}` : `${n} ${d}`);
    }
  }
  return 'الآن';
}

/* ================= الأيقونات ================= */
const P = {
  home: 'M12 5.69l5 4.5V18h-2v-6H9v6H7v-7.81l5-4.5M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z',
  shorts: 'M10 14.65v-5.3L15 12l-5 2.65zm7.77-4.33c-.77-.32-1.2-.5-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.67 2.22 3.25.03.01 1.2.5 1.2.5L6 14.93c-1.83.97-2.53 3.24-1.56 5.07.97 1.83 3.24 2.53 5.07 1.56l8.5-4.5c1.29-.68 2.06-2.04 1.99-3.49-.07-1.42-.94-2.68-2.23-3.25zm-.23 5.86l-8.5 4.5c-1.34.71-3.01.2-3.72-1.14-.71-1.34-.2-3.01 1.14-3.72l2.04-1.08v-1.21l-.69-.28-1.11-.46c-.99-.41-1.65-1.35-1.7-2.41-.05-1.06.52-2.06 1.46-2.56l8.5-4.5c1.34-.71 3.01-.2 3.72 1.14.71 1.34.2 3.01-1.14 3.72L15.5 9.26v1.21l1.8.74c.99.41 1.65 1.35 1.7 2.41.05 1.06-.52 2.06-1.46 2.56z',
  person: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  search: 'M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
  bell: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
  like: 'M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z',
  comment: 'M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z',
  share: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z',
  download: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
  save: 'M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z',
  play: 'M8 5v14l11-7z',
  pause: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z',
  replay: 'M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z',
  full: 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z',
  close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  down: 'M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z',
  back: 'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z',
  volume: 'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
  mute: 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z',
  trash: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  playlist: 'M4 10h12v2H4zm0-4h12v2H4zm0 8h8v2H4zm10 0v6l5-3-5-3z',
  library: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z',
  homeF: 'M4 21V10.08l8-6.96 8 6.96V21h-6v-6h-4v6H4z',
  shortsF: 'M17.77 10.32l-1.2-.5L18 9.06c1.84-.96 2.53-3.23 1.56-5.06s-3.24-2.53-5.07-1.56L6 6.94c-1.29.68-2.07 2.04-2 3.49.07 1.42.93 2.67 2.22 3.25.03.01 1.2.5 1.2.5L6 14.93c-1.83.97-2.53 3.24-1.56 5.07.97 1.83 3.24 2.53 5.07 1.56l8.5-4.5c1.29-.68 2.06-2.04 1.99-3.49-.07-1.42-.94-2.68-2.23-3.25zM10 14.65v-5.3L15 12l-5 2.65z',
  plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  subs: 'M10 18v-6l5 3-5 3zm7-15H7v1h10V3zm3 3H4v1h16V6zm2 3H2v12h20V9zM3 10h18v10H3V10z',
  clock: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z'
};
function svg(name) {
  if (name === 'dislike') return `<svg viewBox="0 0 24 24" aria-hidden="true"><path transform="rotate(180 12 12)" d="${P.like}"/></svg>`;
  const p = P[name]; if (!p) return '';
  const d = Array.isArray(p) ? p[0] : p;
  const eo = Array.isArray(p) ? ' fill-rule="evenodd"' : '';
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d}"${eo}/></svg>`;
}
function logo(px) {
  return `<img class="logo" src="logo.png" alt="" draggable="false" style="height:${px}px;width:auto">`;
}
function injectIcons(root = document) {
  $$('[data-ico]', root).forEach(el => { el.innerHTML = svg(el.dataset.ico); });
  $$('[data-logo]', root).forEach(el => { el.innerHTML = logo(+el.dataset.logo || 30); });
}

/* ================= التخزين (IndexedDB) ================= */
let db;
function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('utyub', 3);
    r.onupgradeneeded = () => {
      const d = r.result, has = n => d.objectStoreNames.contains(n);
      if (!has('videos')) d.createObjectStore('videos', { keyPath: 'id' });
      if (!has('blobs')) d.createObjectStore('blobs');
      if (!has('history')) d.createObjectStore('history', { keyPath: 'videoId' });
      if (!has('ads')) d.createObjectStore('ads', { keyPath: 'id' });
      if (!has('learn')) d.createObjectStore('learn');
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
const reqP = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const store = (n, m = 'readonly') => db.transaction(n, m).objectStore(n);
const txDone = tx => new Promise((res, rej) => {
  tx.oncomplete = () => res();
  tx.onerror = () => rej(tx.error);
  tx.onabort = () => rej(tx.error || new Error('abort'));
});

async function saveVideo(meta, blobs) {
  const tx = db.transaction(['videos', 'blobs'], 'readwrite');
  tx.objectStore('videos').put(meta);
  for (const k of Object.keys(blobs)) tx.objectStore('blobs').put(blobs[k], meta.id + ':' + k);
  await txDone(tx);
}
async function deleteVideo(id) {
  const tx = db.transaction(['videos', 'blobs', 'history'], 'readwrite');
  tx.objectStore('videos').delete(id);
  tx.objectStore('blobs').delete(id + ':video');
  tx.objectStore('blobs').delete(id + ':thumb');
  tx.objectStore('history').delete(id);
  await txDone(tx);
  const u = thumbCache.get(id);
  if (u && u.startsWith('blob:')) URL.revokeObjectURL(u);
  thumbCache.delete(id);
}

const state = { videos: [], all: [], local: [], cloud: [], byId: new Map(), ads: [], localAds: [], cloudAds: [], ctl: {}, tab: 'home', query: '', muted: false };
function shuffle(a) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
const homeRank = new Map();
let homePrev = new Set(), homeTop = [], homeHiddenAt = 0;
try { homePrev = new Set(JSON.parse(LS.get('hp', '[]')) || []); } catch (e) {}
// الفيديوهات اللي طلعت بمقدمة الصفحة المرة الماضية تنزل لآخر القائمة، حتى كل مرة تشوف غيرها
const rank = id => { if (!homeRank.has(id)) homeRank.set(id, Math.random() + (homePrev.has(id) ? 1 : 0)); return homeRank.get(id); };
function reshuffleHome() { homePrev = new Set(homeTop); homeRank.clear(); }
const byRank = arr => arr.slice().sort((a, b) => rank(a.id) - rank(b.id));
const longs = () => state.videos.filter(v => v.kind !== 'short');
const shorts = () => state.videos.filter(v => v.kind === 'short');

// الطفل: يشوف حسب أوامر التحكم (كل شيء / محتوى محدد / موقوف)
function isVisible(v) {
  if (!KID()) return true;
  const c = state.ctl || {};
  if (c.mode === 'locked') return false;
  if (c.mode === 'only') return !!(c.allowed && c.allowed[v.id]);
  return true;
}
function rebuildVideos() {
  const m = new Map();
  state.local.forEach(v => m.set(v.id, v));
  state.cloud.forEach(v => m.set(v.id, Object.assign({}, v, { cloud: true, src: 'url' })));
  const all = Array.from(m.values()).sort((a, b) => b.created - a.created);
  state.all = all;
  state.byId = new Map(all.map(v => [v.id, v]));
  state.videos = all.filter(isVisible);
}
async function loadVideos() {
  state.local = await reqP(store('videos').getAll());
  rebuildVideos();
}
function rebuildAds() {
  state.ads = state.localAds.concat(state.cloudAds).sort((a, b) => b.created - a.created);
}
async function loadAds() {
  try { state.localAds = await reqP(store('ads').getAll()); }
  catch (e) { state.localAds = []; }
  rebuildAds();
}

const thumbCache = new Map();
async function thumbURL(v) {
  if (thumbCache.has(v.id)) return thumbCache.get(v.id);
  let u = null;
  if (v.hasThumb) {
    const b = await reqP(store('blobs').get(v.id + ':thumb'));
    if (b) u = URL.createObjectURL(b);
  } else if (v.thumbUrl) u = v.thumbUrl;
  thumbCache.set(v.id, u);
  return u;
}
async function getVideoSrc(v) {
  if (v.hasBlob) {
    const b = await reqP(store('blobs').get(v.id + ':video'));
    if (b) return { url: URL.createObjectURL(b), obj: true };
  }
  return { url: v.url, obj: false };
}
// إذا ما اكو صورة مصغرة: نعرض أول لقطة من الفيديو نفسه (تشتغل حتى بدون CORS)
function frameThumb(img, v) {
  if (!v.url || v.ytId || img.dataset.fb) return false;
  img.dataset.fb = '1';
  const vd = document.createElement('video');
  vd.muted = true; vd.preload = 'metadata'; vd.playsInline = true;
  vd.setAttribute('playsinline', '');
  vd.src = v.url + '#t=0.6';
  img.parentNode.insertBefore(vd, img);
  img.style.visibility = 'hidden';
  return true;
}
const thumbObs = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const img = e.target; thumbObs.unobserve(img);
    loadThumb(img);
  }
}, { rootMargin: '500px 0px 500px 0px' });
async function loadThumb(img) {
  const v = state.byId.get(img.dataset.vid);
  if (!v) return;
  let u = null;
  try { u = await thumbURL(v); } catch (e) {}
  if (u) { img.decoding = 'async'; img.onerror = () => { img.style.visibility = 'hidden'; frameThumb(img, v); }; img.src = u; }
  else if (!frameThumb(img, v)) img.style.visibility = 'hidden';
}
function fillThumbs(root) {
  $$('img[data-vid]', root).forEach(img => thumbObs.observe(img));
}
// فيديوهات الهاتف اللي ما إلها صورة مصغرة: نطلعها بالخلفية
async function ensureThumbs() {
  let changed = false;
  for (const v of state.local.slice()) {
    if (v.hasThumb || v.thumbUrl || !v.hasBlob) continue;
    try {
      const b = await reqP(store('blobs').get(v.id + ':video')); if (!b) continue;
      const u = URL.createObjectURL(b);
      const p = await probeVideo(u); URL.revokeObjectURL(u);
      if (!p.thumb) continue;
      const tx = db.transaction(['videos', 'blobs'], 'readwrite');
      tx.objectStore('blobs').put(p.thumb, v.id + ':thumb');
      tx.objectStore('videos').put(Object.assign({}, v, { hasThumb: true, duration: v.duration || p.duration }));
      await txDone(tx);
      thumbCache.delete(v.id); changed = true;
    } catch (e) {}
  }
  if (changed) { await loadVideos(); refreshAll(); }
}

async function addHistory(id) {
  try { await reqP(store('history', 'readwrite').put({ videoId: id, ts: Date.now() })); } catch (e) {}
  if (state.tab === 'you') renderYou();
}

/* ================= الرئيسية ================= */
function cardHTML(v) {
  return `<article class="card" data-open="${v.id}">
    <div class="thumb"><img alt="" data-vid="${v.id}">${v.duration ? `<span class="dur">${fmtDur(v.duration)}</span>` : ''}</div>
    <div class="card-row"><div class="avatar">${esc(chInitial())}</div>
    <div class="card-text"><h3>${esc(v.title)}</h3><p>${esc(channel())} • ${rel(v.created)}</p></div></div></article>`;
}
function shelfHTML(S) {
  return `<section class="shelf"><h2>${logo(26)}<span>Shorts</span></h2><div class="shelf-row">${
    S.map(v => `<div class="scard" data-short="${v.id}"><img alt="" data-vid="${v.id}"><div class="stitle">${esc(v.title)}</div></div>`).join('')
  }</div></section>`;
}
let homeL = [], homeS = [], homeShown = 0;
const homePage = () => (KID() ? 6 : 10);
function renderHome() {
  const box = $('#home-list');
  const q = state.query.trim().toLowerCase();
  let L = byRank(longs()), S = byRank(shorts());
  if (q) { L = L.filter(v => v.title.toLowerCase().includes(q)); S = []; }
  homeL = L; homeS = S; homeShown = 0;
  if (!q) { homeTop = L.slice(0, 8).concat(S.slice(0, 6)).map(v => v.id); LS.set('hp', JSON.stringify(homeTop)); }
  if (!L.length && !S.length) {
    box.innerHTML = `<div class="empty">${logo(64)}<div>${q ? 'لا توجد نتائج' : 'لا توجد فيديوهات'}</div></div>`;
    return;
  }
  box.innerHTML = '';
  addHomeBatch();
}
// يضيف دفعة جديدة من الفيديوهات كلما قرّب المستخدم من نهاية الصفحة
function addHomeBatch() {
  const box = $('#home-list');
  const first = homeShown === 0;
  if (homeShown >= homeL.length && !(first && homeS.length)) return;
  const end = Math.min(homeShown + homePage(), homeL.length);
  let html = '';
  if (first && homeS.length) html += shelfHTML(homeS.slice(0, 24)); // الشورتات أول شي، وتحتها الفيديوهات الطويلة
  for (let i = homeShown; i < end; i++) html += cardHTML(homeL[i]);
  homeShown = end;
  const w = document.createElement('div');
  w.style.display = 'contents';
  w.innerHTML = html;
  box.appendChild(w);
  fillThumbs(w);
}
$('#view-home').addEventListener('scroll', () => {
  if (homeShown >= homeL.length) return;
  const v = $('#view-home');
  if (v.scrollTop + v.clientHeight > v.scrollHeight - 900) addHomeBatch();
}, { passive: true });

/* ================= يوتيوب: مشغل مضمّن داخل sandbox ================= */
// الـ sandbox بدون allow-popups و allow-top-navigation: المتصفح نفسه يمنع المشغل من فتح يوتيوب أو أي صفحة ثانية
function ytParse(input) {
  const t = String(input || '').trim();
  if (/^[\w-]{11}$/.test(t)) return { id: t, short: false };
  let u; try { u = new URL(/^https?:\/\//i.test(t) ? t : 'https://' + t); } catch (e) { return null; }
  const h = u.hostname.replace(/^(www|m|music)\./, '');
  let id = '', short = false;
  if (h === 'youtu.be') id = u.pathname.split('/')[1] || '';
  else if (h === 'youtube.com' || h === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v') || '';
    else { const m = u.pathname.match(/^\/(shorts|embed|live|v)\/([\w-]{11})/); if (m) { id = m[2]; short = m[1] === 'shorts'; } }
  }
  id = (String(id).match(/^[\w-]{11}/) || [''])[0];
  return id ? { id, short } : null;
}
function ytURL(id, o) {
  const q = new URLSearchParams({
    autoplay: o.autoplay ? '1' : '0', controls: o.controls ? '1' : '0', fs: o.controls ? '1' : '0',
    rel: '0', loop: '1', playlist: id, playsinline: '1', iv_load_policy: '3', disablekb: '1',
    modestbranding: '1', enablejsapi: '1', hl: 'ar', cc_load_policy: '0'
  });
  if (/^https?:/.test(location.origin)) q.set('origin', location.origin);
  return 'https://www.youtube-nocookie.com/embed/' + id + '?' + q.toString();
}
function ytFrame(id, o) {
  const f = document.createElement('iframe');
  f.className = 'yt-frame' + (o.short ? ' sh' : '');
  f.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-presentation');
  f.setAttribute('allow', 'autoplay; encrypted-media; fullscreen');
  f.setAttribute('allowfullscreen', '');
  f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  f.setAttribute('title', 'فيديو');
  f.src = ytURL(id, o);
  return f;
}
let ytApiP = null;
function ytApi() {
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT);
  if (ytApiP) return ytApiP;
  ytApiP = new Promise((res, rej) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { try { if (prev) prev(); } catch (e) {} res(window.YT); };
    const sc = document.createElement('script');
    sc.src = 'https://www.youtube.com/iframe_api';
    sc.onerror = () => { ytApiP = null; rej(new Error('yt api')); };
    document.head.appendChild(sc);
    setTimeout(() => { if (!(window.YT && window.YT.Player)) { ytApiP = null; rej(new Error('yt api timeout')); } }, 20000);
  });
  return ytApiP;
}
const ytErrMsg = c => (c === 101 || c === 150 || c === 153) ? 'صاحب الفيديو ما يسمح بتشغيله هنا' : (c === 100 || c === 2) ? 'الفيديو غير متوفر' : 'تعذر تشغيل الفيديو';
// يربط المشغل بواجهة يوتيوب الرسمية: تكرار تلقائي، إيقاف، ورسالة إذا الفيديو ممنوع من التضمين
function ytAttach(frame, h) {
  const c = { p: null, dead: false };
  ytApi().then(YT => {
    if (c.dead) return;
    c.p = new YT.Player(frame, { events: {
      onReady: () => { if (h && h.onReady) h.onReady(); },
      onStateChange: e => {
        if (e.data === 0) { try { c.p.seekTo(0, true); c.p.playVideo(); } catch (x) {} }
        if (h && h.onState) h.onState(e.data);
      },
      onError: e => { if (h && h.onError) h.onError(e.data); }
    } });
  }).catch(() => {});
  const call = (fn, d) => { try { const r = c.p && c.p[fn] ? c.p[fn].apply(c.p, d.args || []) : undefined; return r === undefined ? d.def : r; } catch (e) { return d.def; } };
  c.pause = () => call('pauseVideo', {});
  c.play = () => call('playVideo', {});
  c.seek = t => call('seekTo', { args: [t, true] });
  c.getState = () => { const r = call('getPlayerState', { def: -1 }); return typeof r === 'number' ? r : -1; };
  c.getTime = () => +call('getCurrentTime', { def: 0 }) || 0;
  c.getDur = () => +call('getDuration', { def: 0 }) || 0;
  c.kill = () => { c.dead = true; try { if (c.p && c.p.destroy) c.p.destroy(); } catch (e) {} };
  return c;
}
// يستخرج كل روابط يوتيوب من نص (حتى لو ملتصقة ببعض أو وسط كلام): كل رابط يبدأ بـ http(s)://
function ytExtractAll(text) {
  const parts = String(text || '').split(/(?=https?:\/\/)/i);
  const items = [], seen = new Set();
  let total = 0, bad = 0;
  for (const part of parts) {
    if (!/^https?:\/\//i.test(part)) continue;
    total++;
    const tok = part.split(/[\s,;"'<>()\[\]{}|\\]/)[0];
    const p = ytParse(tok);
    if (!p) { bad++; continue; }
    if (seen.has(p.id)) continue;
    seen.add(p.id); items.push(p);
  }
  return { items, total, bad, dup: total - bad - items.length };
}
// يفتح الفيديو بمشغل مخفي لحظة حتى نعرف مدته وعنوانه (وإذا ممنوع التضمين أو غير متوفر يرجع err)
function ytMeta(id) {
  return new Promise(async res => {
    let YT; try { YT = await ytApi(); } catch (e) { return res({ err: 'api' }); }
    const f = ytFrame(id, { autoplay: false, controls: false });
    f.className = '';
    f.style.cssText = 'position:fixed;left:-400px;top:0;width:200px;height:113px;border:0;opacity:.02;pointer-events:none';
    document.body.appendChild(f);
    let p = null, done = false, iv = 0, to = 0;
    const last = { d: 0, t: '' };
    const finish = r => {
      if (done) return; done = true; clearInterval(iv); clearTimeout(to);
      try { if (p && p.destroy) p.destroy(); } catch (e) {}
      try { f.remove(); } catch (e) {}
      res(r);
    };
    to = setTimeout(() => finish({ dur: last.d, title: last.t, timeout: true }), 14000);
    try {
      p = new YT.Player(f, { events: {
        onReady: () => {
          try { p.mute(); p.playVideo(); } catch (e) {}
          iv = setInterval(() => {
            try {
              const d = p.getDuration(); if (d > 0) last.d = d;
              const vd = p.getVideoData && p.getVideoData(); if (vd && vd.title) last.t = vd.title;
            } catch (e) {}
            if (last.d > 0 && last.t) finish({ dur: last.d, title: last.t });
          }, 250);
        },
        onError: e => finish({ err: e.data })
      } });
    } catch (e) { finish({ err: 'init' }); }
  });
}
function ytThumb(id) {
  const base = 'https://i.ytimg.com/vi/' + id + '/';
  return new Promise(res => {
    const im = new Image();
    const t = setTimeout(() => res(base + 'mqdefault.jpg'), 4000);
    im.onload = () => { clearTimeout(t); res(im.naturalWidth >= 640 ? base + 'maxresdefault.jpg' : base + 'mqdefault.jpg'); };
    im.onerror = () => { clearTimeout(t); res(base + 'mqdefault.jpg'); };
    im.src = base + 'maxresdefault.jpg';
  });
}
async function ytTitle(id) {
  try {
    const ac = new AbortController(), t = setTimeout(() => ac.abort(), 4000);
    const r = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + id), { signal: ac.signal });
    clearTimeout(t);
    const j = await r.json();
    return (j && j.title) ? String(j.title).trim() : '';
  } catch (e) { return ''; }
}
// نخلّي مشغل يوتيوب يتصرف مثل <video> عادي، حتى تشتغل أزرارنا (تشغيل، شريط التقدم، تقديم 10 ثواني، المصغّر) بنفس الكود
function removeYtFacade() {
  const f = W.yf; if (!f) return;
  clearInterval(f.iv);
  ['paused', 'ended', 'duration', 'currentTime'].forEach(k => { try { delete W.vid[k]; } catch (e) {} });
  try { delete W.vid.play; delete W.vid.pause; } catch (e) {}
  W.yf = null;
}
function installYtFacade(ctl) {
  removeYtFacade();
  const vid = W.vid, st = { t: 0, at: 0, d: 0, s: -1 };
  const ev = n => vid.dispatchEvent(new Event(n));
  const def = (k, o) => Object.defineProperty(vid, k, Object.assign({ configurable: true }, o));
  def('paused', { get: () => !(st.s === 1 || st.s === 3) });
  def('ended', { get: () => false });
  def('duration', { get: () => (st.d > 0 ? st.d : NaN) });
  def('currentTime', {
    get: () => { const t = st.s === 1 ? st.t + (performance.now() - st.at) / 1000 : st.t; return st.d > 0 ? Math.min(t, st.d) : t; },
    set: v => { st.t = v; st.at = performance.now(); ctl.seek(v); }
  });
  vid.play = () => { ctl.play(); return Promise.resolve(); };
  vid.pause = () => { ctl.pause(); };
  const setS = s => {
    if (s === st.s) return;
    const was = st.s; st.s = s; st.at = performance.now();
    if (s === 1) { ev('play'); ev('playing'); }
    else if (s === 3) ev('waiting');
    else if (was === 1 || was === 3) ev('pause');
  };
  const iv = setInterval(() => {
    setS(ctl.getState());
    const d = ctl.getDur();
    if (d > 0 && d !== st.d) { st.d = d; ev('loadedmetadata'); ev('durationchange'); }
    st.t = ctl.getTime(); st.at = performance.now();
    ev('timeupdate');
  }, 250);
  W.yf = { st, iv, setS };
}
function dropYtFrame() {
  removeYtFacade();
  if (W.yt) { W.yt.kill(); W.yt = null; }
  const f = $('#yt-frame'); if (f) f.remove();
}
function stopYtWatch() { dropYtFrame(); $('#watch').classList.remove('yt'); }
// المشغل بدون أزرار يوتيوب، وفوقه أزرارنا وطبقة اللمس (سحب للأسفل، تقديم، إلخ) مثل فيديوهات الهاتف
function mountWatchYt(v) {
  dropYtFrame();
  const f = ytFrame(v.ytId, { autoplay: true, controls: false });
  f.id = 'yt-frame';
  W.player.insertBefore(f, W.ov);
  const ctl = ytAttach(f, {
    onError: c => { spin(false); toast(ytErrMsg(c)); },
    onState: s => { if (W.yf) W.yf.setS(s); }
  });
  W.yt = ctl;
  installYtFacade(ctl);
  spin(true); setTimeout(() => { if (W.yt === ctl) spin(false); }, 8000);
  showCtl(); updPlay(); updProg();
}
function openYtWatch(v, first, wasMini) {
  const old = W.url; W.url = null;
  W.cur = v;
  dropYtFrame();
  const vid = W.vid; vid.pause(); vid.removeAttribute('src'); vid.load();
  if (old) URL.revokeObjectURL(old);
  $('#watch').hidden = false;
  $('#watch').classList.add('yt');
  setMini(false);
  if (first || wasMini) history.pushState({ w: 1 }, '');
  fillWatchInfo(v);
  // إعلان الموقع (إن وجد) يخلص أولاً، وبعدها ينفتح مشغل يوتيوب (ما ننحط شي فوق المشغل وهو شغال)
  const ad = pickAd(v);
  if (ad) {
    W.ad = runAd(W.player, ad, {
      onBack: () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else closeWatch(); },
      onEnd: () => { W.ad = null; if (W.cur === v) mountWatchYt(v); }
    });
  } else mountWatchYt(v);
  addHistory(v.id);
  $('.watch-info').scrollTop = 0;
}
function mountShortYt(s) {
  if (s._yt) return;
  const v = state.byId.get(s.dataset.id); if (!v || !v.ytId) return;
  const f = ytFrame(v.ytId, { autoplay: true, controls: false, short: true });
  s.insertBefore(f, $('.yt-tap', s) || s.firstChild);
  s._ytf = f;
  const c = s._yt = ytAttach(f, { onError: code => toast(ytErrMsg(code)) });
  const bar = $('.s-prog i', s);
  clearInterval(s._ytIv);
  s._ytIv = setInterval(() => { const d = c.getDur(); if (d > 0 && bar) bar.style.width = (c.getTime() / d * 100) + '%'; }, 500);
}
function unmountShortYt(s) {
  clearInterval(s._ytIv);
  if (s._yt) { s._yt.kill(); s._yt = null; }
  if (s._ytf) { s._ytf.remove(); s._ytf = null; }
  const bar = $('.s-prog i', s); if (bar) bar.style.width = '0';
}
function toggleShortYt(s) {
  if (!s._yt) return;
  const fl = $('.s-flash', s), st = s._yt.getState();
  if (st === 1 || st === 3) { s._yt.pause(); fl.innerHTML = svg('pause'); } else { s._yt.play(); fl.innerHTML = svg('play'); }
  fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go');
}
// نفس قواعد يوتيوب بملف style.css، منسوخة هنا حتى تشتغل حتى لو الهاتف عنده نسخة قديمة من الستايل
function injectYtCss() {
  if (document.getElementById('yt-css')) return;
  const st = document.createElement('style'); st.id = 'yt-css';
  st.textContent = `
.yt-bar{display:none!important}
.yt-frame{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000;pointer-events:none}
#watch.yt #vid{display:none}
#watch.yt:not(.mini) .p-overlay,#watch.yt:not(.mini) #p-spin,#watch.yt:not(.mini) #p-skip{display:block}
#watch.yt .player{touch-action:none}
#watch.yt.mini .p-overlay{display:block;background:none}
#watch.yt.mini .p-overlay>*{display:none}
#watch.yt.mini #p-spin,#watch.yt.mini #p-skip{display:none}
.yt-tap{position:absolute;inset:0}
.short.yt video{display:none}
.short.yt .yt-frame.sh{inset:auto;left:50%;top:50%;width:auto;height:100%;aspect-ratio:9/16;transform:translate(-50%,-50%)}
.short.yt .s-shade,.short.yt .s-prog{display:block}
.short.yt .s-flash{display:grid}
.short.yt .s-actions{left:6px;right:auto;bottom:64px;top:auto;height:auto;flex-direction:column;justify-content:flex-start;align-items:center;gap:16px}
.short.yt .s-info{left:84px;right:12px;bottom:16px}
.short.yt .s-info p{margin-top:10px;-webkit-line-clamp:2}
.adm-card textarea{width:100%;background:#fff;border:1px solid var(--line);border-radius:10px;padding:11px 12px;margin:6px 0;outline:none;font:13px/1.5 monospace;color:var(--text);resize:vertical;-webkit-user-select:text;user-select:text}
.adm-card textarea:focus{border-color:var(--blue)}`;
  document.head.appendChild(st);
}
injectYtCss();

/* ================= الإعلانات ================= */
function adLogGet() {
  try {
    const o = JSON.parse(LS.get('adlog', '{}')) || {}, cut = Date.now() - 3600000;
    for (const k of Object.keys(o)) { o[k] = o[k].filter(t => t > cut); if (!o[k].length) delete o[k]; }
    return o;
  } catch (e) { return {}; }
}
function adLogAdd(id) { const o = adLogGet(); (o[id] = o[id] || []).push(Date.now()); LS.set('adlog', JSON.stringify(o)); }
const toMin = t => { const p = String(t || '0:0').split(':').map(Number); return (p[0] || 0) * 60 + (p[1] || 0); };
function inWindow(a, mins) {
  if (!a.useTime) return true;
  const f = toMin(a.from), t = toMin(a.to);
  if (f === t) return true;
  return f < t ? (mins >= f && mins < t) : (mins >= f || mins < t);
}
// يختار إعلان مناسب لهذا الفيديو (أي فيديو، حتى لو أقل من دقيقة)
function pickAd(v) {
  if (!v || !state.ads.length) return null;
  const d = new Date(), mins = d.getHours() * 60 + d.getMinutes(), log = adLogGet();
  const ok = state.ads.filter(a => a.enabled !== false
    && (a.target !== 'videos' || (a.videoIds || []).includes(v.id))
    && inWindow(a, mins)
    && (!a.perHour || (log[a.id] || []).length < a.perHour));
  if (!ok.length) return null;
  const w = a => (a.target === 'videos' ? 1 : 0) + (a.useTime ? 1 : 0); // الأكثر تخصيصاً له الأولوية
  const top = Math.max(...ok.map(w)), pool = ok.filter(a => w(a) === top);
  return pool[Math.floor(Math.random() * pool.length)];
}
async function getAdSrc(a) {
  if (a.hasBlob) {
    const b = await reqP(store('blobs').get('ad:' + a.id + ':video'));
    if (b) return { url: URL.createObjectURL(b), obj: true };
  }
  return { url: a.url, obj: false };
}
function runAd(box, ad, opt = {}) {
  const el = document.createElement('div');
  el.className = 'ad';
  el.innerHTML = `<video playsinline webkit-playsinline></video>
    ${opt.onBack ? `<button class="icon-btn ad-back" aria-label="رجوع">${svg('down')}</button>` : ''}
    <div class="ad-tag"><b>إعلان</b><span class="ad-left"></span></div>
    <button class="ad-skip" hidden></button>
    <div class="ad-info">
      <div class="avatar sm">${esc((ad.advertiser || ad.title || 'إ').trim()[0] || 'إ')}</div>
      <div class="ad-text"><b>${esc(ad.title)}</b><small>${esc([ad.advertiser, ad.desc].filter(Boolean).join(' • '))}</small></div>
      ${ad.noCta ? '' : `<span class="ad-cta">${esc(ad.cta || 'اعرف المزيد')}</span>`}
    </div>
    <div class="ad-prog"><i></i></div>`;
  el.addEventListener('click', e => e.stopPropagation());
  box.appendChild(el);
  const vd = $('video', el), skipBtn = $('.ad-skip', el), left = $('.ad-left', el), bar = $('.ad-prog i', el);
  const ctl = { done: false, res: null };
  const skipAfter = +ad.skip || 0;
  let guard, counted = false;
  const cleanup = () => {
    ctl.done = true; clearTimeout(guard);
    try { vd.pause(); vd.removeAttribute('src'); vd.load(); } catch (e) {}
    if (ctl.res && ctl.res.obj) URL.revokeObjectURL(ctl.res.url);
    el.remove();
  };
  const finish = () => { if (ctl.done) return; cleanup(); if (opt.onEnd) opt.onEnd(); };
  ctl.kill = () => { if (!ctl.done) cleanup(); };
  ctl.pause = () => { if (!ctl.done) vd.pause(); };
  ctl.resume = () => { if (!ctl.done) vd.play().catch(() => {}); };
  const tick = () => {
    const d = isFinite(vd.duration) ? vd.duration : 0, t = vd.currentTime || 0;
    if (d) { left.textContent = fmtDur(d - t); bar.style.width = (t / d * 100) + '%'; }
    if (skipAfter > 0) {
      const rem = Math.ceil(skipAfter - t);
      skipBtn.hidden = false;
      skipBtn.disabled = rem > 0;
      skipBtn.classList.toggle('ready', rem <= 0);
      skipBtn.textContent = rem > 0 ? 'تخطي بعد ' + rem : 'تخطي';
    }
  };
  vd.addEventListener('timeupdate', tick);
  vd.addEventListener('ended', finish);
  vd.addEventListener('error', () => { if (!ctl.done) finish(); });
  vd.addEventListener('playing', () => {
    clearTimeout(guard);
    if (!counted) { counted = true; if (!opt.preview) adLogAdd(ad.id); }
  });
  skipBtn.onclick = e => { e.stopPropagation(); if (!skipBtn.disabled) finish(); };
  if (opt.onBack) $('.ad-back', el).onclick = e => { e.stopPropagation(); opt.onBack(); };
  tick();
  (async () => {
    let r;
    try { r = await getAdSrc(ad); } catch (e) { return finish(); }
    if (ctl.done) { if (r.obj) URL.revokeObjectURL(r.url); return; }
    ctl.res = r;
    vd.muted = !!opt.muted;
    vd.src = r.url;
    guard = setTimeout(finish, 10000); // إذا الإعلان ما اشتغل، يكمل الفيديو عادي
    try { await vd.play(); }
    catch (e) {
      if (ctl.done) return;
      if (!vd.muted) { vd.muted = true; try { await vd.play(); } catch (e2) { finish(); } }
      else finish();
    }
  })();
  return ctl;
}

/* ================= Shorts ================= */
let activeShort = null;
const feed = $('#shorts-feed');

function attachShort(s) {
  if (s._p) return s._p;
  const tok = s._tok;
  s._p = (async () => {
    const v = state.byId.get(s.dataset.id); if (!v || v.ytId) return;
    const r = await getVideoSrc(v);
    if (s._tok !== tok || !s.isConnected) { if (r.obj) URL.revokeObjectURL(r.url); return; }
    s._res = r;
    const vd = $('video', s); vd.src = r.url; vd.load();
  })();
  return s._p;
}
function detachShort(s) {
  s._tok++; s._p = null;
  unmountShortYt(s);
  const vd = $('video', s); if (!vd) return;
  if (s._res) {
    vd.pause(); vd.removeAttribute('src'); vd.load();
    if (s._res.obj) URL.revokeObjectURL(s._res.url);
    s._res = null;
  }
}
function killShortAd(s) { if (s._ad) { s._ad.kill(); s._ad = null; } }
async function startShort(s) {
  if (s.classList.contains('yt')) {
    mountShortYt(s);
    clearTimeout(s._ht);
    s._ht = setTimeout(() => { if (activeShort === s) addHistory(s.dataset.id); }, 1500);
    return;
  }
  const vd = $('video', s);
  vd.muted = state.muted;
  try { await vd.play(); }
  catch (e) {
    if (!state.muted) { state.muted = true; vd.muted = true; try { await vd.play(); } catch (e2) {} }
  }
  clearTimeout(s._ht);
  s._ht = setTimeout(() => { if (activeShort === s) addHistory(s.dataset.id); }, 1500);
}
async function playShort(s) {
  activeShort = s;
  if (s._ad) { s._ad.resume(); return; }
  if (s._gating) return;
  if (!s._counted) {
    s._counted = true;
    if (gateShouldRun()) { s._gating = true; await runGate(state.byId.get(s.dataset.id)); s._gating = false; if (activeShort !== s) return; }
  }
  await attachShort(s);
  if (activeShort !== s || document.hidden) return;
  if (!s._adDone) {
    s._adDone = true;
    const ad = pickAd(state.byId.get(s.dataset.id));
    if (ad) {
      s._ad = runAd(s, ad, { muted: state.muted, onEnd: () => { s._ad = null; if (activeShort === s) startShort(s); } });
      return;
    }
  }
  startShort(s);
}
function pauseShorts() {
  $$('.short').forEach(killShortAd);
  $$('.short video').forEach(v => v.pause());
  $$('.short.yt').forEach(unmountShortYt);
  activeShort = null;
}
const loadObs = new IntersectionObserver(entries => {
  for (const e of entries) { if (e.isIntersecting) attachShort(e.target); else detachShort(e.target); }
}, { root: feed, rootMargin: KID() ? '30% 0px 30% 0px' : '100% 0px 100% 0px', threshold: 0 });
const playObs = new IntersectionObserver(entries => {
  for (const e of entries) {
    const s = e.target, vd = $('video', s);
    if (e.isIntersecting && e.intersectionRatio >= 0.6) {
      if (s._ad) { activeShort = s; continue; }
      if (activeShort === s && !vd.paused) continue;
      playShort(s);
      // قريب من النهاية؟ أضف دفعة جديدة بترتيب عشوائي حتى ما ينتهي
      if (!s.nextElementSibling || !s.nextElementSibling.nextElementSibling) appendShorts();
    } else {
      killShortAd(s);
      unmountShortYt(s);
      vd.pause();
      if (activeShort === s) activeShort = null;
    }
  }
}, { root: feed, threshold: [0, 0.6, 1] });

function addShort(v) {
  const s = document.createElement('section');
  const yt = !!v.ytId;
  s.className = 'short' + (yt ? ' yt' : ''); s.dataset.id = v.id; s._tok = 0;
  s.innerHTML = `<video playsinline webkit-playsinline loop preload="none"${yt ? ' hidden' : ''}></video>${yt ? '<div class="yt-tap"></div>' : ''}
      <div class="s-shade"></div>
      <div class="s-flash"></div>
      <div class="s-actions">
        <button class="s-btn" data-toggle="like">${svg('like')}<span>أعجبني</span></button>
        <button class="s-btn" data-toggle="dislike">${svg('dislike')}<span>لا يعجبني</span></button>
        <button class="s-btn">${svg('comment')}<span>تعليق</span></button>
        <button class="s-btn">${svg('share')}<span>مشاركة</span></button>
      </div>
      <div class="s-info">
        <div class="s-ch"><div class="avatar sm">${esc(chInitial())}</div><b>${esc(channel())}</b>
          <button class="sub-btn" data-toggle="sub" data-t-on="تم الاشتراك" data-t-off="اشترك">اشترك</button></div>
        <p>${esc(v.title)}</p>
      </div>
      <div class="s-prog"><i></i></div>`;
  feed.appendChild(s);
  loadObs.observe(s); playObs.observe(s);
  thumbURL(v).then(u => { if (u) { $('video', s).poster = u; if (yt) s.style.background = '#000 url("' + u + '") center / cover no-repeat'; } }).catch(() => {});
}
// ترتيب عشوائي في كل مرة تفتح Shorts (وإذا ضغطت على شورت معين يبدأ به)
function renderShorts(firstId) {
  $$('.short', feed).forEach(s => { killShortAd(s); detachShort(s); });
  loadObs.disconnect(); playObs.disconnect();
  activeShort = null;
  const all = shorts();
  if (!all.length) { feed.innerHTML = `<div class="empty">${logo(64)}<div>لا توجد Shorts</div></div>`; return; }
  let S = shuffle(all);
  if (firstId) { const i = S.findIndex(x => x.id === firstId); if (i > 0) S.unshift(S.splice(i, 1)[0]); }
  feed.innerHTML = '';
  S.forEach(addShort);
  feed.scrollTop = 0;
}
function appendShorts() {
  const all = shorts(); if (all.length < 2) return;
  const S = shuffle(all), last = feed.lastElementChild && feed.lastElementChild.dataset.id;
  if (S[0].id === last) S.push(S.shift());
  S.forEach(addShort);
}
feed.addEventListener('timeupdate', e => {
  const vd = e.target, s = vd.closest && vd.closest('.short');
  if (!s || !vd.duration || vd.closest('.ad')) return;
  $('.s-prog i', s).style.width = (vd.currentTime / vd.duration * 100) + '%';
}, true);
feed.addEventListener('loadedmetadata', e => {
  const vd = e.target;
  if (vd.tagName === 'VIDEO') fixDur(vd);
  if (vd.closest && vd.closest('.ad')) return;
  if (vd.videoWidth && vd.videoHeight) vd.classList.toggle('cover', vd.videoWidth / vd.videoHeight < 0.7);
}, true);
feed.addEventListener('error', e => {
  if (e.target && e.target.tagName === 'VIDEO' && !e.target.closest('.ad') && e.target.getAttribute('src')) toast('تعذر تشغيل الفيديو');
}, true);
feed.addEventListener('click', e => {
  if (e.target.closest('button')) return;
  const s = e.target.closest('.short'); if (!s) return;
  if (s.classList.contains('yt')) { toggleShortYt(s); return; }
  const vd = $('video', s), fl = $('.s-flash', s);
  // إذا المتصفح شغّله بدون صوت، أول ضغطة ترجع الصوت بدل الإيقاف
  if (state.muted || vd.muted) {
    state.muted = false; vd.muted = false;
    if (vd.paused) vd.play().catch(() => {});
    fl.innerHTML = svg('volume'); fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go');
    return;
  }
  if (vd.paused) { vd.play().catch(() => {}); fl.innerHTML = svg('play'); }
  else { vd.pause(); fl.innerHTML = svg('pause'); }
  fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go');
});
function goShort(id) { setTab('shorts', { first: id }); }
// زر الرجوع (بالأعلى يمين): يطلع من Shorts للرئيسية
$('#short-back').addEventListener('click', () => {
  if (history.state && history.state.s) history.back(); else setTab('home', { fromPop: true });
});

/* ================= أنت ================= */
function hcardHTML(v) {
  const sh = v.kind === 'short';
  return `<div class="hcard${sh ? ' vert' : ''}" ${sh ? 'data-short' : 'data-open'}="${v.id}">
    <div class="thumb"><img alt="" data-vid="${v.id}">${v.duration ? `<span class="dur">${fmtDur(v.duration)}</span>` : ''}</div>
    <h4>${esc(v.title)}</h4><p>${esc(channel())}</p></div>`;
}
async function renderYou() {
  const box = $('#you-box');
  let hist = [];
  try { hist = await reqP(store('history').getAll()); } catch (e) {}
  hist.sort((a, b) => b.ts - a.ts);
  const items = hist.map(h => state.byId.get(h.videoId)).filter(v => v && isVisible(v)).slice(0, 30);
  box.innerHTML = `
    <div class="you-head"><div class="avatar big">${svg('person')}</div><div><h2>أنت</h2><div class="w-meta">${esc(channel())}</div></div></div>
    <div class="sec-title"><h3>السجل</h3><span class="more">عرض الكل</span></div>
    ${items.length ? `<div class="hrow">${items.map(hcardHTML).join('')}</div>` : `<div class="muted pad">لا يوجد سجل مشاهدة بعد</div>`}
    <div class="menu">${[['playlist', 'قوائم التشغيل'], ['library', 'فيديوهاتك'], ['download', 'التنزيلات'], ['clock', 'مشاهدة لاحقًا']]
      .map(([i, t]) => `<div class="menu-row">${svg(i)}<span>${t}</span></div>`).join('')}</div>`;
  fillThumbs(box);
}

/* ================= صفحة المشاهدة ================= */
const W = { vid: $('#vid'), ov: $('#p-ov'), player: $('#player'), cur: null, url: null, hideT: null, skT: null, ad: null, yt: null, mini: false, skipPop: false };
function killWatchAd() { if (W.ad) { W.ad.kill(); W.ad = null; } }
let scrub = false;

async function openWatch(id) {
  const v = state.byId.get(id); if (!v || !isVisible(v)) return;
  if (gateShouldRun()) await runGate(v);
  const first = $('#watch').hidden, wasMini = W.mini;
  killWatchAd();
  pauseShorts();
  if (v.ytId) return openYtWatch(v, first, wasMini);
  stopYtWatch();
  let r;
  try { r = await getVideoSrc(v); } catch (e) { toast('تعذر فتح الفيديو'); return; }
  const old = W.url;
  W.url = r.obj ? r.url : null;
  W.cur = v;
  $('#watch').hidden = false;
  setMini(false);
  if (first || wasMini) history.pushState({ w: 1 }, '');
  W.vid.src = r.url; W.vid.load();
  if (old) URL.revokeObjectURL(old);
  fillWatchInfo(v);
  showCtl(); updPlay(); updProg();
  const ad = pickAd(v);
  if (ad) {
    W.ad = runAd(W.player, ad, {
      onBack: () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else closeWatch(); },
      onEnd: () => { W.ad = null; if (W.cur === v) W.vid.play().catch(() => {}); }
    });
  } else W.vid.play().catch(() => {});
  addHistory(id);
  $('.watch-info').scrollTop = 0;
}
function cleanupWatch() {
  if ($('#watch').hidden) return;
  killWatchAd();
  stopYtWatch();
  const vid = W.vid;
  vid.pause(); vid.removeAttribute('src'); vid.load();
  if (W.url) { URL.revokeObjectURL(W.url); W.url = null; }
  W.cur = null;
  setMini(false);
  $('#watch').hidden = true;
  clearTimeout(W.hideT);
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}
function closeWatch() {
  if ($('#watch').hidden) return;
  cleanupWatch();
  if (history.state && history.state.w) history.back();
}

/* ---- المشغل المصغّر (مثل يوتيوب): ينزل تحت ويكمل شغل ---- */
function setMini(on) {
  if (on === !!W.mini) return;
  W.mini = on;
  const w = $('#watch');
  w.classList.toggle('mini', on);
  w.style.transform = ''; w.style.opacity = ''; w.style.transition = '';
  document.body.classList.toggle('has-mini', on);
  if (on) {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    if (W.cur) $('#mini-title').textContent = W.cur.title;
  } else showCtl();
  updPlay(); updProg();
}
function minimizeWatch() {
  if ($('#watch').hidden || W.mini) return;
  if (history.state && history.state.w) {
    W.skipPop = true; setTimeout(() => { W.skipPop = false; }, 700);
    history.back();
  }
  setMini(true);
}
function expandWatch() {
  if (!W.mini) return;
  history.pushState({ w: 1 }, '');
  setMini(false);
}
// زر السهم / السحب للأسفل / زر الرجوع: يصغّر الفيديو. إذا كان إعلان يطلع نهائياً
function exitPlayer() {
  if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
  if (W.ad) { closeWatch(); return; }
  minimizeWatch();
}
$('#yt-back').addEventListener('click', e => { e.stopPropagation(); exitPlayer(); });
$('#mini-toggle').addEventListener('click', e => { e.stopPropagation(); togglePlay(); });
$('#mini-close').addEventListener('click', e => { e.stopPropagation(); closeWatch(); });
$('#watch').addEventListener('click', e => {
  if (!W.mini || e.target.closest('#mini-toggle, #mini-close')) return;
  expandWatch();
});

// سحب الإصبع للأسفل على المشغل أو على المعلومات (وهي بالأعلى) يصغّر الفيديو
(function () {
  const wEl = $('#watch');
  let sw = null;
  wEl.addEventListener('touchstart', e => {
    sw = null;
    if (W.mini || document.fullscreenElement || e.touches.length !== 1) return;
    if (e.target.closest('.seek, .w-actions, .ad-skip')) return;
    if (e.target.closest('.watch-info') && $('.watch-info').scrollTop > 0) return;
    const t = e.touches[0];
    sw = { x: t.clientX, y: t.clientY, dy: 0, on: false, t: Date.now() };
  }, { passive: true });
  wEl.addEventListener('touchmove', e => {
    if (!sw) return;
    const t = e.touches[0], dx = t.clientX - sw.x, dy = t.clientY - sw.y;
    if (!sw.on) {
      if (Math.abs(dy) < 8 && Math.abs(dx) < 8) return;
      if (dy > 0 && Math.abs(dy) > Math.abs(dx) * 1.2) sw.on = true; else { sw = null; return; }
    }
    if (e.cancelable) e.preventDefault();
    sw.dy = Math.max(0, dy);
    wEl.style.transition = 'none';
    wEl.style.transform = `translateY(${sw.dy * 0.9}px)`;
    wEl.style.opacity = String(Math.max(0.4, 1 - sw.dy / 500));
  }, { passive: false });
  const end = () => {
    if (!sw) return;
    const s0 = sw; sw = null;
    if (!s0.on) return;
    if (s0.dy > 110 || (s0.dy > 60 && Date.now() - s0.t < 250)) { exitPlayer(); wEl.style.transform = ''; wEl.style.opacity = ''; wEl.style.transition = ''; }
    else {
      wEl.style.transition = 'transform .18s, opacity .18s';
      wEl.style.transform = ''; wEl.style.opacity = '';
      setTimeout(() => { wEl.style.transition = ''; }, 220);
    }
  };
  wEl.addEventListener('touchend', end);
  wEl.addEventListener('touchcancel', end);
})();
function fillWatchInfo(v) {
  $('#w-title').textContent = v.title;
  $('#mini-title').textContent = v.title;
  $('#w-meta').textContent = [v.duration ? fmtDur(v.duration) : '', rel(v.created)].filter(Boolean).join(' • ');
  $('#w-av').textContent = chInitial();
  $('#w-chn').textContent = channel();
  $$('.watch-info [data-toggle].on').forEach(b => { b.classList.remove('on'); if (b.dataset.tOff) b.textContent = b.dataset.tOff; });
  const next = shuffle(longs().filter(x => x.id !== v.id));
  const box = $('#w-next');
  box.innerHTML = next.map(cardHTML).join('');
  fillThumbs(box);
}
function showCtl() {
  W.ov.classList.remove('hide');
  clearTimeout(W.hideT);
  if (!W.vid.paused && !scrub) W.hideT = setTimeout(() => W.ov.classList.add('hide'), 3000);
}
function updPlay() {
  const vid = W.vid;
  const ic = svg(vid.ended ? 'replay' : (vid.paused ? 'play' : 'pause'));
  $('#p-toggle').innerHTML = ic; $('#mini-toggle').innerHTML = ic;
  if (!vid.paused) showCtl();
}
function updProg() {
  const vid = W.vid, d = isFinite(vid.duration) ? vid.duration : 0, f = d ? vid.currentTime / d : 0;
  $('#seek-fill').style.width = (f * 100) + '%';
  $('#seek-knob').style.left = (f * 100) + '%';
  $('#mini-prog').style.width = (f * 100) + '%';
  $('#p-time').textContent = `${fmtDur(vid.currentTime)} / ${fmtDur(d)}`;
}
function spin(on) { $('#p-spin').hidden = !on; }
function skip(sec) {
  const vid = W.vid; if (!isFinite(vid.duration)) return;
  vid.currentTime = Math.min(vid.duration, Math.max(0, vid.currentTime + sec));
  updProg();
  const el = $('#p-skip');
  el.textContent = sec < 0 ? '‹‹  10' : '10  ››';
  el.className = sec < 0 ? 'L' : 'R';
  el.hidden = true; void el.offsetWidth; el.hidden = false;
  clearTimeout(W.skT); W.skT = setTimeout(() => { el.hidden = true; }, 650);
}
function togglePlay() {
  const vid = W.vid;
  if (vid.ended) vid.currentTime = 0;
  if (vid.paused) vid.play().catch(() => {}); else vid.pause();
}

['play', 'pause', 'ended'].forEach(ev => W.vid.addEventListener(ev, updPlay));
W.vid.addEventListener('timeupdate', updProg);
W.vid.addEventListener('loadedmetadata', () => { fixDur(W.vid); updProg(); });
W.vid.addEventListener('durationchange', updProg);
W.vid.addEventListener('waiting', () => spin(true));
['playing', 'canplay', 'pause', 'ended'].forEach(ev => W.vid.addEventListener(ev, () => spin(false)));
W.vid.addEventListener('error', () => { if (W.vid.getAttribute('src')) { spin(false); toast('تعذر تشغيل الفيديو'); } });

$('#p-toggle').addEventListener('click', e => { e.stopPropagation(); togglePlay(); showCtl(); });
$('#p-back').addEventListener('click', e => { e.stopPropagation(); exitPlayer(); });
$('#p-full').addEventListener('click', e => {
  e.stopPropagation();
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else if (W.player.requestFullscreen) { const p = W.player.requestFullscreen(); if (p && p.catch) p.catch(() => {}); }
});
document.addEventListener('fullscreenchange', () => {
  try {
    if (document.fullscreenElement) {
      if ((W.vid.videoWidth > W.vid.videoHeight || (W.cur && W.cur.ytId && W.cur.kind !== 'short')) && screen.orientation && screen.orientation.lock) {
        const p = screen.orientation.lock('landscape'); if (p && p.catch) p.catch(() => {});
      }
    } else if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock();
  } catch (e) {}
});

const seekEl = $('#seek');
function seekFrom(e) {
  const r = seekEl.getBoundingClientRect();
  const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
  if (isFinite(W.vid.duration)) { W.vid.currentTime = f * W.vid.duration; updProg(); }
}
seekEl.addEventListener('pointerdown', e => { scrub = true; try { seekEl.setPointerCapture(e.pointerId); } catch (x) {} seekFrom(e); showCtl(); e.stopPropagation(); });
seekEl.addEventListener('pointermove', e => { if (scrub) seekFrom(e); });
const endScrub = () => { scrub = false; showCtl(); };
seekEl.addEventListener('pointerup', endScrub);
seekEl.addEventListener('pointercancel', endScrub);

// بالشاشة الكاملة: سحب الإصبع للأسفل يطلّع من الشاشة الكاملة
(function () {
  let g = null;
  W.ov.addEventListener('touchstart', e => {
    g = (document.fullscreenElement && e.touches.length === 1 && !e.target.closest('.seek')) ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
  }, { passive: true });
  W.ov.addEventListener('touchend', e => {
    if (!g) return;
    const t = e.changedTouches[0], dy = t.clientY - g.y, dx = Math.abs(t.clientX - g.x);
    g = null;
    if (dy > 80 && dy > dx * 1.5 && document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, { passive: true });
})();

let lastTap = 0, tapT = null;
W.ov.addEventListener('click', e => {
  if (e.target.closest('button, .seek')) return;
  const now = Date.now(), r = W.ov.getBoundingClientRect(), x = (e.clientX - r.left) / r.width;
  if (now - lastTap < 300 && (x < 0.33 || x > 0.67)) {
    clearTimeout(tapT); lastTap = 0; skip(x < 0.33 ? -10 : 10); showCtl(); return;
  }
  lastTap = now; clearTimeout(tapT);
  tapT = setTimeout(() => {
    if (W.ov.classList.contains('hide')) showCtl();
    else if (!W.vid.paused) W.ov.classList.add('hide');
    else showCtl();
  }, 280);
});
(function loop() {
  if (!$('#watch').hidden && !W.vid.paused) updProg();
  requestAnimationFrame(loop);
})();

/* ================= التنقل ================= */
const NAV_ICO = { home: ['home', 'homeF'], shorts: ['shorts', 'shortsF'] };
function navIcons(t) {
  $$('#bottomnav [data-tab]').forEach(b => {
    const k = b.dataset.tab, ic = NAV_ICO[k];
    if (ic) $('.ni', b).innerHTML = svg(ic[k === t ? 1 : 0]);
  });
  const me = $('#nav-av'); me.textContent = chInitial(); me.classList.toggle('on', t === 'you');
}
function setTab(t, opt = {}) {
  const prev = state.tab;
  if (prev === t && t === 'home' && opt.refresh !== false) {
    reshuffleHome(); renderHome(); $('#view-home').scrollTo({ top: 0, behavior: 'smooth' });
  } else if (t === 'home' && prev !== 'home') {
    reshuffleHome(); renderHome(); $('#view-home').scrollTop = 0; // كل رجعة للرئيسية = ترتيب جديد
  }
  let replaced = false;
  if (t === 'shorts' && !$('#watch').hidden) {
    const hadW = history.state && history.state.w;
    cleanupWatch();
    if (hadW) { history.replaceState({ s: 1 }, ''); replaced = true; }
  }
  if (t === 'shorts' && prev !== 'shorts' && !replaced) history.pushState({ s: 1 }, '');
  else if (prev === 'shorts' && t !== 'shorts' && !opt.fromPop && history.state && history.state.s) {
    W.skipPop = true; setTimeout(() => { W.skipPop = false; }, 700);
    history.back();
  }
  state.tab = t;
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + t));
  $$('#bottomnav [data-tab]').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
  document.body.classList.toggle('on-shorts', t === 'shorts');
  navIcons(t);
  if (t !== 'shorts') pauseShorts();
  else if (prev !== 'shorts' || opt.first) renderShorts(opt.first);
  if (t === 'you') renderYou();
}
$$('#bottomnav [data-tab]').forEach(b => b.addEventListener('click', () => setTab(b.dataset.tab)));
$('#brand').addEventListener('click', e => {
  if (e.currentTarget._skipClick) { e.currentTarget._skipClick = false; return; }
  setTab('home');
});

$('#btn-search').addEventListener('click', () => { setTab('home', { refresh: false }); $('#searchbar').hidden = false; $('#q').focus(); });
$('#q-close').addEventListener('click', () => { $('#searchbar').hidden = true; $('#q').value = ''; state.query = ''; renderHome(); });
$('#q').addEventListener('input', e => { state.query = e.target.value; renderHome(); });

function toggleBtn(b) {
  const k = b.dataset.toggle, on = !b.classList.contains('on');
  b.classList.toggle('on', on);
  if (on && (k === 'like' || k === 'dislike')) {
    const other = b.parentElement.querySelector(`[data-toggle="${k === 'like' ? 'dislike' : 'like'}"]`);
    if (other) other.classList.remove('on');
  }
  if (b.dataset.tOn) b.textContent = on ? b.dataset.tOn : b.dataset.tOff;
}
document.addEventListener('click', e => {
  const o = e.target.closest('[data-open]');
  if (o) { openWatch(o.dataset.open); return; }
  const s = e.target.closest('[data-short]');
  if (s) { goShort(s.dataset.short); return; }
  const t = e.target.closest('[data-toggle]');
  if (t) toggleBtn(t);
});

window.addEventListener('popstate', () => {
  if (W.skipPop) { W.skipPop = false; return; }
  if (!$('#watch').hidden && !W.mini) { if (W.ad) cleanupWatch(); else setMini(true); } // زر الرجوع يصغّر الفيديو
  else if (!$('#admin').hidden) hideAdmin();
  else if (state.tab === 'shorts') setTab('home', { fromPop: true, refresh: false }); // الرجوع من Shorts يرجع للرئيسية
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { homeHiddenAt = Date.now(); W.vid.pause(); $$('.short video').forEach(v => v.pause()); $$('.short.yt').forEach(unmountShortYt); if (W.yt) W.yt.pause(); if (W.ad) W.ad.pause(); }
  else {
    if (state.tab === 'home' && $('#watch').hidden && !state.query && Date.now() - homeHiddenAt > 20000) { reshuffleHome(); renderHome(); $('#view-home').scrollTop = 0; }
    if (W.ad) W.ad.resume();
    else if (state.tab === 'shorts' && activeShort && $('#watch').hidden && !kidAd) playShort(activeShort);
  }
});

function refreshAll() {
  renderHome(); navIcons(state.tab);
  if (state.tab === 'shorts') renderShorts();
  if (state.tab === 'you') renderYou();
}

/* ================= فحص الفيديو + صورة مصغرة ================= */
function probeVideo(src, opt) {
  const o = Object.assign({ cors: false, thumb: true, max: 640, q: 0.82 }, opt);
  return new Promise(resolve => {
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
    if (o.cors) v.crossOrigin = 'anonymous';
    const out = { duration: 0, w: 0, h: 0, thumb: null };
    let done = false, drawn = false, seeked = false, to, kick;
    const finish = () => {
      if (done) return; done = true; clearTimeout(to); clearTimeout(kick);
      v.onerror = v.onloadedmetadata = v.onseeked = v.onloadeddata = v.onplaying = null;
      try { v.removeAttribute('src'); v.load(); } catch (e) {}
      resolve(out);
    };
    const draw = () => {
      if (drawn || done) return; drawn = true;
      try {
        const sc = Math.min(1, o.max / Math.max(v.videoWidth, v.videoHeight));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(v.videoWidth * sc));
        c.height = Math.max(1, Math.round(v.videoHeight * sc));
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
        c.toBlob(b => { out.thumb = b; finish(); }, 'image/jpeg', o.q);
      } catch (e) { finish(); }
    };
    to = setTimeout(finish, 15000);
    v.onerror = finish;
    v.onloadedmetadata = () => {
      out.duration = isFinite(v.duration) ? v.duration : 0;
      out.w = v.videoWidth; out.h = v.videoHeight;
      if (!o.thumb || !out.w) return finish();
      try { v.currentTime = o.at ? Math.min(30, (isFinite(v.duration) ? v.duration : 2) * o.at) : Math.min(1, (v.duration || 2) * 0.1); } catch (e) { return finish(); }
      // بعض الهواتف (iOS) ما تحمّل اللقطة إلا إذا شغّلنا الفيديو صامت لحظة
      kick = setTimeout(() => { if (!drawn) { const p = v.play(); if (p && p.catch) p.catch(() => {}); } }, 1500);
    };
    v.onseeked = () => { seeked = true; if (v.readyState >= 2) draw(); };
    v.onloadeddata = () => { if (seeked) draw(); };
    v.onplaying = () => { draw(); };
    v.src = src;
  });
}
const blobToDataURL = b => new Promise(res => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => res(''); r.readAsDataURL(b); });
// صورة مصغرة صغيرة تنحفظ بالسحابة (نص صغير بدل ملف)
async function smallThumb(blob, max = 320) {
  try {
    const url = URL.createObjectURL(blob);
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    URL.revokeObjectURL(url);
    const sc = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.width * sc)); c.height = Math.max(1, Math.round(img.height * sc));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.65);
  } catch (e) { return ''; }
}
// الفيديو المضغوط أحياناً يطلع بدون مدة (Infinity) فما يشتغل شريط التقديم. هاي تصلحها
function fixDur(vd) {
  if (vd.duration !== Infinity || vd._fixing) return;
  vd._fixing = true;
  const t0 = vd.currentTime || 0;
  const end = () => {
    if (vd.duration === Infinity) return;
    vd.removeEventListener('durationchange', end); clearTimeout(g); vd._fixing = false;
    try { vd.currentTime = t0; } catch (e) {}
  };
  const g = setTimeout(() => { vd.removeEventListener('durationchange', end); vd._fixing = false; }, 5000);
  vd.addEventListener('durationchange', end);
  try { vd.currentTime = 1e101; } catch (e) { end(); }
}

/* ================= ضغط الفيديو (أقوى ضغط) ================= */
// يعيد ترميز الفيديو على الهاتف نفسه: دقة 640 كحد أقصى، 24 إطار، 180 كيلوبت للصورة و32 للصوت
const CMP = { maxSide: 640, fps: 24, vbps: 180000, abps: 32000 };
function pickRecMime() {
  if (!window.MediaRecorder || !MediaRecorder.isTypeSupported) return '';
  const list = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1,mp4a.40.2', 'video/mp4',
    'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  return list.find(t => { try { return MediaRecorder.isTypeSupported(t); } catch (e) { return false; } }) || '';
}
const canCompress = () => !!(pickRecMime() && HTMLCanvasElement.prototype.captureStream && (window.AudioContext || window.webkitAudioContext));
// جلسة ضغط: تنفتح مرة وحدة من ضغطة الزر (حتى يسمح الهاتف بالصوت) وتنعاد لكل الفيديوهات
function makeCompressor() {
  const mime = pickRecMime();
  const AC = window.AudioContext || window.webkitAudioContext;
  const cv = document.createElement('canvas');
  if (!mime || !cv.captureStream || !AC) return null;
  const v = document.createElement('video');
  v.playsInline = true; v.preload = 'auto';
  v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
  v.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:.01;pointer-events:none;z-index:-1';
  document.body.appendChild(v);
  let ac = null, srcNode = null, wake = null, closed = false, cur = null;
  try { ac = new AC(); srcNode = ac.createMediaElementSource(v); if (ac.resume) ac.resume().catch(() => {}); }
  catch (e) { v.remove(); return null; }
  const getWake = async () => { try { if (navigator.wakeLock && !wake && !closed) { wake = await navigator.wakeLock.request('screen'); wake.onrelease = () => { wake = null; }; } } catch (e) {} };
  const onVis = () => {
    if (!cur || cur.done) return;
    try {
      if (document.hidden) { if (cur.rec && cur.rec.state === 'recording') cur.rec.pause(); }
      else { if (cur.rec && cur.rec.state === 'paused') cur.rec.resume(); v.play().catch(() => {}); getWake(); }
    } catch (e) {}
  };
  document.addEventListener('visibilitychange', onVis);

  function run(file, onProgress) {
    const job = { done: false, aborted: false, rec: null, tracks: [], wait: null, timer: 0, url: URL.createObjectURL(file), dest: null };
    cur = job;
    v.src = job.url;
    if (ac.state === 'suspended') ac.resume().catch(() => {});
    // تشغيل لحظي حتى يتفتح التشغيل بالصوت (الصوت يروح للتسجيل مو للسماعة)
    const unlock = v.play().then(() => { v.pause(); return true; }, () => false);
    const cleanup = () => {
      job.done = true; clearTimeout(job.timer);
      job.tracks.forEach(t => { try { t.stop(); } catch (e) {} });
      try { if (job.dest) srcNode.disconnect(job.dest); } catch (e) {}
      v.onended = v.onerror = v.onpause = v.onseeked = v.onloadedmetadata = null;
      try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) {}
      URL.revokeObjectURL(job.url);
      if (cur === job) cur = null;
    };
    job.abort = () => { job.aborted = true; if (job.wait) job.wait(); };
    const p = (async () => {
      try {
        if (!(await unlock)) throw new Error('play blocked');
        if (v.readyState < 1) await new Promise((res, rej) => { v.onloadedmetadata = res; v.onerror = rej; setTimeout(rej, 15000); });
        const W0 = v.videoWidth, H0 = v.videoHeight, dur = v.duration;
        if (!W0 || !H0 || !isFinite(dur) || !dur) throw new Error('bad video');
        const sc = Math.min(1, CMP.maxSide / Math.max(W0, H0));
        cv.width = Math.max(2, Math.round(W0 * sc / 2) * 2);
        cv.height = Math.max(2, Math.round(H0 * sc / 2) * 2);
        const ctx = cv.getContext('2d');
        job.dest = ac.createMediaStreamDestination();
        srcNode.connect(job.dest);
        job.tracks = cv.captureStream(CMP.fps).getVideoTracks().concat(job.dest.stream.getAudioTracks());
        await getWake();
        if (v.currentTime > 0) { v.currentTime = 0; await new Promise(r => { v.onseeked = r; setTimeout(r, 3000); }); }
        ctx.drawImage(v, 0, 0, cv.width, cv.height);
        const rec = job.rec = new MediaRecorder(new MediaStream(job.tracks), { mimeType: mime, videoBitsPerSecond: CMP.vbps, audioBitsPerSecond: CMP.abps });
        const chunks = [];
        rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
        const stopped = new Promise(r => { rec.onstop = r; });
        const draw = () => {
          if (job.done) return;
          ctx.drawImage(v, 0, 0, cv.width, cv.height);
          onProgress && onProgress(Math.min(1, v.currentTime / dur));
          if (v.requestVideoFrameCallback) v.requestVideoFrameCallback(draw); else requestAnimationFrame(draw);
        };
        rec.start(1000);
        await v.play();
        draw();
        await new Promise(res => {
          job.wait = res;
          v.onended = res; v.onerror = res;
          v.onpause = () => { if (!job.done && !v.ended && !document.hidden) setTimeout(() => { if (!job.done && !v.ended && !job.aborted) v.play().catch(() => {}); }, 300); };
          job.timer = setTimeout(res, dur * 2500 + 30000);
        });
        v.onpause = null;
        try { rec.requestData(); } catch (e) {}
        if (rec.state !== 'inactive') rec.stop();
        await stopped;
        cleanup();
        if (job.aborted) return null;
        const out = new Blob(chunks, { type: mime.split(';')[0] });
        return out.size > 1000 ? out : null;
      } catch (e) {
        console.warn('compress failed', e);
        try { if (job.rec && job.rec.state !== 'inactive') job.rec.stop(); } catch (x) {}
        cleanup();
        return null;
      }
    })();
    p.abort = job.abort;
    return p;
  }
  function close() {
    closed = true;
    document.removeEventListener('visibilitychange', onVis);
    try { v.pause(); v.removeAttribute('src'); v.load(); } catch (e) {}
    v.remove();
    if (ac) ac.close().catch(() => {});
    if (wake) wake.release().catch(() => {});
  }
  return { run, close };
}
// لازم تنستدعى مباشرة من ضغطة الزر (قبل أي await)
function compressVideo(file, onProgress) {
  const c = makeCompressor();
  if (!c) return Promise.resolve(null);
  return c.run(file, onProgress).finally(() => c.close());
}

async function downloadBlob(url, onProgress) {
  const res = await fetch(url, { mode: 'cors' });
  if (!res.ok) throw new Error('http ' + res.status);
  const total = +res.headers.get('content-length') || 0;
  const type = res.headers.get('content-type') || 'video/mp4';
  if (!res.body || !res.body.getReader) return await res.blob();
  const rd = res.body.getReader(), parts = []; let got = 0;
  for (;;) {
    const { done, value } = await rd.read();
    if (done) break;
    parts.push(value); got += value.length;
    onProgress(total ? `جاري التحميل ${Math.round(got / total * 100)}%` : `جاري التحميل ${Math.round(got / 1048576)} MB`);
  }
  return new Blob(parts, { type });
}

/* ================= الإدارة ================= */
const adm = {};
function resetAdm() {
  Object.assign(adm, { src: 'file', kind: 'long', kindTouched: false, file: null, thumbFile: null, probe: null, probing: null, busy: false });
}
resetAdm();

function openAdmin() {
  $('#admin').hidden = false;
  history.pushState({ a: 1 }, '');
  buildAdmin();
}
function hideAdmin() {
  $('#admin').hidden = true; $('#admin').innerHTML = '';
  if (seenRef) { seenRef.off(); seenRef = null; }
  clearInterval(seenT);
}
function closeAdmin() {
  if ($('#admin').hidden) return;
  hideAdmin();
  if (history.state && history.state.a) history.back();
}
function setStatus(t) { const s = $('#adm-status'); if (s) s.textContent = t || ''; }
function setSeg(id, v) { $$(`${id} button`).forEach(b => b.classList.toggle('on', b.dataset.v === v)); }

function buildAdmin() {
  resetAdm();
  const el = $('#admin');
  el.innerHTML = `
  <div class="adm-head"><button class="icon-btn" id="adm-close" aria-label="إغلاق" data-ico="close"></button><h2>الإدارة</h2></div>
  <div class="adm-body">
    <section class="adm-card" id="adm-ctl"></section>
    <section class="adm-card" id="adm-learn"></section>
    <section class="adm-card" id="adm-gform"></section>
    <section class="adm-card" id="adm-games"></section>
    <section class="adm-card" id="adm-batch">
      <h3>إضافة مجموعة فيديوهات (تلقائي)</h3>
      <div class="lbl">اختر الفيديوهات كلها مرة وحدة، والباقي ينسوي لحاله: ضغط، عنوان، صورة مصغرة، وحفظ على الهاتف. الفيديو دقيقة أو أقل يصير Short، وغيره فيديو طويل.</div>
      <label class="filebtn"><input type="file" id="bt-files" accept="video/*" multiple hidden><span id="bt-name">اختر الفيديوهات</span></label>
      <label class="chk" id="bt-cmp-row"><input type="checkbox" id="bt-cmp" checked><span>ضغط بأقوى درجة</span></label>
      <button class="primary" id="bt-go">ضغط ونشر</button>
      <div class="cmp" id="bt-prog" hidden>
        <div id="bt-line1"></div>
        <div class="cmp-bar" style="margin-top:8px"><i id="bt-bar"></i></div>
        <div class="cmp-note" id="bt-line2"></div>
        <div class="cmp-note">خلي الشاشة شغالة وابقى بهذي الصفحة لحد ما يخلص.</div>
        <button class="ghost danger" id="bt-stop" style="margin-top:10px">إيقاف</button>
      </div>
    </section>
    <section class="adm-card" id="adm-ytb">
      <h3>إضافة مجموعة روابط يوتيوب</h3>
      <div class="lbl">الصق الروابط (حتى لو كانت ملتصقة ببعض أو وسط كلام) أو اختر ملف نصي فيه الروابط. يستخرج كل رابط يبدأ بـ https ويحذف المكرر، ويجلب العنوان والصورة والمدة. دقيقة أو أقل يصير Short، وغيره فيديو طويل. الفيديو الممنوع تشغيله خارج يوتيوب يتخطاه.</div>
      <textarea id="ytb-text" dir="ltr" rows="5" placeholder="https://youtu.be/...&#10;https://www.youtube.com/watch?v=..."></textarea>
      <label class="filebtn"><input type="file" id="ytb-file" accept=".txt,.csv,.json,.md,.html,text/*" hidden><span id="ytb-file-name">أو اختر ملف نصي فيه الروابط</span></label>
      <div class="cmp-note" id="ytb-found"></div>
      <label class="chk" id="ytb-cloud-row"><input type="checkbox" id="ytb-cloud"><span>مشاركة بالسحابة (يظهر على كل الأجهزة)</span></label>
      <button class="primary" id="ytb-go">استخراج وإضافة</button>
      <div class="cmp" id="ytb-prog" hidden>
        <div id="ytb-line1"></div>
        <div class="cmp-bar" style="margin-top:8px"><i id="ytb-bar"></i></div>
        <div class="cmp-note" id="ytb-line2"></div>
        <div class="cmp-note">خلي الشاشة شغالة وابقى بهذي الصفحة لحد ما يخلص. يحتاج إنترنت.</div>
        <button class="ghost danger" id="ytb-stop" style="margin-top:10px">إيقاف</button>
      </div>
    </section>
    <section class="adm-card">
      <h3>إضافة فيديو</h3>
      <div class="seg" id="seg-src"><button class="on" data-v="file">ملف من الهاتف</button><button data-v="url">رابط</button><button data-v="yt">يوتيوب</button></div>
      <div id="src-file"><label class="filebtn"><input type="file" id="in-file" accept="video/*" hidden><span id="in-file-name">اختر فيديو</span></label></div>
      <div id="src-url" hidden>
        <input id="in-url" type="url" dir="ltr" placeholder="https://..." autocomplete="off">
        <label class="chk" id="in-cloud-row"><input type="checkbox" id="in-cloud"><span>مشاركة بالسحابة (يظهر على كل الأجهزة)</span></label>
        <label class="chk"><input type="checkbox" id="in-offline"><span>حفظ على الهاتف (يشتغل بدون إنترنت)</span></label>
      </div>
      <div id="src-yt" hidden>
        <input id="in-yt" type="url" dir="ltr" placeholder="رابط فيديو يوتيوب" autocomplete="off">
        <div class="lbl">الصورة المصغرة تنجلب تلقائياً، والعنوان إذا تركته فارغ ينجلب من يوتيوب (وإذا ما انجلب ينكتب عنوان للأطفال تلقائياً). الفيديو يشتغل بمشغل محمي ما يطلع منه الطفل لموقع يوتيوب، ويتكرر لما يخلص بدون فيديوهات مقترحة. يحتاج إنترنت.</div>
        <label class="chk" id="yt-cloud-row"><input type="checkbox" id="in-cloud-yt"><span>مشاركة بالسحابة (يظهر على كل الأجهزة)</span></label>
      </div>
      <input id="in-title" type="text" placeholder="العنوان" autocomplete="off">
      <div class="seg" id="seg-kind"><button class="on" data-v="long">فيديو طويل</button><button data-v="short">Short</button></div>
      <div id="thumb-box">
      <div class="lbl">الصورة المصغرة (اختياري، وإذا تركتها تنأخذ من الفيديو تلقائياً)</div>
      <label class="filebtn"><input type="file" id="in-thumb" accept="image/*" hidden><span id="in-thumb-name">اختر صورة من الهاتف</span></label>
      <input id="in-thumburl" type="url" dir="ltr" placeholder="أو رابط صورة" autocomplete="off">
      </div>
      <label class="chk" id="in-compress-row"><input type="checkbox" id="in-compress" checked><span>ضغط الفيديو بأقوى درجة (يوفر مساحة كبيرة)</span></label>
      <button class="primary" id="adm-add">إضافة</button>
      <div id="adm-status"></div>
      <div class="cmp" id="adm-cmp" hidden><div class="cmp-bar"><i id="adm-cmp-bar"></i></div>
        <div class="cmp-note">الضغط ياخذ نفس طول الفيديو تقريباً. خلي الشاشة شغالة ولا تطلع من الصفحة.</div></div>
    </section>
    <section class="adm-card"><h3 id="adm-count">الفيديوهات</h3><div id="adm-list"></div></section>
    <section class="adm-card" id="adm-adsform"></section>
    <section class="adm-card" id="adm-adslist"></section>
    <section class="adm-card">
      <h3>الإعدادات</h3>
      <div class="lbl">اسم القناة (يظهر تحت الفيديوهات)</div>
      <div class="row2"><input id="set-ch" type="text" value="${esc(channel())}"><button class="ghost" id="set-ch-ok">حفظ</button></div>
      <div class="lbl">رمز سري جديد</div>
      <div class="row2"><input id="set-code" type="password" inputmode="numeric" placeholder="الرمز الجديد"><button class="ghost" id="set-code-ok">حفظ</button></div>
      <div class="lbl">&nbsp;</div>
      <button class="ghost danger" id="set-hist">مسح سجل المشاهدة</button>
    </section>
  </div>`;
  injectIcons(el);
  renderAdminList();
  buildAdsAdmin(); renderAdsList(); buildCtl(); buildLearnAdmin();

  $('#adm-close').onclick = closeAdmin;
  const seg = (id, cb) => $(id).addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    setSeg(id, b.dataset.v); cb(b.dataset.v);
  });
  $('#in-cloud-row').hidden = !CL.ok;
  if (!canCompress()) { $('#in-compress').checked = false; $('#in-compress-row').hidden = true; }
  $('#in-cloud').onchange = e => { if (e.target.checked) $('#in-offline').checked = false; };
  $('#in-offline').onchange = e => { if (e.target.checked) $('#in-cloud').checked = false; };
  $('#yt-cloud-row').hidden = !CL.ok;
  seg('#seg-src', v => {
    adm.src = v; $('#src-file').hidden = v !== 'file'; $('#src-url').hidden = v !== 'url'; $('#src-yt').hidden = v !== 'yt';
    $('#thumb-box').hidden = v === 'yt'; $('#in-compress-row').hidden = v !== 'file' || !canCompress();
  });
  $('#in-yt').oninput = e => {
    const p = ytParse(e.target.value); if (!p) return;
    if (p.short) { adm.kind = 'short'; setSeg('#seg-kind', 'short'); }
    else if (!adm.kindTouched) { adm.kind = 'long'; setSeg('#seg-kind', 'long'); }
  };
  seg('#seg-kind', v => { adm.kind = v; adm.kindTouched = true; });

  $('#in-file').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    adm.file = f; $('#in-file-name').textContent = f.name;
    if (!$('#in-title').value) $('#in-title').value = f.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ');
    const u = URL.createObjectURL(f);
    adm.probe = null;
    adm.probing = probeVideo(u).then(p => {
      URL.revokeObjectURL(u); adm.probe = p;
      if (p.w && p.h && !adm.kindTouched) { adm.kind = p.h > p.w ? 'short' : 'long'; setSeg('#seg-kind', adm.kind); }
      return p;
    });
  };
  $('#in-thumb').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    adm.thumbFile = f; $('#in-thumb-name').textContent = f.name;
  };
  $('#adm-add').onclick = onAdd;
  $('#bt-files').onchange = e => {
    const n = e.target.files.length;
    $('#bt-name').textContent = n ? n + ' فيديو مختار' : 'اختر الفيديوهات';
  };
  if (!canCompress()) { $('#bt-cmp').checked = false; $('#bt-cmp-row').hidden = true; }
  $('#bt-go').onclick = () => {
    if (batch.running) return;
    const files = Array.from($('#bt-files').files || []).filter(f => !f.type || f.type.startsWith('video/'));
    if (!files.length) return toast('اختر فيديوهات أولاً');
    runBatch(files, $('#bt-cmp').checked);
  };
  $('#bt-stop').onclick = () => { if (batch.running) { batch.cancel = true; if (batch.job && batch.job.abort) batch.job.abort(); updateBatchUI(); } };
  updateBatchUI();
  const ytbScan = () => {
    const t = $('#ytb-text').value, r = ytExtractAll(t);
    $('#ytb-found').textContent = t.trim() ? `لقيت ${r.items.length} رابط يوتيوب صالح` + (r.dup ? ` • ${r.dup} مكرر` : '') + (r.bad ? ` • ${r.bad} غير صالح` : '') : '';
  };
  $('#ytb-text').oninput = ytbScan;
  $('#ytb-file').onchange = async e => {
    const f = e.target.files[0]; if (!f) return;
    $('#ytb-file-name').textContent = f.name;
    try { const t = await f.text(), box = $('#ytb-text'); box.value = (box.value.trim() ? box.value.trim() + '\n' : '') + t; ytbScan(); }
    catch (x) { toast('تعذر قراءة الملف'); }
  };
  $('#ytb-cloud-row').hidden = !CL.ok;
  $('#ytb-go').onclick = () => {
    if (ytb.running) return;
    const r = ytExtractAll($('#ytb-text').value);
    if (!r.items.length) return toast('ما لقيت روابط يوتيوب');
    runYtBatch(r, !!($('#ytb-cloud') && $('#ytb-cloud').checked));
  };
  $('#ytb-stop').onclick = () => { if (ytb.running) { ytb.cancel = true; updateYtbUI(); } };
  updateYtbUI();

  $('#set-ch-ok').onclick = () => {
    const v = $('#set-ch').value.trim(); if (!v) return;
    LS.set('channel', v); refreshAll(); toast('تم الحفظ');
  };
  $('#set-code-ok').onclick = () => {
    const v = $('#set-code').value.trim();
    if (v.length < 3) return toast('الرمز قصير (3 أرقام على الأقل)');
    LS.set('code', v); $('#set-code').value = ''; toast('تم تغيير الرمز');
  };
  $('#set-hist').onclick = async () => {
    if (!confirm('مسح سجل المشاهدة؟')) return;
    try { await reqP(store('history', 'readwrite').clear()); } catch (e) {}
    if (state.tab === 'you') renderYou();
    toast('تم المسح');
  };
}

/* ---- إدارة الإعلانات ---- */
let adf = {};
function buildAdsAdmin() {
  adf = { src: 'file', file: null, skip: 5, target: 'all', perHour: 2, busy: false };
  const box = $('#adm-adsform'); if (!box) return;
  const vids = state.all.length
    ? state.all.map(v => `<label class="chk"><input type="checkbox" value="${v.id}"><span>${esc(v.title)}</span></label>`).join('')
    : '<div class="muted">ما أضفت فيديوهات بعد</div>';
  box.innerHTML = `<h3>إضافة إعلان</h3>
    <div class="lbl">الإعلان يطلع قبل الفيديو (حتى لو الفيديو أقل من دقيقة)</div>
    <div class="seg" id="seg-ad-src"><button class="on" data-v="file">ملف من الهاتف</button><button data-v="url">رابط</button></div>
    <div id="ad-src-file"><label class="filebtn"><input type="file" id="ad-file" accept="video/*" hidden><span id="ad-file-name">اختر فيديو الإعلان</span></label></div>
    <div id="ad-src-url" hidden><input id="ad-url" type="url" dir="ltr" placeholder="https://..." autocomplete="off">
      ${CL.ok ? '<label class="chk"><input type="checkbox" id="ad-cloud"><span>مشاركة بالسحابة (يظهر على كل الأجهزة)</span></label>' : ''}</div>
    <input id="ad-title" type="text" placeholder="اسم الإعلان" autocomplete="off">
    <input id="ad-adv" type="text" placeholder="اسم المعلن (مثلاً: وقت النوم)" autocomplete="off">
    <input id="ad-desc" type="text" placeholder="تفاصيل قصيرة تظهر مع الإعلان" autocomplete="off">
    <input id="ad-cta" type="text" placeholder="نص الزر (مثلاً: اعرف المزيد)" autocomplete="off">
    <div class="lbl">زر التخطي</div>
    <div class="seg" id="seg-ad-skip"><button class="on" data-v="5">بعد 5 ث</button><button data-v="10">بعد 10 ث</button><button data-v="15">بعد 15 ث</button><button data-v="0">بدون تخطي</button></div>
    <div class="lbl">وين يظهر الإعلان؟</div>
    <div class="seg" id="seg-ad-target"><button class="on" data-v="all">عشوائي (أي فيديو)</button><button data-v="videos">فيديوهات محددة</button></div>
    <div id="ad-vids" class="vidpick" hidden>${vids}</div>
    <label class="chk"><input type="checkbox" id="ad-usetime"><span>يظهر بوقت محدد فقط</span></label>
    <div id="ad-times" class="row2" hidden><span>من</span><input id="ad-from" type="time" value="20:00"><span>إلى</span><input id="ad-to" type="time" value="23:00"></div>
    <div class="lbl">كم مرة يظهر بالساعة؟</div>
    <div class="seg" id="seg-ad-freq"><button data-v="1">1</button><button class="on" data-v="2">2</button><button data-v="3">3</button><button data-v="4">4</button><button data-v="0">بلا حد</button></div>
    <button class="primary" id="ad-add">إضافة الإعلان</button>
    <div id="ad-status"></div>`;
  const seg = (id, cb) => $(id).addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    setSeg(id, b.dataset.v); cb(b.dataset.v);
  });
  seg('#seg-ad-src', v => { adf.src = v; $('#ad-src-file').hidden = v !== 'file'; $('#ad-src-url').hidden = v !== 'url'; });
  seg('#seg-ad-skip', v => { adf.skip = +v; });
  seg('#seg-ad-target', v => { adf.target = v; $('#ad-vids').hidden = v !== 'videos'; });
  seg('#seg-ad-freq', v => { adf.perHour = +v; });
  $('#ad-usetime').onchange = e => { $('#ad-times').hidden = !e.target.checked; };
  $('#ad-file').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    adf.file = f; $('#ad-file-name').textContent = f.name;
    if (!$('#ad-title').value) $('#ad-title').value = f.name.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ');
  };
  $('#ad-add').onclick = onAddAd;
}

async function onAddAd() {
  if (adf.busy) return;
  const isFile = adf.src === 'file', url = $('#ad-url').value.trim(), title = $('#ad-title').value.trim();
  if (isFile && !adf.file) return toast('اختر فيديو الإعلان أولاً');
  if (!isFile && !/^https?:\/\//i.test(url)) return toast('اكتب رابط صحيح');
  if (!title) return toast('اكتب اسم الإعلان');
  let ids = [];
  if (adf.target === 'videos') {
    ids = $$('#ad-vids input:checked').map(i => i.value);
    if (!ids.length) return toast('اختر فيديو واحد على الأقل');
  }
  adf.busy = true; $('#ad-add').disabled = true;
  $('#ad-status').textContent = 'جاري الحفظ…';
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    const ad = {
      id: uid(), title, advertiser: $('#ad-adv').value.trim(), desc: $('#ad-desc').value.trim(), cta: $('#ad-cta').value.trim(),
      src: isFile ? 'file' : 'url', url: isFile ? '' : url, hasBlob: isFile, size: isFile ? adf.file.size : 0,
      skip: adf.skip, target: adf.target, videoIds: ids,
      useTime: $('#ad-usetime').checked, from: $('#ad-from').value || '20:00', to: $('#ad-to').value || '23:00',
      perHour: adf.perHour, enabled: true, created: Date.now()
    };
    if (!isFile && CL.ok && $('#ad-cloud') && $('#ad-cloud').checked) {
      await withTimeout(CL.db.ref('ads/' + ad.id).set(ad));
    } else {
      const tx = db.transaction(['ads', 'blobs'], 'readwrite');
      tx.objectStore('ads').put(ad);
      if (isFile) tx.objectStore('blobs').put(adf.file, 'ad:' + ad.id + ':video');
      await txDone(tx);
      await loadAds();
    }
    buildAdsAdmin(); renderAdsList();
    toast('تمت إضافة الإعلان ✓');
  } catch (e) {
    console.error(e);
    toast(e && e.name === 'QuotaExceededError' ? 'مساحة الهاتف ممتلئة' : 'صار خطأ، حاول مرة ثانية');
    adf.busy = false; const b = $('#ad-add'); if (b) b.disabled = false; setStatus(''); const st = $('#ad-status'); if (st) st.textContent = '';
  }
}

function adSummary(a) {
  const n = (a.videoIds || []).filter(id => state.byId.has(id)).length;
  return [
    a.target === 'videos' ? `على ${n} فيديو محدد` : 'عشوائي بأي فيديو',
    a.useTime ? `من ${a.from} إلى ${a.to}` : 'كل الأوقات',
    a.perHour ? `${a.perHour} بالساعة` : 'بلا حد بالساعة',
    a.skip ? `تخطي بعد ${a.skip} ث` : 'بدون تخطي'
  ].join(' • ');
}
function renderAdsList() {
  const box = $('#adm-adslist'); if (!box) return;
  box.innerHTML = `<h3>الإعلانات (${state.ads.length})</h3>` + (state.ads.length ? state.ads.map(a => `
    <div class="adrow${a.enabled === false ? ' off' : ''}" data-ad="${a.id}">
      <b>${esc(a.title)}</b>
      <small>${esc(adSummary(a))}${a.hasBlob ? ' • على الهاتف ' + fmtSize(a.size) : (a.cloud ? ' • سحابة' : ' • رابط')}</small>
      <div class="adact">
        <button class="ghost" data-a="prev">معاينة</button>
        <button class="ghost" data-a="tog">${a.enabled === false ? 'تشغيل' : 'إيقاف'}</button>
        <button class="ghost danger" data-a="del">حذف</button>
      </div>
    </div>`).join('') : '<div class="muted">ما أضفت أي إعلان بعد</div>');
  $$('.adrow', box).forEach(row => {
    const a = state.ads.find(x => x.id === row.dataset.ad); if (!a) return;
    $('[data-a="prev"]', row).onclick = () => previewAd(a);
    $('[data-a="tog"]', row).onclick = async () => {
      try {
        if (a.cloud) await withTimeout(CL.db.ref('ads/' + a.id + '/enabled').set(a.enabled === false));
        else { await reqP(store('ads', 'readwrite').put(Object.assign({}, a, { enabled: a.enabled === false }))); await loadAds(); renderAdsList(); }
      }
      catch (e) { toast('تعذر التعديل'); }
    };
    $('[data-a="del"]', row).onclick = async () => {
      if (!confirm(`حذف الإعلان "${a.title}"؟`)) return;
      try {
        if (a.cloud) { await withTimeout(CL.db.ref('ads/' + a.id).remove()); toast('تم الحذف'); }
        else {
          const tx = db.transaction(['ads', 'blobs'], 'readwrite');
          tx.objectStore('ads').delete(a.id); tx.objectStore('blobs').delete('ad:' + a.id + ':video');
          await txDone(tx); await loadAds(); renderAdsList(); toast('تم الحذف');
        }
      } catch (e) { toast('تعذر الحذف'); }
    };
  });
}
function previewAd(a) {
  const m = $('#modal'); m.hidden = false;
  m.innerHTML = `<div class="prev"><div class="prev-box" id="prev-box"></div><button class="primary" id="prev-close">إغلاق المعاينة</button></div>`;
  let ctl;
  const close = () => { if (ctl) ctl.kill(); m.hidden = true; m.innerHTML = ''; m.onclick = null; };
  m.onclick = e => { if (e.target === m) close(); };
  $('#prev-close').onclick = close;
  ctl = runAd($('#prev-box'), a, { preview: true, muted: false, onEnd: close });
}

function renderAdminList() {
  const box = $('#adm-list'); if (!box) return;
  $('#adm-count').textContent = `الفيديوهات (${state.all.length})`;
  if (!state.all.length) { box.innerHTML = '<div class="muted">ما أضفت أي فيديو بعد</div>'; return; }
  box.innerHTML = state.all.map(v => `
    <div class="arow" data-id="${v.id}">
      <div class="at${v.kind === 'short' ? ' vert' : ''}"><img alt="" data-vid="${v.id}"></div>
      <div class="ti"><b>${esc(v.title)}</b><small>${v.kind === 'short' ? 'Short' : 'طويل'}${v.duration ? ' • ' + fmtDur(v.duration) : ''}${v.hasBlob ? ' • على الهاتف ' + fmtSize(v.size) + (v.compressed ? ' (مضغوط)' : '') : (v.ytId ? ' • يوتيوب' + (v.cloud ? ' (سحابة)' : '') : (v.cloud ? ' • سحابة' : ' • رابط'))}</small></div>
      <button class="icon-btn danger" data-del="${v.id}" aria-label="حذف">${svg('trash')}</button>
    </div>`).join('');
  fillThumbs(box);
  $$('[data-del]', box).forEach(b => b.onclick = async () => {
    const v = state.byId.get(b.dataset.del); if (!v) return;
    if (!confirm(`حذف "${v.title}"؟`)) return;
    try {
      if (v.cloud) await withTimeout(CL.db.ref('videos/' + v.id).remove());
      else { await deleteVideo(v.id); await loadVideos(); }
      refreshAll(); renderAdminList(); renderAdsList(); toast('تم الحذف');
    }
    catch (e) { toast('تعذر الحذف'); }
  });
}

async function onAdd() {
  if (adm.busy) return;
  if (batch.running || ytb.running) return toast('الإضافة الجماعية شغالة، انتظر تخلص');
  const isYt = adm.src === 'yt';
  const isFile = adm.src === 'file';
  const url = $('#in-url').value.trim();
  let yp = null;
  if (isYt) { yp = ytParse($('#in-yt').value); if (!yp) return toast('اكتب رابط يوتيوب صحيح'); }
  else if (isFile && !adm.file) return toast('اختر فيديو أولاً');
  else if (!isFile && !/^https?:\/\//i.test(url)) return toast('اكتب رابط صحيح');
  adm.busy = true; $('#adm-add').disabled = true;
  try { await (isYt ? doAddYt(yp) : doAdd(isFile, url)); }
  catch (e) {
    console.error(e);
    toast(e && e.name === 'QuotaExceededError' ? 'مساحة الهاتف ممتلئة' : 'صار خطأ، حاول مرة ثانية');
    adm.busy = false; const b = $('#adm-add'); if (b) b.disabled = false; setStatus('');
  }
}

async function doAddYt(p) {
  const toCloud = CL.ok && $('#in-cloud-yt') && $('#in-cloud-yt').checked;
  setStatus('جاري جلب معلومات الفيديو…');
  let title = $('#in-title').value.trim();
  if (!title) title = await ytTitle(p.id);
  if (!title) title = kidTitle(new Set(state.all.map(v => v.title)));
  const thumbUrl = await ytThumb(p.id);
  const meta = {
    id: uid(), title, kind: p.short ? 'short' : adm.kind, src: 'yt', url: 'https://www.youtube.com/watch?v=' + p.id, ytId: p.id,
    hasBlob: false, thumbUrl, hasThumb: false, duration: 0, created: Date.now(), size: 0
  };
  setStatus('جاري الحفظ…');
  if (toCloud) await withTimeout(CL.db.ref('videos/' + meta.id).set(meta));
  else { await saveVideo(meta, {}); await loadVideos(); }
  refreshAll();
  buildAdmin();
  toast('تمت إضافة فيديو يوتيوب ✓');
}

async function doAdd(isFile, url) {
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  const toCloud = !isFile && CL.ok && $('#in-cloud') && $('#in-cloud').checked;
  const meta = {
    id: uid(), title: $('#in-title').value.trim() || 'بدون عنوان', kind: adm.kind,
    src: isFile ? 'file' : 'url', url: isFile ? '' : url, hasBlob: false,
    thumbUrl: '', hasThumb: false, duration: 0, created: Date.now(), size: 0
  };
  const blobs = {};
  let probe = null, doneMsg = 'تمت الإضافة ✓';
  // يبدأ الضغط فوراً داخل ضغطة الزر (قبل أي انتظار)
  const cmpJob = isFile && $('#in-compress') && $('#in-compress').checked
    ? compressVideo(adm.file, f => {
        setStatus('جاري ضغط الفيديو ' + Math.round(f * 100) + '%');
        const b = $('#adm-cmp-bar'); if (b) b.style.width = (f * 100) + '%';
      })
    : null;
  if (isFile) {
    setStatus(cmpJob ? 'جاري ضغط الفيديو…' : 'جاري تجهيز الفيديو…');
    probe = await adm.probing; if (!probe) probe = adm.probe;
    let vb = adm.file;
    if (cmpJob) {
      const box = $('#adm-cmp'); if (box) box.hidden = false;
      const out = await cmpJob;
      if (box) box.hidden = true;
      if (out && out.size < adm.file.size * 0.95) {
        vb = out; meta.compressed = true; meta.origSize = adm.file.size;
        doneMsg = `تمت الإضافة ✓ الحجم صار ${fmtSize(out.size)} بدل ${fmtSize(adm.file.size)}`;
      } else if (!out) toast('تعذر ضغط الفيديو على هذا الجهاز، انحفظ بحجمه الأصلي');
    }
    blobs.video = vb; meta.hasBlob = true; meta.size = vb.size;
  } else {
    if (!toCloud && $('#in-offline').checked) {
      try { const b = await downloadBlob(url, setStatus); blobs.video = b; meta.hasBlob = true; meta.size = b.size; }
      catch (e) { toast('ما كدرت أحمّل الفيديو على الهاتف، راح يشتغل بالإنترنت فقط'); }
    }
    setStatus('جاري فحص الفيديو…');
    if (meta.hasBlob) { const u = URL.createObjectURL(blobs.video); probe = await probeVideo(u); URL.revokeObjectURL(u); }
    else {
      probe = await probeVideo(url, { cors: true, max: toCloud ? 320 : 640, q: toCloud ? 0.65 : 0.82 });
      if (!probe.duration) probe = await probeVideo(url, { thumb: false });
    }
    if (probe && probe.w && probe.h && !adm.kindTouched) meta.kind = probe.h > probe.w ? 'short' : 'long';
  }
  if (probe) meta.duration = probe.duration || 0;
  const thumbUrl = $('#in-thumburl').value.trim();
  if (adm.thumbFile) {
    if (toCloud) meta.thumbUrl = await smallThumb(adm.thumbFile);
    else { blobs.thumb = adm.thumbFile; meta.hasThumb = true; }
  }
  else if (/^https?:\/\//i.test(thumbUrl)) meta.thumbUrl = thumbUrl;
  else if (probe && probe.thumb) {
    if (toCloud) meta.thumbUrl = await smallThumb(probe.thumb);
    else { blobs.thumb = probe.thumb; meta.hasThumb = true; }
  }

  setStatus('جاري الحفظ…');
  if (toCloud) await withTimeout(CL.db.ref('videos/' + meta.id).set(meta));
  else { await saveVideo(meta, blobs); await loadVideos(); }
  refreshAll();
  buildAdmin();
  toast(doneMsg);
}

/* ---- إضافة مجموعة فيديوهات تلقائياً ---- */
const batch = { running: false, cancel: false, job: null, i: 0, n: 0, frac: 0, name: '', ok: 0, fail: 0, orig: 0, now: 0, finished: false };
const KT_MAIN = ['أجمل أغاني الأطفال', 'كرتون الأطفال المفضل', 'فيلم كرتون جديد', 'أغنية الحروف للأطفال', 'أغنية الأرقام للأطفال',
  'قصة قبل النوم للأطفال', 'مغامرات الأرنب الصغير', 'رحلة الدب اللطيف', 'حفلة الحيوانات المرحة', 'سباق السيارات الصغيرة',
  'عالم الألوان السحري', 'أنشودة الأطفال الجميلة', 'الديناصور الصغير الشجاع', 'القطة المشاكسة', 'الفيل الصغير والأصدقاء',
  'رقصة الأطفال المرحة', 'أغنية الحيوانات', 'أغنية الألوان', 'حكاية الأميرة الصغيرة', 'بطل الغابة الشجاع', 'الفضائي الصغير',
  'سفينة القراصنة المرحة', 'مدينة الألعاب', 'مزرعة الأصدقاء', 'أغنية الصباح للأطفال', 'أغنية النوم الهادئة',
  'تعلّم العد مع الأصدقاء', 'تعلّم الحروف بالمرح', 'الشرطي الصغير', 'إطفائي الحي', 'الدلفين الذكي', 'الخروف الصغير',
  'مغامرة تحت البحر', 'جزيرة الكنز للأطفال', 'السيارة الطائرة', 'القطار السريع', 'أصدقاء الغابة', 'الروبوت الطيب', 'الحصان الأبيض', 'كتكوت صغير'];
const KT_TAIL = ['', '', ' | كرتون ممتع', ' | أغاني أطفال', ' | للأطفال', ' - حلقة جديدة', ' | فيلم كرتون كامل', ' | مرح وضحك', ' | أجمل الأناشيد', ' | رسوم متحركة'];
const KT_EMO = ['🎵', '🎶', '😍', '🥰', '😂', '🤩', '🌈', '⭐', '🎬', '🧸', '🐰', '🐻', '🦁', '🚗', '🚀', '🎈', '🍭', '🦄', '🐥', '🎉', '👶', '🐶', '🐱', '🦖', '🍿'];
const pick = a => a[Math.floor(Math.random() * a.length)];
function kidTitle(used) {
  for (let t = 0; t < 30; t++) {
    const e = [pick(KT_EMO), pick(KT_EMO)]; if (Math.random() < 0.5) e.push(pick(KT_EMO));
    const title = pick(KT_MAIN) + pick(KT_TAIL) + ' ' + Array.from(new Set(e)).join('');
    if (!used.has(title)) { used.add(title); return title; }
  }
  const title = pick(KT_MAIN) + ' ' + (used.size + 1) + ' ' + pick(KT_EMO); used.add(title); return title;
}
function updateBatchUI() {
  const box = $('#bt-prog'); if (!box) return;
  const go = $('#bt-go'); if (go) go.disabled = batch.running;
  box.hidden = !batch.running && !batch.finished;
  const l1 = $('#bt-line1'), l2 = $('#bt-line2'), bar = $('#bt-bar'), stop = $('#bt-stop');
  if (batch.running) {
    const pct = batch.n ? Math.min(100, ((batch.i + batch.frac) / batch.n) * 100) : 0;
    l1.textContent = batch.cancel ? 'جاري الإيقاف…' : `فيديو ${batch.i + 1} من ${batch.n} (${Math.round(batch.frac * 100)}%) — ${batch.name}`;
    bar.style.width = pct + '%';
    l2.textContent = `تمت إضافة ${batch.ok}` + (batch.fail ? ` • تعذر ${batch.fail}` : '') + (batch.orig > batch.now ? ` • وفّرنا ${fmtSize(batch.orig - batch.now)}` : '');
    stop.hidden = false;
  } else if (batch.finished) {
    l1.textContent = `خلصت: تمت إضافة ${batch.ok} من ${batch.n}` + (batch.fail ? ` • تعذر ${batch.fail}` : '');
    bar.style.width = '100%';
    l2.textContent = batch.orig > batch.now ? `الحجم قبل ${fmtSize(batch.orig)} وبعد ${fmtSize(batch.now)}` : '';
    stop.hidden = true;
  }
}
// تبدأ مباشرة من ضغطة الزر: أول فيديو يبدأ ضغطه قبل أي انتظار
async function runBatch(files, wantCmp) {
  Object.assign(batch, { running: true, cancel: false, job: null, i: 0, n: files.length, frac: 0, name: '', ok: 0, fail: 0, orig: 0, now: 0, finished: false });
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  const comp = wantCmp ? makeCompressor() : null;
  if (wantCmp && !comp) toast('هذا الجهاز ما يدعم الضغط، راح تنحفظ الفيديوهات بحجمها الأصلي');
  const used = new Set(state.all.map(v => v.title));
  let stopMsg = '';
  updateBatchUI();
  try {
    for (let i = 0; i < files.length && !batch.cancel; i++) {
      const file = files[i];
      Object.assign(batch, { i, frac: 0, name: file.name });
      updateBatchUI();
      const u = URL.createObjectURL(file);
      const job = comp ? comp.run(file, f => { batch.frac = f; updateBatchUI(); }) : null;
      batch.job = job;
      const probe = await probeVideo(u, { max: 480, q: 0.7, at: 0.2 });
      URL.revokeObjectURL(u);
      let vb = file, compressed = false;
      if (job) {
        const out = await job;
        batch.job = null;
        if (batch.cancel) break;
        if (out && out.size < file.size * 0.95) { vb = out; compressed = true; }
      }
      const dur = probe && probe.duration ? probe.duration : 0;
      const kind = dur ? (dur <= 60 ? 'short' : 'long') : (probe && probe.h > probe.w ? 'short' : 'long');
      const meta = {
        id: uid(), title: kidTitle(used), kind, src: 'file', url: '', hasBlob: true,
        thumbUrl: '', hasThumb: false, duration: dur, created: Date.now() + i, size: vb.size
      };
      if (compressed) { meta.compressed = true; meta.origSize = file.size; }
      const blobs = { video: vb };
      if (probe && probe.thumb) { blobs.thumb = probe.thumb; meta.hasThumb = true; }
      try { await saveVideo(meta, blobs); }
      catch (e) {
        console.error(e);
        if (e && e.name === 'QuotaExceededError') { stopMsg = 'مساحة الهاتف ممتلئة، توقفت الإضافة'; break; }
        batch.fail++; continue;
      }
      batch.ok++; batch.orig += file.size; batch.now += vb.size;
      await loadVideos(); refreshAll(); renderAdminList();
      updateBatchUI();
    }
  } catch (e) { console.error(e); stopMsg = 'صار خطأ وتوقفت الإضافة'; }
  if (comp) comp.close();
  batch.running = false; batch.finished = true; batch.job = null;
  const left = batch.n - batch.ok - batch.fail;
  updateBatchUI();
  const f = $('#bt-files'); if (f) { f.value = ''; const nm = $('#bt-name'); if (nm) nm.textContent = 'اختر الفيديوهات'; }
  toast(stopMsg || (batch.cancel ? `تم الإيقاف. انضافت ${batch.ok} فيديو` : `خلصت ✓ انضافت ${batch.ok} فيديو` + (batch.orig > batch.now ? ` ووفّرنا ${fmtSize(batch.orig - batch.now)}` : '')));
}

/* ---- إضافة مجموعة روابط يوتيوب ---- */
const ytb = { running: false, cancel: false, n: 0, done: 0, ok: 0, fail: 0, dup: 0, bad: 0, finished: false };
function updateYtbUI() {
  const box = $('#ytb-prog'); if (!box) return;
  const go = $('#ytb-go'); if (go) go.disabled = ytb.running;
  box.hidden = !ytb.running && !ytb.finished;
  const l1 = $('#ytb-line1'), l2 = $('#ytb-line2'), bar = $('#ytb-bar'), stop = $('#ytb-stop');
  const extra = (ytb.dup ? ` • مكرر/موجود ${ytb.dup}` : '') + (ytb.bad ? ` • غير صالح ${ytb.bad}` : '');
  if (ytb.running) {
    l1.textContent = ytb.cancel ? 'جاري الإيقاف…' : `جاري المعالجة: ${ytb.done} من ${ytb.n}`;
    bar.style.width = (ytb.n ? ytb.done / ytb.n * 100 : 0) + '%';
    l2.textContent = `تمت إضافة ${ytb.ok}` + (ytb.fail ? ` • تعذر ${ytb.fail} (ممنوع التضمين أو غير متوفر)` : '') + extra;
    stop.hidden = false;
  } else if (ytb.finished) {
    l1.textContent = `خلصت: تمت إضافة ${ytb.ok} من ${ytb.n}`;
    bar.style.width = (ytb.n ? ytb.done / ytb.n * 100 : 100) + '%';
    l2.textContent = (ytb.fail ? `تعذر ${ytb.fail} (ممنوع التضمين أو غير متوفر)` : '') + extra;
    stop.hidden = true;
  }
}
async function runYtBatch(ex, toCloud) {
  const have = new Set(state.all.map(v => v.ytId).filter(Boolean));
  const items = ex.items.filter(p => !have.has(p.id));
  Object.assign(ytb, { running: true, cancel: false, n: items.length, done: 0, ok: 0, fail: 0, dup: (ex.items.length - items.length) + ex.dup, bad: ex.bad, finished: false });
  if (!items.length) {
    ytb.running = false; ytb.finished = true; updateYtbUI();
    return toast('كل هذي الروابط موجودة من قبل');
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  let wake = null; try { if (navigator.wakeLock) wake = await navigator.wakeLock.request('screen'); } catch (e) {}
  const used = new Set(state.all.map(v => v.title));
  const pending = {};
  let next = 0, sinceRefresh = 0, stopMsg = '';
  const flush = async () => {
    const keys = Object.keys(pending); if (!keys.length) return;
    const o = {}; keys.forEach(k => { o[k] = pending[k]; delete pending[k]; });
    try { await withTimeout(CL.db.ref('videos').update(o)); }
    catch (e) { ytb.ok -= keys.length; ytb.fail += keys.length; stopMsg = 'تعذر الحفظ بالسحابة'; }
  };
  const refresh = async () => { await loadVideos(); refreshAll(); renderAdminList(); };
  updateYtbUI();
  const work = async () => {
    while (!ytb.cancel) {
      const i = next++; if (i >= items.length) break;
      const p = items[i];
      const m = await ytMeta(p.id);
      if (ytb.cancel) break;
      if (m.err) { ytb.fail++; ytb.done++; updateYtbUI(); continue; }
      const thumbUrl = await ytThumb(p.id);
      let title = (m.title || '').replace(/\s+/g, ' ').trim();
      if (!title) title = await ytTitle(p.id);
      title = (title || '').slice(0, 140);
      if (!title) title = kidTitle(used); else used.add(title);
      const dur = Math.round(m.dur || 0);
      const meta = {
        id: uid(), title, kind: dur ? (dur <= 60 ? 'short' : 'long') : (p.short ? 'short' : 'long'),
        src: 'yt', url: 'https://www.youtube.com/watch?v=' + p.id, ytId: p.id, hasBlob: false,
        thumbUrl, hasThumb: false, duration: dur, created: Date.now() + i, size: 0
      };
      try {
        if (toCloud) { pending[meta.id] = meta; ytb.ok++; if (Object.keys(pending).length >= 10) await flush(); }
        else { await saveVideo(meta, {}); ytb.ok++; if (++sinceRefresh >= 5) { sinceRefresh = 0; await refresh(); } }
      } catch (e) {
        console.error(e); ytb.fail++;
        if (e && e.name === 'QuotaExceededError') { stopMsg = 'مساحة الهاتف ممتلئة، توقفت الإضافة'; ytb.cancel = true; }
      }
      ytb.done++; updateYtbUI();
    }
  };
  try { await Promise.all(Array.from({ length: Math.min(3, items.length) }, work)); }
  catch (e) { console.error(e); stopMsg = 'صار خطأ وتوقفت الإضافة'; }
  try { await flush(); await refresh(); } catch (e) {}
  if (wake) wake.release().catch(() => {});
  ytb.running = false; ytb.finished = true;
  updateYtbUI();
  if (!ytb.cancel || stopMsg) { const t = $('#ytb-text'); if (t && !stopMsg) { t.value = ''; const fd = $('#ytb-found'); if (fd) fd.textContent = ''; } }
  toast(stopMsg || (ytb.cancel ? `تم الإيقاف. انضافت ${ytb.ok} فيديو` : `خلصت ✓ انضافت ${ytb.ok} فيديو يوتيوب` + (ytb.fail ? ` وتعذر ${ytb.fail}` : '')));
}

/* ================= لعبة التعلّم قبل الفيديو ================= */
// كل لعبة: سؤال + صورة صحيحة + صورة خطأ + جائزة اختيارية. بعد ما يخلص (فوز، غلط عدة مرات، أو تأخر) يطلع مربع الفيديو.
const LN = { local: { games: [], settings: {} }, cloud: { games: [], settings: {} }, games: [], cfg: {}, last: '' };
const LN_DEF = { everyN: 3, maxWrong: 3, idleMin: 3, name: '', praise: '' };
const KIDIMG = { point: 'kid-point.webp', happy: 'kid-happy.webp', clap: 'kid-clap.webp', angry: 'kid-angry.webp' };
const idbPut = (k, v) => { const tx = db.transaction('learn', 'readwrite'); tx.objectStore('learn').put(v, k); return txDone(tx); };
function learnMerge() {
  const m = new Map();
  (LN.cloud.games || []).forEach(g => m.set(g.id, Object.assign({}, g, { cloud: true })));
  (LN.local.games || []).forEach(g => { if (!m.has(g.id)) m.set(g.id, g); });
  LN.games = Array.from(m.values()).sort((a, b) => (a.created || 0) - (b.created || 0));
  LN.cfg = Object.assign({}, LN_DEF, LN.cloud.settings || {}, LN.local.settings || {});
}
async function learnLoad() {
  try {
    const l = await reqP(store('learn').get('local')); if (l) LN.local = { games: Array.isArray(l.games) ? l.games : [], settings: l.settings || {} };
    const c = await reqP(store('learn').get('cloud')); if (c) LN.cloud = { games: Array.isArray(c.games) ? c.games : [], settings: c.settings || {} };
  } catch (e) {}
  learnMerge();
  if (gateActive()) Object.values(KIDIMG).forEach(u => { const im = new Image(); im.src = u; });
}
const lnStat = () => lsJSON('lstat', {});
function lnMark(id, firstTry) {
  const st = lnStat(), x = st[id] || { r: 0, t: 0, k: 0 };
  x.t++; if (firstTry) { x.r++; x.k++; } else x.k = 0;
  st[id] = x; LS.set('lstat', JSON.stringify(st));
}
// الصوت: تسجيلاتك أولاً، وإذا ما اكو يستخدم نطق الجهاز
let lnAudio = null, lnAC = null;
function lnPlay(url, maxMs) {
  return new Promise(res => {
    try { if (lnAudio) lnAudio.pause(); } catch (e) {}
    if (!url) return res();
    const a = lnAudio = new Audio(url);
    let done = false;
    const fin = () => { if (done) return; done = true; clearTimeout(t); res(); };
    const t = setTimeout(fin, maxMs || 7000);
    a.onended = fin; a.onerror = fin; a.onpause = fin;
    const p = a.play(); if (p && p.catch) p.catch(fin);
  });
}
function lnSpeak(text) {
  return new Promise(res => {
    try {
      if (!text || !window.speechSynthesis) return res();
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text); u.lang = 'ar';
      u.onend = res; u.onerror = res; speechSynthesis.speak(u); setTimeout(res, 4000);
    } catch (e) { res(); }
  });
}
const lnSay = (url, text) => (url ? lnPlay(url) : lnSpeak(text));
function lnCtx() {
  try { lnAC = lnAC || new (window.AudioContext || window.webkitAudioContext)(); if (lnAC.state === 'suspended') lnAC.resume(); return lnAC; }
  catch (e) { return null; }
}
function lnClap() {
  const ac = lnCtx(); if (!ac) return;
  const len = Math.floor(ac.sampleRate * 0.07), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const t0 = ac.currentTime;
  for (let k = 0; k < 14; k++) {
    const src = ac.createBufferSource(); src.buffer = buf;
    const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1200 + Math.random() * 1800;
    const g = ac.createGain(); g.gain.value = 0.25 + Math.random() * 0.25;
    src.connect(f); f.connect(g); g.connect(ac.destination);
    src.start(t0 + k * 0.1 + Math.random() * 0.06);
  }
}
function lnBoop() {
  const ac = lnCtx(); if (!ac) return;
  const o = ac.createOscillator(), g = ac.createGain(), t = ac.currentTime;
  o.type = 'sine'; o.frequency.setValueAtTime(260, t); o.frequency.exponentialRampToValueAtTime(190, t + 0.18);
  g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
  o.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + 0.22);
}
const lnPlayable = g => !!(g && g.on !== false && g.right && g.wrong && g.right.img && g.wrong.img);
function lnPick() {
  const gs = LN.games.filter(lnPlayable); if (!gs.length) return null;
  const st = lnStat();
  const w = x => ((st[x.id] && st[x.id].k >= 4) ? 1 : 4) * (x.id === LN.last && gs.length > 1 ? 0.1 : 1);
  let r = Math.random() * gs.reduce((a, x) => a + w(x), 0), pick = gs[0];
  for (const x of gs) { r -= w(x); if (r <= 0) { pick = x; break; } }
  LN.last = pick.id;
  return pick;
}
const gateActive = () => (KID() || LS.get('gon', '0') === '1') && !(state.ctl && state.ctl.mode === 'locked');
const gateHasContent = () => LN.games.some(lnPlayable);
function gateShouldRun() {
  if (gateEl || !gateActive() || !gateHasContent()) return false;
  const n = LN.cfg.everyN | 0; if (n <= 0) return false;
  const c = +LS.get('gcnt', String(n));
  if (c >= n) return true;
  LS.set('gcnt', String(c + 1));
  return false;
}
let gateEl = null;
function lnPauseAll() {
  try {
    if (!$('#watch').hidden) { W.vid.pause(); if (W.yt) W.yt.pause(); }
    $$('.short video').forEach(v => v.pause());
    $$('.short.yt').forEach(unmountShortYt);
  } catch (e) {}
}
async function gateThumb(v) {
  if (!v) return '';
  try { const u = await thumbURL(v); if (u) return u; } catch (e) {}
  if (v.ytId) return 'https://i.ytimg.com/vi/' + v.ytId + '/hqdefault.jpg';
  return '';
}
const G_ARROW = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 3h6v9h4.5L12 21 4.5 12H9z"/></svg>';
const G_PLAY = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';
// v = الفيديو اللي راح يشتغل بعدها. forced = لعبة محددة (للمعاينة من لوحة التحكم)
function runGate(v, forced) {
  return new Promise(resolve => {
    if (gateEl) return resolve(false);
    const g = forced || lnPick();
    if (!g) return resolve(false);
    lnPauseAll();
    const c = LN.cfg, nm = (c.name || '').trim();
    const root = gateEl = document.createElement('div');
    root.id = 'gate'; root.className = 'gate';
    root.innerHTML = `<button class="g-skip" aria-label=""></button>
      <div class="g-head"><div class="g-kidw ga"><img class="g-kid" alt="" src="${KIDIMG.point}" data-k="point"></div>
      <div class="g-bub"><span class="g-txt"></span><button class="g-say" aria-label="سماع">${svg('volume')}</button></div></div>
      <div class="g-stage"></div>`;
    document.body.appendChild(root);
    const stage = $('.g-stage', root), txt = $('.g-txt', root), bub = $('.g-bub', root), kid = $('.g-kid', root);
    const timers = new Set();
    let idleIv = 0, done = false, phase = 'quiz', busy = false, sayNow = () => {}, lastAct = Date.now(), nudged = 0;
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!done) fn(); }, ms); timers.add(t); return t; };
    const clearT = t => { clearTimeout(t); timers.delete(t); };
    const stopSound = () => { try { if (lnAudio) lnAudio.pause(); if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) {} };
    const setKid = k => { if (kid.dataset.k === k) return; kid.dataset.k = k; kid.src = KIDIMG[k]; kid.classList.remove('pop'); void kid.offsetWidth; kid.classList.add('pop'); };
    const say = t => { txt.textContent = t; bub.classList.remove('pop'); void bub.offsetWidth; bub.classList.add('pop'); };
    const finish = r => {
      if (done) return; done = true;
      timers.forEach(clearTimeout); timers.clear(); clearInterval(idleIv); stopSound();
      root.remove(); gateEl = null;
      if (!forced) LS.set('gcnt', '0');
      resolve(r);
    };
    // زر مخفي للأهل: ضغطة مطولة بالزاوية العليا اليسرى + الرمز
    (() => {
      const sk = $('.g-skip', root); let t = 0;
      sk.addEventListener('pointerdown', () => { clearTimeout(t); t = setTimeout(() => askCode(() => finish('skip')), 1500); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => sk.addEventListener(ev, () => clearTimeout(t)));
    })();
    $('.g-say', root).onclick = e => { e.stopPropagation(); stopSound(); sayNow(); };

    /* ---- 1) السؤال ---- */
    const right = g.right, wrong = g.wrong;
    const askText = (g.text || '').trim() || `يلا${nm ? ' ' + nm : ''}، وين ${right.name || ''}؟`;
    const askVoice = () => lnSay(g.ask, askText);
    const opts = Math.random() < 0.5 ? [right, wrong] : [wrong, right];
    stage.innerHTML = `<div class="g-opts">${opts.map((it, i) => `<button class="g-opt" data-i="${i}"><span class="g-pic"><img alt="" src="${it.img}"></span><span class="g-name">${esc(it.name || '')}</span><i class="g-badge"></i></button>`).join('')}</div><div class="g-hand ga" hidden>👆</div>`;
    const btns = $$('.g-opt', stage), rBtn = btns[opts.indexOf(right)], wBtn = btns[opts.indexOf(wrong)], hand = $('.g-hand', stage);
    let nWrong = 0, hintT = 0;
    const showHand = () => {
      if (phase !== 'quiz') return;
      const r = $('.g-pic', rBtn).getBoundingClientRect(), s = stage.getBoundingClientRect();
      hand.style.left = (r.left - s.left + r.width / 2 - 30) + 'px';
      hand.style.top = (r.top - s.top + r.height / 2 - 6) + 'px';
      hand.hidden = false; rBtn.classList.add('hint'); setKid('point');
    };
    const armHint = ms => { clearT(hintT); hintT = later(showHand, ms); };
    sayNow = askVoice;
    say(askText); askVoice(); armHint(5000);

    root.addEventListener('pointerdown', () => { lastAct = Date.now(); if (phase === 'quiz' && kid.dataset.k === 'angry') setKid('point'); }, true);
    idleIv = setInterval(() => {
      if (done || phase !== 'quiz' || busy) return;
      const idle = Date.now() - lastAct;
      if (c.idleMin > 0 && idle >= c.idleMin * 60000) { lose(); return; }
      if (idle >= 30000 && Date.now() - nudged > 30000) {
        nudged = Date.now(); setKid('angry');
        later(() => { if (phase === 'quiz' && !busy) { setKid('point'); say(askText); askVoice(); showHand(); } }, 2500);
      }
    }, 1000);

    stage.addEventListener('click', async e => {
      const b = e.target.closest('.g-opt'); if (!b || busy || phase !== 'quiz') return;
      const it = opts[+b.dataset.i];
      clearT(hintT); stopSound();
      if (it === right) {
        busy = true; phase = 'win'; hand.hidden = true;
        rBtn.classList.remove('hint'); rBtn.classList.add('ok'); wBtn.classList.add('dim');
        if (!forced) lnMark(g.id, nWrong === 0);
        setKid('clap'); lnClap();
        await lnSay(right.voice, right.name);
        if (!done) party();
      } else {
        busy = true; nWrong++;
        b.classList.remove('shake', 'no'); void b.offsetWidth; b.classList.add('shake', 'no');
        later(() => b.classList.remove('no'), 1600);
        lnBoop();
        await lnSay(wrong.voice, wrong.name);
        if (done) return;
        if (c.maxWrong > 0 && nWrong >= c.maxWrong) { lose(); return; }
        busy = false;
        showHand(); say(askText); askVoice();
      }
    });

    /* ---- خسارة: غلط كثير أو تأخر — يشوف الجواب الصح بهدوء وبعدها الفيديو ---- */
    const lose = async () => {
      if (phase !== 'quiz') return;
      phase = 'lose'; busy = true; clearT(hintT); stopSound();
      if (!forced) lnMark(g.id, false);
      hand.hidden = true; rBtn.classList.remove('hint'); rBtn.classList.add('ok'); wBtn.classList.add('dim');
      setKid('point');
      const t = 'هذا ' + (right.name || '');
      say(t); sayNow = () => lnSay(right.voice, right.name);
      await lnSay(right.voice, right.name);
      if (!done) later(() => videoBox(false), 1500);
    };

    /* ---- 2) الفوز: عافية + تصفيق ---- */
    const party = () => {
      phase = 'party';
      setKid('happy');
      const t = 'عافية' + (nm ? ' ' + nm : '') + '!';
      say(t);
      const p = document.createElement('div'); p.className = 'g-conf-w';
      p.innerHTML = Array.from({ length: 14 }, (_, i) => `<i class="g-conf ga" style="left:${2 + i * 7}%;animation-delay:${(i % 5) * 0.2}s;font-size:${26 + (i % 3) * 9}px">${['⭐', '🎉', '✨', '🎈', '💛'][i % 5]}</i>`).join('');
      root.appendChild(p);
      lnClap(); later(lnClap, 1400);
      sayNow = () => lnSay(c.praise, t); sayNow();
      const rw = g.reward && (g.reward.prize || g.reward.place) ? g.reward : null;
      later(() => { p.remove(); rw ? reward(rw) : videoBox(true); }, 3600);
    };

    /* ---- 3) الجائزة (اختيارية) ---- */
    const reward = r => {
      phase = 'reward';
      const t = (r.text || '').trim() || 'روح جيب الجائزة!';
      say(t); setKid('point');
      const both = r.place && r.prize;
      stage.innerHTML = `<div class="g-rw${both ? '' : ' one'}">
        ${both ? `<div class="g-rwc"><span class="g-sq"><img alt="" src="${r.place}"></span></div><div class="g-arrow"><span class="ga">${G_ARROW}</span></div>` : ''}
        <div class="g-rwc prize"><span class="g-sq"><img alt="" src="${r.prize || r.place}"></span></div></div>
        <button class="g-next" hidden>التالي ◀</button>`;
      sayNow = () => lnSay(r.voice, t); sayNow();
      const nx = $('.g-next', stage);
      later(() => { nx.hidden = false; }, 4000);
      nx.onclick = () => videoBox(true);
    };

    /* ---- 4) مربع الفيديو: يضغط عليه ويشتغل الفيديو من البداية ---- */
    const videoBox = async won => {
      if (phase === 'video') return;
      phase = 'video'; stopSound();
      setKid(won ? 'happy' : 'point');
      say(v ? 'يلا نشوف الفيديو!' : 'انتهت المعاينة');
      sayNow = () => {}; $('.g-say', root).hidden = true;
      stage.innerHTML = `<button class="g-vid"><span class="g-thumb">${v ? '<img alt="" hidden>' : ''}<span class="g-play ga">${G_PLAY}</span></span><span class="g-vt">${v ? esc(v.title || '') : 'إغلاق'}</span></button>`;
      $('.g-vid', stage).onclick = () => finish(won ? 'won' : 'lost');
      if (v) {
        const u = await gateThumb(v), im = $('.g-thumb img', stage);
        if (im && u) { im.onload = () => { im.hidden = false; }; im.src = u; }
      }
    };
  });
}

/* ---- لوحة التحكم: بناء الألعاب ---- */
const lnMime = () => ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(t => { try { return window.MediaRecorder && MediaRecorder.isTypeSupported(t); } catch (e) { return false; } }) || '';
// حقل تسجيل صوت: تسجيل/إيقاف + سماع + حذف
function recField(box, label) {
  box.className = 'rec';
  box.innerHTML = `<div class="lbl">${label}</div><div class="rec-b"><button class="ghost rec-r" type="button">🎤 سجّل</button><button class="ghost rec-p" type="button" hidden>▶ سماع</button><button class="ghost rec-d danger" type="button" hidden>حذف</button></div><div class="cmp-note rec-s"></div>`;
  box._data = '';
  const r = $('.rec-r', box), pl = $('.rec-p', box), dl = $('.rec-d', box), st = $('.rec-s', box);
  let mr = null, stream = null, timer = 0;
  const show = () => { pl.hidden = dl.hidden = !box._data; st.textContent = box._data ? 'تم التسجيل ✓' : ''; r.textContent = box._data ? '🎤 سجّل من جديد' : '🎤 سجّل'; };
  box.get = () => box._data;
  box.set = v => { box._data = v || ''; show(); };
  r.onclick = async () => {
    if (mr && mr.state === 'recording') { mr.stop(); return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) return toast('التسجيل غير مدعوم بهذا المتصفح');
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { return toast('اسمح للموقع باستخدام المايكروفون'); }
    const mime = lnMime(), chunks = [];
    mr = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : { audioBitsPerSecond: 32000 });
    mr.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    mr.onstop = async () => {
      clearTimeout(timer); stream.getTracks().forEach(t => t.stop());
      const b = new Blob(chunks, { type: (mr.mimeType || mime || 'audio/webm').split(';')[0] });
      if (b.size < 600) { st.textContent = 'التسجيل قصير، جرب مرة ثانية'; r.textContent = '🎤 سجّل'; return; }
      box._data = await blobToDataURL(b); show();
    };
    mr.start(); r.textContent = '⏹ إيقاف'; st.textContent = 'جاري التسجيل… (أقصى 8 ثواني)';
    timer = setTimeout(() => { try { mr.stop(); } catch (e) {} }, 8000);
  };
  pl.onclick = () => lnPlay(box._data);
  dl.onclick = () => { box._data = ''; show(); };
  return box;
}
// تصغير الصورة وقصها مربع من الوسط (720 بكسل، واضحة وخفيفة)
function resizeImg(file, max) {
  return new Promise(res => {
    const u = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(u);
      const side = Math.min(im.width, im.height), out = Math.max(1, Math.min(max, side));
      const c = document.createElement('canvas'); c.width = c.height = out;
      const cx = c.getContext('2d'); cx.fillStyle = '#fff'; cx.fillRect(0, 0, out, out);
      cx.drawImage(im, (im.width - side) / 2, (im.height - side) / 2, side, side, 0, 0, out, out);
      res(c.toDataURL('image/jpeg', 0.8));
    };
    im.onerror = () => { URL.revokeObjectURL(u); res(''); };
    im.src = u;
  });
}
function imgField(box, label) {
  box.className = 'rec';
  box.innerHTML = `<div class="lbl">${label}</div><label class="filebtn"><input type="file" accept="image/*" hidden><span>📷 اختر صورة أو صوّر</span></label><img class="rec-img" alt="" hidden>`;
  box._data = '';
  const inp = $('input', box), im = $('.rec-img', box), sp = $('span', box);
  box.get = () => box._data;
  box.set = d => { box._data = d || ''; im.hidden = !box._data; if (box._data) im.src = box._data; inp.value = ''; sp.textContent = box._data ? '📷 تغيير الصورة' : '📷 اختر صورة أو صوّر'; };
  box.clear = () => box.set('');
  inp.onchange = async () => {
    const f = inp.files[0]; if (!f) return;
    sp.textContent = 'جاري التجهيز…';
    const d = await resizeImg(f, 720);
    if (!d) { box.set(box._data); return toast('تعذر قراءة الصورة'); }
    box.set(d);
  };
  return box;
}
function renderGames() {
  const el = $('#gm-list'); if (!el) return;
  const st = lnStat();
  el.innerHTML = LN.games.length ? LN.games.map(g => {
    const x = st[g.id], R = g.right || {}, Wr = g.wrong || {}, off = g.on === false;
    return `<div class="gm-row${off ? ' off' : ''}" data-id="${g.id}">
      <div class="gm-pics"><img class="r" alt="" src="${R.img || ''}"><img class="w" alt="" src="${Wr.img || ''}"></div>
      <div class="gm-ti"><b>${esc((g.text || '').trim() || ('وين ' + (R.name || '') + '؟'))}</b>
      <small>✅ ${esc(R.name || '')} • ❌ ${esc(Wr.name || '')}${g.reward ? ' • 🎁 جائزة' : ''}${g.cloud ? ' • سحابة' : ' • هذا الجهاز'}${x ? ` • صح من أول مرة ${x.r} من ${x.t}` : ''}${off ? ' • متوقفة' : ''}</small></div>
      <div class="gm-act"><button class="ghost" data-a="try">▶ جرّب</button><button class="ghost" data-a="tog">${off ? 'تشغيل' : 'إيقاف'}</button><button class="ghost" data-a="edit">✏️ تعديل</button><button class="icon-btn danger" data-a="del" aria-label="حذف">${svg('trash')}</button></div></div>`;
  }).join('') : '<div class="muted">ما سويت ألعاب بعد. سوّ أول لعبة من البطاقة اللي فوق.</div>';
}
async function learnSave(g, toCloud) {
  const clean = JSON.parse(JSON.stringify(g)); delete clean.cloud;
  if (toCloud && CL.ok) {
    await withTimeout(CL.db.ref('learn/games/' + clean.id).set(clean));
    LN.cloud.games = LN.cloud.games.filter(x => x.id !== clean.id).concat([clean]);
    if (LN.local.games.some(x => x.id === clean.id)) { LN.local.games = LN.local.games.filter(x => x.id !== clean.id); await idbPut('local', LN.local); }
  } else {
    LN.local.games = LN.local.games.filter(x => x.id !== clean.id).concat([clean]);
    await idbPut('local', LN.local);
  }
  learnMerge(); renderGames();
}
async function learnDel(id) {
  if (!confirm('حذف هذي اللعبة؟')) return;
  try {
    const g = LN.games.find(x => x.id === id);
    if (g && g.cloud) await withTimeout(CL.db.ref('learn/games/' + id).remove());
    LN.local.games = LN.local.games.filter(x => x.id !== id); await idbPut('local', LN.local);
    LN.cloud.games = LN.cloud.games.filter(x => x.id !== id);
    learnMerge(); renderGames(); toast('تم الحذف');
  } catch (e) { toast('تعذر الحذف'); }
}
function buildLearnAdmin() {
  const c1 = $('#adm-learn'), c2 = $('#adm-gform'), c3 = $('#adm-games');
  if (!c1 || !c2 || !c3) return;
  const cfg = LN.cfg;
  c1.innerHTML = `<h3>🎮 لعبة التعلّم قبل الفيديو</h3>
    <div class="lbl">قبل الفيديو تطلع لعبة: يسمع السؤال ويختار الصورة الصح. إذا فاز يسمع التشجيع (وجائزة إذا حطيتها)، وبعدها يطلع مربع الفيديو ويضغط عليه.</div>
    <label class="chk"><input type="checkbox" id="ln-on"><span>تشغيل اللعبة على هذا الجهاز (جهاز الطفل تشتغل عليه تلقائياً)</span></label>
    <div class="lbl">تطلع اللعبة كل كم فيديو؟ (0 = إيقاف)</div>
    <input id="ln-every" type="number" min="0" max="20" inputmode="numeric" value="${cfg.everyN}">
    <div class="lbl">بعد كم غلطة يطلع له الفيديو؟ (0 = بدون حد)</div>
    <input id="ln-wrong" type="number" min="0" max="10" inputmode="numeric" value="${cfg.maxWrong}">
    <div class="lbl">إذا ما لعب، بعد كم دقيقة يطلع له الفيديو؟ (0 = بدون حد)</div>
    <input id="ln-idle" type="number" min="0" max="30" inputmode="numeric" value="${cfg.idleMin}">
    <div class="lbl">اسم الطفل (يطلع بالفقاعة: «عافية محمد!»)</div>
    <input id="ln-name" type="text" value="${esc(cfg.name)}" placeholder="مثلاً: محمد" autocomplete="off">
    <div id="ln-praise"></div>
    <label class="chk" id="ln-cloud-row"><input type="checkbox" id="ln-cloud" checked><span>مشاركة بالسحابة (تظهر على جهاز الطفل)</span></label>
    <button class="primary" id="ln-save">حفظ الإعدادات</button>`;
  c2.innerHTML = `<h3 id="gf-title">➕ لعبة جديدة</h3>
    <div class="lbl">نص السؤال (يطلع بالفقاعة)</div>
    <input id="gf-text" type="text" placeholder="يلا محمد، وين الماي؟" autocomplete="off">
    <div id="gf-ask"></div>
    <div class="gf-box ok"><b>✅ الصورة الصحيحة (هي اللي يفوز بيها)</b>
      <input id="gf-rname" type="text" placeholder="اسمها (مثلاً: ماي)" autocomplete="off">
      <div id="gf-rimg"></div><div id="gf-rvoice"></div></div>
    <div class="gf-box no"><b>❌ الصورة الخطأ</b>
      <input id="gf-wname" type="text" placeholder="اسمها (مثلاً: حليب)" autocomplete="off">
      <div id="gf-wimg"></div><div id="gf-wvoice"></div></div>
    <label class="chk"><input type="checkbox" id="gf-rw"><span>🎁 جائزة بعد الفوز (اختياري)</span></label>
    <div class="gf-box rw" id="gf-rwbox" hidden><b>🎁 الجائزة</b>
      <input id="gf-rwtext" type="text" placeholder="النص: روح للثلاجة، اكو جيلاتين" autocomplete="off">
      <div id="gf-place"></div><div id="gf-prize"></div><div id="gf-rwvoice"></div></div>
    <div class="gf-btns"><button class="ghost" id="gf-try" type="button">▶ معاينة</button><button class="primary" id="gf-save" type="button">حفظ اللعبة</button></div>
    <button class="ghost" id="gf-cancel" type="button" hidden style="width:100%;margin-top:8px">إلغاء التعديل</button>`;
  c3.innerHTML = `<h3>🧩 ألعابك</h3><div id="gm-list"></div>`;

  $('#ln-on').checked = LS.get('gon', '0') === '1';
  const praise = recField($('#ln-praise'), 'صوتك بالتشجيع (مثل: «عافية محمد!»)'); praise.set(cfg.praise);
  if (!CL.ok) $('#ln-cloud-row').hidden = true;
  const share = () => !!(CL.ok && $('#ln-cloud').checked);
  const num = (id, max) => Math.max(0, Math.min(max, parseInt($(id).value, 10) || 0));
  $('#ln-save').onclick = async () => {
    const nc = { everyN: num('#ln-every', 20), maxWrong: num('#ln-wrong', 10), idleMin: num('#ln-idle', 30), name: $('#ln-name').value.trim(), praise: praise.get() };
    LS.set('gon', $('#ln-on').checked ? '1' : '0');
    try {
      LN.local.settings = nc; await idbPut('local', LN.local);
      if (share()) { await withTimeout(CL.db.ref('learn/settings').set(nc)); LN.cloud.settings = nc; }
      learnMerge(); toast('تم الحفظ ✓');
    } catch (e) { toast('تعذر الحفظ'); }
  };

  const ask = recField($('#gf-ask'), 'صوتك وأنت تسأل (مثل: «يلا محمد، وين الماي؟»)');
  const rIm = imgField($('#gf-rimg'), 'صورة الشيء الصحيح'), rV = recField($('#gf-rvoice'), 'صوتك وأنت تقول اسمه (مثل: «ماي ماي»)');
  const wIm = imgField($('#gf-wimg'), 'صورة الشيء الخطأ'), wV = recField($('#gf-wvoice'), 'صوتك وأنت تقول اسمه (مثل: «حليب حليب»)');
  const pPlace = imgField($('#gf-place'), 'صورة المكان (مثلاً الثلاجة)'), pPrize = imgField($('#gf-prize'), 'صورة الجائزة (مثلاً الجيلاتين)'), pV = recField($('#gf-rwvoice'), 'صوتك (مثل: «روح للثلاجة، اكو جيلاتين»)');
  let editId = null;
  const rwChk = $('#gf-rw');
  rwChk.onchange = () => { $('#gf-rwbox').hidden = !rwChk.checked; };
  const resetForm = () => {
    editId = null;
    ['#gf-text', '#gf-rname', '#gf-wname', '#gf-rwtext'].forEach(s => { $(s).value = ''; });
    [ask, rV, wV, pV].forEach(f => f.set('')); [rIm, wIm, pPlace, pPrize].forEach(f => f.clear());
    rwChk.checked = false; $('#gf-rwbox').hidden = true;
    $('#gf-title').textContent = '➕ لعبة جديدة'; $('#gf-cancel').hidden = true;
  };
  const gather = () => {
    const rn = $('#gf-rname').value.trim(), wn = $('#gf-wname').value.trim();
    if (!rIm.get() || !wIm.get()) { toast('اختر الصورة الصحيحة والصورة الخطأ'); return null; }
    if (!rn || !wn) { toast('اكتب اسم الصورتين'); return null; }
    const rwOn = rwChk.checked;
    if (rwOn && !pPrize.get() && !pPlace.get()) { toast('اختر صورة الجائزة'); return null; }
    const old = editId && LN.games.find(x => x.id === editId);
    return {
      id: editId || uid(), text: $('#gf-text').value.trim(), ask: ask.get(),
      right: { name: rn, img: rIm.get(), voice: rV.get() },
      wrong: { name: wn, img: wIm.get(), voice: wV.get() },
      reward: rwOn ? { text: $('#gf-rwtext').value.trim(), place: pPlace.get(), prize: pPrize.get(), voice: pV.get() } : null,
      on: old ? old.on !== false : true, created: old ? (old.created || Date.now()) : Date.now()
    };
  };
  $('#gf-try').onclick = () => { const g = gather(); if (g) runGate(null, g); };
  $('#gf-cancel').onclick = resetForm;
  $('#gf-save').onclick = async () => {
    const g = gather(); if (!g) return;
    const old = editId && LN.games.find(x => x.id === editId);
    const btn = $('#gf-save'); btn.disabled = true;
    try {
      await learnSave(g, old ? !!old.cloud : share());
      toast(old ? 'تم حفظ التعديل ✓' : 'تمت إضافة اللعبة ✓'); resetForm();
    } catch (e) { console.error(e); toast(e && e.name === 'QuotaExceededError' ? 'مساحة الهاتف ممتلئة' : 'تعذر الحفظ، تأكد من الإنترنت'); }
    btn.disabled = false;
  };
  $('#gm-list').onclick = async e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const g = LN.games.find(x => x.id === b.closest('.gm-row').dataset.id); if (!g) return;
    const a = b.dataset.a;
    if (a === 'try') runGate(null, g);
    else if (a === 'del') learnDel(g.id);
    else if (a === 'tog') {
      try { await learnSave(Object.assign({}, g, { on: g.on === false }), !!g.cloud); toast(g.on === false ? 'تم التشغيل' : 'تم الإيقاف'); }
      catch (err) { toast('تعذر الحفظ'); }
    } else if (a === 'edit') {
      resetForm(); editId = g.id;
      const R = g.right || {}, Wr = g.wrong || {}, rw = g.reward;
      $('#gf-text').value = g.text || ''; ask.set(g.ask);
      $('#gf-rname').value = R.name || ''; rIm.set(R.img); rV.set(R.voice);
      $('#gf-wname').value = Wr.name || ''; wIm.set(Wr.img); wV.set(Wr.voice);
      if (rw) { rwChk.checked = true; $('#gf-rwbox').hidden = false; $('#gf-rwtext').value = rw.text || ''; pPlace.set(rw.place); pPrize.set(rw.prize); pV.set(rw.voice); }
      $('#gf-title').textContent = '✏️ تعديل اللعبة'; $('#gf-cancel').hidden = false;
      c2.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  renderGames();
}
const GATE_CSS = `
.gate{--sh:0 7px 0 #b9d6ee,0 12px 22px rgba(30,60,120,.16);position:fixed;inset:0;z-index:35;display:flex;flex-direction:column;gap:12px;padding:max(10px,env(safe-area-inset-top)) 14px max(16px,env(safe-area-inset-bottom));direction:rtl;color:#1d2b4f;overflow:hidden;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;
 background:radial-gradient(circle at 10% 9%,#fff 0 34px,transparent 35px),radial-gradient(circle at 19% 7%,#fff 0 26px,transparent 27px),radial-gradient(circle at 88% 30%,#ffffffb0 0 30px,transparent 31px),radial-gradient(circle at 80% 31%,#ffffffb0 0 22px,transparent 23px),radial-gradient(ellipse 90% 34% at 50% 108%,#9be48f 0 99%,transparent 100%),linear-gradient(#9fdcff,#d9f2ff 46%,#fff6dc)}
.gate button{font-family:inherit;border:0;-webkit-tap-highlight-color:transparent}
.gate [hidden]{display:none!important}
.g-opt,.g-vid{color:#1d2b4f}
.g-skip{position:absolute;top:0;left:0;width:60px;height:60px;opacity:0;z-index:9;background:transparent}
.g-head{display:flex;direction:ltr;align-items:flex-end;gap:4px;height:clamp(130px,25vh,230px);flex:none}
.g-kidw{height:100%;flex:none;display:flex;align-items:flex-end}
.g-kid{height:100%;width:auto;display:block;filter:drop-shadow(0 6px 5px rgba(0,0,0,.18))}
.g-bub{position:relative;flex:1;align-self:center;background:#fff;border-radius:26px;padding:14px 14px 14px 60px;box-shadow:var(--sh);direction:rtl;display:flex;align-items:center;min-height:84px}
.g-bub::before{content:'';position:absolute;left:-13px;bottom:22px;border:13px solid transparent;border-right-color:#fff;border-left:0}
.g-txt{flex:1;font-size:clamp(21px,6vw,34px);font-weight:900;line-height:1.35;text-align:center}
.g-say{position:absolute;left:10px;top:50%;margin-top:-23px;width:46px;height:46px;border-radius:50%;background:#3ea6ff;color:#fff;display:grid;place-items:center;box-shadow:0 4px 0 #1f7fd1}
.g-say svg{width:28px;height:28px}
.g-stage{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
.g-opts{display:flex;flex-direction:column;gap:16px;width:100%;height:100%;max-width:620px}
.g-opt{position:relative;flex:1;min-height:0;display:flex;align-items:center;gap:12px;background:#fff;border-radius:28px;padding:10px;box-shadow:var(--sh)}
.g-opt:active{transform:translateY(3px)}
.g-pic{height:100%;aspect-ratio:1;max-width:64%;border-radius:20px;overflow:hidden;background:#f1f6fb;flex:none;display:block}
.g-pic img{width:100%;height:100%;object-fit:cover;display:block}
.g-name{flex:1;font-size:clamp(28px,8.5vw,48px);font-weight:900;text-align:center;line-height:1.2}
.g-opt.hint{box-shadow:0 0 0 6px #ffd43b,0 7px 0 #e0b200,0 12px 22px rgba(30,60,120,.16)}
.g-opt.ok{box-shadow:0 0 0 7px #2eb872,0 7px 0 #1f8f57,0 0 34px #7be0a8}
.g-opt.dim{opacity:.32}
.g-badge{position:absolute;top:-12px;left:-8px;width:54px;height:54px;border-radius:50%;display:none;place-items:center;font-size:30px;font-weight:900;color:#fff;font-style:normal;border:4px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.2);z-index:2}
.g-opt.ok .g-badge{display:grid;background:#2eb872}.g-opt.ok .g-badge::after{content:'✓'}
.g-opt.no .g-badge{display:grid;background:#ff5a5a}.g-opt.no .g-badge::after{content:'✕'}
.g-hand{position:absolute;font-size:66px;line-height:1;pointer-events:none;z-index:3;filter:drop-shadow(0 4px 4px rgba(0,0,0,.25))}
.g-conf-w{position:absolute;inset:0;pointer-events:none;z-index:6;overflow:hidden}
.g-conf{position:absolute;top:-70px;font-style:normal;line-height:1}
.g-rw{display:flex;flex-direction:column;align-items:center;gap:4px;width:100%;flex:1;min-height:0}
.g-rwc{flex:1;min-height:0;width:100%;display:flex;justify-content:center}
.g-sq{height:100%;aspect-ratio:1;max-width:100%;background:#fff;border-radius:28px;padding:8px;box-shadow:var(--sh);display:block;box-sizing:border-box}
.g-sq img{width:100%;height:100%;object-fit:cover;border-radius:20px;display:block}
.g-rwc.prize .g-sq{box-shadow:0 0 0 6px #ffd43b,0 7px 0 #e0b200,0 0 40px #ffe066}
.g-arrow{flex:none;width:52px;height:46px;color:#ff9f1c}
.g-arrow span{display:block;width:100%;height:100%}.g-arrow svg{width:100%;height:100%;display:block;filter:drop-shadow(0 3px 0 #d97a00)}
.g-next{flex:none;margin-top:14px;background:#ffc93c;color:#5a3b00;font-size:26px;font-weight:900;border-radius:40px;padding:12px 50px;box-shadow:0 6px 0 #d99a00}
.g-vid{width:100%;max-width:620px;background:#fff;border-radius:28px;padding:10px;box-shadow:var(--sh);display:flex;flex-direction:column;gap:8px}
.g-thumb{position:relative;display:block;width:100%;aspect-ratio:16/9;border-radius:20px;overflow:hidden;background:linear-gradient(135deg,#3ea6ff,#7b5cff)}
.g-thumb img{width:100%;height:100%;object-fit:cover;display:block}
.g-play{position:absolute;left:50%;top:50%;width:96px;height:96px;margin:-48px 0 0 -48px;border-radius:50%;background:#ff3b3b;color:#fff;display:grid;place-items:center;box-shadow:0 6px 0 #c41f1f,0 0 0 8px #ffffff90}
.g-play svg{width:54px;height:54px;margin-left:6px}
.g-vt{font-size:21px;font-weight:800;padding:2px 8px 6px;text-align:center;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
@media (orientation:landscape){
 .g-head{height:clamp(100px,26vh,190px)}
 .g-opts{flex-direction:row}.g-opt{flex-direction:column;gap:4px}
 .g-pic{height:auto;width:auto;flex:1;min-height:0;max-width:100%}
 .g-name{flex:none;font-size:30px}
 .g-rw{flex-direction:row;justify-content:center}.g-rwc{height:100%;width:auto;flex:1}
 .g-arrow{align-self:center;transform:rotate(90deg)}
}
#gate#gate .g-kidw.ga{animation:gbob 2.6s ease-in-out infinite!important}
#gate#gate .g-kid.pop{animation:gpop .45s ease-out!important}
#gate#gate .g-kid.pop[data-k="happy"]{animation:gpop .45s ease-out,gjump .9s ease-in-out .45s infinite!important}
#gate#gate .g-bub.pop{animation:gpop .35s ease-out!important}
#gate#gate .g-opt.hint{animation:gpulse 1.1s ease-in-out infinite!important}
#gate#gate .g-opt.shake{animation:gshake .45s!important}
#gate#gate .g-opt.ok{animation:gwin .6s ease-out!important}
#gate#gate .g-hand.ga{animation:gtap .9s ease-in-out infinite!important}
#gate#gate .g-conf.ga{animation:gfall 2.6s linear infinite!important}
#gate#gate .g-arrow .ga{animation:garrow 1s ease-in-out infinite!important}
#gate#gate .g-play.ga{animation:gpulse2 1.2s ease-in-out infinite!important}
@keyframes gbob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
@keyframes gpop{0%{transform:scale(.6)}70%{transform:scale(1.08)}100%{transform:scale(1)}}
@keyframes gjump{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
@keyframes gpulse{0%,100%{transform:scale(1)}50%{transform:scale(1.03)}}
@keyframes gpulse2{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}
@keyframes gwin{0%{transform:scale(1)}50%{transform:scale(1.06)}100%{transform:scale(1)}}
@keyframes gshake{20%{transform:translateX(-10px)}40%{transform:translateX(10px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}
@keyframes gtap{0%,100%{transform:translateY(0)}50%{transform:translateY(-20px)}}
@keyframes gfall{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(120vh) rotate(200deg)}}
@keyframes garrow{0%,100%{transform:translateY(-4px)}50%{transform:translateY(6px)}}
.rec{margin:6px 0}.rec-b{display:flex;gap:8px;flex-wrap:wrap;margin-top:4px}
.rec-img{width:110px;height:110px;object-fit:cover;border-radius:14px;margin-top:6px;display:block}
.rec-img[hidden]{display:none}
.gf-box{border:2px solid #ddd;border-radius:14px;padding:10px;margin:10px 0}
.gf-box>b{display:block;margin-bottom:6px}
.gf-box.ok{border-color:#2eb872;background:#f2fff7}.gf-box.no{border-color:#ff8a8a;background:#fff6f6}.gf-box.rw{border-color:#f5b400;background:#fffbea}
.gf-btns{display:flex;gap:8px;margin-top:8px}.gf-btns>button{flex:1}
.gm-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #eee;flex-wrap:wrap}
.gm-row.off{opacity:.5}
.gm-pics{display:flex;gap:4px;flex:none}
.gm-pics img{width:46px;height:46px;object-fit:cover;border-radius:10px;border:3px solid #2eb872}
.gm-pics img.w{border-color:#ff8a8a}
.gm-ti{flex:1;min-width:140px;display:flex;flex-direction:column;gap:2px}
.gm-ti small{color:#666}
.gm-act{display:flex;gap:6px;flex-wrap:wrap;width:100%}
.gm-act .ghost{padding:6px 12px}`;
(function () { if (!document.getElementById('gate-css')) { const st = document.createElement('style'); st.id = 'gate-css'; st.textContent = GATE_CSS; document.head.appendChild(st); } })();

/* ---- الدخول: ضغطة مطولة على الشعار ---- */
let lp = null;
const brand = $('#brand');
brand.addEventListener('pointerdown', () => { clearTimeout(lp); lp = setTimeout(() => { lp = null; brand._skipClick = true; askCode(); }, 1500); });
['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => brand.addEventListener(ev, () => clearTimeout(lp)));
brand.addEventListener('contextmenu', e => e.preventDefault());

function askCode(onOk) {
  const m = $('#modal');
  m.hidden = false;
  m.innerHTML = `<div class="dlg"><h3>الرمز السري</h3>
    <input id="code-in" type="password" inputmode="numeric" autocomplete="off">
    <div class="dlg-act"><button id="code-cancel">إلغاء</button><button class="primary" id="code-ok">دخول</button></div></div>`;
  const inp = $('#code-in'); inp.focus();
  const close = () => { m.hidden = true; m.innerHTML = ''; };
  const submit = () => {
    if (inp.value === LS.get('code', '1234')) { close(); if (typeof onOk === 'function') onOk(); else openAdmin(); }
    else { inp.value = ''; inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); toast('الرمز غير صحيح'); }
  };
  $('#code-ok').onclick = submit;
  $('#code-cancel').onclick = close;
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  m.onclick = e => { if (e.target === m) close(); };
}

/* ================= السحابة + التحكم عن بعد ================= */
let seenRef = null, seenT = null, seenTs = 0, beatT = null, kidAd = null, cloudWarned = false;

function sigIds() { return state.videos.map(v => v.id).join(','); }
function syncVideos() {
  const before = sigIds();
  rebuildVideos();
  if (before !== sigIds()) {
    refreshAll(); renderAdminList();
    if (W.cur && !isVisible(W.cur)) closeWatch();
  }
}
function cloudErr() { if (!cloudWarned) { cloudWarned = true; toast('تعذر الاتصال بالسحابة، تحقق من Rules بالـ Firebase'); } }

function startCloud() {
  if (!CL.ok) return;
  CL.db.ref('videos').on('value', snap => {
    const o = snap.val() || {};
    state.cloud = Object.keys(o).map(k => o[k]).filter(v => v && v.id && v.url);
    LS.set('cv', JSON.stringify(state.cloud));
    syncVideos(); renderAdminList(); if (typeof refreshCtlLists === 'function') refreshCtlLists();
  }, cloudErr);
  CL.db.ref('ads').on('value', snap => {
    const o = snap.val() || {};
    state.cloudAds = Object.keys(o).map(k => Object.assign({}, o[k], { cloud: true, hasBlob: false, videoIds: o[k].videoIds || [] }));
    LS.set('ca', JSON.stringify(state.cloudAds));
    rebuildAds(); renderAdsList(); if (typeof refreshCtlLists === 'function') refreshCtlLists();
  }, cloudErr);
  CL.db.ref('learn').on('value', snap => {
    const o = snap.val() || {};
    LN.cloud = { settings: o.settings || {}, games: Object.values(o.games || {}) };
    idbPut('cloud', LN.cloud).catch(() => {});
    learnMerge(); renderGames();
  }, cloudErr);
  CL.db.ref('control/kid').on('value', snap => {
    state.ctl = snap.val() || {};
    LS.set('cc', JSON.stringify(state.ctl));
    applyCtl(); onCtlUpdate();
  }, cloudErr);
  startBeat();
}

function startBeat() {
  stopBeat();
  if (!CL.ok || !KID()) return;
  const b = () => { try { CL.db.ref('control/kidSeen').set(CL.ts); } catch (e) {} };
  b(); beatT = setInterval(b, 20000);
}
function stopBeat() { clearInterval(beatT); beatT = null; }

// تطبيق أوامر الأب على جهاز الطفل
function applyCtl() {
  syncVideos();
  const locked = KID() && state.ctl.mode === 'locked';
  $('#lock').hidden = !locked;
  if (locked) { closeWatch(); pauseShorts(); killKidAd(); return; }
  handlePush();
}
function handlePush() {
  const p = state.ctl && state.ctl.push;
  if (!KID() || !p || !p.id || !p.url || p.id === LS.get('lastpush', '')) return;
  if (p.ts && (CL.now() - p.ts) / 1000 > 180) return; // أمر قديم، لا نعرضه
  LS.set('lastpush', p.id);
  showKidAd(p);
}
function killKidAd() { if (kidAd) { kidAd.kill(); if (kidAd._box) kidAd._box.remove(); kidAd = null; } }
// الإعلان ينبثق فوق كل شيء، والفيديو اللي يشوفه الطفل يتوقف لحد ما يخلص أو يتخطى
function showKidAd(p) {
  killKidAd();
  const box = document.createElement('div'); box.id = 'kidad'; document.body.appendChild(box);
  const watching = !$('#watch').hidden && !W.vid.paused;
  const sv = state.tab === 'shorts' && activeShort ? $('video', activeShort) : null;
  const shortPlaying = !!(sv && !sv.paused);
  const siteAd = W.ad;
  const ytShort = state.tab === 'shorts' && activeShort && activeShort.classList.contains('yt') ? activeShort : null;
  const ytW = !!W.yt && !$('#watch').hidden;
  if (ytShort) unmountShortYt(ytShort);
  if (ytW) W.yt.pause();
  W.vid.pause(); $$('.short video').forEach(v => v.pause());
  if (siteAd) siteAd.pause();
  const ad = { id: 'push-' + p.id, title: p.title || 'إعلان', advertiser: p.advertiser || '', desc: p.desc || '', url: p.url, skip: +p.skip || 0, noCta: true };
  const ctl = runAd(box, ad, {
    preview: true, muted: false,
    onEnd: () => {
      box.remove(); if (kidAd === ctl) kidAd = null;
      if (siteAd && W.ad === siteAd) siteAd.resume();
      else if (watching && W.cur) W.vid.play().catch(() => {});
      if (shortPlaying && sv) sv.play().catch(() => {});
      if (ytShort && activeShort === ytShort) startShort(ytShort);
      if (ytW && W.yt) W.yt.play();
    }
  });
  ctl._box = box; kidAd = ctl;
}

/* ---- لوحة تحكم الأب ---- */
function updCtlStatus() {
  const el = $('#ctl-seen'); if (!el) return;
  if (!seenTs) { el.textContent = 'جهاز الطفل: ما اتصل بعد (فعّل «هذا جهاز الطفل» على جهازه)'; return; }
  const local = seenTs - (CL.offset || 0);
  el.textContent = Date.now() - local < 60000 ? '🟢 جهاز الطفل متصل الآن' : '⚪ آخر ظهور لجهاز الطفل: ' + rel(local);
}
function cloudOptions() {
  const vids = state.cloud.filter(v => !v.ytId).sort((a, b) => b.created - a.created);
  const ads = state.cloudAds;
  return vids.map(v => `<option value="v:${esc(v.id)}">${esc(v.title)}</option>`).join('')
    + ads.map(a => `<option value="a:${esc(a.id)}">إعلان: ${esc(a.title)}</option>`).join('');
}
function refreshCtlLists() {
  const sel = $('#ctl-vid'), only = $('#ctl-only');
  if (sel) { const cur = sel.value; sel.innerHTML = cloudOptions(); if (cur) sel.value = cur; }
  if (only) {
    const al = (state.ctl && state.ctl.allowed) || {};
    only.innerHTML = state.cloud.length
      ? state.cloud.slice().sort((a, b) => b.created - a.created).map(v => `<label class="chk"><input type="checkbox" value="${esc(v.id)}"${al[v.id] ? ' checked' : ''}><span>${esc(v.title)}</span></label>`).join('')
      : '<div class="muted">أضف فيديوهات «بالسحابة» أولاً حتى تختارها</div>';
  }
}
function onCtlUpdate() {
  if (!$('#adm-ctl') || !$('#seg-mode')) return;
  const mode = state.ctl.mode || 'all';
  setSeg('#seg-mode', mode);
  $('#ctl-only').hidden = mode !== 'only';
  refreshCtlLists();
}
function buildCtl() {
  const box = $('#adm-ctl'); if (!box) return;
  if (!CL.ok) {
    box.innerHTML = '<h3>التحكم بجهاز الطفل</h3><div class="muted">السحابة غير متصلة. تحتاج إنترنت حتى تشتغل هذه الميزة.</div>';
    return;
  }
  const mode = state.ctl.mode || 'all';
  box.innerHTML = `<h3>التحكم بجهاز الطفل</h3>
    <div id="ctl-seen"></div>
    <div class="lbl">شنو يشوف الطفل؟</div>
    <div class="seg" id="seg-mode"><button data-v="all">كل المحتوى</button><button data-v="only">محتوى محدد</button><button data-v="locked">إيقاف الموقع</button></div>
    <div id="ctl-only" class="vidpick" hidden></div>
    <div class="lbl">إرسال فيديو كإعلان للطفل الآن</div>
    <select id="ctl-vid">${cloudOptions()}</select>
    <input id="ctl-title" type="text" placeholder="عنوان يظهر مع الإعلان (اختياري)" autocomplete="off">
    <div class="lbl">زر التخطي</div>
    <div class="seg" id="seg-push-skip"><button data-v="5">بعد 5 ث</button><button class="on" data-v="10">بعد 10 ث</button><button data-v="15">بعد 15 ث</button><button data-v="0">بدون تخطي</button></div>
    <button class="primary" id="ctl-send">أرسل الآن</button>
    <label class="chk"><input type="checkbox" id="ctl-iskid"><span>هذا الجهاز هو جهاز الطفل</span></label>`;
  setSeg('#seg-mode', mode);
  $('#ctl-only').hidden = mode !== 'only';
  refreshCtlLists();
  $('#ctl-iskid').checked = KID();
  let skip = 10;
  $('#seg-mode').addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    setSeg('#seg-mode', b.dataset.v); $('#ctl-only').hidden = b.dataset.v !== 'only';
    try { await withTimeout(CL.db.ref('control/kid/mode').set(b.dataset.v)); toast('تم'); } catch (x) { toast('تعذر الإرسال'); }
  });
  $('#ctl-only').addEventListener('change', async () => {
    const m = {};
    $$('#ctl-only input:checked').forEach(i => { m[i.value] = true; });
    try { await withTimeout(CL.db.ref('control/kid/allowed').set(Object.keys(m).length ? m : null)); } catch (x) { toast('تعذر الحفظ'); }
  });
  $('#seg-push-skip').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    setSeg('#seg-push-skip', b.dataset.v); skip = +b.dataset.v;
  });
  $('#ctl-send').onclick = async () => {
    const val = $('#ctl-vid').value;
    if (!val) return toast('اختر فيديو من السحابة أولاً');
    const item = val[0] === 'v' ? state.cloud.find(x => x.id === val.slice(2)) : state.cloudAds.find(x => x.id === val.slice(2));
    if (!item) return toast('الفيديو غير موجود');
    const title = $('#ctl-title').value.trim() || item.title || 'إعلان';
    try {
      await withTimeout(CL.db.ref('control/kid/push').set({ id: uid(), url: item.url, title, skip, ts: CL.ts }));
      toast('تم الإرسال لجهاز الطفل ✓');
    } catch (x) { toast('تعذر الإرسال'); }
  };
  $('#ctl-iskid').onchange = e => {
    LS.set('kid', e.target.checked ? '1' : '0'); applyLite();
    if (e.target.checked) startBeat(); else stopBeat();
    applyCtl(); refreshAll();
    toast(e.target.checked ? 'هذا الجهاز صار جهاز الطفل' : 'رجع جهاز عادي');
  };
  // حالة الاتصال
  if (seenRef) seenRef.off();
  seenRef = CL.db.ref('control/kidSeen');
  seenRef.on('value', s => { seenTs = s.val() || 0; updCtlStatus(); });
  clearInterval(seenT); seenT = setInterval(updCtlStatus, 5000);
  updCtlStatus();
}

// ضغطة مطولة على شعار شاشة الإيقاف تفتح الرمز السري
(function () {
  const lg = $('#lock-logo'); let t = null;
  lg.addEventListener('pointerdown', () => { clearTimeout(t); t = setTimeout(askCode, 1500); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => lg.addEventListener(ev, () => clearTimeout(t)));
})();

/* ================= التشغيل ================= */
async function init() {
  injectIcons();
  try { db = await openDB(); }
  catch (e) { $('#home-list').innerHTML = '<div class="empty">تعذر فتح التخزين</div>'; return; }
  applyLite();
  state.cloud = lsJSON('cv', []); state.cloudAds = lsJSON('ca', []); state.ctl = lsJSON('cc', {});
  await loadVideos();
  await loadAds();
  await learnLoad();
  $('#lock').hidden = !(KID() && state.ctl.mode === 'locked');
  renderHome(); navIcons('home');
  startCloud();
  ensureThumbs();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
init();

})();
