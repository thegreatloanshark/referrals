import {cookieHeader,json,restrictOrigin} from '../lib/security.js';
export default function handler(req,res){if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});if(!restrictOrigin(req))return json(res,403,{error:'Origin not allowed'});res.setHeader('Set-Cookie',[cookieHeader('nb_otp_challenge','',0),cookieHeader('nb_vh_session','',0)]);return json(res,200,{ok:true});}
