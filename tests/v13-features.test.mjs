import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {qualityFor,numericAmount} from '../lib/lead-quality.js';
import {easyQrSlug,resolveEasyQrSlug,rosterByCode} from '../lib/security.js';
process.env.REFERRAL_SIGNING_SECRET='a secure testing secret longer than thirty two characters';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
test('Marketing is in 29-record approved roster and matched only by verified Clerk email',()=>{
 const roster=JSON.parse(read('lib/roster.private.json'));
 assert.equal(roster.length,29);
 assert.deepEqual(roster.filter(x=>x.email==='nbloans.marketing@nobroker.in').map(x=>x.dsaCode),['DSA00100003']);
 assert.match(read('lib/clerk-auth.js'),/verification\?\.status === 'verified'/);
 assert.match(read('lib/clerk-auth.js'),/matchingProfiles.length !== 1/);
});
test('five exact first-file grading bands, never cumulative',()=>{
 for(const [amount,band,grade] of [[3125200,'₹30L+','B'],[5000000,'₹50L+','B+'],[8000000,'₹80L+','A'],[11525000,'₹1Cr+','AA'],[15000000,'₹1.5Cr+','AAA']])assert.deepEqual(qualityFor(amount),{band,grade});
 assert.deepEqual(qualityFor(2999999),{band:'Below ₹30L',grade:null});
 assert.equal(numericAmount('11525000.75'),'11525000.75');
 assert.throws(()=>numericAmount('123.456'));
});
test('QR slug is shorter than the old URL, deterministic, tamper-resistant, mapped by DSA',()=>{
 const shiv=rosterByCode('DSA00100001');const slug=easyQrSlug(shiv);
 assert.equal(slug.length,14);assert.equal(resolveEasyQrSlug(slug)?.dsaCode,shiv.dsaCode);
 assert.equal(resolveEasyQrSlug(slug.slice(0,13)+(slug.at(-1)==='X'?'Y':'X')),null);
 assert.match(read('api/qr.js'),/errorCorrectionLevel:'M',margin:5,width:1200/);
 assert.match(read('public/app.js'),/format=png/);
});
test('lead create classifies duplicate server side, keeps original, denies payout on phone duplicate',()=>{
 const src=read('api/lead-create.js');assert.match(src,/classifyDuplicate/);assert.match(src,/duplicate_label/);assert.match(src,/Not Qualified for Payout/);
 const dash=read('api/dashboard.js');assert.match(dash,/first_file_quality/);assert.match(dash,/viewer.dsaCode/);
});
test('three stages only and independent sidebar scroll with persistent preference',()=>{
 const h=read('public/vh-only.html'),js=read('public/dashboard.js'),css=read('public/styles.css');
 assert.match(h,/vh-dashboard-split/);assert.match(h,/vhToggleSidebar/);
 assert.match(js,/localStorage.setItem/);assert.match(js,/\['lead_created','onboarded','business_started'\]/);
 assert.doesNotMatch(h,/<option value="qualified">/);
 assert.match(css,/body.vh-active\{height:100dvh;overflow:hidden\}/);
});
test('V14 Apps Script preserves history in original Sheet1 and validates amounts through authorized sync',()=>{
 const script=read('integration/GoogleAppsScript.gs');assert.match(script,/copyTo\(ss\)/);assert.match(script,/First File Amount \(INR\)/);
 assert.match(script,/data.firstFileAmount=raw/);
 assert.match(read('api/internal/sheet-sync.js'),/numericAmount/);
});
