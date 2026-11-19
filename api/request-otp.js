import {rosterByMobile,createOtpChallenge,makeOtp,cookieHeader,json,restrictOrigin} from '../lib/security.js';
import {sendOtpEmail} from '../lib/mailer.js';
import {allow} from '../lib/limiter.js';
export default async function handler(req,res){
 if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
 if(!restrictOrigin(req))return json(res,403,{error:'Origin not allowed'});
 const mobile=String(req.body?.mobile||'').trim();
 // A new request invalidates any prior browser-held OTP challenge.
 res.setHeader('Set-Cookie',cookieHeader('nb_otp_challenge','',0));
 if(!/^\d{10}$/.test(mobile))return json(res,400,{error:'Enter a valid 10-digit mobile number.'});
 const ip=String(req.headers['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].trim();
 if(!allow('send:'+ip,5,15*60*1000)||!allow('mobile:'+mobile,3,15*60*1000))return json(res,429,{error:'Too many requests. Try later.'});
 const generic={message:'If this number is registered, a verification code will be sent to its associated email.'};
 // Never expose whether the mobile is present in the private roster.
 const profile=rosterByMobile(mobile);
 if(!profile?.email)return json(res,200,generic);
 try{const code=makeOtp();const challenge=createOtpChallenge(mobile,code);await sendOtpEmail(profile.email,code);
 res.setHeader('Set-Cookie',cookieHeader('nb_otp_challenge',challenge,600));return json(res,200,generic);
 }catch(e){console.error('OTP delivery error',e?.message);return json(res,503,{error:'Unable to send verification email. Please try again later.'});}
}
