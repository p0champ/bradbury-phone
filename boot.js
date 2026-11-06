// Starts the app from the live catalogue. Works that have no approved painting yet are held back,
// never shown with a placeholder. A newer catalogue is offered, never applied under an open reading.
import { catalogue, catalogueSource, onCatalogueUpdate, checkForUpdate } from './catalogue.js';
const cov = window.COVERS, haveCover = new Map(cov.works.map(w => [w.id, w]));
const shown = catalogue.filter(w => haveCover.has(w.id));
window.LIBRARY = shown;
cov.works = shown.map((w, i) => ({ ...haveCover.get(w.id), index: i, id: w.id, title: w.title, author: w.author, kind: w.kind, year: w.year }));
cov.count = cov.works.length; cov.total = catalogue.length;
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
onCatalogueUpdate(() => { pending = true; sync(); });
setInterval(sync, 700);
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkForUpdate(); });
setInterval(checkForUpdate, 30 * 60 * 1000);
