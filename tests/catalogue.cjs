// Word-for-word and live-catalogue checks. Needs the local server and network access to the live Quest catalogue.
const path=require('path'),assert=require('assert/strict'),{createRequire}=require('module');
let runtime;try{runtime=require('playwright');}catch(error){if(!process.env.BRADBURY_PLAYWRIGHT_DIR)throw error;runtime=createRequire(path.join(process.env.BRADBURY_PLAYWRIGHT_DIR,'package.json'))('playwright');}
const {chromium}=runtime;
const LIVE='https://p0champ.github.io/bradbury-cabin/source-catalogue.js';
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});let failed=false;try{
 const liveText=await (await fetch(LIVE)).text();const live=JSON.parse(liveText.slice(liveText.indexOf('[',liveText.indexOf('export const SOURCE_CATALOGUE'))).replace(/;\s*$/,''));
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8782/');await page.waitForFunction(()=>typeof phoneApp==='object'&&prototypeState.intro<.001,null,{timeout:20000});
 const result={};
 // 1. Every work the phone holds equals the live catalogue exactly (title, author, year, every block, every poem line).
 const shown=await page.evaluate(()=>window.LIBRARY);
 const byId=new Map(live.map(w=>[w.id,w]));let compared=0;
 for(const w of shown){const l=byId.get(w.id);assert.ok(l,'unknown work '+w.id);assert.deepEqual(w.blocks,l.blocks,'blocks differ: '+w.id);assert.equal(w.title,l.title);assert.equal(w.author,l.author);assert.equal(w.year,l.year);compared++;}
 result.compared=compared;result.live=live.length;
 assert.equal(shown.length,live.length,'phone shows '+shown.length+' of '+live.length);
 // 2. Library lists every work.
 await page.click('#collections');await page.click('#library-tab');await page.waitForTimeout(500);
 result.libraryRows=await page.locator('.collection-row').count();assert.equal(result.libraryRows,live.length);
 await page.click('#close-sheet');await page.waitForTimeout(600);
 // 3. What is drawn on screen is the catalogue's text, word for word, for new, French and poem works.
 const sample=['the-archpoet-the-confession-of-golias','alphonse-daudet-la-mort-du-dauphin','arthur-rimbaud-le-dormeur-du-val','jonathan-swift-a-modest-proposal','sherwood-anderson-hands','victor-hugo-mors'];
 const expectText=w=>w.blocks.map(b=>b.type==='stanza'?b.lines.map(l=>l.text).join(''):b.text);
 for(const id of sample){const l=byId.get(id);const index=shown.findIndex(w=>w.id===id);assert.ok(index>=0,'missing '+id);
  await page.evaluate(i=>phoneApp.engine.chooseWork(i,true),index);await page.waitForTimeout(700);
  const drawn=await page.evaluate(()=>[...phoneApp.engine.elements[phoneApp.engine.index].pages.querySelectorAll('.passage > p')].map(p=>p.textContent));
  assert.deepEqual(drawn,expectText(l),'drawn text differs: '+id);
  await page.evaluate(()=>phoneApp.engine.closeReading());await page.waitForTimeout(500);}
 result.drawnSampleExact=sample.length;
 // 4. Offline: a reload with no network still shows everything (live catalogue was cached).
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForTimeout(1500);
 await context.setOffline(true);await page.reload();await page.waitForFunction(()=>typeof phoneApp==='object',null,{timeout:20000});
 result.offlineWorks=await page.evaluate(()=>window.LIBRARY.length);assert.equal(result.offlineWorks,live.length);await context.setOffline(false);
 // 5. A newer catalogue is offered, never applied: banner only when no reading is open, and the running copy does not change.
 const cacheEdit=await page.evaluate(async()=>{const {pendingUpdate}=await import('./catalogue.js');return pendingUpdate;});
 result.updateFlagBefore=cacheEdit;
 await page.evaluate(async()=>{const m=await import('./catalogue.js');window.__beforeLen=m.catalogue.length;});
 await page.route(LIVE,async route=>{const r=await route.fetch();const t=await r.text();route.fulfill({status:200,contentType:'text/javascript',body:t.replace('"title": "Of Truth"','"title": "Of Truth (revised)"')});});
 const updated=await page.evaluate(async()=>{const m=await import('./catalogue.js');const ok=await m.checkForUpdate();return {ok,pending:m.pendingUpdate,len:m.catalogue.length,before:window.__beforeLen};});
 assert.equal(updated.ok,true,'update detected');assert.equal(updated.len,updated.before,'running copy unchanged');
 await page.evaluate(()=>phoneApp.engine.openReading(0));await page.waitForTimeout(900);
 assert.equal(await page.locator('#update-banner').isVisible(),false,'banner hidden while reading');
 await page.evaluate(()=>phoneApp.engine.closeReading());await page.waitForTimeout(1500);
 assert.equal(await page.locator('#update-banner').isVisible(),true,'banner visible on Today');
 assert.equal(await page.locator('#update-banner').textContent(),'New readings ready · Restart');
 result.updateBanner='hidden while reading, shown on Today';
 assert.deepEqual(errors,[]);result.errors=errors;
 console.log('catalogue checks passed',JSON.stringify(result));
}catch(e){failed=true;console.error('FAILED:',e.message);}finally{await browser.close();}if(failed)process.exit(1);})();
