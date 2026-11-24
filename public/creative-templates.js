// All layouts are deterministic canvas artwork, not remote image generation.
// One shared reward and eligibility layer is applied to every exported creative.
export const PHOTO_FREE_STYLES = Object.freeze(['reward-medallion','bold-curves','bonus-burst','torn-banner','abstract-reward']);
export const PHOTO_STYLES = Object.freeze(['geometric','identity','qr','split','minimal']);
export const DESIGNATIONS = Object.freeze(['Vertical Head','Zonal Head','Regional Head']);
export const REWARD = '₹5,000';
export const ELIGIBILITY = "Referred Loan Partner/DSA must not already exist in NoBroker Loans' records. Minimum ₹30 lakh Home Loan disbursement and first payout received on FastPay. T&Cs apply.";
export const isPhotoFree = style => PHOTO_FREE_STYLES.includes(style);
const RED='#D80000', DARK='#181818', WHITE='#FFFFFF', GOLD='#FFD700', PINK='#FFF1F2';
export function renderCreative(style,{c,hero,callout,cta,name,designation,photo,qrCode,logoBlock}){
 if(![...PHOTO_FREE_STYLES,...PHOTO_STYLES].includes(style)) style='reward-medallion';
 const box=(x,y,w,h,r,color)=>{c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()};
 const circle=(x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill()};
 const polygon=(points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill()};
 const text=(s,x,y,size,color,weight=800,align='left',width=1000)=>{c.fillStyle=color;c.font=`${weight} ${size}px Arimo, Arial, sans-serif`;c.textAlign=align;c.textBaseline='alphabetic';c.fillText(String(s),x,y,width)};
 const fit=(s,x,y,w,h,maxSize,color,weight=800,align='left')=>{
  const words=String(s).trim().split(/\s+/);let size=maxSize,lines=[];
  for(;size>=16;size-=2){c.font=`${weight} ${size}px Arimo, Arial, sans-serif`;lines=[''];for(const word of words){const n=lines.length-1,next=(lines[n]+' '+word).trim();if(lines[n]&&c.measureText(next).width>w)lines.push(word);else lines[n]=next}if(lines.length*size*1.16<=h)break;}
  lines.forEach((line,i)=>text(line,x,y+size+i*size*1.16,size,color,weight,align,w));
 };
 c.clearRect(0,0,1200,1500);box(0,0,1200,1500,0,WHITE);
 let background=PINK,rewardBg=RED,rewardFg=WHITE,headlineFg=DARK,cardBg=WHITE;
 if(style==='bold-curves'||style==='split'){background=DARK;rewardBg=GOLD;rewardFg=DARK;headlineFg=WHITE;}
 if(style==='bonus-burst'||style==='torn-banner'){background=RED;rewardBg=WHITE;rewardFg=RED;headlineFg=WHITE;}
 if(style==='identity'||style==='minimal'||style==='qr')background=WHITE;
 box(0,0,1200,1040,0,background);
 // All decoration is behind the common content cards and stays away from the QR.
 c.save();c.beginPath();c.rect(0,0,1200,1040);c.clip();
 if(style==='reward-medallion'){
  circle(1160,255,375,'#FAD7D9');circle(1160,255,275,'#E9A3A8');circle(1160,255,180,RED);circle(1085,840,95,GOLD);
 }else if(style==='bold-curves'){
  circle(1200,40,510,RED);circle(1200,10,250,GOLD);circle(1200,965,255,'#292929');
 }else if(style==='bonus-burst'){
  for(let i=0;i<20;i++){const a=i*Math.PI/10;polygon([[600,400],[600+1700*Math.cos(a),400+1700*Math.sin(a)],[600+1700*Math.cos(a+.12),400+1700*Math.sin(a+.12)]],'#BB0000')}
 }else if(style==='torn-banner'){
  polygon([[0,115],[145,85],[320,120],[570,80],[835,118],[1000,95],[1200,120],[1200,205],[970,180],[720,215],[460,185],[230,210],[0,180]],GOLD);
  polygon([[0,980],[145,950],[320,986],[570,958],[835,1000],[1000,960],[1200,982],[1200,1040],[0,1040]],'#A80000');
 }else if(style==='abstract-reward'){
  circle(1150,200,300,GOLD);circle(1160,650,285,'#F7D4D7');circle(1190,1040,195,RED);
 }else if(style==='geometric'){
  polygon([[850,0],[1200,0],[1200,1040],[1000,1040],[720,600]],'#FAD7D9');circle(1140,70,125,GOLD);
 }else if(style==='identity'){
  box(25,150,1150,880,50,PINK);box(45,170,1110,840,44,'#FFE4E7');
 }else if(style==='qr'){
  box(0,140,1200,18,0,RED);box(0,1000,1200,40,0,RED);
 }else if(style==='split'){
  polygon([[0,0],[520,0],[420,1040],[0,1040]],RED);
 }else{
  box(0,154,1200,12,0,RED);box(40,185,8,820,3,RED);
 }
 c.restore();
 logoBlock();
 // The reward is the dominant typographic element in ALL ten designs.
 if(style==='reward-medallion'){
  box(65,185,1070,292,146,rewardBg);c.strokeStyle=GOLD;c.lineWidth=5;c.beginPath();c.roundRect(80,200,1040,262,131);c.stroke();
 }else if(style==='bonus-burst'){
  polygon([[65,185],[1135,185],[1090,330],[1135,477],[65,477],[110,330]],rewardBg);
 }else if(style==='torn-banner'){
  polygon([[65,195],[170,181],[300,195],[445,183],[585,199],[740,183],[900,196],[1135,185],[1135,470],[980,483],[825,470],[650,482],[490,468],[340,483],[180,468],[65,480]],rewardBg);
 }else if(style==='abstract-reward'){
  box(65,185,1070,292,38,rewardBg);circle(115,231,25,GOLD);circle(1080,430,27,GOLD);
 }else box(65,185,1070,292,32,rewardBg);
 text('REFERRAL REWARD',600,239,31,rewardFg,800,'center',1000);
 text(REWARD,600,385,160,rewardFg,800,'center',980);
 text('PER ELIGIBLE REFERRAL',600,446,34,rewardFg,800,'center',1000);
 // The cards behind text keep contrast independent of decorative artwork.
 box(65,495,1070,215,24,(headlineFg===WHITE? (background===DARK?DARK:'#AF0000'):WHITE));
 fit(hero,600,511,1010,120,53,headlineFg,800,'center');
 fit(callout,600,636,1010,62,30,headlineFg,500,'center');
 // Mandatory hero terms, embedded in both preview and PNG, never optional.
 box(65,728,1070,253,24,WHITE);
 box(65,728,12,253,6,GOLD);
 text('KEY TERMS & CONDITIONS',100,781,29,RED,800,'left',1000);
 fit(ELIGIBILITY,100,800,990,151,32,DARK,600);
 // Large unobstructed QR and contact action. Photo-free styles never render a portrait.
 box(55,1000,1090,405,28,cardBg);
 const usePhoto=!isPhotoFree(style)&&photo;
 let identityX=85,identityY=1087,identityWidth=600;
 text('YOUR REFERRAL CONTACT',85,1046,22,RED,800,'left',635);
 if(usePhoto){
  c.save();c.beginPath();c.arc(153,1151,63,0,Math.PI*2);c.clip();const scale=Math.max(126/photo.width,126/photo.height);c.drawImage(photo,153-photo.width*scale/2,1151-photo.height*scale/2,photo.width*scale,photo.height*scale);c.restore();
  identityX=235;identityWidth=450;
 }
 fit(name,identityX,identityY,identityWidth,88,43,DARK,800);
 text(DESIGNATIONS.includes(designation)?designation:'Vertical Head',identityX,1200,27,DARK,500,'left',identityWidth);
 box(85,1240,610,85,16,RED);text(cta.toUpperCase(),390,1295,34,WHITE,800,'center',560);
 qrCode(765,1018,350);text('SCAN TO REFER',940,1383,23,DARK,800,'center',350);
 box(0,1416,1200,84,0,WHITE);c.fillStyle='#E7E7E7';c.fillRect(65,1416,1070,1);
 text('NoBroker Loans  |  Your Partner in Growth',600,1465,25,DARK,600,'center',1070);
}
