import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {compile} from '../scripts/design/tokens.mjs';
const source = () => JSON.parse(readFileSync(new URL('../design/tokens.json', import.meta.url)));
test('missing references and type mismatches fail instead of generating invalid CSS', () => {
  const data = source();data.tokens['surface.canvas'].value = '{does.notExist}';
  assert.throws(() => compile(data), /Missing reference/);
  data.tokens['surface.canvas'].value = '{space.1}';
  assert.throws(() => compile(data), /type mismatch/);
});
test('cyclic references explain their dependency chain', () => {
  const data = source();data.tokens['surface.canvas'].value = '{surface.panel}';data.tokens['surface.panel'].value = '{surface.canvas}';
  assert.throws(() => compile(data), /Token cycle:.*surface/);
});
test('invalid dimensions and unknown theme overrides fail', () => {
  const data = source();data.tokens['space.1'].value = 'calc(invalid)';
  assert.throws(() => compile(data), /Invalid dimension/);
  const theme = source();theme.themes.light['surface.typo'] = '#ffffff';
  assert.throws(() => compile(theme), /Invalid theme override/);
});
test('generation is deterministic and product manifest loads UI before controller', () => {
  assert.equal(compile(source()).js, compile(source()).js);
  const manifest = JSON.parse(readFileSync(new URL('../extension/manifest.json', import.meta.url)));
  const scripts = manifest.content_scripts.find(item => item.matches.includes('https://submeta.io/*')).js;
  assert.ok(scripts.indexOf('ui/tokens.js') < scripts.indexOf('ui/primitives.js'));
  assert.ok(scripts.indexOf('ui/primitives.js') < scripts.indexOf('ui/react-runtime.js'));
  assert.ok(scripts.indexOf('ui/react-runtime.js') < scripts.indexOf('ui/playback-settings.js'));
  assert.ok(scripts.indexOf('ui/playback-settings.js') < scripts.indexOf('panel.js'));
});

test('React vendor exception never permits new application warnings or changed runtime bytes', async () => {
  const {validateLintReport} = await import('../scripts/lint-policy.mjs');
  const baseline = JSON.parse(readFileSync(new URL('../scripts/react-lint-baseline.json',import.meta.url)));
  const runtime = readFileSync(new URL('../extension/ui/react-runtime.js',import.meta.url));
  const report = {errors:[],notices:[],warnings:baseline.warnings};
  assert.equal(validateLintReport(report,runtime),2);
  assert.throws(() => validateLintReport({...report,warnings:[...report.warnings,{...report.warnings[0],file:'panel.js'}]},runtime),/New or changed/);
  assert.throws(() => validateLintReport({...report,errors:[{code:'MANIFEST_CONTENT_SCRIPT_FILE_NOT_FOUND'}]},runtime),/lint failed/);
  assert.throws(() => validateLintReport(report,Buffer.concat([runtime,Buffer.from('changed')])),/runtime changed/);
});

test('GIF React runtime and renderer load before controllers in both document contexts',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../extension/manifest.json',import.meta.url)));
  for(const entry of manifest.content_scripts){
    const scripts=entry.js;
    assert.ok(scripts.indexOf('ui/react-runtime.js')>=0);
    assert.ok(scripts.indexOf('ui/react-runtime.js')<scripts.indexOf('ui/gif-editor.js'));
    const controller=scripts.includes('gif/panel.js')?'gif/panel.js':'gif/launcher.js';
    assert.ok(scripts.indexOf('ui/gif-editor.js')<scripts.indexOf(controller));
  }
});
