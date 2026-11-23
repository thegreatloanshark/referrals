NO BROKER LOANS REFERRALS — V13

This is a COMPLETE source replacement based on V12, retaining native Clerk,
short referral redirects, QR attribution, user roster, creative generator,
Vercel API handlers and Supabase/Google Sheets sync.

DEPLOYMENT ORDER
1. Supabase project evsmmzkgyuxajoqvdnnj has already received V13 migrations:
   duplicate_label, original_lead_id, referral_payout_generated,
   first_file_amount NUMERIC(15,2), and sync-trigger update.
   Do not re-create tables or import sample data.
2. Google Sheet 1yDQR7YRp5ehGxUyyla34CVLyeArsMXjZ4H7PWzc_Kbg
   has already been updated: existing rows preserved; Qualified renamed
   Qualified (Legacy), Onboarded renamed Lead Onboarded, new columns appended.
3. Commit the included source files to the existing PRIVATE GitHub referrals repo,
   then wait for the matching Vercel production deployment. This package includes
   the 28-person roster. Do not commit secrets. Keep existing env vars.
4. Replace Google Apps Script Code.gs with integration/GoogleAppsScript.gs, save,
   and run syncReferrals once; keep the five-minute trigger.
5. Smoke-test one approved VH and Marketing: signed-in /vh-only loads; 
   share/scan new QR; submit a *new* referral; confirm Supabase and Sheet; 
   check VH isolation & Super Admin views; set stages and first file amount
   through the Sheet and confirm dashboard bands.

MARKETING AUTHORIZATION API CHANGE
 - lib/clerk-auth.js authorizedProfile() previously matched ONLY Clerk's verified
   PRIMARY email. Now it reads all VERIFIED Clerk emailAddresses, normalizes case
   and spaces, and matches exactly ONE record in the server-side 28-person roster.
 - It does not trust username, display name, browser-submitted email, or DSA.
 - api/lookup.js continues to use authorizedProfile, so the same protection
   governs the existing profile login. Clerk sign-in behavior is preserved.
 - This should fix the Marketing account where it is a verified address. If Clerk
   has not actually verified it or is using the wrong instance, the backend
   still correctly rejects it. Do not bypass Clerk verification.

QR CHANGE (NO SCANNER REPOSITORY NEEDED)
 - lib/security.js easyQrSlug() creates a deterministic, HMAC-protected
   14-character referral identifier tied to the approved DSA code.
 - /r/<slug> resolves it securely, then issues the usual signed /form token.
 - api/qr.js outputs 1200px pure BLACK/WHITE QR, 5-module quiet zone,
   medium ECC, and supports SVG download and PNG rendering in flyers.
 - All five flyer layouts have increased QR size and no text or logo overlays.
 - Old V12 short referral links remain recognized. New QR codes remain
   revocable by removing the roster entry or rotating signing secret; unlike
   the old expiring short URL, the new printed QR link has no date expiry.
 - Never rotate REFERRAL_SIGNING_SECRET casually: it invalidates existing links.

DASHBOARD
 - Side-by-side Creative Studio / lead performance on desktop.
 - Collapsible sidebar hides fully and persists through reload.
 - Viewport-height shell; Sign out pinned at sidebar bottom; main scrolls.
 - Three stages: Lead Created, Lead Onboarded, Business Started.
 - First file amount comes from the operator-only Google Sheet, exact INR
   up to two decimals; browser shows only the rounded-down first-file band:
   30L+ B, 50L+ B+, 80L+ A, 1Cr+ AA, 1.5Cr+ AAA.
 - Below 30L is displayed as 'Below ₹30L' with no grade until defined.
 - Duplicate mobile -> Duplicate; matching email only -> Maybe Duplicate;
   original lead kept; confirmed Duplicate -> Not Qualified for Payout.
 - DSA scoping remains server-side, with two existing Super Admins only.

EXISTING DATA & SECURITY
 - No leads deleted, prior sheet rows preserved.
 - Supabase tables have RLS and non-public roles denied; Vercel server-side
   secret key is required for data operations.
 - Google Sheet permissions should remain restricted to trusted operations
   users; it previously had domain-wide read access.
 - Do not publish private roster.json in a public GitHub repository.

LOCAL VERIFICATION
 node --test tests/*.test.mjs
 21 tests passed on 2026-11-23.
 Live Clerk/phone QR and two-way Sheet sync require production smoke tests.
