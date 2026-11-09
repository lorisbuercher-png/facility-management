const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('public/landing.html','utf8');
const css=fs.readFileSync('public/landing.css','utf8');
const workflow=fs.readFileSync('.github/workflows/demo-pages.yml','utf8');

assert.match(html,/<!doctype html>/i);
assert.match(html,/<html lang="de-CH">/);
assert.match(html,/Gebäudeunterhalt/);
assert.match(html,/Klar organisiert/);
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
assert.match(html,/Gewerk zugeteilt/,'Trades assignment visible in graphic');
assert.match(html,/Malerarbeiten/,'Concrete maintenance trade visible in graphic');
assert.match(html,/Arbeit dokumentiert/,'Documented completion visible in graphic');
assert.match(html,/Rapport und Fotos/,'Report/fotos are represented');
assert.equal((html.match(/class="process-card"/g)||[]).length,4,'Four-step maintenance process');
assert.match(html,/id="gebaeudeakte"/,'Building record section');
assert.match(html,/Management/);
assert.match(html,/Filialleitung/);
assert.match(html,/Disposition &amp; Teams/);
assert.match(html,/Symbolische Illustration|Schematische Darstellung/,'Graphic states it is illustrative');
assert.match(html,/Pilotbetrieb/,'Do not claim unfinished features are already operating');

assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'CSS braces must balance');
assert(css.includes('.hero-scene')&&css.includes('.building-art')&&css.includes('.benefit-grid')&&css.includes('.process-grid'),'Maintenance layout styling');
assert(css.includes('@media(max-width:400px)'),'Smartphone layout');
assert(css.includes('prefers-reduced-motion'),'Accessibility');
assert(!/copytree\(|\bcp\s+-r\b|\bpublic\/\*/.test(workflow),'Never publish all public files');
assert.match(workflow,/copyfile\(source \/ "landing\.html", target \/ "index\.html"\)/);
assert.match(workflow,/copyfile\(source \/ "landing\.css", target \/ "landing\.css"\)/);
assert.match(workflow,/expected = \{"\.nojekyll", "index\.html", "landing\.css", "404\.html"\}/);
assert.match(workflow,/\(target \/ "404\.html"\)\.write_text/);
console.log('PASS: static maintenance-product landing, inline building artwork, four-step workflow, trade teams, building dossier, mobile design and public-only deploy');
