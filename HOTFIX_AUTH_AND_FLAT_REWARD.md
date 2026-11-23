# V13 urgent correction — login outage and flat reward

## Authentication outage root cause
`api/lookup.js` imported `resolveAuthorizedProfile` but invoked a nonexistent `authorizedProfile` identifier. Every logged-in user therefore received a 503 `Authentication service unavailable` from the catch block. This is a code regression, not a missing roster account. Fixed by calling `resolveAuthorizedProfile(req)` and reading `{profile,reason}`. Existing `lib/clerk-auth.js` continues to check verified Clerk user email against the server-owned roster; super-admin and DSA ownership restrictions are unchanged. The lookup endpoint now reports a 403 with a meaningful denial code if authentication genuinely fails.

## Campaign amount
One flat ₹5,000 reward applies to every eligible referral; no public/private bank split. Updated both homepage routes and the canvas creative generator used by all five flyer templates. Homepage CTA text and button are aligned horizontally on desktops and stack on narrow screens. First-file requirement and other existing campaign eligibility wording remain.

## Deploy
Upload/commit the files in this ZIP to the same GitHub repo root (keep the directory structure). Wait until Vercel reports the new production deployment Ready. Hard refresh `/vh-only`, then test Shivankur and Marketing accounts. If a 503 remains after deploying, check the deployment function logs for `Clerk lookup unavailable` to identify environment/API failures (do not send authentication tokens). No additional Supabase migration or Apps Script update is required for this hotfix.
