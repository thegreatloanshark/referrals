import {validateCompactReferralLink,resolveEasyQrSlug,issueToken} from '../lib/security.js';
export default async function handler(req,res) {
 if(req.method!=='GET'){res.statusCode=405;return res.end('Method not allowed');}
 let profile;
 try{profile=await resolveEasyQrSlug(req.query.short)||await validateCompactReferralLink(req.query.short);}catch{res.statusCode=503;return res.end('Referral system unavailable');}
 if(!profile){res.statusCode=410;return res.end('This referral link has expired or is invalid. Please request a new link.');}
 const token=issueToken(profile);
 res.setHeader('Cache-Control','no-store');
 res.setHeader('Referrer-Policy','no-referrer');
 res.statusCode=302;
 res.setHeader('Location',`/form?ref=${encodeURIComponent(token)}`);
 res.end();
}
