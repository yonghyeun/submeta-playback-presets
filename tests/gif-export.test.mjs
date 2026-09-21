import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
const isRelease = process.env.GIF_RELEASE_TEST !== '0';
const gifBase = new URL(isRelease ? '../extension/gif/' : '../experiments/gif-export-poc/', import.meta.url);
await import(new URL('config.js', gifBase));
const {EncoderSession} = await import(new URL('encoder-core.js', gifBase));

// Guard/packaging tests only. Real video and GIF validity are checked by live E2E.
const {selection, validEncoding, parseTimestamp, formatTimestamp, boundTimestamp, timestampLimit} = globalThis.SubmetaGif;
assert.equal(parseTimestamp('4:35'), 275);
assert.equal(parseTimestamp(' 0:00.1 '), 0.1);
assert.equal(parseTimestamp('1:02:03.4'), 3723.4);
assert.equal(formatTimestamp(275), '4:35');
assert.equal(formatTimestamp(0), '0:00');
assert.equal(formatTimestamp(59.9), '0:59.9');
assert.equal(formatTimestamp(3600), '1:00:00');
assert.equal(boundTimestamp('-0:05', 285), '0:00');
assert.equal(boundTimestamp('9:00', 285), '4:45');
assert.equal(boundTimestamp('4:45.9', 285.06), '4:45');
assert.equal(boundTimestamp('4:44.9', 285), '4:44.9');
assert.equal(timestampLimit(2.59), 2.5);
for (const value of ['', '275', '4:60', '4:-1', '1:60:00', '4:35.55', 'Infinity:00', '9999999999999999:00']) {
  assert.throws(() => parseTimestamp(value), /timestamp-invalid/);
}
for (const duration of [NaN, Infinity, 0, -1]) assert.throws(() => boundTimestamp('0:30', duration), /video-not-ready/);
const media = {duration: 285, videoWidth: 1920, videoHeight: 1080, readyState: 4};
const config = selection(30, 35, media);
assert.deepEqual(config, {start: 30, end: 35, fps: 10, width: 480, height: 270, frameCount: 50, delayMs: 100});
assert.equal(selection(30, 45, media).frameCount, 150);
assert.equal(selection(30, 31, media).frameCount, 10);
assert.equal(selection(3.1, 4.1, media).frameCount, 10);
assert.equal(selection(0.1, 15.1, media).frameCount, 150);
assert.equal(selection(parseTimestamp('4:40'), parseTimestamp('4:45'), media).frameCount, 50);
assert.throws(() => selection(parseTimestamp('4:45.1'), parseTimestamp('4:46.1'), media), /range-invalid/);
assert.equal(selection(0, 1, {...media, videoWidth: 320, videoHeight: 180}).width, 320);
assert.equal(selection(0, 1, {...media, videoWidth: 1080, videoHeight: 1920}).height, 480);
for (const [start, end] of [[-1, 3], [0, 0.5], [0, 15.1], [30, 29], [280, 286], [30.01, 35], [NaN, 35], [30, Infinity]]) {
  assert.throws(() => selection(start, end, media), /range-invalid/);
}
assert.throws(() => selection(30, 35, {...media, readyState: 1}), /video-not-ready/);
assert.equal(validEncoding({...config, width: 10000}), false);
assert.equal(validEncoding({...config, frameCount: 1000}), false);
assert.equal(validEncoding({...config, delayMs: 0}), false);
const encoder = new EncoderSession(config);
assert.throws(() => encoder.finish(), /frames-incomplete/);
assert.throws(() => encoder.frame(1, new ArrayBuffer(0)), /frame-invalid/);
assert.throws(() => encoder.frame(0, new ArrayBuffer(4)), /frame-invalid/);
assert.equal(encoder.count, 0);
const vendor = new URL('vendor/gifenc/', gifBase);
const provenance = JSON.parse(readFileSync(new URL('PROVENANCE.json', vendor)));
for (const [file, expected] of Object.entries(provenance.files)) {
  assert.equal(createHash('sha256').update(readFileSync(new URL(file, vendor))).digest('hex'), expected, file);
}
const manifest = JSON.parse(readFileSync(new URL(isRelease ? '../extension/manifest.json' : '../experiments/gif-export-poc/manifest.json', import.meta.url)));
assert.deepEqual(manifest.permissions, isRelease ? ['storage', 'downloads', 'nativeMessaging'] : ['downloads', 'nativeMessaging']);
assert.deepEqual(manifest.web_accessible_resources[0].resources, [isRelease ? 'gif/encoder.html' : 'encoder.html']);
// Reject forged senders, interleaved tabs, oversized payloads and reordered chunks
// before any real download operation. These are protocol guards, not media fixtures.
let handle, downloads = 0;
const sandbox = {URL, Blob, Uint8Array, crypto: webcrypto, atob, clearTimeout() {}, setTimeout() { return 1; },
  browser: {runtime: {id: 'gif-test', onMessage: {addListener(fn) { handle = fn; }}},
    downloads: {download() { downloads++; throw new Error('Unexpected download'); }}}};
vm.runInNewContext(readFileSync(new URL('background.js', gifBase), 'utf8'), sandbox);
const sender = {id: 'gif-test', tab: {id: 1}, frameId: 2, url: 'https://iframe.cloudflarestream.com/test'};
const begin = {type: 'gif:save-begin', bytes: 14, sha256: '0'.repeat(64), filename: 'submeta-30000-35000-aabb.gif'};
assert.equal((await handle(begin, {...sender, url: 'https://example.com/'})).error, 'sender-invalid');
assert.equal((await handle(begin, {...sender, frameId: 0})).error, 'sender-invalid');
assert.equal((await handle({...begin, bytes: 21 * 1024 * 1024}, sender)).error, 'save-invalid');
let ticket = (await handle(begin, sender)).ticket;
assert.equal((await handle(begin, sender)).error, 'save-busy');
assert.equal((await handle({type: 'gif:save-abort', ticket}, {...sender, tab: {id: 2}})).error, 'save-session-invalid');
assert.equal((await handle({type: 'gif:save-chunk', ticket, seq: 1, data: ''}, sender)).error, 'save-chunk-invalid');
ticket = (await handle(begin, sender)).ticket;
assert.equal((await handle({type: 'gif:save-finish', ticket}, sender)).error, 'save-incomplete');
ticket = (await handle(begin, sender)).ticket;
assert.equal((await handle({type: 'gif:save-chunk', ticket, seq: 0, data: Buffer.alloc(14).toString('base64')}, sender)).received, 14);
assert.equal((await handle({type: 'gif:save-finish', ticket}, sender)).error, 'save-integrity-invalid');
assert.equal(downloads, 0);
// Native routing guards only; real filesystem writes use the actual GIF in
// FolderStoreTests.swift and the live Firefox folder-picker run.
let nativeCalls = [], nativeClosed = 0;
sandbox.GifNativeFolder = {
  async call(type) { nativeCalls.push(type); return {status: 'unselected'}; },
  open() { return {
    async request(type) {
      nativeCalls.push(type);
      if (type === 'save.begin') return {ticket: 'native-ticket', folder: {name: 'chosen'}};
      if (type === 'save.chunk') return {received: 14};
      if (type === 'save.finish') return {status: 'complete', filename: 'saved.gif'};
      throw new Error('Unexpected native operation');
    }, close() { nativeClosed++; }
  }; }
};
assert.equal((await handle({type: 'gif:folder-choose'}, {...sender, url: 'https://example.com/'})).error, 'sender-invalid');
assert.equal(nativeCalls.length, 0);
assert.equal((await handle({type: 'gif:folder-status'}, sender)).status, 'unselected');
assert.equal((await handle({...begin, destination: '/untrusted/path'}, sender)).error, 'save-invalid');
ticket = (await handle({...begin, destination: 'remembered-folder'}, sender)).ticket;
assert.equal((await handle({type: 'gif:folder-choose'}, sender)).error, 'save-busy');
assert.equal((await handle({type: 'gif:save-chunk', ticket, seq: 0, data: Buffer.alloc(14).toString('base64')}, sender)).received, 14);
assert.equal((await handle({type: 'gif:save-finish', ticket}, sender)).status, 'complete');
assert.equal(nativeClosed, 1);
assert.equal(downloads, 0, 'Remembered folder must not silently open the browser save dialog');
assert.deepEqual(nativeCalls, ['folder.status', 'save.begin', 'save.chunk', 'save.finish']);
console.log('GIF input, encoder protocol, save authorization/integrity and vendored package guards passed');

await import(new URL('timeline.js', gifBase));
const {moveRange, thumbnailURL} = globalThis.SubmetaGif;
for (const duration of [1, 2.59, 285, 7200]) {
  for (const side of ['start', 'end']) for (const value of [-10, 0, 0.1, 30, 284.9, 9000]) {
    const [a, b] = moveRange(0, Math.min(5, duration), side, value, duration);
    globalThis.SubmetaGif.validateRange(a, b, duration);
  }
}
assert.deepEqual(moveRange(30, 35, 'start', 280, 285), [34, 35]);
assert.deepEqual(moveRange(30, 35, 'end', 285, 285), [30, 45]);
assert.throws(() => moveRange(0, 1, 'start', 0, 0.9));
const thumb = new URL(thumbnailURL('https://iframe.cloudflarestream.com/signed-token?autoplay=true', '', 35.1));
assert.equal(thumb.pathname, '/signed-token/thumbnails/thumbnail.jpg');
assert.equal(thumb.searchParams.get('time'), '35.1s');
assert.equal(new URL(thumbnailURL('https://iframe.cloudflarestream.com/signed-token', 'https://attacker.example/thumbnails/thumbnail.jpg', 2)).hostname, 'videodelivery.net');
console.log('Slider range boundaries and thumbnail destination guards passed');
assert.deepEqual(moveRange(30, 35, 'start', 0, 285), [20, 35]);
assert.deepEqual(moveRange(30, 35, 'end', 0, 285), [30, 31]);
assert.deepEqual(moveRange(30, 35, 'move', 100, 285), [100, 105]);
assert.deepEqual(moveRange(30, 35, 'move', 999, 285), [280, 285]);
assert.deepEqual(moveRange(30, 35, 'move', -100, 285), [0, 5]);
for (const value of [-100, 0, 10, 200, 1000]) {
  const moved = moveRange(30.1, 35.2, 'move', value, 285);
  assert.equal(Math.round((moved[1] - moved[0]) * 10), 51);
  assert.equal(moveRange(30, 35, 'start', value, 285)[1], 35);
  assert.equal(moveRange(30, 35, 'end', value, 285)[0], 30);
}
console.log('Single timeline trim isolation and whole-selection movement passed');

// Clipboard uses the authenticated native channel; it cannot trigger downloads.
nativeCalls = [];
sandbox.GifNativeFolder.open = () => ({
  async request(type) { nativeCalls.push(type); return type === 'clipboard.begin' ? {ticket: 'clipboard-ticket'} : type === 'save.chunk' ? {received: 14} : {status: 'copied'}; },
  close() {}
});
assert.equal((await handle({...begin, destination: 'clipboard'}, {...sender, url: 'https://example.com/'})).error, 'sender-invalid');
ticket = (await handle({...begin, destination: 'clipboard'}, sender)).ticket;
assert.equal((await handle({type: 'gif:save-chunk', ticket, seq: 0, data: Buffer.alloc(14).toString('base64')}, sender)).received, 14);
assert.equal((await handle({type: 'gif:save-finish', ticket}, sender)).status, 'copied');
assert.deepEqual(nativeCalls, ['clipboard.begin', 'save.chunk', 'save.finish']);
assert.equal(downloads, 0);
console.log('Clipboard sender authorization and native-only routing passed');
// Parent UI may only relay modal visibility, never file/clipboard operations.
const parent = {...sender, frameId: 0, url: 'https://submeta.io/@teacher/courses/course/lesson'};
assert.equal((await handle({type:'gif:ui-ready'}, parent)).error, 'sender-invalid');
assert.equal((await handle({type:'gif:ui-open'}, {...parent, url:'https://example.com/'})).error, 'sender-invalid');
assert.equal((await handle({...begin, destination:'clipboard'}, parent)).error, 'sender-invalid');
assert.equal((await handle({type:'gif:ui-ready'}, sender)).ready, true);
const relays = [];
sandbox.browser.tabs = {async sendMessage(tabId, message, options) {
  relays.push({tabId, type:message.type, frameId:options?.frameId});
  if (!options) throw new Error('no player');
  return {ready:true};
}};
assert.equal((await handle({type:'gif:ui-open'}, parent)).ready, true);
assert.deepEqual(relays.pop(), {tabId:1,type:'gif:ui-open',frameId:2});
assert.equal((await handle({type:'gif:ui-open'}, {...parent, tab:{id:99}})).error, 'player-unavailable');
assert.equal((await handle({type:'gif:ui-dismiss'}, {...sender, frameId:9})).error, 'sender-invalid');
assert.equal((await handle({type:'gif:ui-dismiss'}, sender)).ready, true);
assert.deepEqual(relays.pop(), {tabId:1,type:'gif:ui-dismiss',frameId:0});
console.log('Modal relay origin, frame direction and tab isolation passed');

// Exercise the actual content-side transfer, including a partial final chunk.
const transferBytes = Uint8Array.from({length: 200013}, (_, i) => i % 251);
for (const destination of ['clipboard', 'remembered-folder', 'browser']) {
  const received = [], calls = [];
  const client = {SubmetaGif: {}, Uint8Array, btoa, browser: {runtime: {async sendMessage(message) {
    calls.push(message.type);
    if (message.type === 'gif:save-begin') {
      assert.equal(message.destination, destination);
      return {ticket: 'client-ticket', chunkBytes: 96 * 1024};
    }
    if (message.type === 'gif:save-chunk') {
      assert.equal(message.seq, received.length);
      received.push(Buffer.from(message.data, 'base64'));
      return {received: received.reduce((total, chunk) => total + chunk.length, 0)};
    }
    if (message.type === 'gif:save-finish') return {status: destination === 'clipboard' ? 'copied' : 'complete'};
    throw new Error('Unexpected abort');
  }}}};
  vm.runInNewContext(readFileSync(new URL('save.js', gifBase), 'utf8'), client);
  const response = await client.SubmetaGif.save({blob: new Blob([transferBytes]), filename: begin.filename, hash: begin.sha256}, {destination});
  assert.equal(response.status, destination === 'clipboard' ? 'copied' : 'complete');
  assert.deepEqual(Buffer.concat(received), Buffer.from(transferBytes));
  assert.equal(calls.at(-1), 'gif:save-finish');
}
console.log('Content-side clipboard/folder/browser transfer preserves all bytes across chunks');

if (isRelease) {
  // Chrome's service-worker global has no createObjectURL. Download the verified
  // bytes without relying on a page-owned Blob or making a network request.
  class WorkerURL extends URL {}
  WorkerURL.createObjectURL = undefined;
  let workerHandle, downloaded;
  const bytes = new Uint8Array(14);bytes.set(new TextEncoder().encode('GIF89a'));bytes[13]=0x3b;
  const hash = createHash('sha256').update(bytes).digest('hex');
  const workerContext = {URL:WorkerURL,Blob,Uint8Array,crypto:webcrypto,atob,btoa,
    clearTimeout(){},setTimeout(){return 1;},browser:{
      runtime:{id:'gif-test',onMessage:{addListener(fn){workerHandle=fn;}}},
      downloads:{async download(options){downloaded=options;return 7;},
        onChanged:{addListener(){},removeListener(){}},async search(){return [{state:'complete'}];}}
    }};
  vm.runInNewContext(readFileSync(new URL('background.js',gifBase),'utf8'),workerContext);
  const beginResponse = await workerHandle({...begin,sha256:hash,destination:'browser'},sender);
  await workerHandle({type:'gif:save-chunk',ticket:beginResponse.ticket,seq:0,data:Buffer.from(bytes).toString('base64')},sender);
  assert.equal((await workerHandle({type:'gif:save-finish',ticket:beginResponse.ticket},sender)).status,'complete');
  assert.equal(downloaded.url,'data:image/gif;base64,'+Buffer.from(bytes).toString('base64'));
  assert.equal(downloaded.saveAs,true);
  console.log('Chrome service-worker download fallback preserves validated GIF bytes');
}
