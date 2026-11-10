const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('public/landing.html','utf8');
const css=fs.readFileSync('public/landing.css','utf8');
const workflow=fs.readFileSync('.github/workflows/demo-pages.yml','utf8');
const artwork=fs.readFileSync('public/assets/oscd-facility-worker.webp');
const workflowLogic=fs.readFileSync('app/workflow.ts','utf8');
const branch=fs.readFileSync('public/branch-view.js','utf8');
const chat=fs.readFileSync('public/customer-chat.js','utf8');
const buildingRecord=fs.readFileSync('public/building-record.js','utf8');
const employee=fs.readFileSync('public/employee.js','utf8');
const has=(re,message)=>assert.match(html,re,message);

// An acquisition site is not an unlocked customer portal.
has(/<!doctype html>/i,'HTML doctype');
has(/<html lang="de-CH">/,'Swiss German locale');
has(/Content-Security-Policy/,'CSP exists');
has(/script-src 'none'/,'No public scripts');
has(/connect-src 'none'/,'No public API connections');
assert(!/<script\b|<form\b|<input\b|<button\b|<iframe\b/i.test(html),'Public site is inert');
assert(!/(demo\.html|\/dashboard|carglass|lorisbuercher\.chatgpt\.site|\/api\/|supabase)/i.test(html),'No app demo, private URLs or customer references');
assert(!html.includes('app.oscd.ch'),'No link to the not-yet-live customer app');
assert(!/(?:https?:)?\/\//i.test(html.replace(/<!doctype[^>]*>/i,'')),'No external CDNs, images or trackers');
const links=[...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
assert(links.every(link=>link.startsWith('#')||link.startsWith('mailto:')||link==='landing.css'),'Only internal sections or business contact links');
for(const link of links.filter(link=>link.startsWith('#'))) {
  assert(html.includes('id="'+link.slice(1)+'"'),'Missing anchor '+link);
}

// Approved OSCD mockup is rebuilt with real content and semantic HTML.
has(/<strong>OSCD<\/strong>/,'Brand is OSCD');
has(/Onsite Control Desk/,'Brand long name');
has(/Ein Produkt der <strong>FB Spezialbau<\/strong>/,'Company attribution in header');
has(/Gebäudeunterhalt/,'The value proposition is about facility maintenance');
has(/Einfach, digital/,'Approved mockup headline');
has(/class="hero-visual"/,'Technician hero illustration');
has(/src="oscd-hero\.webp"/,'Approved hero artwork');
has(/Designvisualisierung · keine Kundendaten/,'Artwork is clearly illustrative');
has(/class="dashboard-preview"/,'Custom software dashboard illustration');
has(/Schematische Produktvorschau · keine Live-Daten/,'The overview does not pretend to show real customer data');
has(/class="preview-metrics"/,'Status metric design matches real product');
has(/<span class="status status-red">Gemeldet<\/span>/,'Meldung status is shown');
has(/<span class="status status-yellow">Freigegeben<\/span>/,'Approval status is shown');
has(/<span class="status status-green">Erledigt<\/span>/,'Completed status is shown');
assert(!/class="preview-metrics"[\s\S]*?<strong>\d+<\/strong>/.test(html),'No invented live counts in dashboard');
assert.equal((html.match(/class="feature-card"/g)||[]).length,3,'Three specific features');
assert.equal((html.match(/class="process-card"/g)||[]).length,4,'Four-stage workflow');
assert.equal((html.match(/class="roles-grid"/g)||[]).length,1,'Roles explained once');
has(/Kundenchat/,'Real customer chat module is described');
has(/Vorher-\/Nachher-Fotos/,'Actual photo report functionality is described');
has(/Gebäudehistorie/,'Building record history is explained');
has(/Arbeitsstunden/,'Time reporting is explained');

// Do not alter or misrepresent the app role permissions.
assert.match(workflowLogic,/if\(user\.role!=='manager'\)return fail\('Nur der zuständige Manager darf freigeben oder ablehnen\./,'Manager is the only customer approver');
assert.match(branch,/Dein Manager prüft jede Meldung/,'Filialleiter report, not approve');
assert.match(chat,/\['superadmin','manager'\]/,'Protected manager-to-provider customer chat');
assert.match(buildingRecord,/function renderBuildingRecord/,'Real building history exists');
assert.match(employee,/Rapport & Abschluss|Rapport &amp; Abschluss|Rapport/,'Employees document completed work');
has(/Nur der zuständige Manager gibt Aufträge frei/,'Only customer managers approve');
has(/ohne Prüf- oder Freigaberechte/,'Branch manager never approves');
has(/FB Spezialbau übernimmt die Ausführung/,'FB Spezialbau is the executing contractor');

// Commercial CTA: real destination, no fake published login or promises.
assert((html.match(/Pilotgespräch anfragen/g)||[]).length>=2,'Prominent sales calls to action');
has(/mailto:info@fb-spezialbau\.ch\?subject=Pilotgespraech%20OSCD/,'Sales inquiry uses established real inbox');
has(/Kunden-Pilotbetrieb vorbereitet/,'Product is not represented as launched');
has(/noch nicht produktiv freigegeben/,'Email automation is not represented as active');
assert(!/garantiert|100\s*%|CHF\s*\d|\d+\s*(?:zufriedene Kunden|Standorte live)/i.test(html),'No fabricated guarantees or figures');

// Visual and static asset integrity.
assert(artwork.length>20000 && artwork.length<400000,'Optimized artwork is included');
assert.equal(artwork.toString('ascii',0,4),'RIFF','Valid WebP RIFF signature');
assert.equal(artwork.toString('ascii',8,12),'WEBP','Valid WebP format');
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'CSS braces balanced');
for(const key of ['--yellow:#fdc500','--graphite:#20252d','.site-header','.hero-visual','.dashboard-preview','.feature-grid','.process-grid','.record-preview','.contact-section']) {
 assert(css.includes(key),'Expected mockup layout or brand color: '+key);
}
for(const media of ['@media(max-width:1230px)','@media(max-width:980px)','@media(max-width:690px)','@media(max-width:420px)','prefers-reduced-motion']) {
 assert(css.includes(media),'Responsive design/accessibility rule missing: '+media);
}
assert(css.includes('overflow-x:clip'),'Keep sticky header from being clipped by scrolling container');

// Strict GitHub Pages allowlist: no JS, app, photos, customer demos.
assert(!/copytree\(|\bcp\s+-r\b|\bpublic\/\*/.test(workflow),'No bulk publication of public/');
assert.match(workflow,/copyfile\(source \/ "landing\.html", target \/ "index\.html"\)/);
assert.match(workflow,/copyfile\(source \/ "landing\.css", target \/ "landing\.css"\)/);
assert.match(workflow,/copyfile\(source \/ "assets" \/ "oscd-facility-worker\.webp", target \/ "oscd-hero\.webp"\)/);
assert.match(workflow,/expected = \{"\.nojekyll", "index\.html", "landing\.css", "oscd-hero\.webp", "404\.html"\}/);
assert(!workflow.includes('property-cover.png'),'Old public building image no longer shipped');
console.log('PASS: approved OSCD landing visual, real roles and features, optimized worker artwork, mobile layout and public-only deployment');
