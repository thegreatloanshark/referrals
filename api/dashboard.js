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
  const rows=await db('referral_leads',{filter:`select=id,created_at,dsa_code,form_answers,stage_flags,duplicate_label,referral_payout_generated,first_file_amount,updated_at&order=created_at.desc&limit=1000${scope}`});
  // Keep precise money only server-side; the dashboard receives a quality band.
  const safeRows=rows.map(({first_file_amount,...lead})=>({
     ...lead,first_file_quality:lead.stage_flags?.business_started?qualityFor(first_file_amount):{band:null,grade:null}
  }));
  const counts={lead_created:rows.length};
  for(const lead of rows){for(const [k,v] of Object.entries(lead.stage_flags||{})){if(k!=='lead_created'&&v===true)counts[k]=(counts[k]||0)+1;}}
  return json(res,200,{role:viewer.role,profile:{name:viewer.profile.name,dsaCode:viewer.dsaCode},counts,leads:safeRows});
 }catch(e){console.error('Dashboard failed',e?.message);return json(res,503,{error:'Unable to load dashboard.'});}
}
