# V11 — Demo layout integrated with authenticated VH dashboard

Deploy the **entire V11 package** into the existing `thegreatloanshark/referrals` repository, replacing the corresponding files (keep the existing Vercel environment secrets, Supabase and Apps Script settings). V11 includes an updated 27-person `lib/roster.private.json` supplied by the user and the V10 direct-login fix.

## What changed
- `/vh-only` shows the demo-inspired sidebar, overview KPI cards, referral funnel, secure link sharing panel, leads table, CSV export, detailed lead drawer, Creative Studio and profile section once the signed-in Clerk user is authorized.
- The dashboard reads **real** `/api/dashboard` data. Empty counts are 0; no invented data. The backend applies role/DSA scope on the server.
- Shivankur (DSA00100001) and Adityaman (DSA00100002) are Super Admins by default, after Clerk verification and roster matching. `SUPER_ADMIN_DSA_CODES` Vercel variable, if configured, overrides the defaults; set it to `DSA00100001,DSA00100002` in that case.
- `/form?ref=...` now has **Refer Another Loan Partner** after a successful submission. This clears the input fields and consent checkbox, retains the validated referral token from the URL, and POSTs a separate lead on every new submission. No duplicate protection is introduced.
- No change to Supabase schema, Google Sheet fields, or Apps Script.

## Security / operations
- Never put Supabase secret or sheet sync secret in GitHub. Keep as Vercel environment variables.
- Keep the repository private: `lib/roster.private.json` contains personal contact information.
- Only use referral form for people who have granted the required consent.
- Production sign-in and lead creation must be smoke-tested in browser after Vercel deployment; local automated tests verify code behavior but are not end-to-end checks.
- Direct /vh-only access remains guarded by Clerk + roster; /form remains restricted to a signed referral token.
