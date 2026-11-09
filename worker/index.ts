import handler from "vinext/server/fetch-handler";
import {verifyCloudflareAccess,trustedIdentityRequest,type PilotAuthConfig} from "../app/pilot-access";
import { runWithConnectorBinding } from "../lib/connector-context";
import type { ConnectorBinding } from "../lib/connector-contract.mjs";

const worker = {
  async fetch(request: Request, env: Cloudflare.Env, ctx: ExecutionContext<{ CONNECTORS?: ConnectorBinding }>) {
    // Standalone deployments must explicitly select and enforce the identity
    // boundary. Never accept unsigned client-provided identity headers.
    const config=env as Cloudflare.Env & PilotAuthConfig;
    const mode=config.FACILITY_AUTH_MODE;
    if(mode!=='cloudflare-access' && mode!=='sites-gateway'){
      return Response.json({error:'Die geschützte Anmeldung ist noch nicht konfiguriert.'},{
        status:503,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}
      });
    }
    if(mode==='cloudflare-access'){
      const verified=await verifyCloudflareAccess(request,config);
      if('status' in verified){
        return Response.json({error:verified.error},{
          status:verified.status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}
        });
      }
      request=trustedIdentityRequest(request,verified.identity);
      const pathname=new URL(request.url).pathname;
      // Older Sites sign-in links do not apply to an Access-authenticated app.
      if(pathname==='/signin-with-chatgpt')return Response.redirect(new URL('/dashboard',request.url),302);
      if(pathname==='/signout-with-chatgpt')return Response.redirect(new URL('/cdn-cgi/access/logout',request.url),302);
    }
    // 'sites-gateway' may ONLY be used behind the original trusted ChatGPT
    // Sites identity gateway. Never configure it on a publicly reachable Worker.
    let binding = ctx.props?.CONNECTORS;
    // Local preview emulates the same request-scoped capability. This branch and
    // the auxiliary service binding are absent from production builds.
    if (import.meta.env.DEV && !binding && env.CONNECTORS) {
      const preview = env.CONNECTORS;
      const expiresAt = Date.now() + 60_000;
      binding = {
        async getContext() {
          if (Date.now() >= expiresAt) return { status: "request_context_expired" };
          return preview.getContext?.() ?? { status: "binding_unavailable" };
        },
        async invoke(connectorId, actionName, args) {
          if (Date.now() >= expiresAt) {
            return { status: "request_context_expired", message: "This request has expired. Please try again." };
          }
          return preview.invoke(connectorId, actionName, args);
        },
      };
    }
    return runWithConnectorBinding(binding, () => handler.fetch(request, env, ctx));
  },
};

export default worker;
