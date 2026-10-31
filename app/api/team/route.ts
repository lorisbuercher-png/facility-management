import { env } from 'cloudflare:workers';
import { roleFromIdentity,validateGrant,type Grant } from '../../access';
export const dynamic='force-dynamic';
const reply=(body:unknown,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
type TeamActor={ownerId:string;email:string;role:'superadmin'|'manager';companyId:string|null;grantId:string|null;grantRevision:number|null};
async function actor(request:Request):Promise<TeamActor|Response>{
 const a=roleFromIdentity(request.headers.get('oai-authenticated-user-id'),request.headers.get('oai-authenticated-user-email'),(env as any).FACILITY_ADMIN_EMAIL);
 if(a.error)return reply({error:a.error},a.status);
 if(!env.DB)return reply({error:'Datenbank nicht verfügbar.'},503);
 if(a.role==='superadmin')return {ownerId:a.id!,email:a.email!,role:'superadmin',companyId:null,grantId:null,grantRevision:null};
 const grant=await env.DB.prepare('SELECT * FROM team_access WHERE email = ? AND active = 1').bind(a.email).first<Grant>();
 if(!grant||grant.role!=='manager'||!grant.company_id)return reply({error:'Keine Berechtigung für die Zugangsverwaltung.'},403);
 return {ownerId:grant.owner_id,email:a.email!,role:'manager',companyId:grant.company_id,grantId:grant.id,grantRevision:grant.revision};
}
function managerGuard(a:TeamActor){return a.role==='manager'?{sql:" AND EXISTS (SELECT 1 FROM team_access AS manager WHERE manager.id = ? AND manager.owner_id = ? AND manager.role = 'manager' AND manager.company_id = ? AND manager.active = 1 AND manager.revision = ?)",args:[a.grantId,a.ownerId,a.companyId,a.grantRevision]}:{sql:'',args:[]}}
function targetGuard(a:TeamActor){return a.role==='manager'?{sql:" AND role = 'branch' AND company_id = ?",args:[a.companyId]}:{sql:'',args:[]}}
function originCheck(request:Request){if(request.headers.get('Origin')!==new URL(request.url).origin)return reply({error:'Ungültiger Ursprung.'},403);if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'JSON erforderlich.'},415);return null}
async function readInput(request:Request,max:number){const raw=await request.text();if(raw.length>max)return {error:reply({error:'Datenmenge zu gross.'},413)};try{return {input:JSON.parse(raw)}}catch{return {error:reply({error:'Ungültige Daten.'},400)}}}
async function currentState(a:TeamActor){return env.DB!.prepare('SELECT payload, revision FROM platform_state WHERE owner_id = ?').bind(a.ownerId).first<{payload:string;revision:number}>()}
function companyExists(a:TeamActor,state:any){return a.role==='superadmin'||state?.companies?.some((c:any)=>c.id===a.companyId)}
export async function GET(request:Request){
 const a=await actor(request);if(a instanceof Response)return a;
 const row=await currentState(a);if(!companyExists(a,row?JSON.parse(row.payload):null))return reply({error:'Unternehmenszuordnung nicht mehr gültig.'},403);
 const scope=targetGuard(a),guard=managerGuard(a);
 const rows=await env.DB!.prepare('SELECT * FROM team_access WHERE owner_id = ?'+scope.sql+guard.sql+' ORDER BY created_at DESC').bind(a.ownerId,...scope.args,...guard.args).all();
 return reply({items:rows.results});
}
export async function POST(request:Request){
 const a=await actor(request);if(a instanceof Response)return a;const origin=originCheck(request);if(origin)return origin;
 const parsed=await readInput(request,12000);if(parsed.error)return parsed.error;const input=parsed.input;
 if(a.role==='manager'&&(!input||input.role!=='branch'||input.companyId!==a.companyId))return reply({error:'Manager können nur Filialleiter der eigenen Firma verwalten.'},403);
 const row=await currentState(a),state=row?JSON.parse(row.payload):null;if(!companyExists(a,state))return reply({error:'Unternehmenszuordnung nicht mehr gültig.'},403);
 const error=validateGrant(input,state,(env as any).FACILITY_ADMIN_EMAIL);if(error)return reply({error},400);
 const scope=targetGuard(a),guard=managerGuard(a);
 if(input.id){const target=await env.DB!.prepare('SELECT * FROM team_access WHERE id = ? AND owner_id = ?'+scope.sql).bind(input.id,a.ownerId,...scope.args).first<Grant>();if(!target)return reply({error:'Zugang nicht gefunden.'},404);}
 const email=input.email.trim().toLowerCase();
 const duplicate=await env.DB!.prepare('SELECT id FROM team_access WHERE owner_id = ? AND email = ?').bind(a.ownerId,email).first<{id:string}>();if(duplicate&&duplicate.id!==input.id)return reply({error:'Für diese E-Mail-Adresse besteht bereits eine Zuordnung. Bitte einen anderen Zugang wählen.'},409);
 const now=new Date().toISOString(),companyId=input.role==='employee'?null:input.companyId,locationId=input.role==='branch'?input.locationId:null;
 const stateGuard=row?' AND EXISTS (SELECT 1 FROM platform_state WHERE owner_id = ? AND revision = ?)':'',stateArgs=row?[a.ownerId,row.revision]:[];
 try{
  if(input.id){
   const result=await env.DB!.prepare('UPDATE team_access SET name = ?, email = ?, role = ?, company_id = ?, location_id = ?, revision = revision + 1, updated_at = ? WHERE id = ? AND owner_id = ? AND revision = ?'+scope.sql+guard.sql+stateGuard).bind(input.name.trim(),email,input.role,companyId,locationId,now,input.id,a.ownerId,input.revision,...scope.args,...guard.args,...stateArgs).run();
   if(result.meta.changes!==1)return reply({error:'Zugang oder Berechtigung inzwischen geändert. Bitte neu laden.'},409);return reply({ok:true,id:input.id});
  }
  const count=await env.DB!.prepare('SELECT COUNT(*) AS count FROM team_access WHERE owner_id = ?').bind(a.ownerId).first<{count:number}>();if((count?.count||0)>=1000)return reply({error:'Maximale Anzahl Zugänge erreicht.'},409);
  const id=crypto.randomUUID();
  const result=await env.DB!.prepare('INSERT INTO team_access (id, owner_id, name, email, role, company_id, location_id, active, revision, created_at, updated_at) SELECT ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ? WHERE (SELECT COUNT(*) FROM team_access WHERE owner_id = ?) < 1000'+guard.sql+stateGuard).bind(id,a.ownerId,input.name.trim(),email,input.role,companyId,locationId,now,now,a.ownerId,...guard.args,...stateArgs).run();
  if(result.meta.changes!==1)return reply({error:'Daten oder Berechtigung inzwischen geändert. Bitte neu laden.'},409);return reply({ok:true,id},201);
 }catch(e){if(String(e).includes('UNIQUE constraint failed'))return reply({error:'Für diese E-Mail-Adresse besteht bereits eine Zuordnung. Bitte neu laden.'},409);throw e}
}
export async function PATCH(request:Request){
 const a=await actor(request);if(a instanceof Response)return a;const origin=originCheck(request);if(origin)return origin;
 const parsed=await readInput(request,2000);if(parsed.error)return parsed.error;const input=parsed.input;
 if(!input||typeof input.id!=='string'||!input.id||input.id.length>100||typeof input.active!=='boolean'||!Number.isSafeInteger(input.revision)||input.revision<1||Object.keys(input).some(k=>!['id','active','revision'].includes(k)))return reply({error:'Ungültige Angaben.'},400);
 const row=await currentState(a);if(!companyExists(a,row?JSON.parse(row.payload):null))return reply({error:'Unternehmenszuordnung nicht mehr gültig.'},403);
 const scope=targetGuard(a),guard=managerGuard(a);
 const target=await env.DB!.prepare('SELECT * FROM team_access WHERE id = ? AND owner_id = ?'+scope.sql).bind(input.id,a.ownerId,...scope.args).first<Grant>();if(!target)return reply({error:'Zugang nicht gefunden.'},404);
 const stateGuard=row?' AND EXISTS (SELECT 1 FROM platform_state WHERE owner_id = ? AND revision = ?)':'',stateArgs=row?[a.ownerId,row.revision]:[];
 const result=await env.DB!.prepare('UPDATE team_access SET active = ?, revision = revision + 1, updated_at = ? WHERE id = ? AND owner_id = ? AND revision = ?'+scope.sql+guard.sql+stateGuard).bind(input.active?1:0,new Date().toISOString(),input.id,a.ownerId,input.revision,...scope.args,...guard.args,...stateArgs).run();
 if(result.meta.changes!==1)return reply({error:'Zugang oder Berechtigung inzwischen geändert. Bitte Liste neu laden.'},409);return reply({ok:true});
}
