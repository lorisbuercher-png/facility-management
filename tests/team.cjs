const ts=require('typescript'),fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),{DatabaseSync}=require('node:sqlite'),{webcrypto}=require('node:crypto');
function compile(path,imports={}){const output=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const context={exports:{},require:n=>imports[n],Response,Request,URL,crypto:webcrypto,console};vm.runInNewContext(output,context);return context.exports}
const sqlite=new DatabaseSync(':memory:');for(const file of fs.readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort())sqlite.exec(fs.readFileSync('drizzle/'+file,'utf8').replaceAll('--> statement-breakpoint',''));
let beforeWrite=null;
const env={FACILITY_ADMIN_EMAIL:'owner@test.ch',DB:{prepare(sql){return {bind(...args){return {async first(){return sqlite.prepare(sql).get(...args)||null},async all(){return {results:sqlite.prepare(sql).all(...args)}},async run(){if(beforeWrite){const fn=beforeWrite;beforeWrite=null;fn(sql,args)}const result=sqlite.prepare(sql).run(...args);return {meta:{changes:Number(result.changes)}}}}}}}}};
const access=compile('app/access.ts'),team=compile('app/api/team/route.ts',{'cloudflare:workers':{env},'../../access':access});
const state={companies:[{id:'c1'},{id:'c2'}],workspaces:{c1:{locations:[{id:'a1'},{id:'a2'}]},c2:{locations:[{id:'b1'}]}}};
sqlite.prepare('INSERT INTO platform_state VALUES (?, ?, 1, ?)').run('owner',JSON.stringify(state),'2026-10-31T03:00:00Z');
function add(id,email,role,company,location,owner='owner',active=1){sqlite.prepare('INSERT INTO team_access VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)').run(id,owner,id,email,role,company,location,active,'2026-10-31T03:00:00Z','2026-10-31T03:00:00Z')}
add('ma','manager-a@test.ch','manager','c1',null);add('mb','manager-b@test.ch','manager','c2',null);add('peer','peer@test.ch','manager','c1',null);add('ba','branch-a@test.ch','branch','c1','a1');add('inactive','inactive@test.ch','branch','c1','a2','owner',0);add('bb','branch-b@test.ch','branch','c2','b1');add('emp','employee@test.ch','employee',null,null);add('foreign','foreign@test.ch','branch','c1','a1','other-owner');
const request=(method,email='manager-a@test.ch',body,extra={})=>new Request('https://facility.test/api/team',{method,headers:{Origin:'https://facility.test','Content-Type':'application/json','oai-authenticated-user-id':email==='owner@test.ch'?'owner':'member','oai-authenticated-user-email':email,...extra},...(body!==undefined?{body:JSON.stringify(body)}:{})});
const body={name:'Neue Filialleitung',email:'new@test.ch',role:'branch',companyId:'c1',locationId:'a1'};
const get=id=>sqlite.prepare('SELECT * FROM team_access WHERE id = ?').get(id);
const post=(data=body,email='manager-a@test.ch')=>team.POST(request('POST',email,data));
const patch=(id,revision,active,email='manager-a@test.ch',extra={})=>team.PATCH(request('PATCH',email,{id,revision,active,...extra}));
(async()=>{
 let response=await team.GET(request('GET'));assert.equal(response.status,200);let rows=(await response.json()).items;assert.deepEqual(rows.map(u=>u.id).sort(),['ba','inactive']);
 response=await post();assert.equal(response.status,201);let id=(await response.json()).id;assert.equal(get(id).role,'branch');assert.equal(get(id).company_id,'c1');assert.equal(get(id).owner_id,'owner');
 assert.equal((await post({...body,id,revision:1,name:'Aktualisiert',locationId:'a2'})).status,200);assert.equal(get(id).name,'Aktualisiert');assert.equal(get(id).location_id,'a2');assert.equal(get(id).revision,2);
 assert.equal((await post({...body,id,revision:1})).status,409);assert.equal(get(id).revision,2);
 for(const role of ['manager','employee','superadmin'])assert.equal((await post({...body,role,email:role+'@test.ch'})).status,403);
 assert.equal((await post({...body,companyId:'c2',locationId:'b1'})).status,403);
 assert.equal((await post({...body,locationId:'b1'})).status,400);
 for(const target of ['bb','ma','peer','emp','foreign']){assert.equal((await post({...body,id:target,revision:1})).status,404);assert.equal((await patch(target,1,false)).status,404)}
 assert.equal(get('peer').role,'manager');assert.equal(get('ma').active,1);assert.equal(get('foreign').active,1);
 assert.equal((await post({...body,email:'owner@test.ch'})).status,400);
 assert.equal((await post({...body,email:'manager-a@test.ch'})).status,409);
 assert.equal((await patch(id,2,false)).status,200);assert.equal(get(id).active,0);assert.equal(get(id).revision,3);
 assert.equal((await patch(id,2,true)).status,409);assert.equal((await patch(id,3,true)).status,200);
 assert.equal((await patch(id,4,false,'manager-a@test.ch',{role:'manager'})).status,400);assert.equal(get(id).role,'branch');assert.equal(get(id).active,1);
 for(const email of ['branch-a@test.ch','employee@test.ch','unknown@test.ch']){assert.equal((await team.GET(request('GET',email))).status,403);assert.equal((await post(body,email)).status,403);assert.equal((await patch('ba',1,false,email)).status,403)}
 assert.equal((await team.GET(request('GET',''))).status,401);
 sqlite.prepare('UPDATE team_access SET active = 0 WHERE id = ?').run('ma');assert.equal((await team.GET(request('GET'))).status,403);assert.equal((await post()).status,403);sqlite.prepare('UPDATE team_access SET active = 1 WHERE id = ?').run('ma');
 assert.equal((await team.POST(request('POST','manager-a@test.ch',body,{Origin:'https://evil.test'}))).status,403);
 assert.equal((await team.POST(request('POST','manager-a@test.ch',body,{'Content-Type':'text/plain'}))).status,415);
 beforeWrite=()=>sqlite.prepare('UPDATE team_access SET active = 0, revision = revision + 1 WHERE id = ?').run('ma');assert.equal((await post({...body,email:'revoked-race@test.ch'})).status,409);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM team_access WHERE email = ?').get('revoked-race@test.ch').n,0);sqlite.prepare('UPDATE team_access SET active = 1 WHERE id = ?').run('ma');
 beforeWrite=()=>sqlite.prepare("UPDATE team_access SET role = 'manager' WHERE id = 'ba'").run();assert.equal((await post({...body,id:'ba',revision:1,email:'branch-a@test.ch'})).status,409);assert.equal(get('ba').role,'manager');sqlite.prepare("UPDATE team_access SET role = 'branch' WHERE id = 'ba'").run();
 beforeWrite=()=>sqlite.prepare('UPDATE platform_state SET revision = revision + 1 WHERE owner_id = ?').run('owner');assert.equal((await post({...body,email:'state-race@test.ch'})).status,409);
 beforeWrite=()=>sqlite.prepare('UPDATE platform_state SET revision = revision + 1 WHERE owner_id = ?').run('owner');assert.equal((await patch(id,4,false)).status,409);assert.equal(get(id).active,1);
 beforeWrite=()=>add('collision','collision@test.ch','branch','c1','a1');assert.equal((await post({...body,email:'collision@test.ch'})).status,409);
 response=await team.GET(request('GET','owner@test.ch'));assert.equal(response.status,200);rows=(await response.json()).items;assert(rows.some(u=>u.role==='employee'));assert(!rows.some(u=>u.id==='foreign'));
 response=await post({name:'Owner-created manager',email:'new-manager@test.ch',role:'manager',companyId:'c2'},'owner@test.ch');assert.equal(response.status,201);const managerId=(await response.json()).id;assert.equal(get(managerId).role,'manager');
 assert.equal((await post({id:managerId,revision:1,name:'Owner employee',email:'new-manager@test.ch',role:'employee'},'owner@test.ch')).status,200);assert.equal(get(managerId).role,'employee');assert.equal(get(managerId).company_id,null);
 assert.equal((await patch(managerId,2,false,'owner@test.ch')).status,200);assert.equal(get(managerId).active,0);
 const changed=structuredClone(state);changed.companies=changed.companies.filter(c=>c.id!=='c1');sqlite.prepare('UPDATE platform_state SET payload = ? WHERE owner_id = ?').run(JSON.stringify(changed),'owner');assert.equal((await team.GET(request('GET'))).status,403);assert.equal((await post({...body,email:'orphan@test.ch'})).status,403);assert.equal((await patch(id,4,false)).status,403);
 console.log('PASS: real SQLite manager branch CRUD, own-company reads, cross-tenant/owner denial, protected higher roles, existing-target checks, role escalation denial, stale revisions, revoked/deleted assignments, origin/type checks, write-time revocation and target/state races, duplicate race handling, unchanged owner CRUD');
})().catch(e=>{console.error(e);process.exit(1)}).finally(()=>sqlite.close());
