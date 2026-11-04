import { env } from 'cloudflare:workers';
import { roleFromIdentity,type Grant } from '../../access';
import { applyWorkflow,type Principal } from '../../workflow';
import { readWorkflowInput,photoType } from '../../photos';
import { workflowNotifications,storeNotifications,type NotificationRecipient } from '../../notifications';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export async function POST(request:Request){
 const identity=roleFromIdentity(request.headers.get('oai-authenticated-user-id'),request.headers.get('oai-authenticated-user-email'),(env as any).FACILITY_ADMIN_EMAIL);
 if(identity.error)return reply({error:identity.error},identity.status);
 if(request.headers.get('Origin')!==new URL(request.url).origin)return reply({error:'Ungültiger Ursprung.'},403);
 let input,files:File[];try{({input,files}=await readWorkflowInput(request))}catch(e){return reply({error:e instanceof Error?e.message:'Ungültige Daten.'},400)}
 if(!env.DB)return reply({error:'Datenbank nicht verfügbar.'},503);
 let user:Principal,grant:Grant|undefined;
 if(identity.role==='superadmin')user={id:identity.id!,ownerId:identity.id!,email:identity.email!,name:identity.email!,role:'superadmin'};
 else{const g=await env.DB.prepare('SELECT * FROM team_access WHERE email = ? AND active = 1').bind(identity.email).first<Grant>();if(!g)return reply({error:'Kein aktiver Zugang vorhanden.'},403);grant=g;user={id:identity.id!,ownerId:g.owner_id,email:g.email,name:g.name,role:g.role,companyId:g.company_id,locationId:g.location_id};}
 const row=await env.DB.prepare('SELECT payload, revision FROM platform_state WHERE owner_id = ?').bind(user.ownerId).first<{payload:string,revision:number}>();if(!row)return reply({error:'Noch keine Unternehmensdaten vorhanden.'},404);
 const state=JSON.parse(row.payload),now=new Date().toISOString();const result=applyWorkflow(state,input,user,now,crypto.randomUUID());if('error' in result)return reply({error:result.error},result.status);
 const task=state.workspaces[input.companyId].tasks.find((t:any)=>t.id===result.taskId);
 const bucket=(env as any).BUCKET as R2Bucket|undefined;
 const uploaded:string[]=[];
 if(files.length){
  if(!['create','edit','complete'].includes(input.action))return reply({error:'Fotos sind nur bei Meldungen, Bearbeitungen und Rapporten möglich.'},400);
  if(!bucket)return reply({error:'Fotospeicher noch nicht verfügbar. Bitte später erneut versuchen.'},503);
  const target=input.action==='complete'?task.report:task;
  if((target.photos?.length||0)+files.length>10)return reply({error:'Maximal zehn Fotos pro Meldung oder Rapport.'},400);
  const photos=[];
  try{
   for(const file of files){const bytes=new Uint8Array(await file.arrayBuffer()),type=photoType(bytes);if(!type||type!==file.type||!(/\.(jpe?g|png|webp)$/i.test(file.name)))throw new Error('Nur gültige JPG-, PNG- und WebP-Fotos sind erlaubt.');const id=crypto.randomUUID(),key=`photos/${user.ownerId}/${id}`;await bucket.put(key,bytes,{httpMetadata:{contentType:type}});uploaded.push(key);photos.push({id,type,size:file.size,at:now,userId:user.id,userName:user.name});}
  }catch(e){await Promise.all(uploaded.map(key=>bucket.delete(key)));return reply({error:e instanceof Error?e.message:'Foto konnte nicht gespeichert werden.'},400)}
  target.photos=[...(target.photos||[]),...photos];
  const entry=task.history.at(-1);entry.note=[entry.note,`${photos.length} Foto(s) angehängt`].filter(Boolean).join(' · ');
 }
 const payload=JSON.stringify(state);if(payload.length>4_000_000){if(bucket)await Promise.all(uploaded.map(key=>bucket.delete(key)));return reply({error:'Maximale Datenmenge erreicht.'},413)}
 // Recheck the exact authorising grant atomically, including changes during uploads.
 const guard=grant?{sql:' AND EXISTS (SELECT 1 FROM team_access WHERE id = ? AND owner_id = ? AND email = ? AND role = ? AND company_id IS ? AND location_id IS ? AND active = 1 AND revision = ?)',args:[grant.id,grant.owner_id,grant.email,grant.role,grant.company_id,grant.location_id,grant.revision]}:{sql:'',args:[]};
 let saved;
 try{saved=await env.DB.prepare('UPDATE platform_state SET payload = ?, revision = revision + 1, updated_at = ? WHERE owner_id = ? AND revision = ?'+guard.sql).bind(payload,now,user.ownerId,row.revision,...guard.args).run()}
 catch{
  // A lost DB response may follow a committed write. Never delete referenced photos.
  if(bucket&&uploaded.length){try{
   const latest=await env.DB.prepare('SELECT payload, revision FROM platform_state WHERE owner_id = ?').bind(user.ownerId).first<{payload:string;revision:number}>();
   const referenced=new Set<string>();
   for(const workspace of Object.values(latest?JSON.parse(latest.payload).workspaces:{} as any) as any[])for(const item of workspace.tasks||[])for(const photo of [...(item.photos||[]),...(item.report?.photos||[])])referenced.add(`photos/${user.ownerId}/${photo.id}`);
   await Promise.all(uploaded.filter(key=>!referenced.has(key)).map(key=>bucket.delete(key)));
  }catch{/* Unknown outcome: keep objects for reconciliation rather than risk data loss. */}}
  return reply({error:'Speicherergebnis unklar. Bitte Daten aktualisieren und vor erneutem Absenden prüfen.'},503)
 }
 if(saved.meta.changes!==1){if(bucket)await Promise.all(uploaded.map(key=>bucket.delete(key)));return reply({error:'Daten oder Zugangsberechtigung inzwischen geändert. Bitte aktualisieren und erneut versuchen.'},409)}
 // Notify only after a committed workflow transition. Notifications are server-routed by real team grants.
 // Failure must not roll back a valid report, photo or job; the source-of-truth stays in its job history.
 try{
  const team=await env.DB.prepare('SELECT email,name,role,company_id,location_id,active FROM team_access WHERE owner_id = ? AND active = 1').bind(user.ownerId).all<NotificationRecipient>();
  const recipients=workflowNotifications(input.action,{ownerEmail:(env as any).FACILITY_ADMIN_EMAIL,companyId:input.companyId,locationId:task.locationId,taskId:result.taskId,actorEmail:user.email},task,team.results);
  await storeNotifications(env.DB,user.ownerId,recipients,now);
 }catch(e){console.error('Notification delivery could not be queued:',e instanceof Error?e.message:'unknown');}
 return reply({ok:true,taskId:result.taskId});
}
