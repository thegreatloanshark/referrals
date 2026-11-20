# Google Apps Script and Supabase — integration instructions

## Already created
Supabase project `evsmmzkgyuxajoqvdnnj`: `referral_leads`, `referral_vh_access`, `referral_sync_jobs`, `referral_sheet_columns`. Direct public access is disabled. Google Sheet `Referrals - Ongoing - Dec 2026` has its starting 21 headers. No test leads were written.

## 1. Vercel server environment
Set `SUPABASE_URL=https://evsmmzkgyuxajoqvdnnj.supabase.co`, `SUPABASE_SECRET_KEY=<server-only Supabase secret key>`, `SHEET_SYNC_SECRET=<new random 32+ char shared secret>`, and `SUPER_ADMIN_DSA_CODES=<exact verified codes from current roster>`. Preserve Clerk and `REFERRAL_SIGNING_SECRET` values already deployed. Never use the supplied publishable key as a privileged backend key, or prefix the secret with `NEXT_PUBLIC_`.

## 2. Bring code into existing GitHub project
Apply the overlay ZIP to the repository; do not overwrite `lib/roster.private.json` because the GitHub version now includes Aditya. Confirm the current roster contains both admins and their DSA codes before setting `SUPER_ADMIN_DSA_CODES`. Deploy to Vercel.

## 3. Apps Script
In the provided Apps Script project, add a new script file with `integration/GoogleAppsScript.gs` contents (do not replace other scripts blindly). In **Project Settings → Script Properties**, add:

- `REFERRAL_API_BASE`: `https://nbloans-referrals.vercel.app`
- `SHEET_SYNC_SECRET`: exactly the same private value configured in Vercel
- `SPREADSHEET_ID`: `1yDQR7YRp5ehGxUyyla34CVLyeArsMXjZ4H7PWzc_Kbg`

Run `installReferralSync` once under an account with edit access to the Sheet; approve the standard Apps Script spreadsheet and URL Fetch permissions. It installs a five-minute trigger. The Script must have actual editor permission; a script cannot bypass Workspace restrictions. Do not publish its shared secret in code or GitHub.

## 4. Data movement
- Public `/form?ref=<signed-token>` → Vercel `/api/lead-create` → Supabase `referral_leads` with server timestamp and frozen, validated DSA attribution.
- The Supabase trigger queues each insertion/change in `referral_sync_jobs`.
- Apps Script polls the private Vercel `/api/internal/sheet-sync` endpoint, writes to the Sheet, then acknowledges the exact record version.
- Apps Script reads operator-edited Yes/No stages and additional columns and writes those changes back to Supabase JSONB fields, without a DB migration for every new column.
- Vercel `/api/dashboard` queries only the authenticated user's DSA rows. Only DSA codes explicitly listed in `SUPER_ADMIN_DSA_CODES` have all-lead access.

## 5. Testing
1. Sign in as an ordinary VH. Dashboard must start with zero or own-lead records only.
2. Submit a genuine test referral using a signed QR and verify it appears as `Lead Created` in Supabase.
3. Manually run `syncReferrals` and verify it appears once in Sheet.
4. Change `Qualified` to `Yes` and run `syncReferrals` again; verify the Supabase stage JSON and dashboard count update.
5. Sign in as another VH: they must not see the first person's lead.
6. Sign in as both admins and confirm access to all lead records.

## Limitations
Apps Script deployment is not remotely editable from the available integration tools. Its editor URL alone does not grant script-file write access. The Google Sheet schema is initialized, but the Apps Script code must be pasted and authorized before synchronization runs. Supabase server credentials must be added privately to Vercel. This implementation is a pilot: add rate limiting, deduplication, privacy/retention controls, retry dashboards, and pagination before scaling.

## Privacy blocker observed on the provided Sheet
Google Drive permission metadata currently shows a **domain-wide reader grant** for `doxlink.com`, in addition to the named owner. Do not enable real customer-data synchronization until that permission is restricted to specifically authorized operations personnel. Supabase and dashboard access controls do not protect a separately shared spreadsheet.
