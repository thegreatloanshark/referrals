import crypto from 'node:crypto';
import roster from './roster.private.json' with { type: 'json' };
export const rosterByMobile=(mobile)=>roster.find(x=>x.mobile===String(mobile));
export const rosterByCode=(code)=>roster.find(x=>x.dsaCode===String(code));
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

// Compact, authenticated redirect tokens. Keep roster DSA codes in the payload, not raw user input.
export function compactReferralLink(profile, exp) {
 const code = Buffer.from(profile.dsaCode, 'utf8').toString('base64url');
 const expiry = Number(exp).toString(36);
 const body = `${code}.${expiry}`;
 const mac = crypto.createHmac('sha256',secret()).update(`short-referral-v1:${body}`).digest('base64url').slice(0,16);
 return `${body}.${mac}`;
}
export function validateCompactReferralLink(short, now=Math.floor(Date.now()/1000)) {
 if(typeof short!=='string'||short.length>110||!/^[A-Za-z0-9_-]+\.[a-z0-9]+\.[A-Za-z0-9_-]{16}$/.test(short))return null;
 const parts=short.split('.');
 const body=`${parts[0]}.${parts[1]}`;
 const expected=crypto.createHmac('sha256',secret()).update(`short-referral-v1:${body}`).digest('base64url').slice(0,16);
 if(!crypto.timingSafeEqual(Buffer.from(expected),Buffer.from(parts[2])))return null;
 const exp=parseInt(parts[1],36);
 if(!Number.isSafeInteger(exp)||exp<now||exp>now+TOKEN_TTL_SECONDS+60)return null;
 const code=Buffer.from(parts[0],'base64url').toString('utf8');
 return rosterByCode(code)||null;
}

// V13 permanent, revocable per-roster compact QR slug. A 14-character signed
// identifier is much less visually dense than a full signed query URL.
// Removal of a roster entry revokes its QR immediately. Legacy links still work.
export function easyQrSlug(profile){
 const digest=crypto.createHmac('sha256',secret()).update('referral-qr-v13:'+profile.dsaCode).digest('base64url');
 return digest.slice(0,14);
}
export function resolveEasyQrSlug(slug){
 if(typeof slug!=='string'||!/^[A-Za-z0-9_-]{14}$/.test(slug))return null;
 let found=null;
 for(const person of roster){
   const expected=easyQrSlug(person);
   if(crypto.timingSafeEqual(Buffer.from(slug),Buffer.from(expected)))found=person;
 }
 return found;
}
