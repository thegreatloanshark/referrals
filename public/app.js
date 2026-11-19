const HEADLINES=['Refer a Loan Partner. Earn More.','Your Network. Your Next Reward.','Great Connections Deserve Great Rewards.','Grow the Network. Share the Success.','One Referral. A New Opportunity.'];
const CALLOUTS=['Your network deserves more than recognition.','Know a Loan Partner? Make the introduction count.','One introduction could unlock your next reward.','Turn valuable connections into rewarding opportunities.','Help another Loan Partner grow. Get rewarded.','You bring the connection. We take it forward.'];
const CTAS=['Refer Now','Share Your Referral','Start Referring','Refer & Earn','Scan to Refer'];
const $=id=>document.getElementById(id);const canvas=$('flyer'),c=canvas.getContext('2d');
const W=1200,H=1500,RED='#D80000',INK='#181818',SOFT='#FFF1F2',GOLD='#FFD700';
let selected=null,token='',photo=null,qr=null,logo=null;
for(const [id,items] of [['headline',HEADLINES],['callout',CALLOUTS],['cta',CTAS]]){$(id).innerHTML=items.map((t,i)=>`<option value="${i}">${t.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</option>`).join('')}
const getImage=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src});
async function fetchLogo(){try{logo=await getImage('/assets/nbl-logo.png')}catch{logo=null}}
function text(t,x,y,size=40,color=INK,weight=700,maxWidth=950,align='left'){c.fillStyle=color;c.textAlign=align;c.font=`${weight} ${size}px Arimo, Arial, sans-serif`;c.fillText(String(t),x,y,maxWidth)}
function wrap(t,maxWidth,size=38,weight=700){c.font=`${weight} ${size}px Arimo, Arial, sans-serif`;const lines=[''];for(const part of String(t).split(' ')){const last=lines.length-1;const cand=(lines[last]+' '+part).trim();if(c.measureText(cand).width>maxWidth&&lines[last])lines.push(part);else lines[last]=cand;}return lines}
function paragraph(t,x,y,width,size=40,lineHeight=1.16,color=INK,weight=700,maxLines=4){const lines=wrap(t,width,size,weight).slice(0,maxLines);lines.forEach((line,i)=>text(line,x,y+i*size*lineHeight,size,color,weight,width));return y+lines.length*size*lineHeight}
function rounded(x,y,w,h,r,color){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()}
function rewards(x,y,width=840,variant='normal'){
 const half=(width-14)/2;rounded(x,y,half,158,19,variant==='red'?'#B80000':SOFT);rounded(x+half+14,y,half,158,19,variant==='red'?'#B80000':SOFT);
 const color=variant==='red'?'#fff':RED, label=variant==='red'?'#fff':INK;
 text('PSU BANK',x+22,y+45,25,label,700);text('₹5,000',x+22,y+116,61,color,800);
 text('PRIVATE BANK',x+half+36,y+45,25,label,700);text('₹7,000',x+half+36,y+116,61,color,800);
}
function photoCircle(x,y,r){
 rounded(x-r-13,y-r-13,2*r+26,2*r+26,r+13,SOFT);
 c.save();c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.clip();if(photo){const scale=Math.max(2*r/photo.width,2*r/photo.height);const iw=photo.width*scale,ih=photo.height*scale;c.drawImage(photo,x-iw/2,y-ih/2,iw,ih)}else{rounded(x-r,y-r,2*r,2*r,r,'#FFF');c.strokeStyle='#F3D4D7';c.lineWidth=4;c.beginPath();c.arc(x,y,r-7,0,Math.PI*2);c.stroke()}c.restore();
}
function qrCode(x,y,size=240){rounded(x-13,y-13,size+26,size+26,13,'#FFF');if(qr)c.drawImage(qr,x,y,size,size);else{c.strokeStyle='#ddd';c.strokeRect(x,y,size,size)}}
function identity(x,y,color=INK,align='left'){const n=selected?.name||'';text(n,x,y,35,color,800,590,align);text(($('designation').value||'Vertical Head').slice(0,60),x,y+36,22,color,400,590,align)}
function footer(){rounded(0,1402,W,98,0,'#fff');c.fillStyle='#E7E7E7';c.fillRect(65,1401,1070,1);text('Home Loan ≥ ₹30 lakh · First qualifying file · T&Cs apply',65,1451,21,'#666',400,1040);}
function logoBlock(){rounded(40,30,380,120,12,'#fff');if(logo){const scale=Math.min(330/logo.width,95/logo.height);c.drawImage(logo,62,42,logo.width*scale,logo.height*scale)}else{text('NoBroker Loans',63,98,42,INK,800);}}
function ctaBlock(s,x,y,width=430){rounded(x,y,width,72,15,RED);text(s.toUpperCase(),x+width/2,y+48,29,'#fff',800,width-24,'center')}
function art(){if(!selected||!token)return;c.clearRect(0,0,W,H);c.fillStyle='#FFF';c.fillRect(0,0,W,H);const hero=HEADLINES[+$('headline').value],callout=CALLOUTS[+$('callout').value],cta=CTAS[+$('cta').value],mode=$('style').value;
 if(mode==='geometric'){
  c.fillStyle=RED;c.beginPath();c.moveTo(740,0);c.lineTo(1200,0);c.lineTo(1200,850);c.lineTo(970,1050);c.closePath();c.fill();c.fillStyle='#FFD700';c.beginPath();c.arc(1070,370,73,0,Math.PI*2);c.fill();
  paragraph(hero,70,260,670,69,1.06,INK,800,4);paragraph(callout,70,540,620,32,1.22,'#555',500,3);photoCircle(935,720,230);identity(70,785);rewards(70,855,710);ctaBlock(cta,70,1078,440);qrCode(865,1110,220);text('SCAN TO REFER',975,1373,20,INK,800,220,'center');
 }else if(mode==='identity'){
  rounded(40,165,1120,1040,42,SOFT);rounded(65,185,1070,680,34,'#fff');paragraph(hero,95,270,980,62,1.1,INK,800,3);photoCircle(600,640,225);identity(600,918,INK,'center');paragraph(callout,90,1025,670,29,1.18,INK,500,3);rewards(70,1140,720);qrCode(925,1115,195);ctaBlock(cta,72,1330,470);
 }else if(mode==='qr'){
  rounded(0,165,1200,165,0,RED);paragraph(hero,68,250,1090,62,1.1,'#fff',800,2);photoCircle(310,605,195);identity(595,575);paragraph(callout,595,695,540,31,1.24,'#444',500,3);rewards(70,850,720);qrCode(848,810,265);text('SCAN TO REFER',980,1130,25,RED,800,250,'center');ctaBlock(cta,70,1110,630);
 }else if(mode==='split'){
  c.fillStyle=RED;c.beginPath();c.moveTo(0,0);c.lineTo(650,0);c.lineTo(560,1400);c.lineTo(0,1400);c.fill();photoCircle(310,760,230);identity(300,1070,'#fff','center');
  paragraph(hero,645,265,500,58,1.13,INK,800,4);paragraph(callout,650,565,500,30,1.22,'#555',500,4);rewards(620,780,515);qrCode(860,1040,230);ctaBlock(cta,628,1310,500); 
 }else{
  c.fillStyle=RED;c.fillRect(0,166,1200,16);paragraph(hero,85,285,1050,70,1.1,INK,800,3);paragraph(callout,85,500,970,31,1.24,'#666',500,3);photoCircle(350,855,228);identity(700,825);rewards(650,910,490);qrCode(165,1120,210);ctaBlock(cta,650,1225,480);
 }
 footer();logoBlock();
}
async function loadQR(){if(!token)return;qr=await getImage('/api/qr?token='+encodeURIComponent(token));art()}
async function lookup(ev){ev.preventDefault();$('notice').textContent='Checking profile…';const mobile=$('mobile').value.replace(/\D/g,''),pin=$('pin').value;
 try{const r=await fetch('/api/lookup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mobile,pin})});const data=await r.json();if(!r.ok)throw Error(data.error||'Could not retrieve profile.');selected=data.profile;token=data.token;$('pin').value='';$('profile').hidden=false;$('profile').textContent=`${selected.name} · ${selected.mobile}`;$('editor').hidden=false;$('notice').textContent='';await loadQR();}catch(e){$('notice').textContent=e.message;}
}
$('profileForm').addEventListener('submit',lookup);
for(const id of ['style','headline','callout','cta','designation'])$(id).addEventListener(id==='designation'?'input':'change',art);
$('photo').addEventListener('change',async(e)=>{const file=e.target.files[0];if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>8_000_000){$('editorNotice').textContent='Use a JPG, PNG or WebP below 8 MB.';return}const blobUrl=URL.createObjectURL(file);try{photo=await getImage(blobUrl);$('editorNotice').textContent=file.type==='image/png'?'Photo loaded. For clean cut-outs, use a transparent PNG.':'Photo loaded with circular cropping. For background removal, upload a transparent PNG.';art()}finally{URL.revokeObjectURL(blobUrl)}});
$('shuffle').addEventListener('click',()=>{for(const id of ['style','headline','callout','cta']){const el=$(id);el.selectedIndex=Math.floor(Math.random()*el.options.length)}art()});
function save(href,name){const a=document.createElement('a');a.href=href;a.download=name;document.body.appendChild(a);a.click();a.remove()}
$('download').addEventListener('click',()=>{if(token){art();save(canvas.toDataURL('image/png'),`NoBroker-Loans-Referral-${selected.name.replace(/[^a-z0-9]/gi,'-')}.png`)}});
$('qrdownload').addEventListener('click',()=>{if(token)save('/api/qr?token='+encodeURIComponent(token),'NoBroker-Loans-Referral-QR.svg')});
$('copy').addEventListener('click',async()=>{if(!token)return;await navigator.clipboard.writeText(`${location.origin}/form?ref=${encodeURIComponent(token)}`);$('editorNotice').textContent='Referral link copied.'});
fetchLogo().then(art);
