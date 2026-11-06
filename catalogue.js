// The literary works come only from the live, checked Quest catalogue. No copy of the texts is bundled.
// The text is read as data (never run as code), cached for offline reading, and a newer version is only
// offered ("New readings ready · Restart"); it never replaces what an open reading is showing.
export const CATALOGUE_URL = 'https://p0champ.github.io/bradbury-cabin/source-catalogue.js';
const CACHE = 'bradbury-catalogue-v1';
const inBrowser = typeof caches !== 'undefined' && typeof document !== 'undefined';

export function parseCatalogue(text) {
  const marker = text.indexOf('export const SOURCE_CATALOGUE');
  const start = marker < 0 ? -1 : text.indexOf('[', marker);
  if (start < 0) throw Error('Catalogue format not recognised.');
  const list = JSON.parse(text.slice(start).replace(/;\s*$/, ''));
  if (!Array.isArray(list) || list.length < 100) throw Error('Catalogue looks incomplete.');
  const seen = new Set();
  for (const w of list) {
    if (!w || typeof w.id !== 'string' || seen.has(w.id) || !['poem', 'story', 'essay'].includes(w.kind) ||
      typeof w.title !== 'string' || typeof w.author !== 'string' || !Array.isArray(w.blocks) || !w.blocks.length ||
      !w.sourceEdition?.bodySha256) throw Error('Catalogue entry failed its checks.');
    seen.add(w.id);
  }
  return list;
}
async function sha256(text) {
  if (!globalThis.crypto?.subtle) return String(text.length);
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map(b => b.toString(16).padStart(2, '0')).join('');
}
async function fromNetwork(fresh) {
  const response = await fetch(CATALOGUE_URL, fresh ? { cache: 'no-cache' } : {});
  if (!response.ok) throw Error('Catalogue unavailable (' + response.status + ').');
  return response.text();
}
async function readCache() {
  if (!inBrowser) return null;
  try { const cache = await caches.open(CACHE), hit = await cache.match(CATALOGUE_URL); return hit ? await hit.text() : null; } catch { return null; }
}
async function writeCache(text) {
  if (!inBrowser) return;
  try { const cache = await caches.open(CACHE); await cache.put(CATALOGUE_URL, new Response(text, { headers: { 'content-type': 'text/javascript' } })); } catch {}
}

let text = await readCache(), list = null, source = 'cache';
if (text) { try { list = parseCatalogue(text); } catch { list = null; } }
if (!list) {
  source = 'network';
  try { text = await fromNetwork(false); list = parseCatalogue(text); await writeCache(text); }
  catch (error) {
    if (inBrowser) { document.documentElement.dataset.catalogueError = error.message; }
    throw Error('The readings need one online visit first. ' + error.message);
  }
}
export const catalogue = list;
export const catalogueSource = source;
export const catalogueHash = await sha256(text);

// Look for a newer catalogue in the background. The running copy never changes; listeners are told instead.
const listeners = new Set();
export let pendingUpdate = false;
export function onCatalogueUpdate(callback) { listeners.add(callback); if (pendingUpdate) callback(); }
export async function checkForUpdate() {
  try {
    const next = await fromNetwork(true);
    if (await sha256(next) === catalogueHash) return false;
    const parsed = parseCatalogue(next);
    if (parsed.length < catalogue.length * 0.9) return false;
    await writeCache(next);
    pendingUpdate = true; listeners.forEach(cb => { try { cb(); } catch {} });
    return true;
  } catch { return false; }
}
if (inBrowser) setTimeout(checkForUpdate, 4000);
