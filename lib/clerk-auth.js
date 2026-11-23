import { createClerkClient } from '@clerk/backend';
import roster from './roster.private.json' with { type: 'json' };

let client;
export function clerkBackend() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!secretKey || !publishableKey) throw new Error('Missing Clerk backend configuration');
  return client ||= createClerkClient({ secretKey, publishableKey });
}

function publicOrigin() {
  const parsed = new URL(process.env.REFERRAL_PUBLIC_ORIGIN || 'https://nbloans-referrals.vercel.app');
  if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') throw new Error('Invalid referral public origin');
  return parsed.origin;
}

// Authenticates using Clerk's request-level API. Never trust unverified JWT
// claims or browser-submitted email addresses for membership decisions.
export async function resolveAuthorizedProfile(req) {
  const authorization = String(req.headers?.authorization || '');
  if (!/^Bearer [A-Za-z0-9._-]+$/.test(authorization)) return { profile: null, reason: 'missing_bearer' };
  const origin = publicOrigin();
  const headers = new Headers({ authorization });
  const request = new Request(`${origin}/api/lookup`, { method: 'GET', headers });
  let auth;
  try {
    const result = await clerkBackend().authenticateRequest(request, {
      authorizedParties: [origin],
      acceptsToken: 'session_token',
    });
    if (!result.isAuthenticated) {
      console.error('Clerk request authentication rejected:', String(result.reason || result.status || 'unknown'));
      return { profile: null, reason: 'invalid_session' };
    }
    auth = result.toAuth();
  } catch (error) {
    // Server-side only: reports the useful exception without leaking credentials.
    console.error('Clerk authenticateRequest error:', error?.name, error?.message);
    return { profile: null, reason: 'clerk_backend_error' };
  }
  if (!auth?.userId) return { profile: null, reason: 'invalid_session' };
  let user;
  try {
    user = await clerkBackend().users.getUser(auth.userId);
  } catch (error) {
    console.error('Clerk user lookup error:', error?.name, error?.message);
    return { profile: null, reason: 'clerk_user_lookup_error' };
  }
  const emails = new Set((user.emailAddresses || [])
    .filter(item => item.verification?.status === 'verified')
    .map(item => String(item.emailAddress || '').trim().toLowerCase())
    .filter(Boolean));
  if (!emails.size) return { profile: null, reason: 'no_verified_email' };
  const matches = roster.filter(person => emails.has(String(person.email || '').trim().toLowerCase()));
  if (!matches.length) return { profile: null, reason: 'email_not_in_roster' };
  if (matches.length > 1) return { profile: null, reason: 'ambiguous_roster_match' };
  return { profile: matches[0], reason: null };
}
export async function authorizedProfile(req) {
  return (await resolveAuthorizedProfile(req)).profile;
}
