const assert=require('node:assert/strict');
const fs=require('node:fs');

const html=fs.readFileSync('public/landing.html','utf8');
const css=fs.readFileSync('public/landing.css','utf8');
const workflow=fs.readFileSync('.github/workflows/demo-pages.yml','utf8');

assert.match(html,/<!doctype html>/i);
assert.match(html,/<html lang="de-CH">/);
assert.match(html,/Soft|Alles im Blick|Alles im Fluss/,'Marketing content is present');
assert.match(html,/Content-Security-Policy/,'Script and network restrictions are declared');
assert.match(html,/script-src 'none'/);
assert.match(html,/connect-src 'none'/);
assert(!/<script\b|<form\b|<input\b|<button\b|<iframe\b/ig.test(html),'No executable code, forms, embedded apps or interactive product functionality');
assert(!/(demo\.html|\/dashboard|carglass|sites\.test|lorisbuercher\.chatgpt\.site|\/api\/|login|supabase)/i.test(html),'No demos, real customer references or private app paths');
const links=[...html.matchAll(/href="([^"]+)"/g)].map(m=>m[1]);
assert(links.every(link=>link.startsWith('#')||link.startsWith('mailto:')||link==='landing.css'),'Only same-page navigation or external mail client contact');
assert(!/\b(?:https?:)?\/\//i.test(html.replace(/<!doctype[^>]*>/i,'')),'No network-fetched assets or external scripts/styles');
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'CSS brace balance');
assert(css.includes('.feature-grid')&&css.includes('.hero-illustration')&&css.includes('@media(max-width:480px)'),'Responsive product marketing design');
assert(!/copytree\(|\bcp\s+-r\b|\bpublic\/\*/.test(workflow),'No bulk-copied application files into GitHub Pages');
assert.match(workflow,/copyfile\(source \/ "landing\.html", target \/ "index\.html"\)/);
assert.match(workflow,/copyfile\(source \/ "landing\.css", target \/ "landing\.css"\)/);
assert.match(workflow,/expected = \{"\.nojekyll", "index\.html", "landing\.css", "404\.html"\}/);
assert.match(workflow,/\(target \/ "404\.html"\)\.write_text/);
console.log('PASS: public site is static marketing only; no demo, scripts, customer data, app code or other deploy assets');
