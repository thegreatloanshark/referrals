# V10 — Direct Vertical Head Login Redirect Fix

**Target:** `https://nbloans-referrals.vercel.app/vh-only`

V9 mounted the Clerk sign-in UI without explicitly defining the post-sign-in destination. Clerk defaults can send signed-in users to `/`. V10 pins both sign-in and sign-up success/fallback destinations to `/vh-only`, including during Clerk initialization. It does not change the Vercel route rewrite, private roster, Supabase authorization, referral tokens, or dashboards.

## Recommended deployment (minimal)
Replace only `public/clerk-login.js` in the current GitHub `referrals` repository with the file in this package, commit and wait for Vercel to deploy. **Do not overwrite a newer `lib/roster.private.json`.** Keep existing secrets unchanged.

## Verify
1. Open `/vh-only` in a fresh browser tab. If already signed in, the workspace should load directly.
2. If signed out, sign in. Clerk should return to `/vh-only` rather than `/`.
3. Refresh the page and open the same URL again.
4. Sign out and confirm the Clerk sign-in card is shown on `/vh-only`.

If it still goes to the home page *before the sign-in component displays*, capture the browser's address bar and Vercel request logs for `/vh-only`; that would indicate an independent deployment/edge redirect outside this JS patch.

Tests: `npm test` (Node 20+).
