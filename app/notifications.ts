/** Server-owned notification routing. Never derive recipients from browser-supplied identities. */
export type NotificationRecipient = {
  email:string; name:string; role:string; company_id:string|null; location_id:string|null; active:number;
};
export type NotificationDraft = {
  recipientEmail:string; companyId:string; locationId:string|null; taskId:string|null;
  kind:'task'|'schedule'|'report'|'chat'; title:string; body:string;
};
export type NotificationContext = {ownerEmail:string; companyId:string; locationId?:string|null; taskId?:string|null; actorEmail:string};

const clean=(value:unknown)=>String(value??'').trim().toLowerCase();
const oneLine=(value:unknown,max=155)=>String(value??'').replace(/\s+/g,' ').trim().slice(0,max);
function unique(targets:NotificationRecipient[], ctx:NotificationContext){
  const recipients=new Map<string,NotificationRecipient>();
  for(const item of targets){
    if(!item.active||!item.email||clean(item.email)===clean(ctx.actorEmail))continue;
    if(item.role==='manager'&&item.company_id!==ctx.companyId)continue;
    if(item.role==='branch'&&(item.company_id!==ctx.companyId||item.location_id!==ctx.locationId))continue;
    recipients.set(clean(item.email),item);
  }
  return [...recipients.values()];
}
export function workflowNotifications(action:string,ctx:NotificationContext,task:any,users:NotificationRecipient[]):NotificationDraft[]{
  const manager=users.filter(u=>u.role==='manager');
  const branches=users.filter(u=>u.role==='branch');
  const employees=users.filter(u=>u.role==='employee');
  const owner:NotificationRecipient={email:ctx.ownerEmail,name:'Plattformverwaltung',role:'superadmin',company_id:null,location_id:null,active:1};
  let targets:NotificationRecipient[]=[],kind:NotificationDraft['kind']='task',title='',body='';
  const taskTitle=oneLine(task?.title,95);
  if(action==='create'){
    targets=[owner,...manager];title='Neuer Mangel gemeldet';body=taskTitle+(task?.priority==='Dringend'?' · Dringend':'');
  }else if(action==='approve'){
    targets=[...branches,...employees];title='Auftrag freigegeben';body=taskTitle;
  }else if(action==='reject'){
    targets=[...branches];title='Mangel abgelehnt';body=taskTitle;
  }else if(action==='schedule'){
    targets=[...branches,...employees];kind='schedule';title='Einsatztermin bestätigt';body=taskTitle+(task?.due?' · '+task.due:'')+(task?.startTime?' um '+task.startTime:'');
  }else if(action==='complete'){
    targets=[owner,...manager,...branches];kind='report';title='Arbeit abgeschlossen';body=taskTitle+' · Rapport verfügbar';
  }else if(action==='edit'){
    targets=[...manager];title='Mangel aktualisiert';body=taskTitle;
  }else return [];
  // Employees see the global approved-job pool. A named assignment alerts only its match.
  // The default shared pool is notified when there is no matching registered employee.
  if(['approve','schedule'].includes(action)){
    const assigned=clean(task?.assignee);
    const matches=employees.filter(u=>clean(u.email)===assigned||clean(u.name)===assigned);
    if(matches.length)targets=targets.filter(u=>u.role!=='employee').concat(matches);
  }
  return unique(targets,{...ctx,locationId:ctx.locationId??task?.locationId??null}).map(u=>({
    recipientEmail:clean(u.email),companyId:ctx.companyId,locationId:ctx.locationId??task?.locationId??null,taskId:ctx.taskId??task?.id??null,
    kind,title,body:oneLine(body),
  }));
}
export function chatNotifications(ctx:NotificationContext, message:string, authorRole:string, users:NotificationRecipient[]):NotificationDraft[]{
 const targets=authorRole==='manager'?
  [{email:ctx.ownerEmail,name:'Plattformverwaltung',role:'superadmin',company_id:null,location_id:null,active:1}]:
  users.filter(u=>u.role==='manager'&&u.company_id===ctx.companyId);
 return unique(targets,ctx).map(u=>({
  recipientEmail:clean(u.email),companyId:ctx.companyId,locationId:null,taskId:ctx.taskId??null,kind:'chat',
  title:'Neue Chatnachricht',body:oneLine(message),
 }));
}
export async function storeNotifications(db:D1Database,ownerId:string,items:NotificationDraft[],now:string){
 if(!items.length)return;
 for(const item of items.slice(0,250)){
  await db.prepare(`INSERT INTO notifications (id,owner_id,recipient_email,company_id,location_id,task_id,kind,title,body,created_at,read_at)
   VALUES (?,?,?,?,?,?,?,?,?,?,NULL)`).bind(crypto.randomUUID(),ownerId,item.recipientEmail,item.companyId,item.locationId,item.taskId,item.kind,item.title,item.body,now).run();
 }
}
