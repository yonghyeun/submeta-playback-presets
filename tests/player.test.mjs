import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const base=new URL('../extension/',import.meta.url);
const events={},videoEvents={},statuses=[];
const parent={};const timers=new Set();
const later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);return id;};
let receive;
const video={isConnected:true,readyState:4,playbackRate:1,textTracks:[],
  addEventListener:(type,fn)=>videoEvents[type]=fn,removeEventListener:()=>{}};
let captionMock=null,options=[];
const context=vm.createContext({
  PointerEvent:class{constructor(type){this.type=type;}},KeyboardEvent:class{constructor(type){this.type=type;}},
  setTimeout:later,clearTimeout:id=>{clearTimeout(id);timers.delete(id);},console,
  window:{parent,addEventListener:(type,fn)=>events[type]=fn},
  document:{documentElement:{},querySelector:selector=>selector==='video'?video:null,querySelectorAll:selector=>selector==='[role="combobox"]'?(captionMock?[captionMock]:[]):selector==='[role="option"]'?options:[],getElementById:()=>null},
  MutationObserver:class{observe(){}disconnect(){}},
  browser:{runtime:{sendMessage:async m=>statuses.push(m),onMessage:{addListener:fn=>receive=fn}}}
});
vm.runInContext(await readFile(new URL('shared.js',base),'utf8'),context);
vm.runInContext(await readFile(new URL('player.js',base),'utf8'),context);
const pause=()=>new Promise(r=>setTimeout(r,850));
const bind={app:'submeta-preset',type:'bind',token:'test'};
events.message({source:parent,origin:'https://evil.example',data:bind});
assert.equal(statuses.length,0,'Reject non-Submeta parent origin');
events.message({source:parent,origin:'https://submeta.io',data:bind});
const configure=(prefs,more={})=>receive({app:'submeta-preset',type:'configure',token:'test',prefs:{captions:'leave',...prefs},...more});
await configure({enabled:false,rate:1.25,revision:'a'});await new Promise(r=>setTimeout(r,1050));assert.equal(video.playbackRate,1);
await configure({enabled:true,rate:1.25,revision:'b'});await pause();assert.equal(video.playbackRate,1.25);
await configure({enabled:true,rate:1.25,revision:'b'},{suspended:true,retry:true});video.playbackRate=0.5;videoEvents.ratechange();await pause();assert.equal(video.playbackRate,0.5,'Current-video suspension preserves manual speed');
videoEvents.loadstart();await new Promise(r=>setTimeout(r,1050));assert.equal(video.playbackRate,1.25,'Next media resumes stored speed');
await configure({enabled:false,rate:1,revision:'c'});await pause();assert.equal(video.playbackRate,1.25,'Disabling must not reset actual speed');
await configure({enabled:false,rate:1.5,revision:'instant'},{applyNow:true,retry:true});
await new Promise(r=>setTimeout(r,120));assert.equal(video.playbackRate,1.5,'Explicit edit applies immediately even with persistence disabled');
video.playbackRate=1;videoEvents.ratechange();await pause();assert.equal(video.playbackRate,1,'One-time edit does not enable ongoing enforcement');
await configure({enabled:true,rate:1.25,revision:'d'},{retry:true});
for(let i=0;i<4;i++){video.playbackRate=1;videoEvents.ratechange();await pause();}
assert.equal(video.playbackRate,1,'Stop correcting after 3 repeated conflicts');
assert.ok(statuses.some(m=>m.speed?.includes('반복 충돌')));
// Simulate the observed caption menu to verify one-time live edits without reload.
let expanded=false,currentCaption='Off';
video.textTracks=[{mode:'disabled'}];
captionMock={isConnected:true,get textContent(){return 'Captions:'+currentCaption;},
  getAttribute:key=>key==='aria-expanded'?String(expanded):null,
  dispatchEvent:event=>{expanded=event.type!=='keydown';},click:()=>{expanded=true;}};
options=['Off','한국어','English'].map(label=>({textContent:label,getClientRects:()=>[{}],getAttribute:()=>null,
  dispatchEvent:event=>{if(event.type==='keydown')expanded=false;},click:()=>{currentCaption=label;video.textTracks[0].mode=label==='Off'?'disabled':'showing';expanded=false;}}));
await configure({enabled:false,manageSpeed:false,captions:'on',language:'ko',revision:'cc-live'},{applyNow:true,retry:true});
await pause();assert.equal(currentCaption,'한국어','Caption edit applies to the current video with retention disabled');
await configure({enabled:false,manageSpeed:false,captions:'off',revision:'cc-off'},{applyNow:true,retry:true});
await pause();assert.equal(currentCaption,'Off','Caption off applies without reload');
for(const id of timers)clearTimeout(id);
export const result='Passed: player origin isolation, disabled behavior, current-video suspension, next-media resume, conflict cutoff, immediate speed/caption edits with retention disabled.';
