(() => {
  'use strict';
  if (window.parent===window) return;
  const P=SubmetaPreset, wait=ms=>new Promise(r=>setTimeout(r,ms));
  let token='',prefs={...P.defaults},configured=false,suspended=false,video,captionControl;
  let generation=0,running=false,queued=false,timer,deadline=0,settleUntil=0,nextApplyAt=0,labels=[],lastReport='';
  let speedBudget=P.budget(),captionBudget=P.budget(),speedBlocked=false,captionBlocked=false,speedAttempts=0;
  let immediateSpeed=false,immediateCaptions=false;
  let speedState='확인 중',captionState='확인 중';
  const captionButton=()=>[...document.querySelectorAll('[role="combobox"]')].find(el=>el.textContent.includes('Captions:'));
  const labelNow=()=>captionButton()?.textContent.replace(/^.*Captions:/,'').trim();
  const modes=()=>video ? [...video.textTracks].map(t=>t.mode) : [];
  function reset() {generation++;deadline=Date.now()+15000;speedBudget=P.budget();captionBudget=P.budget();speedBlocked=false;captionBlocked=false;speedAttempts=0;lastReport='';}
  function report() {
    if (!token) return;
    const status={app:'submeta-preset',type:'status',token,speed:speedState,captions:captionState,labels,suspended};
    const signature=JSON.stringify(status);
    if (signature===lastReport) return;lastReport=signature;
    browser.runtime.sendMessage(status).catch(()=>{});
  }
  function schedule(delay=100) {
    if (!configured) return;
    if (running) {queued=true;return;}
    clearTimeout(timer);timer=setTimeout(apply,delay);
  }
  function signal() {schedule();}
  function mediaChanged() {suspended=false;immediateSpeed=immediateCaptions=false;labels=[];settleUntil=Date.now()+900;reset();schedule();}
  const captionObserver=new MutationObserver(signal);
  function detect() {
    const next=document.querySelector('video');
    if (next!==video) {
      if(video)for(const event of ['loadedmetadata','canplay','ratechange'])video.removeEventListener(event,signal);
      video?.removeEventListener('loadstart',mediaChanged);
      video=next;mediaChanged();
      if(video){for(const event of ['loadedmetadata','canplay','ratechange'])video.addEventListener(event,signal);video.addEventListener('loadstart',mediaChanged);}
    }
    const button=captionButton();
    if(button!==captionControl){captionControl=button;captionObserver.disconnect();if(button)captionObserver.observe(button,{childList:true,subtree:true});schedule();}
  }
  async function withOptions(fn,valid) {
    const button=captionButton();
    if(!button)throw Error('not-ready');
    if(button.getAttribute('aria-expanded')==='true' || document.querySelector('[role="dialog"]'))throw Error('menu-busy');
    const focus=document.activeElement;
    let option;
    try {
      button.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'mouse',button:0,ctrlKey:false}));
      button.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'mouse',button:0}));
      await wait(100);if(!valid())return;
      if(button.getAttribute('aria-expanded')!=='true')button.click();
      for(let i=0;i<15;i++){
        if(!valid())return;
        const listId=button.getAttribute('aria-controls');
        const list=listId && document.getElementById(listId);
        const options=[...(list || document).querySelectorAll('[role="option"]')].filter(el=>el.getClientRects().length);
        if(options.length){
          option=options.find(el=>el.getAttribute('aria-selected')==='true') || options[0];
          labels=options.map(el=>el.textContent.trim()).filter(s=>s.length<=64);
          return await fn(options);
        }
        await wait(100);
      }
      throw Error('not-ready');
    } finally {
      if(button.isConnected && button.getAttribute('aria-expanded')==='true'){
        (option || document.activeElement || button).dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}));
      }
      if(focus?.isConnected && focus!==document.body)focus.focus({preventScroll:true});
    }
  }
  async function selectCaption(wanted,valid) {
    return withOptions(async options=>{
      const requested=P.chooseLabel(wanted,labels);
      const missing=!requested;
      const target=options.find(el=>el.textContent.trim()===(requested || 'Off'));
      if(!target)throw Error('unsupported');
      if(!valid())return;
      target.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'mouse',button:0}));
      target.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'mouse',button:0}));target.click();
      await wait(200);return {missing,target:requested || 'Off'};
    },valid);
  }
  async function synchronizeSpeed(rate,valid) {
    const settings=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Settings');
    if(!settings)return false;
    if(document.querySelector('[role="dialog"]') || captionButton()?.getAttribute('aria-expanded')==='true')throw Error('menu-busy');
    let dialog,combo;
    const focus=document.activeElement;
    try {
      settings.click();await wait(120);if(!valid())return false;
      dialog=document.querySelector('[role="dialog"]');
      combo=dialog && [...dialog.querySelectorAll('[role="combobox"]')].find(el=>el.textContent.includes('Speed:'));
      if(!combo)throw Error('not-ready');
      combo.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'mouse',button:0,ctrlKey:false}));
      combo.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'mouse',button:0}));
      await wait(100);if(!valid())return false;
      if(combo.getAttribute('aria-expanded')!=='true')combo.click();
      for(let i=0;i<10;i++){
        if(!valid())return false;
        const list=document.getElementById(combo.getAttribute('aria-controls'));
        const option=[...(list || document).querySelectorAll('[role="option"]')].find(el=>el.textContent.trim()===`${rate}x` && el.getClientRects().length);
        if(option){option.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'mouse',button:0}));option.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,pointerType:'mouse',button:0}));option.click();await wait(200);return true;}
        await wait(100);
      }
      throw Error('not-ready');
    }finally{
      if(combo?.getAttribute('aria-expanded')==='true')(document.activeElement || combo).dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}));
      if(dialog?.isConnected)dialog.querySelector('button')?.click();
      if(focus?.isConnected && focus!==document.body)focus.focus({preventScroll:true});
    }
  }
  function captionVerified(target) {
    if(labelNow()!==target)return false;
    const current=modes();
    return target==='Off' ? current.every(mode=>mode!=='showing') : current.includes('showing');
  }
  async function apply() {
    if(running||!configured)return;
    const notBefore=Math.max(settleUntil,nextApplyAt);
    if(Date.now()<notBefore){schedule(notBefore-Date.now());return;}
    running=true;queued=false;
    const turn=generation,revision=prefs.revision,bound=token,v=video;
    const valid=()=>turn===generation && revision===prefs.revision && bound===token && v===video && v?.isConnected;
    let retry=false;
    try {
      if(!v || v.readyState<1){speedState=captionState=Date.now()<deadline?'준비 중':'플레이어 준비 시간 초과';retry=true;return;}
      const active=prefs.enabled&&!suspended;
      if(!active&&!immediateSpeed){speedState=`${v.playbackRate}배 · ${suspended?'현재 영상 해제':'자동 적용 꺼짐'}`;captionState=labelNow() || '확인 중';}
      else {
        if(!prefs.manageSpeed)speedState=`${v.playbackRate}배 · 변경하지 않음`;
        else if(v.playbackRate===prefs.rate)speedState=`${v.playbackRate}배 적용됨`;
        else if(speedBlocked)speedState=`반복 충돌 · 실제 ${v.playbackRate}배 · 다시 적용 필요`;
        else {
          if(v.playbackRate!==prefs.rate){
            if(!speedBudget.take(Date.now())){speedBlocked=true;speedState='반복 충돌 · 다시 적용 필요';}
            else {
              try {
                // A player may restore its own menu state after a direct rate write.
                if(speedAttempts++>0)await synchronizeSpeed(prefs.rate,valid);
                if(!valid())return;
                v.playbackRate=prefs.rate;nextApplyAt=Date.now()+750;
              }catch{speedState='배속 메뉴 대기';retry=true;}
            }
          }
          if(!speedBlocked)speedState=v.playbackRate===prefs.rate?`${v.playbackRate}배 적용됨`:'배속 적용 실패';
        }
      }
      if(valid() && (!prefs.manageSpeed || v.playbackRate===prefs.rate))immediateSpeed=false;
      report();
      if(!valid())return;
      if(!captionButton()){
        captionState=Date.now()<deadline?'자막 메뉴 확인 중':'자막 메뉴 없음 · 제어 미지원';
        retry=Date.now()<deadline;return;
      }
      if(!labels.length)await withOptions(()=>{},valid);
      if(!valid())return;
      if((!active&&!immediateCaptions) || prefs.captions==='leave') {captionState=`${labelNow() || '확인 중'} · 변경하지 않음`;return;}
      const desired=prefs.captions==='off'?'Off':prefs.language;
      const matched=P.chooseLabel(desired,labels),target=matched || 'Off';
      if(!captionVerified(target)) {
        if(captionBlocked){captionState=`반복 충돌 · ${labelNow() || '상태 미확인'} · 다시 적용 필요`;return;}
        if(!captionBudget.take(Date.now())){captionBlocked=true;captionState=`반복 충돌 · ${labelNow() || '상태 미확인'} · 다시 적용 필요`;return;}
        captionState='적용 확인 중';report();
        await selectCaption(desired,valid);nextApplyAt=Date.now()+750;
      }
      if(!valid())return;
      if(captionVerified(target)){immediateCaptions=false;captionState=matched ? (target==='Off'?'꺼짐 확인됨':`${target} 활성화 확인됨`) : '선택 언어 미제공 · 자막 꺼짐';}
      else {captionState='자막 적용 확인 중';retry=true;}
    }catch(error){
      if(valid()){captionState=error.message==='menu-busy'?'자막 메뉴 사용 중 · 대기':error.message==='unsupported'?'자막 제어 미지원':'자막 확인 중';retry=true;}
    }finally{
      running=false;
      if(turn===generation){
        if(retry && Date.now()>=deadline)captionState='자막 확인 시간 초과 · 다시 적용';
        report();
      }
      if(queued)schedule(150);else if(retry && Date.now()<deadline)schedule(700);
    }
  }
  window.addEventListener('message',event=>{
    const m=event.data;
    if(event.source!==window.parent||event.origin!=='https://submeta.io'||m?.app!=='submeta-preset'||m.type!=='bind'||typeof m.token!=='string'||m.token.length>80)return;
    if(token!==m.token){token=m.token;configured=false;suspended=false;labels=[];settleUntil=Date.now()+900;reset();}
    browser.runtime.sendMessage({app:'submeta-preset',type:'bound',token}).catch(()=>{});
  });
  browser.runtime.onMessage.addListener(m=>{
    if(m?.app!=='submeta-preset'||m.type!=='configure'||!token||m.token!==token)return;
    const next=P.normalize(m.prefs);
    if(next.revision!==prefs.revision || next.enabled!==prefs.enabled || m.retry){reset();immediateSpeed=immediateCaptions=false;}
    prefs=next;configured=true;suspended=m.suspended===true;detect();
    if(m.applyNow===true){immediateSpeed=true;immediateCaptions=true;nextApplyAt=0;settleUntil=0;}
    schedule(0);
    return Promise.resolve({received:true});
  });
  let detectTimer;
  new MutationObserver(()=>{if(!detectTimer)detectTimer=setTimeout(()=>{detectTimer=undefined;detect();},100);}).observe(document.documentElement,{childList:true,subtree:true});
  detect();
})();
