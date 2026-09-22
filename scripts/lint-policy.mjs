import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
const baseline = JSON.parse(readFileSync(new URL('./react-lint-baseline.json',import.meta.url)));
const fingerprint = ({code,file,line,column}) => JSON.stringify({code,file,line,column});
export function validateLintReport(report, runtime) {
  if (!Array.isArray(report.errors) || !Array.isArray(report.warnings) || report.errors.length || report.notices?.length) throw new Error('Extension lint failed: ' + JSON.stringify(report));
  const hash = createHash('sha256').update(runtime).digest('hex');
  if (hash !== baseline.runtimeSha256) throw new Error('React runtime changed; review its lint diagnostics before updating the narrow baseline');
  const actual = report.warnings.map(fingerprint).sort();
  const expected = baseline.warnings.map(fingerprint).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error('New or changed extension lint diagnostics: ' + JSON.stringify(report.warnings));
  return expected.length;
}
