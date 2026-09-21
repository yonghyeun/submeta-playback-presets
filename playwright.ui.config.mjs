import {defineConfig} from 'playwright/test';
const fault = process.env.DESIGN_FAULT;
if (fault && !['visual','a11y','keyboard'].includes(fault)) throw new Error(`Unknown UI fault: ${fault}`);
export default defineConfig({
  testDir:'./tests/ui', timeout:30000, fullyParallel:true, workers:2, retries:0,
  forbidOnly:Boolean(process.env.CI), updateSnapshots:'none',
  reporter:[['list'],['html',{outputFolder:fault?`design-fault-report/${fault}`:'design-report',open:'never'}],['json',{outputFile:fault?`design-fault-results/${fault}/results.json`:'design-test-results/results.json'}]],
  outputDir:fault?`design-fault-results/${fault}`:'design-test-results',
  snapshotPathTemplate:`{testDir}/__screenshots__/${process.platform}-${process.arch}/{arg}{ext}`,
  expect:{timeout:5000,toHaveScreenshot:{animations:'disabled',caret:'hide',scale:'css',maxDiffPixels:0,threshold:0.1}},
  use:{baseURL:'http://127.0.0.1:6006',browserName:'chromium',channel:'chromium',headless:true,viewport:{width:1100,height:850},locale:'ko-KR',timezoneId:'Asia/Seoul',deviceScaleFactor:1,colorScheme:'dark',reducedMotion:'reduce',trace:'retain-on-failure',screenshot:'only-on-failure'},
  webServer:{command:'node scripts/design/serve.mjs storybook-static 6006',url:'http://127.0.0.1:6006/index.json',reuseExistingServer:!process.env.CI,timeout:15000},
});
