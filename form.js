(function () {
  'use strict';
  const config = window.REFERRAL_CONFIG || { heads: {}, defaultFormUrl: '' };
  const $ = (id) => document.getElementById(id);
  const search = new URLSearchParams(location.search);
  const vh = (search.get('vh') || '').trim().toLowerCase();
  const head = (config.heads || {})[vh];
  const referrerLine = $('referrerLine');
  if (referrerLine && head && head.name) {
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

})();
