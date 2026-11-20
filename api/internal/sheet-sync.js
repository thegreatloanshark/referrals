import {db,sqlStagePatch} from '../../lib/supabase-server.js';
import {json,secureCompare} from '../../lib/security.js';
const max=100;
const txt=x=>typeof x==='string'?x.trim():'';
function authorized(req){const secret=process.env.SHEET_SYNC_SECRET;const got=String(req.headers['x-sync-secret']||'');return secret?.length>=32 && got && secureCompare(got,secret)}
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 if(!authorized(req))return json(res,401,{error:'Unauthorized'});
 try{
  const {action}=req.body||{};
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
    const safeFlags={};for(const [k,v] of Object.entries(flags)){if(k==='lead_created')continue;if(!/^[a-z][a-z0-9_]{0,63}$/.test(k)||typeof v!=='boolean')return json(res,400,{error:'Invalid stage'});safeFlags[k]=v;}
    const safeExtra={};for(const [k,v] of Object.entries(extra)){if(!/^[a-z][a-z0-9_]{0,63}$/.test(k)||!['string','number','boolean'].includes(typeof v))return json(res,400,{error:'Invalid extra column'});safeExtra[k]=String(v).slice(0,500);}
    if(Object.keys(safeFlags).length>40||Object.keys(safeExtra).length>50)return json(res,400,{error:'Too many columns'});
    const changed=await sqlStagePatch(id,safeFlags,safeExtra);
    return json(res,200,{ok:true,changed});
  }
  return json(res,400,{error:'Unknown action'});
 }catch(e){console.error('Sheet sync error',e.message);return json(res,503,{error:'Sheet synchronization unavailable'});}
}
