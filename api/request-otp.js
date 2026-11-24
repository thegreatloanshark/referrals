import {json} from '../lib/security.js';
export default function handler(req,res){return json(res,410,{error:'Legacy OTP login retired. Sign in through Clerk.'});}
