import {useLayoutEffect, useState, type ReactNode} from 'react';
import type {Option, PlaybackActions, PlaybackState, PreferenceId, Tone} from './types';

export interface ButtonProps {
  'aria-label'?: string;
  'aria-haspopup'?: 'dialog';
  'aria-expanded'?: boolean;
  /** Visible, descriptive action label. */
  children: string;
  variant?: 'secondary' | 'primary';
  disabled?: boolean;
  id?: string;
  onClick?: () => void;
}
export function Button({children, variant = 'secondary', disabled = false, id, onClick, ...aria}: ButtonProps) {
  return <button {...aria} className="sm-button" data-variant={variant} type="button" id={id} disabled={disabled} onClick={onClick}>{children}</button>;
}
export interface CheckboxProps {
  label: string;
  checked: boolean;
  disabled?: boolean;
  id?: string;
  title?: string;
  className?: string;
  onChange: (checked: boolean) => void;
}
export function Checkbox({label, checked, disabled = false, id, title, className = '', onChange}: CheckboxProps) {
  return <label className={`sm-field ${className}`.trim()} title={title}><input className="sm-checkbox" id={id} type="checkbox" checked={checked} disabled={disabled} onChange={event => onChange(event.currentTarget.checked)}/>{label}</label>;
}
export interface SelectFieldProps {
  label: string;
  value: string;
  options: Option[];
  disabled?: boolean;
  id?: string;
  className?: string;
  onChange: (value: string) => void;
}
export function SelectField({label, value, options, disabled = false, id, className = '', onChange}: SelectFieldProps) {
  return <label className={`sm-field ${className}`.trim()}>{label}<select className="sm-select" id={id} value={value} disabled={disabled} onChange={event => onChange(event.currentTarget.value)}>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}
export interface StatusMessageProps {children: string; tone?: Tone; id?: string}
/** Place related messages inside one polite live region to avoid repeated announcements. */
export function StatusMessage({children, tone = 'neutral', id}: StatusMessageProps) {
  return <span className="sm-status" data-tone={tone} id={id}>{children}</span>;
}
export interface ProgressProps {label:string;value?:number;max?:number}
/** Omit value while the total is unknown; native progress exposes this to assistive technology. */
export function Progress({label,value,max=100}:ProgressProps) {
  return <progress className="sm-progress" aria-label={label} value={value} max={max}/>;
}
export interface DisclosureProps {
  summary: string;
  children: ReactNode;
  expanded?: boolean;
  /** A changed, nonempty error message reveals recovery actions once. */
  revealKey?: string;
}
export function Disclosure({summary, children, expanded = false, revealKey = ''}: DisclosureProps) {
  const [open, setOpen] = useState(expanded || Boolean(revealKey));
  useLayoutEffect(() => setOpen(expanded), [expanded]);
  useLayoutEffect(() => {if (revealKey) setOpen(true);}, [revealKey]);
  return <details open={open} onToggle={event => setOpen(event.currentTarget.open)}><summary>{summary}</summary>{children}</details>;
}
const rates: Option[] = [{value:'leave',label:'기본값'}, ...[0.5,0.75,1,1.25,1.5,1.75,2].map(rate => ({value:String(rate),label:`${rate}×`}))];
const captions: Option[] = [{value:'leave',label:'기본값'},{value:'on',label:'켜기'},{value:'off',label:'끄기'}];
export interface PlaybackSettingsProps extends PlaybackState {actions?: PlaybackActions}
/** Product and Storybook share this component; persistence belongs to the caller. */
export function PlaybackSettings({prefs, languages, loading, connected, suspended, expanded, saved, speedStatus, captionStatus, tones, actions = {}}: PlaybackSettingsProps) {
  const change = (id: PreferenceId, value: string | boolean) => {
    const values = {...prefs, rate:prefs.manageSpeed ? String(prefs.rate) : 'leave', [id]:value};
    values.manageSpeed = values.rate !== 'leave';
    actions.change?.(id, values);
  };
  const errors = ([['saved',saved],['speedStatus',speedStatus],['captionStatus',captionStatus]] as const).filter(([id]) => tones[id] === 'error').map(([,text]) => text).join('|');
  return <section className="panel" role="region" aria-label="재생 기본 설정" aria-busy={loading}>
    <div className="heading"><h2>재생 설정</h2><span className="eyebrow">영상마다, 내 방식대로</span></div>
    <div className="fields">
      <Checkbox id="enabled" label="재생 설정 유지" className="toggle" title="저장한 설정을 다음 영상에도 자동으로 적용합니다" checked={prefs.enabled} disabled={loading} onChange={value => change('enabled',value)}/>
      <SelectField id="rate" label="배속" value={prefs.manageSpeed ? String(prefs.rate) : 'leave'} options={rates} disabled={loading} onChange={value => change('rate',value)}/>
      <SelectField id="captions" label="CC" value={prefs.captions} options={captions} disabled={loading} onChange={value => change('captions',value)}/>
      <SelectField id="language" label="언어" className="language-field" value={prefs.language} options={languages} disabled={loading || prefs.captions !== 'on'} onChange={value => change('language',value)}/>
    </div>
    <Disclosure summary="저장 및 적용 상태" expanded={expanded} revealKey={errors}>
      <div className="status" role="status" aria-live="polite"><StatusMessage id="saved" tone={tones.saved}>{saved}</StatusMessage><StatusMessage id="speedStatus" tone={tones.speedStatus}>{speedStatus}</StatusMessage><StatusMessage id="captionStatus" tone={tones.captionStatus}>{captionStatus}</StatusMessage></div>
      <div className="actions"><Button id="suspend" disabled={!prefs.enabled || !connected || loading} onClick={actions.suspend}>{suspended ? '현재 영상 자동 적용 재개' : '현재 영상만 해제'}</Button><Button id="retry" disabled={loading} onClick={actions.retry}>다시 적용</Button></div>
      <p className="hint">변경한 설정은 현재 영상에 바로 적용되고 이 브라우저에 저장됩니다. 설정 유지 중에는 플레이어에서 바꾼 값도 저장한 설정으로 돌아갑니다.</p>
    </Disclosure>
  </section>;
}
