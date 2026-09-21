import {test,expect} from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync} from 'node:fs';
const tokenScript = readFileSync(new URL('../../extension/ui/tokens.js',import.meta.url),'utf8');
const controlsScript = readFileSync(new URL('../../extension/ui/primitives.js',import.meta.url),'utf8');
const rendererScript = readFileSync(new URL('../../extension/ui/playback-settings.js',import.meta.url),'utf8');

async function open(page, state = 'ready') {
  await page.goto(`/iframe.html?id=playback--${state}&viewMode=story`);
  await expect(page.getByRole('heading',{level:1})).toBeVisible();
  await page.evaluate(async () => {await document.fonts.load('400 14px "Noto Sans KR"','재생 설정');await document.fonts.load('600 14px "Noto Sans KR"','재생 설정');await document.fonts.ready;});
}
const a11y = page => new AxeBuilder({page}).include('.scenario').withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();

for (const width of [390,768,1100]) for (const state of ['ready','loading','error','light']) {
  test(`visual ${state} at ${width}`, async ({page}) => {
    await page.setViewportSize({width,height:850});await open(page,state);
    if (process.env.DESIGN_FAULT === 'visual' && state === 'ready') await page.locator('#rate').evaluate(element => {element.style.background='#ff00ff';element.style.minHeight='64px';});
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await expect(page.locator('.scenario')).toHaveScreenshot(`${state}-${width}.png`);
  });
}

for (const state of ['ready','loading','saving','error','disabled','unavailable','disconnected','suspended','defaults','light']) {
  test(`accessible ${state}`, async ({page}) => {
    await open(page,state);
    if (process.env.DESIGN_FAULT === 'a11y' && state === 'ready') await page.locator('#rate').evaluate(select => select.parentElement.firstChild.remove());
    const result = await a11y(page);
    expect(result.violations,JSON.stringify(result.violations,null,2)).toEqual([]);
  });
}

test('keyboard changes playback, opens status and restores suspension',async({page})=>{
  await open(page);
  await page.getByRole('checkbox',{name:'재생 설정 유지'}).focus();
  if(process.env.DESIGN_FAULT==='keyboard')await page.locator('#enabled').evaluate(element=>element.addEventListener('keydown',event=>event.preventDefault()));
  await page.keyboard.press('Space');
  await expect(page.getByRole('checkbox')).not.toBeChecked();
  await page.keyboard.press('Tab');await expect(page.getByRole('combobox',{name:'배속',exact:true})).toBeFocused();
  await expect(page.getByRole('combobox',{name:'배속',exact:true})).toHaveCSS('outline-style','solid');
  await page.keyboard.press('2');await page.keyboard.press('Tab');
  await expect(page.getByRole('combobox',{name:'배속',exact:true})).toHaveValue('2');
  await page.getByRole('checkbox').check();
  await page.locator('summary').focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('button',{name:'현재 영상만 해제',exact:true})).toBeVisible();
  await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'현재 영상만 해제',exact:true})).toBeFocused();
  await page.keyboard.press('Enter');await expect(page.getByRole('button',{name:'현재 영상 자동 적용 재개'})).toBeVisible();
  await page.keyboard.press('Enter');await expect(page.getByRole('button',{name:'현재 영상만 해제',exact:true})).toBeVisible();
});

test('error recovery and loading controls expose honest state',async({page})=>{
  await open(page,'loading');
  for(const name of ['배속','CC','언어'])await expect(page.getByRole('combobox',{name,exact:true})).toBeDisabled();
  await expect(page.getByRole('region')).toHaveAttribute('aria-busy','true');
  await open(page,'error');await expect(page.getByRole('status')).toContainText('저장 실패');
  await page.getByRole('button',{name:'다시 적용'}).click();await expect(page.getByRole('status')).toContainText('저장됨');
  await open(page,'unavailable');await expect(page.getByRole('combobox',{name:'언어',exact:true})).toHaveValue('ko');
  await expect(page.getByRole('status')).toContainText('선택 언어 미제공');
});

test('tokens and renderer work in a separate-origin frame, light DOM and closed root',async({page})=>{
  await page.route('https://design-frame.invalid/**',route=>route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><html lang="ko"><title>Isolated renderer</title><body></body></html>'}));
  await open(page);
  await page.evaluate(()=>{const frame=document.createElement('iframe');frame.src='https://design-frame.invalid/';frame.title='다른 출처 렌더러';document.body.append(frame);});
  await expect.poll(()=>page.frames().some(item=>item.url().startsWith('https://design-frame.invalid'))).toBe(true);
  const isolated=page.frames().find(item=>item.url().startsWith('https://design-frame.invalid'));
  for(const content of [tokenScript,controlsScript,rendererScript])await isolated.addScriptTag({content});
  const result=await isolated.evaluate(()=>{
    const read=[];
    for(const mode of ['light','open','closed']){
      const host=document.createElement('section');document.body.append(host);
      const root=mode==='light'?host:host.attachShadow({mode});
      const view=SubmetaUI.mountPlaybackSettings(root,{state:{prefs:{enabled:true,manageSpeed:true,rate:1.25,captions:'on',language:'ko'},connected:true,loading:false}});
      read.push({mode,height:getComputedStyle(view.get('rate')).minHeight,background:getComputedStyle(view.get('rate')).backgroundColor});
      view.destroy();
    }
    return read;
  });
  for(const item of result){expect(item.height).toBe('36px');expect(item.background).toBe('rgb(43, 43, 48)');}
});

test('closed root is operable through real keyboard input',async({page})=>{
  await open(page,'closed-root');
  // A closed root is intentionally not exposed to locators or axe.
  await page.locator('.scenario').evaluate(element=>{element.tabIndex=-1;element.focus();});
  await page.keyboard.press('Tab');await page.keyboard.press('Space');
  await page.keyboard.press('Tab');await page.keyboard.press('2');await page.keyboard.press('Tab');
  const cdp=await page.context().newCDPSession(page);
  const {nodes}=await cdp.send('Accessibility.getFullAXTree');
  expect(nodes.find(node=>node.role?.value==='combobox' && node.name?.value==='배속')?.value?.value).toBe('2×');
  await cdp.detach();
});

for(const width of [390,1100])test(`catalogue is usable at ${width}`,async({page},info)=>{
  await page.setViewportSize({width,height:850});
  await page.goto('/iframe.html?id=design--overview&viewMode=story');
  await expect(page.locator('.gallery h1')).toBeVisible();
  await page.evaluate(()=>document.fonts.ready);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  const result=await new AxeBuilder({page}).include('.gallery').withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  expect(result.violations,JSON.stringify(result.violations,null,2)).toEqual([]);
  await page.locator('#live-panel').getByRole('checkbox').uncheck();
  await expect(page.locator('#live-panel').getByRole('checkbox')).not.toBeChecked();
  await info.attach(`catalogue-${width}`,{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
});

test('shared primitives expose accessible controls',async({page})=>{
  await page.goto('/iframe.html?id=primitives--controls&viewMode=story');
  await expect(page.getByRole('heading',{name:'기본 요소'})).toBeVisible();
  const result=await new AxeBuilder({page}).include('.primitive-scene').withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  expect(result.violations,JSON.stringify(result.violations,null,2)).toEqual([]);
});
