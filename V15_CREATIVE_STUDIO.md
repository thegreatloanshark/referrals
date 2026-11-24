# V15 Creative Studio update

Apply the files in the patch to the existing repo, preserving unrelated changes. No database migration, Apps Script change, environment variable, or spreadsheet change is required.

- Five new no-photo designs: Reward medallion, Bold contrast, Bonus burst, Torn banner, Abstract reward.
- Five existing photo-template choices remain available; photos are optional. The no-photo layouts ignore any previously uploaded photo.
- Designation dropdown: Vertical Head, Zonal Head, Regional Head. This changes flyer copy only, not authorization or the account's actual role.
- Fixed ₹5,000 per eligible referral as the largest text element, plus a mandatory eligibility panel on every design. Current key terms: referred Loan Partner/DSA must not already exist in NoBroker Loans' records; minimum ₹30 lakh Home Loan disbursement; first payout received on FastPay; T&Cs apply. Full programme terms remain on the referral page.
- Existing headline, supporting callout and CTA selectors remain. The separate description selector is deferred until options are provided.
- The same renderer supplies the overview preview, Creative Studio preview, and downloaded 1200×1500 PNG. Existing server-issued QR and short referral link logic are unchanged.

Verification: 34 automated tests passed; all ten canvases rendered and exported locally in Chromium with a mock QR. Live Clerk sign-in and scanning a real personalized QR still require preview deployment verification. Do not replace unrelated files if your live repo differs.
