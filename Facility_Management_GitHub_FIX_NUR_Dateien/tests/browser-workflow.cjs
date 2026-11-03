const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const {generatedDemoWorkflow}=require('../scripts/demo-workflow.cjs');
assert.equal(fs.readFileSync('public/demo-workflow.js','utf8'),generatedDemoWorkflow(),'regenerate demo rules after changing server rules');
const demoContext={window:{}};vm.runInNewContext(generatedDemoWorkflow(),demoContext);const apply=demoContext.window.FACILITY_DEMO_WORKFLOW;
let master={companies:[{id:'a',modules:['Mängel & Aufträge']}],workspaces:{a:{locations:[{id:'a1'}],tasks:[]}},events:[]};
const user={id:'branch',ownerId:'owner',name:'Demo',email:'demo@example.invalid',role:'branch',companyId:'a',locationId:'a1'},input={action:'create',companyId:'a',locationId:'a1',title:'Wand',description:'Ausbessern',priority:'Normal',due:'',assignee:''};
const source=fs.readFileSync('public/demo.js','utf8'),adapter=source.slice(source.indexOf(' flowRequest=async function('),source.indexOf('\n let demoTeam;'));
const context={master,window:{FACILITY_USER:user,FACILITY_DEMO_WORKFLOW:apply,FACILITY_REFRESH:async()=>{}},chosen:'branch',createId:()=> 'task',persist:()=>{},demoNotice:()=>{},structuredClone,Date};vm.createContext(context);vm.runInContext(adapter,context);
const ui=fs.readFileSync('public/workflow.js','utf8'),edit=ui.slice(ui.indexOf('editTask=function'),ui.indexOf('taskDetail=function')),decision=ui.slice(ui.indexOf('function flowDecision'),ui.lastIndexOf('if(workspaceId'));
function fixture(){const task={id:'t',title:'Alt',description:'Alt',locationId:'a1',workflowRevision:1,photos:[]},els={};let close=0,submitted=null,toast=0;const c={id:'a'},w={locations:[{id:'a1',name:'Basel'}],tasks:[task]};
 const ctx={window:{},data:{workspaces:{a:w}},flowRole:'branch',companyNow:()=>c,workspaceNow:()=>w,esc:String,openModal(){for(const id of ['flow-form','flow-submit','flow-error','decision-form','decision-submit','decision-error','flow-cancel','decision-cancel'])els[id]={isConnected:true};},$:selector=>selector==='#modal'?{close(){close++}}:els[selector.slice(1)],mountPhotoPicker:()=>()=>[],FormData:null,flowRequest:async body=>{submitted=body},redrawAfterFlow(){},toast(){toast++}};
 // FormData must be iterable, like the browser API.
 ctx.FormData=class{*[Symbol.iterator](){yield* [['title','Neu'],['description','Neu'],['priority','Normal'],['due',''],['assignee',''],['note','OK']]}};
 vm.createContext(ctx);vm.runInContext(edit+decision,ctx);return {ctx,task,els,getSubmitted:()=>submitted,getClosed:()=>close,getToasts:()=>toast};}
(async()=>{
 await context.flowRequest(input);assert.equal(context.master.workspaces.a.tasks[0].workflowRevision,1,'creation revision matches live');
 await assert.rejects(()=>context.flowRequest({...input,action:'approve',taskId:'task',taskRevision:0}),/inzwischen/);assert.equal(context.master.workspaces.a.tasks[0].status,'Gemeldet');
 context.chosen='employee';context.window.FACILITY_USER={...user,role:'employee'};await assert.rejects(()=>context.flowRequest(input),/Mitarbeiter/);assert.equal(context.master.workspaces.a.tasks.length,1,'denied creation does not mutate demo master');
 await assert.rejects(()=>context.flowRequest(input,[{}]),/Foto-Uploads/);
 assert(!source.includes("src='/cloud.js'"));assert.match(source,/window\.fetch=async\(\)=>\{throw/);
 let f=fixture();vm.runInContext("editTask('t')",f.ctx);f.task.workflowRevision=2;await f.els['flow-form'].onsubmit({preventDefault(){},target:{}});assert.equal(f.getSubmitted().taskRevision,1,'edit uses revision shown in form');
 f=fixture();f.ctx.flowRole='manager';vm.runInContext("flowDecision('a','t','approve')",f.ctx);f.task.workflowRevision=2;await f.els['decision-form'].onsubmit({preventDefault(){},target:{}});assert.equal(f.getSubmitted().taskRevision,1,'decision uses revision shown in form');
 f=fixture();vm.runInContext("editTask('t')",f.ctx);f.els['flow-form'].isConnected=false;await f.els['flow-form'].onsubmit({preventDefault(){},target:{}});assert.equal(f.getClosed(),0,'finished detached form must not close a newer modal');
 f=fixture();vm.runInContext("editTask('t')",f.ctx);f.ctx.flowRequest=async()=>{throw Error('Konflikt')};await f.els['flow-form'].onsubmit({preventDefault(){},target:{}});assert.equal(f.els['flow-error'].textContent,'Konflikt');assert.equal(f.els['flow-submit'].disabled,false);
 console.log('PASS: demo uses current server rules, denied/stale/demo-photo requests do not mutate master; edit and decision forms keep displayed revision, detached forms do not close new modals, conflicts remain visible');
})().catch(e=>{console.error(e);process.exitCode=1});
