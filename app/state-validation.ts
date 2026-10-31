// Validate the whole owner-scoped snapshot before accepting any write.
const str=(x:unknown,max=5000)=>typeof x==='string'&&x.length<=max;
const obj=(x:any)=>x&&typeof x==='object'&&!Array.isArray(x);
export function validateState(s:any):boolean {
 if(!obj(s)||!Array.isArray(s.companies)||s.companies.length>1000||!Array.isArray(s.events)||s.events.length>100||!obj(s.workspaces))return false;
 const ids=new Set<string>();
 for(const c of s.companies){
  if(!obj(c)||!str(c.id,100)||!c.id||ids.has(c.id)||!str(c.name,80)||!c.name.trim()||!str(c.short,10)||!/^#[a-f\d]{6}$/i.test(c.color)||!['Aktiv','Einrichtung','Pausiert'].includes(c.status)||!Number.isInteger(c.locations)||c.locations<0||c.locations>100000||!Number.isInteger(c.users)||c.users<0||c.users>100000||!Array.isArray(c.modules)||c.modules.some((m:any)=>!['Mängel & Aufträge','Standorte','Rapporte','Dokumente','Wartungsplanung'].includes(m))||!str(c.contact,254)||!str(c.logo,700000)||(c.logo&&!/^data:image\/(png|jpeg|webp);base64,[a-z\d+/=]+$/i.test(c.logo)))return false;
  if(c.branding!==undefined&&!validateBranding(c.branding))return false;
  ids.add(c.id);
 }
 for(const e of s.events)if(!obj(e)||!str(e.title,200)||!str(e.detail,500)||!str(e.date,100))return false;
 for(const [companyId,w] of Object.entries(s.workspaces) as [string,any][]){
  if(!ids.has(companyId)||!obj(w)||!Array.isArray(w.locations)||!Array.isArray(w.tasks)||w.locations.length>10000||w.tasks.length>20000)return false;
  const locIds=new Set<string>(),taskIds=new Set<string>();
  for(const l of w.locations){if(!obj(l)||!str(l.id,100)||!l.id||locIds.has(l.id)||!str(l.name,100)||!l.name.trim()||!str(l.address,150)||!str(l.zip,12)||!str(l.city,100)||!str(l.contact,150)||!str(l.notes,3000))return false;locIds.add(l.id)}
  for(const t of w.tasks){if(!obj(t)||!str(t.id,100)||!t.id||taskIds.has(t.id)||!str(t.title,150)||!t.title.trim()||!locIds.has(t.locationId)||!['Niedrig','Normal','Dringend'].includes(t.priority)||!['Offen','Geplant','In Arbeit','Gemeldet','Freigegeben','Abgelehnt','Erledigt'].includes(t.status)||!str(t.description)||!t.description.trim()||!str(t.assignee,100)||!str(t.due,10)||!str(t.createdAt,50)||!str(t.updatedAt,50))return false;taskIds.add(t.id)}
 }
 return true;
}

export function validateBranding(b:any):boolean {
 if(!obj(b))return false;
 if(b.wallpaper!==undefined&&!['solid','sky','sand','sage','dusk','architecture','lake','midnight'].includes(b.wallpaper))return false;
 for(const k of ['primary','accent','background','text'])if(typeof b[k]!=='string'||!/^#[a-f\d]{6}$/i.test(b[k]))return false;
 return ['system','humanist','serif'].includes(b.font)&&['square','soft','round'].includes(b.radius)&&['light','dark'].includes(b.mode)&&str(b.title,100)&&str(b.greeting,200)&&obj(b.modules)&&['statistics','locations','activity'].every(k=>typeof b.modules[k]==='boolean');
}
