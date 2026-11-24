import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=f=>fs.readFileSync(new URL(f,import.meta.url),'utf8');
test('legacy OTP endpoints are disabled',()=>{
 for(const f of ['../api/request-otp.js','../api/verify-otp.js'])assert.match(read(f),/410/);
});
test('Clerk lookup binds server verified user to private roster',()=>{
 const auth=read('../lib/clerk-auth.js');
 assert.match(auth,/verifyToken/);assert.match(auth,/users.getUser/);
 assert.match(read('../lib/directory.js'),/verification\?\.status === 'verified'/);
 assert.match(auth,/matchUser/); assert.match(read('../lib/directory.js'),/verifiedEmails/);
 assert.doesNotMatch(read('../public/app.js'),/request-otp|verify-otp/);
});
test('referral form remains signed-link guarded and sitemap excluded',()=>{
 assert.match(read('../public/form.js'),/lead-create/);
 assert.doesNotMatch(read('../public/sitemap.xml'),/\/form/);
});
