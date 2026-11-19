import crypto from 'node:crypto';
import roster from './roster.private.json' with { type: 'json' };
export const rosterByMobile=(mobile)=>roster.find(x=>x.mobile===String(mobile));
export const TOKEN_TTL_SECONDS=60*60*24*30;
const secret=()=>{const s=process.env.REFERRAL_SIGNING_SECRET;if(!s||s.length<32)throw Error('REFERRAL_SIGNING_SECRET must be set (32+ characters)');return s;};
const b64=(s)=>Buffer.from(s).toString('base64url');
const sign=(body)=>crypto.createHmac('sha256',secret()).update(body).digest('base64url');
export function issueToken(profile,now=Math.floor(Date.now()/1000)){
 const payload={v:1,code:profile.dsaCode,iat:now,exp:now+TOKEN_TTL_SECONDS,utm_source:'loan_partner_referral',utm_medium:'qr',utm_campaign:'vh_pilot',utm_content:profile.dsaCode};
 const body=b64(JSON.stringify(payload));return `${body}.${sign(body)}`;
}
export function verifyToken(token,now=Math.floor(Date.now()/1000)){
 if(typeof token!=='string'||token.length>2048||!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token))return null;
 const [body,mac]=token.split('.');const expected=sign(body);
 if(mac.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(mac),Buffer.from(expected)))return null;
 let data;try{data=JSON.parse(Buffer.from(body,'base64url').toString('utf8'));}catch{return null;}
 if(data.v!==1||!Number.isInteger(data.exp)||data.exp<now||data.iat>now+60||!roster.some(x=>x.dsaCode===data.code))return null;
 return data;
}
export function secureCompare(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&crypto.timingSafeEqual(x,y);}
export function json(res,status,payload){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.end(JSON.stringify(payload));}
export function restrictOrigin(req){const origin=req.headers.origin;return !origin||origin===`https://${req.headers.host}`||origin==='http://localhost:3000';}

// OTP/session authentication: encrypted, HttpOnly, same-site cookies.
// Stateless operation avoids a database but cannot guarantee global one-time redemption or throttling.
const authKey=()=>{const raw=process.env.OTP_SIGNING_SECRET;if(!raw||raw.length<32)throw Error('OTP_SIGNING_SECRET must be set (32+ characters)');return crypto.createHash('sha256').update(raw).digest();};
export const OTP_TTL=300;
export const SESSION_TTL=8*3600;
export function seal(value){const iv=crypto.randomBytes(12);const cipher=crypto.createCipheriv('aes-256-gcm',authKey(),iv);const encrypted=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);return [iv.toString('base64url'),cipher.getAuthTag().toString('base64url'),encrypted.toString('base64url')].join('.');}
export function unseal(value){try{if(!value||value.length>5000||!/^[A-Za-z0-9_.-]+$/.test(value))return null;const parts=value.split('.');if(parts.length!==3)return null;const [iv,tag,data]=parts.map(x=>Buffer.from(x,'base64url'));if(iv.length!==12||tag.length!==16)return null;const decipher=crypto.createDecipheriv('aes-256-gcm',authKey(),iv);decipher.setAuthTag(tag);return JSON.parse(Buffer.concat([decipher.update(data),decipher.final()]).toString('utf8'));}catch{return null;}}
export function otpDigest(mobile,code,nonce){return crypto.createHmac('sha256',authKey()).update(`${mobile}:${nonce}:${code}`).digest('hex');}
export function createOtpChallenge(mobile,code,now=Math.floor(Date.now()/1000)){const nonce=crypto.randomBytes(16).toString('hex');return seal({kind:'otp',mobile,nonce,digest:otpDigest(mobile,code,nonce),exp:now+OTP_TTL});}
export function verifyOtpChallenge(cookieValue,code,now=Math.floor(Date.now()/1000)){const v=unseal(cookieValue);if(!v||v.kind!=='otp'||v.exp<now||v.exp>now+OTP_TTL||!/^\d{10}$/.test(v.mobile)||!/^\d{6}$/.test(String(code)))return null;return secureCompare(v.digest,otpDigest(v.mobile,String(code),v.nonce))?v.mobile:null;}
export function createAuthSession(mobile,now=Math.floor(Date.now()/1000)){return seal({kind:'session',mobile,exp:now+SESSION_TTL});}
export function readAuthSession(req,now=Math.floor(Date.now()/1000)){const v=unseal(cookie(req,'nb_vh_session'));return v?.kind==='session'&&v.exp>=now&&v.exp<=now+SESSION_TTL&&rosterByMobile(v.mobile)?rosterByMobile(v.mobile):null;}
export function cookie(req,name){const parts=String(req.headers?.cookie||'').split(';');const item=parts.find(x=>x.trim().startsWith(name+'='));return item?item.trim().slice(name.length+1):'';}
export function cookieHeader(name,value,maxAge){const secure=process.env.NODE_ENV!=='development';return `${name}=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure?'; Secure':''}`;}
export function makeOtp(){return String(crypto.randomInt(0,1_000_000)).padStart(6,'0');}
