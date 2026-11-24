import {renderCreative,isPhotoFree,DESIGNATIONS,HEADLINES,CALLOUTS,DEFAULT_CALLOUT_INDEX,DESCRIPTION,CONTACT_LINE} from "/creative-templates.js";
import {loadReferralDashboard,mirrorFlyerPreview} from "/dashboard.js";
import {initializeClerk,clerkFetch} from "/clerk-login.js";
const CTAS=['Refer Now','Share Your Referral','Start Referring','Refer & Earn','Scan to Refer'];
const $=id=>document.getElementById(id);const canvas=$('flyer'),c=canvas.getContext('2d');
const W=1200,H=1500,RED='#D80000',INK='#181818',SOFT='#FFF1F2',GOLD='#FFD700';
let selected=null,token='',shortReferralPath='',photo=null,qr=null,logo=null;
for(const [id,items] of [['headline',HEADLINES],['callout',CALLOUTS],['cta',CTAS]]){$(id).innerHTML=items.map((t,i)=>`<option value="${i}">${t.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</option>`).join('')}
$('callout').selectedIndex=DEFAULT_CALLOUT_INDEX;
$('lockedDescription').textContent=DESCRIPTION+' '+CONTACT_LINE;
const getImage=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src});
async function fetchLogo(){try{logo=await getImage('/assets/nbl-logo.png')}catch{logo=null}}
function text(t,x,y,size=40,color=INK,weight=700,maxWidth=950,align='left'){c.fillStyle=color;c.textAlign=align;c.font=`${weight} ${size}px Arimo, Arial, sans-serif`;c.fillText(String(t),x,y,maxWidth)}
function rounded(x,y,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()}
function qrCode(x,y,size=350){rounded(x-10,y-10,size+20,size+20,5,'#FFF');if(qr){c.save();c.imageSmoothingEnabled=false;c.drawImage(qr,x,y,size,size);c.restore();}else{c.strokeStyle='#ddd';c.strokeRect(x,y,size,size)}}
function logoBlock(){
 rounded(40,30,380,120,12,'#fff');
 if(logo){
  // The approved PNG has transparent padding. Trim only that padding for legibility;
  // preserve the original artwork, proportions and colors.
  const crop=logo.naturalWidth===796&&logo.naturalHeight===314?[105,55,598,185]:[0,0,logo.naturalWidth,logo.naturalHeight];
  const [sx,sy,sw,sh]=crop,scale=Math.min(330/sw,94/sh);
  c.drawImage(logo,sx,sy,sw,sh,62,43+(94-sh*scale)/2,sw*scale,sh*scale);
 }else{text('NoBroker Loans',63,98,42,INK,800);}
}
// Fixed campaign reward: ₹5,000. The renderer owns reward, fixed description and footer terms.
function art(){if(!selected||!token)return;renderCreative($('style').value,{c,hero:HEADLINES[+$('headline').value],callout:CALLOUTS[+$('callout').value],cta:CTAS[+$('cta').value],name:selected.name||'',designation:$('designation').value,photo,qrCode,logoBlock});mirrorFlyerPreview();}
async function loadQR(){if(!token)return;qr=await getImage('/api/qr?format=png&token='+encodeURIComponent(token));art()}
async function loadProfile(){ $('signOut').hidden=false; $('editor').hidden=true; $('profile').hidden=true; $('notice').textContent='Checking Vertical Head access…'; const r=await clerkFetch('/api/lookup');const data=await r.json();if(!r.ok)throw Error(data.error||'Could not retrieve profile.');selected=data.profile;$('designation').value=DESIGNATIONS.includes(selected.designation)?selected.designation:'Vertical Head';token=data.token;shortReferralPath=data.shortReferralPath||'';$('profile').hidden=false;$('profile').textContent=`${selected.name} · ${selected.mobile}`;$('editor').hidden=false;$('notice').textContent='';$('clerkSignIn').hidden=true;$('signOut').hidden=false;await loadQR();await loadReferralDashboard(selected,token,shortReferralPath);}
async function boot(){
 try{
  await initializeClerk($('clerkSignIn'),async()=>{
   try{await loadProfile();}
   catch(e){$('notice').textContent=e.message; $('signOut').hidden=false; $('editor').hidden=true;}
  });
 }catch(e){$('notice').textContent=e.message;}
}
$('signOut').addEventListener('click',async()=>{
 await window.Clerk.signOut();selected=null;token='';shortReferralPath='';qr=null;
 $('profile').hidden=true;$('editor').hidden=true;$('signOut').hidden=true;
 $('vhDashboardShell').hidden=true;document.body.classList.remove('vh-active');
 $('notice').textContent='';
 location.assign('/vh-only');
});
void boot();
function updatePhotoField(){const hidden=isPhotoFree($('style').value);$('photoField').hidden=hidden;$('photo').disabled=hidden;}
updatePhotoField();
for(const id of ['style','headline','callout','cta','designation'])$(id).addEventListener('change',()=>{updatePhotoField();art()});
$('photo').addEventListener('change',async(e)=>{const file=e.target.files[0];if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8_000_000){$('editorNotice').textContent='Use a JPG, PNG or WebP below 8 MB.';return}const blobUrl=URL.createObjectURL(file);try{photo=await getImage(blobUrl);$('editorNotice').textContent=file.type==='image/png'?'Photo loaded. For clean cut-outs, use a transparent PNG.':'Photo loaded with circular cropping. For background removal, upload a transparent PNG.';art()}finally{URL.revokeObjectURL(blobUrl)}});
$('shuffle').addEventListener('click',()=>{for(const id of ['style','headline','callout','cta']){const el=$(id);el.selectedIndex=Math.floor(Math.random()*el.options.length)}updatePhotoField();art()});
function save(href,name){const a=document.createElement('a');a.href=href;a.download=name;document.body.appendChild(a);a.click();a.remove()}
$('download').addEventListener('click',()=>{if(token&&qr&&!logo){$('editorNotice').textContent='The official brand logo has not loaded. Please refresh and try again.';return}if(token&&qr){art();save(canvas.toDataURL('image/png'),`NoBroker-Loans-Referral-${selected.name.replace(/[^a-z0-9]/gi,'-')}.png`)}});
$('qrdownload').addEventListener('click',()=>{if(token)save('/api/qr?token='+encodeURIComponent(token),'NoBroker-Loans-Referral-QR.svg')});
$('copy').addEventListener('click',async()=>{if(!token)return;await navigator.clipboard.writeText(shortReferralPath?`${location.origin}${shortReferralPath}`:`${location.origin}/form?ref=${encodeURIComponent(token)}`);$('editorNotice').textContent='Referral link copied.'});
fetchLogo().then(art);
