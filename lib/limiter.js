// Best-effort single-instance limit. Vercel instances are ephemeral; use Vercel Firewall rate limits in production.
const attempts=new Map();
export function allow(key,limit,windowMs){const now=Date.now();if(attempts.size>10000){for(const [k,v] of attempts)if(v.until<now)attempts.delete(k);}const x=attempts.get(key);if(!x||x.until<now){attempts.set(key,{count:1,until:now+windowMs});return true;}if(x.count>=limit)return false;x.count++;return true;}
