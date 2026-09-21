import {test as base,expect,chromium} from 'playwright/test';
import {mkdtemp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {routeSite,lessonURL} from './site.mjs';
const root=new URL('../../',import.meta.url);
execFileSync('python3',['scripts/package_chrome.py'],{cwd:root});
const version=JSON.parse(await readFile(new URL('extension/manifest.json',root),'utf8')).version;
export const test=base.extend({
  storageEventDelay:[0,{option:true}],
  harness:async({storageEventDelay},use,testInfo)=>{
    const temp=await mkdtemp(path.join(tmpdir(),'submeta-e2e-')),ext=path.join(temp,'extension');await mkdir(ext);
    // Extract exactly the submission ZIP. Only the delayed-event regression adds instrumentation.
    execFileSync('python3',['-m','zipfile','-e',`dist/submeta-playback-preset-${version}-chrome.zip`,ext],{cwd:root});
    if(storageEventDelay){
      const manifest=JSON.parse(await readFile(path.join(ext,'manifest.json'),'utf8'));
      for(const entry of manifest.content_scripts)entry.js.splice(1,0,'test-delay.js');
      await writeFile(path.join(ext,'manifest.json'),JSON.stringify(manifest));
      await writeFile(path.join(ext,'test-delay.js'),`browser.storage={local:chrome.storage.local,onChanged:{addListener(fn){chrome.storage.onChanged.addListener((...args)=>setTimeout(()=>fn(...args),${storageEventDelay}));}}};`);
    }
    let context;
    const errors=[];
    const h={async open(){
      context=await chromium.launchPersistentContext(path.join(temp,'profile'),{channel:'chromium',headless:true,viewport:{width:1100,height:800},args:[`--disable-extensions-except=${ext}`,`--load-extension=${ext}`]});
      await routeSite(context);await context.tracing.start({screenshots:true,snapshots:true,sources:true});
      h.context=context;h.page=await context.newPage();h.page.on('pageerror',e=>errors.push(e.message));
      h.worker=context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
      await h.page.goto(lessonURL);await expect(h.page.locator('#submeta-presets')).toBeVisible();
    },async restart(){await context.tracing.stop();await context.close();await h.open();},
    frame(){return h.page.frames().find(f=>f.url().startsWith('https://iframe.cloudflarestream.com/'));},
    async rate(){return h.frame().locator('video').evaluate(v=>v.playbackRate);},
    async saved(){return h.worker.evaluate(async()=> (await chrome.storage.local.get('playbackPreset')).playbackPreset);}
    };
    try{await h.open();await use(h);expect(errors).toEqual([]);}
    finally{
      if(context){if(testInfo.status!==testInfo.expectedStatus){await h.page.screenshot({path:testInfo.outputPath('failure.png'),fullPage:true}).catch(()=>{});await context.tracing.stop({path:testInfo.outputPath('trace.zip')}).catch(()=>{});}else await context.tracing.stop().catch(()=>{});await context.close();}
      await rm(temp,{recursive:true,force:true});
    }
  }
});
export {expect};
