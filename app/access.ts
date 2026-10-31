export type Role='superadmin'|'manager'|'branch'|'employee';
export type Grant={id:string;owner_id:string;name:string;email:string;role:Exclude<Role,'superadmin'>;company_id:string|null;location_id:string|null;active:number;revision:number;created_at:string;updated_at:string};
export function roleFromIdentity(id:string|null,email:string|null,admin:string|undefined){
 if(!id||!email)return {error:'Bitte mit ChatGPT anmelden.',status:401};
 if(!admin)return {error:'Superadmin-Zugang noch nicht konfiguriert.',status:503};
 return {id,email:email.trim().toLowerCase(),role:email.toLowerCase()===admin.toLowerCase()?'superadmin' as const:undefined};
}
export function projectState(state:any,grant:Grant){
 if(!state)return null;
 const workspaces:any={},companies:any[]=[];
 for(const c of state.companies){
  if(grant.role!=='employee'&&c.id!==grant.company_id)continue;
  const w=state.workspaces[c.id]||{locations:[],tasks:[]};
  let tasks=w.tasks,locations=w.locations;
  if(grant.role==='branch'){locations=locations.filter((l:any)=>l.id===grant.location_id);tasks=tasks.filter((t:any)=>t.locationId===grant.location_id)}
  if(grant.role==='employee'){tasks=tasks.filter((t:any)=>['Freigegeben','Erledigt'].includes(t.status));const ids=new Set(tasks.map((t:any)=>t.locationId));locations=locations.filter((l:any)=>ids.has(l.id));if(!tasks.length)continue}
  companies.push({...c,contact:'',users:0,locations:locations.length});workspaces[c.id]={locations,tasks};
 }
 return {companies,workspaces,events:[]};
}
export function validateGrant(input:any,state:any,adminEmail:string){
 if(!input||typeof input!=='object'||typeof input.name!=='string'||!input.name.trim()||input.name.trim().length>100||typeof input.email!=='string'||input.email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))return 'Bitte Name und gültige E-Mail-Adresse eingeben.';
 if(input.email.toLowerCase()===adminEmail.toLowerCase())return 'Der Superadmin-Zugang wird hier nicht geändert.';
 if(!['manager','branch','employee'].includes(input.role))return 'Ungültige Rolle.';
 if(input.role!=='employee'){
  if(typeof input.companyId!=='string'||!state?.companies?.some((c:any)=>c.id===input.companyId))return 'Bitte ein bestehendes Unternehmen wählen.';
  if(input.role==='branch'&&(typeof input.locationId!=='string'||!state.workspaces?.[input.companyId]?.locations?.some((l:any)=>l.id===input.locationId)))return 'Bitte eine Filiale dieses Unternehmens wählen.';
 }
 if(input.id!==undefined&&(typeof input.id!=='string'||input.id.length>100||!Number.isSafeInteger(input.revision)||input.revision<1))return 'Ungültiger Bearbeitungsstand.';
 return null;
}
