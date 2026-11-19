import {rosterByMobile,issueToken,secureCompare,json,restrictOrigin} from '../lib/security.js';
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 if(!restrictOrigin(req))return json(res,403,{error:'Origin not allowed'});
 const {mobile,pin}=req.body||{};
 if(!/^\d{10}$/.test(String(mobile||'')))return json(res,400,{error:'Enter a valid 10-digit mobile number.'});
 if(!process.env.PILOT_ACCESS_PIN||!secureCompare(pin||'',process.env.PILOT_ACCESS_PIN))return json(res,401,{error:'Access code invalid.'});
 const p=rosterByMobile(mobile);if(!p)return json(res,404,{error:'Profile not found.'});
 try{return json(res,200,{profile:{name:p.name,mobile:p.mobile,designation:p.designation},token:issueToken(p)});}catch{return json(res,503,{error:'Referral service not configured.'});}
}
