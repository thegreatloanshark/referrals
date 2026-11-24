import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('referral form carries two views, required referrer DSA code, referred city, informed consent',()=>{
 const h=read('public/form.html'),js=read('public/form.js');
 assert.match(h,/referral-two-panels/);assert.match(h,/referral-terms-scroll/);
 for(const field of ['referrerName','referrerDsaCode','referrerMobile','referrerEmail','referrerCity','referredName','referredMobile','referredEmail','referredCity'])assert.match(h,new RegExp(`name="${field}"`));
 assert.match(h,/name="consent" required/);assert.match(js,/consentError/);assert.match(js,/api\/verify/);
});
test('server saves referrer DSA code separately from signed VH ownership, still checks consent and duplicates',()=>{
 const s=read('api/lead-create.js');assert.match(s,/verifyToken\(body.ref\)/);assert.match(s,/referrer_dsa_code:answers.referrerDsaCode/);assert.match(s,/dsa_code:attribution.code/);assert.match(s,/body.consent!==true/);assert.match(s,/classifyDuplicate/);
});
test('dashboard shows and searches referrer DSA code in the authorized scope',()=>{
 const api=read('api/dashboard.js'),js=read('public/dashboard.js');assert.match(api,/referrer_dsa_code/);assert.match(api,/viewer.dsaCode/);assert.match(js,/<th>Referrer DSA Code<\/th>/);assert.match(js,/l.referrer_dsa_code/);
});
test('sheet migration is manual and non-destructive; source Sheet1 retained',()=>{
 const s=read('integration/GoogleAppsScript.gs');assert.match(s,/function migrateReferralDatabaseV14/);assert.match(s,/old\.copyTo\(ss\)/);assert.match(s,/getSheetByName\('Database'\)/);assert.match(s,/\bVH Code\b/);assert.match(s,/Referrer DSA Code/);assert.match(s,/Referred City/);assert.match(s,/Token Fingerprint/);assert.match(s,/Consent/);assert.match(s,/First File Amount \(INR\)/);assert.match(s,/readSheetEdits/);assert.match(s,/api\('update'/);
});
test('database migration preserves VH attribution dsa_code and adds distinct field',()=>{
 const s=read('integration/v14-referral-database.sql');assert.match(s,/ADD COLUMN IF NOT EXISTS referrer_dsa_code/);assert.doesNotMatch(s,/DROP COLUMN/i);
});
test('mobile nav has distinct close control, backdrop, and accessible toggle',()=>{
 assert.match(read('public/vh-only.html'),/vhCloseSidebar/);assert.match(read('public/vh-only.html'),/vhSidebarBackdrop/);assert.match(read('public/dashboard.js'),/max-width:780px/);assert.match(read('public/styles.css'),/vh-sidebar-close/);
});
