import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=f=>fs.readFileSync(new URL(f,import.meta.url),'utf8');
test('OTP endpoints and plaintext SMTP implementation removed',()=>{
 assert.ok(!fs.existsSync(new URL('../api/request-otp.js',import.meta.url)));
 assert.ok(!fs.existsSync(new URL('../api/verify-otp.js',import.meta.url)));
 assert.ok(!fs.existsSync(new URL('../lib/mailer.js',import.meta.url)));
});
test('Clerk lookup binds server verified user to private roster',()=>{
 const auth=read('../lib/clerk-auth.js');
 assert.match(auth,/authenticateRequest/);assert.match(auth,/users.getUser/);
 assert.match(auth,/verification\?\.status === 'verified'/);
 assert.match(auth,/roster.filter/); assert.match(auth,/verifiedEmails/);
 assert.doesNotMatch(read('../public/app.js'),/request-otp|verify-otp/);
});
test('referral form remains signed-link guarded and sitemap excluded',()=>{
 assert.match(read('../public/form.js'),/lead-create/);
 assert.doesNotMatch(read('../public/sitemap.xml'),/\/form/);
});
