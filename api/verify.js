import {verifyToken,json,restrictOrigin} from '../lib/security.js';
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 if(!restrictOrigin(req))return json(res,403,{error:'Origin not allowed'});
 try{const data=await verifyToken(req.body?.token);if(!data)return json(res,403,{valid:false});
 return json(res,200,{valid:true,attribution:{code:data.code,utm_source:data.utm_source,utm_medium:data.utm_medium,utm_campaign:data.utm_campaign,utm_content:data.utm_content}});
 }catch{return json(res,503,{valid:false,error:'Service unavailable'});}
}
