export function trapGifFocus(event:KeyboardEvent,root:ShadowRoot) {
  if(event.key!=='Tab')return;
  const selector='button,input,summary,[tabindex],slot';
  const elements=[...root.querySelectorAll<HTMLElement>(selector)].flatMap(element=>element instanceof HTMLSlotElement ? element.assignedElements().flatMap(assigned=>[...assigned.querySelectorAll<HTMLElement>(selector)]) : [element]).filter(element=>!(element as HTMLButtonElement).disabled&&element.tabIndex>=0&&element.getClientRects().length);
  const active=root.activeElement||root.host.ownerDocument.activeElement;
  if(event.shiftKey&&active===elements[0]){event.preventDefault();elements.at(-1)?.focus();}
  else if(!event.shiftKey&&active===elements.at(-1)){event.preventDefault();elements[0]?.focus();}
}
