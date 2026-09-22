(() => {
  'use strict';
  if (window.parent === window || document.getElementById('submeta-gif-export-preview')) return;
  try { if (new URL(document.referrer).origin !== 'https://submeta.io') return; } catch { return; }
  const Gif = globalThis.SubmetaGif, UI = globalThis.SubmetaUI;
  const api = globalThis.browser || globalThis.chrome;
  const host = document.createElement('aside'); host.id = 'submeta-gif-export-preview';
  host.style.cssText = UI.gifHostCSS; host.setAttribute('aria-modal','true'); host.setAttribute('aria-label','GIF 만들기');
  const root = host.attachShadow({mode:'closed'});
  let job, result, saving = false, copying = false, nativeAvailable = false, disposed = false;
  let inputVideo, inputLimit, initializedTimes = false;
  let state = {start:'0:30',end:'0:35',duration:0,range:[30,35],invalid:{start:false,end:false},report:''};
  const view = UI.mountGifEditor(root,{state,timeline:Gif.timeline,video:()=>document.querySelector('video'),actions:{
    changeTime(field,value,commit) {state[field]=value;if(commit)normalizeTime(field);validateTimeInputs();},
    range(a,b) {state.start=Gif.formatTimestamp(a);state.end=Gif.formatTimestamp(b);validateTimeInputs();},
    generate:()=>void create(),cancel:()=>job?.controller.abort('cancelled'),close:()=>void dismiss(),
    copy:()=>void copyResult(),save:destination=>void saveResult(destination),chooseFolder:()=>void chooseFolder(),
  }});
  function update(patch={}) {state={...state,...patch,busy:copying?'copying':job?'generating':saving?'saving':'idle'};if(!disposed)view.update(state);}
  document.documentElement.append(host);
  // Light-DOM time controls retain editable targets for player shortcut handlers.
  for(const type of ['pointerdown','pointerup','click','keydown','keypress','keyup']) host.addEventListener(type,event=>event.stopPropagation());
  function status(message,tone='neutral') {update({status:message,tone});}
  function clip(message,tone='neutral') {update({clipboardStatus:message,clipboardTone:tone});}
  function showFolder(folder) {update({folderLabel:`저장 폴더: ${folder.path}`});}
  async function refreshFolder() {
    try {
      const response=await Gif.folder('status');
      nativeAvailable=Boolean(response)&&!['native-host-unavailable','native-host-disconnected'].includes(response.error);
      update({nativeAvailable});
      if(response?.folder)showFolder(response.folder);
      else if(!nativeAvailable)update({folderLabel:'폴더 기억과 GIF 파일 복사는 Mac 보조 앱 설치가 필요합니다. 일반 파일 저장은 사용할 수 있습니다.'});
      else update({folderLabel:response.status==='unselected'?'첫 저장 때 폴더를 선택하면 다음에도 사용합니다.':'기억한 저장 폴더를 확인하지 못했습니다. 폴더를 선택해주세요.'});
    } catch {update({folderLabel:'저장 폴더 연결을 확인해주세요. 일반 파일 저장은 사용할 수 있습니다.'});}
  }
  async function chooseFolder() {
    if(job||saving||copying)return;
    saving=true;status('다음에도 사용할 저장 폴더를 선택해주세요…');
    try {
      const response=await Gif.folder('choose');
      if(response?.folder){nativeAvailable=true;update({nativeAvailable});showFolder(response.folder);status('저장 폴더를 기억했습니다. 다음부터 바로 저장합니다.','success');}
      else status(saveMessage(response),response?.error==='folder-selection-cancelled'?'neutral':'error');
    } catch {status(saveMessage({error:'native-host-unavailable'}),'error');}
    finally {saving=false;validateTimeInputs();}
  }
  function normalizeTime(field) {
    try {state[field]=Gif.boundTimestamp(state[field],document.querySelector('video')?.duration);}
    catch { /* Keep incomplete input visible; validation blocks generation. */ }
  }
  function validateTimeInputs() {
    const duration=document.querySelector('video')?.duration;
    let limit;
    try {limit=Gif.timestampLimit(duration);} catch {update({duration:0,timeError:''});return false;}
    const values=[],errors=[],invalid={start:false,end:false};
    for(const [field,label] of [['start','시작'],['end','종료']]) {
      let error='';
      try {const time=Gif.parseTimestamp(state[field]);values.push(time);if(time<0||time>limit)error=`${label} 시간은 0:00–${Gif.formatTimestamp(limit)} 범위로 입력해주세요.`;}
      catch {error=`${label} 시간을 4:35처럼 분:초로 입력해주세요. 초는 00–59이며 소수 한 자리까지 가능합니다.`;}
      invalid[field]=Boolean(error);if(error)errors.push(error);
    }
    if(!errors.length) {
      try {Gif.validateRange(values[0],values[1],duration);}
      catch {errors.push('종료를 시작보다 뒤로 지정해주세요. GIF 길이는 1–15초입니다.');invalid.start=invalid.end=true;}
    }
    const patch={duration:limit,invalid,timeError:errors.join(' ')};
    if(!errors.length)patch.range=values;
    update(patch);return !errors.length;
  }
  function refreshTimeBounds() {
    const video=document.querySelector('video');
    if(inputVideo!==video){inputVideo=video;initializedTimes=false;}
    let limit;try{limit=Gif.timestampLimit(video?.duration);}catch{limit=null;}
    if(job)return;
    if(limit!==null&&!initializedTimes){state.start=limit>=35?'0:30':'0:00';state.end=Gif.formatTimestamp(limit>=35?35:Math.min(5,limit));initializedTimes=true;}
    else if(limit!==null&&limit!==inputLimit){normalizeTime('start');normalizeTime('end');}
    inputLimit=limit;
    update({duration:limit||0,mediaKey:video?.currentSrc||'',bounds:limit===null?'영상 길이를 확인하는 중…':`입력 범위 0:00–${Gif.formatTimestamp(limit)} · 분:초 (예: 4:35)`});
    validateTimeInputs();
  }
  const mediaEvents=['loadedmetadata','durationchange','loadstart','emptied'];
  for(const type of mediaEvents)document.addEventListener(type,refreshTimeBounds,true);
  const mediaObserver=new MutationObserver(()=>{if(document.querySelector('video')!==inputVideo)refreshTimeBounds();});
  mediaObserver.observe(document.documentElement,{subtree:true,childList:true});refreshTimeBounds();
  function showReport(data) {update({report:Object.entries(data).map(([key,value])=>`${key}: ${JSON.stringify(value)}`).join('\n')});}
  function appendReport(key,value) {update({report:state.report+`\n${key}: ${JSON.stringify(value)}`});}
  const messages={
    'range-invalid':'영상 길이 안에서 1–15초 구간을 0.1초 단위로 지정해주세요.',
    'timestamp-invalid':'시간을 4:35처럼 분:초 형식으로 입력해주세요.',
    'video-not-ready':'영상을 재생해 준비한 뒤 다시 시도해주세요.',
    'cancelled':'생성을 취소했습니다. 선택한 구간은 유지됩니다.',
    'tab-hidden':'탭이 숨겨져 생성을 중단했습니다.',
    'user-control':'플레이어 조작으로 생성을 중단했습니다.',
    'user-seek':'새 재생 위치를 유지하고 생성을 중단했습니다.',
    'media-changed':'영상이 바뀌어 생성을 중단했습니다.',
    'output-too-large':'GIF가 20MiB를 초과했습니다. 구간을 줄여주세요.',
    'canvas-security-error':'이 영상의 프레임을 읽을 수 없습니다.',
  };
  function clearResult() {if(result)URL.revokeObjectURL(result.url);result=null;update({previewURL:'',clipboardStatus:'생성이 끝나면 지원되는 환경에서 클립보드에 자동 복사됩니다.',clipboardTone:'neutral'});}
  async function create() {
    if(job||saving||copying)return;
    normalizeTime('start');normalizeTime('end');if(!validateTimeInputs())return;
    let encoder,stage='validating',lastReport;
    const controller=new AbortController();
    try {
      const video=document.querySelector('video');if(!video)throw new Error('video-not-ready');
      const config=Gif.selection(Gif.parseTimestamp(state.start),Gif.parseTimestamp(state.end),video);
      clearResult();job={controller};update({progress:null,report:''});status('GIF 인코더 준비 중…');
      const began=performance.now();stage='worker-start';encoder=await Gif.createEncoder(config,controller.signal);
      stage='capture';
      const captured=await Gif.capture({video,config,controller,host,
        onFrame:(index,buffer)=>encoder.frame(index,buffer),
        onProgress:(count,total,phase)=>update({status:phase==='restoring'?'원래 재생 상태 복구 중…':`GIF 생성 중 ${count}/${total}`,progress:{value:count,max:total}}),
      });
      lastReport=captured.report;if(captured.error)throw new Error(captured.error);
      if(controller.signal.aborted)throw new Error(String(controller.signal.reason));
      status('GIF 마무리 중…');stage='finish';const encoded=await encoder.finish();
      if(controller.signal.aborted)throw new Error(String(controller.signal.reason));
      stage='gif-bytes';const bytes=new Uint8Array(encoded.buffer);
      // Avoid TypedArray.slice species lookup through Firefox content-script Xrays.
      const header=String.fromCharCode(bytes[0],bytes[1],bytes[2],bytes[3],bytes[4],bytes[5]);
      if(header!=='GIF89a'||bytes[bytes.length-1]!==0x3b||bytes.length>Gif.MAX_BYTES)throw new Error('gif-invalid');
      stage='hash';const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(byte=>byte.toString(16).padStart(2,'0')).join('');
      if(controller.signal.aborted)throw new Error(String(controller.signal.reason));
      stage='preview';const blob=new Blob([bytes],{type:'image/gif'});
      result={blob,url:URL.createObjectURL(blob),filename:`submeta-${Math.round(config.start*1000)}-${Math.round(config.end*1000)}-${crypto.randomUUID()}.gif`,hash};
      update({previewURL:result.url});
      status(captured.report.restoration==='restored'?`GIF 생성 완료 · ${(blob.size/1024).toFixed(0)}KB · 저장할 수 있습니다.`:'GIF 생성 완료. 재생 상태를 확인해주세요.','success');
      showReport({version:api.runtime.getManifest().version,config,sha256:hash,...encoded.metrics,totalMs:Math.round(performance.now()-began),capture:captured.report});
      if(nativeAvailable)await copyResult(true);
      else clip('GIF 파일 복사와 저장 폴더 기억은 Mac 보조 앱 설치가 필요합니다. 파일 저장은 바로 사용할 수 있습니다.');
    } catch(error) {
      showReport({errorStage:stage,capture:lastReport});
      const reason=controller.signal.aborted?String(controller.signal.reason):error.message;
      status(messages[reason]||`GIF 생성 실패 (${reason}). 다시 시도할 수 있습니다.`,reason==='cancelled'?'neutral':'error');
    } finally {encoder?.dispose();job=null;update({progress:null});refreshTimeBounds();}
  }
  async function copyResult(automatic=false) {
    if(!result||saving||copying||(job&&!automatic))return;
    copying=true;clip('클립보드에 복사하는 중…');
    try {
      const response=await Gif.save(result,{destination:'clipboard'});
      if(response?.status==='copied')clip(`클립보드 복사 완료 · ${await Gif.pasteInstruction()} 원본 GIF 파일로 복사했습니다.`,'success');
      else clip(`클립보드 복사를 완료하지 못했습니다 (${response?.error||'clipboard-result-unknown'}). 다시 복사하거나 파일로 저장할 수 있습니다.`,'error');
      appendReport('clipboardResult',response);
    } catch(error) {clip('클립보드 복사 실패 · 생성한 GIF는 유지됩니다. 다시 복사하거나 파일로 저장해주세요.','error');appendReport('clipboardResult',{error:String(error?.message||'clipboard-unexpected-error')});}
    finally {copying=false;validateTimeInputs();}
  }
  function saveMessage(response) {
    if(response?.status==='complete')return response.path?`GIF 파일 저장 완료: ${response.path}`:'GIF 파일 저장 완료';
    const errors={
      'folder-selection-cancelled':'폴더 선택을 취소했습니다. 기존 저장 폴더와 GIF는 유지됩니다.',
      'folder-unavailable':'기억한 폴더를 찾을 수 없습니다. 저장 폴더를 다시 선택해주세요.',
      'folder-access-denied':'이 폴더에 저장할 권한이 없습니다. 다른 폴더를 선택해주세요.',
      'file-no-space':'저장 공간이 부족합니다. 공간을 확보한 뒤 다시 저장해주세요.',
      'native-host-unavailable':'폴더 저장 기능을 연결하지 못했습니다. 지금은 ‘이번만 다른 위치에 저장’을 사용할 수 있습니다.',
      'native-host-disconnected':'폴더 연결이 끊어졌습니다. GIF는 유지되며 다시 저장할 수 있습니다.',
      'save-result-unknown':'저장 결과를 확인하지 못했습니다. 중복 저장하기 전에 선택한 폴더를 확인해주세요.',
      'file-write-failed':'파일을 쓰지 못했습니다. 저장 폴더와 여유 공간을 확인해주세요.',
    };
    return errors[response?.error]||'저장이 취소되었거나 실패했습니다. GIF를 다시 저장할 수 있습니다.';
  }
  async function saveResult(destination) {
    if(!result||saving||copying||job)return;
    saving=true;status(destination==='browser'?'이번 파일의 저장 위치를 선택해주세요…':'기억한 폴더에 저장합니다. 처음이라면 폴더를 선택해주세요…');
    try {
      const response=await Gif.save(result,{destination,onFolder:showFolder});appendReport('saveResult',response);
      if(response?.folder)showFolder(response.folder);
      status(saveMessage(response),response?.status==='complete'?'success':response?.error==='folder-selection-cancelled'?'neutral':'error');
    } catch {status('저장에 실패했습니다. GIF를 다시 저장할 수 있습니다.','error');}
    finally {saving=false;validateTimeInputs();}
  }
  function hideEditor() {host.removeAttribute('role');host.style.display='none';job?.controller.abort('cancelled');}
  async function dismiss() {hideEditor();await api.runtime.sendMessage({type:'gif:ui-dismiss'}).catch(()=>{});}
  host.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();void dismiss();}
    view.trapFocus(event);
  },true);
  api.runtime.onMessage.addListener(message=>{
    if(message?.type==='gif:ui-probe')return api.runtime.sendMessage({type:'gif:ui-ready'});
    if(message?.type==='gif:ui-open'){host.setAttribute('role','dialog');host.style.display='block';refreshTimeBounds();return Promise.resolve({ready:true});}
    if(message?.type==='gif:ui-focus'){view.focusClose();return Promise.resolve({ready:true});}
    if(message?.type==='gif:ui-close'){hideEditor();return Promise.resolve({closed:true});}
  });
  void api.runtime.sendMessage({type:'gif:ui-ready'}).catch(()=>{});void refreshFolder();
  window.addEventListener('pagehide',()=>{
    disposed=true;job?.controller.abort('media-changed');if(result)URL.revokeObjectURL(result.url);
    mediaObserver.disconnect();for(const type of mediaEvents)document.removeEventListener(type,refreshTimeBounds,true);view.destroy();
  },{once:true});
})();
