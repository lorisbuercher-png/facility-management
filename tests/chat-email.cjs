const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const source=ts.transpileModule(fs.readFileSync('app/chat-email.ts','utf8'),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},
}).outputText;
const context={exports:{},URL,fetch,console};
vm.runInNewContext(source,context,{filename:'app/chat-email.ts'});
const alerts=context.exports;
const configuration={
  RESEND_API_KEY:'test-key-only',
  FACILITY_CHAT_FROM_EMAIL:'Facility Management <no-reply@facility.test>',
  FACILITY_CHAT_ALERT_TO:'team@facility.test,team@facility.test; owner@facility.test',
  FACILITY_PUBLIC_URL:'https://facility.example.test/subpath',
};
const managerMessage={messageId:'m-1',companyName:'Kunde A',authorRole:'manager',actorEmail:'manager@a.test',recipientEmails:['owner-login@test.ch']};
const adminMessage={...managerMessage,messageId:'m-2',authorRole:'superadmin',actorEmail:'owner-login@test.ch',recipientEmails:['manager@a.test','manager2@a.test']};
assert.equal(alerts.chatEmailRecipients(configuration,managerMessage).join(','),'team@facility.test,owner@facility.test','manager messages go to configured execution inboxes');
assert.equal(alerts.chatEmailRecipients(configuration,adminMessage).join(','),'manager@a.test,manager2@a.test','owner replies go to only server-selected tenant managers');
assert.equal(alerts.chatEmailRecipients({...configuration,FACILITY_CHAT_ALERT_TO:''},managerMessage).join(','),'owner-login@test.ch','fallback owner address');
assert.equal(alerts.chatEmailRecipients({...configuration,FACILITY_CHAT_ALERT_TO:'MANAGER@A.TEST,team@facility.test'},managerMessage).join(','),'team@facility.test','do not notify sender');
const sample=alerts.buildChatEmail(configuration,{...managerMessage,companyName:'A & <script>alert(1)</script>'});
assert.match(sample.text,/https:\/\/facility\.example\.test\/dashboard/);
assert(!sample.html.includes('<script>'),'company name is HTML escaped');
assert(sample.html.includes('A &amp; &lt;script&gt;'),'company is HTML escaped');
assert(!sample.text.includes('Geheime Nachricht'),'message content never used');
(async()=>{
 const deliveries=[];
 const fakeFetch=async(url,options)=>{deliveries.push({url,options});return new Response(JSON.stringify({id:'email-id'}),{status:200})};
 const result=await alerts.sendChatEmailAlerts(configuration,managerMessage,fakeFetch);
 assert.equal(result.recipients,2);assert.equal(result.accepted,2);assert.equal(result.failed,0);
 assert.equal(deliveries[0].url,'https://api.resend.com/emails');
 assert.equal(deliveries[0].options.headers.Authorization,'Bearer test-key-only');
 assert.equal(deliveries[0].options.headers['Idempotency-Key'],'facility-chat/m-1/1');
 assert.equal(deliveries[1].options.headers['Idempotency-Key'],'facility-chat/m-1/2');
 assert.equal(JSON.parse(deliveries[0].options.body).to[0],'team@facility.test');
 assert(!JSON.stringify(deliveries).includes('Geheime Nachricht'));
 const unconfigured=await alerts.sendChatEmailAlerts({...configuration,RESEND_API_KEY:''},managerMessage,async()=>{throw Error('must not fetch')});
 assert.equal(unconfigured.configured,false);assert.equal(unconfigured.accepted,0);
 const errors=await alerts.sendChatEmailAlerts(configuration,adminMessage,async()=>new Response('service unavailable',{status:503}));
 assert.equal(errors.failed,2);assert.equal(errors.accepted,0);
 assert.deepEqual(deliveries.length,2);
 console.log('PASS: chat email sender exclusion, tenant recipient routing, HTML escaping, no chat content, verified origin URL, provider request/idempotency and safe failure');
})().catch(error=>{console.error(error);process.exitCode=1});
