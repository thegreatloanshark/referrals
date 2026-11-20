import {json} from '../lib/security.js';
export default function handler(req,res){
  if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
  const key=(process.env.CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  if(!key || !/^pk_(test|live)_/.test(key)) return json(res,503,{error:'Clerk is not configured.'});
  return json(res,200,{publishableKey:key});
}
