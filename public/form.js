const form=document.getElementById('referralForm'),message=document.getElementById('formMessage');
const incoming=new URL(location.href);const token=incoming.searchParams.get('ref')||'';
let config=null;
(async()=>{
 if(!token){message.textContent='A valid referral link is required.';return;}
 try{const response=await fetch('/api/referral-config',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});const result=await response.json();if(!response.ok)throw Error('This referral link is invalid or has expired.');config=result;message.textContent='Enter the details below to continue.';form.hidden=false;}catch(e){message.textContent=e.message}
})();
form.addEventListener('submit',event=>{
 event.preventDefault();if(!form.reportValidity())return;
 if(!config?.configured){message.textContent='Referral submission is not configured yet. Please contact the campaign team.';return;}
 const target=new URL(config.formUrl);if(!/^https:\/\/(docs\.google\.com|forms\.gle)\//.test(target.href)){message.textContent='Invalid submission destination configuration.';return;}
 const values=Object.fromEntries(new FormData(form));values.consent=form.elements.consent.checked?'Yes':'No';
 const attr=config.attribution;
 Object.assign(values,{dsaCode:attr.code,utm_source:attr.utm_source,utm_medium:attr.utm_medium,utm_campaign:attr.utm_campaign,utm_content:attr.utm_content});
 // No client-editable attribution. The token is validated server-side, and fields are taken from that verified payload.
 for(const [key,id] of Object.entries(config.fields)){target.searchParams.set(id,values[key]||'')}
 target.searchParams.set('usp','pp_url');window.location.assign(target.toString());
});
