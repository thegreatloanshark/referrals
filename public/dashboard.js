import {clerkFetch} from '/clerk-login.js';
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={lead_created:'Lead Created',onboarded:'Lead Onboarded',business_started:'Business Started'};
let leads=[],role='vh',active='overview',token='',shortReferralPath='';
const leadName=l=>l.form_answers?.referredName||l.form_answers?.referred_name||'Unnamed partner';
const stage=l=>l.stage_flags?.business_started?'business_started':l.stage_flags?.onboarded?'onboarded':'lead_created';
function showTab(next){
 active=next;
 if(window.matchMedia('(max-width:780px)').matches){$('vhDashboardShell')?.classList.add('vh-sidebar-closed');const b=$('vhSidebarBackdrop');if(b)b.hidden=true;$('vhToggleSidebar')?.setAttribute('aria-expanded','false');}
 document.querySelectorAll('[data-vh-tab]').forEach(el=>{el.classList.toggle('active',el.closest('.vh-nav')&&el.dataset.vhTab===next);});
 for(const tab of ['overview','referrals','creative','settings'])$('vh-'+tab)?.classList.toggle('active',tab===next);
 if(next==='referrals')renderAll();
}
const referralAnswer=(lead,...keys)=>{for(const key of keys){const value=lead.form_answers?.[key];if(value!==undefined&&value!==null&&value!=='')return value;}return '—';};
const referrerCode=lead=>lead.referrer_dsa_code||referralAnswer(lead,'referrerDsaCode','referrer_dsa_code');
const formatMoney=value=>value===null||value===undefined||value===''?'—':`₹${Number(value).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
function referrerCell(lead){
 const name=referralAnswer(lead,'referrerName','referrer_name');
 const code=referrerCode(lead);
 return `<div class="vh-referrer"><strong>${esc(name)}</strong><small>DSA Code: ${esc(code)}</small><details class="vh-referrer-more"><summary>Contact details</summary><div><span>Mobile: ${esc(referralAnswer(lead,'referrerMobile','referrer_mobile'))}</span><span>Email: ${esc(referralAnswer(lead,'referrerEmail','referrer_email'))}</span><span>City: ${esc(referralAnswer(lead,'referrerCity','referrer_city'))}</span></div></details></div>`;
}
function table(rows){
 const admin=role==='super_admin';
 const head=`<div class="vh-table-scroll"><table class="vh-table"><thead><tr>${admin?'<th>Lead ID</th><th>Created</th>':''}<th>Referred Partner</th><th>Referrer</th>${admin?'<th>VH Code</th>':''}<th>Lead Status</th><th>Duplicate Status</th><th>Referral Payout Status</th>${admin?'<th>First File Band / Grade</th>':''}<th></th></tr></thead><tbody>`;
 const body=rows.map(l=>{
  const st=stage(l);const css={lead_created:'created',onboarded:'onboarded',business_started:'business'}[st];
  const adminPrefix=admin?`<td><strong>${esc(l.id.slice(0,8))}</strong></td><td>${esc(new Date(l.created_at).toLocaleDateString('en-IN'))}</td>`:'';
  const quality=admin?`<td><strong class="vh-quality">${esc(l.first_file_quality?.band||'—')}</strong><small>${esc(l.first_file_quality?.grade?'Grade '+l.first_file_quality.grade:'')}</small></td>`:'';
  return `<tr>${adminPrefix}<td><strong>${esc(leadName(l))}</strong><small>${esc(referralAnswer(l,'referredEmail','referred_email'))}</small></td><td>${referrerCell(l)}</td>${admin?`<td>${esc(l.dsa_code)}</td>`:''}<td><span class="vh-badge ${css}">${esc(labels[st])}</span></td><td><span class="vh-duplicate ${l.duplicate_label==='Duplicate'?'duplicate':l.duplicate_label==='Maybe Duplicate'?'maybe':''}">${esc(l.duplicate_label||'New')}</span></td><td>${esc(l.referral_payout_generated||'Pending')}</td>${quality}<td><button type="button" class="vh-detail-btn" data-lead-id="${esc(l.id)}">Details</button></td></tr>`;
 }).join('');
 return head+(body||`<tr><td colspan="${admin?10:6}" class="vh-empty">No leads yet. Share your referral link to get started.</td></tr>`)+`</tbody></table></div>`;
}
function renderAll(){let q=$('vhSearch')?.value.trim().toLowerCase()||'';let f=$('vhStageFilter')?.value||'all';const filtered=leads.filter(l=>(f==='all'||l.stage_flags?.[f]===true)&&(l.id.toLowerCase().includes(q)||leadName(l).toLowerCase().includes(q)||String(l.dsa_code).toLowerCase().includes(q)||String(l.referrer_dsa_code||l.form_answers?.referrerDsaCode||'').toLowerCase().includes(q)));$('vhAllLeads').innerHTML=table(filtered);}
function render(data){
 role=data.role||'vh';leads=Array.isArray(data.leads)?data.leads:[];
 const counts=data.counts||{};
 $('vhStats').innerHTML=['lead_created','onboarded','business_started'].map(k=>`<div class="vh-stat"><span>${labels[k]}</span><strong>${Number(counts[k]||0).toLocaleString('en-IN')}</strong><small>Verified reporting data</small></div>`).join('');
 $('vhRecent').innerHTML=table(leads.slice(0,5));
 $('vhReferralsHeading').textContent=role==='super_admin'?'All Referrals':'My Referrals';
 $('vhProfileRole').textContent=role==='super_admin'?'Super Admin · All leads':'Vertical Head · Own DSA only';
 renderAll();
}
function showLead(id){
 const l=leads.find(x=>x.id===id);if(!l)return;
 const admin=role==='super_admin';
 const referred=[['Referred Name',referralAnswer(l,'referredName','referred_name')],['Referred Mobile',referralAnswer(l,'referredMobile','referred_mobile')],['Referred Email',referralAnswer(l,'referredEmail','referred_email')],['Referred City',referralAnswer(l,'referredCity','referred_city')]];
 const pairs=admin?[
   ['Lead ID',l.id],['Created',new Date(l.created_at).toLocaleString('en-IN')],['VH Code',l.dsa_code],
   ['Referrer Name',referralAnswer(l,'referrerName','referrer_name')],['Referrer DSA Code',referrerCode(l)],
   ['Referrer Mobile',referralAnswer(l,'referrerMobile','referrer_mobile')],['Referrer Email',referralAnswer(l,'referrerEmail','referrer_email')],['Referrer City',referralAnswer(l,'referrerCity','referrer_city')],
   ...referred,['Lead Status',labels[stage(l)]],['Duplicate Status',l.duplicate_label||'New'],
   ['Referral Payout Generated',l.referral_payout_generated||'Pending'],['Exact First File Amount',formatMoney(l.first_file_amount)],
   ['First File Business Band',l.first_file_quality?.band||'—'],['First File Grade',l.first_file_quality?.grade||'—'],
   ...Object.entries(l.form_answers||{}).filter(([k])=>!['referrerName','referrer_name','referrerDsaCode','referrer_dsa_code','referrerMobile','referrer_mobile','referrerEmail','referrer_email','referrerCity','referrer_city','referredName','referred_name','referredMobile','referred_mobile','referredEmail','referred_email','referredCity','referred_city'].includes(k)).map(([k,v])=>[k.replace(/([A-Z])/g,' $1'),typeof v==='object'?JSON.stringify(v):String(v)])
 ]:[['Lead ID',l.id],...referred,['Exact First File Amount',formatMoney(l.first_file_amount)]];
 $('vhLeadDetails').innerHTML=pairs.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');$('vhLeadBackdrop').hidden=false;
}
function install(){if(window.__vhDashboardInstalled)return;window.__vhDashboardInstalled=true;
 document.addEventListener('click',e=>{const tab=e.target.closest('[data-vh-tab]');if(tab){showTab(tab.dataset.vhTab);return;}const lead=e.target.closest('[data-lead-id]');if(lead)showLead(lead.dataset.leadId);});
 $('vhSearch').addEventListener('input',renderAll);$('vhStageFilter').addEventListener('change',renderAll);
 $('vhCloseDrawer').addEventListener('click',()=>$('vhLeadBackdrop').hidden=true);$('vhLeadBackdrop').addEventListener('click',e=>{if(e.target===$('vhLeadBackdrop'))$('vhLeadBackdrop').hidden=true;});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')$('vhLeadBackdrop').hidden=true;});
 const heroCopy=$('vhHeroCopyLink');if(heroCopy)heroCopy.addEventListener('click',()=> $('vhCopyLink').click());
 const shell=$('vhDashboardShell'),toggle=$('vhToggleSidebar'),backdrop=$('vhSidebarBackdrop');
 const mobile=()=>window.matchMedia('(max-width:780px)').matches;
 const setSidebar=(closed,save)=>{shell.classList.toggle('vh-sidebar-closed',closed);toggle.setAttribute('aria-expanded',String(!closed));backdrop.hidden=closed||!mobile();if(save&&!mobile()){try{localStorage.setItem('nbl_vh_sidebar_closed',closed?'1':'0')}catch{}}};
 const remember=()=>{let closed=false;try{closed=localStorage.getItem('nbl_vh_sidebar_closed')==='1'}catch{}setSidebar(mobile()?true:closed,false)};
 remember();window.addEventListener('resize',remember);
 toggle.addEventListener('click',()=>setSidebar(!shell.classList.contains('vh-sidebar-closed'),true));
 $('vhCloseSidebar').addEventListener('click',()=>setSidebar(true,false));
 backdrop.addEventListener('click',()=>setSidebar(true,false));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&mobile())setSidebar(true,false)});
 $('vhCopyLink').addEventListener('click',async()=>{if(!token)return;await navigator.clipboard.writeText(shortReferralPath?`${location.origin}${shortReferralPath}`:`${location.origin}/form?ref=${encodeURIComponent(token)}`);$('vhCopyLink').textContent='Copied!';});
 $('vhExport').addEventListener('click',()=>{
  const admin=role==='super_admin';
  const fields=['Lead ID','Created At','VH Code','Referrer DSA Code','Referred Name','Referred Email','Lead Status','Duplicate Status','Referral Payout Generated','Exact First File Amount',...(admin?['First File Band','First File Grade']:[])];
  const data=leads.map(l=>[l.id,l.created_at,l.dsa_code,referrerCode(l),leadName(l),referralAnswer(l,'referredEmail','referred_email'),labels[stage(l)],l.duplicate_label||'New',l.referral_payout_generated||'Pending',l.first_file_amount??'',...(admin?[l.first_file_quality?.band||'',l.first_file_quality?.grade||'']:[])]);
  const csv=[fields,...data].map(row=>row.map(x=>'"'+String(x??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='NoBroker-Loans-Referrals.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);
 });
 $('vhSignOut').addEventListener('click',()=>window.Clerk?.signOut().then(()=>location.assign('/vh-only')));
}
export async function loadReferralDashboard(profile,referralToken,shortPath){
 install();token=referralToken||'';shortReferralPath=shortPath||'';
 $('vhDashboardShell').hidden=false;document.body.classList.add('vh-active');
 $('vhGreeting').textContent=`Welcome back, ${profile.name||'Vertical Head'}`;
 $('vhCode').textContent=profile.dsaCode||'—';
 $('vhProfileName').textContent=profile.name||'—';$('vhProfileDesignation').textContent=profile.designation||'Vertical Head';$('vhProfileCode').textContent=profile.dsaCode||'—';
 $('vhReferralLink').textContent=token?shortReferralPath?`${location.origin}${shortReferralPath}`:`${location.origin}/form?ref=${encodeURIComponent(token)}`:'Link not available';
 $('vhDashboardNotice').hidden=true;
 showTab('overview');
 try{const r=await clerkFetch('/api/dashboard');const data=await r.json();if(!r.ok)throw Error(data.error||'Unable to load referrals');render(data);}
 catch(e){$('vhDashboardNotice').textContent='Could not load referral data. '+(e.message||'Please refresh and try again.');$('vhDashboardNotice').hidden=false;}
}

// The artwork remains rendered by app.js; this avoids generating any new
// brand assets or QR data from untrusted frontend fields.
export function mirrorFlyerPreview(){const source=document.getElementById('flyer'),target=document.getElementById('vhHeroPreview');if(!source||!target)return;const c=target.getContext('2d');c.clearRect(0,0,target.width,target.height);c.drawImage(source,0,0,target.width,target.height);}
