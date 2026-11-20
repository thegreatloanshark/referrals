# NoBroker Loans Referral Site — Clerk Migration (V4)

## What stays the same
- `/` is the public campaign landing page; CTA says **Vertical Heads Click Here**.
- `/vh-only` remains the branded creative workspace with five 1200 × 1500 designs and approved mix-and-match copy.
- `/form` stays unlisted, noindex, and requires an unexpired HMAC-signed `?ref=` token. A direct visit shows the referral-link error.
- All **26** records from the **Shivankur** tab remain in `lib/roster.private.json` (including Doubt and Exit).
- Original logo, favicon, rewards, Google Forms mapping and signed QR generation remain untouched.
- No Supabase or dashboard.

## Important change: VH now signs in with their REGISTERED EMAIL
The old mobile-plus-custom-OTP and `Shiv123` flow are removed. Clerk's secure prebuilt email verification UI handles OTP/resend/session. Each user must sign in using the **exact email recorded in the roster**; entering another verified email will not unlock the workspace. The browser never receives the full roster or the email address from a phone lookup. Mobile remains available in the authorized profile. Do not enable open public sign-up.

## Clerk setup (required BEFORE you redeploy)
1. Create a Clerk application at https://dashboard.clerk.com.
2. In **User & Authentication → Email, phone, username**, enable email verification codes as a sign-in method. Disable password, OAuth, phone login and self-service sign-up if you want invitation-only access. Disable public sign-up in the application's sign-up settings. The exact dashboard tab labels can change.
3. **Provision the 26 roster email addresses in Clerk** as users or invitation recipients; invite in batches as appropriate. People must activate/verify their accounts. **Do not upload the private roster as a public asset.** Every roster record is eligible, including entries marked Doubt or Exit; this does not automatically grant Clerk access until the user exists and verifies their address.
4. In Clerk's domains/production setup, authorize **https://nbloans-referrals.vercel.app**. Vercel preview domains may need separate development configuration.
5. Obtain Production Publishable and Secret keys from Clerk Dashboard → API Keys.
6. Set Vercel environment variables:
   - `CLERK_PUBLISHABLE_KEY=pk_live_...` (public)
   - `CLERK_SECRET_KEY=sk_live_...` (server secret)
   - `REFERRAL_PUBLIC_ORIGIN=https://nbloans-referrals.vercel.app`
   - `REFERRAL_PUBLIC_HOST=nbloans-referrals.vercel.app`
   - `REFERRAL_SIGNING_SECRET=` **keep exact existing value**
   - Retain your existing `GOOGLE_FORM_URL` and `FORM_ENTRY_*` settings if already configured.
7. Commit/upload extracted site files, redeploy Vercel, then visit `/vh-only`.
8. Test: signed-out user sees Clerk sign-in; roster email receives Clerk verification; correct roster user sees VH profile, generates 5 creatives and QR; unlisted email can sign in but is **denied** by `/api/lookup`; `/form` without `?ref=` shows the error; signed token opens form.

**Do not set** `SMTP_USER`, `SMTP_PASS`, `OTP_SIGNING_SECRET`, `PILOT_ACCESS_PIN` in this version. They are unused. After verified cutover, delete these old variables from Vercel. There are no app-controlled OTP duration or resend timings: Clerk determines these in its authentication flow. A five-minute OTP validity is **not guaranteed** without explicit Clerk support.

## Source architecture
- `public/clerk-login.js`: loads ClerkJS and mounts Clerk's sign-in UI.
- `api/clerk-config.js`: exposes only publishable key.
- `lib/clerk-auth.js`: verifies Clerk session JWT and checks Clerk's **verified primary email** against the private 26-person roster.
- `api/lookup.js`: issues legacy-compatible signed referral links only after roster authorization.
- `lib/security.js`: retains secure referral signing and verification, with obsolete OTP cookies removed.

## Privacy and security
Clerk's hosted authentication owns OTP delivery, rate controls and sessions. Auth doesn't automatically restrict who can sign in; the separate roster lookup denies unauthorized users. The browser sends a short-lived bearer session token to `/api/lookup`; it is verified server-side and not stored in localStorage. Signed referral tokens are valid for up to 30 days, so preserve the signing secret. Google Forms submission remains a prefilled Google Form redirect rather than a server-recorded write; recipients may alter prefilled form fields after leaving this site. For trustworthy finance attribution, eventually move referral submission to an authenticated server endpoint.

## Local tests
`npm install && npm test` then `vercel dev` with a private `.env` and Clerk development instance. No real emails or Vercel deployment were executed as part of this migration. External Clerk SDK API compatibility must be confirmed against your chosen instance and SDK versions in a running browser.
