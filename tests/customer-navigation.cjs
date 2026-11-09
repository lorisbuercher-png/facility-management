const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('public/customer-navigation.js','utf8');
function fixture(role='manager'){
 const own={id:'c1',name:'Carglass',modules:['Standorte','Mängel & Aufträge','Rapporte']},foreign={id:'c2',name:'Andere Firma',modules:[]};
 const elements={},buttons=[];let originalRenders=0,removedBack=false;
 const element=()=>({textContent:'',value:'',placeholder:'',classList:{add(){}},setAttribute(){},remove(){removedBack=true},replaceChildren(){},querySelectorAll(){return buttons}});
 for(const s of ['#content','#heading','#add','.sidebar .nav','#global-search','#breadcrumb-current','.member-notice','.eyebrow','footer span:first-child','#workspace-content .section-title h2'])elements[s]=element();
 elements['#back-platform']=element();
 Object.defineProperty(elements['.sidebar .nav'],'innerHTML',{get(){return this.html},set(value){this.html=value;buttons.length=0;for(const m of value.matchAll(/data-customer-nav="([^"]+)"/g)){const b=element();b.dataset={customerNav:m[1]};buttons.push(b)}}});
 const c={window:{FACILITY_USER:{role,companyId:'c1'}},data:{companies:[foreign,own],workspaces:{c1:{locations:[{id:'basel'},{id:'luzern'}],tasks:[]}}},workspaceId:null,workspaceTab:'dashboard',workspaceSearch:'',taskFilter:'Alle',page:'overview',tenant(id){c.workspaceId=id;c.workspaceTab='dashboard';c.drawWorkspace()},drawWorkspace(){},render(){originalRenders++},renderGlobalTasks(){originalRenders++},$:s=>elements[s],uiIcon:()=>'',esc:String,closeMenu(){}};
 vm.createContext(c);vm.runInContext(source,c);return {c,elements,buttons,get removedBack(){return removedBack},get originalRenders(){return originalRenders}};
}
for(const role of ['manager','branch']){
 const f=fixture(role),{c,elements}=f;
 assert.equal(c.workspaceId,'c1','opens assigned company, never first company');assert.equal(c.workspaceTab,'dashboard');assert(f.removedBack);
 assert(!elements['.sidebar .nav'].innerHTML.includes('Unternehmen'));
 assert(elements['.sidebar .nav'].innerHTML.includes(role==='manager'?'Arbeiten aller Filialen':'Meine Mängel'));
 c.tenant('c2');assert.equal(c.workspaceId,'c1','cannot switch to another company through tenant navigation');
 c.page='companies';c.render();assert.equal(c.workspaceId,'c1');assert.equal(c.workspaceTab,'dashboard');assert.equal(f.originalRenders,0);
 c.renderGlobalTasks();assert.equal(c.workspaceTab,'tasks');assert.equal(elements['#workspace-content .section-title h2'].textContent,role==='manager'?'Arbeiten aller Filialen':'Meine Mängel');
 if(role==='manager'){assert(f.buttons.some(b=>b.dataset.customerNav==='record'),'building record remains in navigation');assert(!f.buttons.some(b=>b.dataset.customerNav==='project-status'),'duplicate project-status tab is removed');f.buttons.find(b=>b.dataset.customerNav==='locations').onclick();assert.equal(c.workspaceTab,'locations')}else{assert.deepEqual(f.buttons.map(b=>b.dataset.customerNav),['dashboard','tasks']);assert(!elements['.sidebar .nav'].innerHTML.includes('Rapporte'));}
 elements['#global-search'].oninput({target:{value:'Basel'}});assert.equal(c.workspaceTab,'tasks');assert.equal(c.workspaceSearch,'Basel');assert.equal(elements['#global-search'].value,'Basel');
 c.data.companies=[];c.render();assert.equal(c.workspaceId,null);assert.match(elements['#content'].innerHTML,/nicht verfügbar/);
}
for(const role of ['superadmin','employee']){const f=fixture(role);assert.equal(f.c.workspaceId,null);f.c.render();assert.equal(f.originalRenders,1,'platform roles retain global navigation');}
console.log('PASS: manager and branch direct assigned-company entry, local navigation/search, no company switch/global return, unavailable assignments, unchanged admin/employee entry');
