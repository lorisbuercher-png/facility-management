const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('public/project-status.js','utf8');
function fixture(role='manager'){
 const elements={},target={innerHTML:'',appended:[],appendChild(n){this.appended.push(n)},querySelectorAll(){return []}};
 function get(s){return elements[s]||(elements[s]={innerHTML:'',value:'',selectionStart:0,focus(){},setSelectionRange(){},querySelectorAll(){return []}})}
 const context={window:{FACILITY_USER:{role,companyId:'a'}},workspaceTab:'dashboard',drawWorkspace(){},companyNow(){return {id:'a'}},clientWorkflowStatus:t=>t.status,esc:v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])),uiIcon:()=>'',taskDetail(){},reportPrint(){},$:s=>s==='#workspace-content'?target:get(s),document:{createElement(){return {className:'',innerHTML:'',querySelector(){return {onclick:null}},querySelectorAll(){return []}}}}};
 vm.createContext(context);vm.runInContext(source,context);return {context,target,get};
}
const branches=[{id:'l1',name:'Spreitenbach',city:'Spreitenbach',address:'',zip:'',image:''},{id:'l2',name:'Basel',city:'Basel',image:''}];
const w={locations:branches,tasks:[
 {id:'t1',locationId:'l1',title:'Tür repariert <script>bad</script>',status:'Erledigt',report:{text:'Tür eingestellt',userName:'Mitarbeiter A',at:'2026-11-02T09:45:00Z',hours:2.5,photos:[]},photos:[]},
 {id:'t2',locationId:'l1',title:'Fenster prüfen',status:'Gemeldet',createdAt:'2026-11-01T08:30:00Z',description:'Glas kontrollieren',photos:[]},
 {id:'t3',locationId:'l2',title:'Boden repariert',status:'Erledigt',report:{text:'Boden neu gemacht',userName:'Team B',at:'2026-10-12T12:00:00Z',hours:4,photos:[]},photos:[]},
]};
const f=fixture(),c={id:'a',name:'Firma A'};
f.context.window.renderManagerProjectStatus(c,w);
assert.match(f.target.innerHTML,/Projektstand/);
assert.match(f.target.innerHTML,/Spreitenbach/);
assert.match(f.target.innerHTML,/Basel/);
assert.match(f.target.innerHTML,/2\.5 Std\. rapportiert/);
assert.match(f.target.innerHTML,/02\. November 2026/);
assert.match(f.target.innerHTML,/Mitarbeiter A/);
assert.doesNotMatch(f.target.innerHTML,/<script>/);
assert.match(f.target.innerHTML,/Tür repariert &lt;script&gt;bad&lt;\/script&gt;/);
assert.doesNotMatch(f.target.innerHTML,/Fenster prüfen/,'default shows only completed work');
f.get('#project-location').onchange({target:{value:'l1'}});
assert.match(f.target.innerHTML,/Tür repariert/);
assert.doesNotMatch(f.target.innerHTML,/Boden repariert/,'location selection scopes work list');
assert.match(f.target.innerHTML,/1<\/strong><small>Abgeschlossen/);
f.get('#project-filter').onchange({target:{value:'open'}});
assert.match(f.target.innerHTML,/Fenster prüfen/);
assert.doesNotMatch(f.target.innerHTML,/Tür repariert/);
const branch=fixture('branch');branch.context.window.renderManagerProjectStatus(c,w);assert.equal(branch.target.innerHTML,'','no manager timeline for branch role');
const other=fixture();other.context.window.renderManagerProjectStatus({id:'foreign',name:'Fremd'},w);assert.equal(other.target.innerHTML,'','no other-company timeline');
console.log('PASS: manager-only branch project status, completed work and dates, report metadata, branch selection, filtering, escaping, tenant scoping');
