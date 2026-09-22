import type {mountPlaybackSettings} from './mount';
import type {mountGifEditor,mountGifLauncher} from './gif-mount';
declare global {
  var SubmetaUI: {
    mountGifEditor: typeof mountGifEditor;
    mountGifLauncher: typeof mountGifLauncher;
    gifHostCSS: string;
    gifBackdropCSS: string;
    gifFrameStyles: Record<string,string>;
    tokenCSS: string;
    controlCSS: string;
    tokens: Record<string, string>;
    mountPlaybackSettings: typeof mountPlaybackSettings;
  };
}
