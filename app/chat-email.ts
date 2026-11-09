/**
 * Customer-chat email alerts. The server owns every recipient:
 * - manager -> configured execution team (or platform owner's inbox)
 * - platform owner -> active managers of the same tenant
 *
 * Email contains no chat body, task details or customer-private images.
 * Resend accepts idempotency keys for up to 24 hours, so retries do not
 * multiply one notification per persisted chat message/recipient.
 */
export type ChatEmailConfig = {
  RESEND_API_KEY?: string;
  FACILITY_CHAT_FROM_EMAIL?: string;
  FACILITY_CHAT_ALERT_TO?: string;
  FACILITY_PUBLIC_URL?: string;
};
export type ChatEmailInput = {
  messageId: string;
  companyName: string;
  authorRole: 'manager' | 'superadmin';
  actorEmail: string;
  recipientEmails: string[];
};
export type ChatEmailResult = { configured:boolean; recipients:number; accepted:number; failed:number };

const normalEmail = (value:string) => value.trim().toLowerCase();
const isEmail = (s:string) => s.length<=254 && /^[^@\s,;<>]+@[^@\s,;<>]+\.[^@\s,;<>]+$/.test(s);

export function chatEmailRecipients(config:ChatEmailConfig, input:ChatEmailInput):string[]{
  // Only a server-configured address can override the platform-owner inbox.
  const configuredTeam = (config.FACILITY_CHAT_ALERT_TO||'').split(/[,;\n]/).map(normalEmail).filter(isEmail);
  const source = input.authorRole==='manager' && configuredTeam.length ? configuredTeam : input.recipientEmails;
  const unique = new Set<string>();
  for(const entry of source){
    const address=normalEmail(entry);
    if(isEmail(address) && address!==normalEmail(input.actorEmail))unique.add(address);
    if(unique.size>=10)break;
  }
  return [...unique];
}

function dashboardUrl(config:ChatEmailConfig):string|null{
  const raw=config.FACILITY_PUBLIC_URL?.trim();
  if(!raw)return null;
  try{
    const url=new URL(raw);
    if(url.protocol!=='https:' || url.username || url.password || !url.hostname)return null;
    return new URL('/dashboard',url.origin).toString();
  }catch{return null}
}
const htmlEntities:Record<string,string>={'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'};
const safeHtml=(s:string)=>s.replace(/[&<>"']/g,c=>htmlEntities[c]??c);

export function buildChatEmail(config:ChatEmailConfig,input:ChatEmailInput){
  const company=input.companyName.replace(/[\r\n\t]/g,' ').trim().slice(0,100) || 'Unternehmen';
  const actor=input.authorRole==='manager'?'Kundenmanager':'F&B Spezialbau';
  const url=dashboardUrl(config);
  const subject='Neue Chatnachricht · '+company;
  const description='Für '+company+' ist eine neue Nachricht vom '+actor+' eingegangen.';
  const text=description+'\n\nÖffne den geschützten Kundenchat in Facility Management, um die Nachricht zu lesen und zu antworten.'+(url?'\n\n'+url:'')+'\n\nAutomatische Benachrichtigung. Bitte nicht auf diese E-Mail antworten.';
  const html='<div style="font-family:Arial,sans-serif;color:#263149;line-height:1.6;max-width:560px;padding:24px">'+
    '<div style="font-size:13px;font-weight:bold;color:#7769d6">FACILITY MANAGEMENT</div>'+
    '<h1 style="font-size:24px;margin:15px 0">Neue Chatnachricht</h1>'+
    '<p>'+safeHtml(description)+'</p>'+
    '<p>Die Nachricht ist ausschliesslich im geschützten Kundenchat verfügbar.</p>'+
    (url?'<p><a style="display:inline-block;background:#7566f4;color:#fff;text-decoration:none;padding:12px 18px;border-radius:12px" href="'+safeHtml(url)+'">Kundenchat öffnen</a></p>':'')+
    '<p style="color:#778297;font-size:12px">Automatische Benachrichtigung · Bitte im Kundenchat antworten.</p></div>';
  return {subject,text,html};
}

/**
 * Best-effort immediate email delivery. The existing in-app notification
 * persists independently, even when the provider is down or unconfigured.
 * Call only after the server confirms the message INSERT succeeded.
 */
export async function sendChatEmailAlerts(
  config:ChatEmailConfig,
  input:ChatEmailInput,
  sender:typeof fetch=fetch
):Promise<ChatEmailResult>{
  const recipients=chatEmailRecipients(config,input);
  const key=config.RESEND_API_KEY?.trim();
  const from=config.FACILITY_CHAT_FROM_EMAIL?.trim();
  if(!key || !from || !from.includes('@') || !recipients.length){
    return {configured:Boolean(key && from),recipients:recipients.length,accepted:0,failed:0};
  }
  const mail=buildChatEmail(config,input);
  let accepted=0,failed=0;
  for(let i=0;i<recipients.length;i++){
    const recipient=recipients[i]!;
    try{
      const response=await sender('https://api.resend.com/emails',{
        method:'POST',
        headers:{
          Authorization:'Bearer '+key,
          'Content-Type':'application/json',
          'Idempotency-Key':'facility-chat/'+input.messageId+'/'+(i+1),
        },
        body:JSON.stringify({from,to:[recipient],subject:mail.subject,text:mail.text,html:mail.html}),
      });
      if(response.ok)accepted++;else{
        failed++;
        console.error('Facility chat email API rejected a notification. HTTP status:',response.status);
      }
    }catch{
      failed++;
      console.error('Facility chat email could not reach provider.');
    }
  }
  return {configured:true,recipients:recipients.length,accepted,failed};
}
