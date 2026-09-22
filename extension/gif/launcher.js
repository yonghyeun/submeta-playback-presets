(() => {
  'use strict';
  if (window.top !== window || document.getElementById('submeta-gif-launcher')) return;
  const api = globalThis.browser || globalThis.chrome;
  const host = document.createElement('div'); host.id = 'submeta-gif-launcher';
  const root = host.attachShadow({mode: 'closed'});
  const view = SubmetaUI.mountGifLauncher(root, {onOpen: () => void open()});
  const backdrop = document.createElement('div'); backdrop.style.cssText = SubmetaUI.gifBackdropCSS;
  let inerted = [];
  let frame, frameURL = '', opened = false, changed = [], previousFocus, scanTimer;
  function style(element, property, value) {
    changed.push([element, property, element.style.getPropertyValue(property), element.style.getPropertyPriority(property)]);
    element.style.setProperty(property, value, 'important');
  }
  function restore() {
    opened = false; backdrop.remove();
    for (const element of inerted) element.inert = false; inerted = [];
    for (const [element, property, value, priority] of changed.reverse()) {
      if (value) element.style.setProperty(property, value, priority); else element.style.removeProperty(property);
    }
    changed = []; view.update({opened:false,hint:'구간을 선택하고 GIF로 만들기',tone:'neutral'});
    if (previousFocus?.isConnected && previousFocus !== host) previousFocus.focus(); else view.focus();
  }
  async function close() {
    if (!opened) return;
    try { await api.runtime.sendMessage({type: 'gif:ui-close'}); } finally { restore(); }
  }
  async function open() {
    if (opened) { await close(); return; }
    if (!frame?.isConnected) return;
    view.update({disabled:true,hint:'편집창 연결 중…',tone:'neutral'}); const targetFrame = frame;
    try {
      const response = await api.runtime.sendMessage({type: 'gif:ui-open'});
      if (frame !== targetFrame || !targetFrame.isConnected) return;
      if (!response?.ready) { view.update({hint:'영상을 준비한 뒤 다시 눌러주세요.',tone:'neutral'}); return; }
      previousFocus = document.activeElement; opened = true;
      // Keep the existing iframe mounted so its authenticated player and result
      // are not reloaded. Temporarily remove ancestor clipping/containing blocks.
      for (let parent = frame.parentElement; parent && parent !== document.documentElement; parent = parent.parentElement) {
        for (const [name, value] of Object.entries({transform:'none',filter:'none',perspective:'none',contain:'none',isolation:'auto','z-index':'auto','overflow':'visible','will-change':'auto'})) style(parent, name, value);
      }
      for (let branch = frame; branch.parentElement; branch = branch.parentElement) {
        for (const sibling of branch.parentElement.children) {
          if (sibling !== branch && sibling instanceof HTMLElement && !sibling.inert) {sibling.inert = true; inerted.push(sibling);}
        }
      }
      document.documentElement.append(backdrop);
      for (const [name, value] of Object.entries(SubmetaUI.gifFrameStyles)) style(frame, name, value);
      style(document.documentElement, 'overflow', 'hidden');
      view.update({opened:true,hint:'GIF 편집창이 열려 있습니다.',tone:'neutral'}); frame.focus();
      await api.runtime.sendMessage({type: 'gif:ui-focus'});
    } catch { restore(); view.update({hint:'편집창을 연결하지 못했습니다. 페이지를 새로 고침해주세요.',tone:'error'}); }
    finally { view.update({disabled:false}); }
  }
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
  window.addEventListener('pagehide', () => { observer.disconnect(); clearTimeout(scanTimer); if (opened) restore(); view.destroy(); }, {once:true});
})();
