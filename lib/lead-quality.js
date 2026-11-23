// First disbursed FastPay file only. Exact rupees retained server-side.
export const BANDS = [
  {minimum:15000000, band:'₹1.5Cr+',grade:'AAA'},
  {minimum:10000000, band:'₹1Cr+',grade:'AA'},
  {minimum:8000000,band:'₹80L+',grade:'A'},
  {minimum:5000000,band:'₹50L+',grade:'B+'},
  {minimum:3000000,band:'₹30L+',grade:'B'}
];
export function qualityFor(amount){
  if(amount===null||amount===undefined||amount==='')return {band:null,grade:null};
  const n=Number(amount);
  if(!Number.isFinite(n)||n<0)return {band:null,grade:null};
  const match=BANDS.find(b=>n>=b.minimum);
  return match?{band:match.band,grade:match.grade}:{band:'Below ₹30L',grade:null};
}
export function numericAmount(value){
 if(value===null||value===undefined||value==='')return null;
 const raw=String(value).trim();
 if(!/^(?:0|[1-9]\d{0,12})(?:\.\d{1,2})?$/.test(raw))throw Error('Enter a positive rupee amount with up to two decimal places.');
 const n=Number(raw);if(!Number.isFinite(n)||n<=0)throw Error('First disbursement amount must be greater than zero.');
 return n.toFixed(2);
}
