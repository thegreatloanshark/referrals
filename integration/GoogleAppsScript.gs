/** NoBroker Loans referral reporting, V14.
 * Properties: SPREADSHEET_ID, REFERRAL_API_BASE, SHEET_SYNC_SECRET.
 * Migration is MANUAL: back up the workbook and run migrateReferralDatabaseV14.
 * Existing Qualified history remains in the dated backup. The live working tab is Database.
 * Vertical Heads tab is not overwritten. It is NOT an authorization source.
 */
const FIXED = ['Lead ID','Created At','VH Code','VH Name','Referrer Name','Referrer DSA Code','Referrer Mobile','Referrer Email','Referrer City','Referred Name','Referred Mobile','Referred Email','Referred City','UTM Source','UTM Medium','UTM Campaign','UTM Content','UTM Term','Lead Created','Lead Onboarded','Business Started','Last Updated','Duplicate Label','Original Lead ID','Referral Payout Generated','First File Amount (INR)','Token Fingerprint','Landing URL','Consent'];
const STAGES = {'Lead Created':'lead_created','Lead Onboarded':'onboarded','Business Started':'business_started'};
const EDITABLE_STAGE = new Set(['Lead Onboarded','Business Started']);
const MANAGED = new Set(FIXED);
function prop(k){const v=PropertiesService.getScriptProperties().getProperty(k);if(!v)throw Error('Missing Script Property '+k);return v;}
function spreadsheet(){return SpreadsheetApp.openById(prop('SPREADSHEET_ID'));}
function sheet(){const sh=spreadsheet().getSheetByName('Database');if(!sh)throw Error('Database tab missing. Run migrateReferralDatabaseV14 after backup.');return sh;}
function api(action,payload){const base=prop('REFERRAL_API_BASE').replace(/\/$/,'');if(!/^https:\/\/[-a-z0-9.]+$/i.test(base))throw Error('Bad API base');const r=UrlFetchApp.fetch(base+'/api/internal/sheet-sync',{method:'post',contentType:'application/json',payload:JSON.stringify(Object.assign({action},payload||{})),headers:{'x-sync-secret':prop('SHEET_SYNC_SECRET')},muteHttpExceptions:true});if(r.getResponseCode()<200||r.getResponseCode()>299)throw Error('Referral sync failed: '+r.getResponseCode()+' '+r.getContentText().slice(0,180));return JSON.parse(r.getContentText());}
function headers(sh){const h=sh.getRange(1,1,1,sh.getLastColumn()).getDisplayValues()[0];if(FIXED.some((name,i)=>h[i]!==name))throw Error('Database headers do not match V14. No changes made.');return h;}
function slug(s){return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'').slice(0,64);}
function safeCell(v){const t=String(v==null?'':v);return /^[=+@\-\t\r]/.test(t)?"'"+t:t;}
function baseRow(lead,h){const a=lead.form_answers||{},m={
 'Lead ID':lead.id,'Created At':lead.created_at,'VH Code':lead.dsa_code,'VH Name':lead.vh_name||'',
 'Referrer Name':a.referrerName,'Referrer DSA Code':lead.referrer_dsa_code||a.referrerDsaCode||'',
 'Referrer Mobile':a.referrerMobile,'Referrer Email':a.referrerEmail,'Referrer City':a.referrerCity,
 'Referred Name':a.referredName,'Referred Mobile':a.referredMobile,'Referred Email':a.referredEmail,'Referred City':a.referredCity,
 'UTM Source':lead.utm_source,'UTM Medium':lead.utm_medium,'UTM Campaign':lead.utm_campaign,'UTM Content':lead.utm_content,'UTM Term':lead.utm_term,
 'Lead Created':'Yes','Lead Onboarded':lead.stage_flags?.onboarded?'Yes':'No','Business Started':lead.stage_flags?.business_started?'Yes':'No',
 'Last Updated':lead.updated_at,'Duplicate Label':lead.duplicate_label||'New','Original Lead ID':lead.original_lead_id||'',
 'Referral Payout Generated':lead.referral_payout_generated||'Pending','First File Amount (INR)':lead.first_file_amount==null?'':String(lead.first_file_amount),'Token Fingerprint':lead.token_fingerprint||'','Landing URL':lead.landing_url||'','Consent':a.consent===true?'Yes':'No'
 };return h.map(key=>Object.hasOwn(m,key)?safeCell(m[key]):safeCell(lead.sheet_extra?.[slug(key)]||''));}
function fingerprint(v){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(v)).map(b=>('0'+(b&255).toString(16)).slice(-2)).join('');}
function readSheetEdits(sh,h){const count=sh.getLastRow()-1;if(count<=0)return;const rows=sh.getRange(2,1,count,h.length).getDisplayValues(),props=PropertiesService.getScriptProperties();for(const row of rows){const id=row[0];if(!/^[0-9a-f-]{36}$/i.test(id))continue;const flags={},extra={};for(let i=0;i<h.length;i++){const key=h[i],v=String(row[i]||'').trim();if(!v)continue;if(EDITABLE_STAGE.has(key)){if(/^(yes|no|true|false)$/i.test(v))flags[STAGES[key]]=/^(yes|true)$/i.test(v);else throw Error('Invalid stage value for lead '+id+' / '+key);continue;}if(!MANAGED.has(key))extra[slug(key)]=v.slice(0,500);}
 const raw=String(row[h.indexOf('First File Amount (INR)')]||'').trim().replace(/,/g,'');const data={stageFlags:flags,sheetExtra:extra};if(raw)data.firstFileAmount=raw;
 const hash=fingerprint(data),k='v14stage_'+id;if(props.getProperty(k)===hash)continue;api('update',Object.assign({leadId:id},data));props.setProperty(k,hash);
}}
function writePending(sh,h){const pending=api('pull',{}).rows||[];const n=sh.getLastRow()-1,ids=n>0?sh.getRange(2,1,n,1).getDisplayValues().map(r=>r[0]):[],idx=new Map(ids.map((id,i)=>[id,i+2]));const protectedHeaders=new Set(['Lead Onboarded','Business Started','First File Amount (INR)']);for(const item of pending){const lead=item.lead;if(!lead?.id)continue;const values=baseRow(lead,h);if(idx.has(lead.id)){const row=idx.get(lead.id);for(let c=0;c<h.length;c++){if(!MANAGED.has(h[c])||protectedHeaders.has(h[c]))continue;sh.getRange(row,c+1).setValue(values[c]);}}else{const row=sh.getLastRow()+1;sh.getRange(row,1,1,h.length).setValues([values]);idx.set(lead.id,row);}api('ack',{leadId:lead.id,version:item.version});}}
function syncReferrals(){const lock=LockService.getScriptLock();if(!lock.tryLock(10000))return;try{const sh=sheet(),h=headers(sh);readSheetEdits(sh,h);writePending(sh,h);}finally{lock.releaseLock();}}
function installReferralSync(){ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()==='syncReferrals').forEach(t=>ScriptApp.deleteTrigger(t));ScriptApp.newTrigger('syncReferrals').timeBased().everyMinutes(5).create();syncReferrals();}
/** One-time controlled migration: DOES NOT modify original Sheet1 or Vertical Heads.
 * Confirm full workbook backup separately. If Database already exists, abort.
 * The legacy copy is retained as Sheet1, including Qualified values.
 */
function migrateReferralDatabaseV14(){const ss=spreadsheet();if(ss.getSheetByName('Database'))throw Error('Database already exists: aborting to protect data.');const old=ss.getSheetByName('Sheet1');if(!old)throw Error('Sheet1 missing: no migration performed');const previous=old.getRange(1,1,1,old.getLastColumn()).getDisplayValues()[0];if(previous[0]!=='Lead ID')throw Error('Unexpected source headings: aborting');const dest=old.copyTo(ss);dest.setName('Database');const n=old.getLastRow()-1;const all=n>0?old.getRange(2,1,n,old.getLastColumn()).getValues():[];dest.clearContents();const additional=previous.filter(h=>h&&h!=='Qualified'&&h!=='Qualified (Legacy)'&&h!=='Sheet Extra'&&!FIXED.includes(h)&&h!=='DSA Code');const columns=FIXED.concat(additional);if(dest.getMaxColumns()<columns.length)dest.insertColumnsAfter(dest.getMaxColumns(),columns.length-dest.getMaxColumns());dest.getRange(1,1,1,columns.length).setValues([columns]);const mapped=all.map(row=>columns.map(h=>{const oldName=h==='VH Code'?'DSA Code':h;const c=previous.indexOf(oldName);return c>=0?row[c]:'';}));if(mapped.length)dest.getRange(2,1,mapped.length,columns.length).setValues(mapped);dest.setFrozenRows(1);dest.setTabColor('#D80000');return 'Created Database tab with '+mapped.length+' legacy records. Original Sheet1 retained untouched. Inspect before installing trigger.';}
