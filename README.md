# NoBroker Loans Referral Website

Standalone static referral website intended for `nbloans-refer.vercel.app`.

## Deployment

1. Create a separate Vercel project named `nbloans-refer`.
2. Upload or connect this folder as the project root. Framework preset: **Other**; build command: none; output directory: `.`.
3. Select the `nbloans-refer.vercel.app` domain if available. Vercel must confirm the domain is available and assigned.

## Referral link configuration

Edit `config.js`. Each participating Vertical Head gets a code and a unique form link:

```js
heads: {
  pawan: { name: "Pawan", formUrl: "https://docs.google.com/forms/d/e/YOUR_FORM/viewform?usp=pp_url&entry.123=PAWAN" }
}
```

Share `https://nbloans-refer.vercel.app/?vh=pawan`. Use a **prefilled** Google Form URL so the VH identifier is carried into the form response. Keep attribution fields in the form protected/validated through your operational process: prefilled Google Forms fields can be edited by users. Never use URL parameters alone as proof of referral ownership.

Without a configured URL, the site does not submit or store personal information and the form CTA stays disabled. This is intentional.

## Scope

- No Supabase, server, API, storage, or third-party script dependencies.
- This is separate from the payout Catalog.
- Actual reward payment, approval, KYC, file eligibility, and tracking happen in your existing internal operations or Google Forms/Sheets workflow.
- ₹5,000 PSU / ₹7,000 private and ₹30 lakh home loan eligibility are displayed as pilot proposals; confirm the definitive terms before launch.
- The wordmark in the demo is a text/CSS approximation only. Replace the header with your exact approved NoBroker Loans logo asset prior to publishing.
