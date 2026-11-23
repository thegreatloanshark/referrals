import {db} from './supabase-server.js';
// Phone match wins. Email-only match is reviewable, not automatically denied.
// Pilot traffic: fetch matches using indexed JSONB expression filters rather
// than exposing arbitrary lead search to the browser.
function quoted(v){return encodeURIComponent(String(v).replaceAll('"','\\"'));}
export async function classifyDuplicate(mobile,email){
  const phone=String(mobile||'').trim();
  const mail=String(email||'').trim().toLowerCase();
  const cols='select=id,created_at,form_answers&order=created_at.asc&limit=1';
  const matchesPhone=await db('referral_leads',{filter:`${cols}&form_answers->>referredMobile=eq.${encodeURIComponent(phone)}`});
  if(matchesPhone?.length)return {label:'Duplicate',originalLeadId:matchesPhone[0].id};
  const matchesEmail=await db('referral_leads',{filter:`${cols}&form_answers->>referredEmail=ilike.${encodeURIComponent(mail)}`});
  if(matchesEmail?.length)return {label:'Maybe Duplicate',originalLeadId:matchesEmail[0].id};
  return {label:'New',originalLeadId:null};
}
