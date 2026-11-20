/** NoBroker Loans referral reporting mirror.
 * Deploy as a time-driven Apps Script under an account authorized to edit the Sheet.
 * Script Properties (never hardcode):
 *   REFERRAL_API_BASE = https://nbloans-referrals.vercel.app
 *   SHEET_SYNC_SECRET = same long random secret as Vercel
 *   SPREADSHEET_ID = 1yDQR7YRp5ehGxUyyla34CVLyeArsMXjZ4H7PWzc_Kbg
 * This script cannot bypass Workspace permissions.
 */
const FIXED = ['Lead ID','Created At','DSA Code','VH Name','Referrer Name','Referrer Mobile','Referrer Email','Referrer City','Referred Name','Referred Mobile','Referred Email','UTM Source','UTM Medium','UTM Campaign','UTM Content','UTM Term','Lead Created','Qualified','Onboarded','Business Started','Last Updated'];
const NON_STAGE = new Set(FIXED.slice(0,16).concat(['Last Updated']));
const STAGES = {'Lead Created':'lead_created','Qualified':'qualified','Onboarded':'onboarded','Business Started':'business_started'};
function prop(name){const value=PropertiesService.getScriptProperties().getProperty(name);if(!value)throw new Error('Set Script Property: '+name);return value;}
function api(action,payload){
 const base=prop('REFERRAL_API_BASE').replace(/\/$/,'');
 if(!/^https:\/\/[-a-z0-9.]+$/i.test(base))throw new Error('Invalid API base');
 const response=UrlFetchApp.fetch(base+'/api/internal/sheet-sync',{
   method:'post',contentType:'application/json',payload:JSON.stringify(Object.assign({action},payload||{})),
   headers:{'x-sync-secret':prop('SHEET_SYNC_SECRET')},muteHttpExceptions:true
 });
 const status=response.getResponseCode();
 if(status<200||status>=300)throw new Error('Referral sync API error ('+status+'): '+response.getContentText().slice(0,160));
 return JSON.parse(response.getContentText());
}
function slug(s){return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,64);}
function safeCell(v){const s=String(v==null?'':v);return /^[=+@\-\t\r]/.test(s)?"'"+s:s;}
function sheet(){const ss=SpreadsheetApp.openById(prop('SPREADSHEET_ID'));return ss.getSheetByName('Sheet1')||ss.getSheets()[0];}
function ensureHeaders(sh){const current=sh.getRange(1,1,1,Math.max(sh.getLastColumn(),FIXED.length)).getDisplayValues()[0];
 if(current[0]&&current[0]!=='Lead ID')throw new Error('First Sheet column must be Lead ID; sheet left unchanged');
 FIXED.forEach((name,i)=>{if(!current[i])sh.getRange(1,i+1).setValue(name);else if(current[i]!==name)throw new Error('Fixed header changed: '+name);});
 sh.setFrozenRows(1);
 return sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];
}
function baseRow(lead,headers){const a=lead.form_answers||{};const map={
 'Lead ID':lead.id,'Created At':lead.created_at,'DSA Code':lead.dsa_code,'VH Name':lead.vh_name||'',
 'Referrer Name':a.referrerName,'Referrer Mobile':a.referrerMobile,'Referrer Email':a.referrerEmail,'Referrer City':a.referrerCity,
 'Referred Name':a.referredName,'Referred Mobile':a.referredMobile,'Referred Email':a.referredEmail,
 'UTM Source':lead.utm_source,'UTM Medium':lead.utm_medium,'UTM Campaign':lead.utm_campaign,
 'UTM Content':lead.utm_content,'UTM Term':lead.utm_term,'Lead Created':'Yes','Last Updated':lead.updated_at
 };
 return headers.map(h=>Object.hasOwn(map,h)?safeCell(map[h]):(lead.stage_flags&&Object.hasOwn(lead.stage_flags,STAGES[h]||slug(h)) ? (lead.stage_flags[STAGES[h]||slug(h)]?'Yes':'No') : safeCell(lead.sheet_extra?.[slug(h)]||'')));
}
function fingerprint(value){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(value)).map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');}
function readSheetEdits(sh,headers){
 const n=sh.getLastRow()-1;if(n<=0)return;
 const rows=sh.getRange(2,1,n,headers.length).getDisplayValues();const props=PropertiesService.getScriptProperties();
 for(const row of rows){const id=row[0];if(!/^[0-9a-f-]{36}$/i.test(id))continue;
   const flags={},extra={};
   headers.forEach((h,i)=>{if(!h||NON_STAGE.has(h)||h==='Lead Created')return;
     const raw=String(row[i]||'').trim();if(!raw)return;
     const key=STAGES[h]||slug(h);if(!key)return;
     if(/^(yes|no|true|false)$/i.test(raw))flags[key]=/^(yes|true)$/i.test(raw);
     else if(!['Qualified','Onboarded','Business Started'].includes(h))extra[key]=raw.slice(0,500);
   });
   const data={stageFlags:flags,sheetExtra:extra};const hash=fingerprint(data);
   const propertyKey='stage_'+id; if(props.getProperty(propertyKey)===hash)continue;
   api('update',{leadId:id,...data});props.setProperty(propertyKey,hash);
 }
}
function writePending(sh,headers){
 const pending=api('pull',{}).rows||[];if(!pending.length)return;
 const n=sh.getLastRow()-1;
 const ids=n>0?sh.getRange(2,1,n,1).getDisplayValues().map(r=>r[0]):[];
 const index=new Map(ids.map((id,i)=>[id,i+2]));
 for(const item of pending){const lead=item.lead;if(!lead?.id)continue;
  const values=baseRow(lead,headers);
  if(index.has(lead.id)){
   const row=index.get(lead.id);
   // Update system-owned columns only: never overwrite human-edited stages or extras.
   sh.getRange(row,1,1,16).setValues([values.slice(0,16)]);
   sh.getRange(row,17).setValue('Yes');
   sh.getRange(row,21).setValue(values[20]);
  }else{
   const row=sh.getLastRow()+1;sh.getRange(row,1,1,headers.length).setValues([values]);index.set(lead.id,row);
  }
  // Ack only after Sheet accepted row; exact version prevents lost concurrent updates.
  api('ack',{leadId:lead.id,version:item.version});
 }
}
function syncReferrals(){const lock=LockService.getScriptLock();if(!lock.tryLock(10000))return;
 try{const sh=sheet(),headers=ensureHeaders(sh);readSheetEdits(sh,headers);writePending(sh,headers);}
 finally{lock.releaseLock();}
}
// Run once manually (from your account) to set up a 5-minute periodic sync.
function installReferralSync(){
 ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='syncReferrals').forEach(t=>ScriptApp.deleteTrigger(t));
 ScriptApp.newTrigger('syncReferrals').timeBased().everyMinutes(5).create();
 syncReferrals();
}
