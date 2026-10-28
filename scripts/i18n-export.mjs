// Writes the app's text for Crowdin: i18n/en.json (the source) and i18n/<lang>.json (the current translations).
// usage: node scripts/i18n-export.mjs        then upload i18n/en.json as the source file (and, once, the language files as translations)
import fs from 'node:fs';import {SRC,DIR,readBlock,entries,langs} from './i18n-lib.mjs';
const {t}=readBlock(fs.readFileSync(SRC,'utf8')),E=entries(t);
const keys=new Set();for(const e of E){if(keys.has(e.key))throw new Error('duplicate key: '+e.key);keys.add(e.key)}
fs.mkdirSync(DIR,{recursive:true});
const write=(name,obj)=>fs.writeFileSync(DIR+name,JSON.stringify(obj,null,2)+'\n');
write('en.json',Object.fromEntries(E.map(e=>[e.key,e.en])));
for(const l of langs(t))write(l+'.json',Object.fromEntries(E.filter(e=>e.get(l)!=null).map(e=>[e.key,e.get(l)])));
console.log(`${E.length} strings, ${langs(t).length} languages written to i18n/`);
