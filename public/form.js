const form=document.getElementById('referralForm'),message=document.getElementById('formMessage');
const shell=document.getElementById('formShell'),linkError=document.getElementById('linkError');
const deny=()=>{shell.hidden=true;form.hidden=true;linkError.hidden=false;};
const token=new URL(location.href).searchParams.get('ref')||'';
(async()=>{
 if(!token){deny();return;}
 try{const response=await fetch('/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});if(!response.ok)throw Error('Invalid link');shell.hidden=false;form.hidden=false;message.textContent='Enter the details below to continue.';}catch{deny();}
})();
form.addEventListener('submit',async e=>{
 e.preventDefault();if(!form.reportValidity())return;
 const button=form.querySelector('button[type=submit]');button.disabled=true;message.textContent='Submitting your referral…';
 try{
  const values=Object.fromEntries(new FormData(form));
  const response=await fetch('/api/lead-create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...values,ref:token,consent:form.elements.consent.checked})});
  const data=await response.json();if(!response.ok)throw Error(data.error||'Submission failed');
  form.hidden=true;message.textContent=`Referral submitted successfully. Reference: ${data.leadId}`;
 }catch(err){message.textContent=err.message||'Could not submit. Please try again.';button.disabled=false;}
});
