import {useId, useLayoutEffect, useRef} from 'react';
import {createPortal} from 'react-dom';
import {Button, Disclosure, Progress, StatusMessage} from './components';
import type {Tone} from './types';
import type {GifActions, GifEditorState, TimelineFactory, TimelineMedia} from './gif-types';
import {timeCSS, timePortalCSS} from './gif-styles';

export interface TimeFieldProps {id:string;label:string;value:string;disabled:boolean;invalid:boolean;describedBy:string;onChange:(value:string,commit?:boolean)=>void}
export function TimeField({id,label,value,disabled,invalid,describedBy,onChange}:TimeFieldProps) {
  return <label className="sm-field" htmlFor={id}>{label}<input id={id} className="sm-input" type="text" value={value} placeholder="4:35" autoComplete="off" spellCheck={false} disabled={disabled} aria-invalid={invalid} aria-describedby={describedBy} onChange={event=>onChange(event.currentTarget.value)} onBlur={event=>onChange(event.currentTarget.value,true)}/></label>;
}
export interface TimelineProps {factory:TimelineFactory;video:()=>TimelineMedia|null;range:[number,number];duration:number;disabled:boolean;mediaKey:string;onChange:(start:number,end:number)=>void}
/** The existing drag/thumbnail controller owns only this empty subtree. */
export function Timeline({factory,video,range,duration,disabled,mediaKey,onChange}:TimelineProps) {
  const container=useRef<HTMLDivElement>(null);
  const controller=useRef<ReturnType<TimelineFactory>|null>(null);
  const latest=useRef({video,onChange});latest.current={video,onChange};
  useLayoutEffect(()=>{
    controller.current=factory({container:container.current!,video:()=>latest.current.video(),change:(a,b)=>latest.current.onChange(a,b)});
    return ()=>{controller.current?.dispose();controller.current=null;container.current?.replaceChildren();};
  },[factory]);
  useLayoutEffect(()=>{controller.current?.sync(duration>0?range[0]:0,duration>0?range[1]:1,duration||1,disabled);},[factory,range[0],range[1],duration,disabled,mediaKey]);
  return <div ref={container} className="gif-timeline"/>;
}
export interface GifEditorProps extends GifEditorState {
  actions:GifActions;
  timeline:TimelineFactory;
  video:()=>TimelineMedia|null;
  /** Product uses a light-DOM slot to keep editable targets visible to player shortcut handlers. */
  timePortal?:HTMLElement;
}
export function GifEditor(props:GifEditorProps) {
  const {start,end,duration,mediaKey,range,bounds,timeError,invalid,busy,status,tone,clipboardStatus,clipboardTone,folderLabel,nativeAvailable,previewURL,progress,report,actions,timeline,video,timePortal}=props;
  const uid=useId();
  const blocked=busy!=='idle';
  const times=<div className="gif-time-content" data-sm-gif-times={uid}>
    <style>{timePortalCSS(`[data-sm-gif-times="${uid}"]`)}</style>
    <Timeline factory={timeline} video={video} range={range} duration={duration} mediaKey={mediaKey} disabled={blocked||duration<=0} onChange={actions.range}/>
    <div className="gif-time-fields">
      <TimeField id={`${uid}-start`} label="시작" value={start} disabled={blocked||duration<=0} invalid={invalid.start} describedBy={`${uid}-bounds ${uid}-error`} onChange={(value,commit)=>actions.changeTime('start',value,commit)}/>
      <TimeField id={`${uid}-end`} label="종료" value={end} disabled={blocked||duration<=0} invalid={invalid.end} describedBy={`${uid}-bounds ${uid}-error`} onChange={(value,commit)=>actions.changeTime('end',value,commit)}/>
    </div>
    <p id={`${uid}-bounds`} className="gif-time-bounds">{bounds}</p>
    <p id={`${uid}-error`} className="gif-time-error" role="status">{timeError}</p>
  </div>;
  return <>
    {timePortal && createPortal(times,timePortal)}
    <style>{timeCSS}</style>
    <div className="gif-editor">
      <header className="gif-header"><div><h2>GIF 만들기</h2><p className="gif-note">1–15초 · 480 px · 10fps · 소리 없는 반복 GIF</p></div><Button id="gif-close" aria-label="GIF 편집창 닫기" onClick={actions.close}>닫기 ✕</Button></header>
      <div className="gif-layout">
        <section className="gif-card" aria-label="구간 선택"><h3>구간 선택</h3>{timePortal ? <slot name="gif-times"/> : times}
          <div className="gif-actions"><Button variant="primary" disabled={blocked||duration<=0||Boolean(timeError)} onClick={actions.generate}>GIF 생성</Button><Button disabled={busy!=='generating'} onClick={actions.cancel}>취소</Button></div>
        </section>
        <section className="gif-card" aria-label="미리보기 및 저장"><h3>미리보기 및 저장</h3>
          <div className="gif-preview">{previewURL ? <img src={previewURL} alt="생성한 GIF 미리보기"/> : <div className="gif-placeholder"><strong>GIF</strong><p>{busy==='generating' ? '선택한 구간을 GIF로 만들고 있습니다.' : '생성한 GIF가 여기에 표시됩니다.'}</p></div>}</div>
          <div className="gif-messages" role="status" aria-live="polite"><StatusMessage tone={tone}>{status}</StatusMessage><StatusMessage tone={clipboardTone}>{clipboardStatus}</StatusMessage></div>
          {busy==='generating' && <Progress label="GIF 생성 진행률" value={progress?.value} max={progress?.max||100}/>}
          <div className="gif-actions"><Button variant="primary" disabled={!previewURL||blocked} onClick={()=>actions.save(nativeAvailable?'remembered-folder':'browser')}>GIF 파일 저장</Button><Button disabled={!previewURL||blocked||!nativeAvailable} onClick={actions.copy}>클립보드 복사</Button>{nativeAvailable && <Button disabled={!previewURL||blocked} onClick={()=>actions.save('browser')}>이번만 다른 위치에 저장</Button>}</div>
          <div className="gif-folder"><p>{folderLabel}</p><Button disabled={blocked||!nativeAvailable} onClick={actions.chooseFolder}>저장 폴더 변경</Button></div>
        </section>
      </div>
      <div className="gif-diagnostics"><Disclosure summary="진단 정보"><pre>{report||'아직 생성 기록이 없습니다.'}</pre></Disclosure></div>
    </div>
  </>;
}
export interface GifLauncherProps {opened:boolean;disabled:boolean;hint:string;tone?:Tone;onOpen:()=>void}
export function GifLauncher({opened,disabled,hint,tone='neutral',onOpen}:GifLauncherProps) {
  return <div className="gif-launcher"><Button aria-haspopup="dialog" aria-expanded={opened} disabled={disabled} onClick={onOpen}>GIF 만들기</Button><p role="status"><StatusMessage tone={tone}>{hint}</StatusMessage></p></div>;
}
