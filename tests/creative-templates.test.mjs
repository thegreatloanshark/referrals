import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderCreative,PHOTO_FREE_STYLES,PHOTO_STYLES,DESIGNATIONS,REWARD,ELIGIBILITY,DESCRIPTION,CONTACT_LINE,HEADLINES,CALLOUTS,DEFAULT_CALLOUT_INDEX,isPhotoFree} from '../public/creative-templates.js';
const html=readFileSync(new URL('../public/vh-only.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
test('ten selectable templates and the three approved designations',()=>{
 assert.equal(PHOTO_FREE_STYLES.length,5);assert.equal(PHOTO_STYLES.length,5);
 for(const style of [...PHOTO_FREE_STYLES,...PHOTO_STYLES])assert.ok(html.includes(`value="${style}"`));
 assert.deepEqual(DESIGNATIONS,['Vertical Head','Zonal Head','Regional Head']);
 for(const d of DESIGNATIONS)assert.ok(html.includes(`<option>${d}</option>`));
 assert.match(app,/\$\('photo'\)\.disabled=hidden/);
});
test('every template renders reward as largest text, mandatory eligibility, and large QR; no portrait in photo-free modes',()=>{
 for(const style of [...PHOTO_FREE_STYLES,...PHOTO_STYLES]){
  const drawn=[],qrs=[],portraits=[];
  const c={font:'',fillText(t,x,y,w){drawn.push({t,font:this.font,x,y,w})},measureText(t){return {width:t.length*Number(this.font.match(/(\d+)px/)?.[1]||20)*.53}},drawImage(...args){portraits.push(args)},clearRect(){},beginPath(){},roundRect(){},fill(){},arc(){},lineTo(){},moveTo(){},closePath(){},save(){},restore(){},rect(){},clip(){},fillRect(){},stroke(){}};
  renderCreative(style,{c,hero:'Great Connections Deserve Great Rewards.',callout:'One introduction could unlock your next reward.',cta:'Refer Now',name:'Sample Head',designation:'Regional Head',photo:{width:250,height:250},qrCode:(...args)=>qrs.push(args),logoBlock:()=>{}});
  assert.equal(REWARD,'₹5,000');const reward=drawn.find(x=>x.t===REWARD);assert.ok(reward,style);
  const fontSize=t=>Number(t.font.match(/(\d+)px/)[1]);assert.equal(fontSize(reward),Math.max(...drawn.map(fontSize)),style);
  assert.ok(drawn.some(x=>x.t==='HOW IT WORKS'),style);
  assert.equal(drawn.filter(x=>x.y>787&&x.y<922).map(x=>x.t).join(' '),DESCRIPTION,style);
  assert.equal(drawn.filter(x=>x.y>922&&x.y<981).map(x=>x.t).join(' '),CONTACT_LINE,style);
  assert.equal(drawn.filter(x=>x.y>1413&&x.y<1480).map(x=>x.t).join(' '),ELIGIBILITY,style);
  assert.deepEqual(qrs,[[765,1018,350]],style);
  assert.equal(portraits.length,isPhotoFree(style)?0:1,style);
 }
});

test('approved copy is locked and the recommended callout is selected by default',()=>{
 assert.equal(HEADLINES.length,5);assert.equal(CALLOUTS.length,5);
 assert.equal(CALLOUTS[DEFAULT_CALLOUT_INDEX],'Turn your network into an earning opportunity');
 assert.equal(CONTACT_LINE,'Connect with your Vertical Head for more details.');
 assert.match(app,/selectedIndex=DEFAULT_CALLOUT_INDEX/);
 assert.match(html,/<details class="creative-locked-copy">/);
});
