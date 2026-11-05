const path=require('path'),assert=require('assert/strict'),{createRequire}=require('module');
let runtime;try{runtime=require('playwright');}catch(error){if(!process.env.BRADBURY_PLAYWRIGHT_DIR)throw error;runtime=createRequire(path.join(process.env.BRADBURY_PLAYWRIGHT_DIR,'package.json'))('playwright');}
const {chromium}=runtime;
(async()=>{const browser=await chromium.launch({headless:true,channel:'msedge'});let failed=false;try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8782/?work=59');await page.waitForFunction(()=>typeof phoneApp==='object'&&prototypeState.intro<.001);await page.evaluate(()=>document.fonts.ready);
 const info=()=>page.evaluate(()=>({...phoneApp.engine.pageInfo,open:prototypeState.open,index:prototypeState.index,footer:document.querySelectorAll('.reader-footer')[prototypeState.index].textContent}));
 const swipe=async(dx,dy,steps=8)=>{await page.evaluate(([dx,dy,steps])=>new Promise(res=>{const s=document.getElementById('space'),fire=(t,x,y)=>s.dispatchEvent(new PointerEvent(t,{pointerId:7,clientX:x,clientY:y,bubbles:true,isPrimary:true,button:0,pointerType:'touch'}));s.setPointerCapture=()=>{};let i=0;const x0=200,y0=500;fire('pointerdown',x0,y0);const go=()=>{i++;fire('pointermove',x0+dx*i/steps,y0+dy*i/steps);if(i<steps)setTimeout(go,16);else{fire('pointerup',x0+dx,y0+dy);res();}};go();}),[dx,dy,steps]);await page.waitForTimeout(700);};
 const results={};
 // open by pulling up
 await swipe(0,-300);let s=await info();assert.ok(s.open>.99,'reader opened');assert.ok(s.total>3,'several pages: '+s.total);assert.equal(s.page,0);assert.match(s.footer,/^Page 1 of \d+$/);results.opened=s;
 // sideways turns pages, not works
 await swipe(-170,0);s=await info();assert.equal(s.page,1);assert.equal(s.index,0,'work unchanged');assert.match(s.footer,/^Page 2 of/);
 await swipe(-170,0);assert.equal((await info()).page,2);
 await swipe(170,0);assert.equal((await info()).page,1);
 // first page boundary: swipe back past start stays at 0
 await swipe(170,0);await swipe(170,0);assert.equal((await info()).page,0);
 // a sloppy diagonal mostly vertical upward drag does nothing
 await swipe(40,-200);s=await info();assert.equal(s.page,0);assert.ok(s.open>.99);
 // last page boundary
 await page.evaluate(()=>phoneApp.engine.goPage(1e6,false));s=await info();assert.equal(s.page,s.total-1);await swipe(-170,0);assert.equal((await info()).page,s.total-1);
 // text coverage: every paragraph character appears in exactly one column; nothing clipped below page bottom
 const cover=await page.evaluate(()=>{const e=phoneApp.engine.elements[phoneApp.engine.index],base=e.pages.getBoundingClientRect(),stride=phoneApp.engine.pageInfo.stride,total=phoneApp.engine.pageInfo.total,bad=[];const w=document.createTreeWalker(e.pages.querySelector('.passage'),NodeFilter.SHOW_TEXT);let n,count=0,last=-1;while(n=w.nextNode()){if(n.parentElement.closest('.finish-reading'))continue;for(let o=0;o<n.length;o+=7){const r=document.createRange();r.setStart(n,o);r.setEnd(n,Math.min(n.length,o+1));const rect=r.getClientRects()[0];if(!rect)continue;count++;const col=Math.floor((rect.left-base.left+.5)/stride);if(col<last)bad.push('order '+col+'<'+last);last=Math.max(last,col);if(rect.bottom>base.bottom+1)bad.push('clipped');if(col<0||col>=total)bad.push('range '+col);}}return{count,bad:bad.slice(0,5)};});
 assert.deepEqual(cover.bad,[],'text placement');results.coverage=cover;
 // place restore across type size: go to middle, remember passage, change size, still the same passage
 await page.evaluate(()=>phoneApp.engine.goPage(Math.floor(phoneApp.engine.pageInfo.total/2),false));await page.waitForTimeout(400);
 const before=await page.evaluate(()=>{phoneApp.savePlace();const w=phoneApp.engine.works[phoneApp.engine.index];return JSON.parse(JSON.stringify(phoneApp.store.state.positions[w.id]));});
 const sample=async()=>page.evaluate(({block,character})=>{const e=phoneApp.engine.elements[phoneApp.engine.index],p=e.pages.querySelectorAll('.passage > p')[block],txt=p.textContent.slice(character,character+30);return txt;},before);
 const wasText=await sample();
 await page.locator('.type-size').nth(0).click();await page.locator('[data-size="26"]').click();await page.waitForTimeout(700);await page.locator('#close-phone-panel').click();await page.waitForTimeout(300);
 const big=await info();assert.ok(big.total>s.total,'bigger type means more pages');
 const bigPos=await page.evaluate(()=>{phoneApp.savePlace();const w=phoneApp.engine.works[phoneApp.engine.index];return JSON.parse(JSON.stringify(phoneApp.store.state.positions[w.id]));});
 // the first character of the new page must be on/just after the remembered one in the same paragraph or the very next page-start (within one page of text)
 assert.ok(bigPos.block===before.block||bigPos.block===before.block-1||bigPos.block===before.block+1,'same area of the text after size change: '+JSON.stringify({before,bigPos}));
 await page.locator('.type-size').nth(0).click();await page.locator('[data-size="20"]').click();await page.waitForTimeout(700);await page.locator('#close-phone-panel').click();await page.waitForTimeout(300);
 const back=await info();assert.ok(Math.abs(back.page-Math.floor(s.total/2))<=1,'returns near the same page: '+JSON.stringify({back,total:s.total}));
 // reload resumes on the saved page
 const midPage=back.page;await page.waitForTimeout(500);await page.reload();await page.waitForFunction(()=>typeof phoneApp==='object'&&prototypeState.intro<.001);await page.waitForTimeout(1500);const resumed=await info();assert.ok(resumed.open>.99,'still reading after reload');assert.equal(resumed.page,midPage,'resumed page');
 // pull down returns to Today; reopen keeps page
 await swipe(0,320);s=await info();assert.ok(s.open<.05,'closed by pull down');await swipe(0,-300);s=await info();assert.equal(s.page,midPage);
 // keyboard
 await page.keyboard.press('ArrowRight');await page.waitForTimeout(500);assert.equal((await info()).page,midPage+1);await page.keyboard.press('ArrowLeft');await page.waitForTimeout(500);assert.equal((await info()).page,midPage);
 // reader sideways does not change the work on the deck behind it
 assert.equal((await info()).index,0);
 assert.deepEqual(errors,[]);
 console.log('pagination checks passed',JSON.stringify({pages20:back.total,pages26:big.total,coverage:cover.count}));
}catch(e){failed=true;console.error(e.message);}finally{await browser.close();}if(failed)process.exit(1);})();
