import {validProgress,berlinDateKey,markWorkRead} from './core/progress.js?v=58';
import {mergeProgress} from './core/drive.js?v=58';
import {parsePicks} from './core/picks.js?v=58';
import {RESERVED_REWARD_IDS} from './core/rewards.js?v=58';
import {rememberGuides} from './core/guide-archive.js?v=58';

export const KEY='bradbury-phone:v1', BACKUP_KEY=KEY+':previous';
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
const safe=x=>!plain(x)&&!Array.isArray(x)||Object.entries(x).every(([k,v])=>!['__proto__','prototype','constructor'].includes(k)&&safe(v));
const date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
export function freshState(today=berlinDateKey()){return {version:1,progress:{version:1,start:'2026-10-18',trackingSince:today,days:{},weeks:{}},positions:{},bookmarks:{},settings:{size:20},daily:null,last:null,arrivalDate:null,dirty:false};}
export function validateState(s,ids){
 try{return plain(s)&&safe(s)&&s.version===1&&validProgress(s.progress)&&plain(s.positions)&&Object.entries(s.positions).every(([id,p])=>ids.has(id)&&plain(p)&&Number.isInteger(p.block)&&p.block>=0&&Number.isInteger(p.character)&&p.character>=0&&Number.isFinite(p.ratio)&&p.ratio>=0&&p.ratio<=1)&&plain(s.bookmarks)&&Object.entries(s.bookmarks).every(([id,b])=>ids.has(id)&&plain(b)&&typeof b.value==='boolean'&&Number.isFinite(Date.parse(b.at)))&&plain(s.settings)&&[18,20,22,24,26].includes(s.settings.size)&&(s.daily===null||(plain(s.daily)&&date(s.daily.date)&&Array.isArray(s.daily.ids)&&s.daily.ids.length===3&&s.daily.ids.every(id=>ids.has(id))))&&(s.last===null||(plain(s.last)&&ids.has(s.last.id)&&typeof s.last.reading==='boolean'))&&(s.arrivalDate===null||date(s.arrivalDate))&&typeof s.dirty==='boolean';}catch{return false;}
}
export function mergeShared(local,remote){
 if(!validProgress(remote))throw Error('The saved history is not a supported Bradbury backup. Your phone copy is unchanged.');
 // The fresh remote copy owns unknown Quest fields. Never discard them on a phone's first sync.
 return {...structuredClone(remote),...mergeProgress(local,remote)};
}
export function acceptDaily(raw,progress,covered,today=berlinDateKey()){
 const parsed=parsePicks(raw,progress.days,{reservedIds:RESERVED_REWARD_IDS});
 if(parsed.problems.length||parsed.works.length!==3||parsed.date>today||!parsed.works.every(w=>covered.has(w.catalogueId)))throw Error(parsed.problems[0]||'Claude’s file needs one supported poem, story and essay. Your previous readings are kept.');
 return parsed;
}
export class PhoneStore{
 constructor(storage,works,onWarning=()=>{}){this.storage=storage;this.works=works;this.ids=new Set(works.map(w=>w.id));this.onWarning=onWarning;this.state=freshState();this.durable=true;this.listeners=[];
  try{const raw=storage.getItem(KEY);if(raw){const value=JSON.parse(raw);if(!validateState(value,this.ids))throw Error('invalid');this.state=value;}}
  catch{this.durable=false;try{const value=JSON.parse(storage.getItem(BACKUP_KEY)||'null');if(validateState(value,this.ids)){this.state=value;this.onWarning('Recovered your previous saved copy. Export a backup before continuing.');}else this.onWarning('Your saved copy could not be opened. It has been kept unchanged; you can restore a backup.');}catch{this.onWarning('Saving is unavailable in this browser. Reading still works; export your progress before closing.');}}
 }
 subscribe(fn){this.listeners.push(fn);}
 update(fn,{shared=false}={}){const next=structuredClone(this.state);fn(next);if(shared){next.dirty=true;next.progress.savedAt=new Date().toISOString();}if(!validateState(next,this.ids))throw Error('The change could not be saved safely.');this.state=next;this.persist();this.listeners.forEach(fn=>fn(this.state));return this.durable;}
 persist(){try{const old=this.storage.getItem(KEY);if(old){try{const parsed=JSON.parse(old);if(validateState(parsed,this.ids))this.storage.setItem(BACKUP_KEY,old);}catch{}}
   this.storage.setItem(KEY,JSON.stringify(this.state));this.durable=true;
  }catch{this.durable=false;this.onWarning('Your latest changes are in this open app only. Export a backup before closing.');}return this.durable;}
 complete(work,clock=new Date()){this.update(s=>markWorkRead(s.progress,work,s.daily?.date,clock),{shared:true});}
 setDaily(parsed){this.update(s=>{s.daily={date:parsed.date,ids:parsed.works.map(w=>w.catalogueId)};const day=s.progress.days[parsed.date]||={};for(const w of parsed.works)if(day.ids?.[w.kind]&&day.ids[w.kind]!==w.catalogueId)day[w.kind]=false;rememberGuides(s.progress,parsed.date,parsed.works);},{shared:true});}
 export(){return JSON.stringify({format:'bradbury-phone-backup',version:1,exportedAt:new Date().toISOString(),state:this.state},null,2);}
 import(raw){if(typeof raw!=='string'||raw.length>8_000_000)throw Error('This backup is too large. Your current copy is unchanged.');const file=JSON.parse(raw);const incoming=file?.format==='bradbury-phone-backup'?file.state:null;
  if(!validateState(incoming,this.ids))throw Error('This is not a valid phone backup. Your current copy is unchanged.');
  const next=structuredClone(this.state);next.progress=mergeShared(next.progress,incoming.progress);
  for(const [id,pos] of Object.entries(incoming.positions))if(!next.positions[id]||(pos.at||'')>(next.positions[id].at||''))next.positions[id]=pos;
  for(const [id,b] of Object.entries(incoming.bookmarks))if(!next.bookmarks[id]||b.at>next.bookmarks[id].at)next.bookmarks[id]=b;
  if(!next.daily||(incoming.daily?.date||'')>next.daily.date)next.daily=incoming.daily;
  if(!next.last)next.last=incoming.last;next.dirty=true;
  if(!validateState(next,this.ids))throw Error('The backup could not be merged. Your current copy is unchanged.');this.state=next;this.persist();this.listeners.forEach(fn=>fn(this.state));
 }
}
