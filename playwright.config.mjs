import {defineConfig} from 'playwright/test';
export default defineConfig({
  testDir:'./tests/e2e', timeout:30000, expect:{timeout:8000},
  fullyParallel:false, workers:1, retries:0,
  reporter:[['list'],['html',{open:'never'}]],
  outputDir:'test-results'
});
