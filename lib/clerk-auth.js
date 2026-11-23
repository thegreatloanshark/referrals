import { createClerkClient } from '@clerk/backend';
import roster from './roster.private.json' with { type: 'json' };

let backend;
export function clerkBackend() {
  const publishableKey=process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!process.env.CLERK_SECRET_KEY || !publishableKey) throw Error('Clerk keys are missing');
  return backend ||= createClerkClient({secretKey:process.env.CLERK_SECRET_KEY,publishableKey});
}

// Only verified email identities returned by the Clerk Backend API may grant
// access to the server-owned VH roster. Browser-supplied names and emails do not.
export async function resolveAuthorizedProfile(req) {
  const bearer=String(req.headers.authorization||'');
  if (!/^Bearer [A-Za-z0-9._\-]+$/.test(bearer)) return {profile:null,reason:'missing_bearer'};
  const origin=process.env.REFERRAL_PUBLIC_ORIGIN || 'https://nbloans-referrals.vercel.app';
  const client=clerkBackend();
  const request=new Request(`${origin}/api/lookup`,{headers:{Authorization:bearer}});
  const state=await client.authenticateRequest(request,{authorizedParties:[origin]});
  if (!state.isAuthenticated) return {profile:null,reason:'invalid_session'};
  const userId=state.toAuth()?.userId;
  if (!userId) return {profile:null,reason:'invalid_session'};
  const user=await client.users.getUser(userId);
  const verifiedEmails=new Set((user.emailAddresses||[])
    .filter(entry => entry.verification?.status === 'verified')
    .map(entry => String(entry.emailAddress||'').trim().toLowerCase())
    .filter(Boolean));
  if (!verifiedEmails.size) return {profile:null,reason:'no_verified_email'};
  const matches=roster.filter(person => verifiedEmails.has(String(person.email||'').trim().toLowerCase()));
  if (matches.length===0) return {profile:null,reason:'email_not_in_roster'};
  if (matches.length>1) return {profile:null,reason:'ambiguous_roster_match'};
  return {profile:matches[0],reason:null};
}

export async function authorizedProfile(req) {
  return (await resolveAuthorizedProfile(req)).profile;
}
