(() => {
  'use strict';
  const P = SubmetaPreset;
  document.getElementById('submeta-presets')?.remove();
  const host = document.createElement('section'); host.id = 'submeta-presets';
  const root = host.attachShadow({mode:'open'});
  // Static extension-owned markup only. Site data is inserted with textContent.
  root.innerHTML = `<style>
    :host{display:block;clear:both;width:100%;box-sizing:border-box;margin:0;color:inherit;font:inherit;color-scheme:dark}
    *{box-sizing:border-box}.panel{padding:16px var(--preset-gutter,16px);background:transparent;border-bottom:1px solid rgba(244,244,247,.12);font-size:14px;line-height:1.6}
    .fields{display:flex;flex-wrap:wrap;align-items:center;gap:12px 24px}
    label{display:flex;align-items:center;gap:8px;white-space:nowrap;color:inherit}.toggle{margin-right:auto;cursor:pointer}
    select,button{font:inherit;color:inherit}select{max-width:100%;min-height:32px;padding:3px 26px 3px 8px;border:1px solid rgba(244,244,247,.2);border-radius:3px;background:#19191c;cursor:pointer}option{background:#19191c;color:#f4f4f7}
    input[type="checkbox"]{appearance:none;-webkit-appearance:none;display:grid;place-content:center;flex:none;width:15px;height:15px;margin:0;border:1px solid #77777e;border-radius:2px;background:transparent;cursor:pointer}
    input[type="checkbox"]:checked{background:#b8b8bf;border-color:#b8b8bf}
    input[type="checkbox"]::before{content:"";width:8px;height:5px;border-left:2px solid #19191c;border-bottom:2px solid #19191c;transform:translateY(-1px) rotate(-45deg);visibility:hidden}
    input[type="checkbox"]:checked::before{visibility:visible}
    @media(forced-colors:active){input[type="checkbox"]{appearance:auto}input[type="checkbox"]::before{display:none}}button{padding:0;background:none;border:0;text-decoration:underline;text-underline-offset:3px;cursor:pointer}
    details{margin-top:10px;font-size:12px;color:rgba(244,244,247,.6)}summary{cursor:pointer;width:fit-content}summary:hover,button:hover{color:#f4f4f7}
    .status{display:flex;gap:4px 20px;flex-wrap:wrap;margin-top:8px}.actions{display:flex;flex-wrap:wrap;gap:16px;margin-top:8px}.hint{margin:8px 0 0;max-width:70ch}
    button:disabled,select:disabled{opacity:.4;cursor:default}:focus-visible{outline:2px solid #b8b8bf;outline-offset:3px}
    @media(max-width:640px){.fields{gap:10px 16px}.toggle{flex-basis:100%}.panel{padding-top:12px;padding-bottom:12px}label{font-size:13px}select{max-width:190px}}
  </style><div class="panel" role="region" aria-label="재생 기본 설정">
    <div class="fields"><label class="toggle" title="저장한 설정을 다음 영상에도 자동으로 적용합니다"><input id="enabled" type="checkbox">재생 설정 유지</label>
    <label>배속<select id="rate"><option value="leave">기본값</option><option value="0.5">0.5×</option><option value="0.75">0.75×</option><option value="1">1×</option><option value="1.25">1.25×</option><option value="1.5">1.5×</option><option value="1.75">1.75×</option><option value="2">2×</option></select></label>
    <label>CC<select id="captions"><option value="leave">기본값</option><option value="on">켜기</option><option value="off">끄기</option></select></label>
    <label>언어<select id="language"><option value="ko">한국어</option></select></label></div>
    <details><summary>저장 및 적용 상태</summary>
    <div class="status" aria-live="polite"><span id="saved">저장값 불러오는 중</span><span id="speedStatus">배속: 대기</span><span id="captionStatus">자막: 대기</span></div>
    <div class="actions"><button id="suspend">현재 영상만 해제</button><button id="retry">다시 적용</button></div>
    <p class="hint">변경한 설정은 현재 영상에 바로 적용되고 이 브라우저에 저장됩니다. 설정 유지 중에는 플레이어에서 바꾼 값도 저장한 설정으로 돌아갑니다.</p>
    </details>
  </div>`;
  const $ = id => root.getElementById(id);
  let prefs = {...P.defaults}, loaded = false, frame, frameSrc = '', path = '', token = '', frameId, suspended = false;
  let labels = [], bindTimer, bindAttempts = 0, scanTimer, saveChain = Promise.resolve(), pendingSaves = 0;
  const ownRevisions=new Set();
  const text = (id,value) => { if ($(id).textContent !== value) $(id).textContent = value; };
  function languageOptions() {
    const values = labels.filter(l=>l !== 'Off').map(label=>({label,value:Object.keys(P.languages).find(k=>P.languages[k]===label) || label}));
    if (!values.some(x=>x.value===prefs.language)) values.unshift({value:prefs.language,label:(P.languages[prefs.language] || prefs.language) + (labels.length ? ' — 이 영상 미제공' : ' — 목록 미확인')});
    $('language').replaceChildren(...values.map(item=>{const o=document.createElement('option');o.value=item.value;o.textContent=item.label;return o;}));
    $('language').value=prefs.language;
  }
  function render() {
    $('enabled').checked=prefs.enabled; $('rate').value=prefs.manageSpeed ? String(prefs.rate) : 'leave';
    $('captions').value=prefs.captions; languageOptions(); $('language').disabled=prefs.captions !== 'on';
    $('suspend').textContent=suspended ? '현재 영상 자동 적용 재개' : '현재 영상만 해제';
    $('suspend').disabled=!prefs.enabled || !frameId;
  }
  async function configure(retry=false,applyNow=false) {
    if (!loaded || !frameId) return;
    const current=token;
    try {
      const r=await browser.runtime.sendMessage({app:'submeta-preset',type:'relay',frameId,token,prefs,suspended,retry,applyNow});
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
    const container=f.closest('[class*="VideoContent"][class*="__stage"]') || f.closest('[class*="VideoContent"][class*="__player"]') || f.closest('[class*="MasterPlayer"]') || f.parentElement;
    if (host.previousElementSibling!==container) container.after(host);
    // Match the site's lesson text gutter, including its responsive layout.
    const details=document.querySelector('[class*="VideoDetails"][class*="__details"]');
    if(details) host.style.setProperty('--preset-gutter',getComputedStyle(details).paddingLeft);
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
    const next={...prefs}; pendingSaves++;ownRevisions.add(next.revision);
    if(ownRevisions.size>128)ownRevisions.delete(ownRevisions.values().next().value);
    if(id!=='enabled'){suspended=false;configure(true,true);}else configure(true);
    render();text('saved','저장 중…');
    saveChain=saveChain.catch(()=>{}).then(()=>browser.storage.local.set({[P.key]:next})).then(()=>{
      if (prefs.revision===next.revision) {text('saved','저장됨 · 이 브라우저에 유지');}
    }).catch(()=>text('saved','저장 실패 · 다시 변경해 주세요')).finally(()=>{pendingSaves--;});
  });
  $('suspend').addEventListener('click',()=>{suspended=!suspended;render();configure(true);});
  $('retry').addEventListener('click',()=>{if (!frameId){bindAttempts=0;bind();}else configure(true);});
  browser.storage.onChanged.addListener((changes,area)=>{
    if(area!=='local'||!changes[P.key])return;
    // Firefox can deliver our storage event after set() has resolved.
    // Do not reset an in-flight live edit when its own revision comes back.
    if(ownRevisions.delete(changes[P.key].newValue?.revision) || changes[P.key].newValue?.revision===prefs.revision || pendingSaves)return;
    prefs=P.normalize(changes[P.key].newValue);render();text('saved','저장됨 · 이 브라우저에 유지');configure(true);
  });
  browser.storage.local.get(P.key).then(value=>{prefs=P.normalize(value[P.key]);loaded=true;render();text('saved',value[P.key]?'저장됨 · 이 브라우저에 유지':'설정을 변경하면 자동 저장');scan();configure();}).catch(()=>text('saved','설정 읽기 실패 · 새로고침해 주세요'));
  const observer=new MutationObserver(()=>{if(!scanTimer)scanTimer=setTimeout(()=>{scanTimer=undefined;scan();},150);});
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['src']});
  window.addEventListener('resize',scan);window.addEventListener('popstate',scan);window.addEventListener('pageshow',scan);
  scan();
})();
