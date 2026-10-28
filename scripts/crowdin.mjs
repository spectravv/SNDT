// Crowdin sync for the string-based project https://crowdin.com/project/sndt-cc
//   node scripts/crowdin.mjs push   uploads i18n/en.json (run scripts/i18n-export.mjs first); unchanged lines keep their translations
//   node scripts/crowdin.mjs pull   downloads the approved translations into i18n/<lang>.json (then run scripts/i18n-import.mjs)
// The API token is read from CROWDIN_TOKEN or ~/.crowdin-token (never stored in the repo).
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
const PROJECT=941815,BRANCH=1,BUNDLE=1,API='https://api.crowdin.com/api/v2';
const DIR=new URL('../i18n/',import.meta.url).pathname;
const token=(process.env.CROWDIN_TOKEN||fs.readFileSync(path.join(os.homedir(),'.crowdin-token'),'utf8')).trim();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function api(p,opt={}){const r=await fetch(API+p,{...opt,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',...opt.headers}});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(`${opt.method||'GET'} ${p}: ${r.status} ${JSON.stringify(j).slice(0,300)}`);return j.data}
async function wait(p){for(let i=0;i<200;i++){const d=await api(p);if(d.status==='finished')return d;if(d.status==='failed')throw new Error('Crowdin job failed: '+p);await sleep(3000)}throw new Error('Crowdin job timed out: '+p)}

async function push(){
  const st=await api('/storages',{method:'POST',body:fs.readFileSync(DIR+'en.json'),headers:{'Crowdin-API-FileName':'en.json'}});
  const up=await api(`/projects/${PROJECT}/strings/uploads`,{method:'POST',body:JSON.stringify({storageId:st.id,branchId:BRANCH,type:'json',updateStrings:true,cleanupMode:true,updateOption:'keep_translations'})});
  await wait(`/projects/${PROJECT}/strings/uploads/${up.identifier}`);console.log('uploaded i18n/en.json to Crowdin');
}
const unxml=s=>s.replace(/&#x([0-9a-f]+);/gi,(_,h)=>String.fromCodePoint(parseInt(h,16))).replace(/&#(\d+);/g,(_,d)=>String.fromCodePoint(+d))
  .replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&amp;/g,'&');
// keys with a full stop come back in quotes (Crowdin reads dots as nesting otherwise)
const unkey=k=>/^".*"$/s.test(k)?k.slice(1,-1).replace(/\\(.)/g,'$1'):k;
async function pull(){
  const ex=await api(`/projects/${PROJECT}/bundles/${BUNDLE}/exports`,{method:'POST'});
  await wait(`/projects/${PROJECT}/bundles/${BUNDLE}/exports/${ex.identifier}`);
  const {url}=await api(`/projects/${PROJECT}/bundles/${BUNDLE}/exports/${ex.identifier}/download`);
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sndt-crowdin-'));fs.writeFileSync(tmp+'/b.zip',Buffer.from(await (await fetch(url)).arrayBuffer()));
  const z=spawnSync('unzip',['-o','-q',tmp+'/b.zip','-d',tmp+'/x']);if(z.status)throw new Error('unzip failed: '+z.stderr);
  for(const f of fs.readdirSync(tmp+'/x').filter(f=>f.endsWith('.xliff')).sort()){
    const out={};for(const m of fs.readFileSync(tmp+'/x/'+f,'utf8').matchAll(/<trans-unit\b[^>]*\bresname="([^"]*)"[^>]*>([\s\S]*?)<\/trans-unit>/g)){
      const t=/<target\b[^>]*>([\s\S]*?)<\/target>/.exec(m[2]);if(t)out[unkey(unxml(m[1]))]=unxml(t[1])}
    const n=Object.keys(out).length,lang=f.slice(0,-6);
    if(!n){continue}fs.writeFileSync(DIR+lang+'.json',JSON.stringify(out,null,2)+'\n');console.log(`${lang}: ${n} approved translations`)}
  fs.rmSync(tmp,{recursive:true,force:true});
}
const cmd=process.argv[2];if(cmd==='push')await push();else if(cmd==='pull')await pull();else console.log('usage: node scripts/crowdin.mjs push|pull');
