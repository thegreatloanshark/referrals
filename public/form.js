// Local city suggestions are optional; typed cities are accepted without changing backend fields.
const cityOptions=["Agartala", "Agra", "Ahmedabad", "Ahmednagar", "Aizawl", "Ajmer", "Aligarh", "Alappuzha", "Allahabad", "Amravati", "Amritsar", "Anantapur", "Aurangabad", "Ayodhya", "Ballari", "Bareilly", "Bathinda", "Belagavi", "Bengaluru", "Berhampur", "Bhagalpur", "Bharatpur", "Bhavnagar", "Bhilai", "Bhilwara", "Bhopal", "Bhubaneswar", "Bidar", "Bikaner", "Bilaspur", "Bokaro", "Chandigarh", "Chennai", "Coimbatore", "Cuttack", "Davanagere", "Dehradun", "Delhi", "Dhanbad", "Dharamshala", "Dharwad", "Dibrugarh", "Durgapur", "Erode", "Faridabad", "Firozabad", "Gandhinagar", "Gangtok", "Gaya", "Ghaziabad", "Gorakhpur", "Guntur", "Gurugram", "Guwahati", "Gwalior", "Haldwani", "Haridwar", "Hassan", "Hubballi", "Hyderabad", "Imphal", "Indore", "Jabalpur", "Jaipur", "Jalandhar", "Jalgaon", "Jammu", "Jamnagar", "Jamshedpur", "Jhansi", "Jodhpur", "Kalaburagi", "Kalyan", "Kanpur", "Karimnagar", "Karnal", "Kochi", "Kohima", "Kolhapur", "Kolkata", "Kollam", "Kota", "Kozhikode", "Kurnool", "Latur", "Lucknow", "Ludhiana", "Madurai", "Mangaluru", "Mathura", "Meerut", "Mohali", "Moradabad", "Mumbai", "Muzaffarpur", "Mysuru", "Nagpur", "Nanded", "Nashik", "Navi Mumbai", "Nellore", "Noida", "Palakkad", "Panaji", "Patiala", "Patna", "Pondicherry", "Prayagraj", "Pune", "Raichur", "Raipur", "Rajahmundry", "Rajkot", "Ranchi", "Rohtak", "Rourkela", "Salem", "Sangli", "Satara", "Shillong", "Shimla", "Shivamogga", "Silchar", "Siliguri", "Solapur", "Sonipat", "Srinagar", "Surat", "Thane", "Thanjavur", "Thiruvananthapuram", "Thrissur", "Tiruchirappalli", "Tirunelveli", "Tirupati", "Tumakuru", "Udaipur", "Udupi", "Ujjain", "Vadodara", "Varanasi", "Vasai-Virar", "Vellore", "Vijayawada", "Visakhapatnam", "Warangal", "Yamunanagar"];
const cityList=document.getElementById('indiaCityOptions');
if(cityList)for(const city of cityOptions){const option=document.createElement('option');option.value=city;cityList.append(option);}
const form=document.getElementById('referralForm'),message=document.getElementById('formMessage');
const shell=document.getElementById('formShell'),linkError=document.getElementById('linkError');
const deny=()=>{shell.hidden=true;form.hidden=true;linkError.hidden=false;};
const token=new URL(location.href).searchParams.get('ref')||'';
(async()=>{
 if(!token){deny();return;}
 try{const response=await fetch('/api/verify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token})});if(!response.ok)throw Error('Invalid link');shell.hidden=false;form.hidden=false;message.textContent='Enter the details below to continue.';}catch{deny();}
})();
form.addEventListener('submit',async e=>{
 e.preventDefault();const consentError=document.getElementById('consentError');if(!form.elements.consent.checked){consentError.hidden=false;form.elements.consent.focus();return;}consentError.hidden=true;if(!form.reportValidity())return;
 const button=form.querySelector('button[type=submit]');button.disabled=true;message.textContent='Submitting your referral…';
 try{
  const values=Object.fromEntries(new FormData(form));
  const response=await fetch('/api/lead-create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...values,ref:token,consent:form.elements.consent.checked})});
  const data=await response.json();if(!response.ok)throw Error(data.error||'Submission failed');
  form.hidden=true;message.textContent='Thank you for your referral.';document.getElementById('submittedLeadId').textContent=data.leadId||'Recorded';document.getElementById('formSuccess').hidden=false;
 }catch(err){message.textContent=err.message||'Could not submit. Please try again.';button.disabled=false;}
});

// Repeat submissions use the same validated referral token, but a fresh lead record.
document.getElementById('referAnother').addEventListener('click',()=>{document.getElementById('formSuccess').hidden=true;form.reset();document.getElementById('consentError').hidden=true;form.hidden=false;form.querySelector('button[type=submit]').disabled=false;message.textContent='Enter the next Loan Partner’s details below.';form.scrollIntoView({behavior:'smooth',block:'start'});});

form.elements.consent.addEventListener('change',()=>{if(form.elements.consent.checked)document.getElementById('consentError').hidden=true;});
