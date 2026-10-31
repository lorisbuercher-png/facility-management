import { env } from 'cloudflare:workers';
import { photoPrincipal,canReadTask } from '../../photo-access';
export const dynamic='force-dynamic';
export async function GET(request: Request) {
 const user=await photoPrincipal(request,{DB:env.DB,FACILITY_ADMIN_EMAIL:(env as any).FACILITY_ADMIN_EMAIL});if(user instanceof Response)return user;
 if(!env.DB)return Response.json({error:'Datenbank nicht verfügbar.'},{status:503});
 const q=new URL(request.url).searchParams,cid=q.get('companyId'),tid=q.get('taskId'),id=q.get('id');
 const missing=()=>Response.json({error:'Foto nicht gefunden.'},{status:404,headers:{'Cache-Control':'no-store'}});
 if(!cid||!tid||!id||cid.length>100||tid.length>100||!/^[a-f\d-]{36}$/i.test(id))return missing();
 const row=await env.DB.prepare('SELECT payload FROM platform_state WHERE owner_id = ?').bind(user.ownerId).first<{payload:string}>();
 const state=row?JSON.parse(row.payload):null,task=state?.workspaces?.[cid]?.tasks?.find((t:any)=>t.id===tid);
 if(!canReadTask(user,cid,task))return missing();
 const photo=[...(task.photos||[]),...(task.report?.photos||[])].find((p:any)=>p.id===id);if(!photo||!['image/jpeg','image/png','image/webp'].includes(photo.type))return missing();
 const bucket=(env as any).BUCKET as R2Bucket|undefined;if(!bucket)return Response.json({error:'Fotospeicher nicht verfügbar.'},{status:503});
 const object=await bucket.get(`photos/${user.ownerId}/${id}`);if(!object)return missing();
 return new Response(object.body,{headers:{'Content-Type':photo.type,'Content-Length':String(object.size),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox",'Content-Disposition':`inline; filename="foto-${id}.${photo.type==='image/jpeg'?'jpg':photo.type==='image/png'?'png':'webp'}"`}});
}
