// French word tap: a still tap on a word of a French reading shows its English meaning; English works show nothing.
const assert=require('assert/strict'),{createRequire}=require('module'),path=require('path');
let rt;try{rt=require('playwright');}catch(e){rt=createRequire(path.join(process.env.BRADBURY_PLAYWRIGHT_DIR,'package.json'))('playwright');}
(async()=>{const browser=await rt.chromium.launch({headless:true,channel:'msedge'});let failed=false;try{
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8782/');await page.waitForFunction(()=>typeof phoneApp==='object'&&prototypeState.intro<.001,null,{timeout:20000});
 const open=async id=>{const i=await page.evaluate(id=>window.LIBRARY.findIndex(w=>w.id===id),id);assert.ok(i>=0,id);await page.evaluate(i=>phoneApp.engine.chooseWork(i,true),i);await page.waitForTimeout(600);await page.evaluate(()=>phoneApp.engine.openReading(phoneApp.engine.index));await page.waitForTimeout(1200);};
 const tapFirstWord=async()=>{const pt=await page.evaluate(()=>{const p=document.querySelector('.piece[aria-hidden=false] .passage p, .piece:not([aria-hidden=true]) .passage p');const w=[...p.childNodes].find(n=>n.nodeType===3||n.querySelector);const t=(function f(n){return n.nodeType===3?n:[...n.childNodes].map(f).find(Boolean)})(p);const m=t.textContent.match(/\p{L}{4,}/u);const r=document.createRange();r.setStart(t,m.index);r.setEnd(t,m.index+m[0].length);const b=r.getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+b.height/2,word:m[0]};});await page.mouse.click(pt.x,pt.y);return pt;};
 await open('arthur-rimbaud-le-dormeur-du-val');
 const pt=await tapFirstWord();await page.waitForFunction(()=>{const c=document.getElementById('word-card');return c&&!c.hidden&&!/^…$/.test(c.querySelector('#word-content p:nth-of-type(2)').textContent)},null,{timeout:12000});
 const txt=await page.locator('#word-content').innerText();console.log('FRENCH TAP:',pt.word,'->',txt.replace(/\n+/g,' | '));
 assert.ok(txt.toLowerCase().includes(pt.word.toLowerCase())&&txt.length>pt.word.length+5);
 await page.locator('#close-word').click();assert.equal(await page.locator('#word-card').isHidden(),true);
 await page.evaluate(()=>phoneApp.engine.closeReading());await page.waitForTimeout(700);
 await open('jonathan-swift-a-modest-proposal');await tapFirstWord();await page.waitForTimeout(800);
 assert.equal(await page.evaluate(()=>{const c=document.getElementById('word-card');return !c||c.hidden}),true,'English work must show no card');
 assert.deepEqual(errors,[]);console.log('PASS');
}catch(e){failed=true;console.error('FAIL',e.message);}finally{await browser.close();process.exit(failed?1:0);}})();
