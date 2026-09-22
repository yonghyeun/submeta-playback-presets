import {test,expect} from './harness.mjs';
async function open(h) {
  const launcher=h.page.locator('#submeta-gif-launcher');await expect(launcher).toBeVisible();
  await launcher.evaluate(element=>{element.tabIndex=-1;element.focus();});await h.page.keyboard.press('Tab');await h.page.keyboard.press('Enter');
  await expect(h.frame().locator('#submeta-gif-export-preview')).toHaveAttribute('role','dialog');
  await expect(h.frame().getByLabel('시작',{exact:true})).toBeVisible();
}
test('GIF product portal inputs edit without player shortcuts and Escape restores launcher focus',async({harness:h})=>{
  await open(h);const frame=h.frame(),start=frame.getByLabel('시작',{exact:true}),end=frame.getByLabel('종료',{exact:true});
  const before=await frame.locator('video').evaluate(video=>({paused:video.paused,rate:video.playbackRate}));
  expect(await start.evaluate(element=>element.getRootNode()===document)).toBe(true);
  await start.fill('0:10');await end.fill('0:15');await start.focus();await h.page.keyboard.press('ArrowLeft');
  await expect(start).toHaveValue('0:10');await expect(end).toHaveValue('0:15');
  expect(await frame.locator('video').evaluate(video=>({paused:video.paused,rate:video.playbackRate}))).toEqual(before);
  await h.page.keyboard.press('Escape');await expect(frame.locator('#submeta-gif-export-preview')).not.toHaveAttribute('role','dialog');
  await expect(h.page.locator('#submeta-gif-launcher')).not.toHaveAttribute('inert','');
  // Enter immediately reopens the focused launcher inside its closed root.
  await h.page.keyboard.press('Enter');await expect(frame.locator('#submeta-gif-export-preview')).toHaveAttribute('role','dialog');
  await expect(start).toHaveValue('0:10');await expect(end).toHaveValue('0:15');
  await start.focus();await h.page.keyboard.press('Escape');
  await h.page.locator('#captions').selectOption('on');await expect(h.page.locator('#captionStatus')).toContainText('자막');
});
test('GIF modal fits mobile viewport and input errors remain editable',async({harness:h})=>{
  await h.page.setViewportSize({width:390,height:844});await open(h);
  const frame=h.frame(),start=frame.getByLabel('시작',{exact:true});
  await start.fill('0:99');await expect(start).toHaveAttribute('aria-invalid','true');
  await start.fill('0:00');await start.blur();await expect(start).toHaveAttribute('aria-invalid','false');
  expect(await frame.evaluate(()=>document.getElementById('submeta-gif-export-preview').scrollWidth)).toBeLessThanOrEqual(await frame.evaluate(()=>innerWidth));
  await start.focus();await h.page.keyboard.press('Escape');
});
