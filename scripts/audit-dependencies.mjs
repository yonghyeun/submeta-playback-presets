import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';

const baseline=JSON.parse(readFileSync(new URL('./audit-baseline.json',import.meta.url)));
let output;
try {
  output=execFileSync('npm',['audit','--json'],{encoding:'utf8',timeout:120000});
} catch(error) {
  if(error.status!==1 || !error.stdout) throw error;
  output=error.stdout;
}
const report=JSON.parse(output);
if(report.error || report.auditReportVersion!==2 || !report.vulnerabilities || !report.metadata?.vulnerabilities) {
  throw new Error('Audit did not return a valid vulnerability report');
}
const known=new Set(baseline.advisories.map(a=>JSON.stringify([a.package,a.url,a.range,a.severity])));
const direct=[];
for(const [name,vulnerability] of Object.entries(report.vulnerabilities)) {
  if(!Array.isArray(vulnerability.via) || !vulnerability.via.length) throw new Error(`Unrecognized advisory: ${name}`);
  for(const advisory of vulnerability.via) {
    if(typeof advisory==='string') {
      if(!report.vulnerabilities[advisory]) throw new Error(`Unresolved advisory dependency: ${advisory}`);
      continue;
    }
    const key=JSON.stringify([name,advisory.url,advisory.range,advisory.severity]);
    if(!known.has(key)) throw new Error(`New or changed advisory: ${name} ${advisory.url}`);
    direct.push(`${name}: ${advisory.url}`);
  }
}
if(Object.keys(report.vulnerabilities).length && !direct.length) throw new Error('No root advisories in audit report');
if(direct.length && new Date().toISOString().slice(0,10)>baseline.reviewBy) {
  throw new Error(`Known advisories require review after ${baseline.reviewBy}`);
}
console.log(`Audit: ${report.metadata.vulnerabilities.total} affected dependency entries; ${direct.length} known advisories; no new advisories.`);
if(direct.length) console.log(`Unresolved, review by ${baseline.reviewBy}:\n${direct.join('\n')}`);
