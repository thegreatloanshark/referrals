import { authorizedProfile } from './clerk-auth.js';

// Clerk verifies the actual signed-in user. The approved server-owned roster
// establishes identity and DSA ownership; names typed by the user do not.
export function accessRole(profile) {
  if (!profile?.dsaCode) return 'denied';
  const codes = new Set((process.env.SUPER_ADMIN_DSA_CODES || 'DSA00100001').split(',').map(x=>x.trim()).filter(Boolean));
  return codes.has(profile.dsaCode) ? 'super_admin' : 'vh';
}
export async function actor(req) {
  const profile = await authorizedProfile(req);
  if (!profile) return null;
  return {profile, dsaCode:profile.dsaCode, role:accessRole(profile)};
}
