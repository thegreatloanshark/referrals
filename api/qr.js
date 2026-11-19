import QRCode from 'qrcode';
import {verifyToken,json} from '../lib/security.js';
export default async function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
 let token=req.query.token;try{if(!verifyToken(token))return json(res,403,{error:'Invalid referral link'});}catch{return json(res,503,{error:'Not configured'});}
 const url=`https://${process.env.REFERRAL_PUBLIC_HOST||'nbloans-referrals.vercel.app'}/form?ref=${encodeURIComponent(token)}`;
 const svg=await QRCode.toString(url,{type:'svg',errorCorrectionLevel:'H',margin:3,width:560,color:{dark:'#171717',light:'#FFFFFF'}});
 res.setHeader('Content-Type','image/svg+xml; charset=utf-8');res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');res.end(svg);
}
