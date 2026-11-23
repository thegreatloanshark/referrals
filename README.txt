V13 Clerk token verification repair (targeted)

Production logs:
- Older code: "Clerk token verification failed: TypeError"
- Latest code: "Clerk request authentication rejected: unexpected-error"

The current code passes a synthetic Request to Clerk's authenticateRequest(), which is returning unexpected-error. This patch removes that path and uses Clerk's documented verifyToken() to verify the real signed bearer JWT from public/clerk-login.js, followed by Clerk getUser() and a strict verified-email roster match.

Replace ONLY lib/clerk-auth.js in the current V13 repository. Keep your existing current lib/roster.private.json, all other files, and all environment keys unchanged. The roster copy here is provided only for local tests; do not overwrite an up-to-date roster with it.

Validation: JavaScript syntax check passed; live Clerk verification cannot be verified without a valid user JWT or access to the production runtime. If the call still fails, a NEW server log entry will now include the exact error name, code, and safe error message; never share credentials, Authorization values, or cookies.

Importantly: an authentication status of 200 for /api/lookup under an authorized account is required before claiming this repaired production sign-in.
