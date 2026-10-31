const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function fixture(role='branch'){
 const els={},hidden=[],rows=[],company={id:'c1',name:'Carglass',modules:['Standorte','Mängel & Aufträge','Rapporte']},own={id:'basel',name:'Filiale Basel',city:'Basel'},foreign={id:'luzern',name:'Filiale Luzern'};
 let edit=null,removed=0;
 const el=()=>({textContent:'',value:'',innerHTML:'',classList:{add(){}},setAttribute(){},remove(){removed++},replaceChildren(){}}),$=s=>els[s]||(els[s]=el());
 const tasks=[{id:'own',locationId:'basel',title:'Basler Mangel',description:'Wand',status:'Gemeldet'},{id:'foreign',locationId:'luzern',title:'Luzerner Mangel',description:'Tür',status:'Freigegeben'}];
 const c={window:{FACILITY_USER:{role,companyId:'c1',locationId:'basel'}},data:{companies:[company],workspaces:{c1:{locations:[own,foreign],tasks}}},workspaceId:'c1',workspaceTab:'dashboard',taskFilter:'Alle',workspaceSearch:'',workspaceNow:()=>c.data.workspaces.c1,drawWorkspace(){if(c.workspaceTab==='tasks')c.workspaceTasks(company,c.workspaceNow());else c.workspaceDashboard(company,c.workspaceNow())},workspaceDashboard(){},workspaceTasks(){},editTask(id,location){edit={id,location};els['#flow-form']={querySelector:s=>({closest:()=>({classList:{add:name=>hidden.push([s,name])}})})}},$: $,esc:String,taskStatuses:['Gemeldet','Freigegeben','Abgelehnt','Erledigt'],clientWorkflowStatus:t=>t.status,taskRow:t=>{rows.push(t.id);return t.title},document:{querySelectorAll:()=>[]},bindTaskRows(){}};
 vm.createContext(c);vm.runInContext(fs.readFileSync('public/branch-view.js','utf8'),c);return {c,$,hidden,rows,get edit(){return edit},get removed(){return removed}};
}
const f=fixture();assert.equal(f.$('#heading').textContent,'Filiale Basel');assert.match(f.$('#workspace-content').innerHTML,/Mangel melden/);assert.doesNotMatch(f.$('#workspace-content').innerHTML,/Luzerner Mangel|Alle Standorte|Standort anlegen|Teamverwaltung/);assert(!f.rows.includes('foreign'));assert(f.removed);
f.$('#branch-report').onclick();assert.equal(f.edit.location,'basel');assert.deepEqual(f.hidden.map(h=>h[0]),['[name="locationId"]','[name="due"]','[name="assignee"]']);
f.$('#branch-all').onclick();assert.equal(f.c.workspaceTab,'tasks');assert.match(f.$('#branch-results').innerHTML,/Basler Mangel/);assert.doesNotMatch(f.$('#branch-results').innerHTML,/Luzerner/);
f.$('#branch-search').oninput({target:{value:'Tür'}});assert.match(f.$('#branch-results').innerHTML,/Keine passenden/);
f.c.workspaceTab='reports';f.c.drawWorkspace();assert.equal(f.c.workspaceTab,'dashboard');
f.c.data.workspaces.c1.locations=[{id:'luzern',name:'Luzern'}];f.c.drawWorkspace();assert.match(f.$('#content').innerHTML,/Filialzugang nicht verfügbar/);assert.doesNotMatch(f.$('#content').innerHTML,/Luzern/);
console.log('PASS: branch own-location dashboard and task list, direct report creation, hidden planning fields, no global screens, missing-assignment fallback');
