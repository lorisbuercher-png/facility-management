const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const assert=require('node:assert/strict');

// These browser scripts are loaded dynamically by the demo. TypeScript and
// production builds do not parse-check them, so catch broken JS at CI time.
const directory=path.join(__dirname,'..','public');
const files=fs.readdirSync(directory).filter(f=>f.endsWith('.js')).sort();
assert(files.length>=20,'Expected the complete public script collection');
for(const name of files){
  new vm.Script(fs.readFileSync(path.join(directory,name),'utf8'),{filename:'public/'+name});
}
const demo=fs.readFileSync(path.join(directory,'demo.js'),'utf8');
const review=fs.readFileSync(path.join(directory,'review.js'),'utf8');
assert.match(review,/function priorityOptions\s*\(/,'Employee filter needs review.js helper');
// The public demo intentionally does not load the staff portal. If a staff
// module is reintroduced in a protected build, load its dependency first.
const employeeModule=demo.indexOf("'/employee.js'");
assert(employeeModule<0||demo.indexOf("'/review.js'")>=0&&employeeModule>demo.indexOf("'/review.js'"),
 'Review helper must load before employee portal when present');
console.log('PASS: '+files.length+' public browser scripts parse and employee dependencies load in correct order');
