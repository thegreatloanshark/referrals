# V15 — App code aligned to final live Database worksheet

**Do not change the live Google Sheet column structure.** Required sheet headers (29 total): Lead ID, VH Code, VH Name, Referrer Name, Referrer DSA Code, Referrer Mobile, Referrer Email, Referrer City, Referred Name, Referred Mobile, Referred Email, Referred City, Lead Status, First File Amount (INR), First File Status, Referral Payout Generated, Last Updated, Total Timeline, Duplicate Label, Original Lead ID, Created At, Token Fingerprint, Landing URL, Consent, UTM Source, UTM Medium, UTM Campaign, UTM Content, UTM Term.

## Changes
- Searchable native city-picker suggestions on both form city fields; typed cities outside suggestions remain accepted. No new database fields.
- Apps Script now uses the existing 29-column sheet schema and reads merged Lead Status, FastPay status and referral payout status.
- The sync API accepts those fields, enforces the disbursement/FastPay business rule before setting referral payout to Yes, and captures its first timestamp.
- Total Timeline is the count of elapsed whole days from created_at to the first payout-generated timestamp. Blank before payout.
- Historical stage details were retained in the pre-schema workbook backup; running the old migration function against the live sheet is not supported.

## Ordered deployment (not yet done)
1. Back up Supabase. Confirm V14 SQL migration was applied and Supabase has referrer_dsa_code.
2. Apply `integration/v15-payout-timestamp.sql` in Supabase SQL Editor.
3. Deploy these repository changes to a Vercel preview; keep current Clerk authentication keys unchanged.
4. Replace code in the linked DSA Referrals Apps Script project with `integration/GoogleAppsScript.gs`, preserving script properties; do NOT install trigger yet.
5. In a staging copy of the workbook, run `syncReferrals`, verify lead creation, updates, fastpay/status progression, no field clobbering and the payout timestamp calculation.
6. Deploy to production and enable the existing five-minute scheduled `syncReferrals` trigger.

## Important open safeguards
- Manual existing-partner/referrer-code checks are not yet represented as verified approval gates, so an operator should not set payout Yes until the manual checks pass. Implement auditable manual checks before automatic payment execution.
- The live site still has a code-coupled local VH roster. Migrating authority from JSON to Google Sheets → Supabase is a separate outstanding V14 task; not silently done here.
- Apps Script writes can race edits during the sync interval. Avoid editing while the sync runs and implement optimistic concurrency/row revision if concurrent editors become common.
- This package updates repo files only, not Supabase, Apps Script deployment or live Google Sheets.
