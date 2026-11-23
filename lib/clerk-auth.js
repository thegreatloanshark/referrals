import { createClerkClient, verifyToken as verifyClerkToken } from '@clerk/backend';
import roster from './roster.private.json' with { type: 'json' };

let backend;
export function clerkBackend() {
  const publishableKey = process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey || !process.env.CLERK_SECRET_KEY) throw Error('Missing Clerk publishable or secret key');
  return backend ||= createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY, publishableKey });
}

// Verify the actual bearer token's signature using Clerk's public keys. This
// avoids relying on Clerk's browser-cookie handshake in a serverless API.
// The signed 'sub' is the user ID, never a user-provided email or name.
export async function resolveAuthorizedProfile(req) {
  const bearer = String(req.headers.authorization || '');
  const match = /^Bearer ([A-Za-z0-9._-]+)$/.exec(bearer);
  if (!match) return {profile:null,reason:'missing_bearer'};
  const origin = new URL(process.env.REFERRAL_PUBLIC_ORIGIN || 'https://nbloans-referrals.vercel.app').origin;
  const client = clerkBackend();
  let claims;
  try {
    claims = await verifyClerkToken(match[1], {
      secretKey: process.env.CLERK_SECRET_KEY,
      ...(process.env.CLERK_JWT_KEY ? {jwtKey:process.env.CLERK_JWT_KEY} : {}),
      authorizedParties: [origin]
    });
  } catch (error) {
    console.error('Clerk token verification failed:',error?.code || error?.name || 'verification_failed');
    return {profile:null,reason:'invalid_session'};
  }
  if (!claims?.sub || typeof claims.sub !== 'string') return {profile:null,reason:'invalid_session'};
  const user = await client.users.getUser(claims.sub);
  const verifiedEmails = new Set((user.emailAddresses || [])
    .filter(item => item.verification?.status === 'verified')
    .map(item => String(item.emailAddress || '').trim().toLowerCase())
    .filter(Boolean));
  if (!verifiedEmails.size) return {profile:null,reason:'no_verified_email'};
  const matchingProfiles = roster.filter(person =>
    verifiedEmails.has(String(person.email || '').trim().toLowerCase()));
  if (!matchingProfiles.length) return {profile:null,reason:'email_not_in_roster'};
  if (matchingProfiles.length !== 1) return {profile:null,reason:'ambiguous_roster_match'};
  return {profile:matchingProfiles[0],reason:null};
}
export async function authorizedProfile(req) {
  return (await resolveAuthorizedProfile(req)).profile;
}
