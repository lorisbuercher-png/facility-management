const ts=require('typescript'),fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const ctx={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync('app/workflow.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,ctx);const apply=ctx.exports.applyWorkflow;
const state={companies:[{id:'a',modules:['Mängel & Aufträge']},{id:'b',modules:['Mängel & Aufträge']}],workspaces:{a:{locations:[{id:'a1'}],tasks:[]},b:{locations:[{id:'b1'}],tasks:[]}}};
const manager={role:'manager',id:'m',name:'Manager',companyId:'a'},branch={role:'branch',id:'f',name:'Filiale',companyId:'a',locationId:'a1'},employee={role:'employee',id:'e'},admin={role:'superadmin',id:'owner'},now='2026-10-31T10:00:00Z';
const create={action:'create',companyId:'a',locationId:'a1',title:'Wand',description:'Reparieren',priority:'Normal',due:'',assignee:''};
assert.equal(apply(state,create,manager,now,'x').status,403);assert.equal(state.workspaces.a.tasks.length,0);assert(apply(state,create,branch,now,'t').taskId);
let t=state.workspaces.a.tasks[0];assert.equal(apply(state,{...create,action:'edit',taskId:'t',taskRevision:1},manager,now,'x').status,403);
let schedule={action:'schedule',companyId:'a',taskId:'t',taskRevision:1,due:'2026-11-02',note:'Zutritt mit Filiale abgestimmt'};assert.equal(apply(state,schedule,manager,now,'x').status,409);
assert(apply(state,{action:'approve',companyId:'a',taskId:'t',taskRevision:1,note:''},manager,now,'ok').taskId);schedule.taskRevision=2;
for(const role of [branch,employee,admin,{...manager,companyId:'b'}])assert.equal(apply(state,schedule,role,now,'x').status,403);
for(const date of ['', '2026-02-31','2026-13-01','not-a-date'])assert.equal(apply(state,{...schedule,due:date},manager,now,'x').status,400);
assert(apply(state,schedule,manager,now,'date-ok').taskId);assert.equal(t.status,'Freigegeben');assert.equal(t.due,'2026-11-02');assert.equal(t.scheduleApproval.userId,'m');assert.equal(t.scheduleApproval.at,now);assert.equal(t.history.at(-1).action,'Termin freigegeben');assert.equal(t.history.at(-1).from,'Freigegeben');assert.equal(t.history.at(-1).to,'Freigegeben');assert.equal(t.workflowRevision,3);
assert.equal(apply(state,schedule,manager,now,'stale').status,409);
assert(apply(state,{action:'complete',companyId:'a',taskId:'t',taskRevision:3,reportText:'Repariert',hours:2},employee,now,'done').taskId);assert.equal(apply(state,{...schedule,taskRevision:4},manager,now,'x').status,409);
// Exercise the real detail renderer: managers have review/schedule, never create/edit/complete.
const source=fs.readFileSync('public/workflow.js','utf8'),detail=source.slice(source.indexOf('taskDetail=function'),source.indexOf('function flowDecision'));
function detailHtml(status){let html='';const task={id:'t',title:'Wand',locationId:'a1',status,description:'Wand',history:[],priority:'Normal'},els={};const c={companyNow:()=>({id:'a'}),workspaceNow:()=>({locations:[{id:'a1',name:'Basel'}],tasks:[task]}),clientWorkflowStatus:t=>t.status,flowRole:'manager',window:{FACILITY_USER:{id:'m'}},esc:String,dateLabel:()=>'',flowStatusTag:()=>'',openModal:(title,body)=>{html=body},photoGallery:()=>'',bindPhotoGallery(){},$:s=>els[s],taskDetail:null};vm.createContext(c);vm.runInContext(detail,c);c.taskDetail('t');return html;}
let html=detailHtml('Gemeldet');assert.match(html,/flow-approve/);assert.match(html,/flow-reject/);assert.doesNotMatch(html,/flow-edit|flow-complete|manager-schedule/);html=detailHtml('Freigegeben');assert.match(html,/manager-schedule/);assert.doesNotMatch(html,/flow-edit|flow-complete|flow-approve/);
assert(!fs.readFileSync('public/welcome.js','utf8').includes('Gemeinsam vorwärts'));
for(const name of ['app/landing.ts','app/shell.ts','public/demo.html'])assert(fs.readFileSync(name,'utf8').includes('ein Produkt der Firma F&amp;B Spezialbau'));
console.log('PASS: manager cannot create/edit, own-company approval and valid-date scheduling only, immutable completion, revisions/history, manager detail controls, product credit');
