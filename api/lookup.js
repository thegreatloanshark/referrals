import {resolveAuthorizedProfile} from '../lib/clerk-auth.js';
import {issueToken,easyQrSlug,json,restrictOrigin} from '../lib/security.js';

const errors={
  missing_bearer:'Your sign-in session was not sent. Please sign in again.',
  invalid_session:'Your Clerk session could not be verified. Sign out and sign in again.',
  no_verified_email:'Please verify the email address on your Clerk account before accessing the dashboard.',
  email_not_in_roster:'Your verified Clerk email is not in the approved Vertical Head directory.',
  ambiguous_roster_match:'Your Clerk account matches multiple approved profiles. Please contact the administrator.'
};
export default async function handler(req,res){
  if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
  if(!restrictOrigin(req))return json(res,403,{error:'Origin not allowed'});
  try{
    const {profile,reason}=await resolveAuthorizedProfile(req);
    if(!profile) return json(res,403,{error:errors[reason]||'Access restricted to approved Vertical Heads.',code:reason||'access_denied'});
    const token=issueToken(profile);
    return json(res,200,{
      shortReferralPath:`/r/${easyQrSlug(profile)}`,
      profile:{name:profile.name,mobile:profile.mobile,dsaCode:profile.dsaCode,designation:profile.designation||'Vertical Head'},token
    });
  }catch(e){
    console.error('Clerk lookup unavailable',e?.message);
    return json(res,503,{error:'Authentication service unavailable. Please contact the administrator.',code:'auth_service_error'});
  }
}
