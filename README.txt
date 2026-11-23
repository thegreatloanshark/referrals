V13 AUTHENTICATION PATCH - TARGETED FILE REPLACEMENT

Replace ONLY the following repository paths with the files in this ZIP:
- lib/clerk-auth.js
- lib/roster.private.json

The API route api/lookup.js from the previous fix already calls
resolveAuthorizedProfile(); this package does not replace other API files.

What's different:
- Clerk bearer session JWT is verified directly against Clerk's signing keys
  via the supported @clerk/backend verifyToken helper.
- The configured REFERRAL_PUBLIC_ORIGIN remains an authorized party.
- The authenticated user ID is derived from a VERIFIED signature and fetched
  from the Clerk backend. Only verified email addresses can match the roster.
- Roster includes 29 entries, including Marketing DSA00100003 and Asad
  DSA00100004; no changes to admin permissions.

IMPORTANT: Correct matching CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY must
be configured in Vercel Production for the same Clerk instance. If one key is
from a different instance, no secure code change can make a session valid.
If CLERK_JWT_KEY is configured, it must also belong to the same instance.
Do not disable verification, do not share secret keys, and do not add a
hardcoded marketing-account bypass.

Deploy the patch to the Production branch and verify first with Shivankur.
The patch has not been deployed or authenticated against your live Clerk
instance from this environment.
