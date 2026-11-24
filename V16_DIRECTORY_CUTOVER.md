# V16 | Vertical Heads directory cutover

## Current state and safety boundary
The supplied V15 repository is the baseline. No changes to frontend design, referral reward, Creative Studio, lead schema, or Database tab stage/payout sync. `lib/roster.private.json` is unchanged. Keep it until end-to-end acceptance. It is private employee data; do not publish this repository/ZIP or move the roster into `public/`.

Live Supabase project `evsmmzkgyuxajoqvdnnj`: the atomic directory RPC migration was applied and its execution grants checked on 24 November 2026. `anon` and `authenticated` cannot execute; only the service role can. Directory had zero rows before cutover. No directory records were manually inserted; no test leads were written. The live Sheet `Referrals - Ongoing - Dec 2026` has a `Vertical Heads` tab with 29 entries, 26 VH and 3 Super Admin roles (DSA00100001, DSA00100002, DSA00100004), and blank statuses at inspection. The role dropdown, not a hardcoded admin list, controls authorization after cutover. Confirm the third Super Admin assignment before enabling production.

## 1. Deploy V16 without switching authorization
1. Apply the ZIP's files to the existing private GitHub repository. Do not replace Vercel secrets or signing key. Keep `lib/roster.private.json`.
2. The live migration is already installed on the project above. For a different project, inspect its schema and run `integration/v16-directory.sql` first.
3. Vercel Settings > Environment Variables: set `VH_DIRECTORY_SOURCE=roster` (also the default if omitted). Preserve `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` or `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`, `REFERRAL_SIGNING_SECRET`, `SHEET_SYNC_SECRET`, `REFERRAL_PUBLIC_ORIGIN`, and existing `SUPER_ADMIN_DSA_CODES`. Do not rotate `REFERRAL_SIGNING_SECRET`; current permanent QR slugs depend on it. Never send these secrets over chat or commit them to source control.
4. Redeploy. Smoke-test existing VH login and QR before running sync. The legacy mode does not honor Sheet roles; it is only the temporary transition mode.

## 2. Enable the directory sync
1. Open the existing Apps Script project linked to the referral spreadsheet. Replace the old contents of the matching referral sync script file with `integration/GoogleAppsScript.gs` (do not add a second copy of the same functions or modify unrelated scripts). The old `syncReferrals` trigger continues to handle the Database tab. Keep its existing script properties `SPREADSHEET_ID`, `REFERRAL_API_BASE`, `SHEET_SYNC_SECRET`.
2. Run `syncVerticalHeads` manually once and inspect Executions. A successful run reads A–D and F from `Vertical Heads`, retrieves exact Clerk email matches, sends an atomic snapshot to Supabase, and writes status only to E. No changes to A–D, F, or existing Database cells.
3. If successful, run `installVerticalHeadSync` once. It immediately re-syncs and installs its own five-minute time trigger without removing the existing lead sync trigger. A malformed/empty/duplicate snapshot or Clerk API failure aborts instead of overwriting the live directory. Protect A–D and F against unauthorized editors (and E against manual editing). Verify the spreadsheet's permissions are restricted to authorized operations personnel; the old setup document flagged a domain-wide reader grant that has not been rechecked here.

### Status and role rules
- Active: matching Clerk account exists and the exact registered email is verified.
- Pending: account missing or exact email not verified.
- Inactive: matching account is banned, locked or disabled; removed Sheet rows are retained in Supabase as inactive historical tombstones with no access role.
- F: `Super Admin` = all referrals; `VH` = own DSA-code referrals; blank = no access. An Active status alone grants nothing. Changes become effective on next successful sync, and signed-in dashboard requests additionally check current Clerk user state.
- The sync observes Clerk; it does not create, ban, delete, or invite Clerk users. Clerk sign-up configuration remains unchanged.

## 3. Verify before cutover
- Confirm E contains only the three allowed statuses for all populated rows, F remains unchanged, and the live directory has 29 current rows (or the actual current Sheet count).
- Confirm both original Super Admins have verified Clerk accounts and Active status; confirm whether the Sheet's third Super Admin assignment is intentional. At least one known admin should be tested before switching production.
- Compare DSA codes in the old roster with the Sheet, including any historical QR holders. Existing signed and permanent QR URLs retain their format and signing algorithm. Only Active rows with a valid role continue accepting public referral links in Supabase mode; Pending/Inactive/blank-role rows' old links stop working. No historical leads are deleted.
- Verify a normal VH, an admin, a blank-role account, an unverified account and a banned account; verify existing QR opens, genuine test submission preserves attribution, leads stay owner-scoped, stage/payout sync still works, and no database credentials or roster contents are served publicly. Use a controlled test account/data where authorized. Local tests use mocks, not live Clerk accounts.

## 4. Cut over and monitor
In Vercel set `VH_DIRECTORY_SOURCE=supabase` and redeploy. Every lookup, dashboard authorization, QR redirect, signed link check and lead attribution now reads the live directory; an unavailable/empty directory does not silently fall back to the roster. Only the configured legacy mode loads the roster. Review Vercel errors and Apps Script executions after cutover; if a real outage blocks access, assess the cause before explicitly switching back to `roster` and redeploying (legacy mode ignores Sheet role changes and revocations, so rollback must be deliberate). Do not delete the file yet. After user acceptance, a subsequent cleanup release can delete the legacy import, `SUPER_ADMIN_DSA_CODES` fallback, and static roster tests/file. Do not simply delete the JSON while legacy mode remains available.

## Verification and limitations
`npm test`: 45 tests passed. All server JS and Apps Script syntax checked under Node 22. The uploaded baseline had two failing legacy OTP tests and stale endpoints importing removed functions; these endpoints now explicitly return 410 (Clerk remains the only sign-in method), and stale cookie clearing is repaired. No new npm dependency was added; Vercel installation/build and live Clerk/Apps Script end-to-end verification still need to be performed. Database security advisors also flagged a pre-existing `public.rls_auto_enable()` security-definer function executable by anon/authenticated; review separately, not changed by this release. The four server-only tables intentionally have RLS enabled and no public policies.
