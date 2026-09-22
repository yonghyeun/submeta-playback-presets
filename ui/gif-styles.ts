import './styles';
const UI = globalThis.SubmetaUI;
export const gifCSS = `${UI.tokenCSS}${UI.controlCSS}
:host{display:block;font:var(--sm-font-body)/var(--sm-line-body) 'Noto Sans KR',system-ui,sans-serif;color:var(--sm-text-primary);color-scheme:dark;background:var(--sm-surface-canvas)}
:host([data-theme="light"]){color-scheme:light}
.gif-editor{padding:var(--sm-space-6);color:var(--sm-text-primary);background:var(--sm-surface-canvas);min-height:100%;font-size:var(--sm-font-body);line-height:var(--sm-line-body)}
.gif-header{display:flex;align-items:center;justify-content:space-between;gap:var(--sm-space-4);margin-bottom:var(--sm-space-6)}
.gif-header h2{margin:0;font-size:var(--sm-font-heading);font-weight:var(--sm-weight-medium)}
.gif-note{margin:var(--sm-space-1) 0 0;color:var(--sm-text-muted);font-size:var(--sm-font-caption)}
.gif-layout{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:var(--sm-space-4);align-items:start}
.gif-card{background:var(--sm-surface-panel);border:var(--sm-size-border) solid var(--sm-border-default);border-radius:var(--sm-radius-lg);padding:var(--sm-space-5);min-width:0}
.gif-card h3{font-size:var(--sm-font-title);font-weight:var(--sm-weight-medium);margin:0 0 var(--sm-space-4)}
.gif-actions{display:flex;flex-wrap:wrap;gap:var(--sm-space-2);margin-top:var(--sm-space-4)}
.gif-preview{display:grid;place-content:center;min-height:var(--sm-size-thumbnail-height);aspect-ratio:16/9;border:var(--sm-size-border) solid var(--sm-border-default);border-radius:var(--sm-radius-md);background:var(--sm-surface-canvas);color:var(--sm-text-muted);text-align:center;overflow:hidden;margin-bottom:var(--sm-space-4)}
.gif-preview img{width:100%;height:100%;object-fit:contain;min-height:0}
.gif-placeholder strong{display:block;font-size:var(--sm-font-heading);font-weight:var(--sm-weight-medium);letter-spacing:.12em;margin-bottom:var(--sm-space-2)}
.gif-placeholder p{font-size:var(--sm-font-caption);margin:0}
.gif-messages{display:grid;gap:var(--sm-space-2)}
.gif-folder{margin-top:var(--sm-space-5);padding-top:var(--sm-space-4);border-top:var(--sm-size-border) solid var(--sm-border-default)}
.gif-folder p{font-size:var(--sm-font-caption);color:var(--sm-text-muted);overflow-wrap:anywhere;margin:0 0 var(--sm-space-3)}
.gif-progress{width:100%;height:var(--sm-space-2);accent-color:var(--sm-action-primary)}
.gif-diagnostics{margin-top:var(--sm-space-5);color:var(--sm-text-muted);font-size:var(--sm-font-caption)}
.gif-diagnostics summary{cursor:pointer;width:fit-content;min-height:var(--sm-space-6)}
.gif-diagnostics pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:var(--sm-size-label-max);overflow:auto}
@media(max-width:${UI.tokens['size.gifBreakpoint']}){.gif-layout{grid-template-columns:1fr}.gif-editor{padding:var(--sm-space-4)}.gif-card{padding:var(--sm-space-4)}.gif-header{align-items:start}.gif-header h2{font-size:var(--sm-font-title)}}
`;
export const timeCSS = `
.gif-time-content{font:inherit;color:var(--sm-text-primary);min-width:0}
.gif-time-fields{display:flex;flex-wrap:wrap;gap:var(--sm-space-4);margin-top:var(--sm-space-4)}
.gif-time-content .sm-field{flex-direction:column;align-items:start;gap:var(--sm-space-1)}
.gif-time-content .sm-input{font:inherit;width:var(--sm-size-time-field);max-width:100%;min-height:var(--sm-size-control);padding:var(--sm-space-1) var(--sm-space-2);border:var(--sm-size-border) solid var(--sm-border-default);border-radius:var(--sm-radius-md);color:var(--sm-text-primary);background:var(--sm-surface-field);margin:0}
.gif-time-content .sm-input[aria-invalid="true"]{border-color:var(--sm-status-error)}
.gif-time-content .gif-time-error{color:var(--sm-status-error);font-size:var(--sm-font-caption);margin:var(--sm-space-2) 0 0;overflow-wrap:anywhere}
.gif-time-content .gif-time-bounds{font-size:var(--sm-font-caption);color:var(--sm-text-muted);margin:var(--sm-space-3) 0 0}
`;
/** Scope portal styles so the embedded player's own controls are untouched. */
export function timePortalCSS(scope: string) {
  return (UI.controlCSS + timeCSS).replace(/([^{}]+)\{/g,(match,selectors: string) => selectors.trim().startsWith('@') ? match : selectors.split(',').map(selector => selector.trim().startsWith('.gif-time-content') ? scope + selector.trim().slice('.gif-time-content'.length) : `${scope} ${selector.trim()}`).join(',') + '{');
}
export const gifHostCSS = 'display:none;position:fixed;inset:0;z-index:2147483647;overflow:auto;box-sizing:border-box';
export const gifLauncherCSS = `${UI.tokenCSS}${UI.controlCSS}:host{display:block;clear:both;background:var(--sm-surface-canvas);color:var(--sm-text-primary);font:var(--sm-font-body)/var(--sm-line-body) system-ui,sans-serif}.gif-launcher{padding:var(--sm-space-3) var(--sm-space-4);display:flex;align-items:center;flex-wrap:wrap;gap:var(--sm-space-3)}.gif-launcher p{font-size:var(--sm-font-caption);color:var(--sm-text-muted);margin:0}`;
export const gifBackdropCSS = `position:fixed;inset:0;background:${UI.tokens['surface.scrim']};opacity:${UI.tokens['opacity.scrim']};z-index:2147483000`;
export const gifFrameStyles = {position:'fixed',top:'50%',left:'50%',right:'auto',bottom:'auto',transform:'translate(-50%, -50%)',width:`min(${UI.tokens['size.gifDialogWidth']}, calc(100vw - ${UI.tokens['space.8']}))`,height:`min(${UI.tokens['size.gifDialogHeight']}, calc(100dvh - ${UI.tokens['space.8']}))`,'max-width':'none','max-height':'none','z-index':'2147483001',border:'0','border-radius':UI.tokens['radius.lg']};
