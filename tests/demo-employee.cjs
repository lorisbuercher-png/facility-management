const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const demo=fs.readFileSync('public/demo.js','utf8');
const employee=fs.readFileSync('public/employee.js','utf8');
const map=fs.readFileSync('public/employee-map.js','utf8');

// The role selector must preserve GitHub Pages' /facility-management/ path.
const selector="banner.querySelector('select').onchange=e=>";
const from=demo.indexOf(selector);
assert(from!==-1,'Demo role selector must exist');
const to=demo.indexOf(';banner.querySelector',from);
assert(to>from,'Demo role selector should precede reset action');
const snippet=demo.slice(from,to);
const select={onchange:null};
let navigated='';
const input='https://example.github.io/facility-management/demo.html?role=manager';
const routing={banner:{querySelector:()=>select},URL,location:{href:input,assign:(href)=>{navigated=href}}};
vm.runInNewContext(snippet,routing);
select.onchange({target:{value:'employee'}});
assert.equal(new URL(navigated).pathname,'/facility-management/demo.html');
assert.equal(new URL(navigated).searchParams.get('role'),'employee');
assert(demo.includes('href="?role=employee"'),'Direct employee test entry must be available');

function renderEmployee(role='employee'){
 const fixture=String.raw\`
 const window={FACILITY_USER:{role:ROLE,companyId:'c',locationId:'l'}};
 function node(){return {classList:{add(){},remove(){},toggle(){}},style:{},setAttribute(){},innerHTML:'',value:'',textContent:'',placeholder:'',onclick:null,onchange:null,oninput:null,querySelectorAll(){return []},querySelector(){return null},focus(){}}}
 const elements={},document={body:node(),querySelectorAll(){return []}};
 const $=selector=>elements[selector]??(elements[selector]=node());
 const data={companies:[{id:'c',name:'Kunde A',color:'#a11'}],workspaces:{c:{locations:[{id:'l',name:'Filiale Luzern',city:'Luzern'}],tasks:[
  {id:'todo',title:'Tür einstellen',description:'Eingangstüre',locationId:'l',status:'Freigegeben',priority:'Normal',due:'2026-11-09',assignee:'Demo Team',createdAt:'2026-11-09T09:00:00Z',photos:[]},
  {id:'done',title:'Sockel saniert',description:'Sockel',locationId:'l',status:'Erledigt',priority:'Normal',due:'2026-11-07',report:{hours:2,userName:'Demo Mitarbeiter',at:'2026-11-08T09:00:00Z'},photos:[]}
 ]}}};
 function allWork(){return data.companies.flatMap(c=>data.workspaces[c.id].tasks.map(t=>({...t,company:c,location:data.workspaces[c.id].locations.find(l=>l.id===t.locationId)})))}
 function dayToday(){return '2026-11-09'};function dateLabel(v){return v};function esc(v){return String(v??'')};
 function uiIcon(){return ''};function flowStatusTag(t){return t.status};function priorityOptions(){return '<option>Alle</option>'};
 function clearAmbience(){};function closeMenu(){};function taskDetail(){};
 function flowDecision(){};function reportPrint(){};
 let render=()=>{},renderGlobalTasks=()=>{},drawWorkspace=()=>{},redrawAfterFlow=()=>{},tenant=()=>{},openGlobalWork=()=>{},workspaceId=null,page='overview';
 \`.replace('ROLE',JSON.stringify(role));
 const src=fixture+'\n'+map+'\n'+employee+'\nresult={heading:elements["#heading"]?.textContent,nav:elements[".sidebar .nav"]?.innerHTML,results:elements["#employee-results"]?.innerHTML,content:elements["#content"]?.innerHTML};';
 const ctx={result:null};
 vm.runInNewContext(src,ctx);
 return ctx.result;
}
const shown=renderEmployee();
assert.equal(shown.heading,'Deine Einsatzübersicht');
assert.match(shown.nav,/Mein Tag/);
assert.match(shown.nav,/Wochenplan/);
assert.match(shown.nav,/Rapporte/);
assert.match(shown.results,/Tür einstellen/);
assert.match(shown.results,/Rapport & Abschluss/);
assert.match(shown.results,/Rapport \/ PDF/);
assert.match(shown.content,/2<\/strong><span>Rapportierte Stunden/);
console.log('PASS: demo employee route preserves project path; employee dashboard renders jobs, plan, completion and reports');
