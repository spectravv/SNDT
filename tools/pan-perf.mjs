// Pan smoothness check: loads a big test map (optionally copied N times side by side), drags the map with the
// middle mouse button through real CDP input, and reports frame times plus script/layout/style time per drag.
// usage: node tools/pan-perf.mjs [--src path/to/sndt.html] [--map test-maps/rmp-tung-sha.json] [--copies 3] [--select]
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {spawn,spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i>0?process.argv[i+1]:d};
const srcIn=arg('--src',path.join(root,'src/sndt.html')),mapIn=arg('--map',path.join(root,'test-maps/rmp-tung-sha.json')),copies=+arg('--copies',3),selAll=process.argv.includes('--select');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sndt-pan-'));
const built=path.join(tmp,'built.html'),b=spawnSync('python3',[path.join(root,'scripts/build.py'),srcIn,built],{encoding:'utf8'});
if(b.status!==0){console.error(b.stderr);process.exit(2)}
let html=fs.readFileSync(built,'utf8');const end=html.lastIndexOf('\n})();');
html=html.slice(0,end)+'\nwindow.__t={get M(){return M},normalize,rmpToSndt,loadInto,select,setTool,get view(){return view}};'+html.slice(end);
fs.writeFileSync(path.join(tmp,'page.html'),html);
const port=9200+Math.floor(Math.random()*700),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const chrome=spawn('google-chrome',['--headless=new','--no-sandbox',`--remote-debugging-port=${port}`,`--user-data-dir=${path.join(tmp,'profile')}`,'about:blank'],{stdio:'ignore'});
let tabs;for(let i=0;i<60;i++){try{tabs=await(await fetch(`http://127.0.0.1:${port}/json`)).json();if(tabs.length)break}catch{}await sleep(200)}
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pend=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
const run=async expr=>{const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});if(r.result.exceptionDetails)throw new Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value};
await send('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
await send('Page.enable');await send('Performance.enable');await send('Page.navigate',{url:'file://'+path.join(tmp,'page.html')});await sleep(2500);
await run(`document.querySelectorAll('.tour-card button').forEach(b=>/skip/i.test(b.textContent)&&b.click())`);
const raw=fs.readFileSync(mapIn,'utf8');
const info=await run(`(()=>{let m=JSON.parse(${JSON.stringify(raw)});if(m.graph)m=__t.rmpToSndt(m,'perf').map;m=__t.normalize(m);
  const xs=m.stations.map(s=>s.x),w=Math.max(...xs)-Math.min(...xs)+200,base=JSON.parse(JSON.stringify(m));
  for(let c=1;c<${copies};c++){const b=JSON.parse(JSON.stringify(base)),map=new Map();const re=id=>map.get(id)||id;
    b.stations.forEach(s=>{const n=s.id+'_c'+c;map.set(s.id,n);s.id=n;s.x+=w*c});
    b.lines.forEach(L=>{L.id+='_c'+c;L.stops=L.stops.map(re);if(L.segs){const o={};for(const k in L.segs)o[k.split('~').map(re).join('~')]=L.segs[k];L.segs=o}});
    const sg={};for(const k in b.segs||{}){const v=b.segs[k];if(v.pts)v.pts.forEach(p=>p.x+=w*c);sg[k.split('~').map(re).join('~')]=v}
    m.stations.push(...b.stations);m.lines.push(...b.lines);m.segs=Object.assign(m.segs||{},sg);
    (b.texts||[]).forEach(t=>{t.id+='_c'+c;t.x+=w*c;m.texts.push(t)})}
  __t.loadInto(m,'perf');return new Promise(r=>setTimeout(()=>r({stations:m.stations.length,lines:m.lines.length,nodes:document.querySelectorAll('#vp *').length}),800))})()`);
if(selAll)await run(`__t.select(__t.M.stations.slice(0,40).map(s=>({t:'station',id:s.id})));0`);
await sleep(500);
const shot=arg('--shot');if(shot){
  await run(`(()=>{const v=__t.view,s=__t.M.stations[120],r=document.getElementById('map').getBoundingClientRect();v.k=1.5;v.x=r.width/2-s.x*v.k;v.y=r.height/2-s.y*v.k})()`);await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:900,y:500,deltaX:0,deltaY:-1});
  await run(`new Promise(r=>setTimeout(r,400))`);
  const before=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(shot.replace('.png','-before.png'),Buffer.from(before.result.data,'base64'));
  await run(`(()=>{const st=window.setTimeout;window.setTimeout=(f,ms,...a)=>ms===150?0:st(f,ms,...a)})()`);
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:800,y:500,button:'middle',buttons:4,clickCount:1});
  for(let i=1;i<=20;i++){await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:800-i*35,y:500-i*20,button:'middle',buttons:4});await sleep(16)}
  await sleep(300);const im=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(shot,Buffer.from(im.result.data,'base64'));
  console.log('mid-pan css transform:',await run(`document.getElementById('map').style.transform`));chrome.kill();process.exit(0)}
const metrics=async()=>Object.fromEntries((await send('Performance.getMetrics')).result.metrics.map(m=>[m.name,m.value]));
await run(`window.__fr=[];window.__on=true;(function f(t){if(window.__on){__fr.push(t);requestAnimationFrame(f)}})(performance.now());0`);
const m0=await metrics();
const cx=800,cy=500,N=120;
await send('Input.dispatchMouseEvent',{type:'mousePressed',x:cx,y:cy,button:'middle',buttons:4,clickCount:1});
for(let i=1;i<=N;i++){const x=cx+Math.sin(i/12)*300,y=cy+Math.cos(i/15)*200;
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y,button:'middle',buttons:4});await sleep(8)}
await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:cx,y:cy,button:'middle',buttons:0,clickCount:1});
const m1=await metrics();
const fr=await run(`(window.__on=false,__fr.slice(1).map((t,i)=>t-__fr[i]))`);
fr.sort((a,b)=>a-b);const pct=p=>fr[Math.min(fr.length-1,Math.floor(fr.length*p))].toFixed(1);
const ms=k=>((m1[k]-m0[k])*1000).toFixed(0);
console.log(`map: ${path.basename(mapIn)} x${copies}  ${info.stations} stations, ${info.lines} lines, ${info.nodes} svg nodes${selAll?', 40 selected':''}`);
console.log(`frames ${fr.length}  median ${pct(.5)}ms  p90 ${pct(.9)}ms  max ${fr[fr.length-1].toFixed(1)}ms  over 33ms: ${fr.filter(x=>x>33).length}`);
console.log(`script ${ms('ScriptDuration')}ms  layout ${ms('LayoutDuration')}ms  style ${ms('RecalcStyleDuration')}ms  task ${ms('TaskDuration')}ms over ${N} moves`);
chrome.kill();process.exit(0);
