import QRCode from 'qrcode';
import {verifyToken,rosterByCode,easyQrSlug,json} from '../lib/security.js';
export default async function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
 let claim,profile;
 try{claim=await verifyToken(req.query.token);if(!claim)return json(res,403,{error:'Invalid referral link'});profile=await rosterByCode(claim.code);}
 catch{return json(res,503,{error:'QR configuration unavailable'});}
 if(!profile)return json(res,403,{error:'Unknown referral profile'});
 const origin=process.env.REFERRAL_PUBLIC_ORIGIN || 'https://nbloans-referrals.vercel.app';
 const host=new URL(origin);
 if(host.protocol!=='https:' && host.hostname!=='localhost')return json(res,503,{error:'Invalid referral origin'});
 const url=`${host.origin}/r/${easyQrSlug(profile)}`;
 const options={errorCorrectionLevel:'M',margin:5,width:1200,color:{dark:'#000000',light:'#FFFFFF'}};
 res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.query.format==='png'){
  const buffer=await QRCode.toBuffer(url,{...options,type:'png',scale:20});
  res.setHeader('Content-Type','image/png');return res.end(buffer);
 }
 const svg=await QRCode.toString(url,{...options,type:'svg'});
 res.setHeader('Content-Type','image/svg+xml; charset=utf-8');res.end(svg);
}
