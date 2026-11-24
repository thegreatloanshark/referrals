import {easyQrSlug} from './security.js';
const emailOf=e=>String(e||'').trim().toLowerCase();
export function validateDirectory(rows){
 if(!Array.isArray(rows)||!rows.length||rows.length>500)throw Error('Directory snapshot must have 1–500 rows');
 const codes=new Set(),emails=new Set();
 return rows.map(row=>{
  const name=String(row.name||'').trim(),mobile=String(row.mobile||'').trim(),email=emailOf(row.email),dsaCode=String(row.dsaCode||'').trim(),role=String(row.role||'').trim();
  if(!name||name.length>180||!/^\d{10}$/.test(mobile)||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||!/^DSA\d{5,20}$/.test(dsaCode)||!['','VH','Super Admin'].includes(role))throw Error('Invalid directory row');
  if(codes.has(dsaCode)||emails.has(email))throw Error('Duplicate DSA code or email');codes.add(dsaCode);emails.add(email);
  return {name,mobile,email,dsaCode,role:role==='Super Admin'?'super_admin':role==='VH'?'vh':null};
 });
}
export function directorySnapshot(rows,users){
 const matches=new Map();
 for(const u of users)for(const e of u.emailAddresses||[]){const k=emailOf(e.emailAddress);if(!matches.has(k))matches.set(k,new Map());matches.get(k).set(u.id,u);}
 const linked=new Set();
 return rows.map(p=>{
  const found=[...(matches.get(p.email)?.values()||[])];
  if(found.length>1)throw Error('Ambiguous Clerk email match');
  const u=found[0];if(u&&linked.has(u.id))throw Error('One Clerk user matches multiple VH rows');if(u)linked.add(u.id);
  const inactive=u&&(u.banned||u.locked||u.disabled||u.isDisabled);
  const verified=u?.emailAddresses?.some(e=>emailOf(e.emailAddress)===p.email&&e.verification?.status==='verified');
  return {dsa_code:p.dsaCode,registered_email:p.email,vh_name:p.name,mobile:p.mobile,access_role:p.role,clerk_user_id:u?.id||null,live_status:inactive?'Inactive':verified?'Active':'Pending',qr_slug:easyQrSlug(p)};
 });
}
export async function fetchDirectoryUsers(client,rows){
 const users=new Map();
 for(let i=0;i<rows.length;i+=100){const emailAddress=rows.slice(i,i+100).map(r=>r.email);
  for(let offset=0;;){const page=await client.users.getUserList({emailAddress,limit:100,offset});
   if(!Array.isArray(page.data)||!Number.isInteger(page.totalCount))throw Error('Invalid Clerk response');
   for(const u of page.data)users.set(u.id,u);offset+=page.data.length;
   if(offset>=page.totalCount)break;if(!page.data.length)throw Error('Incomplete Clerk page');
  }
 }
 return [...users.values()];
}
