(() => {
  'use strict';
  const api = globalThis.browser || globalThis.chrome;
  const players = new Map();
  api.tabs?.onRemoved?.addListener(id => players.delete(id));
  const jobs = new Map(), MAX_BYTES = 20 * 1024 * 1024, CHUNK = 96 * 1024;
  function release(key) {
    const job = jobs.get(key);
    if (!job) return;
    clearTimeout(job.timer);
    if (job.url?.startsWith('blob:')) URL.revokeObjectURL(job.url);
    job.native?.close();
    jobs.delete(key);
  }
  function refresh(key, job) { clearTimeout(job.timer); job.timer = setTimeout(() => release(key), 30000); }
  api.runtime.onMessage.addListener((message, sender) => {
    if (!['gif:platform', 'gif:ui-ready', 'gif:ui-open', 'gif:ui-close', 'gif:ui-focus', 'gif:ui-dismiss', 'gif:folder-status', 'gif:folder-choose', 'gif:save-begin', 'gif:save-chunk', 'gif:save-finish', 'gif:save-abort'].includes(message?.type)) return undefined;
    return handle(message, sender);
  });
  async function handle(message, sender) {
    let origin;
    try { origin = new URL(sender.url).origin; } catch { return {error: 'sender-invalid'}; }
    if (message.type.startsWith('gif:ui-')) {
      if (sender.id !== api.runtime.id || !sender.tab) return {error: 'sender-invalid'};
      const child = sender.frameId > 0 && origin === 'https://iframe.cloudflarestream.com';
      const parent = sender.frameId === 0 && origin === 'https://submeta.io';
      if (message.type === 'gif:ui-ready' && child) { players.set(sender.tab.id, sender.frameId); return {ready:true}; }
      if (message.type === 'gif:ui-dismiss' && child && players.get(sender.tab.id) === sender.frameId) {
        return api.tabs.sendMessage(sender.tab.id, {type:'gif:ui-dismiss'}, {frameId:0});
      }
      if (parent && ['gif:ui-open','gif:ui-close','gif:ui-focus'].includes(message.type)) {
        if (!players.has(sender.tab.id)) {
          try { await api.tabs.sendMessage(sender.tab.id, {type:'gif:ui-probe'}); } catch { /* Player may still be loading. */ }
        }
        const frameId = players.get(sender.tab.id);
        if (!frameId) return {error:'player-unavailable'};
        try { return await api.tabs.sendMessage(sender.tab.id, {type:message.type}, {frameId}); }
        catch { players.delete(sender.tab.id); return {error:'player-unavailable'}; }
      }
      return {error:'sender-invalid'};
    }
    if (sender.id !== api.runtime.id || !sender.tab || !Number.isInteger(sender.frameId) || sender.frameId <= 0 ||
        origin !== 'https://iframe.cloudflarestream.com') return {error: 'sender-invalid'};
    if (message.type === 'gif:platform') return api.runtime.getPlatformInfo();
    const key = `${sender.tab.id}:${sender.frameId}`;
    if (message.type === 'gif:folder-status' || message.type === 'gif:folder-choose') {
      if (message.type === 'gif:folder-choose' && jobs.has(key)) return {error: 'save-busy'};
      return globalThis.GifNativeFolder.call(message.type === 'gif:folder-status' ? 'folder.status' : 'folder.choose');
    }
    if (message.type === 'gif:save-begin') {
      if (jobs.has(key) || jobs.size >= 2) return {error: 'save-busy'};
      if (!Number.isInteger(message.bytes) || message.bytes < 14 || message.bytes > MAX_BYTES ||
          !/^[a-f0-9]{64}$/.test(message.sha256) ||
          !/^submeta-\d+-\d+-[a-f0-9-]+\.gif$/.test(message.filename) ||
          ![undefined, 'browser', 'remembered-folder', 'clipboard'].includes(message.destination)) return {error: 'save-invalid'};
      if (['remembered-folder', 'clipboard'].includes(message.destination)) {
        const job = {ticket: crypto.randomUUID(), offset: 0, seq: 0, size: message.bytes, saving: false};
        jobs.set(key, job);
        try {
          job.native = globalThis.GifNativeFolder.open();
          const response = await job.native.request(message.destination === 'clipboard' ? 'clipboard.begin' : 'save.begin', {bytes: message.bytes, filename: message.filename, sha256: message.sha256}, 300000);
          if (!response.ticket) { release(key); return response; }
          job.nativeTicket = response.ticket; refresh(key, job);
          return {ticket: job.ticket, chunkBytes: CHUNK, folder: response.folder};
        } catch { release(key); return {error: 'native-host-unavailable'}; }
      }
      const job = {ticket: crypto.randomUUID(), filename: message.filename, sha256: message.sha256,
        bytes: new Uint8Array(message.bytes), offset: 0, seq: 0, saving: false};
      jobs.set(key, job); refresh(key, job);
      return {ticket: job.ticket, chunkBytes: CHUNK};
    }
    const job = jobs.get(key);
    if (!job || message.ticket !== job.ticket || job.saving) return {error: 'save-session-invalid'};
    if (message.type === 'gif:save-abort') { release(key); return {status: 'aborted'}; }
    if (job.native) {
      if (message.type === 'gif:save-chunk') {
        if (message.seq !== job.seq || typeof message.data !== 'string' || message.data.length > CHUNK * 4 / 3) {
          release(key); return {error: 'save-chunk-invalid'};
        }
        try {
          const response = await job.native.request('save.chunk', {ticket: job.nativeTicket, seq: message.seq, data: message.data});
          const expected = Math.min(job.size, job.offset + CHUNK);
          if (response.received !== expected) { release(key); return response.error ? response : {error: 'save-transfer-failed'}; }
          job.offset = expected; job.seq++; refresh(key, job);
          return {received: job.offset};
        } catch { release(key); return {error: 'native-host-disconnected'}; }
      }
      if (job.offset !== job.size) { release(key); return {error: 'save-incomplete'}; }
      job.saving = true; clearTimeout(job.timer);
      try { return await job.native.request('save.finish', {ticket: job.nativeTicket}, 120000); }
      catch { return {error: 'save-result-unknown'}; }
      finally { release(key); }
    }
    if (message.type === 'gif:save-chunk') {
      const expected = Math.min(CHUNK, job.bytes.length - job.offset);
      if (!expected || message.seq !== job.seq || typeof message.data !== 'string' ||
          message.data.length > CHUNK * 4 / 3 || !/^[A-Za-z0-9+/]*={0,2}$/.test(message.data)) {
        release(key); return {error: 'save-chunk-invalid'};
      }
      let decoded;
      try { decoded = atob(message.data); } catch { release(key); return {error: 'save-chunk-invalid'}; }
      if (decoded.length !== expected) { release(key); return {error: 'save-chunk-invalid'}; }
      for (let index = 0; index < decoded.length; index++) job.bytes[job.offset + index] = decoded.charCodeAt(index);
      job.offset += expected; job.seq++; refresh(key, job);
      return {received: job.offset};
    }
    if (job.offset !== job.bytes.length) { release(key); return {error: 'save-incomplete'}; }
    job.saving = true; clearTimeout(job.timer);
    try {
      const header = String.fromCharCode(...job.bytes.subarray(0, 6));
      const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', job.bytes))].map(byte => byte.toString(16).padStart(2, '0')).join('');
      if (header !== 'GIF89a' || job.bytes[job.bytes.length - 1] !== 0x3b || digest !== job.sha256) {
        release(key); return {error: 'save-integrity-invalid'};
      }
      // Own the Blob in the extension background, rather than asking downloads
      // to read a Blob belonging to the signed Cloudflare player document.
      if (typeof URL.createObjectURL === 'function') {
        job.url = URL.createObjectURL(new Blob([job.bytes], {type: 'image/gif'}));
      } else {
        // Chrome service workers cannot create Blob URLs. Use the verified local bytes.
        let binary = '';
        for (let offset = 0; offset < job.bytes.length; offset += CHUNK) {
          binary += String.fromCharCode(...job.bytes.subarray(offset, offset + CHUNK));
        }
        job.url = 'data:image/gif;base64,' + btoa(binary);
      }
      job.bytes = null;
      const id = await api.downloads.download({url: job.url, filename: job.filename, saveAs: true, conflictAction: 'uniquify'});
      return await new Promise(resolve => {
        let replied = false;
        const reply = value => { if (!replied) { replied = true; resolve(value); } };
        const finish = value => { clearTimeout(timer); api.downloads.onChanged.removeListener(changed); release(key); reply(value); };
        const changed = delta => {
          if (delta.id !== id) return;
          if (delta.state?.current === 'complete') finish({status: 'complete', downloadId: id});
          else if (delta.state?.current === 'interrupted') finish({error: 'download-interrupted'});
        };
        // An unknown result does not revoke a URL still owned by an active download.
        const timer = setTimeout(() => reply({error: 'save-result-unknown'}), 120000);
        api.downloads.onChanged.addListener(changed);
        api.downloads.search({id}).then(items => {
          if (items[0]?.state === 'complete') finish({status: 'complete', downloadId: id});
          else if (items[0]?.state === 'interrupted') finish({error: 'download-interrupted'});
        }).catch(() => reply({error: 'save-result-unknown'}));
      });
    } catch { release(key); return {error: 'save-cancelled-or-failed'}; }
  }
})();
