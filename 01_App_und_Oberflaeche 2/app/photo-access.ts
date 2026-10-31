import { roleFromIdentity, type Grant } from './access';
import { effectiveStatus, type Principal } from './workflow';
export async function photoPrincipal(request: Request, env: { DB?: D1Database; FACILITY_ADMIN_EMAIL?: string }): Promise<Principal | Response> {
 const identity=roleFromIdentity(request.headers.get('oai-authenticated-user-id'),request.headers.get('oai-authenticated-user-email'),env.FACILITY_ADMIN_EMAIL);
 if(identity.error)return Response.json({error:identity.error},{status:identity.status});
 if(!env.DB)return Response.json({error:'Datenbank nicht verfügbar.'},{status:503});
 if(identity.role==='superadmin')return {id:identity.id!,ownerId:identity.id!,email:identity.email!,name:identity.email!,role:'superadmin'};
 const g=await env.DB.prepare('SELECT * FROM team_access WHERE email = ? AND active = 1').bind(identity.email).first<Grant>();
 if(!g)return Response.json({error:'Kein aktiver Zugang vorhanden.'},{status:403});
 return {id:identity.id!,ownerId:g.owner_id,email:g.email,name:g.name,role:g.role,companyId:g.company_id,locationId:g.location_id};
}
export function canReadTask(user: Principal, companyId: string, task: any) {
 if(!task)return false;
 if(user.role==='superadmin')return true;
 if(user.role==='employee')return ['Freigegeben','Erledigt'].includes(effectiveStatus(task));
 return user.companyId===companyId&&(user.role==='manager'||user.locationId===task.locationId);
}
