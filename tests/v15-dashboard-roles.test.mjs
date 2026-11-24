import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('ordinary VH table avoids lead IDs, shows grouped referrer contact and primary statuses',()=>{
 const js=read('public/dashboard.js');
 assert.match(js,/function referrerCell\(lead\)/);
 assert.match(js,/<details class="vh-referrer-more">/);
 assert.match(js,/<th>Lead Status<\/th><th>Duplicate Status<\/th><th>Referral Payout Status<\/th>/);
 assert.match(js,/admin\?'<th>Lead ID<\/th><th>Created<\/th>':'/);
});
test('ordinary VH details are limited; admin retains grade and additional details',()=>{
 const js=read('public/dashboard.js');
 assert.match(js,/\]:\[\['Lead ID',l\.id\],\.\.\.referred,\['Exact First File Amount',formatMoney\(l\.first_file_amount\)\]\]/);
 assert.match(js,/\['First File Business Band',l\.first_file_quality\?\.band/);
 assert.match(js,/\['First File Grade',l\.first_file_quality\?\.grade/);
});
test('API retains backend ownership enforcement and returns exact file amount to authenticated owner only',()=>{
 const api=read('api/dashboard.js');
 assert.match(api,/viewer\.role==='super_admin'/);
 assert.match(api,/viewer\.dsaCode/);
 assert.match(api,/first_file_amount/);
 assert.match(api,/first_file_quality/);
});
