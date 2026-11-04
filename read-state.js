// Phone-only completion edits. Keep explicit undo records across stale backups.
// The unchanged Quest source modules remain read-only reference copies.
import {canonicalWorkId,validCompletion,workRead as legacyWorkRead,berlinDateKey,KINDS} from './core/progress.js?v=58';

const plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const record=x=>plain(x)&&typeof x.value==='boolean'&&validCompletion('reading',x.at)&&typeof x.op==='string'&&/^[a-zA-Z0-9:_-]{1,150}$/.test(x.op);
const slotKey=(day,kind,id)=>`${day}|${kind}|${id}`;
function slot(key){const [day,kind,id,...extra]=key.split('|');return !extra.length&&KINDS.includes(kind)&&validCompletion(id,day+'T00:00:00.000Z')?{day,kind,id}:null;}
// Resolve explicit edits independently of an unrelated later savedAt.
function winner(a,b){if(!a)return b;if(!b)return a;const order=Date.parse(a.at)-Date.parse(b.at)||(a.op>b.op?1:a.op<b.op?-1:0);return order>0?a:order<0?b:!a.value?a:b;}
function mergeMap(a,b){const out={};for(const key of new Set([...Object.keys(a||{}),...Object.keys(b||{})]))out[key]=structuredClone(winner(a?.[key],b?.[key]));return out;}
export function validReadState(progress){return (progress.phoneReadState===undefined||plain(progress.phoneReadState)&&Object.entries(progress.phoneReadState).every(([id,r])=>record(r)&&validCompletion(id,r.at)))&&(progress.phoneReadUndos===undefined||plain(progress.phoneReadUndos)&&Object.entries(progress.phoneReadUndos).every(([id,r])=>record(r)&&r.value===false&&validCompletion(id,r.at)))&&(progress.phoneReadDays===undefined||plain(progress.phoneReadDays)&&Object.entries(progress.phoneReadDays).every(([key,r])=>!!slot(key)&&record(r)));}

export function projectReadState(progress){
 // Keep the last undo even after a re-read: an older historical day can arrive later.
 for(const [id,r] of Object.entries(progress.phoneReadState||{}))if(!r.value)(progress.phoneReadUndos||={})[id]=structuredClone(winner(progress.phoneReadUndos[id],r));
 for(const [id,r] of Object.entries(progress.phoneReadUndos||{})){
  (progress.phoneReadState||={})[id]=structuredClone(winner(progress.phoneReadState[id],r));
  for(const [day,d] of Object.entries(progress.days||{}))for(const kind of KINDS)if(d.ids?.[kind]===id){const key=slotKey(day,kind,id);(progress.phoneReadDays||={})[key]=structuredClone(winner(progress.phoneReadDays[key],r));}
 }
 for(const [id,r] of Object.entries(progress.phoneReadState||{})){
  if(r.value)(progress.completedWorks||={})[id]=r.at;
  else if(progress.completedWorks)delete progress.completedWorks[id];
 }
 for(const [key,r] of Object.entries(progress.phoneReadDays||{})){const {day,kind,id}=slot(key),d=progress.days?.[day];if(d?.ids?.[kind]===id)d[kind]=progress.phoneReadState?.[id]?.value===false?false:r.value;}
 return progress;
}
export function mergeReadState(out,a,b){for(const name of ['phoneReadState','phoneReadUndos','phoneReadDays'])if(a[name]||b[name])out[name]=mergeMap(a[name],b[name]);return projectReadState(out);}
export function readStateNeedsSync(resolved,remote){
 for(const name of ['phoneReadState','phoneReadUndos','phoneReadDays'])for(const [key,r] of Object.entries(resolved[name]||{})){const other=remote[name]?.[key];if(!other||other.value!==r.value||other.at!==r.at||other.op!==r.op)return true;}
 for(const id of Object.keys(resolved.phoneReadState||{}))if(remote.completedWorks?.[id]!==resolved.completedWorks?.[id])return true;
 for(const key of Object.keys(resolved.phoneReadDays||{})){const {day,kind,id}=slot(key);if(remote.days?.[day]?.ids?.[kind]===id&&remote.days[day][kind]!==resolved.days?.[day]?.[kind])return true;}
 return false;
}
export function workRead(progress,work){const id=canonicalWorkId(work),r=progress.phoneReadState?.[id];return r?r.value:legacyWorkRead(progress,work);}
export function setWorkRead(progress,work,value,day,clock=new Date()){
 const id=canonicalWorkId(work),now=new Date(clock);if(!id||!KINDS.includes(work.kind)||typeof value!=='boolean'||!Number.isFinite(+now)||workRead(progress,work)===value)return false;
 const observed=[progress.phoneReadState?.[id]?.at,progress.phoneReadUndos?.[id]?.at,...Object.entries(progress.phoneReadDays||{}).filter(([key])=>slot(key)?.id===id).map(([,r])=>r.at)].filter(Boolean).map(Date.parse);
 const at=new Date(Math.max(+now,...observed.map(n=>n+1))).toISOString();const op=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;const edit={value,at,op};
 (progress.phoneReadState||={})[id]=edit;
 if(value){const assigned=progress.days?.[day];if(day<=berlinDateKey(now)&&assigned?.ids?.[work.kind]===id)(progress.phoneReadDays||={})[slotKey(day,work.kind,id)]={...edit};}
 else for(const [date,d] of Object.entries(progress.days||{}))for(const kind of KINDS)if(d.ids?.[kind]===id)(progress.phoneReadDays||={})[slotKey(date,kind,id)]={...edit};
 projectReadState(progress);return true;
}
