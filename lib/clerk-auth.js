import { createClerkClient, verifyToken } from '@clerk/backend';
import roster from './roster.private.json' with { type: 'json' };

let client;
export function clerkBackend() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!secretKey || !publishableKey) throw new Error('Clerk server keys are missing');
  return client ||= createClerkClient({ secretKey, publishableKey });
}

function authOrigin(req) {
  // Only the configured public application origin is an accepted JWT authorized party.
  // Do not trust arbitrary user-controlled Host or Origin headers for this check.
  const url = new URL(process.env.REFERRAL_PUBLIC_ORIGIN || 'https://nbloans-referrals.vercel.app');
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') throw new Error('Invalid REFERRAL_PUBLIC_ORIGIN');
  return url.origin;
}

function diagnostic(error) {
  // Never include JWTs, secret keys, request headers or token contents in logs.
  const raw = String(error?.message || 'No error message');
  return { name: String(error?.name || 'Error'), code: String(error?.code || error?.reason || 'n/a'), message: raw.slice(0, 350) };
}

export async function resolveAuthorizedProfile(req) {
  const bearer = String(req.headers?.authorization || '');
  const matched = /^Bearer ([A-Za-z0-9_.-]+)$/i.exec(bearer);
  if (!matched) return { profile: null, reason: 'missing_bearer' };

  let claims;
  try {
    const options = { secretKey: process.env.CLERK_SECRET_KEY, authorizedParties: [authOrigin(req)] };
    if (!options.secretKey) throw new Error('CLERK_SECRET_KEY is missing');
    // Public-key verification using Clerk's documented SDK method. Do not
    // create a synthetic Request or rely on the Clerk cookie handshake.
    claims = await verifyToken(matched[1], options);
    if (!claims?.sub) return { profile: null, reason: 'invalid_session' };
  } catch (error) {
    console.error('Clerk JWT verification error:', diagnostic(error));
    return { profile: null, reason: 'invalid_session' };
  }

  let user;
  try {
    user = await clerkBackend().users.getUser(claims.sub);
  } catch (error) {
    console.error('Clerk getUser error:', diagnostic(error));
    return { profile: null, reason: 'clerk_user_lookup_error' };
  }

  const verifiedEmails = new Set((user.emailAddresses || [])
    .filter(email => email.verification?.status === 'verified')
    .map(email => String(email.emailAddress || '').trim().toLowerCase())
    .filter(Boolean));
  if (!verifiedEmails.size) return { profile: null, reason: 'no_verified_email' };

  const matchingProfiles = roster.filter(person =>
    verifiedEmails.has(String(person.email || '').trim().toLowerCase()));
  if (!matchingProfiles.length) return { profile: null, reason: 'email_not_in_roster' };
  if (matchingProfiles.length !== 1) return { profile: null, reason: 'ambiguous_roster_match' };
  return { profile: matchingProfiles[0], reason: null };
}

export async function authorizedProfile(req) {
  return (await resolveAuthorizedProfile(req)).profile;
}
