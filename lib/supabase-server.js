// Only import from Vercel serverless functions. Never bundle this file to /public.
const url = () => {
  const u = process.env.SUPABASE_URL || 'https://evsmmzkgyuxajoqvdnnj.supabase.co';
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(u)) throw Error('Invalid Supabase URL');
  return u;
};
const key = () => {
  const k = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!k) throw Error('SUPABASE_SECRET_KEY is not configured');
  return k;
};
export async function db(table, { method='GET', filter='', body, prefer='return=representation' }={}) {
  if (!['referral_leads','referral_sync_jobs','referral_vh_access','referral_sheet_columns'].includes(table)) throw Error('Invalid table');
  const response = await fetch(`${url()}/rest/v1/${table}${filter?`?${filter}`:''}`, {
    method,
    headers:{apikey:key(),...(key().startsWith('eyJ')?{Authorization:`Bearer ${key()}`}:{ }),'Content-Type':'application/json',Prefer:prefer},
    body:body===undefined?undefined:JSON.stringify(body)
  });
  const text=await response.text();
  if (!response.ok) {console.error('Supabase REST error',table,response.status,text.slice(0,300));throw Error(`Database request failed (${response.status})`);}
  return text?JSON.parse(text):null;
}
export async function sqlStagePatch(id, stageFlags, sheetExtra, firstFileAmount){
  const old=(await db('referral_leads',{filter:`id=eq.${encodeURIComponent(id)}&select=id,stage_flags,sheet_extra&limit=1`}))?.[0];
  if(!old)return false;
  const changes={};
  if(stageFlags && typeof stageFlags==='object')changes.stage_flags={...old.stage_flags,...stageFlags,lead_created:true};
  if(sheetExtra && typeof sheetExtra==='object')changes.sheet_extra={...old.sheet_extra,...sheetExtra};
  if(firstFileAmount!==undefined)changes.first_file_amount=firstFileAmount;
  if(!Object.keys(changes).length || (JSON.stringify(changes.stage_flags??old.stage_flags)===JSON.stringify(old.stage_flags) && JSON.stringify(changes.sheet_extra??old.sheet_extra)===JSON.stringify(old.sheet_extra) && firstFileAmount===undefined))return false;
  await db('referral_leads',{method:'PATCH',filter:`id=eq.${encodeURIComponent(id)}`,body:changes,prefer:'return=minimal'});
  return true;
}
export async function syncDirectorySnapshot(rows){
 const k=key();const response=await fetch(`${url()}/rest/v1/rpc/referral_replace_vh_directory`,{method:'POST',headers:{apikey:k,...(k.startsWith('eyJ')?{Authorization:`Bearer ${k}`}:{ }),'Content-Type':'application/json'},body:JSON.stringify({snapshot:rows})});
 if(!response.ok)throw Error(`Directory database synchronization failed (${response.status})`);
 return response.json();
}
