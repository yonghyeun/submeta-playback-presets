import {test,expect} from 'playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {readFileSync} from 'node:fs';
const open = (page,id,args = '') => page.goto(`/iframe.html?id=${id}&viewMode=story${args ? '&args='+encodeURIComponent(args) : ''}`);

for (const id of ['button--primary','button--disabled','checkbox--checked','checkbox--disabled','selectfield--default','selectfield--disabled','statusmessage--error','disclosure--expanded','playbacksettings--default','giflauncher--ready','giflauncher--connecting','giflauncher--waiting','giflauncher--opened','giflauncher--error','giflauncher--light','progress--determinate','progress--indeterminate','progress--complete','timefield--default','timefield--invalid']) {
  test(`React component accessibility ${id}`, async ({page}) => {
    await open(page,id);
    await expect(page.locator('.demo-host')).toBeVisible();
    const result = await new AxeBuilder({page}).include('.demo-host').withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    expect(result.violations,JSON.stringify(result.violations,null,2)).toEqual([]);
  });
}

test('component args control labels, variants, disabled and selected states',async({page})=>{
  await page.goto('/?path=/story/button--secondary');
  const preview = page.frameLocator('iframe');
  await expect(preview.getByRole('button',{name:'다시 적용'})).toBeVisible();
  await page.getByRole('row').filter({hasText:'children'}).getByRole('textbox').fill('설정 저장');
  await page.getByRole('radio',{name:'primary',exact:true}).check();
  await page.getByRole('row').filter({has:page.getByRole('switch',{name:'disabled',exact:true})}).getByText('True',{exact:true}).click();
  await expect(preview.getByRole('button',{name:'설정 저장'})).toBeDisabled();
  await expect(preview.getByRole('button')).toHaveAttribute('data-variant','primary');
  await open(page,'checkbox--checked');
  await page.getByRole('checkbox').focus();await page.keyboard.press('Space');
  await expect(page.getByRole('checkbox')).not.toBeChecked();
  await open(page,'selectfield--default');
  await page.getByRole('combobox',{name:'배속'}).selectOption('2');
  await expect(page.getByRole('combobox')).toHaveValue('2');
  await open(page,'disclosure--collapsed');
  await page.locator('summary').focus();await page.keyboard.press('Enter');
  await expect(page.getByText('배속: 1.25× 적용됨')).toBeVisible();
});

test('autodocs exposes the production component contract',async({page})=>{
  await page.goto('/iframe.html?id=playbacksettings--docs&viewMode=docs');
  await expect(page.getByText('제품에서 사용하는 조합 컴포넌트의 실제 props 계약입니다.',{exact:false}).first()).toBeVisible();
  await expect(page.getByText('선택값의 단일 원본.',{exact:false}).first()).toBeVisible();
  await expect(page.getByRole('columnheader',{name:'Control',exact:true}).first()).toBeVisible();
});

test('production adapter survives mount, update, unmount and remount without duplicate actions',async({page})=>{
  await page.goto('/iframe.html?id=design--overview&viewMode=story');
  // Separate document uses the exact packaged runtime and UI, not Storybook's React.
  const frame = await page.evaluateHandle(()=>{const frame=document.createElement('iframe');document.body.append(frame);return frame;});
  const isolated = await (await frame.asElement()).contentFrame();
  for(const file of ['tokens.js','primitives.js','react-runtime.js','playback-settings.js']) await isolated.addScriptTag({content:readFileSync(new URL('../../extension/ui/'+file,import.meta.url),'utf8')});
  const result = await isolated.evaluate(()=>{
    const host=document.createElement('section');document.body.append(host);const root=host.attachShadow({mode:'closed'});
    let events=0;let values;
    for(let i=0;i<10;i++){
      const view=SubmetaUI.mountPlaybackSettings(root,{state:{prefs:{enabled:true,manageSpeed:true,rate:1.25,captions:'on',language:'ko'},connected:true},actions:{change(_id,next){events++;values=next;}}});
      view.get('enabled').click();
      view.setText('saved','저장 실패 · 다시 변경해 주세요','error');
      if(!root.querySelector('details').open)throw new Error('Error did not reveal recovery actions');
      view.update({loading:true});if(!view.get('rate').disabled)throw new Error('Loading did not disable selection');
      view.destroy();view.destroy();view.update({loading:false});
      if(root.childElementCount)throw new Error('Unmount left UI behind');
    }
    return {events,values,remaining:root.childElementCount};
  });
  expect(result.events).toBe(10);
  expect(result.values).toMatchObject({enabled:false,manageSpeed:true,rate:'1.25',captions:'on',language:'ko'});
  expect(result.remaining).toBe(0);
});


test('launcher and progress expose waiting, recovery and completion states',async({page})=>{
  await open(page,'giflauncher--connecting');
  await expect(page.getByRole('button',{name:'GIF 만들기'})).toBeDisabled();
  await expect(page.getByRole('status')).toHaveText('편집창 연결 중…');
  await open(page,'giflauncher--error');
  await expect(page.getByRole('button')).toBeEnabled();
  await expect(page.locator('.sm-status')).toHaveAttribute('data-tone','error');
  await open(page,'giflauncher--opened');
  await expect(page.getByRole('button')).toHaveAttribute('aria-expanded','true');
  await open(page,'progress--determinate');
  await expect(page.getByRole('progressbar',{name:'GIF 생성 진행률'})).toHaveAttribute('value','24');
  await open(page,'progress--indeterminate');
  await expect(page.getByRole('progressbar')).not.toHaveAttribute('value');
});


test('registered product surfaces exist in the built Storybook catalogue',async({request})=>{
  const inventory=JSON.parse(readFileSync(new URL('../../design/ui-surfaces.json',import.meta.url)));
  const response=await request.get('/index.json');
  expect(response.ok()).toBe(true);
  const {entries}=await response.json();
  for(const surface of inventory.surfaces) expect(entries[surface.story],surface.id).toBeTruthy();
});
