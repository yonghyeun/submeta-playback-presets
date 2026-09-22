import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
import {GifEditor, GifLauncher, type GifLauncherProps} from './gif-components';
import {gifCSS,gifHostCSS,gifLauncherCSS,gifBackdropCSS,gifFrameStyles} from './gif-styles';
import {initialGifState,type GifEditorState,type GifActions,type TimelineFactory,type TimelineMedia} from './gif-types';
import {trapGifFocus} from './gif-focus';
export function mountGifEditor(root:ShadowRoot,{state={},actions,timeline,video}:{state?:Partial<GifEditorState>;actions:GifActions;timeline:TimelineFactory;video:()=>TimelineMedia|null}) {
  const portal=document.createElement('div');portal.slot='gif-times';root.host.append(portal);
  const reactRoot=createRoot(root);let current={...initialGifState,...state};let destroyed=false;
  const render=()=>{if(!destroyed)flushSync(()=>reactRoot.render(<><style>{gifCSS}</style><GifEditor {...current} actions={actions} timeline={timeline} video={video} timePortal={portal}/></>));};
  render();
  return {update(next:Partial<GifEditorState>){current={...current,...next};render();},focusClose(){root.querySelector<HTMLButtonElement>('#gif-close')?.focus();},trapFocus(event:KeyboardEvent){trapGifFocus(event,root);},destroy(){if(!destroyed){flushSync(()=>reactRoot.unmount());portal.remove();destroyed=true;}}};
}
export function mountGifLauncher(root:ShadowRoot,{onOpen}:{onOpen:()=>void}) {
  const reactRoot=createRoot(root);let state:Omit<GifLauncherProps,'onOpen'>={opened:false,disabled:false,hint:'구간을 선택하고 GIF로 만들기'};
  const render=()=>flushSync(()=>reactRoot.render(<><style>{gifLauncherCSS}</style><GifLauncher {...state} onOpen={onOpen}/></>));render();
  return {update(next:Partial<typeof state>){state={...state,...next};render();},focus(){root.querySelector('button')?.focus();},destroy(){reactRoot.unmount();}};
}
Object.assign(globalThis.SubmetaUI,{mountGifEditor,mountGifLauncher,gifHostCSS,gifBackdropCSS,gifFrameStyles});
