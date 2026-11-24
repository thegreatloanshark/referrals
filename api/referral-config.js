import {verifyToken,json} from '../lib/security.js';
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 try{const attr=await verifyToken(req.body?.token);if(!attr)return json(res,403,{error:'Invalid referral link'});
 // Only present explicitly supplied Google Form entry IDs; no fake submissions.
 const url=process.env.GOOGLE_FORM_URL;
 const ids=['referrerName','referrerMobile','referrerEmail','referrerCity','referredName','referredMobile','referredEmail','consent','dsaCode','utm_source','utm_medium','utm_campaign','utm_content'];
 const fields=Object.fromEntries(ids.map(k=>[k,process.env['FORM_ENTRY_'+k]]).filter(([,v])=>/^entry\.\d+$/.test(v||'')));
 return json(res,200,{configured:!!url&&ids.every(k=>fields[k]),formUrl:url||null,fields,attribution:attr});
 }catch{return json(res,503,{error:'Service unavailable'});}
}
