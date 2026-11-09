import {env} from 'cloudflare:workers';
import {roleFromIdentity} from '../../access';
export const dynamic='force-dynamic';
const reply=(payload:unknown,status=200)=>Response.json(payload,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
const nameValid=(v:unknown)=>typeof v==='string'&&v.trim().length>=2&&v.trim().length<=70&&!/[\r\n<>]/.test(v);
const idValid=(v:unknown)=>typeof v==='string'&&v.length>0&&v.length<=100;

function owner(request:Request){
 const identity=roleFromIdentity(request.headers.get('oai-authenticated-user-id'),request.headers.get('oai-authenticated-user-email'),(env as any).FACILITY_ADMIN_EMAIL);
 if(identity.error)return {error:reply({error:identity.error},identity.status)};
 if(identity.role!=='superadmin')return {error:reply({error:'Nur die Plattformverwaltung darf Ausführungsteams verwalten.'},403)};
 if(!env.DB)return {error:reply({error:'Datenbank nicht verfügbar.'},503)};
 return {id:identity.id!};
}
export async function GET(request:Request){
 const actor=owner(request);if(actor.error)return actor.error;
 const [teams,members,employees]=await Promise.all([
  env.DB!.prepare('SELECT id,name,created_at,updated_at FROM execution_teams WHERE owner_id = ? ORDER BY name').bind(actor.id).all(),
  env.DB!.prepare("SELECT m.team_id,m.employee_grant_id,t.name,t.email,t.active FROM execution_team_members m JOIN team_access t ON t.id=m.employee_grant_id AND t.owner_id=m.owner_id WHERE m.owner_id = ? AND t.role = 'employee' ORDER BY t.name").bind(actor.id).all(),
  env.DB!.prepare("SELECT id,name,email,active FROM team_access WHERE owner_id = ? AND role = 'employee' ORDER BY name").bind(actor.id).all()
 ]);
 return reply({teams:teams.results,members:members.results,employees:employees.results});
}
export async function POST(request:Request){
 const actor=owner(request);if(actor.error)return actor.error;
 if(request.headers.get('Origin')!==new URL(request.url).origin)return reply({error:'Ungültiger Ursprung.'},403);
 if(!request.headers.get('Content-Type')?.startsWith('application/json'))return reply({error:'JSON erforderlich.'},415);
 const raw=await request.text();if(raw.length>3000)return reply({error:'Datenmenge zu gross.'},413);
 let input:any;try{input=JSON.parse(raw)}catch{return reply({error:'Ungültige Daten.'},400)}
 if(!input||!['create','rename','add-member','remove-member'].includes(input.action))return reply({error:'Ungültige Aktion.'},400);
 const now=new Date().toISOString();
 try{
  if(input.action==='create'){
   if(!nameValid(input.name))return reply({error:'Teamname: 2 bis 70 Zeichen.'},400);
   const id=crypto.randomUUID();
   const result=await env.DB!.prepare('INSERT INTO execution_teams (id,owner_id,name,created_at,updated_at) SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM execution_teams WHERE owner_id = ?) < 100').bind(id,actor.id,input.name.trim(),now,now,actor.id).run();
   return result.meta.changes===1?reply({ok:true,id},201):reply({error:'Maximal 100 Ausführungsteams.'},409);
  }
  if(!idValid(input.teamId))return reply({error:'Ausführungsteam nicht gefunden.'},400);
  if(input.action==='rename'){
   if(!nameValid(input.name))return reply({error:'Teamname: 2 bis 70 Zeichen.'},400);
   const result=await env.DB!.prepare('UPDATE execution_teams SET name=?,updated_at=? WHERE owner_id=? AND id=?').bind(input.name.trim(),now,actor.id,input.teamId).run();
   return result.meta.changes===1?reply({ok:true}):reply({error:'Ausführungsteam nicht gefunden.'},404);
  }
  if(!idValid(input.employeeId))return reply({error:'Mitarbeiter nicht gefunden.'},400);
  if(input.action==='add-member'){
   const result=await env.DB!.prepare("INSERT OR IGNORE INTO execution_team_members (owner_id,team_id,employee_grant_id,created_at) SELECT ?,t.id,g.id,? FROM execution_teams t JOIN team_access g ON g.id = ? AND g.owner_id=t.owner_id AND g.role='employee' AND g.active=1 WHERE t.owner_id=? AND t.id=?").bind(actor.id,now,input.employeeId,actor.id,input.teamId).run();
   return result.meta.changes===1?reply({ok:true}):reply({error:'Team/Mitarbeiter ungültig oder bereits zugeordnet.'},409);
  }
  const result=await env.DB!.prepare('DELETE FROM execution_team_members WHERE owner_id=? AND team_id=? AND employee_grant_id=?').bind(actor.id,input.teamId,input.employeeId).run();
  return result.meta.changes===1?reply({ok:true}):reply({error:'Mitgliedschaft nicht vorhanden.'},404);
 }catch(e){
  if(String(e).includes('UNIQUE constraint'))return reply({error:'Dieses Team existiert bereits.'},409);
  console.error('Execution-team mutation failed:',e instanceof Error?e.message:'unknown');
  return reply({error:'Teamverwaltung derzeit nicht verfügbar.'},503);
 }
}
