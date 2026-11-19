(function(){
  const config=window.REFERRAL_CONFIG||{heads:{},defaultFormUrl:""};
  const params=new URLSearchParams(window.location.search);
  const vh=(params.get('vh')||'').trim().toLowerCase();
  const head=(config.heads||{})[vh];
  const formButton=document.getElementById('formButton');
  const formHelp=document.getElementById('formHelp');
  const formIntro=document.getElementById('formIntro');
  const referrerLine=document.getElementById('referrerLine');
  const url=(head&&head.formUrl)||(!vh?config.defaultFormUrl:'')||'';
  if(head&&head.name){referrerLine.hidden=false;referrerLine.textContent='Shared by '+head.name;formIntro.textContent='Continue to the referral form shared by '+head.name+'.';}
  if(url){try{const u=new URL(url);if(u.protocol==='https:'){formButton.href=url;formButton.removeAttribute('aria-disabled');formHelp.textContent='You will be redirected to the official referral form.';}}catch(_){}}
  formButton.addEventListener('click',function(e){if(formButton.getAttribute('aria-disabled')==='true')e.preventDefault();});
  document.getElementById('copyButton').addEventListener('click',async function(){
    try{await navigator.clipboard.writeText(window.location.href);this.textContent='Link copied ✓';setTimeout(()=>{this.textContent='Copy this referral page link ⧉';},2000)}
    catch(_){this.textContent='Copy the URL from your browser';}
  });
})();
