import {DriveLink} from './core/drive.js?v=58';
import {validProgress,berlinDateKey} from './core/progress.js?v=58';
import {acceptDaily,mergeShared} from './state.js';
import {rememberGuides} from './core/guide-archive.js?v=58';
import {readStateNeedsSync} from './read-state.js';
const clientId='379320678298-n7emu1el4qc84v3gepk0tn82rra4jglr.apps.googleusercontent.com';
const namespaced={getItem:k=>sessionStorage.getItem('bradbury-phone:'+k),setItem:(k,v)=>sessionStorage.setItem('bradbury-phone:'+k,v),removeItem:k=>sessionStorage.removeItem('bradbury-phone:'+k)};
export class PhoneConnection{
 constructor(store,onStatus,link){this.store=store;this.status=onStatus;this.link=link||new DriveLink({clientId,storage:namespaced});this.busy=null;this.lastCheck=null;this.revision=0;this.covered=store.ids;this.stopped=false;}
 get connected(){return this.link.connected;}
 async connect(){this.status('Connecting to Google Drive…');await this.link.signIn();return this.sync();}
 sync(){if(this.busy){this.resyncRequested=true;return this.busy;}this.busy=(async()=>{let note;do{this.resyncRequested=false;note=await this.run();}while(this.resyncRequested&&this.connected);return note;})().finally(()=>this.busy=null);return this.busy;}
 async run(){if(!this.connected)throw Error('Tap Sync with Drive to connect. Your readings are kept here.');this.status('Checking Claude’s latest three…');
  // Read before every write. Failed/malformed remote reads never become an empty backup.
  const remoteRaw=await this.link.read('progress.json');let remote=null;
  if(remoteRaw!==null){try{remote=JSON.parse(remoteRaw);}catch{throw Error('The Drive backup could not be read. Your phone copy is safe; nothing was overwritten.');}if(!validProgress(remote))throw Error('The Drive backup needs checking. Your phone copy is safe; nothing was overwritten.');
   this.store.update(s=>{s.progress=mergeShared(s.progress,remote);if(readStateNeedsSync(s.progress,remote))s.dirty=true;});}
  const result=await this.link.readPicksFor(berlinDateKey(),raw=>{try{return acceptDaily(raw,this.store.state.progress,this.covered);}catch(error){let date=null;try{date=JSON.parse(raw).date;}catch{}return{date,works:[],problems:[error.message]};}});
  let note='Connected. Ask Claude for the daily three as usual.';
  if(result){const parsed=result.parsed;const accepted=parsed.works.length===3&&!parsed.problems.length&&parsed.date<=berlinDateKey();this.lastCheck={accepted,date:parsed.date,problems:parsed.problems};this.link.lastCheck=this.lastCheck;
   if(accepted){const ids=parsed.works.map(w=>w.catalogueId),notesChanged=rememberGuides(structuredClone(this.store.state.progress),parsed.date,parsed.works);if(this.store.state.daily?.date!==parsed.date||JSON.stringify(this.store.state.daily.ids)!==JSON.stringify(ids)||notesChanged)this.store.setDaily(parsed);note=parsed.date===berlinDateKey()?'Today’s three are here.':`Latest three: ${parsed.date}. Ask Claude for today’s readings.`;}
   else{note='Claude’s latest file needs a correction. Your previous readings are kept.';this.store.update(s=>s.dirty=true);}
  }
  if(this.store.state.dirty||!remote){
   // Re-read immediately before writing, preserving unrelated Quest data and newer remote edits.
   const latestRaw=await this.link.read('progress.json');let latest=remote;
   if(latestRaw!==null){try{latest=JSON.parse(latestRaw);}catch{throw Error('The Drive backup changed unexpectedly. Nothing was overwritten.');}if(!validProgress(latest))throw Error('The Drive backup changed unexpectedly. Nothing was overwritten.');}
   const sent=latest?mergeShared(this.store.state.progress,latest):structuredClone(this.store.state.progress);sent.savedAt=new Date().toISOString();const before=JSON.stringify(this.store.state.progress);
   await this.link.writeProgress(JSON.stringify(sent));
   this.store.update(s=>{s.progress=mergeShared(s.progress,sent);if(JSON.stringify(s.progress)===JSON.stringify(sent)||JSON.stringify(this.store.state.progress)===before)s.dirty=false;});
  }
  this.status(note);return note;
 }
 disconnect(){this.link.signOut();this.status('Disconnected. All readings and phone progress are kept.');}
 start(){this.timer=setInterval(()=>{if(!this.stopped&&!document.hidden&&this.connected)this.sync().catch(e=>this.status(e.message));},60_000);}
 stop(){this.stopped=true;clearInterval(this.timer);}
}
