# V15 dashboard layout refinement — 24 November 2026

Source: NoBroker Loans Referrals V15 repository. This release only changes:
- `public/dashboard.js`
- `public/styles.css`
- `api/dashboard.js`
- tests documenting new role-sensitive layout.

## Regular Vertical Head
**Table columns:** Referred Partner, Referrer (Name + Referrer DSA Code; Mobile/Email/City under an expandable disclosure), Lead Status, Duplicate Status, Referral Payout Status, Details.

**Details panel:** Lead ID, all four referred-partner fields (name/mobile/email/city), and the exact first-file amount (only if recorded, otherwise blank). The Business Band, File Grade, consent, additional form answers, and redundant status metadata do not appear in regular VH Details.

**Security:** Scope enforcement remains server-side by verified Clerk viewer's VH Code. Exact amounts are returned only on the already-authenticated and ownership-scoped dashboard endpoint. This is not a public URL.

## Super Admin
**Table:** Retains Lead ID, Created date, VH Code, referral/referred partner information, Lead Status, Duplicate Status, Referral Payout Status, and First File Band/Grade. Referrer Mobile/Email/City are collapsed beneath Referrer Name/DSA Code.

**Details:** Retains Lead ID, creation date, VH and referrer identifiers and contact information, all referred-partner details, status/duplicate/payout, exact first-file amount, Band, Grade, and remaining form answers including consent. No fields have been deleted from the Super Admin's Details view.

## Band/grade diagnosis
This is a derived reporting calculation, NOT a Google Sheets column or database schema requirement.
- `lib/lead-quality.js` calculates `₹50L+` and `B+` for ₹65,00,000.
- `api/dashboard.js` calculates it only for `business_started` leads with an amount.
- For null first_file_amount the UI correctly shows a dash (not a fabricated grade).
- Existing live Supabase rows were read-only inspected and contained one Business Started lead with `first_file_amount=6500000.00` and two rows with null amount as of the investigation.
- If the authorized Super Admin still sees dashes for the eligible ₹65 lakh row, inspect the deployment version and `/api/dashboard` response; don't migrate or overwrite the amount again without further evidence.

## Deployment
Deploy the three changed source files (or merge the complete repository) to Vercel Preview, sign in as an ordinary Vertical Head AND a Super Admin, inspect Overview and My Referrals, then promote if confirmed. No database or Google Sheet changes are required for this UI update. Run `npm test` (32 tests). This package is NOT deployed to production by this artifact creation.
