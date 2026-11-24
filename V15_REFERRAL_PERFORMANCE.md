# V15 referral performance — current stage split

Replace these four files together:
- api/dashboard.js
- public/dashboard.js
- public/vh-only.html
- public/styles.css

This patch is based on the branded compact Creative Studio revision with the Remove Image patch applied. Merge any later local edits to these files. No schema, Sheet, Apps Script, authentication, or QR changes are required.

Total leads includes all referral records in the viewer's existing authorized scope, including duplicates. Each lead is counted once at the highest completed stage (Business Started > Lead Onboarded > Lead Created). The My Referrals stage filter now matches the current stage, not cumulative flags. Legacy Qualified flags are ignored. The API fetches additional pages if the normal 1,000-row page is full; large-volume performance has not been load-tested. The browser also derives the counts from the authorized rows to avoid relying on older cumulative counts.

Local tests: 39/39 passed, including simulated multi-page access and exclusive filtering. Production and visual browser verification are pending. Expected example: cumulative 3 / 2 / 1 becomes total 3 and current stages 1 / 1 / 1.
