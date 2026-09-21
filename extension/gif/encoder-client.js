(() => {
  'use strict';
  globalThis.SubmetaGif.createEncoder = async (config, signal) => {
    const api = globalThis.browser || globalThis.chrome;
    const id = crypto.randomUUID();
    const token = [...crypto.getRandomValues(new Uint8Array(16))].map(byte => byte.toString(16).padStart(2, '0')).join('');
    const frame = document.createElement('iframe');
    frame.hidden = true;
    frame.title = 'Local GIF encoding worker';
    const url = new URL(api.runtime.getURL('gif/encoder.html'));
    const origin = `${url.protocol}//${url.host}`;
    frame.src = `${url.href}#${token}`;
    const channel = new MessageChannel();
    let sequence = 0, closed = false;
    const pending = new Map();
    const dispose = () => {
      if (closed) return;
      closed = true;
      signal.removeEventListener('abort', abort);
      channel.port1.postMessage({type: 'dispose'});
      channel.port1.close(); channel.port2.close(); frame.remove();
      for (const {reject, timer} of pending.values()) { clearTimeout(timer); reject(new Error('encoder-closed')); }
      pending.clear();
    };
    const abort = () => dispose();
    signal.addEventListener('abort', abort, {once: true});
    const request = (type, payload = {}, transfer = []) => {
      if (closed || signal.aborted) return Promise.reject(new Error('cancelled'));
      const seq = ++sequence;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => { pending.delete(seq); reject(new Error('encoder-timeout')); dispose(); }, 15000);
        pending.set(seq, {resolve, reject, timer});
        channel.port1.postMessage({type, id, seq, ...payload}, transfer);
      });
    };
    try {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('encoder-page-timeout')), 10000);
        const stopped = () => { clearTimeout(timer); reject(new Error('cancelled')); };
        signal.addEventListener('abort', stopped, {once: true});
        channel.port1.onmessage = ({data}) => {
          if (data.bound || data.fatal) {
            clearTimeout(timer); signal.removeEventListener('abort', stopped);
            data.fatal ? reject(new Error(data.fatal)) : resolve();
          }
        };
        channel.port1.start();
        frame.onload = () => frame.contentWindow.postMessage({type: 'bind-gif-encoder', token}, origin, [channel.port2]);
        (document.body || document.documentElement).append(frame);
        if (signal.aborted) stopped();
      });
      channel.port1.onmessage = ({data}) => {
        if (data.fatal) { dispose(); return; }
        if (data.id !== id) return;
        const item = pending.get(data.seq);
        if (!item) return;
        pending.delete(data.seq); clearTimeout(item.timer);
        data.error ? item.reject(new Error(data.error)) : item.resolve(data.result);
      };
      await request('init', {config});
      return {frame: (index, buffer) => request('frame', {index, buffer}, [buffer]),
        finish: () => request('finish'), dispose};
    } catch (error) { dispose(); throw error; }
  };
})();
