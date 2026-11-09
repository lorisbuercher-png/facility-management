// Isolated browser demo. Never reads or writes live APIs.
(async()=>{
 document.body.classList.add('demo-loading');
 const DEMO_KEY='facility-public-demo-master-v2',roles={manager:'Manager',branch:'Filialleiter'},role=new URLSearchParams(location.search).get('role')||'manager';
 const chosen=roles[role]?role:'manager';
 const now=new Date().toISOString(),today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Zurich'}).format(new Date()),day=new Date(Date.now()+86400000).toISOString().slice(0,10);
 const entry=(id,action,from,to,userRole,note='')=>({id,action,from,to,userId:'demo-'+userRole,userName:'Demo '+roles[userRole],userRole,at:now,note});
 const company={id:'demo-musterfirma-v2',name:'Musterfirma AG · Demo',short:'Musterfirma',color:'#526f9e',status:'Aktiv',locations:3,users:0,contact:'',logo:'',modules:['Mängel & Aufträge','Standorte','Rapporte'],branding:{primary:'#4e75b2',accent:'#a8c5d6',background:'#f2f6fa',text:'#263b52',font:'system',radius:'round',mode:'light',wallpaper:'sky',title:'Deine Gebäude. Alles im Blick.',greeting:'Drei Filialen. Ein gemeinsamer Ort für den Gebäudeunterhalt.',modules:{statistics:true,locations:true,activity:true}}};
 const locations=['Basel','Luzern','Zürich'].map((name,i)=>({id:'demo-l'+i,name:'Filiale '+name,address:'',zip:'',city:name,contact:'',notes:'Beispielstandort · Zutritt vor dem Einsatz mit der Filialleitung abstimmen.'}));
 const task=(id,title,status,index,priority='Normal')=>({id,title,description:'Beispielmeldung: Bitte die beschädigte Fläche beim Eingang prüfen und instand setzen.',priority,locationId:locations[index].id,status,due:day,assignee:'Demo Team',createdAt:now,updatedAt:now,createdById:'demo-branch',workflowRevision:status==='Gemeldet'?1:status==='Freigegeben'?2:3,photos:[{id:'demo-before',type:'image/png',size:0}],history:[entry(id+'-1','Mangel gemeldet',null,'Gemeldet','branch'),...(status!=='Gemeldet'?[entry(id+'-2','Mangel freigegeben','Gemeldet','Freigegeben','manager')]:[]),...(status==='Erledigt'?[entry(id+'-3','Arbeit erledigt','Freigegeben','Erledigt','employee')]:[])]});
 let master;try{master=JSON.parse(localStorage.getItem(DEMO_KEY))}catch{}if(!master){const tasks=[task('demo-t1','Wand beim Eingang ausbessern','Gemeldet',0,'Dringend'),task('demo-t2','Türschliesser einstellen','Freigegeben',1),task('demo-t3','Sockel instand gesetzt','Erledigt',2)];tasks[1].due=today;tasks[1].startTime='09:00';tasks[1].durationMinutes=90;tasks[2].report={text:'Beispielrapport: Beschädigte Stelle gereinigt, ausgebessert und den Arbeitsplatz sauber übergeben.',hours:1.5,userId:'demo-employee',userName:'Demo Mitarbeiter',at:now,photos:[{id:'demo-after',type:'image/png',size:0}]};master={companies:[company],events:[],workspaces:{[company.id]:{locations,tasks}}};localStorage.setItem(DEMO_KEY,JSON.stringify(master))}
 const DEMO_NOTICES_KEY='facility-public-demo-notifications-v2';
 let demoNotices;try{demoNotices=JSON.parse(localStorage.getItem(DEMO_NOTICES_KEY)||'null')}catch{}
 if(!Array.isArray(demoNotices)){
  demoNotices=[
   {recipientRole:'manager',kind:'task',title:'Neuer Mangel gemeldet',body:'Wand beim Eingang ausbessern · Dringend',taskId:'demo-t1',locationId:'demo-l0'},
   {recipientRole:'employee',kind:'schedule',title:'Einsatztermin bestätigt',body:'Türschliesser einstellen · '+day,taskId:'demo-t2',locationId:'demo-l1'},
   {recipientRole:'superadmin',kind:'report',title:'Arbeit abgeschlossen',body:'Sockel instand gesetzt · Rapport verfügbar',taskId:'demo-t3',locationId:'demo-l2'},
   {recipientRole:'branch',kind:'task',title:'Auftrag freigegeben',body:'Türschliesser einstellen',taskId:'demo-t2',locationId:'demo-l1'},
  ].map((n,i)=>({...n,id:'demo-notice-'+i,companyId:company.id,createdAt:now,readAt:null}));localStorage.setItem(DEMO_NOTICES_KEY,JSON.stringify(demoNotices));
 }
 const persistNotices=()=>localStorage.setItem(DEMO_NOTICES_KEY,JSON.stringify(demoNotices));
 const demoNotice=(recipientRole,kind,title,body,taskId=null,locationId=null)=>{
  if(recipientRole===chosen)return;
  demoNotices.unshift({id:'demo-notice-'+Date.now()+'-'+Math.random().toString(36).slice(2),recipientRole,companyId:company.id,locationId,taskId,kind,title,body,createdAt:new Date().toISOString(),readAt:null});persistNotices();
 };
 window.FACILITY_NOTIFICATIONS_DEMO=async(method='GET',body)=>{
  if(method==='GET'){const records=demoNotices.filter(n=>n.recipientRole===chosen);return {items:records.slice(0,80).map(({recipientRole,...item})=>item),unread:records.filter(n=>!n.readAt).length}};
  if(method==='PATCH'&&(body?.all===true||typeof body?.id==='string')){
   let updated=0;for(const item of demoNotices){if(item.recipientRole!==chosen||item.readAt||body.all!==true&&item.id!==body.id)continue;item.readAt=new Date().toISOString();updated++}persistNotices();return {ok:true,updated};
  }
  throw new Error('Ungültige Demo-Aktion.');
 };
 const DEMO_CHAT_KEY='facility-public-demo-customer-chat-v2';
 window.FACILITY_CHAT_DEMO=async(companyId,method='GET',body)=>{
  if(!['manager','superadmin'].includes(chosen)||companyId!==company.id)throw new Error('Kein Zugriff auf diesen Demochat.');
  let history=[];try{history=JSON.parse(localStorage.getItem(DEMO_CHAT_KEY)||'[]')}catch{}
  if(!Array.isArray(history))history=[];
  if(method==='GET')return {messages:history.filter(m=>m.companyId===companyId)};
  if(method!=='POST'||!body?.message?.trim()||body.message.length>3000)throw new Error('Ungültige Nachricht.');
  if(body.taskId&&!(master.workspaces[company.id]?.tasks||[]).some(t=>t.id===body.taskId))throw new Error('Auftrag nicht gefunden.');
  const message={id:'demo-msg-'+Date.now()+'-'+Math.random().toString(36).slice(2),companyId,taskId:body.taskId||null,authorRole:chosen,authorName:'Demo '+roles[chosen],body:body.message.trim(),createdAt:new Date().toISOString()};
  history.push(message);localStorage.setItem(DEMO_CHAT_KEY,JSON.stringify(history));demoNotice(chosen==='manager'?'superadmin':'manager','chat','Neue Chatnachricht',message.body,message.taskId);return {message};
 };
 window.FACILITY_USER={id:'demo-'+chosen,name:'Demo '+roles[chosen],email:'demo@example.invalid',role:chosen,companyId:company.id,locationId:locations[0].id};window.FACILITY_STORAGE_KEY='facility-demo-view-'+chosen;
 function projected(){const copy=structuredClone(master),w=copy.workspaces[company.id];if(chosen==='branch'){w.locations=w.locations.filter(l=>l.id===locations[0].id);w.tasks=w.tasks.filter(t=>t.locationId===locations[0].id)}return copy}
 localStorage.setItem(window.FACILITY_STORAGE_KEY,JSON.stringify(projected()));
 window.fetch=async()=>{throw new Error('Im Demobereich werden keine Live-APIs verwendet.')};
 const banner=document.createElement('section');banner.className='demo-mode-banner';banner.innerHTML=`<div><strong>Demomodus · Beispieldaten</strong><span>Lokale Simulation. Keine Verbindung zu deinen Kundendaten. Gebäudeabbildungen sind Illustrationen.</span></div><label>Ansicht<select id="demo-role">${Object.entries(roles).map(([id,label])=>`<option value="${id}" ${id===chosen?'selected':''}>${label}</option>`).join('')}</select></label><button class="outline" id="demo-reset">Demo zurücksetzen</button><a href="/">Zur Startseite ↗</a>`;document.body.prepend(banner);
 banner.querySelector('select').onchange=e=>{const target=new URL(location.href);target.searchParams.set('role',e.target.value);location.assign(target.href)};banner.querySelector('#demo-reset').onclick=()=>{localStorage.removeItem(DEMO_KEY);localStorage.removeItem('facility-public-demo-team-v2');localStorage.removeItem(DEMO_CHAT_KEY);localStorage.removeItem(DEMO_NOTICES_KEY);location.reload()};document.title='Facility · Kunden-Demo (Manager und Filialleitung)';
 const script=src=>new Promise((resolve,reject)=>{const el=document.createElement('script');el.src=src+'?v=demo-boot-20261109b';el.onload=resolve;el.onerror=reject;document.body.append(el)});
 for(const src of ['/demo-workflow.js','/app.js','/tenant.js','/ui-shell.js','/ambience.js','/team.js','/photos.js','/workflow.js','/wallpapers.js','/welcome.js','/review.js','/branch-team.js','/building-record.js','/project-status.js','/location-image.js','/customer-chat.js','/customer-navigation.js','/branch-view.js','/notifications.js']){await script(src);if(src==='/photos.js')photoURL=function(cid,id,p){return p.id==='demo-after'?'/assets/office-cover.png':'/assets/property-cover.png'};if(src==='/review.js'&&typeof priorityOptions!=='function')throw new Error('Review script could not initialize');}
 const persist=()=>localStorage.setItem(DEMO_KEY,JSON.stringify(master));
 save=function(){if(chosen!=='superadmin'){toast('Diese Änderung ist im Demomodus dem Superadmin vorbehalten.');return false}master=structuredClone(data);persist();return true};
 window.FACILITY_SYNC_READY=()=>true;window.FACILITY_REFRESH=async()=>{data=projected();localStorage.setItem(window.FACILITY_STORAGE_KEY,JSON.stringify(data))};
 photoURL=function(cid,id,p){return p.id==='demo-after'?'/assets/office-cover.png':'/assets/property-cover.png'};
 flowRequest=async function(input,files=[]){
  if(files.length)throw new Error('Foto-Uploads testest du im echten Unternehmensbereich. Die Demo nutzt nur Gebäudeillustrationen.');
  const next=structuredClone(master),u=window.FACILITY_USER;
  const result=window.FACILITY_DEMO_WORKFLOW(next,input,{id:u.id,ownerId:'demo-superadmin',email:u.email,name:u.name,role:chosen,companyId:u.companyId,locationId:u.locationId},new Date().toISOString(),createId());
  if(result.error)throw new Error(result.error);
  master=next;persist();await window.FACILITY_REFRESH();
  const t=master.workspaces[input.companyId]?.tasks?.find(t=>t.id===result.taskId);
  if(t){
   const locationId=t.locationId;
   if(input.action==='create')for(const recipient of ['manager','superadmin'])demoNotice(recipient,'task','Neuer Mangel gemeldet',t.title,result.taskId,locationId);
   if(input.action==='approve')for(const recipient of ['branch','employee'])demoNotice(recipient,'task','Auftrag freigegeben',t.title,result.taskId,locationId);
   if(input.action==='reject')demoNotice('branch','task','Mangel abgelehnt',t.title,result.taskId,locationId);
   if(input.action==='schedule')for(const recipient of ['branch','employee'])demoNotice(recipient,'schedule','Einsatztermin bestätigt',t.title+' · '+t.due,result.taskId,locationId);
   if(input.action==='complete')for(const recipient of ['manager','superadmin','branch'])demoNotice(recipient,'report','Arbeit abgeschlossen',t.title+' · Rapport verfügbar',result.taskId,locationId);
  }
  return {ok:true,taskId:result.taskId};
 };
 let demoTeam;try{demoTeam=JSON.parse(localStorage.getItem('facility-public-demo-team-v2'))}catch{}if(!Array.isArray(demoTeam))demoTeam=locations.map((l,i)=>({id:'demo-branch-'+i,name:'Demo Filialleitung '+l.city,email:'filiale'+i+'@example.invalid',role:'branch',owner_id:'demo-superadmin',company_id:company.id,location_id:l.id,active:1,revision:1}));
 teamApi=async(method='GET',body)=>{if(!['superadmin','manager'].includes(chosen))throw new Error('Keine Berechtigung in dieser Demo-Ansicht.');if(method==='GET')return {items:structuredClone(demoTeam)};if(method==='POST'){if(body.role!=='branch'||body.companyId!==company.id||!locations.some(l=>l.id===body.locationId))throw new Error('Nur Filialleiter dieser Demo-Firma sind erlaubt.');if(demoTeam.some(u=>u.email.toLowerCase()===body.email.toLowerCase()&&u.id!==body.id))throw new Error('Diese Demo-E-Mail-Adresse ist bereits zugeordnet.');if(body.id){const u=demoTeam.find(u=>u.id===body.id);if(!u||u.revision!==body.revision)throw new Error('Demo-Zuordnung inzwischen geändert.');Object.assign(u,{name:body.name,email:body.email,location_id:body.locationId,revision:u.revision+1})}else demoTeam.unshift({id:createId(),name:body.name,email:body.email,role:'branch',company_id:company.id,location_id:body.locationId,active:1,revision:1})}else if(method==='PATCH'){const u=demoTeam.find(u=>u.id===body.id);if(!u||u.revision!==body.revision)throw new Error('Demo-Zuordnung inzwischen geändert.');u.active=body.active?1:0;u.revision++}else throw new Error('Aktion in dieser Demo nicht verfügbar.');localStorage.setItem('facility-public-demo-team-v2',JSON.stringify(demoTeam));return {ok:true}};
 $('.account b').textContent=window.FACILITY_USER.name;$('.account small').textContent=roles[chosen];$('.avatar').textContent='DE';
 const signout=$('.account a');if(signout){signout.href='/';signout.setAttribute('aria-label','Zur echten Plattform')}
 tenant(company.id);
 document.body.classList.remove('demo-loading');
 renderUsers=function(){openModal('Demo · Team','<p>Rollen wechselst du über die Auswahl oben. Es werden keine echten Zugänge eingerichtet.</p>')};
})().catch(error=>{
 console.error('Facility demo startup failed:',error);
 document.body.classList.remove('demo-loading');
 const notice=document.createElement('section');
 notice.className='demo-startup-error';
 notice.setAttribute('role','alert');
 notice.innerHTML='<h2>Demo konnte nicht gestartet werden</h2><p>Beim Laden einer Funktion ist ein Fehler aufgetreten. Bitte lade die Seite neu. Falls das Problem bleibt, setze die lokalen Demodaten zurück.</p><div><button class="primary" id="demo-startup-retry" type="button">Seite neu laden</button><button class="outline" id="demo-startup-reset" type="button">Demodaten zurücksetzen</button></div>';
 document.body.prepend(notice);
 notice.querySelector('#demo-startup-retry').onclick=()=>location.reload();
 notice.querySelector('#demo-startup-reset').onclick=()=>{
  for(const key of ['facility-public-demo-master-v2','facility-public-demo-team-v2','facility-public-demo-customer-chat-v2','facility-public-demo-notifications-v2'])localStorage.removeItem(key);
  location.reload();
 };
});
