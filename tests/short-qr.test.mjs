import test from 'node:test';
import assert from 'node:assert/strict';
import {issueToken,verifyToken,compactReferralLink,validateCompactReferralLink} from '../lib/security.js';
import roster from '../lib/roster.private.json' with {type:'json'};
process.env.REFERRAL_SIGNING_SECRET='sample-long-random-referral-signature-secret-for-tests';
test('compact referral preserves code without exposing raw long token',async()=>{
 const profile=roster[0];const t=issueToken(profile);const claim=await verifyToken(t);
 const s=compactReferralLink(profile,claim.exp);
 assert.ok(s.length<65);assert.equal((await validateCompactReferralLink(s))?.dsaCode,profile.dsaCode);
 assert.equal(await validateCompactReferralLink(s.slice(0,-2)+'XX'),null);
 assert.equal(await validateCompactReferralLink(s,claim.exp+1),null);
});
