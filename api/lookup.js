import {authorizedProfile} from '../lib/clerk-auth.js';
import {issueToken,easyQrSlug,json,restrictOrigin} from '../lib/security.js';
export default async function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
 if(!restrictOrigin(req))return json(res,403,{error:'Origin not allowed'});
 try{
  const profile=await authorizedProfile(req);
  if(!profile)return json(res,403,{error:'Sign in with an email registered in the Vertical Head directory.'});
  const token=issueToken(profile);
  const claim=JSON.parse(Buffer.from(token.split('.')[0],'base64url').toString('utf8'));
  return json(res,200,{shortReferralPath:`/r/${easyQrSlug(profile)}`,profile:{name:profile.name,mobile:profile.mobile,dsaCode:profile.dsaCode,designation:profile.designation||'Vertical Head'},token});
 }catch(e){console.error('Clerk lookup unavailable',e?.message);return json(res,503,{error:'Authentication service unavailable.'});}
}
