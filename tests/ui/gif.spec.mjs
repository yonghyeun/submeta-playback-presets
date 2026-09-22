import {test,expect} from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {existsSync} from 'node:fs';
const busy=new Set(['loading','generating','saving']);
async function open(page,state='ready') {
  await page.goto(`/iframe.html?id=gif--${state}&viewMode=story`);
  await expect(page.getByRole('dialog',{name:'GIF 만들기'})).toBeVisible();
  await expect(page.getByLabel('시작',{exact:true})).toBeVisible();
  await page.evaluate(async()=>{await document.fonts.load('400 14px "Noto Sans KR"','구간 선택');await document.fonts.load('600 14px "Noto Sans KR"','구간 선택');await document.fonts.ready;});
  if(!busy.has(state))await expect(page.getByRole('img',{name:'탐색 위치 썸네일'})).toBeVisible();
}
for(const width of [390,1100])for(const state of ['ready','generating','complete','save-error'])test(`GIF visual ${state} at ${width}`,async({page},info)=>{
  await page.setViewportSize({width,height:950});await open(page,state);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  const name=`gif-${state}-${width}.png`;
  if(!existsSync(info.snapshotPath(name))){
    // Keep missing references failing, but preserve the full element for human review.
    const candidate=info.outputPath(name.replace('.png','-candidate.png'));
    await page.locator('.gif-demo-page').screenshot({path:candidate,animations:'disabled',caret:'hide',scale:'css'});
    await info.attach('new-reference-candidate',{path:candidate,contentType:'image/png'});
  }
  await expect(page.locator('.gif-demo-page')).toHaveScreenshot(name);
});
for(const state of ['ready','loading','invalid','generating','cancelled','error','complete','saving','saved','save-error','copy-error','native-unavailable','folder-unselected','light'])test(`GIF accessible ${state}`,async({page})=>{
  await open(page,state);
  const result=await new AxeBuilder({page}).include('.gif-demo-host').withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  expect(result.violations,JSON.stringify(result.violations,null,2)).toEqual([]);
});
test('GIF slotted time inputs validate without leaking styles to player controls',async({page})=>{
  await open(page);
  const start=page.getByLabel('시작',{exact:true});
  expect(await start.evaluate(input=>input.getRootNode()===document)).toBe(true);
  await expect(start).toHaveCSS('min-height','36px');
  await expect(start).toHaveCSS('border-radius','8px');
  await start.fill('0:99');await expect(start).toHaveAttribute('aria-invalid','true');
  await expect(page.getByRole('button',{name:'GIF 생성',exact:true})).toBeDisabled();
  await start.fill('0:30');await start.blur();await expect(start).toHaveAttribute('aria-invalid','false');
  await expect(page.getByRole('button',{name:'GIF 생성',exact:true})).toBeEnabled();
  const width=await page.evaluate(()=>{const input=document.createElement('input');input.className='sm-input';input.style.width='17px';document.body.append(input);return getComputedStyle(input).width;});
  expect(width).toBe('17px');
});
test('GIF trim keeps opposite endpoint and dragging preserves selected duration',async({page})=>{
  await open(page);
  const start=page.getByLabel('시작',{exact:true}),end=page.getByLabel('종료',{exact:true});
  await page.getByRole('slider',{name:'시작 손잡이'}).focus();await page.keyboard.press('ArrowRight');
  await expect(start).toHaveValue('0:30.1');await expect(end).toHaveValue('0:35');
  await page.keyboard.press('Home');await expect(start).toHaveValue('0:20');await expect(end).toHaveValue('0:35');
  await start.fill('0:30');await start.blur();
  const selected=page.getByRole('slider',{name:'선택 구간 이동'}),rect=await selected.boundingBox();
  await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);await page.mouse.down();await page.mouse.move(rect.x+rect.width/2+24,rect.y+rect.height/2,{steps:5});await page.mouse.up();
  const values=await Promise.all([start.inputValue(),end.inputValue()]);
  const seconds=value=>value.split(':').reduce((total,part)=>total*60+Number(part),0);
  expect(seconds(values[1])-seconds(values[0])).toBeCloseTo(5,1);
  expect(seconds(values[0])).toBeGreaterThan(30);
});
test('GIF cancel retains selection and failed saves preserve retryable preview',async({page})=>{
  await open(page);await page.getByRole('button',{name:'GIF 생성',exact:true}).click();
  await expect(page.getByLabel('시작',{exact:true})).toBeDisabled();
  await page.getByRole('button',{name:'취소',exact:true}).click();
  await expect(page.getByText('생성을 취소했습니다. 선택한 구간은 유지됩니다.',{exact:true})).toBeVisible();
  await expect(page.getByLabel('시작',{exact:true})).toHaveValue('0:30');await expect(page.getByRole('button',{name:'GIF 생성',exact:true})).toBeEnabled();
  await open(page,'save-error');await expect(page.getByRole('img',{name:'생성한 GIF 미리보기'})).toBeVisible();
  await page.getByRole('button',{name:'GIF 파일 저장',exact:true}).click();await expect(page.getByLabel('시작',{exact:true})).toBeDisabled();
  await expect(page.getByText('GIF 파일 저장 완료 · 상태 예시',{exact:true})).toBeVisible();
  await open(page,'native-unavailable');await expect(page.getByRole('button',{name:'클립보드 복사',exact:true})).toBeDisabled();await expect(page.getByRole('button',{name:'GIF 파일 저장',exact:true})).toBeEnabled();
});
test('GIF modal traps focus across slot and closes with Escape in open and closed roots',async({page})=>{
  await open(page);
  const close=page.getByRole('button',{name:'GIF 편집창 닫기'});await close.focus();await page.keyboard.press('Shift+Tab');await expect(page.locator('.gif-diagnostics summary')).toBeFocused();
  await page.keyboard.press('Tab');await expect(close).toBeFocused();
  await page.keyboard.press('Tab');await expect(page.getByRole('slider',{name:'선택 구간 이동'})).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/iframe.html?id=gif--closed-root&viewMode=story');await expect(page.getByRole('dialog')).toBeVisible();
  // Light-DOM slot remains reachable although the containing root is closed.
  await page.getByLabel('시작',{exact:true}).focus();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
});
