import {initialIndices,arrivalToday,initialisePhone,readingOpened,readingClosed,workChanged,collectionRows as phoneCollectionRows} from './phone.js';
(() => {
const params=new URLSearchParams(location.search), structure='a';let phoneReady=false,modal=false;
const space=document.getElementById('space'), piecesRoot=document.getElementById('pieces'), reduced=matchMedia('(prefers-reduced-motion: reduce)');
space.dataset.structure=structure;
const coverData=window.COVERS,library=coverData.works;
const material=w=>({...window.LIBRARY[w.index],...w,cover:coverData.paintings[w.art]});
const works=initialIndices().map(i=>material(library[i]));
const initial=Number(params.get('work'));if(params.has('work')&&library[initial]?.art)works[0]=material(library[initial]);
const icons={back:'<svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg>',bookmark:'<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4-6 4Z"/></svg>'};
const escape=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
piecesRoot.innerHTML=works.map((w,i)=>`<article class="piece" data-i="${i}" aria-label="${escape(w.title)}"><div class="poster-frame"><img class="poster-art" src="${w.cover.file}" alt="Detail of ${escape(w.cover.title)}" decoding="async" draggable="false"><div class="poster-shade"></div></div><div class="poster-copy"><h2>${escape(w.title)}</h2><p>${escape(w.author)}</p></div><button class="art-credit glass" data-credit="${i}" aria-label="Painting credit for ${escape(w.title)}">ⓘ</button><div class="reader-paper"><div class="reader-toolbar"><button class="reader-back" aria-label="Back to artwork">${icons.back}Today</button><div class="reader-tools" aria-hidden="true"><span>Aa</span>${icons.bookmark}<span>···</span></div></div><div class="reader-scroll"><div class="reader-pages"><div class="reader-heading"><h2>${escape(w.title)}</h2><div class="byline">${escape(w.author)} · ${w.year}</div></div><div class="passage">${w.blocks.map(b=>b.type==='stanza'?'<p class="stanza">'+b.lines.map(l=>`<span class="poem-line" style="padding-left:${l.indent?20:0}px">${escape(l.text)}</span>`).join('')+'</p>':'<p>'+escape(b.text)+'</p>').join('')}</div></div></div><div class="reader-footer" role="status" aria-live="polite"></div></div></article>`).join('');
const els=[...document.querySelectorAll('.piece')].map(el=>({el,frame:el.querySelector('.poster-frame'),art:el.querySelector('.poster-art'),copy:el.querySelector('.poster-copy'),paper:el.querySelector('.reader-paper'),scroll:el.querySelector('.reader-scroll'),pages:el.querySelector('.reader-pages'),footer:el.querySelector('.reader-footer')}));
class Spring {
 constructor(value){this.value=value;this.target=value;this.velocity=0;}
 grab(){this.target=this.value;this.velocity=0;}
 set(value){this.value=value;this.target=value;this.velocity=0;wake();}
 to(value,velocity=0){this.target=value;this.velocity=velocity;wake();}
 step(dt){if(reduced.matches&&!drag){this.value=this.target;this.velocity=0;return false;}const f=(this.target-this.value)*265-this.velocity*27;this.velocity+=f*dt;this.value+=this.velocity*dt;if(Math.abs(this.target-this.value)<.0005&&Math.abs(this.velocity)<.004){this.value=this.target;this.velocity=0;return false;}return true;}
}
let wasPaging=false,pageLock=0,drag=null,momentum=null,W=space.clientWidth,H=space.clientHeight,raf=0,last=0,mode=params.get('mode')||'auto',selected=structure==='a'?0:1,tab='shelf',introTimer;
const x=new Spring(selected),p=new Spring(structure==='b'?1:0),q=new Spring(0),intro=new Spring(arrivalToday()?1:0);
els.forEach(e=>{e.pg=new Spring(0);e.total=1;e.stride=1;});
const introEl=document.getElementById('intro'),sheet=document.getElementById('collection-sheet'),chooser=document.getElementById('chooser-ui'),hint=document.getElementById('hint'),counter=document.getElementById('counter');
function lighting(value){mode=value;const hour=new Date().getHours(),light=value==='auto'?(hour>=7&&hour<19?'day':'night'):value;space.dataset.mode=light==='night'?'night':'day';document.getElementById('clock').textContent=light==='night'?'21:41':'9:41';}
function render(){
 const open=Math.max(0,Math.min(1,p.value)),pos=x.value,index=Math.max(0,Math.min(2,Math.round(pos)));
 const tone=works[index].cover.tone;space.style.setProperty('--art-tone',tone.join(','));
 selected=index;space.dataset.index=index;space.dataset.open=open.toFixed(3);space.dataset.sheet=q.value.toFixed(3);space.classList.toggle('read-mode',open>.85);
 els.forEach((e,i)=>{const d=i-pos,isFan=structure==='c',tx=d*W*(isFan?.77+.23*open:1),angle=isFan?d*10*(1-open):0,scale=isFan?1-Math.min(2,Math.abs(d))*.055*(1-open):1;
 e.el.style.transform=`translate3d(${tx}px,0,0) rotate(${angle}deg) scale(${scale})`;e.el.style.zIndex=String(20-Math.round(Math.abs(d)*5));
 e.el.setAttribute('aria-hidden',String(i!==index));e.el.inert=i!==index;e.el.querySelector('.art-credit').style.visibility=open>.05?'hidden':'visible';
 const margin=isFan?24*(1-open):0,top=isFan?117*(1-open):0,bottom=isFan?128*(1-open):0;
 e.frame.style.left=margin+'px';e.frame.style.right=margin+'px';e.frame.style.top=top+'px';e.frame.style.bottom=bottom+'px';e.frame.style.borderRadius=isFan?26*(1-open)+'px':'0px';e.frame.style.transform=`scale(${1+open*.13})`;e.frame.style.opacity=1-open;
 const arrive=Math.max(0,Math.min(1,(1-intro.value-.12)/.5)),arriveHint=Math.max(0,Math.min(1,(1-intro.value-.35)/.5));e.copy.style.opacity=Math.max(0,1-open*1.8)*(isFan?Math.max(0,1-Math.abs(d)*2):1)*arrive;e.copy.style.transform=`translateY(${-open*48}px)`;
 e.pages.style.transform=`translate3d(${-e.pg.value*e.stride}px,0,0)`;if(i===index){const n=Math.max(0,Math.min(e.total-1,Math.round(e.pg.value)))+1,t='Page '+n+' of '+e.total;if(e.footer.textContent!==t)e.footer.textContent=t;}
 e.paper.style.visibility=open>.001&&(!isFan||i===index)?'visible':'hidden';
 e.paper.style.transform=`translate3d(0,${(1-open)*H}px,0)`;e.paper.style.borderRadius=32*(1-open)+'px '+32*(1-open)+'px 0 0';e.paper.style.pointerEvents=open>.96&&i===index?'auto':'none';
 });
 const bReader=structure==='b'&&open>.85;chooser.style.opacity=bReader?'1':String(1-open);chooser.style.visibility=structure!=='b'&&open>.98?'hidden':'visible';counter.textContent=(index+1)+' of 3';counter.style.opacity=String(Math.max(0,Math.min(1,(1-intro.value)*2)));
 document.querySelectorAll('.dots i').forEach((d,i)=>d.classList.toggle('selected',i===index));
 hint.textContent=structure==='c'?'Swipe the covers · Pull up from the bottom for Shelf':structure==='b'?'Swipe to choose · Pull up to read':'Swipe to choose · Pull up to read';
 hint.style.display=bReader?'none':'block';hint.style.opacity=String(Math.max(0,Math.min(1,(1-intro.value-.35)/.5)));document.querySelector('.dots').style.display=bReader?'none':'flex';
 const sq=Math.max(0,Math.min(1,q.value));sheet.style.transform=`translate3d(0,${(1-sq)*H*.9}px,0)`;sheet.inert=sq<.05;sheet.setAttribute('aria-hidden',String(sq<.05));document.getElementById('sheet-shade').style.opacity=sq*.34;document.getElementById('sheet-shade').style.pointerEvents=sq>.1?'auto':'none';
 introEl.style.display=intro.value>.001?'block':'none';introEl.style.transform=`translate3d(0,${-(1-intro.value)*H}px,0)`;introEl.style.opacity=Math.min(1,intro.value*1.7);introEl.setAttribute('aria-hidden',String(intro.value<.01));
}
function tick(time){const dt=Math.min(.025,Math.max(.001,(time-last)/1000||.016));last=time;let active=false;[x,p,q,intro].forEach(s=>{active=s.step(dt)||active;});let paging=false;els.forEach(e=>{paging=e.pg.step(dt)||paging;});active=active||paging;if(wasPaging&&!paging&&!drag)space.dispatchEvent(new Event('pagesettled'));wasPaging=paging;if(momentum){const before=momentum.el.scrollTop;momentum.el.scrollTop+=momentum.velocity*dt;momentum.velocity*=Math.exp(-dt*6.5);if(Math.abs(momentum.velocity)<5||Math.abs(momentum.el.scrollTop-before)<.2)momentum=null;else active=true;}render();raf=active?requestAnimationFrame(tick):0;}
function wake(){if(!raf){last=performance.now();raf=requestAnimationFrame(tick);}}
function setupIntro(){const used=new Set(works.map(w=>w.art)),key=['436531','435991','436675'].find(k=>coverData.paintings[k]&&!used.has(k))||works.find(w=>w.art)?.art,paint=coverData.paintings[key],img=document.getElementById('intro-art');if(paint){img.src=paint.file;img.alt='Detail of '+paint.title+' by '+paint.artist;}const hour=new Date().getHours();document.getElementById('intro-hello').textContent=hour>=5&&hour<12?'Good morning, Bastian.':hour>=12&&hour<18?'Good afternoon, Bastian.':'Good evening, Bastian.';}
function dismissIntro(){clearTimeout(introTimer);intro.to(0);}
function openReading(index=selected){closeCredit();if(phoneReady)readingOpened(index);x.to(index);p.to(1);q.to(0);document.getElementById('announcement').textContent=works[index].title;}
function closeReading(){if(phoneReady)readingClosed();p.to(0);document.getElementById('announcement').textContent='Today’s three';}
function collectionRows(){if(phoneReady)phoneCollectionRows(tab);}
function layout(i){const e=els[i],width=e.pages.clientWidth;if(width<40)return;e.pages.style.setProperty('--page-width',width+'px');e.stride=width+64;e.total=Math.max(1,Math.round((e.pages.scrollWidth+64)/e.stride));const page=clamp(Math.round(e.pg.target),0,e.total-1);if(page!==Math.round(e.pg.target)||e.pg.value>e.total-1)e.pg.set(page);}
function layoutAll(){els.forEach((e,i)=>layout(i));render();}
function goPage(n,animate=true){const e=els[selected];layout(selected);const page=clamp(Math.round(n),0,e.total-1);if(animate&&!reduced.matches)e.pg.to(page);else{e.pg.set(page);space.dispatchEvent(new Event('pagesettled'));}render();}
function turnPage(delta){const e=els[selected];if(p.value<.9)return false;const target=Math.round(e.pg.target)+delta;if(target<0||target>e.total-1)return false;goPage(target);return true;}
function fitTitles(){els.forEach(e=>{const title=e.copy.querySelector('h2');title.style.fontSize='';let size=parseFloat(getComputedStyle(title).fontSize);while((e.copy.scrollHeight>H*.37||title.scrollWidth>title.clientWidth+1)&&size>22){size--;title.style.fontSize=size+'px';}});}
function chooseWork(index,read=false,targetSlot=null){
 const w=library[index];if(!w?.art)return;const slot=targetSlot??selected;works[slot]=material(w);const e=els[slot],v=works[slot];
 e.art.src=v.cover.file;e.art.alt='Detail of '+v.cover.title;e.copy.querySelector('h2').textContent=v.title;e.copy.querySelector('p').textContent=v.author;e.el.setAttribute('aria-label',v.title);
 e.el.querySelector('.reader-heading h2').textContent=v.title;e.el.querySelector('.byline').textContent=v.author+' · '+v.year;
 e.el.querySelector('.passage').innerHTML=v.blocks.map(b=>b.type==='stanza'?'<p class="stanza">'+b.lines.map(l=>`<span class="poem-line" style="padding-left:${l.indent?20:0}px">${escape(l.text)}</span>`).join('')+'</p>':'<p>'+escape(b.text)+'</p>').join('');
 e.el.querySelector('.art-credit').setAttribute('aria-label','Painting credit for '+v.title);e.pg.set(0);e.scroll.scrollTop=0;e.scroll.scrollLeft=0;layout(slot);dismissIntro();q.to(0);closeCredit();fitTitles();if(phoneReady)workChanged(slot);if(read)openReading(slot);else p.to(0);render();
}
const credit=document.getElementById('credit-panel');
function closeCredit(){credit.hidden=true;}
document.querySelectorAll('[data-credit]').forEach(b=>b.onclick=()=>{const w=works[Number(b.dataset.credit)],a=w.cover;document.getElementById('credit-content').innerHTML=`<p class="credit-artist">${escape(a.artist)}</p><p><em>${escape(a.title)}</em>, ${escape(a.year)}</p><p>${escape(a.museum)}</p><p class="credit-fit">${escape(w.why)}</p><a href="${a.record}" target="_blank" rel="noopener">Museum record · CC0 · detail</a>`;credit.hidden=false;});
document.getElementById('close-credit').onclick=closeCredit;
credit.addEventListener('pointerdown',e=>e.stopPropagation());
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&!credit.hidden){closeCredit();e.stopImmediatePropagation();}},true);
const list=document.getElementById('collection-works');let listDrag=null,listMoved=false;
list.addEventListener('pointerdown',e=>{e.stopPropagation();momentum=null;listMoved=false;listDrag={id:e.pointerId,y:e.clientY,top:list.scrollTop,last:e.clientY,time:e.timeStamp,v:0};});
list.addEventListener('pointermove',e=>{if(!listDrag||e.pointerId!==listDrag.id)return;e.stopPropagation();const d=listDrag,dy=e.clientY-d.y;if(Math.abs(dy)>7)listMoved=true;if(listMoved){list.setPointerCapture(e.pointerId);list.scrollTop=d.top-dy;e.preventDefault();}d.v=(e.clientY-d.last)/Math.max(.008,(e.timeStamp-d.time)/1000);d.last=e.clientY;d.time=e.timeStamp;});
function endList(e){if(!listDrag||e.pointerId!==listDrag.id)return;e.stopPropagation();if(listMoved&&!reduced.matches){momentum={el:list,velocity:-listDrag.v};wake();}listDrag=null;}
list.addEventListener('pointerup',endList);list.addEventListener('pointercancel',endList);list.addEventListener('wheel',e=>e.stopPropagation(),{passive:true});
function showCollections(){dismissIntro();collectionRows();q.to(1);}
document.getElementById('collections').onclick=showCollections;document.getElementById('close-sheet').onclick=()=>q.to(0);document.getElementById('sheet-shade').onclick=()=>q.to(0);document.getElementById('shelf-tab').onclick=()=>{tab='shelf';collectionRows();};document.getElementById('library-tab').onclick=()=>{tab='library';collectionRows();};document.querySelectorAll('.reader-back').forEach(b=>b.onclick=closeReading);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
space.addEventListener('pointerdown',e=>{
 if(e.target.closest('button'))return;
 if(e.button!==0)return;
 momentum=null;
 const rect=space.getBoundingClientRect();
 drag={id:e.pointerId,sx:e.clientX,sy:e.clientY,localY:e.clientY-rect.top,lastX:e.clientX,lastY:e.clientY,time:e.timeStamp,vx:0,vy:0,px:x.value,pp:p.value,pq:q.value,pi:intro.value,axis:null,moved:false,pgv:els[selected].pg.value,pgStart:Math.round(els[selected].pg.value)};
 [x,p,q,intro].forEach(s=>s.grab());els.forEach(e=>e.pg.grab());space.setPointerCapture(e.pointerId);
});
space.addEventListener('pointermove',e=>{
 if(!drag||e.pointerId!==drag.id)return;
 const dx=e.clientX-drag.sx,dy=e.clientY-drag.sy,dt=Math.max(8,e.timeStamp-drag.time)/1000;
 drag.vx=drag.vx*.3+(e.clientX-drag.lastX)/dt*.7;drag.vy=drag.vy*.3+(e.clientY-drag.lastY)/dt*.7;drag.lastX=e.clientX;drag.lastY=e.clientY;drag.time=e.timeStamp;
 if(!drag.axis&&Math.hypot(dx,dy)>8){drag.axis=Math.abs(dx)>Math.abs(dy)*1.15?'x':'y';drag.moved=true;}
 if(!drag.axis)return;
 if(drag.pi>.01){intro.set(clamp(drag.pi-Math.max(Math.abs(dx),Math.abs(dy))/H,0,1));return;}
 if(drag.pq>.05){q.set(clamp(drag.pq-dy/(H*.72),0,1));return;}
 if(drag.axis==='x'){
  if(drag.pp>.5&&structure!=='b'){if(drag.pp>.96){const e=els[selected],raw=drag.pgv-dx/e.stride,top=e.total-1;e.pg.set(raw<0?raw*.18:raw>top?top+(raw-top)*.18:raw);drag.paging=true;}return;}
  const raw=drag.px-dx/(W*(structure==='c'?.77:1));x.set(raw<0?raw*.18:raw>2?2+(raw-2)*.18:raw);
 }else{
  if(drag.pp>.96&&dy<0)return;
  if(drag.pp<.03&&((structure==='c'&&drag.localY>H-90&&dy<0)||(structure!=='c'&&dy>0))){q.set(clamp(Math.abs(dy)/(H*.68),0,1));drag.sheet=true;return;}
  p.set(clamp(drag.pp-dy/(H*.72),0,1));
 }
});
function end(e,cancel=false){
 if(!drag||e.pointerId!==drag.id)return;
 const d=drag;drag=null;
 if(d.pi>.01){intro.to(0);return;}
 if(d.pq>.05||d.sheet){const dest=cancel?(d.pq>.5?1:0):q.value>.34||d.vy<-450?1:0;q.to(dest,-d.vy/(H*.72));return;}
 if(!d.moved&&!cancel){if(p.value<.5){let index=selected;if(structure==='c'){const hits=els.map((item,i)=>({i,r:item.frame.getBoundingClientRect()})).filter(({r})=>e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom).sort((a,b)=>Math.abs(a.i-x.value)-Math.abs(b.i-x.value));if(hits.length)index=hits[0].i;}openReading(index);}else if(p.value<.98)p.to(1);x.to(Math.round(x.target));return;}
 if(d.paging){const e=els[selected],projected=e.pg.value-d.vx/e.stride*.12;let target=clamp(Math.round(projected),d.pgStart-1,d.pgStart+1);if(Math.abs(d.vx)>500&&target===d.pgStart)target=d.pgStart+(d.vx<0?1:-1);target=clamp(target,0,e.total-1);if(cancel)target=d.pgStart;e.pg.to(target,-d.vx/e.stride);if(target===d.pgStart&&Math.abs(e.pg.value-target)<.001)space.dispatchEvent(new Event('pagesettled'));}
 else if(d.axis==='x'&&(structure==='b'||d.pp<.5)){const projected=x.value-d.vx/W*.12;let target=clamp(Math.round(projected),0,2);if(Math.abs(d.vx)>500&&target===Math.round(d.px))target=clamp(Math.round(d.px)+(d.vx<0?1:-1),0,2);x.to(target,-d.vx/W);}
 else{const projected=p.value-d.vy/H*.13;p.to(cancel?(d.pp>.5?1:0):projected>.45?1:0,-d.vy/(H*.72));}

}
space.addEventListener('pointerup',e=>end(e));space.addEventListener('pointercancel',e=>end(e,true));
space.addEventListener('wheel',e=>{if(p.value>.96){const d=Math.abs(e.deltaX)>Math.abs(e.deltaY)?e.deltaX:e.deltaY;if(Math.abs(d)>12&&performance.now()>pageLock){pageLock=performance.now()+320;turnPage(Math.sign(d));}}else if(Math.abs(e.deltaX)>Math.abs(e.deltaY)&&Math.abs(e.deltaX)>15)x.to(clamp(x.target+Math.sign(e.deltaX),0,2));},{passive:true});
window.addEventListener('keydown',e=>{if(modal||e.target.closest('input,textarea,select,[contenteditable]'))return;if(e.key==='Escape'){if(q.value>.1)q.to(0);else if(p.value>.1)closeReading();else showCollections();}else if((e.key==='ArrowRight'||e.key==='ArrowLeft'||e.key==='PageDown'||e.key==='PageUp'||e.key===' ')&&p.target>.5){e.preventDefault();turnPage(e.key==='ArrowLeft'||e.key==='PageUp'?-1:1);}else if(e.key==='ArrowRight'){dismissIntro();x.to(clamp(x.target+1,0,2));}else if(e.key==='ArrowLeft'){dismissIntro();x.to(clamp(x.target-1,0,2));}else if((e.key==='ArrowUp'||e.key==='Enter')&&p.target<.5){dismissIntro();openReading();}else if(e.key==='ArrowDown'){dismissIntro();p.value>.1?closeReading():showCollections();}});
window.addEventListener('message',e=>{if(e.source!==parent)return;if(e.data?.type==='mode')lighting(e.data.value);if(e.data?.type==='reset')location.reload();if(e.data?.type==='work')chooseWork(e.data.index,false);});
space.addEventListener('pointerdown',e=>{if(modal&&!e.target.closest('#phone-panel'))e.stopImmediatePropagation();},true);
new ResizeObserver(()=>{W=space.clientWidth;H=space.clientHeight;fitTitles();layoutAll();}).observe(space);
window.prototypeState={get structure(){return structure},get x(){return x.value},get open(){return p.value},get sheet(){return q.value},get intro(){return intro.value},get index(){return selected},get target(){return p.target}};
const api={get works(){return works},elements:els,get index(){return selected},get open(){return p.value},get sheet(){return q.value},get busy(){return !!drag},get tab(){return tab},set tab(value){tab=value},get listMoved(){return listMoved},chooseWork,layout,goPage,turnPage,get pageInfo(){const e=els[selected];return {page:Math.round(e.pg.target),total:e.total,stride:e.stride};},openReading,closeReading,dismissIntro,lighting,bookmarkIcon:icons.bookmark,setModal(value){modal=value;space.classList.toggle('modal-open',value);},installDaily(indices){indices.forEach((id,slot)=>chooseWork(id,false,slot));x.to(0);}};
phoneReady=true;initialisePhone(api);
setupIntro();document.fonts.ready.then(()=>{fitTitles();layoutAll();});lighting(mode);collectionRows();render();if(intro.value>.01)introTimer=setTimeout(dismissIntro,reduced.matches?1500:4300);
})();
