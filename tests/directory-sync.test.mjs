import test from 'node:test';
import assert from 'node:assert/strict';
import {validateDirectory,directorySnapshot,fetchDirectoryUsers} from '../lib/directory-sync.js';
import {matchUser,profiles} from '../lib/directory.js';
import {issueToken,verifyToken,easyQrSlug,resolveEasyQrSlug} from '../lib/security.js';
process.env.REFERRAL_SIGNING_SECRET='test-only-directory-signing-secret-123456789';
const base={name:'Example VH',mobile:'9876543210',email:'one@example.test',dsaCode:'DSA000001',role:'VH'};
const user=(over={})=>({id:'user_1',emailAddresses:[{emailAddress:base.email,verification:{status:'verified'}}],...over});
test('directory input rejects duplicates, unknown roles and empty snapshots',()=>{
 assert.throws(()=>validateDirectory([]));assert.throws(()=>validateDirectory([base,base]));assert.throws(()=>validateDirectory([{...base,role:'Admin'}]));assert.equal(validateDirectory([{...base,role:''}])[0].role,null);
});
test('Clerk statuses computed from verified exact email, not Sheet status',()=>{
 const rows=validateDirectory([base]);
 assert.equal(directorySnapshot(rows,[])[0].live_status,'Pending');
 assert.equal(directorySnapshot(rows,[user()])[0].live_status,'Active');
 assert.equal(directorySnapshot(rows,[user({banned:true})])[0].live_status,'Inactive');
 assert.equal(directorySnapshot(rows,[user({locked:true})])[0].live_status,'Inactive');
 assert.equal(directorySnapshot(rows,[user({emailAddresses:[{emailAddress:base.email,verification:{status:'unverified'}}]})])[0].live_status,'Pending');
 assert.throws(()=>directorySnapshot(rows,[user(),user({id:'user_2'})]));
});
test('verified user must match active directory and exact Clerk ID; blank role denied',()=>{
 const p={...base,role:'vh',liveStatus:'Active',clerkUserId:'user_1'};
 assert.equal(matchUser(user(),[p],'supabase').profile.role,'vh');
 assert.equal(matchUser(user(),[{...p,role:'super_admin'}],'supabase').profile.role,'super_admin');
 for(const over of [{role:null},{liveStatus:'Pending'},{liveStatus:'Inactive'},{clerkUserId:'other'}])assert.equal(matchUser(user(),[{...p,...over}],'supabase').profile,null);
 assert.equal(matchUser(user({banned:true}),[p],'supabase').profile,null);
 assert.equal(matchUser(user(),[p,{...p,dsaCode:'DSA000002'}],'supabase').profile,null);
});
test('Clerk pagination follows totalCount and rejects incomplete page',async()=>{
 const rows=validateDirectory([base]);let calls=0;
 const client={users:{getUserList:async({offset})=>{calls++;return {data:[user({id:'user_'+offset})],totalCount:2};}}};
 assert.equal((await fetchDirectoryUsers(client,rows)).length,2);assert.equal(calls,2);
 await assert.rejects(fetchDirectoryUsers({users:{getUserList:async()=>({data:[],totalCount:1})}},rows));
});
test('Supabase mode never falls back to roster; existing QR resolves only for active authorized row',async()=>{
 const old=global.fetch;process.env.VH_DIRECTORY_SOURCE='supabase';process.env.SUPABASE_SECRET_KEY='sb_secret_test';
 const snapshot=directorySnapshot(validateDirectory([base]),[user()]);let rows=snapshot;
 global.fetch=async()=>new Response(JSON.stringify(rows));
 try{
  const p=(await profiles())[0],token=issueToken(p),slug=easyQrSlug(p);
  assert.equal((await verifyToken(token)).code,base.dsaCode);assert.equal((await resolveEasyQrSlug(slug)).dsaCode,base.dsaCode);
  rows=[{...snapshot[0],live_status:'Inactive'}];assert.equal(await verifyToken(token),null);assert.equal(await resolveEasyQrSlug(slug),null);
  rows=[];assert.deepEqual(await profiles(),[]);
  global.fetch=async()=>new Response('error',{status:503});await assert.rejects(profiles());
 }finally{global.fetch=old;delete process.env.VH_DIRECTORY_SOURCE;delete process.env.SUPABASE_SECRET_KEY;}
});
