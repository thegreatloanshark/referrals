# NoBroker Loans Referral Website

Deploy this static folder to the `nbloans-refer.vercel.app` Vercel project.

## Included
- In-page referral form with seven required fields (referrer name, registered mobile, email, city; referred Loan Partner name, mobile, email) and required consent.
- Validation for Indian 10-digit mobile numbers (starting 6-9), email, and mandatory fields.
- Automatic Vertical Head attribution from `?vh=code` (not a visible question).
- UTM link builder, QR downloads, downloadable 1200 x 1500 creative, WhatsApp sharing.
- No Supabase, tracking backend, cookies, or local storage.

## Connecting submissions

The site intentionally does not store any submitted details. To enable a real submission, populate `config.js` with each approved Vertical Head's Google Form URL and the seven Google Forms `entry.<number>` field identifiers. The site will prefill that form and **redirect users to review and press Submit in Google Forms**. Each form must have matching questions; optional `attributionEntry` can capture the VH code in Google Forms. The source parameter is not independently verified.

Without this configuration the form visibly explains that submissions are unavailable; it does not claim to have submitted or saved a referral. A Google Form `forms.gle` short link does not normally support field prefilling: use the long `/viewform` URL with entry IDs.

To get IDs, in Google Forms use **Get pre-filled link**, enter sample values, generate URL, and copy the `entry.123...` keys for each field. Actual Form sharing permissions and response access are configured inside Google Forms.

## Deploy
Upload this directory to the existing Vercel project, or connect a Git repository and deploy the static root. No build command required.
