# V12 easy-scan QR patch

## Changes
- QR encodes a **short authenticated redirect** (`/r/<compact signed code>`) rather than the long `/form?ref=<token>` URL.
- Redirect endpoint reissues the original signed referral token and sends visitors to the same protected form. The compact QR link expires at the same time as the original signed creative (30-day validity), and modified tokens are rejected.
- QR generated at 720 px SVG with a 4-module quiet zone and error correction **M**, retaining solid black on white. Avoid placing text or a logo over the QR itself.
- Copy Referral Link and dashboard share-link widgets now use the short URL.
- No changes to Clerk, Supabase schema, Apps Script or DSA authorization.

## Deployment
Upload changed source files onto the existing V11 repository, commit and deploy through Vercel. All existing QR flyers and links remain functional with the old full URL, while newly generated flyers and QR downloads use short links. If you rotate REFERRAL_SIGNING_SECRET, previously signed links will become invalid.

## Verify
1. Log in to `/vh-only`, regenerate a flyer, scan QR on a phone.
2. Confirm it opens `/form?ref=...` under the same domain and the form works.
3. Confirm new lead has the correct VH DSA code in Supabase.
4. Verify expired or modified short codes show an error, not a referral form.
