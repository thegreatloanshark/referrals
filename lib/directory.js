import {db} from './supabase-server.js';

export function directoryMode(){
 const mode=process.env.VH_DIRECTORY_SOURCE||'roster';
 if(!['roster','supabase'].includes(mode))throw Error('Invalid VH_DIRECTORY_SOURCE');
 return mode;
}
export function legacyRole(code){
 const codes=new Set((process.env.SUPER_ADMIN_DSA_CODES||'DSA00100001,DSA00100002').split(',').map(x=>x.trim()));
 return codes.has(code)?'super_admin':'vh';
}
export function eligible(p){return p?.liveStatus==='Active'&&['vh','super_admin'].includes(p.role);}
export async function profiles(){
 if(directoryMode()==='roster'){
  const {default:roster}=await import('./roster.private.json',{with:{type:'json'}});
  return roster.map(p=>({...p,role:legacyRole(p.dsaCode),liveStatus:'Active'}));
 }
 const rows=await db('referral_vh_access',{filter:'select=dsa_code,registered_email,vh_name,mobile,access_role,live_status,clerk_user_id,qr_slug&access_role=in.(vh,super_admin)&order=dsa_code.asc&limit=501'});
 if(!Array.isArray(rows)||rows.length>500)throw Error('Directory unavailable or exceeds supported capacity');
 return rows.map(r=>({dsaCode:r.dsa_code,email:r.registered_email,name:r.vh_name,mobile:r.mobile,role:r.access_role,liveStatus:r.live_status,clerkUserId:r.clerk_user_id,qrSlug:r.qr_slug,designation:'Vertical Head'}));
}
export async function profileByCode(code){return (await profiles()).find(p=>p.dsaCode===code&&eligible(p))||null;}
export function matchUser(user,all,mode=directoryMode()){
 if(!user||user.banned||user.locked||user.disabled||user.isDisabled)return {profile:null,reason:'inactive_account'};
 const verifiedEmails=new Set((user.emailAddresses||[]).filter(email=>email.verification?.status === 'verified').map(e=>String(e.emailAddress||'').trim().toLowerCase()));
 if(!verifiedEmails.size)return {profile:null,reason:'no_verified_email'};
 const matchingProfiles=all.filter(p=>verifiedEmails.has(String(p.email||'').trim().toLowerCase()));
 if(!matchingProfiles.length)return {profile:null,reason:'email_not_in_directory'};
 if(matchingProfiles.length !== 1)return {profile:null,reason:'ambiguous_directory_match'};
 const p=matchingProfiles[0];
 if(!eligible(p)||(mode==='supabase'&&p.clerkUserId!==user.id))return {profile:null,reason:'directory_access_denied'};
 return {profile:p,reason:null};
}
