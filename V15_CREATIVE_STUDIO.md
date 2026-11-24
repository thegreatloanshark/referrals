# V15 Creative Studio — compact branded release

Apply the four `public/` files in this patch together. The test file replaces the previous creative-template test. Merge any newer live edits to those files before deploying. The existing `public/assets/nbl-logo.png` remains the official artwork; the renderer trims transparent padding only and blocks PNG export if the logo cannot load. No new fonts or assets, environment variables, backend migration, spreadsheet change, or Apps Script update are required.

- Ten deterministic 1200 × 1500 canvas templates, including five reference-inspired photo-free layouts. A previously uploaded photo is ignored in those five layouts. Photos are optional in the other five.
- Designation selector: Vertical Head, Zonal Head, Regional Head; changes artwork copy only, not account privileges.
- Five approved headlines and five approved supporting callouts, exactly as provided. The recommended fifth callout is the initial selection. CTA selector remains available.
- Locked reward: ₹5,000 per eligible referral. It is the largest type on every template.
- Locked description: Refer a Loan Partner to NoBroker Loans and earn ₹5,000 when they complete their first qualifying Home Loan disbursement of ₹30 lakh or more and receive their first payout through FastPay. Connect with your Vertical Head for more details.
- Mandatory footer: Referred Loan Partner/DSA must not already exist in NoBroker Loans' records. Minimum ₹30 lakh Home Loan disbursement and first payout received on FastPay. T&Cs apply.
- Brand: approved logo at top left, red #D80000, white #FFFFFF, near-black, pale pink and restrained gold #FFD700 accents; Arimo with Arial/sans-serif fallback. No modifications to the approved logo asset. Creative variation is confined to layout and graphics.
- Compact editor: two-column options/preview layout, locked description expandable, compact buttons, mobile stacking and accessible touch controls. Artwork always includes locked text regardless of editor expansion state.
- Existing personalized QR source and short referral link unchanged. Overview preview, studio canvas and PNG export use the same renderer.

## Verification
35/35 automated tests passed in the complete local source tree. Chromium exported all ten templates at 1200 × 1500 using a mock QR. A static dashboard layout harness verified the download actions fit within the 1366 × 768 and 1024 × 768 viewports and no horizontal overflow at those sizes or 390 × 844. On mobile the content scrolls vertically. These are local tests, not production login or real personalized QR checks. After deploying to a preview, sign in, select all five photo-free templates, select each designation, download a PNG, and scan the actual QR. Verify the prior dashboard role layout and referral form still function. No deployment was performed.
