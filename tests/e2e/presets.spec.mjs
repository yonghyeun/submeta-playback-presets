import {test,expect} from './harness.mjs';
async function ready(h){await expect.poll(()=>h.frame()?.locator('video').evaluate(v=>v.readyState)).toBeGreaterThan(0);await expect.poll(()=>h.page.locator('#speedStatus').textContent()).not.toContain('플레이어 확인 중');}
async function setRate(h,rate){await h.page.locator('#rate').selectOption(String(rate));await expect.poll(()=>h.rate()).toBe(rate);}
async function captions(h,label,mode){await expect.poll(()=>h.frame().locator('[role=combobox]').textContent()).toBe('Captions:'+label);await expect.poll(()=>h.frame().locator('video').evaluate(v=>v.textTracks[0].mode)).toBe(mode);}

test('panel layout, neutral checkbox and collapsed details',async({harness:h},info)=>{
  await ready(h);await h.page.locator('#enabled').check();
  const input=h.page.locator('#enabled');
  await expect(input).toHaveCSS('appearance','none');
  expect(await input.evaluate(e=>getComputedStyle(e,'::before').borderLeftColor)).toBe('rgb(25, 25, 28)');
  await expect(h.page.locator('details')).not.toHaveAttribute('open','');
  const stage=await h.page.locator('.VideoContent__stage').boundingBox(),panel=await h.page.locator('#submeta-presets').boundingBox();
  expect(panel.y).toBeGreaterThanOrEqual(stage.y+stage.height);expect(panel.height).toBeLessThan(140);
  await h.page.screenshot({path:info.outputPath('desktop.png')});
  await h.page.setViewportSize({width:390,height:844});
  expect(await h.page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await h.page.screenshot({path:info.outputPath('mobile.png')});
});

test('live speed edit with retention OFF, no reload and no later enforcement',async({harness:h})=>{
  await ready(h);await expect(h.page.locator('#enabled')).not.toBeChecked();
  await h.page.evaluate(()=>window.testDocumentMarker='same document');
  await setRate(h,1.5);
  expect(await h.page.evaluate(()=>window.testDocumentMarker)).toBe('same document');
  await expect.poll(async()=> (await h.saved()).rate).toBe(1.5);
  await h.frame().locator('video').evaluate(v=>{v.playbackRate=1;});
  await expect.poll(()=>h.page.locator('#speedStatus').textContent()).toContain('자동 적용 꺼짐');
  expect(await h.rate()).toBe(1);
});

test('live CC on, language switch and off with retention OFF',async({harness:h})=>{
  await ready(h);await h.page.locator('#captions').selectOption('on');await captions(h,'한국어','showing');
  await h.page.locator('#language').selectOption('en');await captions(h,'English','showing');
  await h.page.locator('#captions').selectOption('off');await captions(h,'Off','disabled');
});

test('rapid edits keep latest UI, saved value and media consistent',async({harness:h})=>{
  await ready(h);for(const r of ['2','0.75','1.75','1.25'])await h.page.locator('#rate').selectOption(r);
  await expect.poll(()=>h.rate()).toBe(1.25);await expect.poll(async()=> (await h.saved()).rate).toBe(1.25);
  await expect(h.page.locator('#rate')).toHaveValue('1.25');
});

test('persistent storage survives browser restart and applies on reload',async({harness:h})=>{
  await ready(h);await h.page.locator('#enabled').check();await setRate(h,1.75);
  await h.page.locator('#captions').selectOption('on');await captions(h,'한국어','showing');
  await expect(h.page.locator('#saved')).toContainText('저장됨');
  await h.restart();await ready(h);await expect(h.page.locator('#enabled')).toBeChecked();
  await expect.poll(()=>h.rate()).toBe(1.75);await captions(h,'한국어','showing');
});

test('next lesson, replaced iframe and 30 transitions retain settings without duplicate panels',async({harness:h})=>{
  await ready(h);await h.page.locator('#enabled').check();await setRate(h,1.5);
  test.setTimeout(90000);
  for(let i=0;i<30;i++){
    const previous=h.frame();
    await h.page.locator(i===15?'#replace':'#next').click();
    if(i===15)await expect.poll(()=>previous.isDetached()).toBe(true);
    await expect.poll(()=>h.frame()?.url()).toBe(await h.page.locator('iframe').getAttribute('src'));
    await ready(h);
    await expect.poll(()=>h.rate().catch(()=>0)).toBe(1.5);await expect(h.page.locator('#submeta-presets')).toHaveCount(1);
  }
});

test('suspend current lesson and resume automatically for next lesson',async({harness:h})=>{
  await ready(h);await h.page.locator('#enabled').check();await setRate(h,1.5);
  await h.page.locator('summary').click();await h.page.locator('#suspend').click();
  await expect(h.page.locator('#speedStatus')).toContainText('현재 영상 해제');
  await h.frame().locator('video').evaluate(v=>v.playbackRate=1);
  await expect(h.page.locator('#speedStatus')).toContainText('1배 · 현재 영상 해제');
  await h.page.locator('#next').click();await expect.poll(()=>h.rate().catch(()=>0)).toBe(1.5);
});

test('unavailable language does not silently select another language',async({harness:h})=>{
  await ready(h);await h.page.locator('#enabled').check();
  await h.page.locator('iframe').evaluate(f=>f.src='https://iframe.cloudflarestream.com/english-only');
  await expect(h.page.locator('#language')).toContainText('이 영상 미제공');
  await h.page.locator('#captions').selectOption('on');await captions(h,'Off','disabled');
  await expect(h.page.locator('#captionStatus')).toContainText('선택 언어 미제공');
});

test('settings synchronize to another tab; removal cleans up panel',async({harness:h})=>{
  await ready(h);const second=await h.context.newPage();await second.goto(h.page.url());
  await expect(second.locator('#rate')).toBeVisible();await setRate(h,2);
  await expect(second.locator('#rate')).toHaveValue('2');
  await h.page.locator('#remove').click();await expect(h.page.locator('#submeta-presets')).toHaveCount(0);
});


test.describe('Firefox-style delayed storage delivery',()=>{
  test.use({storageEventDelay:150});
  test('own delayed save event does not cancel a live caption edit',async({harness:h})=>{
    await ready(h);
    await h.page.locator('#captions').selectOption('on');await captions(h,'한국어','showing');
    await h.page.locator('#captions').selectOption('off');await captions(h,'Off','disabled');
    await h.page.locator('#captions').selectOption('on');await captions(h,'한국어','showing');
  });
});

test('video without CC menu reports unsupported while speed still applies',async({harness:h})=>{
  await ready(h);await h.page.locator('#enabled').check();await setRate(h,1.5);
  await h.page.locator('iframe').evaluate(f=>f.src='https://iframe.cloudflarestream.com/no-captions');
  await expect.poll(()=>h.rate().catch(()=>0)).toBe(1.5);
  await expect(h.page.locator('#captionStatus')).toContainText('자막 메뉴 없음 · 제어 미지원',{timeout:20000});
});
