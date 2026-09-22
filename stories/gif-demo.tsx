import {useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import '../extension/gif/config.js';
import '../extension/gif/timeline.js';
import {GifEditor} from '../ui/gif-components';
import {gifCSS} from '../ui/gif-styles';
import {trapGifFocus} from '../ui/gif-focus';
import {initialGifState,type GifEditorState,type TimelineFactory} from '../ui/gif-types';
import type {Theme} from '../ui/types';
const gif=(globalThis as unknown as {SubmetaGif:{timeline:TimelineFactory;parseTimestamp:(text:string)=>number;formatTimestamp:(value:number)=>string;validateRange:(start:number,end:number,duration:number)=>number}}).SubmetaGif;
const example='/evidence/gif-example.svg';
const timeline:TimelineFactory=options=>gif.timeline({...options,thumbnailURL:()=>example} as Parameters<TimelineFactory>[0]);
const demoMedia={currentSrc:'storybook-fixed-example',poster:''};
const video=()=>demoMedia;
export const gifScenarios:Record<string,Partial<GifEditorState>>={
  ready:{},loading:{duration:0,bounds:'영상 길이를 확인하는 중…'},
  invalid:{start:'0:99',timeError:'시작 시간을 4:35처럼 분:초로 입력해주세요.',invalid:{start:true,end:false}},
  generating:{busy:'generating',status:'GIF 생성 중 24/50',progress:{value:24,max:50}},
  cancelled:{status:'생성을 취소했습니다. 선택한 구간은 유지됩니다.'},
  error:{status:'이 영상의 프레임을 읽을 수 없습니다. 다시 시도해주세요.',tone:'error'},
  complete:{previewURL:example,status:'GIF 생성 완료 · 저장할 수 있습니다.',tone:'success',clipboardStatus:'클립보드 복사 완료 · 원본 GIF 파일로 복사했습니다.',clipboardTone:'success'},
  saving:{previewURL:example,busy:'saving',status:'기억한 폴더에 저장합니다…'},
  saved:{previewURL:example,status:'GIF 파일 저장 완료',tone:'success'},
  saveError:{previewURL:example,status:'저장에 실패했습니다. GIF를 다시 저장할 수 있습니다.',tone:'error'},
  copyError:{previewURL:example,clipboardStatus:'클립보드 복사 실패 · 생성한 GIF는 유지됩니다. 다시 복사하거나 파일로 저장해주세요.',clipboardTone:'error'},
  nativeUnavailable:{previewURL:example,nativeAvailable:false,folderLabel:'폴더 기억과 GIF 파일 복사는 Mac 보조 앱 설치가 필요합니다. 일반 파일 저장은 사용할 수 있습니다.'},
  folderUnselected:{previewURL:example,folderLabel:'첫 저장 때 폴더를 선택하면 다음에도 사용합니다.'},
};
const surfaces=new WeakMap<HTMLElement,{root:ShadowRoot;portal:HTMLElement}>();
function Surface({state,actions,theme,mode}:{state:GifEditorState;actions:Parameters<typeof GifEditor>[0]['actions'];theme:Theme;mode:ShadowRootMode}) {
  const host=useRef<HTMLElement>(null);
  const [surface,setSurface]=useState<{root:ShadowRoot;portal:HTMLElement}>();
  useLayoutEffect(()=>{
    const element=host.current!;let value=surfaces.get(element);
    if(!value){const root=element.attachShadow({mode});const portal=document.createElement('div');portal.slot='gif-times';element.append(portal);value={root,portal};surfaces.set(element,value);}
    setSurface(value);
  },[mode]);
  useLayoutEffect(()=>{
    if(!surface)return;
    const element=host.current!;
    const keydown=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();actions.close();}else trapGifFocus(event,surface.root);};
    element.addEventListener('keydown',keydown,true);
    return ()=>element.removeEventListener('keydown',keydown,true);
  },[surface,actions]);
  return <aside ref={host} className="gif-demo-host" data-theme={theme} role="dialog" aria-modal="true" aria-label="GIF 만들기">{surface&&createPortal(<><style>{gifCSS}</style><GifEditor {...state} actions={actions} timeline={timeline} video={video} timePortal={surface.portal}/></>,surface.root)}</aside>;
}
export interface GifDemoProps {scenario?:string;theme?:Theme;mode?:ShadowRootMode}
function Demo({scenario='ready',theme='dark',mode='open'}:GifDemoProps) {
  const [state,setState]=useState<GifEditorState>(()=>({...initialGifState,duration:285,range:[30,35],bounds:'입력 범위 0:00–4:45 · 분:초 (예: 4:35)',nativeAvailable:true,folderLabel:'저장 폴더: 예시 폴더',...gifScenarios[scenario]}));
  const [open,setOpen]=useState(true);
  const timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  useEffect(()=>()=>clearTimeout(timer.current),[]);
  function changeTime(field:'start'|'end',value:string,commit=false) {
    setState(previous=>{
      const next={...previous,[field]:value,invalid:{start:false,end:false},timeError:''};
      try {const a=gif.parseTimestamp(next.start),b=gif.parseTimestamp(next.end);gif.validateRange(a,b,next.duration);next.range=[a,b];if(commit){next.start=gif.formatTimestamp(a);next.end=gif.formatTimestamp(b);}}
      catch {next.timeError='시간 형식과 1–15초 구간을 확인해주세요.';next.invalid={start:true,end:true};}
      return next;
    });
  }
  const patch=(value:Partial<GifEditorState>)=>setState(previous=>({...previous,...value}));
  return <main className="gif-demo-page"><p className="gif-demo-note">디자인 시스템 · GIF 편집기 / 상태 예시입니다. 실제 영상 생성·저장·복사는 실행하지 않습니다.</p>{open?<Surface theme={theme} mode={mode} state={state} actions={{
    changeTime,range(a,b){patch({range:[a,b],start:gif.formatTimestamp(a),end:gif.formatTimestamp(b),timeError:'',invalid:{start:false,end:false}});},
    generate(){patch({busy:'generating',status:'GIF 생성 중 24/50',tone:'neutral',progress:{value:24,max:50},previewURL:''});timer.current=setTimeout(()=>patch({busy:'idle',status:'GIF 생성 완료 · 상태 예시',tone:'success',progress:null,previewURL:example}),1500);},
    cancel(){clearTimeout(timer.current);patch({busy:'idle',status:'생성을 취소했습니다. 선택한 구간은 유지됩니다.',tone:'neutral',progress:null});},
    close(){clearTimeout(timer.current);patch({busy:'idle',progress:null});setOpen(false);},
    save(){patch({busy:'saving',status:'저장 응답을 기다리는 중…',tone:'neutral'});timer.current=setTimeout(()=>patch({busy:'idle',status:'GIF 파일 저장 완료 · 상태 예시',tone:'success'}),500);},
    copy(){patch({clipboardStatus:'클립보드 복사 완료 · 상태 예시',clipboardTone:'success'});},
    chooseFolder(){patch({folderLabel:'저장 폴더: 변경한 예시 폴더',status:'저장 폴더를 기억했습니다. · 상태 예시',tone:'success'});},
  }}/>:<button onClick={()=>setOpen(true)}>GIF 편집기 열기</button>}</main>;
}
export function GifDemo(props:GifDemoProps){return <Demo key={`${props.scenario}/${props.theme}/${props.mode}`} {...props}/>;}
