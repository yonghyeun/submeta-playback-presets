import type {Tone} from './types';
export interface TimelineMedia {currentSrc: string; poster: string}
export type TimelineFactory = (options: {container: HTMLElement; video: () => TimelineMedia | null; change: (start: number,end: number) => void}) => {sync: (start: number,end: number,duration: number,disabled: boolean) => void; dispose: () => void};
export interface GifEditorState {
  start: string; end: string; duration: number; mediaKey: string;
  range: [number,number]; bounds: string; timeError: string;
  invalid: {start: boolean; end: boolean};
  busy: 'idle' | 'generating' | 'saving' | 'copying';
  status: string; tone: Tone; clipboardStatus: string; clipboardTone: Tone;
  folderLabel: string; nativeAvailable: boolean;
  previewURL: string; report: string;
  progress: {value: number; max: number} | null;
}
export interface GifActions {
  changeTime: (field: 'start' | 'end',value: string,commit?: boolean) => void;
  range: (start: number,end: number) => void;
  generate: () => void; cancel: () => void; close: () => void;
  copy: () => void; save: (destination: 'browser' | 'remembered-folder') => void; chooseFolder: () => void;
}
export const initialGifState: GifEditorState = {
  start:'0:30',end:'0:35',duration:0,mediaKey:'',range:[30,35],bounds:'영상 길이를 확인하는 중…',timeError:'',invalid:{start:false,end:false},
  busy:'idle',status:'구간을 선택한 뒤 GIF를 생성하세요.',tone:'neutral',clipboardStatus:'생성이 끝나면 지원되는 환경에서 클립보드에 자동 복사됩니다.',clipboardTone:'neutral',
  folderLabel:'저장 폴더 확인 중…',nativeAvailable:false,previewURL:'',report:'',progress:null,
};
