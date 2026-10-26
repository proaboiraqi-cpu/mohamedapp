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
    const r = indexedDB.open('utyub', 2);
    r.onupgradeneeded = () => {
      const d = r.result, has = n => d.objectStoreNames.contains(n);
      if (!has('videos')) d.createObjectStore('videos', { keyPath: 'id' });
      if (!has('blobs')) d.createObjectStore('blobs');
      if (!has('history')) d.createObjectStore('history', { keyPath: 'videoId' });
      if (!has('ads')) d.createObjectStore('ads', { keyPath: 'id' });
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

const state = { videos: [], byId: new Map(), ads: [], tab: 'home', query: '', muted: false };
function shuffle(a) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
const homeRank = new Map();
const rank = id => { if (!homeRank.has(id)) homeRank.set(id, Math.random()); return homeRank.get(id); };
const byRank = arr => arr.slice().sort((a, b) => rank(a.id) - rank(b.id));
const longs = () => state.videos.filter(v => v.kind !== 'short');
const shorts = () => state.videos.filter(v => v.kind === 'short');

async function loadVideos() {
  const all = await reqP(store('videos').getAll());
  all.sort((a, b) => b.created - a.created);
  state.videos = all;
  state.byId = new Map(all.map(v => [v.id, v]));
}

async function loadAds() {
  try { const all = await reqP(store('ads').getAll()); all.sort((a, b) => b.created - a.created); state.ads = all; }
  catch (e) { state.ads = []; }
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
function fillThumbs(root) {
  $$('img[data-vid]', root).forEach(async img => {
    const v = state.byId.get(img.dataset.vid);
    if (!v) return;
    let u = null;
    try { u = await thumbURL(v); } catch (e) {}
    if (u) { img.onerror = () => { img.style.visibility = 'hidden'; }; img.src = u; }
    else img.style.visibility = 'hidden';
  });
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
function renderHome() {
  const box = $('#home-list');
  const q = state.query.trim().toLowerCase();
  let L = byRank(longs()), S = byRank(shorts());
  if (q) { L = L.filter(v => v.title.toLowerCase().includes(q)); S = []; }
  if (!L.length && !S.length) {
    box.innerHTML = `<div class="empty">${logo(64)}<div>${q ? 'لا توجد نتائج' : 'لا توجد فيديوهات'}</div></div>`;
    return;
  }
  let html = '';
  L.forEach((v, i) => { html += cardHTML(v); if (i === 1 && S.length) html += shelfHTML(S); });
  if (L.length < 2 && S.length) html += shelfHTML(S);
  box.innerHTML = html;
  fillThumbs(box);
}

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
// يختار إعلان مناسب لهذا الفيديو (فقط إذا الفيديو أطول من دقيقة)
function pickAd(v) {
  if (!v || !(v.duration > 60) || !state.ads.length) return null;
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
      <span class="ad-cta">${esc(ad.cta || 'اعرف المزيد')}</span>
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
    const v = state.byId.get(s.dataset.id); if (!v) return;
    const r = await getVideoSrc(v);
    if (s._tok !== tok || !s.isConnected) { if (r.obj) URL.revokeObjectURL(r.url); return; }
    s._res = r;
    const vd = $('video', s); vd.src = r.url; vd.load();
  })();
  return s._p;
}
function detachShort(s) {
  s._tok++; s._p = null;
  const vd = $('video', s); if (!vd) return;
  if (s._res) {
    vd.pause(); vd.removeAttribute('src'); vd.load();
    if (s._res.obj) URL.revokeObjectURL(s._res.url);
    s._res = null;
  }
}
function killShortAd(s) { if (s._ad) { s._ad.kill(); s._ad = null; } }
async function startShort(s) {
  const vd = $('video', s);
  vd.muted = state.muted;
  try { await vd.play(); }
  catch (e) {
    if (!state.muted) { state.muted = true; setMuteIcon(); vd.muted = true; try { await vd.play(); } catch (e2) {} }
  }
  clearTimeout(s._ht);
  s._ht = setTimeout(() => { if (activeShort === s) addHistory(s.dataset.id); }, 1500);
}
async function playShort(s) {
  activeShort = s;
  if (s._ad) { s._ad.resume(); return; }
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
  activeShort = null;
}
const loadObs = new IntersectionObserver(entries => {
  for (const e of entries) { if (e.isIntersecting) attachShort(e.target); else detachShort(e.target); }
}, { root: feed, rootMargin: '100% 0px 100% 0px', threshold: 0 });
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
      vd.pause();
      if (activeShort === s) activeShort = null;
    }
  }
}, { root: feed, threshold: [0, 0.6, 1] });

function addShort(v) {
  const s = document.createElement('section');
  s.className = 'short'; s.dataset.id = v.id; s._tok = 0;
  s.innerHTML = `<video playsinline webkit-playsinline loop preload="none"></video>
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
  thumbURL(v).then(u => { if (u) $('video', s).poster = u; }).catch(() => {});
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
  if (vd.closest && vd.closest('.ad')) return;
  if (vd.videoWidth && vd.videoHeight) vd.classList.toggle('cover', vd.videoWidth / vd.videoHeight < 0.7);
}, true);
feed.addEventListener('error', e => {
  if (e.target && e.target.tagName === 'VIDEO' && !e.target.closest('.ad') && e.target.getAttribute('src')) toast('تعذر تشغيل الفيديو');
}, true);
feed.addEventListener('click', e => {
  if (e.target.closest('button')) return;
  const s = e.target.closest('.short'); if (!s) return;
  const vd = $('video', s), fl = $('.s-flash', s);
  if (vd.paused) { vd.play().catch(() => {}); fl.innerHTML = svg('play'); }
  else { vd.pause(); fl.innerHTML = svg('pause'); }
  fl.classList.remove('go'); void fl.offsetWidth; fl.classList.add('go');
});
function setMuteIcon() { $('#short-mute').innerHTML = svg(state.muted ? 'mute' : 'volume'); }
$('#short-mute').addEventListener('click', () => {
  state.muted = !state.muted; setMuteIcon();
  if (activeShort) $('video', activeShort).muted = state.muted;
});
function goShort(id) { setTab('shorts', { first: id }); }

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
  const items = hist.map(h => state.byId.get(h.videoId)).filter(Boolean).slice(0, 30);
  box.innerHTML = `
    <div class="you-head"><div class="avatar big">${svg('person')}</div><div><h2>أنت</h2><div class="w-meta">${esc(channel())}</div></div></div>
    <div class="sec-title"><h3>السجل</h3><span class="more">عرض الكل</span></div>
    ${items.length ? `<div class="hrow">${items.map(hcardHTML).join('')}</div>` : `<div class="muted pad">لا يوجد سجل مشاهدة بعد</div>`}
    <div class="menu">${[['playlist', 'قوائم التشغيل'], ['library', 'فيديوهاتك'], ['download', 'التنزيلات'], ['clock', 'مشاهدة لاحقًا']]
      .map(([i, t]) => `<div class="menu-row">${svg(i)}<span>${t}</span></div>`).join('')}</div>`;
  fillThumbs(box);
}

/* ================= صفحة المشاهدة ================= */
const W = { vid: $('#vid'), ov: $('#p-ov'), player: $('#player'), cur: null, url: null, hideT: null, skT: null, ad: null };
function killWatchAd() { if (W.ad) { W.ad.kill(); W.ad = null; } }
let scrub = false;

async function openWatch(id) {
  const v = state.byId.get(id); if (!v) return;
  const first = $('#watch').hidden;
  killWatchAd();
  pauseShorts();
  let r;
  try { r = await getVideoSrc(v); } catch (e) { toast('تعذر فتح الفيديو'); return; }
  const old = W.url;
  W.url = r.obj ? r.url : null;
  W.cur = v;
  $('#watch').hidden = false;
  if (first) history.pushState({ w: 1 }, '');
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
  const vid = W.vid;
  vid.pause(); vid.removeAttribute('src'); vid.load();
  if (W.url) { URL.revokeObjectURL(W.url); W.url = null; }
  W.cur = null;
  $('#watch').hidden = true;
  clearTimeout(W.hideT);
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}
function closeWatch() {
  if ($('#watch').hidden) return;
  cleanupWatch();
  if (history.state && history.state.w) history.back();
}
function fillWatchInfo(v) {
  $('#w-title').textContent = v.title;
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
  $('#p-toggle').innerHTML = svg(vid.ended ? 'replay' : (vid.paused ? 'play' : 'pause'));
  if (!vid.paused) showCtl();
}
function updProg() {
  const vid = W.vid, d = isFinite(vid.duration) ? vid.duration : 0, f = d ? vid.currentTime / d : 0;
  $('#seek-fill').style.width = (f * 100) + '%';
  $('#seek-knob').style.left = (f * 100) + '%';
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
W.vid.addEventListener('loadedmetadata', updProg);
W.vid.addEventListener('waiting', () => spin(true));
['playing', 'canplay', 'pause', 'ended'].forEach(ev => W.vid.addEventListener(ev, () => spin(false)));
W.vid.addEventListener('error', () => { if (W.vid.getAttribute('src')) { spin(false); toast('تعذر تشغيل الفيديو'); } });

$('#p-toggle').addEventListener('click', e => { e.stopPropagation(); togglePlay(); showCtl(); });
$('#p-back').addEventListener('click', e => {
  e.stopPropagation();
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else closeWatch();
});
$('#p-full').addEventListener('click', e => {
  e.stopPropagation();
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else if (W.player.requestFullscreen) { const p = W.player.requestFullscreen(); if (p && p.catch) p.catch(() => {}); }
});
document.addEventListener('fullscreenchange', () => {
  try {
    if (document.fullscreenElement) {
      if (W.vid.videoWidth > W.vid.videoHeight && screen.orientation && screen.orientation.lock) {
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
    homeRank.clear(); renderHome(); $('#view-home').scrollTo({ top: 0, behavior: 'smooth' });
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
  if (!$('#watch').hidden) cleanupWatch();
  else if (!$('#admin').hidden) hideAdmin();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { W.vid.pause(); $$('.short video').forEach(v => v.pause()); if (W.ad) W.ad.pause(); }
  else {
    if (W.ad) W.ad.resume();
    else if (state.tab === 'shorts' && activeShort && $('#watch').hidden) playShort(activeShort);
  }
});

function refreshAll() {
  renderHome(); navIcons(state.tab);
  if (state.tab === 'shorts') renderShorts();
  if (state.tab === 'you') renderYou();
}

/* ================= فحص الفيديو + صورة مصغرة ================= */
function probeVideo(src, opt) {
  const o = Object.assign({ cors: false, thumb: true }, opt);
  return new Promise(resolve => {
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto';
    if (o.cors) v.crossOrigin = 'anonymous';
    const out = { duration: 0, w: 0, h: 0, thumb: null };
    let done = false, to;
    const finish = () => {
      if (done) return; done = true; clearTimeout(to);
      v.onerror = v.onloadedmetadata = v.onseeked = null;
      try { v.removeAttribute('src'); v.load(); } catch (e) {}
      resolve(out);
    };
    to = setTimeout(finish, 15000);
    v.onerror = finish;
    v.onloadedmetadata = () => {
      out.duration = isFinite(v.duration) ? v.duration : 0;
      out.w = v.videoWidth; out.h = v.videoHeight;
      if (!o.thumb) return finish();
      try { v.currentTime = Math.min(1, (v.duration || 2) * 0.1); } catch (e) { finish(); }
    };
    v.onseeked = () => {
      try {
        const sc = Math.min(1, 640 / Math.max(v.videoWidth, v.videoHeight));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(v.videoWidth * sc));
        c.height = Math.max(1, Math.round(v.videoHeight * sc));
        c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
        c.toBlob(b => { out.thumb = b; finish(); }, 'image/jpeg', 0.82);
      } catch (e) { finish(); }
    };
    v.src = src;
  });
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
function hideAdmin() { $('#admin').hidden = true; $('#admin').innerHTML = ''; }
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
    <section class="adm-card">
      <h3>إضافة فيديو</h3>
      <div class="seg" id="seg-src"><button class="on" data-v="file">ملف من الهاتف</button><button data-v="url">رابط</button></div>
      <div id="src-file"><label class="filebtn"><input type="file" id="in-file" accept="video/*" hidden><span id="in-file-name">اختر فيديو</span></label></div>
      <div id="src-url" hidden>
        <input id="in-url" type="url" dir="ltr" placeholder="https://..." autocomplete="off">
        <label class="chk"><input type="checkbox" id="in-offline"><span>حفظ على الهاتف (يشتغل بدون إنترنت)</span></label>
      </div>
      <input id="in-title" type="text" placeholder="العنوان" autocomplete="off">
      <div class="seg" id="seg-kind"><button class="on" data-v="long">فيديو طويل</button><button data-v="short">Short</button></div>
      <div class="lbl">الصورة المصغرة (اختياري، وإذا تركتها تنأخذ من الفيديو تلقائياً)</div>
      <label class="filebtn"><input type="file" id="in-thumb" accept="image/*" hidden><span id="in-thumb-name">اختر صورة من الهاتف</span></label>
      <input id="in-thumburl" type="url" dir="ltr" placeholder="أو رابط صورة" autocomplete="off">
      <button class="primary" id="adm-add">إضافة</button>
      <div id="adm-status"></div>
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
  buildAdsAdmin(); renderAdsList();

  $('#adm-close').onclick = closeAdmin;
  const seg = (id, cb) => $(id).addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    setSeg(id, b.dataset.v); cb(b.dataset.v);
  });
  seg('#seg-src', v => { adm.src = v; $('#src-file').hidden = v !== 'file'; $('#src-url').hidden = v !== 'url'; });
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
  const vids = state.videos.length
    ? state.videos.map(v => `<label class="chk"><input type="checkbox" value="${v.id}"><span>${esc(v.title)}${v.duration > 60 ? '' : ' — (دقيقة أو أقل، ما يطلع عليه إعلان)'}</span></label>`).join('')
    : '<div class="muted">ما أضفت فيديوهات بعد</div>';
  box.innerHTML = `<h3>إضافة إعلان</h3>
    <div class="lbl">الإعلان يطلع قبل الفيديو، وبس إذا الفيديو أطول من دقيقة</div>
    <div class="seg" id="seg-ad-src"><button class="on" data-v="file">ملف من الهاتف</button><button data-v="url">رابط</button></div>
    <div id="ad-src-file"><label class="filebtn"><input type="file" id="ad-file" accept="video/*" hidden><span id="ad-file-name">اختر فيديو الإعلان</span></label></div>
    <div id="ad-src-url" hidden><input id="ad-url" type="url" dir="ltr" placeholder="https://..." autocomplete="off"></div>
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
    const tx = db.transaction(['ads', 'blobs'], 'readwrite');
    tx.objectStore('ads').put(ad);
    if (isFile) tx.objectStore('blobs').put(adf.file, 'ad:' + ad.id + ':video');
    await txDone(tx);
    await loadAds();
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
      <small>${esc(adSummary(a))}${a.hasBlob ? ' • على الهاتف ' + fmtSize(a.size) : ' • رابط'}</small>
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
      try { await reqP(store('ads', 'readwrite').put(Object.assign({}, a, { enabled: a.enabled === false }))); await loadAds(); renderAdsList(); }
      catch (e) { toast('تعذر التعديل'); }
    };
    $('[data-a="del"]', row).onclick = async () => {
      if (!confirm(`حذف الإعلان "${a.title}"؟`)) return;
      try {
        const tx = db.transaction(['ads', 'blobs'], 'readwrite');
        tx.objectStore('ads').delete(a.id); tx.objectStore('blobs').delete('ad:' + a.id + ':video');
        await txDone(tx); await loadAds(); renderAdsList(); toast('تم الحذف');
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
  $('#adm-count').textContent = `الفيديوهات (${state.videos.length})`;
  if (!state.videos.length) { box.innerHTML = '<div class="muted">ما أضفت أي فيديو بعد</div>'; return; }
  box.innerHTML = state.videos.map(v => `
    <div class="arow" data-id="${v.id}">
      <div class="at${v.kind === 'short' ? ' vert' : ''}"><img alt="" data-vid="${v.id}"></div>
      <div class="ti"><b>${esc(v.title)}</b><small>${v.kind === 'short' ? 'Short' : 'طويل'}${v.duration ? ' • ' + fmtDur(v.duration) : ''}${v.hasBlob ? ' • على الهاتف ' + fmtSize(v.size) : ' • رابط'}</small></div>
      <button class="icon-btn danger" data-del="${v.id}" aria-label="حذف">${svg('trash')}</button>
    </div>`).join('');
  fillThumbs(box);
  $$('[data-del]', box).forEach(b => b.onclick = async () => {
    const v = state.byId.get(b.dataset.del); if (!v) return;
    if (!confirm(`حذف "${v.title}"؟`)) return;
    try { await deleteVideo(v.id); await loadVideos(); refreshAll(); renderAdminList(); renderAdsList(); toast('تم الحذف'); }
    catch (e) { toast('تعذر الحذف'); }
  });
}

async function onAdd() {
  if (adm.busy) return;
  const isFile = adm.src === 'file';
  const url = $('#in-url').value.trim();
  if (isFile && !adm.file) return toast('اختر فيديو أولاً');
  if (!isFile && !/^https?:\/\//i.test(url)) return toast('اكتب رابط صحيح');
  adm.busy = true; $('#adm-add').disabled = true;
  try { await doAdd(isFile, url); }
  catch (e) {
    console.error(e);
    toast(e && e.name === 'QuotaExceededError' ? 'مساحة الهاتف ممتلئة' : 'صار خطأ، حاول مرة ثانية');
    adm.busy = false; const b = $('#adm-add'); if (b) b.disabled = false; setStatus('');
  }
}

async function doAdd(isFile, url) {
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  const meta = {
    id: uid(), title: $('#in-title').value.trim() || 'بدون عنوان', kind: adm.kind,
    src: isFile ? 'file' : 'url', url: isFile ? '' : url, hasBlob: false,
    thumbUrl: '', hasThumb: false, duration: 0, created: Date.now(), size: 0
  };
  const blobs = {};
  let probe = null;
  if (isFile) {
    setStatus('جاري تجهيز الفيديو…');
    probe = await adm.probing; if (!probe) probe = adm.probe;
    blobs.video = adm.file; meta.hasBlob = true; meta.size = adm.file.size;
  } else {
    if ($('#in-offline').checked) {
      try { const b = await downloadBlob(url, setStatus); blobs.video = b; meta.hasBlob = true; meta.size = b.size; }
      catch (e) { toast('ما كدرت أحمّل الفيديو على الهاتف، راح يشتغل بالإنترنت فقط'); }
    }
    setStatus('جاري فحص الفيديو…');
    if (meta.hasBlob) { const u = URL.createObjectURL(blobs.video); probe = await probeVideo(u); URL.revokeObjectURL(u); }
    else {
      probe = await probeVideo(url, { cors: true });
      if (!probe.duration) probe = await probeVideo(url, { thumb: false });
    }
    if (probe && probe.w && probe.h && !adm.kindTouched) meta.kind = probe.h > probe.w ? 'short' : 'long';
  }
  if (probe) meta.duration = probe.duration || 0;
  const thumbUrl = $('#in-thumburl').value.trim();
  if (adm.thumbFile) { blobs.thumb = adm.thumbFile; meta.hasThumb = true; }
  else if (/^https?:\/\//i.test(thumbUrl)) meta.thumbUrl = thumbUrl;
  else if (probe && probe.thumb) { blobs.thumb = probe.thumb; meta.hasThumb = true; }

  setStatus('جاري الحفظ…');
  await saveVideo(meta, blobs);
  await loadVideos();
  refreshAll();
  buildAdmin();
  toast('تمت الإضافة ✓');
}

/* ---- الدخول: ضغطة مطولة على الشعار ---- */
let lp = null;
const brand = $('#brand');
brand.addEventListener('pointerdown', () => { clearTimeout(lp); lp = setTimeout(() => { lp = null; brand._skipClick = true; askCode(); }, 1500); });
['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => brand.addEventListener(ev, () => clearTimeout(lp)));
brand.addEventListener('contextmenu', e => e.preventDefault());

function askCode() {
  const m = $('#modal');
  m.hidden = false;
  m.innerHTML = `<div class="dlg"><h3>الرمز السري</h3>
    <input id="code-in" type="password" inputmode="numeric" autocomplete="off">
    <div class="dlg-act"><button id="code-cancel">إلغاء</button><button class="primary" id="code-ok">دخول</button></div></div>`;
  const inp = $('#code-in'); inp.focus();
  const close = () => { m.hidden = true; m.innerHTML = ''; };
  const submit = () => {
    if (inp.value === LS.get('code', '1234')) { close(); openAdmin(); }
    else { inp.value = ''; inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); toast('الرمز غير صحيح'); }
  };
  $('#code-ok').onclick = submit;
  $('#code-cancel').onclick = close;
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
  m.onclick = e => { if (e.target === m) close(); };
}

/* ================= التشغيل ================= */
async function init() {
  injectIcons();
  setMuteIcon();
  try { db = await openDB(); }
  catch (e) { $('#home-list').innerHTML = '<div class="empty">تعذر فتح التخزين</div>'; return; }
  await loadVideos();
  await loadAds();
  renderHome(); navIcons('home');
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
init();

})();
