(() => {
  'use strict';
  const UI = globalThis.SubmetaUI;
  // Shared styles work inside a shadow root or a scoped light-DOM container.
  UI.controlCSS = `
    *,*::before,*::after{box-sizing:border-box}
    .sm-field{display:flex;align-items:center;gap:var(--sm-space-2);min-width:0;color:var(--sm-text-primary)}
    .sm-select,.sm-button{font:inherit;min-height:var(--sm-size-control);border:var(--sm-size-border) solid var(--sm-border-default);border-radius:var(--sm-radius-md);color:var(--sm-text-primary);background:var(--sm-surface-field);cursor:pointer}
    .sm-select{max-width:100%;padding:var(--sm-space-1) var(--sm-space-2)}
    .sm-select option{background:var(--sm-surface-field);color:var(--sm-text-primary)}
    .sm-button{padding:var(--sm-space-1) var(--sm-space-3);font-weight:var(--sm-weight-medium)}
    .sm-button:hover:not(:disabled),.sm-select:hover:not(:disabled){background:var(--sm-surface-hover);border-color:var(--sm-border-strong)}
    .sm-button[data-variant="primary"]{background:var(--sm-action-primary);color:var(--sm-action-on-primary)}
    .sm-button[data-variant="primary"]:hover:not(:disabled){background:var(--sm-text-primary);color:var(--sm-surface-canvas)}
    .sm-checkbox{appearance:none;-webkit-appearance:none;display:grid;place-content:center;flex:none;width:var(--sm-size-checkbox);height:var(--sm-size-checkbox);margin:0;border:var(--sm-size-border) solid var(--sm-border-strong);border-radius:var(--sm-radius-sm);background:var(--sm-surface-field);cursor:pointer}
    .sm-checkbox:checked{background:var(--sm-action-primary);border-color:var(--sm-action-primary)}
    .sm-checkbox::before{content:"";width:var(--sm-size-check-width);height:var(--sm-size-check-height);border-left:var(--sm-size-focus) solid var(--sm-action-on-primary);border-bottom:var(--sm-size-focus) solid var(--sm-action-on-primary);transform:rotate(-45deg);visibility:hidden}
    .sm-checkbox:checked::before{visibility:visible}
    .sm-status{color:var(--sm-text-muted);overflow-wrap:anywhere}
    .sm-status[data-tone="error"]{color:var(--sm-status-error)}
    .sm-status[data-tone="success"]{color:var(--sm-status-success)}
    :disabled{opacity:var(--sm-opacity-disabled);cursor:default}
    :focus-visible{outline:var(--sm-size-focus) solid var(--sm-focus-ring);outline-offset:var(--sm-size-focus-offset)}
    @media(forced-colors:active){.sm-checkbox{appearance:auto}.sm-checkbox::before{display:none}}
  `;
})();
