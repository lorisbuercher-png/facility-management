import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
for(const file of readdirSync('tests').filter(f=>f.endsWith('.cjs')).sort()){const r=spawnSync(process.execPath,['tests/'+file],{stdio:'inherit'});if(r.error)throw r.error;if(r.status!==0)process.exit(r.status||1);}
