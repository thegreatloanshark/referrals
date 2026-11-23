# Marketing account login: V13 auth diagnostics patch

## What is verified
- `lib/roster.private.json` contains 28 entries, including Marketing (`nbloans.marketing@nobroker.in`, DSA `DSA00100003`, Active).
- The user-provided roster and bundled V13 roster are identical.
- The screenshot shows the site reporting the old generic directory error, while Clerk has `#/tasks/choose-organization` in the URL. That URL does not, on its own, prove a roster mismatch.

## Changes
- `lib/clerk-auth.js`: added `resolveAuthorizedProfile()` that authenticates the Clerk bearer token with the configured backend, retrieves the actual authenticated Clerk user, and matches only verified Clerk email addresses to the private roster. Clear return reasons: `missing_bearer`, `invalid_session`, `no_verified_email`, `email_not_in_roster`, `ambiguous_roster_match`.
- `api/lookup.js`: translates these reasons to distinct `401` / `403` responses with an error message and code. No roster or Clerk user data is leaked in denied responses.
- `public/app.js`: displays the exact API message instead of replacing all roster errors with the misleading generic message.
- Updated one test to reflect the renamed internal variable.

## What this cannot prove from static files
Whether Clerk's currently signed-in user is `nbloans.marketing@nobroker.in`, whether that address is marked verified inside the Clerk user object, whether Clerk requires an organization selection, or whether Vercel is deploying the latest GitHub commit. The browser screenshot cannot resolve these independently.

## Deployment
1. Commit the three runtime files to the SAME GitHub repository used by Vercel, preserving the file paths. The full ZIP also includes the updated test.
2. Confirm the latest Vercel deployment is Ready/Production and that the intended branch is the Production branch.
3. Open the site in an incognito browser window and sign in with the Marketing identity. Finish any Clerk 'Choose organization' task if presented.
4. If access is denied, open Chrome DevTools > Network, select `api/lookup`, and inspect Response > `code` (do NOT share bearer tokens/cookies). Expected reasons listed above.
5. `email_not_in_roster` means the Clerk user has no verified address matching the private roster; compare the email in Clerk Dashboard > Users > Marketing user with the roster and ensure it is verified. `invalid_session` suggests session/Clerk keys/authorized origin configuration; verify CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY belong to the same Clerk instance and REFERRAL_PUBLIC_ORIGIN equals https://nbloans-referrals.vercel.app .
6. If the browser still shows the old exact generic message after deployment, the old `public/app.js` or old API is still deployed or cached.

Do not use a user-supplied email to override roster authentication, and do not disable Clerk verification to solve the problem.
