import { landingHtml } from './landing';
export const dynamic='force-dynamic';
export function GET(){return new Response(landingHtml,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'}})}
