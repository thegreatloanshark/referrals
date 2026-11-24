import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('authenticated dashboard uses Clerk-backed dashboard API, preserving server-side row ownership',()=>{
 assert.match(read('public/dashboard.js'),/clerkFetch\('\/api\/dashboard'\)/);
 assert.match(read('api/dashboard.js'),/viewer\.role==='super_admin'/);
 assert.match(read('api/dashboard.js'),/viewer\.dsaCode/);
 assert.match(read('public/vh-only.html'),/id="vhDashboardShell"/);
});
test('same referral form permits multiple independently saved leads without losing signed attribution',()=>{
 const js=read('public/form.js');
 assert.match(js,/id='referAnother'|getElementById\('referAnother'\)/);
 assert.match(js,/form\.reset\(\)/);
 assert.match(js,/ref:token/);
 assert.match(read('api/lead-create.js'),/db\('referral_leads',\{method:'POST'/);
});
test('latest roster and both Super Admin DSA codes retained',()=>{
 const roster=JSON.parse(read('lib/roster.private.json'));
 assert.equal(roster.length,29);
 assert.ok(roster.some(x=>x.name==='Adityaman'&&x.dsaCode==='DSA00100002'));
 assert.match(read('lib/actor.js'),/DSA00100001,DSA00100002/);
 assert.match(read('api/lookup.js'),/dsaCode:profile\.dsaCode/);
});
