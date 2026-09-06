(() => {
  'use strict';
  document.getElementById('submeta-poc')?.remove();
  const channel = 'submeta-player-poc-v1';
  const origin = 'https://iframe.cloudflarestream.com';
  const pending = new Map();
  let sequence = 0, connectedFrame, sdk;
  const host = document.createElement('section');
  host.id = 'submeta-poc';
  host.style.cssText = 'position:fixed;right:12px;bottom:12px;width:390px;max-height:55vh;overflow:auto;z-index:2147483647;background:#fff;color:#111;border:2px solid #344;padding:12px;font:13px system-ui;';
  const title = document.createElement('strong');
  title.textContent = 'Submeta POC — manual experiment';
  host.append(title);
  const output = document.createElement('pre');
  output.style.cssText = 'white-space:pre-wrap;font:12px monospace;';
  output.textContent = 'Ready. No changes until a button is clicked.';
  const controls = document.createElement('div');
  host.append(controls, output);
  const mount = () => { if (document.body && !host.isConnected) document.body.append(host); };
  mount();
  // Keep the diagnostic panel mounted during initial site rendering.
  const mounting = new MutationObserver(mount);
  mounting.observe(document.documentElement, {childList: true, subtree: true});
  setTimeout(() => mounting.disconnect(), 15000);
  function frame() {
    const frames = [...document.querySelectorAll('iframe')].filter(f => {
      try { return new URL(f.src).origin === origin; } catch { return false; }
    });
    if (frames.length !== 1) throw new Error('Expected exactly one Cloudflare player');
    return frames[0];
  }
  function request(action, value) {
    const f = frame(), id = ++sequence;
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => { pending.delete(id); reject(new Error('Frame response timeout; check extension permission and reload')); }, 5000);
      pending.set(id, {source: f.contentWindow, resolve, timeout});
      f.contentWindow.postMessage({channel, type: 'request', id, action, value}, origin);
    });
  }
  window.addEventListener('message', event => {
    const m = event.data;
    if (event.origin !== origin || !m || m.channel !== channel || m.type !== 'result') return;
    const p = pending.get(m.id);
    if (!p || p.source !== event.source) return;
    clearTimeout(p.timeout); pending.delete(m.id); p.resolve(m);
  });
  function connectSDK() {
    const f = frame();
    if (connectedFrame !== f) {
      sdk?.destroy(); sdk = window.Stream(f); connectedFrame = f;
    }
    return sdk;
  }
  function button(label, run) {
    const b = document.createElement('button');
    b.textContent = label; b.style.cssText = 'margin:4px;padding:6px;';
    b.addEventListener('click', async () => {
      const buttons = [...controls.querySelectorAll('button')];
      buttons.forEach(x => { x.disabled = true; });
      output.textContent = label + ': running';
      try {
        const r = await run();
        output.textContent = JSON.stringify({error:r.error, method:r.method,
          before:r.before && {rate:r.before.rate, paused:r.before.paused, captions:r.before.captions},
          after:r.after, verified:r.verified, labels:r.labels}, null, 2);
      }
      catch (error) { output.textContent = error.message; }
      finally { buttons.forEach(x => { x.disabled = false; }); }
    });
    controls.append(b);
  }
  button('Read actual state', () => request('read'));
  button('SDK speed 1.25', async () => {
    const before = await request('read');
    const p = connectSDK(); p.playbackRate = 1.25;
    await new Promise(resolve => setTimeout(resolve, 1200));
    const after = await request('read');
    return {method:'SDK',before:before.after,after:after.after,verified:after.after?.rate === 1.25};
  });
  button('DOM speed 1.25', () => request('rate', 1.25));
  button('Speed 1.0', () => request('rate', 1));
  button('Korean captions', () => request('captions', '한국어'));
  button('Captions Off', () => request('captions', 'Off'));
})();
