// Customer manager: progress and completed-work chronology per branch.
// Read-only and derived from the already tenant-scoped work orders; no parallel project records.
(function(){
 'use strict';
 let companySelection='',selectedLocation='',filter='completed',search='';
 const statusOf=t=>typeof clientWorkflowStatus==='function'?clientWorkflowStatus(t):t.status;
 const doneAt=t=>{
  if(statusOf(t)!=='Erledigt')return null;
  if(t.report?.at)return t.report.at;
  const events=(t.history||[]).filter(h=>h.to==='Erledigt'&&h.at).sort((a,b)=>b.at.localeCompare(a.at));
  return events[0]?.at||t.updatedAt||null;
 };
 const validDate=raw=>{if(!raw)return null;const d=new Date(raw);return Number.isNaN(d.getTime())?null:d};
 const fmtDate=raw=>{const d=validDate(raw);return d?d.toLocaleDateString('de-CH',{timeZone:'Europe/Zurich',day:'2-digit',month:'long',year:'numeric'}):'Datum nicht dokumentiert'};
 const fmtTime=raw=>{const d=validDate(raw);return d?d.toLocaleTimeString('de-CH',{timeZone:'Europe/Zurich',hour:'2-digit',minute:'2-digit'}):''};
 const hours=t=>Number.isFinite(Number(t.report?.hours))?Number(t.report.hours):0;
 const imgFor=location=>typeof location?.image==='string'&&/^data:image\/(?:jpeg|png|webp);base64,[a-z\d+/=]+$/i.test(location.image)?location.image:'/assets/property-cover.png';
 function branchStats(w,l){
  const jobs=(w.tasks||[]).filter(t=>t.locationId===l.id),completed=jobs.filter(t=>statusOf(t)==='Erledigt'),open=jobs.filter(t=>!['Erledigt','Abgelehnt'].includes(statusOf(t)));
  const last=completed.map(doneAt).filter(Boolean).sort().reverse()[0]||null;
  return {l,jobs,completed,open,last,reportHours:completed.reduce((sum,t)=>sum+hours(t),0)};
 }
 const isManager=()=>window.FACILITY_USER?.role==='manager';
 function showBranch(companyId,locationId){if(!isManager()||companyNow()?.id!==companyId)return;selectedLocation=locationId;filter='completed';search='';if(typeof window.openBuildingRecord==='function')window.openBuildingRecord(companyId,locationId);else{workspaceTab='record';drawWorkspace()}}
 function renderManagerProjectPreview(c,w){
  if(!isManager())return;
  const node=$('#workspace-content');if(!node)return;
  const stats=(w.locations||[]).map(l=>branchStats(w,l));
  const section=document.createElement('section');section.className='project-preview';
  section.innerHTML=`<div class="section-title"><div><span class="welcome-kicker">GEBÄUDEAKTE JE FILIALE</span><h2>Was wurde wo erledigt?</h2><p class="project-muted">Abgeschlossene Arbeiten mit Datum, Rapport und Fotodokumentation.</p></div><button type="button" class="outline" id="project-preview-all">Alle Gebäudeakten ansehen ↗</button></div><div class="project-preview-grid">${stats.slice(0,4).map(s=>`<button type="button" class="project-preview-item" data-project-preview="${esc(s.l.id)}"><span class="project-preview-image"><img loading="lazy" src="${esc(imgFor(s.l))}" alt="${s.l.image?'Foto der Filiale':'Illustration der Filiale'} ${esc(s.l.name)}"></span><span class="project-preview-copy"><strong>${esc(s.l.name)}</strong><small>${esc(s.l.city||'Ort nicht hinterlegt')}</small><span><b>${s.completed.length}</b> erledigt <i>·</i> ${s.open.length} offen</span><small>Letzte Arbeit: ${esc(fmtDate(s.last))}</small></span><span class="project-arrow">↗</span></button>`).join('')||'<p class="project-muted">Noch keine Filialen angelegt.</p>'}</div>`;
  node.appendChild(section);
  section.querySelector('#project-preview-all').onclick=()=>showBranch(c.id,'');
  section.querySelectorAll('[data-project-preview]').forEach(b=>b.onclick=()=>showBranch(c.id,b.dataset.projectPreview));
 }
 function renderManagerProjectStatus(c,w){
  if(!isManager()||c.id!==window.FACILITY_USER?.companyId)return;
  if(companySelection!==c.id){companySelection=c.id;selectedLocation='';search='';filter='completed'}
  const stats=(w.locations||[]).map(l=>branchStats(w,l));
  if(selectedLocation&&!stats.some(s=>s.l.id===selectedLocation))selectedLocation='';
  const visibleBranches=selectedLocation?stats.filter(s=>s.l.id===selectedLocation):stats;
  const relevant=visibleBranches.flatMap(s=>s.jobs.map(t=>({...t,branch:s.l,when:doneAt(t),workflowStatus:statusOf(t)})));
  const finished=visibleBranches.reduce((sum,s)=>sum+s.completed.length,0);
  const open=visibleBranches.reduce((sum,s)=>sum+s.open.length,0);
  const reportHours=visibleBranches.reduce((sum,s)=>sum+s.reportHours,0);
  const matched=relevant.filter(t=>{
   if(filter==='completed'&&t.workflowStatus!=='Erledigt')return false;
   if(filter==='open'&&(t.workflowStatus==='Erledigt'||t.workflowStatus==='Abgelehnt'))return false;
   const haystack=[t.title,t.description,t.branch.name,t.branch.city,t.report?.text,t.report?.userName,t.assignee].join(' ').toLowerCase();
   return haystack.includes(search.toLowerCase());
  }).sort((a,b)=>(b.when||b.updatedAt||b.createdAt||'').localeCompare(a.when||a.updatedAt||a.createdAt||''));
  const loc=stats.find(s=>s.l.id===selectedLocation)?.l;
  const target=$('#workspace-content');if(!target)return;
  target.innerHTML=`<section class="project-hero"><div><span class="welcome-kicker">KUNDENPORTAL · FILIALUNTERHALT</span><h2>Projektstand <em>pro Filiale.</em></h2><p>Alle Arbeiten an einem Ort – nachvollziehbar nach Standort, Ausführungsdatum und ausführender Person. Daten aus den vorhandenen Aufträgen und Rapporten.</p></div><div class="project-hero-symbol">${uiIcon('home')}</div></section>
   <section class="panel project-location-bar"><label for="project-location"><span>FILIALE WÄHLEN</span><select id="project-location"><option value="">Alle Filialen (${stats.length})</option>${stats.map(s=>`<option value="${esc(s.l.id)}" ${s.l.id===selectedLocation?'selected':''}>${esc(s.l.name)} · ${esc(s.l.city||'Ort offen')}</option>`).join('')}</select></label><p>${loc?esc([loc.address,loc.zip,loc.city].filter(Boolean).join(', ')||loc.name):'Wähle eine Filiale für deren vollständigen Verlauf.'}</p></section>
   ${loc?`<div class="project-location-cover"><img src="${esc(imgFor(loc))}" alt="${loc.image?'Foto':'Gebäudeillustration'} ${esc(loc.name)}"><div><span>STANDORTPROFIL</span><strong>${esc(loc.name)}</strong><small>${esc([loc.address,loc.zip,loc.city].filter(Boolean).join(' · '))}</small></div>${!loc.image?'<small class="project-cover-note">Beispielbild · Filialfoto kann beim Standort hinterlegt werden</small>':''}</div>`:''}
   <div class="project-stats"><article class="panel"><span>Erledigte Arbeiten</span><strong>${finished}</strong><small>Abgeschlossen und dokumentiert</small></article><article class="panel"><span>Noch offen</span><strong>${open}</strong><small>Gemeldet, freigegeben oder in Arbeit</small></article><article class="panel"><span>Rapportierte Stunden</span><strong>${reportHours.toLocaleString('de-CH',{maximumFractionDigits:2})} h</strong><small>Aus vorhandenen Abschlussrapporten</small></article><article class="panel"><span>Filialen im Blick</span><strong>${visibleBranches.length}</strong><small>${loc?'Ausgewählte Filiale':'Innerhalb deiner Firma'}</small></article></div>
   ${!loc?`<section class="project-branches"><div class="section-title"><h2>Filialübersicht</h2><span class="project-muted">Filiale auswählen, um den Verlauf zu öffnen</span></div><div class="project-branch-grid">${stats.map(s=>`<button type="button" class="project-branch-card" data-project-branch="${esc(s.l.id)}"><span class="project-branch-picture"><img src="${esc(imgFor(s.l))}" loading="lazy" alt="${s.l.image?'Filialfoto':'Gebäudeillustration'} ${esc(s.l.name)}"></span><span class="project-branch-text"><strong>${esc(s.l.name)}</strong><small>${esc(s.l.city||'Ort offen')}</small><span>${s.completed.length} erledigt · ${s.open.length} offen</span><small>Letzte Erledigung: ${esc(fmtDate(s.last))}</small></span><span class="project-arrow">↗</span></button>`).join('')||'<p class="project-muted">Es sind noch keine Filialen erfasst.</p>'}</div></section>`:''}
   <section class="panel project-history"><div class="section-title"><div><span class="welcome-kicker">ARBEITSHISTORIE</span><h2>${loc?'Verlauf · '+esc(loc.name):'Letzte Arbeiten aller Filialen'}</h2></div><span class="project-muted" id="project-count">${matched.length} Einträge</span></div><div class="project-toolbar"><label for="project-search">Arbeiten suchen<input id="project-search" type="search" placeholder="Arbeit, Bauteil, Mitarbeiter …" value="${esc(search)}"></label><label for="project-filter">Status<select id="project-filter"><option value="completed" ${filter==='completed'?'selected':''}>Erledigte Arbeiten</option><option value="open" ${filter==='open'?'selected':''}>Offene Arbeiten</option><option value="all" ${filter==='all'?'selected':''}>Alle Arbeiten</option></select></label></div><div class="project-timeline">${matched.map(t=>{
    const complete=t.workflowStatus==='Erledigt';const stamp=complete?t.when:t.updatedAt||t.createdAt;
    const before=t.photos||[],after=t.report?.photos||[];
    return `<article class="project-work"><div class="project-work-rail"><span class="project-work-dot ${complete?'is-complete':''}">${uiIcon(complete?'tasks':'clock')}</span></div><div class="project-work-card"><div class="project-work-top"><span class="project-status ${complete?'done':''}">${esc(t.workflowStatus)}</span><span class="project-work-date">${esc(fmtDate(stamp))}${fmtTime(stamp)?' · '+esc(fmtTime(stamp))+' Uhr':''}</span></div><h3>${esc(t.title)}</h3><div class="project-work-meta"><span>${uiIcon('pin')} ${esc(t.branch.name)}</span><span>${uiIcon('team')} ${esc(t.report?.userName||t.assignee||'Nicht dokumentiert')}</span></div><p>${esc(t.report?.text||t.description||'Keine Beschreibung hinterlegt.')}</p>${complete&&t.report?`<div class="project-work-details"><span>${esc(hours(t).toLocaleString('de-CH'))} Std. rapportiert</span><span>${after.length} Nachher-Fotos</span><span>${before.length} Vorher-Fotos</span></div>`:!complete?'<p class="project-muted">Die Ausführung ist noch nicht abgeschlossen.</p>':'<p class="project-muted">Für diesen Bestandsauftrag liegt kein Abschlussrapport vor.</p>'}${before.length+after.length?`<div class="project-work-photos">${before.slice(0,2).map(p=>`<button class="photo-thumb" type="button" data-photo-company="${esc(c.id)}" data-photo-task="${esc(t.id)}" data-photo-id="${esc(p.id)}" aria-label="Vorher-Foto öffnen"><img loading="lazy" src="${esc(photoURL(c.id,t.id,p))}" alt="Vorher · ${esc(t.title)}"><span>Vorher</span></button>`).join('')}${after.slice(0,2).map(p=>`<button class="photo-thumb" type="button" data-photo-company="${esc(c.id)}" data-photo-task="${esc(t.id)}" data-photo-id="${esc(p.id)}" aria-label="Nachher-Foto öffnen"><img loading="lazy" src="${esc(photoURL(c.id,t.id,p))}" alt="Nachher · ${esc(t.title)}"><span>Nachher</span></button>`).join('')}</div>`:''}<div class="project-work-actions"><button type="button" class="outline" data-project-task="${esc(t.id)}">Auftrag öffnen</button>${t.report?`<button type="button" class="outline" data-project-report="${esc(t.id)}">Rapport / PDF</button>`:''}${before.length+after.length?`<span>${uiIcon('company')} ${before.length+after.length} Fotos im Auftrag</span>`:''}</div></div></article>`;
   }).join('')||'<div class="project-empty">Keine passenden Arbeiten vorhanden. Abgeschlossene Aufträge erscheinen nach dem Mitarbeiter-Rapport automatisch hier.</div>'}</div></section>`;
  $('#project-location').onchange=e=>{selectedLocation=e.target.value;search='';filter='completed';renderManagerProjectStatus(c,w)};
  $('#project-search').oninput=e=>{const point=e.target.selectionStart;search=e.target.value;renderManagerProjectStatus(c,w);const input=$('#project-search');input.focus();try{input.setSelectionRange(point,point)}catch{}};
  $('#project-filter').onchange=e=>{filter=e.target.value;renderManagerProjectStatus(c,w)};
  target.querySelectorAll('[data-project-branch]').forEach(b=>b.onclick=()=>showBranch(c.id,b.dataset.projectBranch));
  target.querySelectorAll('[data-project-task]').forEach(b=>b.onclick=()=>taskDetail(b.dataset.projectTask));
  target.querySelectorAll('[data-project-report]').forEach(b=>b.onclick=()=>reportPrint(c.id,b.dataset.projectReport));
  if(typeof bindPhotoGallery==='function')bindPhotoGallery();
 }
 window.renderManagerProjectStatus=renderManagerProjectStatus;
 window.renderManagerProjectPreview=renderManagerProjectPreview;
})();
