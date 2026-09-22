// Entirely local responses at the production origins: no Submeta login or media.
export const lessonURL='https://submeta.io/@tester/courses/fixture/lesson-1';
export const lesson=`<!doctype html><html><head><style>
body{margin:0;background:#19191c;color:#f4f4f7;font:16px/1.6 sans-serif}
.VideoContent__stage{height:280px;background:#0d0d0e}iframe{width:100%;height:100%;border:0}
.VideoDetails__details{max-width:820px;margin:auto;padding:32px;box-sizing:border-box}button{margin:4px}
@media(max-width:600px){.VideoDetails__details{padding:24px 20px 24px 16px}}
</style></head><body><main><div class="VideoContent__stage"><iframe src="https://iframe.cloudflarestream.com/fixture-1"></iframe></div>
<div class="VideoDetails__details"><h1>Local lesson fixture</h1>
<button id="next">Next lesson</button><button id="replace">Replace frame</button><button id="remove">Remove player</button></div></main>
<script>
let n=1;
document.querySelector('#next').onclick=()=>{n++;history.pushState({},'', '/@tester/courses/fixture/lesson-'+n);document.querySelector('iframe').src='https://iframe.cloudflarestream.com/fixture-'+n;};
document.querySelector('#replace').onclick=()=>{const old=document.querySelector('iframe');old.replaceWith(old.cloneNode());};
document.querySelector('#remove').onclick=()=>document.querySelector('iframe').remove();
</script></body></html>`;
export const player=`<!doctype html><html><body>
<video controls preload="auto" src="/sample.wav" style="height:100px"></video>
<button role="combobox" aria-label="Captions" aria-expanded="false" aria-controls="choices">Captions:Off</button>
<div id="choices" hidden></div>
<script>
const video=document.querySelector('video');
const track=video.addTextTrack('subtitles','Fixture captions','');track.mode='disabled';
track.addCue(new VTTCue(0,30,'Test caption'));
const combo=document.querySelector('[role=combobox]'),list=document.querySelector('#choices');
const languages=location.pathname.includes('english-only')?['Off','English']:['Off','한국어','English'];
for(const label of languages){const option=document.createElement('button');option.setAttribute('role','option');option.textContent=label;
option.onclick=()=>{track.mode=label==='Off'?'disabled':'showing';combo.textContent='Captions:'+label;close();};list.append(option);}
function close(){combo.setAttribute('aria-expanded','false');list.hidden=true;}
combo.onclick=()=>{combo.setAttribute('aria-expanded','true');list.hidden=false;};
combo.onpointerdown=combo.onclick;
document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
if(location.pathname.includes('no-captions'))combo.remove();
</script></body></html>`;
function wav(){
  const size=8000*2*30,b=Buffer.alloc(44+size);b.write('RIFF');b.writeUInt32LE(36+size,4);b.write('WAVEfmt ',8);
  b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(8000,24);
  b.writeUInt32LE(16000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(size,40);return b;
}
const sample=wav();
export async function routeSite(context){
  await context.route('**/*',async route=>{
    const u=new URL(route.request().url());
    if(u.hostname==='submeta.io')return route.fulfill({contentType:'text/html; charset=utf-8',body:lesson});
    if(u.hostname==='iframe.cloudflarestream.com')return route.fulfill(u.pathname==='/sample.wav'?{contentType:'audio/wav',body:sample}:{contentType:'text/html; charset=utf-8',body:player});
    return route.abort();
  });
}
