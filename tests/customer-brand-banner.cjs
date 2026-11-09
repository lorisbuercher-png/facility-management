const assert=require('node:assert/strict');
const fs=require('node:fs');

const workspace=fs.readFileSync('public/tenant.js','utf8');
const css=fs.readFileSync('public/soft-glossy-2027.css','utf8');
const snippet=workspace.slice(workspace.indexOf('<div class="workspace-top">'),workspace.indexOf('</nav><div id="workspace-content">')+6);

assert.match(snippet,/class="workspace-identity customer-brand-banner"/,'Every customer workspace needs its brand banner');
assert.match(snippet,/class="logo">\$\{logo\(c\)\}/,'Banner uses existing tenant-specific logo asset');
assert.match(snippet,/class="badge \$\{c\.status/,'Keep tenant status visible and dynamic');
assert.match(css,/main\.customer-ambience \.workspace-top \.workspace-identity\.customer-brand-banner\{[\s\S]*?width:100%;[\s\S]*?max-width:100%;/,'Brand banner must occupy all available workspace width');
assert.match(css,/\.customer-brand-banner > \.logo\{[\s\S]*?grid-column:1 \/ -1;/,'Brand artwork must span the full banner row');
assert.match(css,/\.customer-brand-banner > \.logo img\{[\s\S]*?object-fit:contain;/,'Company logos must not stretch or crop');
assert.match(css,/@media\(max-width:500px\)\{[\s\S]*?\.member-mode main\.customer-ambience \.workspace-top \.workspace-identity\.customer-brand-banner/,'Remove previous small-logo restriction on phones');
assert.match(snippet,/<h1 class="customer-brand-heading">\$\{esc\(c\.name\)\}<\/h1>/,'Accessible company heading stays inside brand banner');
assert.match(css,/body\.company-workspace main\.customer-ambience > \.title-row\{\s*display:none;/,'Duplicate customer title row must disappear without affecting platform header');
assert.match(css,/\.customer-brand-banner > \.customer-brand-heading\{[\s\S]*?clip-path:inset\(50%\);/,'Accessible title remains visually hidden');
assert.equal((css.match(/\{/g)||[]).length,(css.match(/\}/g)||[]).length,'Stylesheet braces must balance');
console.log('PASS: full-width logo replaces duplicated customer title, with preserved accessibility and responsiveness');
