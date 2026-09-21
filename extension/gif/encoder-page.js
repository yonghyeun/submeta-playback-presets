(() => {
  'use strict';
  let worker, port;
  const token = location.hash.slice(1);
  const dispose = () => { worker?.terminate(); port?.close(); worker = port = null; };
  window.addEventListener('pagehide', dispose, {once: true});
  window.addEventListener('message', event => {
    if (port || window.parent === window || event.source !== window.parent ||
        event.origin !== 'https://iframe.cloudflarestream.com' || !/^[a-f0-9]{32}$/.test(token) ||
        event.data?.type !== 'bind-gif-encoder' || event.data.token !== token || event.ports.length !== 1) return;
    port = event.ports[0];
    try {
      worker = new Worker('encoder-worker.js', {type: 'module'});
      worker.onmessage = ({data}) => port?.postMessage(data, data.result?.buffer ? [data.result.buffer] : []);
      worker.onerror = () => { port?.postMessage({fatal: 'worker-failed'}); dispose(); };
      port.onmessage = ({data}) => {
        if (data?.type === 'dispose') { dispose(); return; }
        worker?.postMessage(data, data.buffer instanceof ArrayBuffer ? [data.buffer] : []);
      };
      port.start();
      port.postMessage({bound: true});
    } catch { port.postMessage({fatal: 'worker-unavailable'}); dispose(); }
  });
})();
