# NoBroker Loans Referral Site — Branded Clerk Sign-in (V5)

This release uses the **existing** Clerk application `app_3MMD6gZG0rCmVCi32zNAt9PGgL1` (the app ID is a dashboard identifier, **not** a credential and is not entered into the frontend). No new Clerk application or Next.js project is needed.

## Changes
- `/vh-only` presents Clerk's **default sign-in component** inside a dedicated NoBroker Loans branded panel.
- Preserves official assets from `public/assets/nbl-logo.png` and the favicon assets.
- Brand variables: red `#D80000`, white, black, Arimo, restrained border radius.
- Existing 26-member private roster, email authorization, five creative templates, signed QR links, `/form` gate, and homepage are retained.
- Supports `CLERK_PUBLISHABLE_KEY` **or** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`. The `CLERK_SECRET_KEY` stays server-side.

## Configure existing Clerk application
In https://dashboard.clerk.com select the existing application ID above, enable email sign-in codes, and ensure all approved VH emails are provisioned/invited. Disable self-service signup if you want invite-only use. The production domain and publishable key must correspond to this same Clerk app.

## Vercel environment variables
```
CLERK_PUBLISHABLE_KEY=pk_live_...              # OR NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY=sk_live_...
REFERRAL_SIGNING_SECRET=your_existing_secret     # DO NOT ROTATE
REFERRAL_PUBLIC_ORIGIN=https://nbloans-referrals.vercel.app
REFERRAL_PUBLIC_HOST=nbloans-referrals.vercel.app
```
Keep any Google Forms configuration as-is. Never put secret keys in HTML, `public/`, or GitHub. Set environment variables through Vercel settings. Existing Google SMTP OTP variables are not used.

## Deploy
1. Copy the ZIP contents to the **same existing** GitHub repository root and commit.
2. Ensure these files reside directly under root (`package.json`, `api/`, `lib/`, `public/`, `vercel.json`).
3. Redeploy Vercel with the existing environment variables.
4. Visit `https://nbloans-referrals.vercel.app/vh-only`, authenticate with an authorized email, and verify the VH profile appears.
5. Test an unauthorized email (must not see VH creative editor), and `/form` without `?ref=` (must show referral-link-required error).
6. Test signed QR links and the existing creative generator.

**Note:** Clerk's sign-in form is managed by Clerk, not hardcoded by this project. The site can style its component but cannot change Clerk's code expiry/resend policy. The production app may require a custom domain owned by your organization, depending on Clerk production setup. This ZIP has no live-session or email-delivery verification.

## Test
```bash
npm install
npm test
```
## Privacy and security
Clerk's hosted authentication owns OTP delivery, rate controls and sessions. Auth doesn't automatically restrict who can sign in; the separate roster lookup denies unauthorized users. The browser sends a short-lived bearer session token to `/api/lookup`; it is verified server-side and not stored in localStorage. Signed referral tokens are valid for up to 30 days, so preserve the signing secret. Google Forms submission remains a prefilled Google Form redirect rather than a server-recorded write; recipients may alter prefilled form fields after leaving this site. For trustworthy finance attribution, eventually move referral submission to an authenticated server endpoint.

## Local tests
`npm install && npm test` then `vercel dev` with a private `.env` and Clerk development instance. No real emails or Vercel deployment were executed as part of this migration. External Clerk SDK API compatibility must be confirmed against your chosen instance and SDK versions in a running browser.

## V6 UI refinement
The `/vh-only` login now displays the default Clerk card directly alongside the NoBroker Loans introduction. Removed the duplicate heading and custom bordered/shadowed sign-in wrapper; Clerk handles the entire sign-in UI. No authentication, API, roster, referral, brand asset, or creative-generator logic changed.

## V7: On-site Clerk sign-up

- `/vh-only`: existing branded Clerk sign-in with `signUpUrl: '/sign-up'`.
- `/sign-up`: native Clerk sign-up card rendered directly on the NoBroker Loans domain, linked back to `/vh-only`.
- Clerk sign-in/sign-up routing uses hash mode to support static Vercel rewrites.
- Set **Sign-up URL** in your Clerk Dashboard (Development instance) to `https://nbloans-referrals.vercel.app/sign-up` and **Sign-in URL** to `https://nbloans-referrals.vercel.app/vh-only`, where such settings are available. Do not use the Clerk-hosted `accounts.dev` sign-up link.
- After registration, only emails in the private Shivankur roster can access `/api/lookup` and the creative editor; Clerk sign-up is not in itself VH authorization. For a VH-only pilot, invite/allowlist the 26 emails rather than enabling unrestricted public registrations.
- This release does not change signed referral token processing, the restricted form, or public landing page.


## V8 access-denied UI correction
A successful Clerk sign-in is not sufficient to use the creative tools. The signed-in Clerk account must have a verified primary email that exactly matches the email of a record in `lib/roster.private.json` (from the Shivankur tab). If lookup returns 403, the site now displays a clear message and a usable **Sign out / switch account** button rather than an empty authenticated page. The roster, signed-link authorization and original Clerk setup remain unchanged. This update does not add a referral dashboard.

If an authorized VH still sees a blank creative section, inspect the request status for `/api/lookup` in Vercel logs. A 403 generally means roster mismatch or verification issue; a 503 points to Clerk backend verification or environment configuration. Never disable the roster check to fix UI appearance.
