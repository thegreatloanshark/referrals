import { createClerkClient } from '@clerk/backend';
import roster from './roster.private.json' with { type: 'json' };

let backend;
export function clerkBackend() {
  if (!process.env.CLERK_SECRET_KEY || !(process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)) throw Error('Clerk keys are missing');
  return backend ||= createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: (process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY),
  });
}

// Never trust the email/mobile posted by the browser. Authenticate the bearer
// token, fetch the actual verified primary email from Clerk, then match roster.
export async function authorizedProfile(req) {
  const bearer = String(req.headers.authorization || '');
  if (!/^Bearer [A-Za-z0-9._\-]+$/.test(bearer)) return null;
  const origin = process.env.REFERRAL_PUBLIC_ORIGIN || 'https://nbloans-referrals.vercel.app';
  const client = clerkBackend();
  const request = new Request(`${origin}/api/lookup`, { headers: { Authorization: bearer } });
  const state = await client.authenticateRequest(request, { authorizedParties: [origin] });
  if (!state.isAuthenticated) return null;
  const userId = state.toAuth()?.userId;
  if (!userId) return null;
  const user = await client.users.getUser(userId);
  // The Clerk user's display name and primary-email selection are not our
  // authorization identity. Only *verified* email addresses may match the
  // server-owned roster, so a verified secondary address is also accepted.
  const verifiedEmails = (user.emailAddresses || [])
    .filter(item => item.verification?.status === 'verified')
    .map(item => String(item.emailAddress || '').trim().toLowerCase());
  if (!verifiedEmails.length) return null;
  const matched = roster.filter(person => verifiedEmails.includes(String(person.email || '').trim().toLowerCase()));
  // Never select a random DSA if one Clerk account matches multiple roster users.
  if (matched.length !== 1) return null;
  return matched[0];
}
