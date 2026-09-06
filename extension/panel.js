(() => {
  'use strict';
  const P = SubmetaPreset;
  document.getElementById('submeta-presets')?.remove();
  const host = document.createElement('section'); host.id = 'submeta-presets';
  const root = host.attachShadow({mode:'open'});
  // Static extension-owned markup only. Site data is inserted with textContent.
  root.innerHTML = `<style>
    :host{display:block;clear:both;width:100%;box-sizing:border-box;margin:16px 0;color:#edf3f0;font:14px/1.5 system-ui,sans-serif;color-scheme:dark}
    *{box-sizing:border-box}.panel{background:#17221f;border:1px solid #34463f;border-radius:12px;padding:18px 22px}
    header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px}h2{font-size:16px;letter-spacing:.01em;margin:0}small{color:#a5b8ae}
    .fields{display:flex;flex-wrap:wrap;gap:14px 24px;align-items:end}label{display:flex;flex-direction:column;gap:6px;font-size:13px;color:#b9c9c0}.toggle{flex-direction:row;align-items:center;color:#edf3f0}
    select,button{font:inherit;border:1px solid #4a5d54;border-radius:7px;background:#23372e;color:#fff;padding:8px 12px;min-height:38px}select{min-width:135px}button{cursor:pointer}button:hover{background:#345543}input{accent-color:#76dda1;width:17px;height:17px}
    .status{display:flex;gap:10px 24px;flex-wrap:wrap;margin-top:16px;padding-top:12px;border-top:1px solid #34463f;font-size:13px}.actions{display:flex;gap:8px;margin-top:12px}.hint{margin:12px 0 0;font-size:12px;color:#a5b8ae}button:disabled,select:disabled{opacity:.5;cursor:default}:focus-visible{outline:2px solid #86edb1;outline-offset:3px}
    @media(max-width:600px){.panel{padding:16px}header{align-items:start}.fields>label{flex:1}select{width:100%}}
  </style><div class="panel">
    <header><div><h2>재생 기본 설정</h2><small>다음 영상에도 같은 설정으로</small></div><label class="toggle"><input id="enabled" type="checkbox">자동 적용</label></header>
    <div class="fields"><label>배속<select id="rate"><option value="leave">변경하지 않기</option>${[0.5,0.75,1,1.25,1.5,1.75,2].map(v=>`<option value="${v}">${v}배</option>`).join('')}</select></label>
    <label>CC 자막<select id="captions"><option value="leave">변경하지 않기</option><option value="on">켜기</option><option value="off">끄기</option></select></label>
    <label>자막 언어<select id="language"><option value="ko">한국어 — 목록 확인 중</option></select></label></div>
    <div class="status" aria-live="polite"><span id="saved">저장값 불러오는 중</span><span id="speedStatus">배속: 대기</span><span id="captionStatus">자막: 대기</span></div>
    <div class="actions"><button id="suspend">현재 영상만 해제</button><button id="retry">다시 적용</button></div>
    <p class="hint">변경하면 자동 저장됩니다. 자동 적용 중에는 플레이어의 수동 변경이 저장값으로 돌아갈 수 있습니다.</p>
  </div>`;
  const $ = id => root.getElementById(id);
  let prefs = {...P.defaults}, loaded = false, frame, frameSrc = '', path = '', token = '', frameId, suspended = false;
  let labels = [], bindTimer, bindAttempts = 0, scanTimer, saveChain = Promise.resolve(), pendingSaves = 0;
  const text = (id,value) => { if ($(id).textContent !== value) $(id).textContent = value; };
  function languageOptions() {
    const values = labels.filter(l=>l !== 'Off').map(label=>({label,value:Object.keys(P.languages).find(k=>P.languages[k]===label) || label}));
    if (!values.some(x=>x.value===prefs.language)) values.unshift({value:prefs.language,label:(P.languages[prefs.language] || prefs.language) + (labels.length ? ' — 이 영상 미제공' : ' — 목록 확인 중')});
    $('language').replaceChildren(...values.map(item=>{const o=document.createElement('option');o.value=item.value;o.textContent=item.label;return o;}));
    $('language').value=prefs.language;
  }
  function render() {
    $('enabled').checked=prefs.enabled; $('rate').value=prefs.manageSpeed ? String(prefs.rate) : 'leave';
    $('captions').value=prefs.captions; languageOptions(); $('language').disabled=prefs.captions !== 'on';
    $('suspend').textContent=suspended ? '현재 영상 자동 적용 재개' : '현재 영상만 해제';
    $('suspend').disabled=!prefs.enabled || !frameId;
  }
  async function configure(retry=false) {
    if (!loaded || !frameId) return;
    const current=token;
    try {
      const r=await browser.runtime.sendMessage({app:'submeta-preset',type:'relay',frameId,token,prefs,suspended,retry});
      if (current===token && r?.unavailable) {frameId=undefined; bindAttempts=0; bind();}
    } catch {text('captionStatus','플레이어 연결 끊김 — 페이지를 새로고침해 주세요');}
  }
  function bind() {
    clearTimeout(bindTimer);
    if (!frame?.isConnected || frameId || ++bindAttempts>30) return;
    frame.contentWindow.postMessage({app:'submeta-preset',type:'bind',token},'https://iframe.cloudflarestream.com');
    bindTimer=setTimeout(bind,500);
  }
  function scan() {
    const course=/^\/[^/]+\/courses\/[^/]+\/[^/]+/.test(location.pathname);
    const matches=[...document.querySelectorAll('iframe')].filter(f=>{try{return new URL(f.src).origin==='https://iframe.cloudflarestream.com';}catch{return false;}});
    const f=course && matches.length===1 ? matches[0] : null;
    if (!f) {host.remove();frame=null;frameId=undefined;token='';clearTimeout(bindTimer);return;}
    // The observed player wrapper includes next/previous controls. Place outside it.
    const container=f.closest('[class*="VideoContent"][class*="__player"]') || f.closest('[class*="MasterPlayer"]') || f.parentElement;
    if (host.previousElementSibling!==container) container.after(host);
    if (frame!==f || frameSrc!==f.src || path!==location.pathname) {
      frame=f;frameSrc=f.src;path=location.pathname;token=crypto.randomUUID();frameId=undefined;suspended=false;labels=[];bindAttempts=0;
      text('speedStatus','배속: 플레이어 확인 중');text('captionStatus','자막: 플레이어 확인 중');render();bind();
    }
  }
  browser.runtime.onMessage.addListener(m=>{
    if (m?.app!=='submeta-preset' || m.token!==token) return;
    if (m.type==='bound') {frameId=m.frameId;clearTimeout(bindTimer);render();configure();}
    if (m.type==='status' && m.frameId===frameId) {
      if (m.labels?.length && JSON.stringify(labels)!==JSON.stringify(m.labels)) {labels=m.labels;languageOptions();}
      if (typeof m.suspended==='boolean' && m.suspended!==suspended) {suspended=m.suspended;render();}
      text('speedStatus',`배속: ${m.speed}`);text('captionStatus',`자막: ${m.captions}`);
    }
  });
  for (const id of ['enabled','rate','captions','language']) $(id).addEventListener('change',()=>{
    if (!loaded) return;
    prefs=P.normalize({...prefs,enabled:$('enabled').checked,manageSpeed:$('rate').value!=='leave',rate:$('rate').value==='leave'?prefs.rate:Number($('rate').value),captions:$('captions').value,language:$('language').value,revision:crypto.randomUUID()});
    const next={...prefs}; pendingSaves++;render();text('saved','저장 중…');
    saveChain=saveChain.catch(()=>{}).then(()=>browser.storage.local.set({[P.key]:next})).then(()=>{
      if (prefs.revision===next.revision) {text('saved','저장됨 · 이 브라우저에 유지');configure(true);}
    }).catch(()=>text('saved','저장 실패 · 다시 변경해 주세요')).finally(()=>{pendingSaves--;});
  });
  $('suspend').addEventListener('click',()=>{suspended=!suspended;render();configure(true);});
  $('retry').addEventListener('click',()=>{if (!frameId){bindAttempts=0;bind();}else configure(true);});
  browser.storage.onChanged.addListener((changes,area)=>{
    if(area!=='local'||!changes[P.key])return;
    if(pendingSaves && changes[P.key].newValue?.revision!==prefs.revision)return;
    prefs=P.normalize(changes[P.key].newValue);render();text('saved','저장됨 · 이 브라우저에 유지');configure(true);
  });
  browser.storage.local.get(P.key).then(value=>{prefs=P.normalize(value[P.key]);loaded=true;render();text('saved',value[P.key]?'저장됨 · 이 브라우저에 유지':'설정을 변경하면 자동 저장');scan();configure();}).catch(()=>text('saved','설정 읽기 실패 · 새로고침해 주세요'));
  const observer=new MutationObserver(()=>{if(!scanTimer)scanTimer=setTimeout(()=>{scanTimer=undefined;scan();},150);});
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
  window.addEventListener('popstate',scan);window.addEventListener('pageshow',scan);
  scan();
})();
