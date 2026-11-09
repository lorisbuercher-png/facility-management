import { env } from 'cloudflare:workers';
import { roleFromIdentity,type Grant } from '../../access';
import { canAccessConversation,validateChatMessage } from '../../customer-chat';
import { chatNotifications,storeNotifications,type NotificationRecipient } from '../../notifications';
import { sendChatEmailAlerts } from '../../chat-email';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
type Viewer={id:string; ownerId:string; role:string; companyId?:string|null; name:string; email:string; grant?:Grant};
async function authenticate(request:Request):Promise<Viewer|Response>{
 const identity=roleFromIdentity(request.headers.get('oai-authenticated-user-id'),request.headers.get('oai-authenticated-user-email'),(env as any).FACILITY_ADMIN_EMAIL);
 if(identity.error)return reply({error:identity.error},identity.status);
 if(!env.DB)return reply({error:'Datenbank nicht verfügbar.'},503);
 if(identity.role==='superadmin')return {id:identity.id!,ownerId:identity.id!,role:'superadmin',name:'F&B Spezialbau',email:identity.email!};
 const grant=await env.DB.prepare('SELECT * FROM team_access WHERE email = ? AND active = 1').bind(identity.email).first<Grant>();
 if(!grant||grant.role!=='manager')return reply({error:'Nur Kundenmanager und Plattformverwaltung können diesen Chat verwenden.'},403);
 return {id:identity.id!,ownerId:grant.owner_id,role:grant.role,companyId:grant.company_id,name:grant.name,email:grant.email,grant};
}
async function context(request:Request,companyId:string){
 const viewer=await authenticate(request);if(viewer instanceof Response)return {error:viewer};
 if(!env.DB)return {error:reply({error:'Datenbank nicht verfuegbar.'},503)};
 const row=await env.DB.prepare('SELECT payload FROM platform_state WHERE owner_id = ?').bind(viewer.ownerId).first<{payload:string}>();
 if(!row)return {error:reply({error:'Unternehmensdaten fehlen.'},404)};
 let state:any;try{state=JSON.parse(row.payload)}catch{return {error:reply({error:'Unternehmensdaten ungültig.'},500)}}
 if(!canAccessConversation(viewer,companyId,state))return {error:reply({error:'Kein Zugriff auf diesen Unternehmenschat.'},403)};
 return {viewer,state};
}
export async function GET(request:Request){
 const companyId=new URL(request.url).searchParams.get('companyId')||'';
 const result=await context(request,companyId);if(result.error)return result.error;
 if(!env.DB)return reply({error:'Datenbank nicht verfuegbar.'},503);
 const records=await env.DB.prepare('SELECT * FROM (SELECT id,company_id AS companyId,task_id AS taskId,author_role AS authorRole,author_name AS authorName,body,created_at AS createdAt FROM customer_messages WHERE owner_id = ? AND company_id = ? ORDER BY created_at DESC, id DESC LIMIT 500) ORDER BY createdAt ASC, id ASC').bind(result.viewer!.ownerId,companyId).all();
 return reply({messages:records.results});
}
export async function POST(request:Request){
 if(request.headers.get('Origin')!==new URL(request.url).origin)return reply({error:'Ungültiger Ursprung.'},403);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'JSON erforderlich.'},415);
 const raw=await request.text();if(raw.length>10000)return reply({error:'Nachricht zu lang.'},413);
 let input:any;try{input=JSON.parse(raw)}catch{return reply({error:'Ungültige Daten.'},400)}
 const result=await context(request,input?.companyId||'');if(result.error)return result.error;
 if(!env.DB)return reply({error:'Datenbank nicht verfuegbar.'},503);
 const {viewer,state}=result;
 const error=validateChatMessage(input,state,viewer!);if(error)return reply({error},400);
 // Reconfirm active tenant grant during write, never trust a client-supplied role/author.
 const now=new Date().toISOString(),id=crypto.randomUUID();
 const insert=await env.DB.prepare(`INSERT INTO customer_messages (id,owner_id,company_id,task_id,author_id,author_name,author_role,body,created_at)
 SELECT ?,?,?,?,?,?,?,?,?
 WHERE EXISTS (SELECT 1 FROM platform_state p WHERE p.owner_id=? AND EXISTS (SELECT 1 FROM json_each(p.payload,'$.companies') c WHERE json_extract(c.value,'$.id')=?))
 AND (?='superadmin' OR EXISTS (SELECT 1 FROM team_access g WHERE g.owner_id=? AND g.email=? AND g.active=1 AND g.role='manager' AND g.company_id=? AND g.id=? AND g.revision=?))`).bind(
 id,viewer!.ownerId,input.companyId,input.taskId||null,viewer!.id,viewer!.name,viewer!.role,input.message.trim(),now,
 viewer!.ownerId,input.companyId,viewer!.role,viewer!.ownerId,viewer!.email,input.companyId,viewer!.grant?.id||'',viewer!.grant?.revision||0
 ).run();
 if(insert.meta.changes!==1)return reply({error:'Zugang oder Unternehmen wurde inzwischen geändert. Bitte neu laden.'},409);
 let recipientEmails:string[]=[];
 try{
  const team=await env.DB.prepare('SELECT email,name,role,company_id,location_id,active FROM team_access WHERE owner_id = ? AND active = 1').bind(viewer!.ownerId).all<NotificationRecipient>();
  const drafts=chatNotifications({ownerEmail:(env as any).FACILITY_ADMIN_EMAIL,companyId:input.companyId,taskId:input.taskId||null,actorEmail:viewer!.email},input.message.trim(),viewer!.role,team.results);
  recipientEmails=drafts.map(item=>item.recipientEmail);
  await storeNotifications(env.DB,viewer!.ownerId,drafts,now);
 }catch(e){console.error('Chat in-app notification could not be saved:',e instanceof Error?e.message:'unknown');}
 // Sending is deliberately after the authoritative INSERT. A failed email
 // never rolls back a stored customer message or its in-app notification.
 try{
  const company=state.companies.find((c:any)=>c.id===input.companyId);
  const sent=await sendChatEmailAlerts(env as any,{
   messageId:id,companyName:company?.name||'Kundenunternehmen',
   authorRole:viewer!.role as 'manager'|'superadmin',
   actorEmail:viewer!.email,recipientEmails,
  });
  if(sent.failed)console.error('Chat email alert failed for '+sent.failed+' of '+sent.recipients+' recipients.');
 }catch(e){console.error('Chat email alert failed:',e instanceof Error?e.message:'unknown');}
 return reply({message:{id,companyId:input.companyId,taskId:input.taskId||null,authorRole:viewer!.role,authorName:viewer!.name,body:input.message.trim(),createdAt:now}},201);
}
