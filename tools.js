(function () {
 'use strict';
 const config=window.REFERRAL_CONFIG||{heads:{}};
 const $=(id)=>document.getElementById(id);
 const search=new URLSearchParams(location.search);
 const vh=(search.get('vh')||'').trim().toLowerCase();
 const head=(config.heads||{})[vh];
 const profiles=config.profiles||{};
 let profilePhoto=null;
  const feedback = (message) => { $('toolFeedback').textContent = message; };
  const copyText = async (value) => {
    if (!value) return false;
    try { await navigator.clipboard.writeText(value); return true; }
    catch (_) {
      const el = document.createElement('textarea');
      el.value = value; el.style.position = 'fixed'; el.style.opacity = '0';
      document.body.appendChild(el); el.select();
      try { return document.execCommand('copy'); }
      finally { el.remove(); }
    }
  };

  // Relative form route keeps the current Vercel deployment domain.
  const base = new URL('/form/', location.origin);
  const fields = ['headName', 'headCode', 'utmSource', 'utmMedium', 'utmCampaign', 'utmContent'];
 $('lookupProfile').addEventListener('click', () => {
   const phone=$('lookupPhone').value.replace(/\D/g,'');
   if(!/^[6-9]\d{9}$/.test(phone)){ $('profileMessage').textContent='Enter a valid 10-digit Indian mobile number.'; return; }
   const profile=Object.values(profiles).find(p=>p.mobile && p.mobile===phone);
   if(!profile){ $('profileMessage').textContent='This number is not configured yet. Please contact the referral campaign team.'; $('profileFound').hidden=true; return; }
   $('headName').value=profile.name; $('headCode').value=profile.code; $('designation').value=profile.designation||'Vertical Head';
   $('profileName').textContent=profile.name; $('profileDesignationText').textContent=profile.designation||'Vertical Head';
   $('profileFound').hidden=false; $('profileMessage').textContent='Profile loaded. This is a profile lookup, not identity verification.';
   buildUrl();
 });
 $('profilePhoto').addEventListener('change', e=>{
   const file=e.target.files[0];profilePhoto=null; if(!file)return;
   if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){feedback('Choose a JPG, PNG or WebP image below 5 MB.');e.target.value='';return;}
   const img=new Image(); const url=URL.createObjectURL(file);img.onload=()=>{profilePhoto=img;URL.revokeObjectURL(url);feedback('Photograph ready for your creative.');};img.onerror=()=>{URL.revokeObjectURL(url);feedback('Could not read that photograph.');};img.src=url;
 });
  const qrContainer = $('qrCode');
  let currentUrl = '';
  let qrInstance = null;
  const safeCode = (v) => v.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');
  function buildUrl() {
    const name = $('headName').value.trim();
    const code = safeCode($('headCode').value);
    qrContainer.innerHTML = '';
    qrInstance = null;
    const valid = Boolean(name && code);
    $('downloadQR').disabled = $('downloadCreative').disabled = $('shareWhatsApp').disabled = !valid;
    if (!valid) {
      currentUrl = '';
      $('generatedLink').value = '';
      $('linkHint').textContent = 'Enter a name and referral code to create a link.';
      return;
    }
    const url = new URL(base.toString());
    url.search = '';
    url.hash = '';
    url.searchParams.set('vh', code);
    ['utmSource', 'utmMedium', 'utmCampaign', 'utmContent'].forEach((id) => {
      const value = $(id).value.trim();
      if (value) url.searchParams.set(id.replace(/([A-Z])/g, '_$1').toLowerCase(), value);
    });
    currentUrl = url.toString();
    $('generatedLink').value = currentUrl;
    if (typeof QRCode === 'undefined') {
      $('linkHint').textContent = 'Link ready. QR generation requires the QR library to load.';
      $('downloadQR').disabled = $('downloadCreative').disabled = true;
      return;
    }
    try {
      qrInstance = new QRCode(qrContainer, {
        text: currentUrl, width: 160, height: 160,
        colorDark: '#171717', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H
      });
      $('linkHint').textContent = 'Scan to open this referral link.';
    } catch (_) {
      $('downloadQR').disabled = $('downloadCreative').disabled = true;
      $('linkHint').textContent = 'QR could not be generated. You can still copy the link.';
    }
  }
  fields.forEach((id) => $(id).addEventListener('input', buildUrl));
  $('builderForm').addEventListener('submit', (event) => event.preventDefault());
  if (profiles[vh]) { $('headName').value=profiles[vh].name; $('headCode').value=profiles[vh].code; $('designation').value=profiles[vh].designation || 'Vertical Head'; }
  if (head) {
    $('headName').value = head.name || '';
    $('headCode').value = vh;
  } else if (vh) {
    $('headCode').value = vh;
  }
  buildUrl();
  $('copyGenerated').addEventListener('click', async () => feedback(await copyText(currentUrl) ? 'Referral link copied.' : 'Enter a name and referral code first.'));
  $('shareWhatsApp').addEventListener('click', () => {
    if (!currentUrl) return;
    const message = 'Know a Loan Partner who could grow with NoBroker Loans? Refer them here: ' + currentUrl;
    window.open('https://wa.me/?text=' + encodeURIComponent(message), '_blank', 'noopener,noreferrer');
  });
  function qrCanvas() {
    const c = qrContainer.querySelector('canvas');
    if (c && c.width > 0) return c;
    const img = qrContainer.querySelector('img');
    if (!img || !img.complete || !img.naturalWidth) return null;
    const copy = document.createElement('canvas'); copy.width = img.naturalWidth; copy.height = img.naturalHeight;
    copy.getContext('2d').drawImage(img, 0, 0);
    return copy;
  }
  function download(canvas, fileName) {
    const a = document.createElement('a'); a.download = fileName; a.href = canvas.toDataURL('image/png'); document.body.appendChild(a); a.click(); a.remove();
  }
  $('downloadQR').addEventListener('click', () => {
    const canvas = qrCanvas(); if (!canvas) { feedback('QR is still loading. Try again.'); return; }
    download(canvas, 'nbloans-referral-qr-' + safeCode($('headCode').value) + '.png');
    feedback('QR code downloaded.');
  });
  function wrapText(ctx, value, x, y, maxWidth, lineHeight) {
    let line = '';
    for (const word of value.split(' ')) {
      const next = line ? line + ' ' + word : word;
      if (ctx.measureText(next).width > maxWidth && line) { ctx.fillText(line, x, y); line = word; y += lineHeight; }
      else line = next;
    }
    ctx.fillText(line, x, y);
    return y + lineHeight;
  }
  $('downloadCreative').addEventListener('click', () => {
    const qr = qrCanvas(); if (!qr || !currentUrl) { feedback('QR is still loading. Try again.'); return; }
    const canvas = document.createElement('canvas'); canvas.width = 1200; canvas.height = 1500;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 1200, 1500);
    ctx.fillStyle = '#d80000'; ctx.fillRect(0, 0, 1200, 22);
    ctx.fillStyle = '#171717'; ctx.font = 'bold 48px Arial'; ctx.fillText('NoBroker Loans', 90, 135);
    ctx.fillStyle = '#d80000'; ctx.font = 'bold 104px Arial';
    wrapText(ctx, 'REFER A LOAN PARTNER.', 90, 325, 1020, 116);
    ctx.fillStyle = '#171717'; ctx.font = 'bold 46px Arial'; ctx.fillText('YOUR PARTNER IN GROWTH.', 90, 525);
    ctx.fillStyle = '#fff0f1'; ctx.fillRect(90, 615, 1020, 232);
    ctx.fillStyle = '#171717'; ctx.font = 'bold 33px Arial'; ctx.fillText('PSU BANK', 132, 693); ctx.fillText('PRIVATE BANK', 657, 693);
    ctx.fillStyle = '#d80000'; ctx.font = 'bold 80px Arial'; ctx.fillText('₹5,000', 132, 791); ctx.fillText('₹7,000', 657, 791);
    ctx.fillStyle = '#171717'; ctx.font = 'bold 37px Arial'; ctx.fillText($('headName').value.trim().slice(0, 38), 90, 925);
    ctx.font='27px Arial';ctx.fillText($('designation').value.trim().slice(0, 45),90,965);
    if(profilePhoto){ const x=850,y=885,w=245,h=275;const ratio=Math.max(w/profilePhoto.width,h/profilePhoto.height),sw=w/ratio,sh=h/ratio;ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,14);ctx.clip();ctx.drawImage(profilePhoto,(profilePhoto.width-sw)/2,(profilePhoto.height-sh)/2,sw,sh,x,y,w,h);ctx.restore(); }
    ctx.drawImage(qr, 90, 995, 260, 260);
    ctx.font = '29px Arial'; ctx.fillStyle = '#555555';
    wrapText(ctx, 'Scan to refer a Loan Partner', 400, 1085, 400, 43);
    ctx.font = '23px Arial';
    wrapText(ctx, 'First qualifying home loan file of ₹30 lakh or more. Pilot terms apply.', 90, 1340, 1000, 34);
    ctx.fillStyle = '#d80000'; ctx.fillRect(0, 1465, 1200, 35);
    download(canvas, 'nbloans-referral-creative-' + safeCode($('headCode').value) + '.png');
    feedback('Referral creative downloaded.');
  });
})();
