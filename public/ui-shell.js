const menuButton=$('#mobile-menu');
function closeMenu(){document.body.classList.remove('nav-open');menuButton.setAttribute('aria-expanded','false')}
menuButton.onclick=()=>{const open=document.body.classList.toggle('nav-open');menuButton.setAttribute('aria-expanded',String(open))};
$('#menu-scrim').onclick=closeMenu;
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>{closeMenu();$('#global-search').value=''}));
$('#activity-open').onclick=()=>openModal('Letzte Aktivitäten',data.events.length?data.events.map(e=>`<div class="listrow"><div><b>${esc(e.title)}</b><div class="subtext">${esc(e.detail)}</div></div><small>${esc(e.date)}</small></div>`).join(''):'<div class="empty-state">Noch keine Aktivitäten vorhanden.</div>');
const originalDrawWorkspace=drawWorkspace;
drawWorkspace=function(){originalDrawWorkspace();$('#breadcrumb-current').textContent=companyNow()?.name||'Unternehmen';$('#global-search').value=''};
// Retain the platform theme when leaving a branded customer area.
render();
