import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('api/dashboard.js').replace(/^import .*;\s*$/gm,'').replace('export default async function handler','async function handler');
const flags=(onboarded=false,business_started=false)=>({lead_created:true,onboarded,business_started,qualified:true});
const row=(id,stage_flags,dsa_code='TEST-VH')=>({id,created_at:'2026-11-24T00:00:00Z',stage_flags,dsa_code,form_answers:{referredName:id},first_file_amount:null});
async function invoke(rows,role='vh'){
 const queries=[];let response;
 const context=vm.createContext({console,actor:async()=>({role,dsaCode:'TEST-VH',profile:{name:'Test VH'}}),qualityFor:()=>({band:null,grade:null}),json:(_res,status,data)=>{response={status,data};},db:async(_table,{filter})=>{
   queries.push(filter);const params=new URLSearchParams(filter);const scope=params.get('dsa_code');const eligible=scope?rows.filter(r=>r.dsa_code===scope.slice(3)):rows;
   const offset=Number(params.get('offset'));return eligible.slice(offset,offset+Number(params.get('limit')));
 }});
 vm.runInContext(source,context);await context.handler({method:'GET'},{});return {response,queries};
}
const normalize=x=>JSON.parse(JSON.stringify(x));
test('three cumulative legacy flags resolve to one current stage each',async()=>{
 const {response}=await invoke([row('created',flags()),row('onboarded',flags(true)),row('business',flags(true,true))]);
 assert.equal(response.status,200);assert.deepEqual(normalize(response.data.counts),{total:3,lead_created:1,onboarded:1,business_started:1});
});
test('empty results and missing flags produce an exhaustive split',async()=>{
 const empty=await invoke([]);assert.deepEqual(normalize(empty.response.data.counts),{total:0,lead_created:0,onboarded:0,business_started:0});
 const {response}=await invoke([row('missing',null),row('business',flags(false,true))]);assert.deepEqual(normalize(response.data.counts),{total:2,lead_created:1,onboarded:0,business_started:1});
});
test('VH scope and super admin scope remain distinct, across more than 1,000 leads',async()=>{
 const rows=[...Array.from({length:1001},(_,i)=>row(String(i),flags(true,true))),row('other',flags(),'OTHER-VH')];
 const vh=await invoke(rows);assert.equal(vh.response.data.counts.total,1001);assert.equal(vh.response.data.counts.business_started,1001);assert.equal(vh.queries.length,2);assert.ok(vh.queries.every(q=>q.includes('dsa_code=eq.TEST-VH')));
 const admin=await invoke(rows,'super_admin');assert.equal(admin.response.data.counts.total,1002);assert.equal(admin.response.data.counts.lead_created,1);assert.ok(admin.queries.every(q=>!q.includes('dsa_code=eq.')));
});
test('frontend shows the total and exclusive stage cards, and stage filter matches current stage',()=>{
 const nodes=new Map();const document={getElementById:id=>{if(!nodes.has(id))nodes.set(id,{value:'',textContent:'',innerHTML:''});return nodes.get(id);}};
 const context=vm.createContext({document,console});const frontend=read('public/dashboard.js').replace(/^import .*;\s*$/gm,'').replace(/export (?=(?:async )?function)/g,'');
 vm.runInContext(frontend,context);context.render({role:'vh',leads:[row('created-test',flags()),row('onboarded-test',flags(true)),row('business-test',flags(true,true))],counts:{lead_created:3,onboarded:2,business_started:1}});
 assert.equal(nodes.get('vhTotalLeads').textContent,'3');assert.equal((nodes.get('vhStats').innerHTML.match(/<strong>1<\/strong>/g)||[]).length,3);
 nodes.get('vhStageFilter').value='lead_created';context.renderAll();const html=nodes.get('vhAllLeads').innerHTML;assert.match(html,/created-test/);assert.doesNotMatch(html,/onboarded-test|business-test/);
 assert.match(read('public/vh-only.html'),/id="vhTotalLeads"/);assert.match(read('public/vh-only.html'),/id="removePhoto"/);
});
