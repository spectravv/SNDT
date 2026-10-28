// Reads translations downloaded from Crowdin (i18n/<lang>.json) back into src/sndt.html.
// A translation is skipped (the current one stays) if it is empty, still the English text, or drops/adds a placeholder
// like {n} or $1 or an HTML tag. Only the lines of the source that really change are rewritten.
// usage: node scripts/i18n-import.mjs [--dry]
import fs from 'node:fs';import {SRC,DIR,readBlock,entries,langs,marks,tags,readJSON} from './i18n-lib.mjs';
const dry=process.argv.includes('--dry'),html=fs.readFileSync(SRC,'utf8'),{lines,a,b,t}=readBlock(html),E=entries(t);
const byKey=new Map(E.map(e=>[e.key,e]));let changed=0;const problems=[];
for(const l of langs(t)){const f=DIR+l+'.json';if(!fs.existsSync(f))continue;let n=0;
  for(const [k,v] of Object.entries(readJSON(f))){const e=byKey.get(k);
    if(!e){problems.push(`${l}: unknown key (removed from the app?): ${k}`);continue}
    if(typeof v!=='string'||!v.trim()||(v===e.en&&e.get(l)!=null&&e.get(l)!==e.en))continue;
    if(marks(v)!==marks(e.en)){problems.push(`${l}: placeholders differ, skipped: ${k}  →  ${v}`);continue}
    if(tags(v)!==tags(e.en)){problems.push(`${l}: HTML tags differ, skipped: ${k}  →  ${v}`);continue}
    if(e.get(l)!==v){e.set(l,v);n++}}
  if(n)console.log(`${l}: ${n} updated`);changed+=n}
for(const f of fs.readdirSync(DIR))if(/\.json$/.test(f)&&f!=='en.json'&&!t.LI[f.slice(0,-5)])problems.push(`${f}: new language, not imported yet (it needs adding to LANGS/LI first)`);
problems.forEach(p=>console.log('! '+p));
if(!changed){console.log('nothing to change');process.exit(0)}

// write the changed tables back, line by line
const q=JSON.stringify,ident=k=>/^[a-z_$][\w$]*$/i.test(k)?k:q(k);
const obj=o=>Array.isArray(o)?'['+o.map(obj).join(',')+']':typeof o==='object'?'{'+Object.entries(o).map(([k,v])=>ident(k)+':'+obj(v)).join(',')+'}':q(o);
const out=lines.slice();let row=0;
const evalExpr=s=>new Function('return '+s)();
for(let i=a;i<=b;i++){const L=lines[i];
  if(L.startsWith('const L10N=[')||L.startsWith('L10N.push(')){
    const isC=L.startsWith('const'),inner=isC?L.slice(11,-1):'['+L.slice(10,-2)+']',rows=evalExpr(inner),now=t.L10N.slice(row,row+rows.length);row+=rows.length;
    if(q(rows)!==q(now)){const body=now.map(r=>'['+r.map(q).join(', ')+']').join(',');out[i]=isC?'const L10N=['+body+'];':'L10N.push('+body+');'}continue}
  const m=/^const (HOW|ABOUT|TIMEU|BLK|THEMEW|THEMEP)=/.exec(L);
  if(m){let j=i,v;for(;j<=b;j++){try{v=evalExpr(lines.slice(i,j+1).join('\n').slice(m[0].length).replace(/;\s*$/,''));break}catch(e){}}
    if(q(v)!==q(t[m[1]])){out[i]='const '+m[1]+'='+obj(t[m[1]])+';';for(let k=i+1;k<=j;k++)out[k]=null}i=j;continue}
  const p=t.PAT.find(p=>typeof p[1]!=='function'&&L.startsWith(' ['+p[0]+',{'));
  if(p){const was=evalExpr(L.trim().replace(/,$/,'').slice(1+String(p[0]).length+1,-1));if(q(was)!==q(p[1]))out[i]=' ['+p[0]+','+obj(p[1])+(L.trimEnd().endsWith(',')?'],':']')}}
if(row!==t.L10N.length)throw new Error('could not match every L10N row to its line; nothing written');
const res=out.filter(x=>x!==null).join('\n');
// check: the rewritten block must read back exactly as the updated tables
const back=entries(readBlock(res).t);for(const l of langs(t))for(const e of E){const e2=back.find(x=>x.key===e.key);if(e2.get(l)!==e.get(l))throw new Error('read-back mismatch for '+l+': '+e.key)}
if(dry)console.log(`dry run: ${changed} translations would change`);else{fs.writeFileSync(SRC,res);console.log(`wrote ${changed} translations to src/sndt.html`)}
