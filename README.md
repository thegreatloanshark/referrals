# NoBroker Loans - Referral Creative Generator

**Target Vercel project:** `nbloans-referrals.vercel.app`. This package does not publish or modify the live domain on its own. No Catalog coupling, Supabase, database, or dashboard.

## Pages

- `/`: campaign landing page with **Vertical Heads Click Here** CTA.
- `/vh-only`: Email OTP login + creative workspace (no naked UTM builder).
- `/landing`: legacy route permanently redirects to `/`.
- `/form?ref=<signed-token>`: compact seven-field referral form. Direct `/form` does not display an operable form; an unexpired HMAC token must validate server-side.

## Source

Only worksheet **Shivankur** from the submitted city allocation support team workbook is imported. The private roster has **26 records**, including 3 `Doubt` and 1 `Exit`, with status preserved. It is stored in `lib/roster.private.json`, used **server-side only**. Never publish `lib` as static assets. Authenticated response exposes only name, mobile and designation. Email and DSA code remain in the private roster; the code is used in signed attribution but not printed on flyers. The workbook lacks designations, so `Vertical Head` is a configurable placeholder, not a verified job title.

## Branded creative generation

Five deterministic design directions from `NoBroker_Loans_Referral_Flyer_Prompts.docx`: geometric, identity, QR-centerpiece, split-screen, minimal. All five Hero options, six approved callouts and five CTAs are present. Two separate PSU ₹5,000 / Private ₹7,000 reward cards. Fixed 1200×1500 output. Hero, logo, portrait, actual QR, rewards, disclaimer and CTA are composited using Canvas; no image model hallucinates these elements. Random mix-and-match, manual selection and download PNG supported.

**Official branding included:** `public/assets/nbl-logo.png` is the exact supplied NoBroker Loans logo (not reconstructed). The supplied percentage-symbol favicon is included as ICO, 32px PNG, 180px Apple touch icon, and 192px icon in `public/assets/`. All three pages reference the favicon. Both images retain their original appearance and transparency. The existing missing-logo text fallback is defensive only.

**Photograph:** Uploads JPG/PNG/WebP with a circular crop. For a *real background-removed cutout*, preprocess portrait using `scripts/remove_background.py` and upload the resulting transparent PNG. The optional rembg Python runtime/model is not bundled/deployed in Vercel; don't treat circular cropping as background removal. Production automatic removal would require a vetted model runtime/service and approval. Never generate human faces.

## Configure and deploy

1. Install Node 20+ and Vercel CLI. `npm install` then `vercel dev` (or deploy via your linked Vercel Git project). Node `qrcode` is the only runtime dependency, to render actual high-error-correction SVG QR codes.
2. Add environment variables from `.env.example` in Vercel project settings. Use a strong independent `REFERRAL_SIGNING_SECRET`. Set `SMTP_USER`, `SMTP_PASS` (Google Workspace App Password), and independent 32+ character `OTP_SIGNING_SECRET`. Shared `Shiv123` pilot PIN is removed. Email OTP is sent to the address in the private roster after mobile lookup. Do not deploy sensitive data without approved access controls.
3. Configure `REFERRAL_PUBLIC_HOST` to the exact production host. The generator issues a signed 30-day token, with immutable-attribution claims (`DSA code`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`) embedded in the token. `GET /api/qr` builds the QR; `/api/referral-config` validates the token again.
4. Add the authorized Google Form `viewform` prefill URL and all **13** `FORM_ENTRY_*` mappings. These must be actual `entry.12345` IDs discovered from **your** Google Form. The site does not pretend to submit if mapping is missing.
5. **Important:** Google Forms prefill is *not tamper-proof* and the user may edit tracking in the final Google Form URL. A Google Form cannot enforce signed immutable attribution. For true trusted recording, replace the redirect with a controlled server-side submission to an approved endpoint/Google Apps Script that verifies the token and writes attribution from the verified server payload, never from browser-supplied fields. This integration has deliberately NOT been invented.
6. `npm test` for tests of roster retention, HMAC verification, tamper rejection, and expiry. Locally verify QR scan and output flyer visually before production.

## Brand rules

NoBroker Loans is the parent identity; no new sub-brand. Red `#D80000`, white `#FFFFFF`, restrained gold `#FFD700`, black; Arimo-first typography (font must be legally provisioned if exact typeface needed), premium minimal B2B tone. Copy bank and five layouts are fixed. No extra labels or tracking controls. Rewards are **pilot proposals** until business/eligibility terms are signed off.

## Security and limitations

- HMAC keys are server-only. No Supabase. No personal email or DSA code in the downloaded creative.
- Email OTP verifies access to the roster email associated with the entered mobile; it does not verify ownership of the mobile number.
- Without Google Form mappings there are no accepted submissions. No dashboard/analytics/storage.
- The source Prompt-To-Pixel Streamlit app used an uncontrolled external image API; it has **not** been executed, copied into the production runtime, or given access to user portraits.
- Model download and rembg must be separately security reviewed before server deployment.
- URL-based referral tokens can be shared: signed claims are unmodifiable, but cannot prove the submitter is the original intended recipient.

## Route rules (current iteration)

The campaign landing page is `/`, with the CTA **Vertical Heads Click Here** routed to `/vh-only`. The former creative workspace is now `/vh-only`. The referral form has no link in the site navigation and is omitted from the XML sitemap. `robots.txt`, the form meta robots directive, and Vercel `X-Robots-Tag` headers instruct crawlers not to index it. These are indexing signals, **not access controls**.

If `/form` is opened without a `ref` token, or the signed token is expired/invalid, the page shows only **A referral link from a Vertical Head is required to access this page.** No form fields or ordinary site layout appear. Valid signed tokens are verified by the existing server API before the form appears. UTM claims are embedded in the signed token, not accepted merely because user-supplied `utm_*` parameters are present.

## Email OTP deployment (Vercel + Google Workspace)

1. Add `SMTP_USER` (the Workspace email), `SMTP_PASS` (its Google 16-character App Password; keep secret), `OTP_SIGNING_SECRET` (independent random 32+ character value) and existing `REFERRAL_SIGNING_SECRET` to **Vercel Project → Settings → Environment Variables**. Configure for intended environments, then redeploy.
2. Gmail SMTP uses `smtp.gmail.com:465` with TLS. Workspace administrators may restrict app passwords; SMTP sending is subject to account quotas. NEVER commit credentials.
3. Login flow: mobile → `POST /api/request-otp` → six-digit email OTP (10-minute expiry) → `POST /api/verify-otp` → HttpOnly Secure SameSite=Strict session cookie (8 hours) → `GET /api/lookup` returns profile and signed QR referral token. `POST /api/logout` clears the cookies. The code is not displayed on the site or returned by the API.
4. **Critical security limitation:** This is a serverless **stateless** OTP pilot without a database. A valid challenge cookie can potentially be replayed during its lifetime and an instance-local rate limiter cannot enforce global attempt limits across Vercel instances. Configure Vercel Firewall/WAF rate limits on `/api/request-otp` and `/api/verify-otp` and restrict the rollout until you add durable one-time-use counters/rate limiting or an established identity provider. Do not describe this as production-grade single-use OTP.
5. No email addresses, OTPs or signing secrets are embedded in public JavaScript. Email OTP does not verify that the registered mobile belongs to the caller; it verifies possession of the mapped mailbox. User-provided cookies are authenticated and never trusted without cryptographic verification.


## Exact Google Workspace OTP checklist (V3 deployment)

1. In Google Workspace, enable 2-Step Verification for the sender mailbox and create an App Password at https://myaccount.google.com/apppasswords. Use the mailbox's app password, **not** the regular login password. The Workspace admin can disable App Passwords. Never commit or share credentials.
2. In Vercel > Project > Settings > Environment Variables, add `SMTP_USER` = full Workspace email, `SMTP_PASS` = the app password (typically entered without spaces), `OTP_SIGNING_SECRET` = fresh randomly generated 32+ character secret, `REFERRAL_SIGNING_SECRET` = a **different** randomly generated 32+ character secret, `REFERRAL_PUBLIC_HOST` = `nbloans-referrals.vercel.app`. Enable for Production (and Preview only if intended).
3. Redeploy **after** setting environment variables. Vercel deployments capture environment variables at build/deployment time; a previous deployment does not pick up newly added values automatically.
4. `npm install`, `npm test`, and `vercel dev` locally (Node >=20); on Vercel, deploy through linked GitHub repository or `vercel --prod`. Don't upload `.env` files or private secrets to GitHub.
5. Open `/vh-only`, enter the mobile of a real pilot roster member who has an authorized email, choose **Email verification code**, check the *associated mailbox*, enter the 6-digit OTP within 10 minutes, and verify the profile and QR load. If nothing arrives, check mailbox spam, Vercel Function logs, and Workspace SMTP restrictions. A generic on-screen response is deliberate, to prevent roster enumeration.
6. On success, an encrypted HttpOnly, Secure, SameSite=Strict session cookie lasts up to 8 hours; profile API requires it. Test logout and an invalid/expired OTP. Do not expect the old `Shiv123` PIN to work.
7. Put Vercel Firewall rate limits on `/api/request-otp` and `/api/verify-otp` before distributing this to all VHs. Stateless cookies and per-instance limits are **not** strict single-use OTP or global attempt tracking. Durable, cross-instance replay protection requires a persistent store or external auth provider. Do not rely on this pilot for high-assurance authentication.
8. If the old site says `Referral service not configured`, confirm both 32+ character signing secrets are set on the **correct Vercel project/environment** and redeploy. If email errors arise, confirm `SMTP_USER` / `SMTP_PASS` and look for `OTP delivery error` in the Vercel Function Logs.

### API contract

- `POST /api/request-otp` JSON `{"mobile":"<10-digit number>"}`. Returns a non-enumerating message and sets encrypted `nb_otp_challenge` cookie when matched. Never returns the code.
- `POST /api/verify-otp` JSON `{"code":"<6-digit code>"}` with browser credentials. On success, clears challenge and sets `nb_vh_session` HttpOnly cookie.
- `GET /api/lookup` with browser credentials returns only the authenticated VH's public profile and a signed referral token (never email, code, secret or DSA code in the public profile).
- `POST /api/logout` clears both cookies.

**Note:** Email possession is verified; this does not verify that the user's handset owns the typed number. The mapping is server-side, drawn only from the 26 profiles in the `Shivankur` worksheet.
