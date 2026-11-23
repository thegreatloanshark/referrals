V13 Clerk TypeError targeted replacement

The live Vercel log (2026-11-23) reports `Clerk token verification failed: TypeError` on GET /api/lookup.
The previously supplied lib/clerk-auth.js directly calls verifyToken and suppresses the underlying TypeError message.

This patch replaces ONLY lib/clerk-auth.js and uses createClerkClient().authenticateRequest() instead of the direct verifyToken path. It authenticates the Bearer session token against the configured REFERRAL_PUBLIC_ORIGIN. It requires a verified Clerk email to match the existing approved roster and keeps the `authorizedProfile` and `resolveAuthorizedProfile` exports used by the current APIs. It logs server-side error.name and error.message safely for any remaining failure.

Deployment:
1. Replace lib/clerk-auth.js in the GitHub repository, commit and deploy to Vercel Production.
2. Do NOT change the roster, Clerk keys, other API files, or homepage.
3. Sign in with an approved account and verify /api/lookup returns 200.
4. If the request still fails, obtain the NEW Vercel function log with its message (never share cookies or tokens).

CAUTION: We can verify the code syntax but cannot verify authentication against your private Clerk instance in this environment. This is a targeted implementation change based on the known failing token-verification path, not a verified production fix.
