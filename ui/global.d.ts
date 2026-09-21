import type {mountPlaybackSettings} from './mount';
declare global {
  var SubmetaUI: {
    tokenCSS: string;
    controlCSS: string;
    tokens: Record<string, string>;
    mountPlaybackSettings: typeof mountPlaybackSettings;
  };
}
