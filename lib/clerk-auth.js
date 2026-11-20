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
  const verified = user.emailAddresses?.find(x => x.id === user.primaryEmailAddressId && x.verification?.status === 'verified');
  if (!verified) return null;
  const email = verified.emailAddress.trim().toLowerCase();
  return roster.find(x => x.email?.trim().toLowerCase() === email) || null;
}
