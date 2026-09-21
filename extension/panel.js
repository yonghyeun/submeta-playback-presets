(() => {
  'use strict';
  const P = SubmetaPreset;
  document.getElementById('submeta-presets')?.remove();
  const host = document.createElement('section'); host.id = 'submeta-presets';
  const root = host.attachShadow({mode:'open'});
  const view = SubmetaUI.mountPlaybackSettings(root, {actions: {
    change: (id, values) => changePreference(id, values),
    suspend: () => {suspended=!suspended;render();configure(true);},
    retry: () => {if (!frameId){bindAttempts=0;bind();}else configure(true);}
  }});
  let prefs = {...P.defaults}, loaded = false, frame, frameSrc = '', path = '', token = '', frameId, suspended = false;
  let labels = [], bindTimer, bindAttempts = 0, scanTimer, saveChain = Promise.resolve(), pendingSaves = 0;
  const ownRevisions=new Set();
  const text = view.setText;
  function languageOptions() {
    const values = labels.filter(l=>l !== 'Off').map(label=>({label,value:Object.keys(P.languages).find(k=>P.languages[k]===label) || label}));
    if (!values.some(x=>x.value===prefs.language)) values.unshift({value:prefs.language,label:(P.languages[prefs.language] || prefs.language) + (labels.length ? ' — 이 영상 미제공' : ' — 목록 미확인')});
    return values;
  }
  function render() {
    view.update({prefs, languages:languageOptions(), loading:!loaded, connected:Boolean(frameId), suspended});
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
      if (m.labels?.length && JSON.stringify(labels)!==JSON.stringify(m.labels)) {labels=m.labels;render();}
      if (typeof m.suspended==='boolean' && m.suspended!==suspended) {suspended=m.suspended;render();}
      text('speedStatus',`배속: ${m.speed}`);text('captionStatus',`자막: ${m.captions}`);
    }
  });
  function changePreference(id, values) {
    if (!loaded) return;
    prefs=P.normalize({...prefs,...values,rate:values.rate==='leave'?prefs.rate:Number(values.rate),revision:crypto.randomUUID()});
    const next={...prefs}; pendingSaves++;ownRevisions.add(next.revision);
    if(ownRevisions.size>128)ownRevisions.delete(ownRevisions.values().next().value);
    if(id!=='enabled'){suspended=false;configure(true,true);}else configure(true);
    render();text('saved','저장 중…');
    saveChain=saveChain.catch(()=>{}).then(()=>browser.storage.local.set({[P.key]:next})).then(()=>{
      if (prefs.revision===next.revision) {text('saved','저장됨 · 이 브라우저에 유지');}
    }).catch(()=>text('saved','저장 실패 · 다시 변경해 주세요')).finally(()=>{pendingSaves--;});
  }
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
  render();scan();
})();
