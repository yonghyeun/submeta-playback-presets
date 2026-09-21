export type Theme = 'dark' | 'light';
export type Tone = 'neutral' | 'success' | 'error';
export type PreferenceId = 'enabled' | 'rate' | 'captions' | 'language';
export type StatusId = 'saved' | 'speedStatus' | 'captionStatus';
export interface Option {value: string; label: string}
export interface Preferences {
  enabled: boolean;
  manageSpeed: boolean;
  rate: number;
  captions: 'leave' | 'on' | 'off';
  language: string;
}
/** Values cross the UI boundary; the controller never reads React-owned DOM. */
export interface PreferenceChange extends Omit<Preferences, 'rate'> {rate: string}
export interface PlaybackState {
  prefs: Preferences;
  languages: Option[];
  loading: boolean;
  connected: boolean;
  suspended: boolean;
  expanded?: boolean;
  saved: string;
  speedStatus: string;
  captionStatus: string;
  tones: Partial<Record<StatusId, Tone>>;
}
export interface PlaybackActions {
  change?: (id: PreferenceId, values: PreferenceChange) => void;
  suspend?: () => void;
  retry?: () => void;
}
export const initialState: PlaybackState = {
  prefs: {enabled: false, manageSpeed: false, rate: 1, captions: 'leave', language: 'ko'},
  languages: [{value: 'ko', label: '한국어'}],
  loading: false, connected: false, suspended: false,
  saved: '저장값 불러오는 중', speedStatus: '배속: 대기', captionStatus: '자막: 대기', tones: {},
};
