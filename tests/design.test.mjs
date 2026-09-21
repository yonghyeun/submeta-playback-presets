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
  assert.ok(scripts.indexOf('ui/primitives.js') < scripts.indexOf('ui/playback-settings.js'));
  assert.ok(scripts.indexOf('ui/playback-settings.js') < scripts.indexOf('panel.js'));
});
