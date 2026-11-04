import { env } from 'cloudflare:workers';
import { roleFromIdentity,type Grant } from '../../access';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
type Viewer={ownerId:string;email:string;role:string;companyId:string|null;locationId:string|null;grant?:Grant};
async function viewer(request:Request):Promise<Viewer|Response>{
 const auth=roleFromIdentity(request.headers.get('oai-authenticated-user-id'),request.headers.get('oai-authenticated-user-email'),(env as any).FACILITY_ADMIN_EMAIL);
 if(auth.error)return reply({error:auth.error},auth.status);
 if(!env.DB)return reply({error:'Benachrichtigungen momentan nicht verfügbar.'},503);
 if(auth.role==='superadmin')return {ownerId:auth.id!,email:auth.email!,role:'superadmin',companyId:null,locationId:null};
 const g=await env.DB.prepare('SELECT * FROM team_access WHERE email = ? AND active = 1').bind(auth.email).first<Grant>();
 if(!g)return reply({error:'Kein aktiver Zugang vorhanden.'},403);
 return {ownerId:g.owner_id,email:g.email.toLowerCase(),role:g.role,companyId:g.company_id,locationId:g.location_id,grant:g};
}
// Historical notifications must not leak after a manager/branch changes tenant/location.
function scope(v:Viewer){
 if(v.role==='manager')return {where:' AND company_id = ?',bind:[v.companyId]};
 if(v.role==='branch')return {where:' AND company_id = ? AND location_id = ?',bind:[v.companyId,v.locationId]};
 return {where:'',bind:[]};
}
export async function GET(request:Request){
 const user=await viewer(request);if(user instanceof Response)return user;
 if(!env.DB)return reply({error:'Datenbank nicht verfuegbar.'},503);
 const s=scope(user);
 const where='owner_id = ? AND recipient_email = ?'+s.where;
 const params=[user.ownerId,user.email,...s.bind];
 const [rows,total]=await Promise.all([
  env.DB.prepare(`SELECT id,company_id AS companyId,location_id AS locationId,task_id AS taskId,kind,title,body,created_at AS createdAt,read_at AS readAt FROM notifications WHERE ${where} ORDER BY created_at DESC,id DESC LIMIT 80`).bind(...params).all(),
  env.DB.prepare(`SELECT COUNT(*) AS count FROM notifications WHERE ${where} AND read_at IS NULL`).bind(...params).first<{count:number}>(),
 ]);
 return reply({items:rows.results,unread:total?.count??0});
}
export async function PATCH(request:Request){
 if(request.headers.get('Origin')!==new URL(request.url).origin)return reply({error:'Ungültiger Ursprung.'},403);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'JSON erforderlich.'},415);
 const raw=await request.text();if(raw.length>2048)return reply({error:'Ungültige Datenmenge.'},413);
 let input:any;try{input=JSON.parse(raw)}catch{return reply({error:'Ungültige Daten.'},400)}
 if(!input||!(input.all===true||typeof input.id==='string'&&/^[\w-]{1,100}$/.test(input.id)))return reply({error:'Ungültige Auswahl.'},400);
 const user=await viewer(request);if(user instanceof Response)return user;
 if(!env.DB)return reply({error:'Datenbank nicht verfuegbar.'},503);
 const s=scope(user),now=new Date().toISOString();
 const guard=user.grant?{sql:' AND EXISTS (SELECT 1 FROM team_access WHERE id = ? AND owner_id = ? AND email = ? AND role = ? AND company_id IS ? AND location_id IS ? AND active = 1 AND revision = ?)',bind:[user.grant.id,user.grant.owner_id,user.grant.email,user.grant.role,user.grant.company_id,user.grant.location_id,user.grant.revision]}:{sql:'',bind:[]};
 const result=await env.DB.prepare(`UPDATE notifications SET read_at = ? WHERE owner_id = ? AND recipient_email = ?${s.where} AND read_at IS NULL${input.all===true?'':' AND id = ?'}${guard.sql}`).bind(now,user.ownerId,user.email,...s.bind,...(input.all===true?[]:[input.id]),...guard.bind).run();
 return reply({ok:true,updated:result.meta.changes});
}
