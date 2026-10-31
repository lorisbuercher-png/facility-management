import { env } from 'cloudflare:workers';
import { validateState } from '../../state-validation';
import { projectState, type Grant } from '../../access';
import { protectSnapshot } from '../../workflow';
export const dynamic = 'force-dynamic';
function reply(body: unknown, status=200) { return Response.json(body, {status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}}); }
function identify(request:Request) {
 const id=request.headers.get('oai-authenticated-user-id');
 const email=request.headers.get('oai-authenticated-user-email');
 const admin=(env as unknown as {FACILITY_ADMIN_EMAIL?:string}).FACILITY_ADMIN_EMAIL;
 if(!id||!email)return {error:reply({error:'Bitte mit ChatGPT anmelden.'},401)};
 if(!admin)return {error:reply({error:'Superadmin-Zugang noch nicht konfiguriert.'},503)};
 if(email.toLowerCase()!==admin.toLowerCase())return {error:reply({error:'Dieser Zugang ist nur für den Plattforminhaber freigeschaltet.'},403)};
 return {id,email};
}
export async function GET(request:Request){
 const user=identify(request);
 if(user.error){
  if(user.error.status!==403)return user.error;
  if(!env.DB)return reply({error:'Datenbank ist noch nicht verfügbar.'},503);
  const email=request.headers.get('oai-authenticated-user-email')!.toLowerCase();
  const grant=await env.DB.prepare('SELECT * FROM team_access WHERE email = ? AND active = 1').bind(email).first<Grant>();
  if(!grant)return reply({error:'Für diese E-Mail-Adresse ist kein aktiver Zugang eingerichtet.'},403);
  const row=await env.DB.prepare('SELECT payload, revision FROM platform_state WHERE owner_id = ?').bind(grant.owner_id).first<{payload:string,revision:number}>();
  return reply({state:projectState(row?JSON.parse(row.payload):null,grant),revision:row?.revision??0,user:{id:request.headers.get('oai-authenticated-user-id'),email,name:grant.name,role:grant.role,companyId:grant.company_id,locationId:grant.location_id,readOnly:false}});
 }
 if(!env.DB)return reply({error:'Datenbank ist noch nicht verfügbar.'},503);
 const row=await env.DB.prepare('SELECT payload, revision FROM platform_state WHERE owner_id = ?').bind(user.id).first<{payload:string,revision:number}>();
 return reply({state:row?JSON.parse(row.payload):null,revision:row?.revision??0,user:{id:user.id,email:user.email,role:'superadmin',readOnly:false}});
}
export async function PUT(request:Request){
 const user=identify(request);if(user.error)return user.error;
 const origin=request.headers.get('Origin');if(origin!==new URL(request.url).origin)return reply({error:'Ungültiger Ursprung.'},403);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'JSON erforderlich.'},415);
 const raw=await request.text();if(raw.length>4_000_000)return reply({error:'Datenmenge zu gross.'},413);
 let input;try{input=JSON.parse(raw)}catch{return reply({error:'Ungültige Daten.'},400)}
 if(!input||typeof input!=='object'||!Number.isSafeInteger(input.revision)||input.revision<0)return reply({error:'Ungültige Datensätze.'},400);
 if(!env.DB)return reply({error:'Datenbank ist noch nicht verfügbar.'},503);
 const previous=await env.DB.prepare('SELECT payload, revision FROM platform_state WHERE owner_id = ?').bind(user.id).first<{payload:string,revision:number}>();
 if(!validateState(input.state))return reply({error:'Ungültige Datensätze.'},400);
 if((previous?.revision||0)!==input.revision)return reply({error:'Daten inzwischen geändert. Bitte neu laden.'},409);
 const protection=protectSnapshot(previous?JSON.parse(previous.payload):null,input.state,{id:user.id!,ownerId:user.id!,email:user.email!,name:user.email!,role:'superadmin'},new Date().toISOString());
 if(protection)return reply({error:protection},403);
 if(!validateState(input.state))return reply({error:'Ungültige Datensätze.'},400);
 if(!env.DB)return reply({error:'Datenbank ist noch nicht verfügbar.'},503);
 const payload=JSON.stringify(input.state),now=new Date().toISOString();
 const result=input.revision===0
 ?await env.DB.prepare('INSERT INTO platform_state (owner_id, payload, revision, updated_at) VALUES (?, ?, 1, ?) ON CONFLICT(owner_id) DO NOTHING').bind(user.id,payload,now).run()
 :await env.DB.prepare('UPDATE platform_state SET payload = ?, revision = revision + 1, updated_at = ? WHERE owner_id = ? AND revision = ?').bind(payload,now,user.id,input.revision).run();
 if(result.meta.changes!==1)return reply({error:'Die Daten wurden in einem anderen Fenster geändert. Bitte neu laden.'},409);
 return reply({revision:input.revision+1,savedAt:now,...(!previous?{state:input.state}:{})});
}
