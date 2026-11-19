(function () {
  'use strict';
  const config = window.REFERRAL_CONFIG || { heads: {}, defaultFormUrl: '' };
  const $ = (id) => document.getElementById(id);
  const search = new URLSearchParams(location.search);
  const vh = (search.get('vh') || '').trim().toLowerCase();
  const head = (config.heads || {})[vh];
  const referrerLine = $('referrerLine');
  if (head && head.name) {
    referrerLine.hidden = false;
    referrerLine.textContent = 'Shared by ' + head.name;
  }
  const formFields = ['referrerName','referrerMobile','referrerEmail','referrerCity','referredName','referredMobile','referredEmail'];
  const referralForm = $('referralForm');
  const referralFeedback = $('referralFeedback');
  const validHttpsForm = (value) => {
    try { const u = new URL(value); return u.protocol === 'https:' && (u.hostname === 'docs.google.com' || u.hostname === 'forms.gle'); }
    catch (_) { return false; }
  };
  // This is a static site. No fields are saved or transmitted here. Submission is
  // supported only by opening a configured prefilled Google Form for final review.
  referralForm.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!referralForm.reportValidity()) return;
    const formCfg = (head && head.googleForm) || (!vh && config.defaultGoogleForm) || null;
    if (!formCfg || !validHttpsForm(formCfg.url)) {
      referralFeedback.textContent = 'This referral form is not connected yet. Ask your NoBroker Loans contact for the active form link.';
      return;
    }
    const mapping = formCfg.fields || {};
    if (!formFields.every((key) => /^entry\.\d+$/.test(mapping[key] || ''))) {
      referralFeedback.textContent = 'Form submission is not configured yet. Please contact your NoBroker Loans team.';
      return;
    }
    const url = new URL(formCfg.url);
    url.searchParams.set('usp', 'pp_url');
    const data = new FormData(referralForm);
    for (const key of formFields) url.searchParams.set(mapping[key], String(data.get(key) || '').trim());
    if (formCfg.attributionEntry && /^entry\.\d+$/.test(formCfg.attributionEntry)) {
      url.searchParams.set(formCfg.attributionEntry, vh || 'direct');
    }
    // Only send UTM values when a Google Form entry ID was explicitly configured.
    for (const key of ['utm_source','utm_medium','utm_campaign','utm_content']) {
      if (formCfg.utmEntries && /^entry\.\d+$/.test(formCfg.utmEntries[key] || '') && search.has(key)) {
        url.searchParams.set(formCfg.utmEntries[key], search.get(key));
      }
    }
    referralFeedback.textContent = 'Review the prefilled details and submit them in Google Forms.';
    window.location.assign(url.toString());
  });
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
  $('copyButton').addEventListener('click', async function () {
    this.textContent = await copyText(location.href) ? 'Link copied ✓' : 'Copy from address bar';
    setTimeout(() => { this.textContent = 'Copy this referral page link ⧉'; }, 2000);
  });

  const base = (() => {
    try {
      const url = new URL(config.siteUrl || location.origin + location.pathname);
      return url.protocol === 'https:' ? url : new URL(location.origin + location.pathname);
    } catch (_) { return new URL(location.origin + location.pathname); }
  })();
  const fields = ['headName', 'headCode', 'utmSource', 'utmMedium', 'utmCampaign', 'utmContent'];
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
    ctx.fillStyle = '#171717'; ctx.font = 'bold 45px Arial'; ctx.fillText('NOBROKER', 90, 135);
    ctx.fillStyle = '#171717'; ctx.fillRect(375, 100, 180, 48);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 34px Arial'; ctx.fillText('LOANS', 391, 136);
    ctx.fillStyle = '#d80000'; ctx.font = 'bold 104px Arial';
    wrapText(ctx, 'REFER A LOAN PARTNER.', 90, 325, 1020, 116);
    ctx.fillStyle = '#171717'; ctx.font = 'bold 53px Arial'; ctx.fillText('YOUR INTRODUCTION. YOUR REWARD.', 90, 525);
    ctx.fillStyle = '#fff0f1'; ctx.fillRect(90, 615, 1020, 232);
    ctx.fillStyle = '#171717'; ctx.font = 'bold 33px Arial'; ctx.fillText('PSU BANK', 132, 693); ctx.fillText('PRIVATE BANK', 657, 693);
    ctx.fillStyle = '#d80000'; ctx.font = 'bold 80px Arial'; ctx.fillText('₹5,000', 132, 791); ctx.fillText('₹7,000', 657, 791);
    ctx.fillStyle = '#171717'; ctx.font = 'bold 34px Arial'; ctx.fillText('Referred by ' + $('headName').value.trim().slice(0, 45), 90, 940);
    ctx.drawImage(qr, 90, 995, 260, 260);
    ctx.font = '29px Arial'; ctx.fillStyle = '#555555';
    wrapText(ctx, 'Scan to refer a Loan Partner', 400, 1085, 670, 43);
    ctx.font = '23px Arial';
    wrapText(ctx, 'First qualifying home loan file of ₹30 lakh or more. Pilot terms apply.', 90, 1340, 1000, 34);
    ctx.fillStyle = '#d80000'; ctx.fillRect(0, 1465, 1200, 35);
    download(canvas, 'nbloans-referral-creative-' + safeCode($('headCode').value) + '.png');
    feedback('Referral creative downloaded.');
  });
})();
