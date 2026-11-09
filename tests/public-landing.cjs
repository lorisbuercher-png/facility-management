const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('public/landing.html','utf8');
const css=fs.readFileSync('public/landing.css','utf8');
const workflow=fs.readFileSync('.github/workflows/demo-pages.yml','utf8');

assert.match(html,/<!doctype html>/i);
assert.match(html,/<html lang="de-CH">/);
assert.match(html,/Gebäudeunterhalt/);
assert.match(html,/Weniger Aufwand/);
assert.match(html,/Alles im Blick/);
assert.match(html,/Content-Security-Policy/);
assert.match(html,/script-src 'none'/);
assert.match(html,/connect-src 'none'/);
assert(!/<script\b|<form\b|<input\b|<button\b|<iframe\b/ig.test(html),'No executable code, forms, embedded apps or product functionality');
assert(!/(demo\.html|\/dashboard|carglass|sites\.test|lorisbuercher\.chatgpt\.site|\/api\/|login|supabase)/i.test(html),'No public demos or private app/customer references');
const links=[...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
assert(links.every(link=>link.startsWith('#')||link.startsWith('mailto:')||link==='landing.css'),'Only same-page navigation and email contact');
assert(!/\b(?:https?:)?\/\//i.test(html.replace(/<!doctype[^>]*>/i,'')),'No externally fetched assets or fonts');

// The graphic must explain maintenance, trades and documentation instead of
// being generic decoration. It remains static SVG/HTML and contains no data.
assert.match(html,/class="building-art"/,'Buildings are shown in an inline vector illustration');
assert.match(html,/Mangel gemeldet/,'Maintenance problem visible in graphic');
assert.match(html,/FB übernimmt/,'FB takes over execution after manager approval');
assert.match(html,/Nach Managerfreigabe/,'Manager approval shown before FB takes over');
assert.match(html,/Erledigt &amp; dokumentiert/,'Completed work and documentation shown in graphic');
assert.match(html,/Rapport und Fotos/,'Report/fotos are represented');
assert.equal((html.match(/class="process-card"/g)||[]).length,4,'Four-step maintenance process');
assert.match(html,/id="gebaeudeakte"/,'Building record section');
assert.match(html,/Management/);
assert.match(html,/Filialleitung/);
assert.match(html,/FB Spezialbau &amp; Ausführung/);
assert.match(html,/Symbolische Illustration|Schematische Darstellung/,'Graphic states it is illustrative');
assert.match(html,/Pilotbetrieb/,'Do not claim unfinished features are already operating');

assert.match(html,/<strong>FB SPEZIALBAU<\/strong>/,'FB Spezialbau must be the visible site brand');
assert.match(html,/FB Spezialbau übernimmt die Ausführung/,'Contractor, not customer, performs the work');
assert.match(html,/KUNDE · FILIALLEITER/,'Branch manager reports defects only');
assert.match(html,/KUNDE · MANAGER/,'Customer manager approves jobs');
assert.match(html,/FB SPEZIALBAU · AUSFÜHRUNG/,'FB Spezialbau handles the execution');
assert.match(html,/KUNDE · KLARE ÜBERSICHT/,'Customer sees work results');
assert.match(html,/Sie haben die Übersicht/,'Customer gains overview without doing the execution');
assert.doesNotMatch(html,/Maler|Malerarbeiten/i,'Do not focus the offering on a single trade');
assert.match(html,/info@fb-spezialbau\.ch/,'FB Spezialbau is the contact recipient');

assert.match(html,/Ihr Filialleiter meldet den Unterhaltsbedarf, Ihr Manager prüft und gibt den Auftrag frei/,'Correct roles in hero');
assert.match(html,/Filialleiter erfasst den Mangel.*ohne Prüf- oder Freigabeaufgabe/,'No branch manager approval responsibility');
assert.match(html,/Ausschliesslich der zuständige Manager beurteilt die Meldung/,'Customer manager has sole approval authority');
assert.match(html,/Sie müssen nicht selbst jedem Arbeitsschritt hinterherlaufen/,'Customer workload reduction is explained');
assert.match(html,/was offen, in Bearbeitung oder bereits erledigt ist/,'Full work visibility is highlighted');
assert.match(html,/class="dossier-summary"/,'Three-state overview illustration');
assert.match(html,/Fotos, Abschlussdatum und Arbeitsrapporte/,'Finished work is documented');
assert.match(css,/\.dossier-summary\s*\{/,'Responsive work status visualization exists');

assert.match(html,/nicht|Vorbereitung/,'Unfinished pilot features must not be advertised as operational');


assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'CSS braces must balance');
assert(css.includes('.hero-scene')&&css.includes('.building-art')&&css.includes('.benefit-grid')&&css.includes('.process-grid'),'Maintenance layout styling');
assert(css.includes('@media(max-width:400px)'),'Smartphone layout');
assert(css.includes('prefers-reduced-motion'),'Accessibility');
assert(!/copytree\(|\bcp\s+-r\b|\bpublic\/\*/.test(workflow),'Never publish all public files');
assert.match(workflow,/copyfile\(source \/ "landing\.html", target \/ "index\.html"\)/);
assert.match(workflow,/copyfile\(source \/ "landing\.css", target \/ "landing\.css"\)/);
assert.match(workflow,/expected = \{"\.nojekyll", "index\.html", "landing\.css", "404\.html"\}/);
assert.match(workflow,/\(target \/ "404\.html"\)\.write_text/);
console.log('PASS: FB Spezialbau relieves client, branch manager reports only, customer manager approves, open/in-progress/completed overview, static public landing');
