from pathlib import Path
import json,hashlib
p=Path(__file__).resolve().parent.parent
h=p/'index.html';s=h.read_text(encoding='utf8');s=s if 'href="phone.css"' in s else s.replace('href="app.css">','href="app.css"><link rel="stylesheet" href="phone.css">');s=s if 'rel="icon"' in s else s.replace('</head>','<link rel="icon" href="assets/icon-192.png"></head>');h.write_text(s,encoding='utf8')
a=p/'app.js';s=a.read_text(encoding='utf8').replace('setModal(value){modal=value;}','setModal(value){modal=value;space.classList.toggle(\'modal-open\',value);}')
a.write_text(s,encoding='utf8')
files=['./']+[f.relative_to(p).as_posix() for f in p.rglob('*') if f.is_file() and '.git' not in f.parts and f.suffix in ['.html','.css','.js','.json','.webp','.png','.ttf','.webmanifest'] and (f.suffix!='.json' or f.name=='credits.json') and (f.suffix!='.png' or 'assets' in f.parts) and f.name not in ['service-worker.js','package.json','offline-manifest.json'] and 'tests' not in f.parts and 'museum-records' not in f.parts and not f.name.endswith('receipts.json')]
VERSION=12
rest=[f for f in files if f not in ("version.js",)]
digest=hashlib.sha256(''.join(hashlib.sha256((p/f).read_bytes()).hexdigest() for f in rest if f!='./').encode()).hexdigest()[:16]
(p/'version.js').write_text('// Written by tools/build.py'+chr(10)+'export const APP_VERSION='+str(VERSION)+';'+chr(10)+'export const BUILD='+json.dumps(digest[:8])+';'+chr(10),encoding='utf8')
files=rest+(['version.js'] if 'version.js' not in rest else [])
worker='''// Atomic offline installation. Personal Google responses never enter this cache.
const CACHE='''+json.dumps('bradbury-phone-'+digest)+''';
const FILES='''+json.dumps(files)+''';
self.addEventListener('install',event=>{self.skipWaiting();event.waitUntil((async()=>{const cache=await caches.open(CACHE);try{let next=0;await Promise.all(Array.from({length:4},async()=>{while(next<FILES.length){const file=FILES[next++],url=new URL(file,self.registration.scope);const response=await fetch(new Request(url,{cache:'reload'}));if(!response.ok)throw Error('Offline installation incomplete');await cache.put(url,response);}}));}catch(error){await caches.delete(CACHE);throw error;}})());});
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('bradbury-phone-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})()));
self.addEventListener('fetch',event=>{const url=new URL(event.request.url),scope=new URL(self.registration.scope);if(event.request.method!=='GET'||url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;const allowed=new Set(FILES.map(f=>new URL(f,self.registration.scope).pathname));if(!allowed.has(url.pathname))return;event.respondWith((async()=>{const cache=await caches.open(CACHE);const saved=await cache.match(event.request,{ignoreSearch:true});if(saved)return saved;return fetch(event.request);})());});
'''
(p/'service-worker.js').write_text(worker,encoding='utf8')
(p/'offline-manifest.json').write_text(json.dumps({'cache':digest,'files':files,'bytes':sum((p/f).stat().st_size for f in files if f!='./')},indent=2))
print('Offline build',digest,len(files),'files')
