// In-app notifications for customer managers, branch managers, field workers and platform owner.
// The server (not this UI) decides notification recipients and tenant access.
(()=>{
 const bell=document.getElementById('activity-open');
 if(!bell||!window.FACILITY_USER)return;
 let items=[],unread=0,open=false,loading=false,error='';
 bell.setAttribute('aria-label','Benachrichtigungen öffnen');bell.setAttribute('aria-expanded','false');bell.setAttribute('aria-controls','notification-tray');bell.title='Benachrichtigungen';
 const tray=document.createElement('aside');tray.className='notification-tray';tray.id='notification-tray';tray.setAttribute('aria-label','Benachrichtigungen');tray.hidden=true;document.body.appendChild(tray);
 const escapeHtml=(value)=>String(value??'').replace(/[&<>"']/g,chr=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[chr]));
 const icon={chat:'💬',task:'📋',schedule:'🗓',report:'✓'};
 const date=(raw)=>{try{return new Date(raw).toLocaleString('de-CH',{timeZone:'Europe/Zurich',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}catch{return ''}};
 async function api(method='GET',body){
  if(window.FACILITY_NOTIFICATIONS_DEMO)return window.FACILITY_NOTIFICATIONS_DEMO(method,body);
  const response=await fetch('/api/notifications',{method,headers:{...(method==='PATCH'?{'Content-Type':'application/json'}:{})},...(method==='PATCH'?{body:JSON.stringify(body)}:{})});
  const output=await response.json();if(!response.ok)throw new Error(output.error||'Benachrichtigungen konnten nicht geladen werden.');return output;
 }
 function paintBell(){bell.querySelector('.notification-count')?.remove();if(unread>0){const count=document.createElement('span');count.className='notification-count';count.textContent=unread>99?'99+':String(unread);bell.appendChild(count)}bell.setAttribute('aria-label',unread?`${unread} ungelesene Benachrichtigungen`:'Benachrichtigungen öffnen')}
 function paintTray(){
  tray.hidden=!open;
  if(!open)return;
  tray.innerHTML=`<div class="notification-head"><div><small>DEIN POSTEINGANG</small><h2>Benachrichtigungen</h2></div><div class="notification-controls"><button type="button" id="notification-read-all" ${!unread?'disabled':''}>Alle gelesen</button><button type="button" id="notification-close" class="notification-close" aria-label="Schliessen">×</button></div></div>${error?`<div class="notification-error" role="status">${escapeHtml(error)}</div>`:''}<div class="notification-scroll">${items.length?items.map(item=>`<button class="notification-item ${item.readAt?'':'unread'}" data-notice="${escapeHtml(item.id)}"><span class="notification-symbol" aria-hidden="true">${icon[item.kind]||'•'}</span><span class="notification-copy"><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.body)}</p><small>${escapeHtml(date(item.createdAt))}${item.companyId&&window.FACILITY_USER.role==='superadmin'?' · '+escapeHtml(data?.companies?.find(c=>c.id===item.companyId)?.name||'Kunde'):''}</small></span>${item.readAt?'':'<span class="notification-dot" aria-label="Ungelesen"></span>'}</button>`).join(''):`<div class="notification-empty"><strong>Alles auf dem aktuellen Stand.</strong>Neue Aufträge, Chatnachrichten und Statusänderungen erscheinen hier.</div>`}</div>`;
  tray.querySelector('#notification-close').onclick=()=>toggle(false);
  tray.querySelector('#notification-read-all').onclick=async()=>{try{await api('PATCH',{all:true});await load()}catch(e){error=e.message;paintTray()}};
  tray.querySelectorAll('[data-notice]').forEach(button=>button.onclick=async()=>{
   const item=items.find(n=>n.id===button.dataset.notice);if(!item)return;
   if(!item.readAt){try{await api('PATCH',{id:item.id});item.readAt=new Date().toISOString();unread=Math.max(0,unread-1);paintBell()}catch(e){error=e.message;paintTray();return}}
   toggle(false);openTarget(item);
  });
 }
 function openTarget(item){
  const company=data?.companies?.find(c=>c.id===item.companyId);
  if(!company){if(typeof toast==='function')toast('Dieser Kundenbereich ist nicht mehr verfügbar.');return;}
  if(item.kind==='chat'){
   if(!['manager','superadmin'].includes(window.FACILITY_USER.role))return;
   workspaceId=company.id;workspaceTab='chat';drawWorkspace();return;
  }
  const t=data?.workspaces?.[company.id]?.tasks?.find(t=>t.id===item.taskId);
  if(!t){workspaceId=company.id;workspaceTab='tasks';drawWorkspace();return;}
  if(window.FACILITY_USER.role==='employee'&&typeof openGlobalWork==='function'){openGlobalWork(company.id,t.id);return;}
  workspaceId=company.id;workspaceTab='tasks';drawWorkspace();taskDetail(t.id);
 }
 async function load(){if(loading)return;loading=true;try{const output=await api();items=Array.isArray(output.items)?output.items:[];unread=Number(output.unread)||0;error='';paintBell();paintTray()}catch(e){error=e.message;paintTray()}finally{loading=false}}
 function toggle(next){open=next;bell.setAttribute('aria-expanded',String(open));paintTray();if(open)load()}
 bell.onclick=()=>toggle(!open);
 document.addEventListener('pointerdown',event=>{if(open&&!tray.contains(event.target)&&!bell.contains(event.target))toggle(false)});
 document.addEventListener('keydown',event=>{if(open&&event.key==='Escape')toggle(false)});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)load()});
 setInterval(()=>{if(!document.hidden)load()},45000);
 load();
})();
