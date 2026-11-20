import test from 'node:test';import assert from 'node:assert/strict';
import {rosterByMobile,issueToken,verifyToken} from '../lib/security.js';
process.env.REFERRAL_SIGNING_SECRET='a secure testing secret longer than thirty two characters';
test('retains all 27 profiles including Doubt and Exit',async()=>{const roster=(await import('../lib/roster.private.json',{with:{type:'json'}})).default;assert.equal(roster.length,27);assert.equal(roster.filter(x=>x.status==='Doubt').length,3);assert.equal(roster.filter(x=>x.status==='Exit').length,1)});
test('Shivankur profile contains exact supplied mapping',()=>{const p=rosterByMobile('9945048798');assert.equal(p?.name,'Shivankur');assert.equal(p?.dsaCode,'DSA00100001')});
test('signed attribution cannot be modified',()=>{const p=rosterByMobile('9945048798');const valid=issueToken(p,2000000000);assert.equal(verifyToken(valid,2000000001)?.code,p.dsaCode);const tampered=valid.replace(/.$/,c=>c==='a'?'b':'a');assert.equal(verifyToken(tampered,2000000001),null);assert.equal(verifyToken(valid,2000000000+60*60*24*31),null)});
