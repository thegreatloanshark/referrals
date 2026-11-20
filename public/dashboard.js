import {clerkFetch} from '/clerk-login.js';
const escapeHTML = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const titleCase = k => k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
export async function loadReferralDashboard(){
 const area=document.getElementById('referralDashboard');if(!area)return;
 area.hidden=false;area.textContent='Loading your referrals…';
 try{
  const response=await clerkFetch('/api/dashboard');
  const data=await response.json();if(!response.ok)throw Error(data.error||'Unable to load referrals');
  const counts=data.counts||{};
  const cards=[['Leads Created',counts.lead_created||0],...Object.entries(counts).filter(([k])=>k!=='lead_created').map(([k,v])=>[titleCase(k),v])];
  const rows=(data.leads||[]).map(l=>`<tr><td>${escapeHTML(l.id.slice(0,8))}</td><td>${escapeHTML(new Date(l.created_at).toLocaleDateString('en-IN'))}</td><td>${escapeHTML(l.form_answers?.referredName||'')}</td>${data.role==='super_admin'?`<td>${escapeHTML(l.dsa_code)}</td>`:''}<td>${escapeHTML(Object.entries(l.stage_flags||{}).filter(([k,v])=>v===true).map(([k])=>titleCase(k)).join(', '))}</td></tr>`).join('');
  area.innerHTML=`<div class="editor-top"><h2>My Referrals</h2><p>${data.role==='super_admin'?'All submitted leads':'Leads attributed to your DSA code'}</p></div><div class="summary-grid">${cards.map(([k,v])=>`<div class="summary-card"><span>${escapeHTML(k)}</span><strong>${v}</strong></div>`).join('')}</div><div class="table-wrap"><table class="referral-table"><thead><tr><th>Lead ID</th><th>Date</th><th>Referred Partner</th>${data.role==='super_admin'?'<th>DSA Code</th>':''}<th>Status</th></tr></thead><tbody>${rows||`<tr><td colspan="5">No leads yet.</td></tr>`}</tbody></table></div>`;
 }catch(e){area.textContent=e.message||'Could not load referrals.';}
}
