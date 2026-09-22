import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {validateLintReport} from './lint-policy.mjs';
// Scan every file, including vendor code. Do not suppress a warning class globally.
const output = execFileSync(process.execPath,['node_modules/web-ext/bin/web-ext.js','lint','--source-dir','extension','--output','json','--no-config-discovery'],{encoding:'utf8',timeout:120000});
const count = validateLintReport(JSON.parse(output),readFileSync('extension/ui/react-runtime.js'));
console.log(`Extension lint passed: zero errors or new warnings; ${count} reviewed upstream React DOM diagnostics (exact runtime hash and locations).`);
