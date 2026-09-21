import './config.js';
import {GIFEncoder, quantize, applyPalette} from './vendor/gifenc/src/index.js';

export class EncoderSession {
  constructor(config) {
    if (!globalThis.SubmetaGif.validEncoding(config)) throw new Error('encoding-options-invalid');
    this.config = {...config};
    this.gif = GIFEncoder();
    this.count = 0;
    this.closed = false;
    this.encodeMs = 0;
    this.maxBufferBytes = 0;
  }
  frame(index, buffer) {
    if (this.closed || index !== this.count || this.count >= this.config.frameCount ||
        !(buffer instanceof ArrayBuffer) || buffer.byteLength !== this.config.width * this.config.height * 4) {
      throw new Error('frame-invalid');
    }
    const started = performance.now();
    const pixels = new Uint8Array(buffer);
    const palette = quantize(pixels, 256, {format: 'rgb565'});
    const indices = applyPalette(pixels, palette, 'rgb565');
    this.gif.writeFrame(indices, this.config.width, this.config.height,
      {palette, delay: this.config.delayMs, repeat: 0, dispose: 1});
    if (this.gif.bytesView().byteLength > globalThis.SubmetaGif.MAX_BYTES) {
      this.closed = true; this.gif = null;
      throw new Error('output-too-large');
    }
    this.count++;
    this.encodeMs += performance.now() - started;
    this.maxBufferBytes = Math.max(this.maxBufferBytes, this.gif.buffer.byteLength);
    return {encoded: this.count, bytes: this.gif.bytesView().byteLength};
  }
  finish() {
    if (this.closed || this.count !== this.config.frameCount) throw new Error('frames-incomplete');
    this.gif.finish();
    const bytes = this.gif.bytes();
    if (bytes.length > globalThis.SubmetaGif.MAX_BYTES) throw new Error('output-too-large');
    this.closed = true; this.gif = null;
    return {buffer: bytes.buffer, metrics: {frameCount: this.count, encodeMs: Math.round(this.encodeMs),
      maxBufferBytes: this.maxBufferBytes, rawFrameBytes: this.config.width * this.config.height * 4,
      maxInFlightFrames: 1, outputBytes: bytes.length}};
  }
}
