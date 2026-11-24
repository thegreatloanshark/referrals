/** NoBroker Loans referral sync (V15). The LIVE Database sheet schema is authoritative.
 * Do not run legacy V14 migration against the live workbook.
 * Run syncReferrals only after deploying matching V15 API + Supabase migration.
 */
const FIXED = ['Lead ID','VH Code','VH Name','Referrer Name','Referrer DSA Code','Referrer Mobile','Referrer Email','Referrer City','Referred Name','Referred Mobile','Referred Email','Referred City','Lead Status','First File Amount (INR)','First File Status','Referral Payout Generated','Last Updated','Total Timeline','Duplicate Label','Original Lead ID','Created At','Token Fingerprint','Landing URL','Consent','UTM Source','UTM Medium','UTM Campaign','UTM Content','UTM Term'];
const STAGES=['Lead Created','Lead Onboarded','Business Started'];
const FILE_STATUSES=['File Disbursed','Paid on FastPay'];
function prop(k){const v=PropertiesService.getScriptProperties().getProperty(k);if(!v)throw Error('Missing Script Property '+k);return v;}
function spreadsheet(){return SpreadsheetApp.openById(prop('SPREADSHEET_ID'));}
function sheet(){const sh=spreadsheet().getSheetByName('Database');if(!sh)throw Error('Database tab missing');return sh;}
function api(action,payload){const base=prop('REFERRAL_API_BASE').replace(/\/$/,'');if(!/^https:\/\/[-a-z0-9.]+$/i.test(base))throw Error('Bad API base');const r=UrlFetchApp.fetch(base+'/api/internal/sheet-sync',{method:'post',contentType:'application/json',payload:JSON.stringify(Object.assign({action},payload||{})),headers:{'x-sync-secret':prop('SHEET_SYNC_SECRET')},muteHttpExceptions:true});if(r.getResponseCode()<200||r.getResponseCode()>299)throw Error('Referral sync failed: '+r.getResponseCode()+' '+r.getContentText().slice(0,180));return JSON.parse(r.getContentText());}
function headers(sh){const h=sh.getRange(1,1,1,FIXED.length).getDisplayValues()[0];if(FIXED.some((name,i)=>h[i]!==name))throw Error('Database headers do not match approved V15 schema. No changes made.');return h;}
function safeCell(v){const t=String(v==null?'':v);return /^[=+@\-\t\r]/.test(t)?"'"+t:t;}
function leadStatus(lead){return lead.stage_flags?.business_started?'Business Started':lead.stage_flags?.onboarded?'Lead Onboarded':'Lead Created';}
function baseRow(lead,h){const a=lead.form_answers||{};const payout=lead.referral_payout_generated||'';const fileStatus=lead.sheet_extra?.first_file_status||'';const start=Date.parse(lead.created_at||'');const end=Date.parse(lead.referral_payout_generated_at||'');const days=Number.isFinite(start)&&Number.isFinite(end)&&payout==='Yes'?Math.max(0,Math.floor((end-start)/86400000)):'';const m={
 'Lead ID':lead.id,'VH Code':lead.dsa_code,'VH Name':lead.vh_name||'',
 'Referrer Name':a.referrerName,'Referrer DSA Code':lead.referrer_dsa_code||a.referrerDsaCode||'',
 'Referrer Mobile':a.referrerMobile,'Referrer Email':a.referrerEmail,'Referrer City':a.referrerCity,
 'Referred Name':a.referredName,'Referred Mobile':a.referredMobile,'Referred Email':a.referredEmail,'Referred City':a.referredCity,
 'Lead Status':leadStatus(lead),'First File Amount (INR)':lead.first_file_amount==null?'':String(lead.first_file_amount),
 'First File Status':fileStatus,'Referral Payout Generated':payout==='Yes'?'Yes':payout==='No'?'No':'',
 'Last Updated':lead.updated_at,'Total Timeline':days,'Duplicate Label':lead.duplicate_label||'New',
 'Original Lead ID':lead.original_lead_id||'','Created At':lead.created_at,'Token Fingerprint':lead.token_fingerprint||'',
 'Landing URL':lead.landing_url||'','Consent':a.consent===true?'Yes':'No',
 'UTM Source':lead.utm_source,'UTM Medium':lead.utm_medium,'UTM Campaign':lead.utm_campaign,'UTM Content':lead.utm_content,'UTM Term':lead.utm_term
 };return h.map(key=>safeCell(m[key]));}
function fingerprint(v){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(v)).map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');}
function readSheetEdits(sh,h){
 const n=sh.getLastRow()-1;if(n<=0)return;const rows=sh.getRange(2,1,n,h.length).getDisplayValues();
 const props=PropertiesService.getScriptProperties();const col=Object.fromEntries(h.map((k,i)=>[k,i]));
 for(const row of rows){const id=row[col['Lead ID']];if(!/^[0-9a-f-]{36}$/i.test(id))continue;
  const status=row[col['Lead Status']].trim(),firstStatus=row[col['First File Status']].trim(),payout=row[col['Referral Payout Generated']].trim();
  if(status&&!STAGES.includes(status))throw Error('Invalid Lead Status for '+id);
  if(firstStatus&&!FILE_STATUSES.includes(firstStatus))throw Error('Invalid First File Status for '+id);
  if(payout&&!['Yes','No'].includes(payout))throw Error('Invalid Referral Payout Generated for '+id);
  const amount=row[col['First File Amount (INR)']].trim().replace(/,/g,'');
  const data={};if(status)data.leadStatus=status;if(firstStatus)data.firstFileStatus=firstStatus;
  if(payout)data.referralPayoutGenerated=payout;
  if(amount)data.firstFileAmount=amount;
  const hash=fingerprint(data),k='v15entry_'+id;if(props.getProperty(k)===hash)continue;
  api('update',Object.assign({leadId:id},data));props.setProperty(k,hash);
 }
}
function writePending(sh,h){
 const pending=api('pull',{}).rows||[],n=sh.getLastRow()-1;
 const ids=n>0?sh.getRange(2,1,n,1).getDisplayValues().map(x=>x[0]):[],idx=new Map(ids.map((id,i)=>[id,i+2]));
 // Do not overwrite operator-owned fields on existing rows. Their Sheet values remain authoritative.
 const editable=new Set(['Lead Status','First File Amount (INR)','First File Status','Referral Payout Generated']);
 for(const item of pending){const lead=item.lead;if(!lead?.id)continue;const values=baseRow(lead,h);
  if(idx.has(lead.id)){const row=idx.get(lead.id);for(let c=0;c<h.length;c++){if(editable.has(h[c]))continue;sh.getRange(row,c+1).setValue(values[c]);}}
  else{const row=sh.getLastRow()+1;sh.getRange(row,1,1,h.length).setValues([values]);idx.set(lead.id,row);}
  api('ack',{leadId:lead.id,version:item.version});
 }
}
function syncReferrals(){const lock=LockService.getScriptLock();if(!lock.tryLock(10000))return;try{const sh=sheet(),h=headers(sh);readSheetEdits(sh,h);writePending(sh,h);}finally{lock.releaseLock();}}
function installReferralSync(){ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='syncReferrals').forEach(t=>ScriptApp.deleteTrigger(t));ScriptApp.newTrigger('syncReferrals').timeBased().everyMinutes(5).create();syncReferrals();}

// The live Database worksheet is already migrated. No schema-altering action is provided here.

// V16: independent directory trigger; existing lead sync stays unchanged.
const VH_HEADERS=['Name','Number','Email','DSA Code','Live Status','Access Role'];
function directoryRows(sh){
 const h=sh.getRange(1,1,1,6).getDisplayValues()[0];
 if(VH_HEADERS.some((v,i)=>h[i]!==v))throw Error('Vertical Heads headers do not match A:F.');
 const n=sh.getLastRow()-1;if(n<1||n>500)throw Error('Invalid directory range');
 return sh.getRange(2,1,n,6).getDisplayValues();
}
function syncVerticalHeads(){
 const lock=LockService.getScriptLock();if(!lock.tryLock(10000))return;
 try{
  const sh=spreadsheet().getSheetByName('Vertical Heads');if(!sh)throw Error('Vertical Heads tab missing');
  const before=directoryRows(sh);const rows=before.filter(r=>[r[0],r[1],r[2],r[3],r[5]].some(x=>x.trim())).map(r=>({name:r[0],mobile:r[1],email:r[2],dsaCode:r[3],role:r[5]}));
  const result=api('directory_sync',{rows});if(!result.ok||result.statuses.length!==rows.length)throw Error('Incomplete directory response');
  const statuses=new Map(result.statuses.map(r=>[r.dsaCode,r]));
  // Do not write statuses into changed/reordered rows while the request was in flight.
  const current=directoryRows(sh);const identity=r=>JSON.stringify([r[0],r[1],r[2],r[3],r[5]]);
  if(current.length!==before.length||current.some((r,i)=>identity(r)!==identity(before[i])))throw Error('Directory edited during sync. Retry.');
  const values=current.map(r=>{const v=statuses.get(r[3].trim());return [v&&v.email===r[2].trim().toLowerCase()?v.status:''];});
  sh.getRange(2,5,values.length,1).setValues(values);
 }finally{lock.releaseLock();}
}
function installVerticalHeadSync(){
 syncVerticalHeads();
 ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='syncVerticalHeads').forEach(t=>ScriptApp.deleteTrigger(t));
 ScriptApp.newTrigger('syncVerticalHeads').timeBased().everyMinutes(5).create();
}
