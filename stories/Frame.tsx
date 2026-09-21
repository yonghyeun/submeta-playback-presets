import {useLayoutEffect, useRef, useState, type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {playbackCSS} from '../ui/styles';
import type {Theme} from '../ui/types';
const roots = new WeakMap<HTMLElement, ShadowRoot>();
/** Portals keep stories and controls in the same React tree, including closed roots. */
export function Frame({children, theme = 'dark', mode = 'open', className = 'demo-host', css = ''}: {children: ReactNode; theme?: Theme; mode?: ShadowRootMode; className?: string; css?: string}) {
  const ref = useRef<HTMLElement>(null);
  const [root, setRoot] = useState<ShadowRoot>();
  useLayoutEffect(() => {
    const host = ref.current!;
    const shadow = roots.get(host) || host.attachShadow({mode});
    roots.set(host, shadow); setRoot(shadow);
  }, [mode]);
  return <section ref={ref} className={className} data-theme={theme}>{root && createPortal(<><style>{playbackCSS + css}</style>{children}</>, root)}</section>;
}
export const specimenCSS = `:host{display:block;background:var(--sm-surface-canvas);color:var(--sm-text-primary);padding:var(--sm-space-8);font:var(--sm-font-body)/var(--sm-line-body) 'Noto Sans KR',sans-serif}.row{display:flex;flex-wrap:wrap;gap:var(--sm-space-4);margin:var(--sm-space-6) 0}h1{font-size:var(--sm-font-heading)}h2{font-size:var(--sm-font-title)}`;
