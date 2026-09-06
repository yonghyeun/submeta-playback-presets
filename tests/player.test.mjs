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
const context=vm.createContext({
  setTimeout:later,clearTimeout:id=>{clearTimeout(id);timers.delete(id);},console,
  window:{parent,addEventListener:(type,fn)=>events[type]=fn},
  document:{documentElement:{},querySelector:selector=>selector==='video'?video:null,querySelectorAll:()=>[]},
  MutationObserver:class{observe(){}disconnect(){}},
  browser:{runtime:{sendMessage:async m=>statuses.push(m),onMessage:{addListener:fn=>receive=fn}}}
});
vm.runInContext(await readFile(new URL('shared.js',base),'utf8'),context);
vm.runInContext(await readFile(new URL('player.js',base),'utf8'),context);
const pause=()=>new Promise(r=>setTimeout(r,180));
const bind={app:'submeta-preset',type:'bind',token:'test'};
events.message({source:parent,origin:'https://evil.example',data:bind});
assert.equal(statuses.length,0,'Reject non-Submeta parent origin');
events.message({source:parent,origin:'https://submeta.io',data:bind});
const configure=(prefs,more={})=>receive({app:'submeta-preset',type:'configure',token:'test',prefs:{captions:'leave',...prefs},...more});
await configure({enabled:false,rate:1.25,revision:'a'});await pause();assert.equal(video.playbackRate,1);
await configure({enabled:true,rate:1.25,revision:'b'});await pause();assert.equal(video.playbackRate,1.25);
await configure({enabled:true,rate:1.25,revision:'b'},{suspended:true,retry:true});video.playbackRate=0.5;videoEvents.ratechange();await pause();assert.equal(video.playbackRate,0.5,'Current-video suspension preserves manual speed');
videoEvents.loadstart();await pause();assert.equal(video.playbackRate,1.25,'Next media resumes stored speed');
await configure({enabled:false,rate:1,revision:'c'});await pause();assert.equal(video.playbackRate,1.25,'Disabling must not reset actual speed');
await configure({enabled:true,rate:1.25,revision:'d'},{retry:true});
for(let i=0;i<4;i++){video.playbackRate=1;videoEvents.ratechange();await pause();}
assert.equal(video.playbackRate,1,'Stop correcting after 3 repeated conflicts');
assert.ok(statuses.some(m=>m.speed?.includes('반복 충돌')));
for(const id of timers)clearTimeout(id);
export const result='Passed: player origin isolation, disabled behavior, current-video suspension, next-media resume, conflict cutoff.';
