import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const text=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('lookup uses the actual imported authorization resolver for ALL users',()=>{
 const source=text('../api/lookup.js');
 assert.match(source,/import \{resolveAuthorizedProfile\} from/);
 assert.match(source,/await resolveAuthorizedProfile\(req\)/);
 assert.doesNotMatch(source,/await authorizedProfile\(req\)/);
 assert.match(source,/reason:'?invalid_session'?|invalid_session:/);
});
test('the entire site uses a single reward rather than bank-specific reward amounts',()=>{
 for (const file of ['../public/index.html','../public/landing.html','../public/app.js']) {
  const s=text(file);
  assert.doesNotMatch(s,/₹7,000|PRIVATE BANK|PSU BANK|Private Bank<\/span>|PSU Bank<\/span>/);
  assert.match(s,/₹5,000/);
 }
 assert.match(text('../public/index.html'),/class="landing-cta"/);
});
