import {readFileSync,writeFileSync} from 'node:fs';
const file='public/language.js',source=readFileSync(file,'utf8'),marker=';\n(()=>{',at=source.indexOf(marker);if(at<0)throw Error('Language runtime marker missing');const catalog=JSON.parse(readFileSync('public/i18n/catalog.json','utf8'));writeFileSync(file,'window.FACILITY_TRANSLATIONS='+JSON.stringify(catalog,null,2)+source.slice(at));
