import {readFileSync} from 'node:fs';
import {compile} from './tokens.mjs';

const source = JSON.parse(readFileSync(new URL('../../design/tokens.json', import.meta.url)));
const {js, css} = compile(source);
if (readFileSync(new URL('../../extension/ui/tokens.js', import.meta.url), 'utf8') !== js) throw new Error('Generated tokens are stale. Run npm run design:generate');
const variables = new Set([...css.matchAll(/(--sm-[a-z0-9-]+):/g)].map(match => match[1]));
for (const file of ['primitives.js', 'playback-settings.js']) {
  const content = readFileSync(new URL('../../extension/ui/' + file, import.meta.url), 'utf8');
  if (/#[\da-f]{3,8}\b|\b(?:rgb|hsl)a?\(|\b\d+(?:\.\d+)?px\b/i.test(content)) throw new Error(`Use design tokens instead of raw colors/dimensions: extension/ui/${file}`);
  for (const [, variable] of content.matchAll(/var\((--sm-[a-z0-9-]+)/g)) if (!variables.has(variable)) throw new Error(`Unknown CSS token ${variable} in ${file}`);
}
console.log('Design contract passed: references, types, cycles, themes, generated output and scoped style rules.');
