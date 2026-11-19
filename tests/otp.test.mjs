import test from 'node:test';
import assert from 'node:assert/strict';
import {createOtpChallenge,verifyOtpChallenge,createAuthSession,unseal,makeOtp} from '../lib/security.js';
process.env.OTP_SIGNING_SECRET='independent test-only secret longer than thirty two characters';
test('six-digit OTP challenge validates and expires',()=>{
 const challenge=createOtpChallenge('9945048798','123456',2000000000);
 assert.equal(verifyOtpChallenge(challenge,'123456',2000000001),'9945048798');
 assert.equal(verifyOtpChallenge(challenge,'111111',2000000001),null);
 assert.equal(verifyOtpChallenge(challenge,'123456',2000000299),'9945048798');
 assert.equal(verifyOtpChallenge(challenge,'123456',2000000301),null);
});
test('challenge tampering rejected and session sealed',()=>{
 const challenge=createOtpChallenge('9945048798','222222');
 assert.equal(unseal(challenge.slice(0,-1)+'x'),null);
 assert.equal(unseal(createAuthSession('9945048798')).kind,'session');
});
test('OTP generator formats exactly six digits',()=>{
 for(let i=0;i<40;i++) assert.match(makeOtp(),/^\d{6}$/);
});
