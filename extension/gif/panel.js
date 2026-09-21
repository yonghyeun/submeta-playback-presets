(() => {
  'use strict';
  if (window.parent === window || document.getElementById('submeta-gif-export-preview')) return;
  try { if (new URL(document.referrer).origin !== 'https://submeta.io') return; } catch { return; }
  const Gif = globalThis.SubmetaGif;
  const host = document.createElement('aside');
  host.id = 'submeta-gif-export-preview';
  host.style.cssText = 'display:none;position:fixed;inset:0;z-index:2147483647;background:#f7f8fa;color:#17241c;font:14px system-ui;overflow:auto;padding:24px;box-sizing:border-box';
  const root = host.attachShadow({mode: 'closed'});
  const style = document.createElement('style');
  style.textContent = 'button,input{font:inherit;padding:6px;margin:3px}input{width:90px}input[aria-invalid="true"]{outline:2px solid #b22}.time-error{color:#a11}img{width:100%}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:11px monospace}summary{cursor:pointer}.editor-layout{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:20px}.card{background:white;border:1px solid #e0e6e2;border-radius:12px;padding:18px;min-width:0}button{border:1px solid #cbd5ce;border-radius:7px;background:#f5f8f6;cursor:pointer}button:disabled{opacity:.45;cursor:default}button:focus-visible{outline:3px solid #72a587}h3{margin-top:0}details{margin-top:16px;color:#617067;font-size:12px}@media(max-width:740px){.editor-layout{grid-template-columns:1fr}}';
  const details = document.createElement('div');
  const title = document.createElement('h2'); title.id = 'gif-editor-title'; title.textContent = 'GIF 만들기';
  title.style.cssText = 'margin:0;font-size:24px';
  host.setAttribute('aria-modal', 'true'); host.setAttribute('aria-label', 'GIF 만들기');
  const header = document.createElement('div'); header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:20px';
  const close = document.createElement('button'); close.textContent = '닫기 ✕'; close.setAttribute('aria-label', 'GIF 편집창 닫기');
  header.append(title, close);
  const form = document.createElement('div');
  // Keep editable targets visible to the player's keyboard handlers. Inputs in
  // a closed shadow tree are retargeted to the host and mistaken for shortcuts.
  form.slot = 'times'; host.append(form);
  const timeSlot = document.createElement('slot'); timeSlot.name = 'times';
  const field = (text, value) => {
    const label = document.createElement('label'); label.textContent = text;
    const input = document.createElement('input'); input.type = 'text'; input.value = value;
    input.style.cssText = 'font:inherit;width:90px;padding:6px;margin:3px';
    input.placeholder = '4:35'; input.autocomplete = 'off'; input.spellcheck = false;
    input.setAttribute('aria-describedby', 'gif-time-bounds gif-time-error');
    input.addEventListener('input', validateTimeInputs);
    input.addEventListener('change', () => { normalizeTime(input); validateTimeInputs(); });
    label.append(input); form.append(label); return input;
  };
  const start = field('시작', '0:30'), end = field('종료', '0:35');
  const timeBounds = document.createElement('p'); timeBounds.id = 'gif-time-bounds';
  const timeError = document.createElement('p'); timeError.id = 'gif-time-error'; timeError.className = 'time-error';
  timeError.style.color = '#a11';
  timeError.setAttribute('role', 'status');
  form.append(timeBounds, timeError);
  const timeline = Gif.timeline({container: form, video: () => document.querySelector('video'), change: (a, b) => {
    start.value = Gif.formatTimestamp(a); end.value = Gif.formatTimestamp(b); validateTimeInputs();
  }});
  let nativeAvailable = false;
  const controls = document.createElement('div');
  const button = (text, action) => {
    const el = document.createElement('button'); el.textContent = text;
    el.addEventListener('click', event => { event.stopPropagation(); void action(); }); controls.append(el); return el;
  };
  const generate = button('GIF 생성', create);
  const cancel = button('취소', () => job?.controller.abort('cancelled')); cancel.disabled = true;
  const copy = button('클립보드 복사', () => copyResult()); copy.disabled = true;
  const save = button('GIF 파일 저장', () => saveResult(nativeAvailable ? 'remembered-folder' : 'browser')); save.disabled = true;
  const saveOnce = button('이번만 다른 위치에 저장', () => saveResult('browser')); saveOnce.disabled = true;
  const folderRow = document.createElement('div');
  const folderLabel = document.createElement('p'); folderLabel.style.overflowWrap = 'anywhere';
  folderLabel.textContent = '저장 폴더 확인 중…';
  const changeFolder = document.createElement('button'); changeFolder.textContent = '저장 폴더 변경';
  changeFolder.addEventListener('click', event => { event.stopPropagation(); void chooseFolder(); });
  folderRow.append(folderLabel, changeFolder);
  const status = document.createElement('p'); status.setAttribute('role', 'status'); status.textContent = '1–15초 · 480px · 10fps · 소리 없는 반복 GIF';
  const clipboardStatus = document.createElement('p'); clipboardStatus.setAttribute('role', 'status');
  clipboardStatus.textContent = '생성이 끝나면 클립보드에 자동 복사됩니다.';
  const preview = document.createElement('img'); preview.alt = '생성한 GIF 미리보기'; preview.hidden = true;
  const report = document.createElement('pre');
  const layout = document.createElement('div'); layout.className = 'editor-layout';
  const editColumn = document.createElement('section'), outputColumn = document.createElement('section');
  editColumn.className = outputColumn.className = 'card';
  const outputTitle = document.createElement('h3'); outputTitle.textContent = '미리보기 및 저장';
  const diagnostic = document.createElement('details'); const diagnosticTitle = document.createElement('summary'); diagnosticTitle.textContent = '진단 정보 · 0.4.0'; diagnostic.append(diagnosticTitle, report);
  editColumn.append(timeSlot, generate, cancel); outputColumn.append(outputTitle, status, clipboardStatus, preview, copy, save, saveOnce, folderRow);
  layout.append(editColumn, outputColumn); details.append(header, layout, diagnostic); root.append(style, details);
  document.documentElement.append(host);
  // Prevent player shortcuts/click handlers from treating the controls as video input.
  for (const type of ['pointerdown', 'pointerup', 'click', 'keydown', 'keypress', 'keyup']) host.addEventListener(type, event => event.stopPropagation());
  let job, result, saving = false, copying = false;
  function showFolder(folder) { folderLabel.textContent = `저장 폴더: ${folder.path}`; }
  function updateSaveButtons() {
    copy.disabled = Boolean(!result || saving || copying || job);
    save.disabled = saveOnce.disabled = Boolean(!result || saving || copying || job);
    changeFolder.disabled = Boolean(saving || copying || job);
  }
  async function refreshFolder() {
    try {
      const response = await Gif.folder('status');
      nativeAvailable = Boolean(response) && !['native-host-unavailable', 'native-host-disconnected'].includes(response.error);
      if (response.folder) showFolder(response.folder);
      else if (!nativeAvailable) folderLabel.textContent = '폴더 기억과 GIF 파일 복사는 Mac 보조 앱 설치가 필요합니다.';
      else folderLabel.textContent = response.status === 'unselected' ? '첫 저장 때 폴더를 선택하면 다음에도 사용합니다.' : '기억한 저장 폴더를 확인하지 못했습니다. 폴더를 선택해주세요.';
    } catch { folderLabel.textContent = '저장 폴더 연결을 확인해주세요.'; }
  }
  async function chooseFolder() {
    if (job || saving || copying) return;
    saving = true; updateSaveButtons(); validateTimeInputs();
    status.textContent = '다음에도 사용할 저장 폴더를 선택해주세요…';
    try {
      const response = await Gif.folder('choose');
      if (response.folder) { nativeAvailable = true; showFolder(response.folder); status.textContent = '저장 폴더를 기억했습니다. 다음부터 바로 저장합니다.'; }
      else status.textContent = saveMessage(response);
    } catch { status.textContent = saveMessage({error: 'native-host-unavailable'}); }
    finally { saving = false; updateSaveButtons(); validateTimeInputs(); }
  }
  let inputVideo, inputLimit, initializedTimes = false;
  function normalizeTime(input) {
    try { input.value = Gif.boundTimestamp(input.value, document.querySelector('video')?.duration); }
    catch { /* Leave incomplete/malformed input visible for correction; creation is blocked. */ }
  }
  function validateTimeInputs() {
    const duration = document.querySelector('video')?.duration;
    let limit;
    try { limit = Gif.timestampLimit(duration); } catch { generate.disabled = true; return false; }
    const values = [], errors = [];
    for (const [input, label] of [[start, '시작'], [end, '종료']]) {
      let error = '';
      try {
        const time = Gif.parseTimestamp(input.value); values.push(time);
        if (time < 0 || time > limit) error = `${label} 시간은 0:00–${Gif.formatTimestamp(limit)} 범위로 입력해주세요.`;
      } catch { error = `${label} 시간을 4:35처럼 분:초로 입력해주세요. 초는 00–59이며 소수 한 자리까지 가능합니다.`; }
      input.setCustomValidity(error); input.setAttribute('aria-invalid', String(Boolean(error)));
      input.style.outline = error ? '2px solid #b22' : '';
      if (error) errors.push(error);
    }
    if (!errors.length) {
      try { Gif.validateRange(values[0], values[1], duration); }
      catch { errors.push('종료를 시작보다 뒤로 지정해주세요. GIF 길이는 1–15초입니다.'); }
    }
    timeError.textContent = errors.join(' ');
    generate.disabled = Boolean(job || saving || copying || errors.length);
    if (!errors.length && values.length === 2 && values.every(value => value >= 0 && value <= limit)) timeline.sync(values[0], values[1], limit, Boolean(job || saving || copying));
    return errors.length === 0;
  }
  function refreshTimeBounds() {
    const video = document.querySelector('video');
    if (inputVideo !== video) { inputVideo = video; initializedTimes = false; }
    let limit;
    try { limit = Gif.timestampLimit(video?.duration); } catch { limit = null; }
    if (job) return;
    if (limit !== null && !initializedTimes) {
      start.value = limit >= 35 ? '0:30' : '0:00';
      end.value = Gif.formatTimestamp(limit >= 35 ? 35 : Math.min(5, limit));
      initializedTimes = true;
    } else if (limit !== null && limit !== inputLimit) {
      normalizeTime(start); normalizeTime(end);
    }
    inputLimit = limit;
    start.disabled = end.disabled = limit === null || Boolean(job || saving || copying);
    if (limit === null) timeline.sync(0, 0, 0, true);
    timeBounds.textContent = limit === null ? '영상 길이를 확인하는 중…' : `입력 범위 0:00–${Gif.formatTimestamp(limit)} · 분:초 (예: 4:35)`;
    if (limit === null) timeError.textContent = '';
    validateTimeInputs();
  }
  const mediaEvents = ['loadedmetadata', 'durationchange', 'loadstart', 'emptied'];
  for (const type of mediaEvents) document.addEventListener(type, refreshTimeBounds, true);
  const mediaObserver = new MutationObserver(() => {
    if (document.querySelector('video') !== inputVideo) refreshTimeBounds();
  });
  mediaObserver.observe(document.documentElement, {subtree: true, childList: true});
  refreshTimeBounds();
  function showReport(data) {
    report.replaceChildren();
    for (const [key, value] of Object.entries(data)) {
      const line = document.createElement('div'); line.textContent = `${key}: ${JSON.stringify(value)}`; report.append(line);
    }
  }
  const messages = {
    'range-invalid': '영상 길이 안에서 1–15초 구간을 0.1초 단위로 지정해주세요.',
    'timestamp-invalid': '시간을 4:35처럼 분:초 형식으로 입력해주세요.',
    'video-not-ready': '영상을 재생해 준비한 뒤 다시 시도해주세요.',
    'cancelled': '생성을 취소했습니다.', 'tab-hidden': '탭이 숨겨져 생성을 중단했습니다.',
    'user-control': '플레이어 조작으로 생성을 중단했습니다.', 'user-seek': '새 재생 위치를 유지하고 생성을 중단했습니다.',
    'media-changed': '영상이 바뀌어 생성을 중단했습니다.', 'output-too-large': 'GIF가 20MiB를 초과했습니다. 구간을 줄여주세요.',
    'canvas-security-error': '이 영상의 프레임을 읽을 수 없습니다.'
  };
  function clearResult() { if (result) URL.revokeObjectURL(result.url); result = null; preview.removeAttribute('src'); preview.hidden = true; clipboardStatus.textContent = '생성이 끝나면 클립보드에 자동 복사됩니다.'; updateSaveButtons(); }
  async function create() {
    if (job || saving || copying) return;
    normalizeTime(start); normalizeTime(end);
    if (!validateTimeInputs()) return;
    let encoder, stage = 'validating', lastReport;
    const controller = new AbortController();
    try {
      const video = document.querySelector('video');
      if (!video) throw new Error('video-not-ready');
      const config = Gif.selection(Gif.parseTimestamp(start.value), Gif.parseTimestamp(end.value), video);
      clearResult(); job = {controller};
      updateSaveButtons();
      generate.disabled = start.disabled = end.disabled = true; cancel.disabled = false;
      timeline.sync(config.start, config.end, video.duration, true);
      status.textContent = 'GIF 인코더 준비 중…'; report.replaceChildren();
      const began = performance.now();
      stage = 'worker-start';
      encoder = await Gif.createEncoder(config, controller.signal);
      stage = 'capture';
      const captured = await Gif.capture({video, config, controller, host,
        onFrame: (index, buffer) => encoder.frame(index, buffer),
        onProgress: (count, total, phase) => { status.textContent = phase === 'restoring' ? '원래 재생 상태 복구 중…' : `GIF 생성 중 ${count}/${total}`; }});
      lastReport = captured.report;
      if (captured.error) throw new Error(captured.error);
      if (controller.signal.aborted) throw new Error(String(controller.signal.reason));
      status.textContent = 'GIF 마무리 중…';
      stage = 'finish';
      const encoded = await encoder.finish();
      if (controller.signal.aborted) throw new Error(String(controller.signal.reason));
      stage = 'gif-bytes';
      const bytes = new Uint8Array(encoded.buffer);
      // Firefox content-script Xrays can reject TypedArray.slice's species lookup.
      const header = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4], bytes[5]);
      if (header !== 'GIF89a' || bytes[bytes.length - 1] !== 0x3b || bytes.length > Gif.MAX_BYTES) throw new Error('gif-invalid');
      stage = 'hash';
      const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('');
      if (controller.signal.aborted) throw new Error(String(controller.signal.reason));
      stage = 'preview';
      const blob = new Blob([bytes], {type: 'image/gif'});
      result = {blob, url: URL.createObjectURL(blob), filename: `submeta-${Math.round(config.start * 1000)}-${Math.round(config.end * 1000)}-${crypto.randomUUID()}.gif`, hash};
      preview.src = result.url; preview.hidden = false; save.disabled = false;
      status.textContent = captured.report.restoration === 'restored' ? `GIF 생성 완료 · ${(blob.size / 1024).toFixed(0)}KB · 저장할 수 있습니다.` : 'GIF 생성 완료. 재생 상태를 확인해주세요.';
      showReport({version: '0.4.0', config, sha256: hash, ...encoded.metrics, totalMs: Math.round(performance.now() - began), capture: captured.report});
      cancel.disabled = true;
      if (nativeAvailable) await copyResult(true);
      else clipboardStatus.textContent = 'GIF 파일 복사와 저장 폴더 기억은 Mac 보조 앱 설치가 필요합니다. 파일 저장은 바로 사용할 수 있습니다.';
    } catch (error) {
      showReport({errorStage: stage, capture: lastReport});
      const reason = controller.signal.aborted ? String(controller.signal.reason) : error.message;
      status.textContent = messages[reason] || `GIF 생성 실패 (${reason}). 다시 시도할 수 있습니다.`;
    } finally {
      encoder?.dispose(); job = null;
      cancel.disabled = true; refreshTimeBounds(); updateSaveButtons();
    }
  }
  async function copyResult(automatic = false) {
    if (!result || saving || copying || (job && !automatic)) return;
    copying = true; updateSaveButtons(); validateTimeInputs();
    clipboardStatus.textContent = '클립보드에 복사하는 중…';
    try {
      const response = await Gif.save(result, {destination: 'clipboard'});
      clipboardStatus.textContent = response?.status === 'copied'
        ? `클립보드 복사 완료 · ${await Gif.pasteInstruction()} 원본 GIF 파일로 복사했습니다.`
        : `클립보드 복사를 완료하지 못했습니다 (${response?.error || 'clipboard-result-unknown'}). 다시 복사하거나 파일로 저장할 수 있습니다.`;
      const line = document.createElement('div'); line.textContent = `clipboardResult: ${JSON.stringify(response)}`; report.append(line);
    } catch (error) {
      clipboardStatus.textContent = '클립보드 복사 실패 · 생성한 GIF는 유지됩니다. 다시 복사하거나 파일로 저장해주세요.';
      const line = document.createElement('div');
      line.textContent = `clipboardResult: ${JSON.stringify({error: String(error?.message || 'clipboard-unexpected-error')})}`;
      report.append(line);
    }
    finally { copying = false; updateSaveButtons(); validateTimeInputs(); }
  }
  function saveMessage(response) {
    if (response?.status === 'complete') return response.path ? `GIF 파일 저장 완료: ${response.path}` : 'GIF 파일 저장 완료';
    const errors = {
      'folder-selection-cancelled': '폴더 선택을 취소했습니다. 기존 저장 폴더와 GIF는 유지됩니다.',
      'folder-unavailable': '기억한 폴더를 찾을 수 없습니다. 저장 폴더를 다시 선택해주세요.',
      'folder-access-denied': '이 폴더에 저장할 권한이 없습니다. 다른 폴더를 선택해주세요.',
      'file-no-space': '저장 공간이 부족합니다. 공간을 확보한 뒤 다시 저장해주세요.',
      'native-host-unavailable': '폴더 저장 기능을 연결하지 못했습니다. 지금은 ‘이번만 다른 위치에 저장’을 사용할 수 있습니다.',
      'native-host-disconnected': '폴더 연결이 끊어졌습니다. GIF는 유지되며 다시 저장할 수 있습니다.',
      'save-result-unknown': '저장 결과를 확인하지 못했습니다. 중복 저장하기 전에 선택한 폴더를 확인해주세요.',
      'file-write-failed': '파일을 쓰지 못했습니다. 저장 폴더와 여유 공간을 확인해주세요.'
    };
    return errors[response?.error] || '저장이 취소되었거나 실패했습니다. GIF를 다시 저장할 수 있습니다.';
  }
  async function saveResult(destination) {
    if (!result || saving || copying || job) return;
    saving = true; updateSaveButtons(); validateTimeInputs();
    status.textContent = destination === 'browser' ? '이번 파일의 저장 위치를 선택해주세요…' : '기억한 폴더에 저장합니다. 처음이라면 폴더를 선택해주세요…';
    try {
      const response = await Gif.save(result, {destination, onFolder: showFolder});
      const diagnostic = document.createElement('div');
      diagnostic.textContent = `saveResult: ${JSON.stringify(response)}`;
      report.append(diagnostic);
      if (response?.folder) showFolder(response.folder);
      status.textContent = saveMessage(response);
    } catch { status.textContent = '저장에 실패했습니다. GIF를 다시 저장할 수 있습니다.'; }
    finally { saving = false; updateSaveButtons(); validateTimeInputs(); }
  }
  const api = globalThis.browser || globalThis.chrome;
  function hideEditor() { host.removeAttribute('role'); host.style.display = 'none'; job?.controller.abort('cancelled'); }
  async function dismiss() { hideEditor(); await api.runtime.sendMessage({type:'gif:ui-dismiss'}).catch(() => {}); }
  close.addEventListener('click', () => void dismiss());
  host.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); void dismiss(); }
    if (event.key === 'Tab') {
      const elements = [close, ...form.querySelectorAll('button,input,[tabindex="0"]'), generate, cancel, copy, save, saveOnce, changeFolder, diagnosticTitle].filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length);
      const active = root.activeElement || document.activeElement;
      if (event.shiftKey && active === elements[0]) { event.preventDefault(); elements.at(-1)?.focus(); }
      else if (!event.shiftKey && active === elements.at(-1)) { event.preventDefault(); elements[0]?.focus(); }
    }
  }, true);
  api.runtime.onMessage.addListener(message => {
    if (message?.type === 'gif:ui-probe') return api.runtime.sendMessage({type:'gif:ui-ready'});
    if (message?.type === 'gif:ui-open') { host.setAttribute('role', 'dialog'); host.style.display = 'block'; refreshTimeBounds(); return Promise.resolve({ready:true}); }
    if (message?.type === 'gif:ui-focus') { close.focus(); return Promise.resolve({ready:true}); }
    if (message?.type === 'gif:ui-close') { hideEditor(); return Promise.resolve({closed:true}); }
  });
  void api.runtime.sendMessage({type:'gif:ui-ready'}).catch(() => {});
  void refreshFolder();
  window.addEventListener('pagehide', () => {
    job?.controller.abort('media-changed'); if (!saving) clearResult();
    timeline.dispose(); mediaObserver.disconnect();
    for (const type of mediaEvents) document.removeEventListener(type, refreshTimeBounds, true);
  }, {once: true});
})();
