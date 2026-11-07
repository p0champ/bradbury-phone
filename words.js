// Tap a word in a French reading to see its English meaning (English-language Wiktionary, as on the Quest).
// Only the tapped word is sent. Nothing is invented: a miss or no connection says so plainly.
const clean = s => String(s || '').replace(/^[^\p{L}]+|[^\p{L}’'\-]+$/gu, '').slice(0, 80);
const short = (s, max = 300) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length <= max ? t : t.slice(0, max - 1).replace(/\s+\S*$/, '') + '…'; };
const plain = html => String(html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'");
const json = async (url, signal) => { const r = await fetch(url, { signal, credentials: 'omit', referrerPolicy: 'no-referrer' }); if (!r.ok) throw Error('Lookup unavailable'); return r.json(); };
const cache = new Map();
async function entry(w, signal) {
  const data = await json(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(w)}`, signal).catch(() => null);
  return data === null ? null : (data.fr || []).flatMap(p => p.definitions || []).map(d => plain(d.definition).trim()).filter(Boolean);
}
export async function lookupFrench(raw, signal) {
  const word = clean(raw), key = word.toLowerCase();
  if (!word) return { word, meaning: 'No word selected.' };
  if (cache.has(key)) return { ...cache.get(key), word };
  const ctl = new AbortController(), cancel = () => ctl.abort(), timer = setTimeout(cancel, 6000);
  signal?.addEventListener('abort', cancel, { once: true });
  try {
    let defs = await entry(word, ctl.signal), page = word;
    if (defs && !defs.length && word !== key) defs = await entry(key, ctl.signal);
    if (defs === null) return { word, meaning: 'Could not look this up. Check your connection and tap the word again.' };
    const lemma = defs[0]?.match(/\bof ([\p{L}'’-]+)\s*$/u)?.[1];
    if (lemma && lemma.toLowerCase() !== key) {
      const main = await entry(lemma, ctl.signal);
      if (main?.length) { defs = [`${defs[0]}: ${main[0]}`]; page = lemma; }
    }
    const result = defs.length
      ? { word, meaning: short(defs[0]), source: 'Wiktionary · French', url: `https://en.wiktionary.org/wiki/${encodeURIComponent(page)}#French` }
      : { word, meaning: 'No clear dictionary meaning found.' };
    if (cache.size >= 160) cache.delete(cache.keys().next().value);
    cache.set(key, result); return result;
  } finally { clearTimeout(timer); }
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
let card, seq = 0;
function ensureCard() {
  if (card) return card;
  card = document.createElement('aside');
  card.id = 'word-card'; card.className = 'credit-panel glass'; card.hidden = true; card.setAttribute('role', 'dialog'); card.setAttribute('aria-label', 'Word meaning');
  card.innerHTML = '<button id="close-word" aria-label="Close word meaning">×</button><div id="word-content"></div>';
  card.addEventListener('pointerdown', e => e.stopPropagation());
  card.querySelector('#close-word').onclick = closeWordCard;
  document.getElementById('space').append(card); return card;
}
export function closeWordCard() { seq++; if (card) card.hidden = true; }
function wordAt(x, y) {
  let node, offset;
  if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(x, y); node = p?.offsetNode; offset = p?.offset; }
  else if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(x, y); node = r?.startContainer; offset = r?.startOffset; }
  if (!node || node.nodeType !== 3 || !node.parentElement?.closest('.passage')) return '';
  const t = node.textContent, isW = c => /[\p{L}’'\-]/u.test(c || '');
  let a = Math.min(offset, t.length), b = a;
  while (a > 0 && isW(t[a - 1])) a--; while (b < t.length && isW(t[b])) b++;
  return t.slice(a, b);
}
// Called for a still tap while a reading is open. Returns true if it handled the tap.
export async function wordTap(e, work) {
  if (work?.language !== 'French') return false;
  const word = clean(wordAt(e.clientX, e.clientY));
  if (!word) return false;
  const c = ensureCard(), out = c.querySelector('#word-content'), mine = ++seq;
  out.innerHTML = `<p class="credit-artist">${esc(word)}</p><p>…</p>`; c.hidden = false;
  const r = await lookupFrench(word);
  if (mine !== seq) return true;
  out.innerHTML = `<p class="credit-artist">${esc(r.word)}</p><p>${esc(r.meaning)}</p>` + (r.url ? `<a href="${r.url}" target="_blank" rel="noopener">${esc(r.source)}</a>` : '');
  return true;
}
