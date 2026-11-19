# NoBroker Loans - Referral Creative Generator

**Target Vercel project:** `nbloans-referrals.vercel.app`. This package does not publish or modify the live domain on its own. No Catalog coupling, Supabase, database, or dashboard.

## Pages

- `/`: campaign landing page with **Vertical Heads Click Here** CTA.
- `/vh-only`: VH identification + creative workspace (no naked UTM builder).
- `/landing`: legacy route permanently redirects to `/`.
- `/form?ref=<signed-token>`: compact seven-field referral form. Direct `/form` does not display an operable form; an unexpired HMAC token must validate server-side.

## Source

Only worksheet **Shivankur** from the submitted city allocation support team workbook is imported. The private roster has **26 records**, including 3 `Doubt` and 1 `Exit`, with status preserved. It is stored in `lib/roster.private.json`, used **server-side only**. Never publish `lib` as static assets. Public response exposes only name, mobile and designation. Email and DSA code remain in the private roster; the code is used in signed attribution but not printed on flyers. The workbook lacks designations, so `Vertical Head` is a configurable placeholder, not a verified job title.

## Branded creative generation

Five deterministic design directions from `NoBroker_Loans_Referral_Flyer_Prompts.docx`: geometric, identity, QR-centerpiece, split-screen, minimal. All five Hero options, six approved callouts and five CTAs are present. Two separate PSU ₹5,000 / Private ₹7,000 reward cards. Fixed 1200×1500 output. Hero, logo, portrait, actual QR, rewards, disclaimer and CTA are composited using Canvas; no image model hallucinates these elements. Random mix-and-match, manual selection and download PNG supported.

**Official branding included:** `public/assets/nbl-logo.png` is the exact supplied NoBroker Loans logo (not reconstructed). The supplied percentage-symbol favicon is included as ICO, 32px PNG, 180px Apple touch icon, and 192px icon in `public/assets/`. All three pages reference the favicon. Both images retain their original appearance and transparency. The existing missing-logo text fallback is defensive only.

**Photograph:** Uploads JPG/PNG/WebP with a circular crop. For a *real background-removed cutout*, preprocess portrait using `scripts/remove_background.py` and upload the resulting transparent PNG. The optional rembg Python runtime/model is not bundled/deployed in Vercel; don't treat circular cropping as background removal. Production automatic removal would require a vetted model runtime/service and approval. Never generate human faces.

## Configure and deploy

1. Install Node 20+ and Vercel CLI. `npm install` then `vercel dev` (or deploy via your linked Vercel Git project). Node `qrcode` is the only runtime dependency, to render actual high-error-correction SVG QR codes.
2. Add environment variables from `.env.example` in Vercel project settings. Use a strong independent `REFERRAL_SIGNING_SECRET`. `PILOT_ACCESS_PIN` defaults to `Shiv123` in the example configuration for testing; set it explicitly in Vercel Environment Variables. It is a **shared pilot gate**, **not SMS OTP or identity verification**. For production, connect a real OTP/SSO provider and enforce rate limits against guessing. Do not deploy sensitive data without approved access controls.
3. Configure `REFERRAL_PUBLIC_HOST` to the exact production host. The generator issues a signed 30-day token, with immutable-attribution claims (`DSA code`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`) embedded in the token. `GET /api/qr` builds the QR; `/api/referral-config` validates the token again.
4. Add the authorized Google Form `viewform` prefill URL and all **13** `FORM_ENTRY_*` mappings. These must be actual `entry.12345` IDs discovered from **your** Google Form. The site does not pretend to submit if mapping is missing.
5. **Important:** Google Forms prefill is *not tamper-proof* and the user may edit tracking in the final Google Form URL. A Google Form cannot enforce signed immutable attribution. For true trusted recording, replace the redirect with a controlled server-side submission to an approved endpoint/Google Apps Script that verifies the token and writes attribution from the verified server payload, never from browser-supplied fields. This integration has deliberately NOT been invented.
6. `npm test` for tests of roster retention, HMAC verification, tamper rejection, and expiry. Locally verify QR scan and output flyer visually before production.

## Brand rules

NoBroker Loans is the parent identity; no new sub-brand. Red `#D80000`, white `#FFFFFF`, restrained gold `#FFD700`, black; Arimo-first typography (font must be legally provisioned if exact typeface needed), premium minimal B2B tone. Copy bank and five layouts are fixed. No extra labels or tracking controls. Rewards are **pilot proposals** until business/eligibility terms are signed off.

## Security and limitations

- HMAC keys are server-only. No Supabase. No personal email or DSA code in the downloaded creative.
- The sign-in's static shared PIN does not establish ownership of the phone number. Do not treat it as production authentication.
- Without Google Form mappings there are no accepted submissions. No dashboard/analytics/storage.
- The source Prompt-To-Pixel Streamlit app used an uncontrolled external image API; it has **not** been executed, copied into the production runtime, or given access to user portraits.
- Model download and rembg must be separately security reviewed before server deployment.
- URL-based referral tokens can be shared: signed claims are unmodifiable, but cannot prove the submitter is the original intended recipient.

## Route rules (current iteration)

The campaign landing page is `/`, with the CTA **Vertical Heads Click Here** routed to `/vh-only`. The former creative workspace is now `/vh-only`. The referral form has no link in the site navigation and is omitted from the XML sitemap. `robots.txt`, the form meta robots directive, and Vercel `X-Robots-Tag` headers instruct crawlers not to index it. These are indexing signals, **not access controls**.

If `/form` is opened without a `ref` token, or the signed token is expired/invalid, the page shows only **A referral link from a Vertical Head is required to access this page.** No form fields or ordinary site layout appear. Valid signed tokens are verified by the existing server API before the form appears. UTM claims are embedded in the signed token, not accepted merely because user-supplied `utm_*` parameters are present.
