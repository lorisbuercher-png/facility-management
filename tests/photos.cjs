const ts=require('typescript'),fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto');
function compile(path,imports={}){const code=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context={exports:{},require:n=>imports[n],Response,Request,URL,File,TextDecoder,Uint8Array,crypto:webcrypto};vm.runInNewContext(code,context);return context.exports}
const workflow=compile('app/workflow.ts'),access=compile('app/access.ts'),photos=compile('app/photos.ts'),photoAccess=compile('app/photo-access.ts',{'./access':access,'./workflow':workflow});
const jpeg=new Uint8Array([255,216,255,224,0,16,74,70,73,70,0,1,1,0,0,1]);
const fresh=()=>({companies:[{id:'a',modules:['Mängel & Aufträge']},{id:'b',modules:['Mängel & Aufträge']}],workspaces:{a:{locations:[{id:'a1'},{id:'a2'}],tasks:[]},b:{locations:[{id:'b1'}],tasks:[]}},events:[]});let state=fresh(),revision=1,conflict=false,grant=null,puts=0;const objects=new Map();
const env={FACILITY_ADMIN_EMAIL:'owner@example.test',DB:{prepare(sql){return {bind(...args){return {async first(){if(sql.includes('team_access'))return grant;if(args[0]!=='owner')return null;return {payload:JSON.stringify(state),revision}},async run(){if(conflict||args[3]!==revision)return {meta:{changes:0}};state=JSON.parse(args[0]);revision++;return {meta:{changes:1}}}}}}}},BUCKET:{async put(key,bytes){puts++;objects.set(key,{body:bytes,size:bytes.length})},async delete(key){objects.delete(key)},async get(key){return objects.get(key)}}};
const api=compile('app/api/workflow/route.ts',{'cloudflare:workers':{env},'../../workflow':workflow,'../../access':access,'../../photos':photos});
const read=compile('app/api/photos/route.ts',{'cloudflare:workers':{env},'../../photo-access':photoAccess});
const owner={'oai-authenticated-user-id':'owner','oai-authenticated-user-email':'owner@example.test'},member={'oai-authenticated-user-id':'member','oai-authenticated-user-email':'member@example.test'};
const payload={action:'create',companyId:'a',locationId:'a1',title:'Wand',description:'Beschädigt',priority:'Normal',due:'',assignee:''};
function request(input,files=[],headers=owner){const body=new FormData();body.append('payload',JSON.stringify(input));for(const file of files)body.append('photos',file);return new Request('https://facility.test/api/workflow',{method:'POST',headers:{Origin:'https://facility.test',...headers},body})}
function readRequest(t,p,headers=owner,cid='a'){return new Request('https://facility.test/api/photos?'+new URLSearchParams({companyId:cid,taskId:t.id,id:p.id}),{headers})}
const file=(bytes=jpeg,name='foto.jpg',type='image/jpeg')=>new File([bytes],name,{type});
(async()=>{
 assert.equal((await api.POST(request(payload,[file()],{}))).status,401);
 assert.equal((await api.POST(request(payload,[file()],{...owner,Origin:'https://evil.test'}))).status,403);
 assert.equal((await api.POST(request(payload,[file(new TextEncoder().encode('<script>bad</script>'))]))).status,400);assert.equal(objects.size,0);assert.equal(state.workspaces.a.tasks.length,0);
 assert.equal((await api.POST(request(payload,[file(jpeg,'foto.svg')]))).status,400);
 assert.equal((await api.POST(request(payload,[file(jpeg,'foto.png','image/png')]))).status,400);
 assert.equal((await api.POST(request(payload,[file(),file(new Uint8Array([1,2,3]))]))).status,400);assert.equal(objects.size,0,'earlier file rolled back');
 assert.equal((await api.POST(request(payload,Array.from({length:6},()=>file())))).status,400);
 assert.equal((await api.POST(request(payload,[file(new Uint8Array(10*1024*1024+1))]))).status,400);
 const saved=await api.POST(request(payload,[file()]));assert.equal(saved.status,200);let task=state.workspaces.a.tasks[0],photo=task.photos[0];assert.equal(objects.size,1);assert.equal(photo.type,'image/jpeg');assert.equal(task.history.length,1);assert.match(task.history[0].note,/1 Foto/);
 let response=await read.GET(readRequest(task,photo));assert.equal(response.status,200);assert.equal(response.headers.get('Cache-Control'),'private, no-store');assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');assert.equal(new Uint8Array(await response.arrayBuffer()).length,jpeg.length);
 assert.equal((await read.GET(readRequest(task,photo,{}))).status,401);
 grant={owner_id:'owner',email:'member@example.test',name:'Manager',role:'manager',company_id:'b',active:1};assert.equal((await read.GET(readRequest(task,photo,member))).status,404);
 grant={...grant,company_id:'a',role:'branch',location_id:'a2'};assert.equal((await read.GET(readRequest(task,photo,member))).status,404);
 grant={...grant,location_id:'a1'};assert.equal((await read.GET(readRequest(task,photo,member))).status,200);
 grant={...grant,role:'employee'};assert.equal((await read.GET(readRequest(task,photo,member))).status,404);
 grant=null;assert.equal((await read.GET(readRequest(task,photo,member))).status,403);
 conflict=true;assert.equal((await api.POST(request(payload,[file()]))).status,409);assert.equal(objects.size,1);conflict=false;
 const before=puts;assert.equal((await api.POST(request({...payload,action:'approve',taskId:task.id,taskRevision:1},[file()]))).status,403);assert.equal(puts,before,'denied action cannot upload');
 grant={owner_id:'owner',email:'member@example.test',name:'Manager',role:'manager',company_id:'a',active:1};assert.equal((await api.POST(request({action:'approve',companyId:'a',taskId:task.id,taskRevision:1,note:''},[],member))).status,200);
 grant={...grant,role:'employee'};assert.equal((await read.GET(readRequest(task,photo,member))).status,200);
 assert.equal((await api.POST(request({action:'complete',companyId:'a',taskId:task.id,taskRevision:2,reportText:'Repariert',hours:1.5},[file()],member))).status,200);
 task=state.workspaces.a.tasks[0];assert.equal(task.photos.length,1);assert.equal(task.report.photos.length,1);assert.equal(task.status,'Erledigt');assert.equal((await read.GET(readRequest(task,task.report.photos[0],member))).status,200);assert.equal((await read.GET(readRequest(task,photo,member))).status,200);assert.equal((await api.POST(request({action:'complete',companyId:'a',taskId:task.id,taskRevision:task.workflowRevision,reportText:'Nochmals',hours:1},[],member))).status,403);
 grant={...grant,role:'manager'};assert.equal((await read.GET(readRequest(task,task.report.photos[0],member))).status,200);
 console.log('PASS: authenticated multipart uploads, signature/type/size/count validation, upload rollback, conflict cleanup, before/after photos, private photo reads, tenant/branch/employee/revoked access');
})().catch(e=>{console.error(e);process.exit(1)});
