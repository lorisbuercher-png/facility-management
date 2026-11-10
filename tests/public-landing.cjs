const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('public/landing.html','utf8');
const css=fs.readFileSync('public/landing.css','utf8');
const workflow=fs.readFileSync('.github/workflows/demo-pages.yml','utf8');
const workflowLogic=fs.readFileSync('app/workflow.ts','utf8');
const branch=fs.readFileSync('public/branch-view.js','utf8');
const chat=fs.readFileSync('public/customer-chat.js','utf8');
const buildingRecord=fs.readFileSync('public/building-record.js','utf8');
const employee=fs.readFileSync('public/employee.js','utf8');

const has=(pattern,reason)=>assert.match(html,pattern,reason);

// The public site is only a static acquisition page, not a client demo.
has(/<!doctype html>/i,'Valid document');
has(/<html lang="de-CH">/,'Swiss marketing site');
has(/Content-Security-Policy/,'Protect public landing');
has(/script-src 'none'/,'Do not allow scripts');
has(/connect-src 'none'/,'Do not allow API calls');
assert(!/<script\b|<form\b|<input\b|<button\b|<iframe\b/ig.test(html),'No executable script, forms or app components');
assert(!/(demo\.html|\/dashboard|carglass|lorisbuercher\.chatgpt\.site|\/api\/|login|supabase)/i.test(html),'No customer references or private app routes');
const links=[...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
assert(links.every(link=>link.startsWith('#')||link.startsWith('mailto:')||link==='landing.css'),'Only same-page links, mailto and local stylesheet');
assert(!/\b(?:https?:)?\/\//i.test(html.replace(/<!doctype[^>]*>/i,'')),'No third-party resources');
has(/<strong>FB SPEZIALBAU<\/strong>/,'FB Spezialbau identity');

// Commercial promise is grounded in the actual modules and customer roles.
has(/Facility Management für Filialunternehmen/,'Position software for multi-site business');
has(/Weniger Aufwand/,'Lead with customer benefit');
has(/Mehr Überblick/,'Lead with multi-site visibility');
has(/Dashboard/,'Dashboards exist');
has(/Kundenchat/,'Customer chat is offered');
has(/Rapport/,'Task documentation is offered');
has(/Gebäudeakte/,'Building dossier is offered');
has(/Alle Filialen/,'Multi-site management is a core benefit');
has(/Freigaben/,'Approvals are in the UI');
has(/nach Filiale, Status oder Priorität filtern/,'Filters are implemented');
has(/Arbeitsstunden/,'Completed task captures hours');
has(/Vorher- und Nachher-Fotos/,'Building dossier displays before/after images');
has(/begründet ab/,'Manager can reject with reason');
assert.match(workflowLogic,/if\(user\.role!=='manager'\)return fail\('Nur der zuständige Manager darf freigeben oder ablehnen\./,'Manager owns approvals in server logic');
assert.match(branch,/Dein Manager prüft jede Meldung/,'Branch manager only reports');
assert.match(chat,/\['superadmin','manager'\]/,'Customer chat is manager-to-provider');
assert.match(buildingRecord,/function renderBuildingRecord/,'Building dossier is implemented');
assert.match(employee,/Rapport & Abschluss|Rapport &amp; Abschluss|Rapport/,'Staff can report work');

// Product workflow uses real status values instead of inventing progress states.
has(/class="service-image"/,'Commercial-property illustration replaces cartoon building');
has(/src="facility-building\.png"/,'Approved generic local visual must load');
has(/GEBÄUDEUNTERHALT MIT FB SPEZIALBAU/,'Facility services are visible in graphic');
has(/Manager gibt frei/,'Hero illustrates customer approval');
has(/<strong>Arbeit dokumentiert<\/strong>/,'Hero illustrates completed work');
has(/Gemeldet<\/span><span>Freigegeben<\/span><span>Erledigt/,'Actual persisted statuses represented');
assert(!/IN ARBEIT|In Bearbeitung|Malerarbeiten|Maler-/i.test(html),'No fictional in-progress state or narrow trade positioning');
assert.equal((html.match(/class="process-card"/g)||[]).length,4,'Four real workflow steps');
has(/class="timeline"/,'Chronological record');
has(/role-grid/,'Explicit role-specific views');
has(/<h3>Filialleitung<\/h3>/,'Filialleiter role distinct');
has(/Prüf- und Freigaberechte liegen beim Manager/,'Branch role never approves');
has(/<h3>Kundenmanagement<\/h3>/,'Customer manager is decision maker');
has(/<h3>FB Spezialbau &amp; Ausführung<\/h3>/,'Execution provider distinct');

// Conversion without inventing launch readiness, customers, pricing or results.
assert((html.match(/Pilotgespräch anfragen/g)||[]).length>=2,'A clear top and bottom acquisition CTA');
has(/mailto:info@fb-spezialbau\.ch\?subject=Pilotgespraech%20Facility%20Management/,'Pilot lead goes to real business inbox');
has(/Pilotbetrieb vorbereitet/,'Pilot status is transparent');
has(/noch nicht produktiv freigegeben/,'Unfinished automatic mail assignment not sold as live');
assert(!/garantiert|100\s*%|CHF\s*\d|\d+\s*(?:zufriedene Kunden|Standorte live)/i.test(html),'No invented guarantees, prices or adoption metrics');

assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'CSS braces must balance');
assert(css.includes('.hero-scene')&&css.includes('.service-image')&&css.includes('.benefit-grid')&&css.includes('.process-grid'),'Illustrated product sales layout');
assert(css.includes('@media(max-width:400px)'),'Responsive smartphone layout');
assert(css.includes('prefers-reduced-motion'),'Reduced motion support');

// Visual regression prevention for clipped header, CTA text collisions and
// unnecessary duplicate benefit rows in the public marketing hero.
assert(!html.includes('class="trust-strip'),'Hero benefits must not be repeated directly below');
assert.equal((html.match(/class="hero-audience"/g)||[]).length,1,'Only one concise hero benefits row');
assert(css.includes('overflow-x:clip'),'Prevent body overflow container from disabling sticky header');
assert(css.includes('position:sticky;top:12px'),'Header stays visible at the top on desktop');
assert(css.includes('.hero h1{font-size:clamp(43px,4.4vw,62px)'),'Headline is bounded by column width');
assert(css.includes('white-space:normal;text-wrap:balance'),'Headline must wrap instead of spilling into visual');
assert(css.includes('.hero-buttons{display:flex;flex-wrap:wrap'),'CTA buttons reflow instead of overlapping text');
assert(css.includes('object-fit:cover'),'Hero photo has stable aspect ratio');
assert(css.includes('.hero-scene .scene-note strong{white-space:normal'),'Floating status callouts must wrap');
assert(css.includes('.hero-scene .service-image-label'),'Image identifies FB Spezialbau as execution partner');
assert.match(workflow,/copyfile\(source \/ "assets" \/ "property-cover\.png", target \/ "facility-building\.png"\)/,'Only generic approved building image is published');


// GitHub Pages deploy is restricted to marketing files only.
assert(!/copytree\(|\bcp\s+-r\b|\bpublic\/\*/.test(workflow),'Never bulk-publish private app scripts');
assert.match(workflow,/copyfile\(source \/ "landing\.html", target \/ "index\.html"\)/);
assert.match(workflow,/copyfile\(source \/ "landing\.css", target \/ "landing\.css"\)/);
assert.match(workflow,/expected = \{"\.nojekyll", "index\.html", "landing\.css", "facility-building\.png", "404\.html"\}/);
console.log('PASS: real Facility Management features, customer-manager workflow, sales CTA, pilot disclosure and static public-only deployment');
