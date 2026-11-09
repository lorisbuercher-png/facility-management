// Conversation between customer manager and F&B platform team, company-isolated on server.
(function(){
 if(!['superadmin','manager'].includes(window.FACILITY_USER?.role))return;
 let currentCompany='',messages=[],busy=false,lastError='';
 const stamp=at=>new Date(at).toLocaleString('de-CH',{timeZone:'Europe/Zurich',dateStyle:'short',timeStyle:'short'});
 async function chatApi(companyId,method='GET',body){
  if(window.FACILITY_CHAT_DEMO)return window.FACILITY_CHAT_DEMO(companyId,method,body);
  const url='/api/chat'+(method==='GET'?'?companyId='+encodeURIComponent(companyId):'');
  const response=await fetch(url,{method,headers:{...(method==='POST'?{'Content-Type':'application/json'}:{})},...(method==='POST'?{body:JSON.stringify({companyId,...body})}:{})});
  let out;try{out=await response.json()}catch{throw new Error('Chat-Antwort konnte nicht gelesen werden.')}if(!response.ok)throw new Error(out.error||'Chat konnte nicht geladen werden.');return out;
 }
 function renderMessages(company){
  if(currentCompany!==company.id)return;
  const list=$('#customer-chat-list');if(!list)return;
  list.innerHTML=messages.length?messages.map(m=>`<article class="chat-bubble ${m.authorRole==='superadmin'?'chat-team':'chat-manager'}"><div class="chat-bubble-by"><strong>${esc(m.authorName)}</strong><span>${m.authorRole==='superadmin'?'F&B Spezialbau':'Kundenmanager'}</span></div><p>${esc(m.body)}</p>${m.taskId?`<button class="chat-task-link" data-chat-task="${esc(m.taskId)}">${uiIcon('tasks')} Auftrag öffnen</button>`:''}<small>${esc(stamp(m.createdAt))}</small></article>`).join(''):'<div class="chat-empty"><h3>Ein direkter Draht zur Ausführung.</h3><p>Fragen, Rückmeldungen oder organisatorische Abklärungen können hier direkt mit F&B Spezialbau besprochen werden. Die Unterhaltung bleibt dem Unternehmen zugeordnet.</p></div>';
  list.querySelectorAll('[data-chat-task]').forEach(b=>b.onclick=()=>{const t=data.workspaces[company.id]?.tasks?.find(t=>t.id===b.dataset.chatTask);if(t)taskDetail(t.id);else toast('Auftrag nicht mehr verfügbar.')});
  list.scrollTop=list.scrollHeight;
 }
 async function load(company){try{const out=await chatApi(company.id);if(currentCompany!==company.id)return;messages=out.messages||[];lastError='';renderMessages(company);const status=$('#chat-status');if(status)status.textContent=messages.length+' Nachrichten · Nur für diesen Kunden sichtbar';}catch(err){if(currentCompany!==company.id)return;lastError=err.message;const el=$('#chat-status');if(el)el.textContent=lastError;}}
 function renderCustomerChat(company){
  if(!company||!['superadmin','manager'].includes(window.FACILITY_USER?.role))return;
  currentCompany=company.id;messages=[];
  const container=$('#workspace-content');if(!container)return;
  const tasks=data.workspaces[company.id]?.tasks||[];
  container.innerHTML=`<section class="chat-hero"><div><span class="welcome-kicker">DIREKTE KOMMUNIKATION</span><h2>Eine Frage? Wir sind da.</h2><p>Der gemeinsame Chat zwischen ${esc(company.name)} und F&B Spezialbau. Nachrichten bleiben dokumentiert und beim richtigen Kunden.</p></div><div class="chat-hero-icon">${uiIcon('team')}</div></section><section class="chat-layout"><div class="panel chat-room"><div class="chat-header"><div class="chat-people"><span class="chat-avatar">FB</span><div><strong>F&B Spezialbau · Kundensupport</strong><small id="chat-status">Nachrichten werden geladen …</small></div></div><button class="outline" id="chat-refresh">Aktualisieren</button></div><div class="chat-thread" id="customer-chat-list" role="log" aria-label="Nachrichtenverlauf"><p class="chat-loading">Unterhaltung wird geladen …</p></div><form id="chat-composer" class="chat-composer"><label for="chat-message">Nachricht an ${window.FACILITY_USER.role==='manager'?'F&B Spezialbau':'den Kunden'}</label><textarea id="chat-message" maxlength="3000" required rows="3" placeholder="Frage oder Rückmeldung schreiben …"></textarea><div class="chat-composer-bottom"><select id="chat-task"><option value="">Keinem Auftrag zuordnen</option>${tasks.map(t=>`<option value="${esc(t.id)}">${esc(t.title)} · ${esc(data.workspaces[company.id]?.locations?.find(l=>l.id===t.locationId)?.name||'Filiale')}</option>`).join('')}</select><button class="primary" id="chat-send">Nachricht senden ${uiIcon('arrow')}</button></div><p id="chat-error" role="alert" class="chat-error"></p></form></div><aside class="chat-side"><div class="panel"><span class="welcome-kicker">SO FUNKTIONIERT'S</span><h3>Alles an einem Ort.</h3><p>Der Manager schreibt direkt an unser Ausführungsteam. Wir antworten im gleichen Verlauf. Fragen lassen sich einem konkreten Auftrag zuordnen.</p></div><div class="panel"><span class="welcome-kicker">HINWEIS</span><h3>Kein Notfallkanal.</h3><p>Neue Chatnachrichten erscheinen unter Mitteilungen. Wenn der E-Mail-Versand für die Plattform eingerichtet ist, erhalten die berechtigten Empfänger zusätzlich einen E-Mail-Hinweis ohne Nachrichteninhalt. Die Demo verschickt keine E-Mails. Bei dringenden Ereignissen bitte zusätzlich telefonisch Kontakt aufnehmen.</p></div></aside></section>`;
  $('#chat-refresh').onclick=()=>load(company);
  $('#chat-composer').onsubmit=async event=>{event.preventDefault();if(busy)return;const body=$('#chat-message').value.trim(),taskId=$('#chat-task').value;if(!body)return;
   busy=true;$('#chat-send').disabled=true;$('#chat-error').textContent='';
   try{const out=await chatApi(company.id,'POST',{message:body,taskId:taskId||null});if(currentCompany!==company.id)return;messages.push(out.message);$('#chat-message').value='';renderMessages(company);$('#chat-status').textContent=messages.length+' Nachrichten · Nur für diesen Kunden sichtbar';}catch(err){$('#chat-error').textContent=err.message}finally{busy=false;const send=$('#chat-send');if(send)send.disabled=false}
  };
  load(company);
 }
 window.renderCustomerChat=renderCustomerChat;
})();
