import {test,expect} from '../e2e/harness.mjs';
import path from 'node:path';
import {readFile} from 'node:fs/promises';
test('capture illustrative listing images using the actual extension UI',async({harness:h})=>{
  await expect(h.page.locator('#saved')).not.toContainText('불러오는');
  await h.page.locator('#enabled').check();await h.page.locator('#rate').selectOption('1.5');
  await h.page.locator('#captions').selectOption('on');
  await expect.poll(()=>h.frame().locator('[role=combobox]').textContent()).toBe('Captions:한국어');
  await h.page.evaluate(()=>{
    document.querySelector('h1').textContent='Sample lesson';
    document.querySelectorAll('.VideoDetails__details button').forEach(b=>b.remove());
    const p=document.createElement('p');p.textContent='설명용 테스트 화면 · 실제 확장 UI / Illustrative test page';
    p.style.cssText='color:#aaaab2;font-size:14px';document.querySelector('.VideoDetails__details').append(p);
  });
  await h.frame().evaluate(()=>{
    document.body.style.cssText='margin:0;display:grid;place-content:center;height:100vh;background:#0d0d0e;color:#b8b8bf;font:16px sans-serif';
    document.querySelector('video').style.display='none';document.querySelector('[role=combobox]').style.display='none';
    const demo=document.createElement('div');demo.textContent='▶  Example video';demo.style.cssText='font-size:24px;letter-spacing:.04em';document.body.append(demo);
  });
  await h.page.setViewportSize({width:1280,height:800});
  await h.page.screenshot({path:path.resolve('release/assets/listing-desktop.png')});
  const promo=await h.context.newPage();
  await promo.setViewportSize({width:440,height:280});
  const icon=(await readFile('extension/icons/icon.svg','utf8')).replace('width="128" height="128"','width="48" height="48"');
  await promo.setContent(`<html><body style="margin:0;background:#151518;color:#f5f5f7;font-family:Arial,sans-serif;padding:28px;box-sizing:border-box;width:440px;height:280px"><div style="display:flex;gap:14px;align-items:center"><div style="width:48px;height:48px">${icon}</div><div style="font-size:17px;font-weight:700">Playback Presets<br><span style="color:#aaa;font-weight:400">for Submeta</span></div></div><div style="font-size:28px;font-weight:700;margin-top:25px">Your playback.<br>Your preferences.</div><div style="margin-top:20px;font-size:15px;color:#c4c4cb">Speed · Captions · Remember settings</div><div style="margin-top:15px;color:#909098;font-size:11px">Unofficial extension for Chrome</div></body></html>`);
  await promo.screenshot({path:path.resolve('release/chrome/promo-440x280.png')});
  await promo.close();
  await h.page.setViewportSize({width:390,height:844});
  await h.page.screenshot({path:path.resolve('release/assets/listing-mobile.png')});
});
