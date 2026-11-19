import {readAuthSession,issueToken,json,restrictOrigin} from '../lib/security.js';
export default function handler(req,res){
 if(req.method!=='GET')return json(res,405,{error:'Method not allowed'});
 if(!restrictOrigin(req))return json(res,403,{error:'Origin not allowed'});
 try{const p=readAuthSession(req);if(!p)return json(res,401,{error:'Please verify your registered email to continue.'});
 return json(res,200,{profile:{name:p.name,mobile:p.mobile,designation:p.designation||'Vertical Head'},token:issueToken(p)});
 }catch{return json(res,503,{error:'Authentication unavailable.'});}
}
