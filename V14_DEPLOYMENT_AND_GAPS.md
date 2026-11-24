# NoBroker Loans Referrals — V14 proposed release

Based on the user-supplied `referrals-main.zip` (source archive date 23 November 2026). **NOT live-deployed or production-verified.**

## Implemented

1. Preserves the public `/` campaign experience and the separate signed-link `/form` experience. The `/form` page now has side-by-side referral registration and independently scrolling programme terms on wide screens, stacking on phones. T&C consent is required in the browser and server.
2. Form order: Referrer Name, Referrer DSA Code, Referrer Mobile, Referrer Email, Referrer City, Referred Name, Referred Mobile, Referred Email, Referred City, consent. Signed VH attribution is independent of the manually supplied referrer code.
3. Supabase `referrer_dsa_code` field plus indexing/backfill from any already-recorded `form_answers.referrerDsaCode`, without renaming the original `dsa_code` ownership column.
4. Authorized dashboard API, My Referrals table, search, lead details and CSV export show separate VH Code and Referrer DSA Code.
5. VH Profile & Setup contains internal-only responsibilities removed from public terms. Public reward terms and monthly processing clauses appear in the form; pending-policy details remain listed below.
6. Mobile VH drawer with visible close button, backdrop, outside dismissal, closed by default on mobile; desktop preference preserved.
7. Apps Script V14 designed for `Database` tab with `VH Code`, `Referrer DSA Code`, `Referred City`, and consent as the final fixed column. It preserves the legacy sheet via explicit copy-first migration. Source `Sheet1` is not overwritten. Qualified is absent from the new Database table but remains in the untouched historical tab.
8. Retired unused OTP HTTP endpoints and mailer, which existed alongside the Clerk login and caused pre-existing tests to fail. Clerk sign-in and token verification code is unchanged.
9. Entire test suite: `node --test tests/*.test.mjs` => **29 passed, 0 failed**. These are source/unit regression tests; no live Clerk, Supabase, Google Workspace, responsive browser, or Vercel e2e verification was run.

## Deployment ORDER — do not simply push and assume production will work

**Preflight:** Export/backup Supabase `referral_leads`, `referral_sync_jobs`, related SQL functions, and the complete Google workbook. Confirm the current Apps Script deployment and triggers and save a copy. Check rollout environment variables are intact. Never paste keys into a ticket or commit.

1. **Run** `integration/v14-referral-database.sql` manually in Supabase SQL Editor. Verify `referrer_dsa_code` exists. This must happen **before** deploying new API code or form submissions will fail on INSERT.
2. **Google Sheets:** in a COPY of the live workbook, paste `integration/GoogleAppsScript.gs` into the Apps Script project. Set existing Script Properties `REFERRAL_API_BASE`, `SHEET_SYNC_SECRET`, and `SPREADSHEET_ID` to sandbox/test values. Stop/disable old scheduled trigger. Manually run `migrateReferralDatabaseV14()` once. It creates a `Database` worksheet by copying legacy `Sheet1` and restructuring column headers, leaving `Sheet1` intact. Inspect row counts, original IDs and amounts, and the untouched `Vertical Heads` tab. Ensure no prior `Database` tab exists (script aborts if one exists). Then run `syncReferrals()` manually and inspect both directions. Repeat these steps in live workbook only after signoff. Run `installReferralSync()` once; it sets a 5-minute trigger.
3. **Deploy** repository to a Vercel preview deployment first, with Supabase migration already applied; test Clerk logins for Marketing and Shivankur, both QR/signed-form paths, two new leads, duplicate classification, VH ownership, and editing First File Amount in Sheets flowing back to Supabase. Inspect runtime logs for errors. Allow a normal scheduled sync to insert new leads into `Database`.
4. **Promote to production** only after preview end-to-end tests, access-permission review, and rollback plan are signed off. Backout: restore prior Vercel deployment and prior Apps Script code/trigger; preserve the new column (a backwards-compatible additive migration); do not delete historical records.

## Information and policy gaps to resolve together

| Priority | Gap / decision needed | Why it matters |
| --- | --- | --- |
| BLOCKER | Confirm the exact approved public T&Cs. The source programme document keys eligibility to first *FastPay payout*, while the existing website/lead grading uses first qualifying Home Loan disbursement of at least ₹30 lakh. Clarify whether both conditions apply and whether the ₹30 lakh minimum must appear in the form terms. | Avoid inconsistent payout messaging and automated reward calculations. |
| BLOCKER | Verify who can receive the ₹5,000 reward: referrer vs referred partner; and whether the 'first payout only' rule means once per *referred partner* or once per *referrer*. | Current terms are paraphrased from an ambiguous internal document; payout must not be automated on assumptions. |
| BLOCKER | Define authoritative existing-partner registry for excluding existing DSAs and how to check on registration: phone, email, partner ID, manual review. | A disclaimer alone does not prevent ineligible leads; current duplicate check is among referral leads, not full NoBroker Loans roster. |
| HIGH | Define how a manually entered Referrer DSA Code is verified (directory lookup, account ownership, referrer mismatch handling). | Currently validated for syntax only, not independently proven to belong to the referrer. |
| HIGH | Choose source of truth and change authority for `Vertical Heads` tab vs private JSON roster; decide whether to migrate identities to Supabase and how disabled/exit accounts work. | Today Clerk authorization still relies on server-owned JSON; changing the Sheet does NOT update account access. |
| HIGH | Confirm all existing `Database` headers/columns and historical sheet edits; controlled migration needs actual live workbook review and a trial against a full backup. | Avoid accidental overwrites, stale headers, lost custom columns, or failed scripts. |
| HIGH | Confirm reconciliation policy and conflict rules for bi-directional sync (simultaneous sheet/backend edits), monitoring, alerting, retries, and volume expectations. | Current time-driven polling is not real-time, and conflicting human edits can require intervention. |
| HIGH | Confirm Super Admin vs Marketing ability to submit test and production leads, reporting attribution, and permissions. | Form is accessible through any signed VH link; Marketing acts via its approved account and QR, not a special bypass. |
| MEDIUM | Approve exact contest eligibility, announcement dates and prizes. | The supplied terms contain only a generic contest statement. |
| MEDIUM | Mobile usability and one-screen desktop form tests with real devices / browsers; confirm accessibility and very short displays. | CSS tests do not prove real world layout. |

## Compatibility / restrictions

- The built archive uses the supplied repo as source. If your currently deployed repo changed after that ZIP was created, compare changes before merging.
- Do not rename Supabase `referral_leads.dsa_code`. It represents the VH Code and is already referenced by signed-token attribution, row filtering and old records.
- Do not edit the legacy `Qualified` header in live `Sheet1`; older script versions expect it. The new workflow uses the new `Database` tab.
- The new Forms UI does not itself validate membership against the entire existing Loan Partner directory. It does not automatically generate referral payouts.
- No credentials or connection strings were written to this update.
