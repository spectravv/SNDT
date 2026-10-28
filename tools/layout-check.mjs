// Layout check for the line drawing in src/sndt.html (geom(), lineRuns(), crossings()).
// Renders every map in test-maps/ in headless Chrome and:
//  - compares the drawing with the saved baseline (test-maps/baseline/<map>.svg) and says which lines changed and where
//  - counts sideways jumps (a line's two pieces at a station that neither meet nor turn into one corner)
//  - draws random variations of each map (moved stations, other bend styles, hand-set line orders) and checks nothing breaks
// usage: node tools/layout-check.mjs [--save] [--runs N] [--src path/to/sndt.html]
//   --save   store the current drawings as the new baseline (do this once a change is checked and wanted)
// Rail Map Painter files in test-maps/ are imported the same way as Import > Rail Map Painter.
// Needs google-chrome; rsvg-convert is optional (makes PNGs of changed maps in tools/layout-out/).
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {spawn,spawnSync} from 'node:child_process';

const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const arg=(k,d)=>{const i=process.argv.indexOf(k);return i<0?d:process.argv[i+1]};
const save=process.argv.includes('--save'),runs=+arg('--runs',100),src=path.resolve(arg('--src',path.join(root,'src/sndt.html')));
const maps=fs.readdirSync(path.join(root,'test-maps')).filter(f=>f.endsWith('.json')).sort();
const baseDir=path.join(root,'test-maps/baseline'),outDir=path.join(root,'tools/layout-out');
fs.mkdirSync(baseDir,{recursive:true});fs.mkdirSync(outDir,{recursive:true});

// the app is one closure; expose what the check needs on window.__t
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sndt-layout-'));
let html=fs.readFileSync(src,'utf8');const end=html.lastIndexOf('\n})();');
html=html.slice(0,end)+'\nwindow.__t={get M(){return M},set M(v){M=v},normalize,geom,mapSVG,rmpToSndt,pairs,crossings,cornerAt:typeof cornerAt==="function"?cornerAt:()=>null};'+html.slice(end);
fs.writeFileSync(path.join(tmp,'page.html'),html);

const port=9200+Math.floor(Math.random()*700),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const chrome=spawn('google-chrome',['--headless=new','--no-sandbox',`--remote-debugging-port=${port}`,`--user-data-dir=${path.join(tmp,'profile')}`,'about:blank'],{stdio:'ignore'});
let tabs;for(let i=0;i<60;i++){try{tabs=await(await fetch(`http://127.0.0.1:${port}/json`)).json();if(tabs.length)break}catch{}await sleep(200)}
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pend=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
const run=async expr=>{const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true,timeout:600000});
  if(r.result.exceptionDetails)throw new Error(r.result.exceptionDetails.exception?.description||JSON.stringify(r.result.exceptionDetails));return r.result.result.value};
await send('Page.enable');await send('Page.navigate',{url:'file://'+path.join(tmp,'page.html')});await sleep(2500);

// in the page: load a map, draw it, count jumps and crossings; random variations are seeded so a failure can be repeated
await run(`window.__chk={
  load(m){const T=__t;if(!m.graph){T.M=T.normalize(m);return}
    // an import makes random ids; fix the random numbers so every run draws the same
    const r=Math.random;let s=1;Math.random=()=>(s=(s*1664525+1013904223)>>>0)/4294967296;try{T.M=T.normalize(T.rmpToSndt(m,'test').map)}finally{Math.random=r}},
  draw(){const T=__t,{o,G}=T.mapSVG(false);let jumps=[];
    for(const L of T.M.lines){if(L.hidden)continue;let prev=null;
      for(const [a,b] of T.pairs(L)){const t=G.tracks.get(a<b?a+'~'+b:b+'~'+a);let p=t&&t.off.get(L.id);if(!p||a===b){prev=null;continue}if(a!==t.a)p=p.slice().reverse();
        if(prev){const l=prev[prev.length-1],q=p[0],d=Math.hypot(l.x-q.x,l.y-q.y);if(d>.5&&!(prev.length>1&&p.length>1&&T.cornerAt(prev[prev.length-2],l,q,p[1])))jumps.push({line:L.name,at:(G.st.get(a)||{}).name||a,by:Math.round(d*10)/10})}
        prev=p}}
    return{svg:o,jumps,gaps:[...T.crossings(G).values()].reduce((n,a)=>n+a.length,0)}},
  vary(m,seed){let s=seed>>>0;const rnd=()=>(s=(s*1664525+1013904223)>>>0)/4294967296;const c=JSON.parse(JSON.stringify(m));this.load(c);const M=__t.M,g=M.settings.grid||20;
    for(const st of M.stations)if(rnd()<.3){st.x+=Math.round((rnd()-.5)*4)*g;st.y+=Math.round((rnd()-.5)*4)*g}
    const routes=['oct1','oct2','straight','l1','l2','curve'];for(const L of M.lines)for(let i=0;i+1<L.stops.length;i++)if(rnd()<.2){const a=L.stops[i],b=L.stops[i+1],k=a<b?a+'~'+b:b+'~'+a;if(!(M.segs[k]&&M.segs[k].route==='custom'))M.segs[k]=Object.assign(M.segs[k]||{},{route:routes[Math.floor(rnd()*routes.length)]})}
    for(const st of M.stations){const ls=M.lines.filter(L=>L.stops.includes(st.id)).map(L=>L.id);if(ls.length>1&&rnd()<.15){for(let i=ls.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[ls[i],ls[j]]=[ls[j],ls[i]]}st.laneOrder=ls}}
    const {svg,jumps}=this.draw();return{bad:/NaN|Infinity/.test(svg),jumps:jumps.length}}};true`);

const pathsOf=svg=>[...svg.matchAll(/<path d="([^"]+)"[^>]*?stroke="(#[0-9A-Fa-f]{3,8})"/g)].map(m=>({d:m[1],c:m[2]}));
const box=d=>{const n=[...d.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map(m=>[+m[1],+m[2]]);return n.reduce((b,[x,y])=>[Math.min(b[0],x),Math.min(b[1],y),Math.max(b[2],x),Math.max(b[3],y)],[1e9,1e9,-1e9,-1e9]).map(Math.round)};
const hasRsvg=spawnSync('rsvg-convert',['--version']).status===0;
let problems=0;
for(const f of maps){const name=f.replace(/\.json$/,''),m=JSON.parse(fs.readFileSync(path.join(root,'test-maps',f),'utf8'));
  await run(`__chk.load(${JSON.stringify(m)});true`);const r=await run('__chk.draw()');
  fs.writeFileSync(path.join(outDir,name+'.svg'),r.svg);
  console.log(`\n== ${name}: ${r.jumps.length} sideways jump(s), ${r.gaps} crossing gap(s)`);
  for(const j of r.jumps.slice(0,10))console.log(`   jump: ${j.line} at ${j.at} (${j.by} units)`);
  const bf=path.join(baseDir,name+'.svg'),bmeta=path.join(baseDir,name+'.json');
  if(save){fs.writeFileSync(bf,r.svg);fs.writeFileSync(bmeta,JSON.stringify({jumps:r.jumps.length,gaps:r.gaps}));console.log('   baseline saved');}
  else if(!fs.existsSync(bf))console.log('   no baseline yet (run with --save once the drawing looks right)');
  else{const old=fs.readFileSync(bf,'utf8'),meta=JSON.parse(fs.readFileSync(bmeta,'utf8'));
    if(old===r.svg)console.log('   same as baseline');
    else{const A=pathsOf(old),B=pathsOf(r.svg),ch=[];for(let i=0;i<Math.max(A.length,B.length);i++)if(!A[i]||!B[i]||A[i].d!==B[i].d)ch.push({c:(B[i]||A[i]).c,box:box((B[i]||A[i]).d+' '+((A[i]||B[i]).d))});
      console.log(`   CHANGED: ${ch.length} line path(s) differ from the baseline`);for(const c of ch.slice(0,10))console.log(`   - colour ${c.c} around x ${c.box[0]}..${c.box[2]}, y ${c.box[1]}..${c.box[3]}`);
      if(hasRsvg){const wrap=s=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="1600"><rect x="-1e5" y="-1e5" width="2e5" height="2e5" fill="#fbfcfa"/>${s}</svg>`,all=box(B.concat(A).map(p=>p.d).join(' ')),vb=`${all[0]-60} ${all[1]-60} ${all[2]-all[0]+120} ${all[3]-all[1]+120}`;
        for(const [k,s] of [['before',old],['after',r.svg]]){fs.writeFileSync(path.join(tmp,k+'.svg'),wrap(s));spawnSync('rsvg-convert',[path.join(tmp,k+'.svg'),'-o',path.join(outDir,`${name}-${k}.png`)])}
        console.log(`   pictures: tools/layout-out/${name}-before.png and -after.png`)}}
    if(r.jumps.length>meta.jumps){problems++;console.log(`   WORSE: sideways jumps went from ${meta.jumps} to ${r.jumps.length}`)}}
  let bad=0,jumps=0;for(let k=1;k<=runs;k++){let v;try{v=await run(`__chk.vary(${JSON.stringify(m)},${k})`)}catch(e){v={bad:true,err:String(e).slice(0,200)}}
    if(v.bad){bad++;if(bad<=3)console.log(`   variation ${k} BROKE${v.err?': '+v.err:' (NaN in the drawing)'}`)}jumps+=v.jumps||0}
  if(runs)console.log(`   ${runs} random variations: ${bad?bad+' broke':'all drew fine'}, ${(jumps/runs).toFixed(1)} sideways jumps on average`);problems+=bad}
ws.close();chrome.kill();await sleep(300);try{fs.rmSync(tmp,{recursive:true,force:true})}catch{}
console.log(problems?`\n${problems} problem(s) found`:'\nNo problems found');process.exit(problems?1:0);
