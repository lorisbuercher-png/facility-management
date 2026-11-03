const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),{webcrypto}=require('node:crypto'),{DatabaseSync}=require('node:sqlite');
function compile(file,imports={}){
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const context={exports:{},require:name=>imports[name],crypto:webcrypto,Response,Request,URL,console};vm.runInNewContext(code,context,{filename:file});return context.exports;
}
const notices=compile('app/notifications.ts');
const context={ownerEmail:'owner@test.ch',actorEmail:'branch@test.ch',companyId:'a',locationId:'a1',taskId:'t1'};
const users=[
 {email:'manager@test.ch',name:'Manager A',role:'manager',company_id:'a',location_id:null,active:1},
 {email:'other@test.ch',name:'Manager B',role:'manager',company_id:'b',location_id:null,active:1},
 {email:'branch@test.ch',name:'Filialleiter A1',role:'branch',company_id:'a',location_id:'a1',active:1},
 {email:'branch2@test.ch',name:'Filialleiter A2',role:'branch',company_id:'a',location_id:'a2',active:1},
 {email:'worker@test.ch',name:'Ausführung 1',role:'employee',company_id:null,location_id:null,active:1},
 {email:'worker2@test.ch',name:'Ausführung 2',role:'employee',company_id:null,location_id:null,active:1},
 {email:'inactive@test.ch',name:'Inaktiv',role:'manager',company_id:'a',location_id:null,active:0},
];
const task={id:'t1',title:'Eingangstüre prüfen',priority:'Dringend',locationId:'a1',assignee:'Ausführung 1',due:'2026-11-05',startTime:'09:30'};
function emails(items){return [...items].map(n=>n.recipientEmail).sort().join(',')}
assert.equal(emails(notices.workflowNotifications('create',context,task,users)),'manager@test.ch,owner@test.ch');
assert.equal(emails(notices.workflowNotifications('approve',{...context,actorEmail:'manager@test.ch'},task,users)),'branch@test.ch,worker@test.ch');
assert.equal(emails(notices.workflowNotifications('schedule',{...context,actorEmail:'manager@test.ch'},task,users)),'branch@test.ch,worker@test.ch');
assert.equal(emails(notices.workflowNotifications('complete',{...context,actorEmail:'worker@test.ch'},task,users)),'branch@test.ch,manager@test.ch,owner@test.ch');
assert.equal(emails(notices.chatNotifications({...context,actorEmail:'manager@test.ch'},'Neue Nachricht','manager',users)),'owner@test.ch');
assert.equal(emails(notices.chatNotifications({...context,actorEmail:'owner@test.ch'},'Antwort','superadmin',users)),'manager@test.ch');
assert.equal(emails(notices.workflowNotifications('approve',{...context,actorEmail:'manager@test.ch'},{...task,assignee:''},users)),'branch@test.ch,worker2@test.ch,worker@test.ch');
assert.equal(notices.workflowNotifications('approve',{...context,actorEmail:'manager@test.ch'},task,users).some(n=>n.recipientEmail==='other@test.ch'),false);

const db=new DatabaseSync(':memory:');
for(const file of fs.readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())db.exec(fs.readFileSync('drizzle/'+file,'utf8').replaceAll('--> statement-breakpoint',''));
const env={FACILITY_ADMIN_EMAIL:'owner@test.ch',DB:{prepare(sql){return {bind(...args){return {async first(){return db.prepare(sql).get(...args)||null},async all(){return {results:db.prepare(sql).all(...args)}},async run(){return {meta:{changes:Number(db.prepare(sql).run(...args).changes)}}}}}}}}};
const api=compile('app/api/notifications/route.ts',{'cloudflare:workers':{env},'../../access':compile('app/access.ts')});
function grant(id,email,role,companyId,locationId){db.prepare('INSERT INTO team_access VALUES (?,?,?,?,?,?,?,1,1,?,?)').run(id,'owner',id,email,role,companyId,locationId,'now','now')}
grant('manager','manager@test.ch','manager','a',null);grant('other','other@test.ch','manager','b',null);grant('branch','branch@test.ch','branch','a','a1');grant('branch2','branch2@test.ch','branch','a','a2');grant('worker','worker@test.ch','employee',null,null);
function req(method,email,body){return new Request('https://facility.test/api/notifications',{method,headers:{'oai-authenticated-user-id':email==='owner@test.ch'?'owner':email,'oai-authenticated-user-email':email,Origin:'https://facility.test',...(method!=='GET'?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})})}
(async()=>{
 const entries=[
  ...notices.workflowNotifications('create',context,task,users),
  ...notices.workflowNotifications('approve',{...context,actorEmail:'manager@test.ch'},task,users),
  ...notices.chatNotifications({...context,actorEmail:'owner@test.ch'},'Hallo aus dem Team','superadmin',users),
 ];
 await notices.storeNotifications(env.DB,'owner',entries,'2026-11-03T08:00:00.000Z');
 const read=async(email)=>({status:(await api.GET(req('GET',email))).status,payload:await (await api.GET(req('GET',email))).json()});
 let a=await read('manager@test.ch');assert.equal(a.status,200);assert.equal(a.payload.unread,2);
 assert.equal((await read('other@test.ch')).payload.unread,0);
 assert.equal((await read('branch@test.ch')).payload.unread,1);
 assert.equal((await read('branch2@test.ch')).payload.unread,0);
 assert.equal((await read('worker@test.ch')).payload.unread,1);
 assert.equal((await read('owner@test.ch')).payload.unread,1);
 const foreign=a.payload.items[0].id;
 const denied=await api.PATCH(req('PATCH','other@test.ch',{id:foreign}));assert.equal((await denied.json()).updated,0);
 a=await read('manager@test.ch');assert.equal(a.payload.unread,2);
 assert.equal((await api.PATCH(req('PATCH','manager@test.ch',{all:true,irrelevant:1}))).status,200);
 assert.equal((await read('manager@test.ch')).payload.unread,0);
 assert.equal((await read('owner@test.ch')).payload.unread,1);
 // Reassignment must invalidate access to old-tenant notifications, including read actions.
 db.prepare('UPDATE team_access SET company_id = ?,revision = revision + 1 WHERE email = ?').run('b','manager@test.ch');
 assert.equal((await read('manager@test.ch')).payload.items.length,0);
 const stale=await api.PATCH(req('PATCH','manager@test.ch',{id:foreign}));assert.equal((await stale.json()).updated,0);
 db.prepare('UPDATE team_access SET active = 0 WHERE email = ?').run('worker@test.ch');
 assert.equal((await api.GET(req('GET','worker@test.ch'))).status,403);
 const invalid=await api.PATCH(req('PATCH','owner@test.ch',{id:'../bad'}));assert.equal(invalid.status,400);
 const cross=await api.PATCH(new Request('https://facility.test/api/notifications',{method:'PATCH',headers:{'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@test.ch',Origin:'https://external.test','Content-Type':'application/json'},body:JSON.stringify({all:true})}));assert.equal(cross.status,403);
 console.log('PASS: notification routing, sender exclusion, tenant and branch separation, employee dispatch, inbox counter, read receipts, grant reassignment/revocation, origin and input guards');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>db.close());
