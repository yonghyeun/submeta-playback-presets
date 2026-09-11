import {test as base,expect,chromium} from 'playwright/test';
import {mkdtemp,readFile,writeFile,mkdir,rm,cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {routeSite,lessonURL} from './site.mjs';
const source=new URL('../../extension/',import.meta.url);
// Test-only adapter: retain Firefox distribution manifest and source unchanged.
// Promise listener semantics are bridged explicitly for Chromium's callback API.
const shim=`globalThis.browser={storage:{local:chrome.storage.local,onChanged:{addListener(fn){chrome.storage.onChanged.addListener((...args)=>setTimeout(()=>fn(...args),STORAGE_EVENT_DELAY));}}},runtime:{sendMessage:(m)=>chrome.runtime.sendMessage(m),onMessage:{addListener(fn){chrome.runtime.onMessage.addListener((m,s,reply)=>{const r=fn(m,s);if(r&&typeof r.then==='function'){r.then(reply,()=>reply({unavailable:true}));return true;}return r;});}}},tabs:chrome.tabs};`;
export const test=base.extend({
  storageEventDelay:[0,{option:true}],
  harness:async({storageEventDelay},use,testInfo)=>{
    const temp=await mkdtemp(path.join(tmpdir(),'submeta-e2e-')),ext=path.join(temp,'extension');await mkdir(ext);
    const manifest=JSON.parse(await readFile(new URL('manifest.json',source),'utf8'));
    delete manifest.browser_specific_settings;
    manifest.background={service_worker:'test-background.js'};
    for(const entry of manifest.content_scripts)entry.js=['test-shim.js',...entry.js];
    await cp(new URL('icons/',source),path.join(ext,'icons'),{recursive:true});
    await writeFile(path.join(ext,'manifest.json'),JSON.stringify(manifest));
    await writeFile(path.join(ext,'test-shim.js'),shim.replace('STORAGE_EVENT_DELAY',String(storageEventDelay)));
    await writeFile(path.join(ext,'test-background.js'),"importScripts('test-shim.js','background.js');");
    for(const file of ['shared.js','background.js','panel.js','player.js'])await writeFile(path.join(ext,file),await readFile(new URL(file,source)));
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
