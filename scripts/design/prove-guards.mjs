import {spawnSync} from 'node:child_process';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';

if (process.env.DESIGN_FAULT) throw new Error('Run guards from a clean environment, without DESIGN_FAULT');
const root = path.resolve('design-fault-results'); mkdirSync(root,{recursive:true});
const trials = [
  {name:'tokens',args:['--input-type=module','-e',`import {readFileSync} from 'node:fs';import {compile} from './scripts/design/tokens.mjs';const data=JSON.parse(readFileSync('design/tokens.json'));data.tokens['surface.canvas'].value='{missing.token}';compile(data);`],signature:/Missing reference or type mismatch/},
  {name:'visual',grep:'visual ready at 390$',signature:/toHaveScreenshot/},
  {name:'a11y',grep:'accessible ready$',signature:/select-name/},
  {name:'keyboard',grep:'keyboard changes playback',signature:/toBeChecked/},
  {name:'integration',grep:'live speed edit with retention OFF',signature:/Expected: 1\.5/},
];
const summary=[];
for(const trial of trials){
  const directory=path.join(root,trial.name);mkdirSync(directory,{recursive:true});
  const resultFile=path.join(directory,'results.json');
  const args=trial.args || ['node_modules/playwright/cli.js','test','-c',trial.name==='integration'?'playwright.config.mjs':'playwright.ui.config.mjs','--grep',trial.grep,...(trial.name==='integration'?['--output',directory,'--reporter=list,json']:[])];
  const result=spawnSync(process.execPath,args,{encoding:'utf8',timeout:90000,env:{...process.env,FORCE_COLOR:'0',DESIGN_FAULT:trial.name==='tokens'?'':trial.name,PLAYWRIGHT_JSON_OUTPUT_FILE:resultFile}});
  const log=(result.stdout||'')+(result.stderr||'');writeFileSync(path.join(root,trial.name+'.log'),log);
  let exactFailure=true;
  if(!trial.args){
    const report=JSON.parse(readFileSync(resultFile,'utf8'));
    exactFailure=report.stats.unexpected===1 && report.stats.expected===0 && report.stats.skipped===0 && report.errors.length===0;
  }
  const passed=result.status===1 && !result.error && exactFailure && trial.signature.test(log);
  summary.push({guard:trial.name,detected:passed,exitCode:result.status,log:`design-fault-results/${trial.name}.log`});
  console.log(`${passed?'DETECTED':'FAILED TO VERIFY'}: ${trial.name}`);
  if(!passed){writeFileSync(path.join(root,'summary.json'),JSON.stringify(summary,null,2));throw new Error(`Fault verification failed: ${trial.name}. Inspect ${trial.name}.log`);}
}
writeFileSync(path.join(root,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log('All 5 intentional faults detected. Source files and reference images were not modified.');
