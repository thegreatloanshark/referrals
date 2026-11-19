import {cookie,verifyOtpChallenge,createAuthSession,cookieHeader,json,restrictOrigin} from '../lib/security.js';
import {allow} from '../lib/limiter.js';
export default function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 if(!restrictOrigin(req))return json(res,403,{error:'Origin not allowed'});
 const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
 if(!allow('verify:'+ip,12,10*60*1000))return json(res,429,{error:'Too many attempts. Try again later.'});
 const code=String(req.body?.code||'');const mobile=verifyOtpChallenge(cookie(req,'nb_otp_challenge'),code);
 if(!mobile)return json(res,401,{error:'Invalid or expired verification code.'});
 res.setHeader('Set-Cookie',[cookieHeader('nb_otp_challenge','',0),cookieHeader('nb_vh_session',createAuthSession(mobile),8*3600)]);
 return json(res,200,{verified:true});
}
