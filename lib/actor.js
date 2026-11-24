import { authorizedProfile } from './clerk-auth.js';
export function accessRole(profile){return ['vh','super_admin'].includes(profile?.role)?profile.role:'denied';}
export async function actor(req){
 const profile=await authorizedProfile(req);const role=accessRole(profile);
 return role==='denied'?null:{profile,dsaCode:profile.dsaCode,role};
}
