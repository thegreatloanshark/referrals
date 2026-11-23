import { verifyToken,json,restrictOrigin,rosterByCode } from '../lib/security.js';
import { db } from '../lib/supabase-server.js';
import { classifyDuplicate } from '../lib/duplicates.js';
const fields=['referrerName','referrerMobile','referrerEmail','referrerCity','referredName','referredMobile','referredEmail'];
const trim=v=>typeof v==='string'?v.trim():'';
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 if(!restrictOrigin(req))return json(res,403,{error:'Origin not allowed'});
 try{
  const body=req.body||{};
  const attribution=verifyToken(body.ref);
  if(!attribution)return json(res,403,{error:'A valid Vertical Head referral link is required.'});
  const answers=Object.fromEntries(fields.map(f=>[f,trim(body[f])]));
  if(fields.some(f=>!answers[f] || answers[f].length>180))return json(res,400,{error:'Complete all required fields.'});
  if(!/^[6-9]\d{9}$/.test(answers.referrerMobile)||!/^[6-9]\d{9}$/.test(answers.referredMobile))return json(res,400,{error:'Enter valid 10-digit Indian mobile numbers.'});
  if(['referrerEmail','referredEmail'].some(f=>!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answers[f])))return json(res,400,{error:'Enter valid email addresses.'});
  if(body.consent!==true)return json(res,400,{error:'Consent is required.'});
  const duplicate=await classifyDuplicate(answers.referredMobile,answers.referredEmail);
  const row={ dsa_code:attribution.code, vh_name:rosterByCode(attribution.code)?.name||null,
    utm_source:attribution.utm_source||null,utm_medium:attribution.utm_medium||null,
    utm_campaign:attribution.utm_campaign||null,utm_content:attribution.utm_content||null,utm_term:attribution.utm_term||null,
    landing_url:'/form',form_answers:{...answers,consent:true},stage_flags:{lead_created:true}, duplicate_label:duplicate.label,original_lead_id:duplicate.originalLeadId,referral_payout_generated:duplicate.label==='Duplicate'?'Not Qualified for Payout':'Pending'};
  const saved=await db('referral_leads',{method:'POST',body:row});
  return json(res,201,{success:true,leadId:saved?.[0]?.id||null});
 }catch(e){console.error('Lead creation failed',e.message);return json(res,503,{error:'Could not save the referral. Please try again.'});}
}
