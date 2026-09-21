import '../extension/ui/tokens.js';
import '../extension/ui/primitives.js';

export const playbackCSS = `${globalThis.SubmetaUI.tokenCSS}${globalThis.SubmetaUI.controlCSS}
      :host{display:block;clear:both;width:100%;margin:0;font:inherit;color-scheme:dark}
      :host([data-theme="light"]){color-scheme:light}
      .panel{padding:var(--sm-space-4) var(--preset-gutter,var(--sm-space-4));background:var(--sm-surface-canvas);color:var(--sm-text-primary);border-bottom:var(--sm-size-border) solid var(--sm-border-default);font-family:var(--sm-font-family);font-size:var(--sm-font-body);line-height:var(--sm-line-body)}
      .heading{display:flex;align-items:center;justify-content:space-between;gap:var(--sm-space-3);margin-bottom:var(--sm-space-3)}
      .heading h2{font:inherit;font-weight:var(--sm-weight-medium);margin:0}
      .eyebrow{font-size:var(--sm-font-caption);color:var(--sm-text-muted)}
      .fields{display:flex;flex-wrap:wrap;align-items:center;gap:var(--sm-space-3) var(--sm-space-6)}
      .toggle{margin-right:auto;cursor:pointer;min-height:var(--sm-size-control)}
      #language{max-width:var(--sm-size-label-max)}
      details{margin-top:var(--sm-space-3);font-size:var(--sm-font-caption);color:var(--sm-text-muted)}
      summary{cursor:pointer;width:fit-content;min-height:var(--sm-space-6)}
      summary:hover{color:var(--sm-text-primary)}
      .status{display:grid;gap:var(--sm-space-1);margin:var(--sm-space-3) 0}
      .actions{display:flex;flex-wrap:wrap;gap:var(--sm-space-2)}
      .hint{margin:var(--sm-space-3) 0 0;max-width:70ch}
      @media(max-width:${globalThis.SubmetaUI.tokens['size.mobile']}){
        .fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--sm-space-3)}
        .toggle{grid-column:1/-1}.sm-field:not(.toggle){align-items:stretch;flex-direction:column;gap:var(--sm-space-1)}
        .language-field{grid-column:1/-1}#language{max-width:100%;width:100%}.eyebrow{display:none}
      }
    `;
