// Shared code for i18n-export.mjs and i18n-import.mjs: reads the translation tables out of src/sndt.html
// (L10N, HOW, ABOUT, TIMEU, BLK, THEMEW, THEMEP and the PAT patterns) and turns them into flat key → text files for Crowdin.
// Keys: plain English for the L10N table; the small tables and patterns get a prefix ("how: ", "pattern: " …) so translators see what they are.
import fs from 'node:fs';
export const SRC=new URL('../src/sndt.html',import.meta.url).pathname;
export const DIR=new URL('../i18n/',import.meta.url).pathname;

// the translation block runs from "const L10N=" to the "];" that closes PAT
export function readBlock(html){
  const lines=html.split('\n'),a=lines.findIndex(l=>l.startsWith('const L10N=[')),p=lines.findIndex(l=>l.startsWith('const PAT=['));
  const b=lines.findIndex((l,i)=>i>p&&l==='];');
  if(a<0||p<0||b<0)throw new Error('translation block not found in src/sndt.html');
  const t=new Function('lsGet',lines.slice(a,b+1).join('\n')+';return{L10N,HOW,ABOUT,TIMEU,BLK,THEMEW,THEMEP,PAT,LI,LANGS}')(()=>null);
  return{lines,a,b,t};
}
// English text for a pattern: /^Hide (.+)$/ → "Hide $1"
export function patText(re){let n=0,s='',src=re.source.replace(/^\^|\$$/g,'');
  for(let i=0;i<src.length;i++){const c=src[i];
    if(c==='\\'){s+=src[++i];continue}
    if(c==='('){let d=1,j=i+1;for(;j<src.length&&d;j++){if(src[j]==='\\')j++;else if(src[j]==='(')d++;else if(src[j]===')')d--}s+='$'+(++n);i=j-1;continue}
    if(c==='?'){continue}s+=c}
  return s}
// placeholders a translation must keep: {n}-style and $1-style
export const marks=s=>[...String(s).matchAll(/\{[a-z]+\}|\$\d/g)].map(m=>m[0]).sort().join(' ');
export const tags=s=>[...String(s).matchAll(/<\/?[a-z][^>]*>/gi)].map(m=>m[0].replace(/\s.*>/,'>')).sort().join(' ');

const BLKEN=['{n} blocks',' in the Nether',' (partial)'],THEMEPEN=['Theme: {v}','Theme: {v}. Click to change.'],UNITEN=['min','s'];
// every string as {key, en, get(lang), set(lang,value)} over the live tables
export function entries(t){const E=[],LI=t.LI;
  const seen=new Map();
  for(const r of t.L10N){const k=r[0];if(!seen.has(k)){seen.set(k,[]);E.push({key:k,en:k,get:l=>{const rs=seen.get(k);return rs[rs.length-1][LI[l]]},set:(l,v)=>seen.get(k).forEach(x=>x[LI[l]]=v)})}seen.get(k).push(r)}
  for(const h in t.HOW)E.push({key:'how: '+h,en:h,get:l=>t.HOW[h][LI[l]-1],set:(l,v)=>t.HOW[h][LI[l]-1]=v});
  E.push({key:'about: about {t} {h}',en:'about {t} {h}',get:l=>t.ABOUT[l],set:(l,v)=>t.ABOUT[l]=v});
  UNITEN.forEach((u,i)=>E.push({key:'time unit: '+u,en:u,get:l=>t.TIMEU[l]?.[i],set:(l,v)=>{t.TIMEU[l]=t.TIMEU[l]||[...UNITEN];t.TIMEU[l][i]=v}}));
  BLKEN.forEach((u,i)=>E.push({key:'blocks: '+u.trim(),en:u,get:l=>t.BLK[l]?.[i],set:(l,v)=>{t.BLK[l]=t.BLK[l]||[...BLKEN];t.BLK[l][i]=v}}));
  for(const w of ['light','dark','follows system'])E.push({key:'theme word: '+w,en:w,get:l=>t.THEMEW[l]?.[w],set:(l,v)=>{(t.THEMEW[l]=t.THEMEW[l]||{})[w]=v}});
  THEMEPEN.forEach((u,i)=>E.push({key:'theme: '+u,en:u,get:l=>t.THEMEP[l]?.[i],set:(l,v)=>{t.THEMEP[l]=t.THEMEP[l]||[...THEMEPEN];t.THEMEP[l][i]=v}}));
  for(const p of t.PAT)if(typeof p[1]!=='function'){const en=patText(p[0]);E.push({key:'pattern: '+en,en,get:l=>p[1][l],set:(l,v)=>p[1][l]=v})}
  return E}
export const langs=t=>Object.keys(t.LI);
export const readJSON=f=>JSON.parse(fs.readFileSync(f,'utf8'));
