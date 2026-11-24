import {clerkBackend} from '../../lib/clerk-auth.js';
import {validateDirectory,directorySnapshot,fetchDirectoryUsers} from '../../lib/directory-sync.js';
import {db,sqlStagePatch,syncDirectorySnapshot} from '../../lib/supabase-server.js';
import {json,secureCompare} from '../../lib/security.js';
import {numericAmount} from '../../lib/lead-quality.js';
const max=100;
const txt=x=>typeof x==='string'?x.trim():'';
function authorized(req){const secret=process.env.SHEET_SYNC_SECRET;const got=String(req.headers['x-sync-secret']||'');return secret?.length>=32 && got && secureCompare(got,secret)}
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 if(!authorized(req))return json(res,401,{error:'Unauthorized'});
 try{
  const {action}=req.body||{};
  if(action==='directory_sync'){
    const rows=validateDirectory(req.body.rows);
    const users=await fetchDirectoryUsers(clerkBackend(),rows);
    const snapshot=directorySnapshot(rows,users);
    const result=await syncDirectorySnapshot(snapshot);
    return json(res,200,{ok:true,result,statuses:snapshot.map(r=>({dsaCode:r.dsa_code,email:r.registered_email,status:r.live_status,role:r.access_role}))});
  }
  if(action==='pull'){
    const jobs=await db('referral_sync_jobs',{filter:`select=lead_id,sync_version&state=in.(pending,failed)&order=updated_at.asc&limit=${max}`});
    const result=[];
    for(const j of jobs||[]){const lead=(await db('referral_leads',{filter:`id=eq.${encodeURIComponent(j.lead_id)}&select=*&limit=1`}))?.[0];if(lead)result.push({lead,version:j.sync_version});}
    return json(res,200,{rows:result});
  }
  if(action==='ack'){
    const id=txt(req.body.leadId),v=Number(req.body.version);
    if(!/^[a-f0-9-]{36}$/i.test(id)||!Number.isInteger(v)||v<1)return json(res,400,{error:'Invalid ack'});
    // Only acknowledge the version actually written; never lose newer changes.
    await db('referral_sync_jobs',{method:'PATCH',filter:`lead_id=eq.${encodeURIComponent(id)}&target=eq.google_sheets&sync_version=eq.${v}`,body:{state:'synced',synced_at:new Date().toISOString(),last_error:null},prefer:'return=minimal'});
    return json(res,200,{ok:true});
  }
  if(action==='update'){
    const id=txt(req.body.leadId);
    if(!/^[a-f0-9-]{36}$/i.test(id))return json(res,400,{error:'Invalid lead ID'});
    const flags=req.body.stageFlags||{},extra=req.body.sheetExtra||{};
    if(typeof flags!=='object'||Array.isArray(flags)||typeof extra!=='object'||Array.isArray(extra))return json(res,400,{error:'Invalid fields'});
    const safeFlags={};for(const [k,v] of Object.entries(flags)){if(k==='lead_created'||k==='qualified')continue;if(!/^[a-z][a-z0-9_]{0,63}$/.test(k)||typeof v!=='boolean')return json(res,400,{error:'Invalid stage'});safeFlags[k]=v;}
    const safeExtra={};for(const [k,v] of Object.entries(extra)){if(!/^[a-z][a-z0-9_]{0,63}$/.test(k)||!['string','number','boolean'].includes(typeof v))return json(res,400,{error:'Invalid extra column'});safeExtra[k]=String(v).slice(0,500);}
    if(Object.keys(safeFlags).length>40||Object.keys(safeExtra).length>50)return json(res,400,{error:'Too many columns'});
    // The Sheet is an operator-only control plane. Validate the disbursement
    // amount as numeric rupees, not a display band or an arbitrary free text.
    let amount;
    if(Object.hasOwn(req.body,'firstFileAmount')){
      try { amount=numericAmount(req.body.firstFileAmount); }
      catch(e){return json(res,400,{error:e.message});}
    }
    const leadStatus=txt(req.body.leadStatus),firstFileStatus=txt(req.body.firstFileStatus),payout=txt(req.body.referralPayoutGenerated);
    if(leadStatus&&!['Lead Created','Lead Onboarded','Business Started'].includes(leadStatus))return json(res,400,{error:'Invalid Lead Status'});
    if(firstFileStatus&&!['File Disbursed','Paid on FastPay'].includes(firstFileStatus))return json(res,400,{error:'Invalid First File Status'});
    if(payout&&!['Yes','No'].includes(payout))return json(res,400,{error:'Invalid referral payout status'});
    if(leadStatus){safeFlags.lead_created=true;safeFlags.onboarded=leadStatus!=='Lead Created';safeFlags.business_started=leadStatus==='Business Started';}
    if(firstFileStatus)safeExtra.first_file_status=firstFileStatus;
    // Atomic, database-owned payout timestamp: never reset history on Yes -> No.
    if(payout){
      const prior=(await db('referral_leads',{filter:`id=eq.${encodeURIComponent(id)}&select=referral_payout_generated,referral_payout_generated_at,duplicate_label,first_file_amount,stage_flags,sheet_extra&limit=1`}))?.[0];
      if(!prior)return json(res,404,{error:'Lead not found'});
      if(payout==='Yes'&&prior.duplicate_label==='Duplicate')return json(res,409,{error:'Duplicate referrals cannot be marked paid'});
      if(payout==='Yes'&&(Number(amount===undefined?prior.first_file_amount:amount)<3000000||
         (firstFileStatus||prior.sheet_extra?.first_file_status)!=='Paid on FastPay'||
         !(leadStatus?leadStatus==='Business Started':prior.stage_flags?.business_started)))
        return json(res,409,{error:'Payout requires Business Started, at least ₹30 lakh disbursement and Paid on FastPay'});
      await db('referral_leads',{method:'PATCH',filter:`id=eq.${encodeURIComponent(id)}`,body:{referral_payout_generated:payout,...(payout==='Yes'&&!prior.referral_payout_generated_at?{referral_payout_generated_at:new Date().toISOString()}:{})},prefer:'return=minimal'});
    }
    const changed=await sqlStagePatch(id,safeFlags,safeExtra,amount);
    return json(res,200,{ok:true,changed});
  }
  return json(res,400,{error:'Unknown action'});
 }catch(e){console.error('Sheet sync error',e.message);return json(res,503,{error:'Sheet synchronization unavailable'});}
}
