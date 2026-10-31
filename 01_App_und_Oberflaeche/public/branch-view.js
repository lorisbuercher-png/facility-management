// Filialleitungen melden und dokumentieren Mängel ihrer einen zugewiesenen Filiale.
(()=>{
 const user=window.FACILITY_USER;if(user?.role!=='branch')return;
 const ownLocation=()=>workspaceNow()?.locations.find(l=>l.id===user.locationId);
 const previousDraw=drawWorkspace,previousDashboard=workspaceDashboard,previousTasks=workspaceTasks,previousEdit=editTask;
 function branchRows(w){const items=w.tasks.filter(t=>t.locationId===user.locationId);return items;}
 function openMeldungen(status='Alle'){workspaceTab='tasks';taskFilter=status;workspaceSearch='';drawWorkspace()}
 workspaceDashboard=function(c,w){
  if(user.role!=='branch')return previousDashboard(c,w);
  const l=ownLocation();if(!l)return;
  const tasks=branchRows(w),enabled=c.modules.includes('Mängel & Aufträge');
  $('#workspace-content').innerHTML=`<section class="panel branch-hero"><div class="welcome-kicker">DEINE FILIALE</div><h2>${esc(l.name)}</h2><p>${esc([l.address,l.zip,l.city].filter(Boolean).join(' ')||'Adresse noch nicht hinterlegt')}</p><p>Melde und dokumentiere Mängel vor Ort. Dein Manager prüft jede Meldung und entscheidet über die Freigabe.</p>${enabled?'<button class="primary" id="branch-report">＋ Mangel melden</button>':'<p class="workflow-notice">Mängelmeldungen sind für diese Firma derzeit deaktiviert.</p>'}</section>${enabled?`<section class="welcome-metrics branch-metrics" aria-label="Mängel deiner Filiale">${[['Gemeldet','Beim Manager zur Prüfung'],['Freigegeben','Freigegeben'],['Abgelehnt','Abgelehnt'],['Erledigt','Erledigt']].map(([status,label])=>`<button class="welcome-metric" data-branch-status="${status}"><span class="welcome-metric-copy"><span>${label}</span><strong>${tasks.filter(t=>clientWorkflowStatus(t)===status).length}</strong></span></button>`).join('')}</section><section class="panel"><div class="section-title"><h2>Mängel deiner Filiale</h2><button class="text-btn" id="branch-all">Alle Mängel ansehen ↗</button></div>${tasks.slice().sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||'')).slice(0,5).map(taskRow).join('')||'<div class="empty-state"><h3>Noch keine Mängel gemeldet.</h3><p>Erfasse den ersten Mangel mit Beschreibung und Fotos.</p></div>'}</section>`:''}`;
  if($('#branch-report'))$('#branch-report').onclick=()=>editTask();
  if($('#branch-all'))$('#branch-all').onclick=()=>openMeldungen();
  document.querySelectorAll('[data-branch-status]').forEach(b=>b.onclick=()=>openMeldungen(b.dataset.branchStatus));bindTaskRows();
 };
 workspaceTasks=function(c,w){
  if(user.role!=='branch')return previousTasks(c,w);
  $('#workspace-content').innerHTML='<section class="panel"><div class="section-title"><h2>Meine Mängel</h2><button class="primary" id="branch-new">＋ Mangel melden</button></div><div class="toolbar"><input id="branch-search" aria-label="Mängel suchen" placeholder="Mangel suchen …" value="'+esc(workspaceSearch)+'"><select id="branch-status" aria-label="Nach Status filtern">'+['Alle',...taskStatuses].map(s=>'<option '+(s===taskFilter?'selected':'')+'>'+esc(s)+'</option>').join('')+'</select></div><p class="workflow-notice">Gemeldete Mängel werden durch deinen Manager geprüft. Fotos und Verlauf findest du in den Details.</p><div id="branch-results"></div></section>';
  const list=()=>{$('#branch-results').innerHTML=branchRows(w).filter(t=>(taskFilter==='Alle'||clientWorkflowStatus(t)===taskFilter)&&(t.title+' '+t.description).toLowerCase().includes(workspaceSearch.toLowerCase())).map(taskRow).join('')||'<div class="empty">Keine passenden Mängel.</div>';bindTaskRows()};
  $('#branch-new').onclick=()=>editTask();$('#branch-search').oninput=e=>{workspaceSearch=e.target.value;list()};$('#branch-status').onchange=e=>{taskFilter=e.target.value;list()};list();
 };
 editTask=function(id){
  const l=ownLocation();if(!l)return;
  previousEdit(id,l.id);
  const form=$('#flow-form');if(!form)return;
  // Keep required server payload fields, without asking the branch to plan execution.
  for(const name of ['locationId','due','assignee']){const control=form.querySelector(`[name="${name}"]`);if(control)control.closest('label')?.classList.add('hidden')}
 };
 drawWorkspace=function(){
  if(!['dashboard','tasks'].includes(workspaceTab))workspaceTab='dashboard';
  // Do not fall back to another location if the assignment disappeared.
  const c=data.companies.find(c=>c.id===user.companyId),l=data.workspaces[c?.id]?.locations.find(l=>l.id===user.locationId);
  if(!c||!l){$('#content').innerHTML='<section class="panel empty-state"><h2>Filialzugang nicht verfügbar</h2><p>Bitte lass deine Filialzuordnung durch den Manager prüfen.</p></section>';$('.sidebar .nav').replaceChildren();$('#add').classList.add('hidden');return;}
  previousDraw();$('.workspace-nav')?.remove();
  $('#heading').textContent=l.name;$('#subtitle').textContent=c.name+' · Deine Filiale und deine Mängel.';
  if($('.member-notice'))$('.member-notice').textContent='Filialleitung · '+l.name+' · Freigabe durch deinen Manager';
  if($('.eyebrow'))$('.eyebrow').textContent='Dein Filialbereich';
  $('#breadcrumb-current').textContent=l.name+' / '+(workspaceTab==='tasks'?'Meine Mängel':'Meine Filiale');
  $('#global-search').placeholder='Mängel deiner Filiale suchen …';$('#global-search').setAttribute('aria-label','Mängel deiner Filiale suchen');
 };
 drawWorkspace();
})();
