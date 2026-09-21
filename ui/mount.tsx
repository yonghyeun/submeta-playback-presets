import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {PlaybackSettings} from './components';
import {playbackCSS} from './styles';
import {initialState, type PlaybackState, type PlaybackActions, type StatusId, type Tone} from './types';

/** Adapter for the extension's existing storage and player controller. */
export function mountPlaybackSettings(container: Element | ShadowRoot, {state = {}, actions = {}}: {state?: Partial<PlaybackState>; actions?: PlaybackActions} = {}) {
  const reactRoot = createRoot(container);
  let current = {...initialState, ...state};
  let destroyed = false;
  const render = () => {
    if (destroyed) return;
    flushSync(() => reactRoot.render(<><style>{playbackCSS}</style><PlaybackSettings {...current} actions={actions}/></>));
  };
  render();
  return {
    // Read-only inspection for integration tests. Product events carry values.
    get: (id: string) => container.querySelector<HTMLElement>('#' + id)!,
    update(next: Partial<PlaybackState>) {current = {...current, ...next}; render();},
    setText(id: StatusId, value: string, tone?: Tone) {
      current = {...current, [id]:value, tones:{...current.tones, [id]:tone ?? (/실패|끊김/.test(value) ? 'error' : /저장됨/.test(value) ? 'success' : 'neutral')}};
      render();
    },
    destroy() {if (!destroyed) {flushSync(() => reactRoot.unmount()); destroyed = true;}},
  };
}
globalThis.SubmetaUI.mountPlaybackSettings = mountPlaybackSettings;
