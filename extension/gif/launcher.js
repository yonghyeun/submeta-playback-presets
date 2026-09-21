(() => {
  'use strict';
  if (window.top !== window || document.getElementById('submeta-gif-launcher')) return;
  const api = globalThis.browser || globalThis.chrome;
  const host = document.createElement('div'); host.id = 'submeta-gif-launcher';
  host.style.cssText = 'display:block;clear:both;padding:12px 16px;color:#eee;font:14px system-ui';
  const root = host.attachShadow({mode: 'closed'});
  const button = document.createElement('button'); button.textContent = 'GIF 만들기';
  button.style.cssText = 'font:600 14px system-ui;color:#fff;background:#27634b;border:1px solid #56866d;border-radius:8px;padding:10px 18px;cursor:pointer';
  button.setAttribute('aria-haspopup', 'dialog'); button.setAttribute('aria-expanded', 'false');
  const hint = document.createElement('span'); hint.textContent = '  구간을 선택하고 GIF로 만들기'; hint.style.cssText = 'margin-left:12px;color:#aaa;font-size:12px'; root.append(button, hint);
  const backdrop = document.createElement('div'); backdrop.style.cssText = 'position:fixed;inset:0;background:#000b;backdrop-filter:blur(4px);z-index:2147483000';
  let frame, frameURL = '', opened = false, changed = [], previousFocus, scanTimer;
  function style(element, property, value) {
    changed.push([element, property, element.style.getPropertyValue(property), element.style.getPropertyPriority(property)]);
    element.style.setProperty(property, value, 'important');
  }
  function restore() {
    opened = false; backdrop.remove();
    for (const [element, property, value, priority] of changed.reverse()) {
      if (value) element.style.setProperty(property, value, priority); else element.style.removeProperty(property);
    }
    changed = []; button.setAttribute('aria-expanded', 'false');
    if (previousFocus?.isConnected) previousFocus.focus(); else button.focus();
  }
  async function close() {
    if (!opened) return;
    try { await api.runtime.sendMessage({type: 'gif:ui-close'}); } finally { restore(); }
  }
  button.addEventListener('click', async () => {
    if (opened) { await close(); return; }
    if (!frame?.isConnected) return;
    button.disabled = true; const targetFrame = frame;
    try {
      const response = await api.runtime.sendMessage({type: 'gif:ui-open'});
      if (frame !== targetFrame || !targetFrame.isConnected) return;
      if (!response?.ready) { hint.textContent = '영상을 준비한 뒤 다시 눌러주세요.'; return; }
      previousFocus = document.activeElement; opened = true;
      // Keep the existing iframe mounted so its authenticated player and result
      // are not reloaded. Temporarily remove ancestor clipping/containing blocks.
      for (let parent = frame.parentElement; parent && parent !== document.documentElement; parent = parent.parentElement) {
        for (const [name, value] of Object.entries({transform:'none',filter:'none',perspective:'none',contain:'none',isolation:'auto','z-index':'auto','overflow':'visible','will-change':'auto'})) style(parent, name, value);
      }
      document.documentElement.append(backdrop);
      for (const [name, value] of Object.entries({position:'fixed',top:'50%',left:'50%',right:'auto',bottom:'auto',transform:'translate(-50%, -50%)',width:'min(1060px, calc(100vw - 40px))',height:'min(900px, calc(100dvh - 40px))','max-width':'none','max-height':'none','z-index':'2147483001',border:'0','border-radius':'16px','box-shadow':'0 24px 100px #0008'})) style(frame, name, value);
      style(document.documentElement, 'overflow', 'hidden');
      button.setAttribute('aria-expanded', 'true'); frame.focus();
      await api.runtime.sendMessage({type: 'gif:ui-focus'});
    } catch { restore(); hint.textContent = '편집창을 연결하지 못했습니다. 페이지를 새로 고침해주세요.'; }
    finally { button.disabled = false; }
  });
  backdrop.addEventListener('click', () => void close());
  document.addEventListener('keydown', event => { if (opened && event.key === 'Escape') { event.preventDefault(); void close(); } });
  api.runtime.onMessage.addListener(message => { if (message?.type === 'gif:ui-dismiss') { restore(); return Promise.resolve({closed:true}); } });
  function scan() {
    const candidates = [...document.querySelectorAll('iframe')].filter(el => { try { return new URL(el.src).origin === 'https://iframe.cloudflarestream.com'; } catch { return false; } });
    const next = /^\/[^/]+\/courses\/[^/]+\/[^/]+/.test(location.pathname) && candidates.length === 1 ? candidates[0] : null;
    if (next !== frame || next?.src !== frameURL) { if (opened) void close(); frame = next; frameURL = next?.src || ''; }
    if (!frame) { host.remove(); return; }
    const container = frame.closest('[class*="VideoContent"][class*="__stage"]') || frame.closest('[class*="VideoContent"][class*="__player"]') || frame.closest('[class*="MasterPlayer"]') || frame.parentElement;
    const presets = document.getElementById('submeta-presets');
    const anchor = presets?.previousElementSibling === container ? presets : container;
    if (host.previousElementSibling !== anchor) anchor.after(host);
  }
  const observer = new MutationObserver(() => { clearTimeout(scanTimer); scanTimer = setTimeout(scan, 100); });
  observer.observe(document.documentElement, {childList:true, subtree:true, attributes:true, attributeFilter:['src']}); scan();
  window.addEventListener('pagehide', () => { observer.disconnect(); clearTimeout(scanTimer); if (opened) restore(); }, {once:true});
})();
