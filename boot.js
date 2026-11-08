// Starts the app from the live catalogue. Works that have no approved painting yet are held back,
// never shown with a placeholder. A newer catalogue or newer app code is offered ("New readings ready · Restart"),
// never applied under an open reading.
import { catalogue, catalogueSource, onCatalogueUpdate, checkForUpdate } from './catalogue.js';
import { APP_VERSION, BUILD } from './version.js';
const hadController = !!navigator.serviceWorker?.controller;
const cov = window.COVERS, haveCover = new Map(cov.works.map(w => [w.id, w]));
const shown = catalogue.filter(w => haveCover.has(w.id));
window.LIBRARY = shown;
cov.works = shown.map((w, i) => ({ ...haveCover.get(w.id), index: i, id: w.id, title: w.title, author: w.author, kind: w.kind, year: w.year }));
cov.count = cov.works.length; cov.total = catalogue.length;
window.APP_VERSION = APP_VERSION; window.APP_BUILD = BUILD;
window.CATALOGUE_STATUS = { total: catalogue.length, shown: shown.length, waiting: catalogue.length - shown.length, source: catalogueSource };
await import('./app.js');

const banner = document.createElement('button');
banner.id = 'update-banner'; banner.type = 'button'; banner.hidden = true; banner.className = 'glass';
banner.textContent = 'New readings ready · Restart';
banner.addEventListener('pointerdown', e => e.stopPropagation());
banner.addEventListener('click', () => location.reload());
document.getElementById('space').append(banner);
let pending = false;
const sync = () => { const e = window.phoneApp?.engine; banner.hidden = !(pending && e && e.open < .01 && e.sheet < .05 && !e.busy); };
const markPending = () => { pending = true; sync(); };
onCatalogueUpdate(markPending);
setInterval(sync, 700);

// New app code: the new worker takes over by itself (it calls skipWaiting); we only offer the restart.
const note = document.getElementById('version-note');
const label = () => `Version ${APP_VERSION} · build ${BUILD} · ${shown.length} works`;
if (note) note.textContent = label();
let registration = null;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) markPending(); });
  navigator.serviceWorker.getRegistration().then(r => { registration = r || null; });
}
const poll = async () => { try { await registration?.update(); } catch {} checkForUpdate(); };
document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });
setInterval(poll, 30 * 60 * 1000);
if (note) note.addEventListener('click', async () => {
  note.textContent = 'Checking for updates…';
  await poll();
  await new Promise(r => setTimeout(r, 2500));
  note.textContent = pending ? 'An update is ready — tap Restart on Today' : 'You have the latest version';
  setTimeout(() => { note.textContent = label(); }, 3500);
});
