/**
 * Verified identity for standalone customer pilots using Cloudflare Access.
 * Never accept browser-supplied oai-authenticated-user-* headers directly.
 * This verifier checks RS256, signing key, issuer, audience and lifetime.
 *
 * Access must ALSO be enforced on the entire public hostname (including
 * static assets) with an allow-list of explicitly invited customer emails.
 */
export type PilotAuthConfig = {
  FACILITY_AUTH_MODE?:string;
  FACILITY_ACCESS_ISSUER?:string;
  FACILITY_ACCESS_AUD?:string;
  FACILITY_ADMIN_EMAIL?:string;
  FACILITY_OWNER_ID?:string;
};
export type PilotIdentity = {id:string;email:string};
export type PilotAuthResult = {identity:PilotIdentity}|{status:number;error:string};

const maxTokenLength=12000;
const clockTolerance=30;
const cache=new Map<string,{until:number;keys:any[]}>();
const validEmail=(s:string)=>s.length<=254&&/^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$/.test(s);

function decodeBase64Url(value:string):Uint8Array{
  if(!value||!/^[A-Za-z0-9_-]+$/.test(value))throw Error('Malformed token');
  const padded=value.replace(/-/g,'+').replace(/_/g,'/')+'='.repeat((4-value.length%4)%4);
  return Uint8Array.from(atob(padded),ch=>ch.charCodeAt(0));
}
function decodeJson(value:string):any{
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(value)));
}
function configuration(config:PilotAuthConfig):{issuer:string;aud:string}|null{
  const issuer=config.FACILITY_ACCESS_ISSUER?.trim().replace(/\/$/,'')||'';
  const aud=config.FACILITY_ACCESS_AUD?.trim()||'';
  if(!/^https:\/\/[a-z\d-]+\.cloudflareaccess\.com$/i.test(issuer)||!aud||aud.length>256)return null;
  return {issuer,aud};
}
async function keysFor(issuer:string,kid:string,load:typeof fetch,now:number):Promise<any[]>{
  const found=cache.get(issuer);
  if(found && found.until>now && found.keys.some(k=>k.kid===kid))return found.keys;
  const response=await load(issuer+'/cdn-cgi/access/certs',{
    method:'GET',redirect:'error',headers:{Accept:'application/json'}
  });
  if(!response.ok)throw Error('Signing keys unavailable');
  const jwks=await response.json() as any;
  if(!Array.isArray(jwks?.keys)||jwks.keys.length>12)throw Error('Invalid signing key set');
  const keys=jwks.keys.filter((k:any)=>k&&k.kty==='RSA'&&typeof k.kid==='string'&&typeof k.n==='string'&&typeof k.e==='string'&&(!k.alg||k.alg==='RS256')&&(!k.use||k.use==='sig'));
  cache.set(issuer,{until:now+5*60,keys});
  return keys;
}

export async function verifyCloudflareAccess(
 request:Request,config:PilotAuthConfig,
 load:typeof fetch=fetch,now:number=Math.floor(Date.now()/1000)
):Promise<PilotAuthResult>{
  const params=configuration(config);
  if(!params)return {status:503,error:'Pilot-Anmeldung noch nicht sicher konfiguriert.'};
  const token=request.headers.get('Cf-Access-Jwt-Assertion')||'';
  if(!token||token.length>maxTokenLength)return {status:401,error:'Anmeldung über den geschützten Kundenbereich erforderlich.'};
  try{
    const parts=token.split('.');
    if(parts.length!==3)throw Error('Malformed JWT');
    const header=decodeJson(parts[0]!);
    const claims=decodeJson(parts[1]!);
    if(header?.alg!=='RS256'||typeof header.kid!=='string'||header.kid.length>160)throw Error('Wrong signing algorithm');
    if(claims?.iss!==params.issuer || !(typeof claims.aud==='string'?claims.aud===params.aud:Array.isArray(claims.aud)&&claims.aud.includes(params.aud)))throw Error('Invalid access token audience or issuer');
    if(typeof claims.exp!=='number'||!Number.isFinite(claims.exp)||claims.exp<=now||
       (claims.nbf!==undefined&&(typeof claims.nbf!=='number'||claims.nbf>now+clockTolerance))||
       (claims.iat!==undefined&&(typeof claims.iat!=='number'||claims.iat>now+clockTolerance)))throw Error('Expired or premature token');
    if(typeof claims.email!=='string'||!validEmail(claims.email.trim())||typeof claims.sub!=='string'||claims.sub.length<1||claims.sub.length>256)throw Error('Incomplete identity');

    const jwks=await keysFor(params.issuer,header.kid,load,now);
    const key=jwks.find(k=>k.kid===header.kid);
    if(!key)throw Error('Unrecognized signing key');
    const publicKey=await crypto.subtle.importKey('jwk',{kty:'RSA',n:key.n,e:key.e,alg:'RS256',ext:true},
      {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    const authenticated=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',publicKey,
      decodeBase64Url(parts[2]!),new TextEncoder().encode(parts[0]+'.'+parts[1]));
    if(!authenticated)throw Error('Invalid signature');

    const email=claims.email.trim().toLowerCase();
    // The old Sites snapshot may be keyed by a different admin user ID. A
    // stable owner ID may be supplied ONLY after a reviewed D1 migration.
    const admin=config.FACILITY_ADMIN_EMAIL?.trim().toLowerCase();
    const ownerId=config.FACILITY_OWNER_ID?.trim();
    const id=email===admin&&ownerId?ownerId:claims.sub;
    return {identity:{id,email}};
  }catch{
    return {status:403,error:'Kundenanmeldung ungültig oder abgelaufen.'};
  }
}

export function trustedIdentityRequest(request:Request,identity:PilotIdentity):Request{
  const headers=new Headers(request.headers);
  headers.delete('oai-authenticated-user-id');
  headers.delete('oai-authenticated-user-email');
  headers.delete('oai-authenticated-user-full-name');
  headers.delete('oai-authenticated-user-full-name-encoding');
  headers.set('oai-authenticated-user-id',identity.id);
  headers.set('oai-authenticated-user-email',identity.email);
  return new Request(request,{headers});
}
