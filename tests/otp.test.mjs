import test from 'node:test';
import assert from 'node:assert/strict';
import requestOtp from '../api/request-otp.js';
import verifyOtp from '../api/verify-otp.js';
test('retired OTP endpoints cannot issue a session',()=>{
 for(const handler of [requestOtp,verifyOtp]){const headers={};const res={setHeader:(k,v)=>headers[k]=v,end:()=>{}};handler({method:'POST'},res);assert.equal(res.statusCode,410);assert.equal(headers['Set-Cookie'],undefined);}
});
