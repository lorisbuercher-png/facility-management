// Customer navigation stays inside the one company assigned by the server.
// Server projections and workflow checks remain the access-control boundary.
(()=>{
 const user=window.FACILITY_USER;
 if(!user||!['manager','branch'].includes(user.role))return;
 const currentTenant=tenant,previousDraw=drawWorkspace;
 const assignedCompany=()=>data.companies.find(c=>c.id===user.companyId);
 const tabs=()=>{const c=assignedCompany();if(user.role==='branch')return [['dashboard','home','Meine Filiale'],...(c?.modules.includes('Mängel & Aufträge')?[['tasks','tasks','Meine Mängel']]:[])];return [['dashboard','home','Dashboard'],...(c?.modules.includes('Standorte')?[['locations','pin','Filialen']]:[]),...(c?.modules.includes('Mängel & Aufträge')?[['tasks','tasks',user.role==='manager'?'Arbeiten aller Filialen':'Meine Mängel']]:[]),...(c?.modules.includes('Rapporte')?[['reports','tasks','Rapporte']]:[]),...(user.role==='manager'?[['record','home','Gebäudeakte'],['chat','team','Kundenchat'],['branch-team','team','Filialleiter']]:[])];};
 function unavailable(){workspaceId=null;$('#content').innerHTML='<section class="panel empty-state"><h2>Unternehmenszugang nicht verfügbar</h2><p>Deine Firmenzuordnung ist nicht mehr gültig. Bitte wende dich an die Plattformverwaltung.</p></section>';$('#heading').textContent='Dein Unternehmensbereich';$('#add').classList.add('hidden');$('.sidebar .nav').replaceChildren();}
 function openTab(tab='dashboard'){
  const c=assignedCompany();if(!c){unavailable();return;}
  workspaceId=c.id;workspaceTab=tabs().some(t=>t[0]===tab)?tab:'dashboard';drawWorkspace();closeMenu();
 }
 tenant=function(id){if(id!==user.companyId)return;currentTenant(id);};
 drawWorkspace=function(){
  const c=assignedCompany();if(!c){unavailable();return;}
  workspaceId=c.id;previousDraw();
  $('#back-platform')?.remove();
  const nav=$('.sidebar .nav');
  nav.innerHTML=tabs().map(([tab,icon,label])=>`<button data-customer-nav="${tab}" class="${workspaceTab===tab?'active':''}" aria-current="${workspaceTab===tab?'page':'false'}">${uiIcon(icon)}<span>${esc(label)}</span></button>`).join('');
  nav.querySelectorAll('[data-customer-nav]').forEach(button=>button.onclick=()=>{workspaceSearch='';taskFilter='Alle';openTab(button.dataset.customerNav);});
  const scope=user.role==='manager'?'Alle Filialen von '+c.name:'Deine Filiale · '+c.name;
  if($('.member-notice'))$('.member-notice').textContent=scope;
  if($('.eyebrow'))$('.eyebrow').textContent='Dein Unternehmensdashboard';
  if($('footer span:first-child'))$('footer span:first-child').textContent=c.name+' · Gebäudeunterhalt';
  if(workspaceTab==='dashboard'&&user.role==='manager'&&typeof window.renderManagerProjectPreview==='function')window.renderManagerProjectPreview(c,data.workspaces[c.id]);
  if(workspaceTab==='tasks'&&$('#workspace-content .section-title h2'))$('#workspace-content .section-title h2').textContent=user.role==='manager'?'Arbeiten aller Filialen':'Meine Mängel';
  $('#breadcrumb-current').textContent=c.name+' / '+(tabs().find(t=>t[0]===workspaceTab)?.[2]||'Dashboard');
  const search=$('#global-search');search.setAttribute('aria-label','Arbeiten der eigenen Firma suchen');search.placeholder='Arbeiten oder Filiale suchen …';
 };
 // Former global entry points cannot return a customer to the platform overview.
 render=function(){openTab(page==='tasks'?'tasks':'dashboard');};
 renderGlobalTasks=function(){openTab('tasks');};
 $('#global-search').oninput=e=>{const value=e.target.value;workspaceSearch=value;openTab('tasks');$('#global-search').value=value;};
 openTab('dashboard');
})();
