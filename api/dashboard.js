import {json} from '../lib/security.js';
import {actor} from '../lib/actor.js';
import {db} from '../lib/supabase-server.js';
import {qualityFor} from '../lib/lead-quality.js';
export default async function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
 try{
  const viewer=await actor(req);
  if(!viewer)return json(res,403,{error:'Access restricted to approved Vertical Heads.'});
  // Ownership filtering happens in the server, never from a request parameter.
  const scope=viewer.role==='super_admin'?'':`&dsa_code=eq.${encodeURIComponent(viewer.dsaCode)}`;
  // Read every page in the authorized scope so totals are not silently capped at 1,000.
  const rows=[];const pageSize=1000;
  for(let offset=0;;){
   const page=await db('referral_leads',{filter:`select=id,created_at,dsa_code,referrer_dsa_code,form_answers,stage_flags,duplicate_label,referral_payout_generated,first_file_amount,updated_at&order=created_at.desc,id.desc&limit=${pageSize}&offset=${offset}${scope}`});
   rows.push(...page);if(page.length<pageSize)break;offset+=page.length;
  }
  // Exact amount is exposed only inside an already authorized, owner-scoped response.
  // Ordinary VH UI reveals it in Details; only Super Admin gets band/grade.
  const safeRows=rows.map(({first_file_amount,...lead})=>({
     ...lead, first_file_amount,
     ...(viewer.role==='super_admin'?{first_file_quality:lead.stage_flags?.business_started?qualityFor(first_file_amount):{band:null,grade:null}}:{})
  }));
  const counts={total:rows.length,lead_created:0,onboarded:0,business_started:0};
  for(const lead of rows){
   const flags=lead.stage_flags||{};
   const current=flags.business_started===true?'business_started':flags.onboarded===true?'onboarded':'lead_created';
   counts[current]++;
  }
  return json(res,200,{role:viewer.role,profile:{name:viewer.profile.name,dsaCode:viewer.dsaCode},counts,leads:safeRows});
 }catch(e){console.error('Dashboard failed',e?.message);return json(res,503,{error:'Unable to load dashboard.'});}
}
