import {EncoderSession} from './encoder-core.js';

let session, jobId;
self.onmessage = event => {
  const message = event.data;
  if (!message || typeof message.id !== 'string' || !Number.isSafeInteger(message.seq)) return;
  try {
    let result;
    if (message.type === 'init' && !session) {
      session = new EncoderSession(message.config); jobId = message.id;
      result = {ready: true};
    } else if (message.id !== jobId || !session) { throw new Error('job-invalid'); }
    else if (message.type === 'frame') { result = session.frame(message.index, message.buffer); }
    else if (message.type === 'finish') { result = session.finish(); }
    else { throw new Error('command-invalid'); }
    self.postMessage({id: message.id, seq: message.seq, result}, result.buffer ? [result.buffer] : []);
  } catch (error) {
    const allowed = ['encoding-options-invalid', 'frame-invalid', 'frames-incomplete', 'job-invalid', 'command-invalid', 'output-too-large'];
    self.postMessage({id: message.id, seq: message.seq, error: allowed.includes(error.message) ? error.message : 'encoder-failed'});
    self.close();
  }
};
