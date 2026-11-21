// Drag smoothness check: builds a synthetic network (or loads --map), drags one interchange station with the left mouse
// button through real CDP input, and reports frame times plus where the time goes inside render() per frame:
// geom(), the rest of mapSVG() (building the SVG string), the #content innerHTML swap, and the browser's own
// style/layout work afterwards.
// usage: node tools/drag-perf.mjs [--src path/to/sndt.html] [--map some-map.json] [--size 20] [--moves 90]
//   --size N   synthetic grid of N x N*0.75 stations with crossing, bundled and diagonal lines (ignored with --map)
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {spawn,spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const arg=(n,d)=>{const i=process.argv.indexOf(n);return i>0?process.argv[i+1]:d};
const srcIn=arg('--src',path.join(root,'src/sndt.html')),mapIn=arg('--map',null),size=+arg('--size',20),N=+arg('--moves',90);
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sndt-drag-'));
const built=path.join(tmp,'built.html'),b=spawnSync('python3',[path.join(root,'scripts/build.py'),srcIn,built],{encoding:'utf8'});
if(b.status!==0){console.error(b.stderr);process.exit(2)}
let html=fs.readFileSync(built,'utf8');const end=html.lastIndexOf('\n})();');
// timing hooks: function declarations inside the app's closure can be rebound from code injected into the same closure
const hook=`
window.__p={geom:0,mapSVG:0,render:0,html:0,frames:0,on:false};
{const wrap=(name,f)=>function(){if(!__p.on)return f.apply(this,arguments);const t=performance.now();try{return f.apply(this,arguments)}finally{__p[name]+=performance.now()-t}};
 geom=wrap('geom',geom);mapSVG=wrap('mapSVG',mapSVG);
 const r0=render;render=function(){if(__p.on)__p.frames++;return wrap('render',r0).apply(this,arguments)};
 const d=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
 window.__hookContent=()=>{const el=document.getElementById('content');if(!el||el.__hooked)return;el.__hooked=true;
   Object.defineProperty(el,'innerHTML',{get(){return d.get.call(this)},set(v){const t=performance.now();d.set.call(this,v);if(__p.on)__p.html+=performance.now()-t}})};}
window.__t={get M(){return M},normalize,loadInto,setTool,get view(){return view}};`;
html=html.slice(0,end)+'\n'+hook+html.slice(end);
fs.writeFileSync(path.join(tmp,'page.html'),html);
const port=9200+Math.floor(Math.random()*700),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const chrome=spawn('google-chrome',['--headless=new','--no-sandbox',`--remote-debugging-port=${port}`,`--user-data-dir=${path.join(tmp,'profile')}`,'about:blank'],{stdio:'ignore'});
let tabs;for(let i=0;i<60;i++){try{tabs=await(await fetch(`http://127.0.0.1:${port}/json`)).json();if(tabs.length)break}catch{}await sleep(200)}
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pend=new Map(),trace=[];let traceDone=null;ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.method==='Tracing.dataCollected')trace.push(...m.params.value);if(m.method==='Tracing.tracingComplete'&&traceDone)traceDone();if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
const run=async expr=>{const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});if(r.result.exceptionDetails)throw new Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value};
await send('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
await send('Page.enable');await send('Performance.enable');await send('Page.navigate',{url:'file://'+path.join(tmp,'page.html')});await sleep(2500);
await run(`document.querySelectorAll('.tour-card button').forEach(b=>/skip/i.test(b.textContent)&&b.click())`);
const raw=mapIn?fs.readFileSync(mapIn,'utf8'):'null';
const info=await run(`(()=>{let m=${raw};
  if(!m){// synthetic network: a grid of stations; horizontal and vertical lines, pairs of lines sharing runs (bundles), diagonals
    const W=${size},H=Math.max(4,Math.round(W*.75)),sp=80,st=[],lines=[],id=(x,y)=>'s'+x+'_'+y,cols=['#e4002b','#0072bc','#2f9e44','#f08c00','#7048e8','#c2255c','#1098ad','#5c940d'];
    for(let y=0;y<H;y++)for(let x=0;x<W;x++)st.push({id:id(x,y),name:'Station '+x+'-'+y,x:x*sp,y:y*sp,kind:'stop',label:'auto'});
    let n=0;const add=stops=>lines.push({id:'L'+(n++),name:'Line '+n,color:cols[n%cols.length],stops});
    for(let y=0;y<H;y+=2){const r=[];for(let x=0;x<W;x++)r.push(id(x,y));add(r);add(r.slice(0,Math.ceil(W*.6)))}
    for(let x=0;x<W;x+=2){const c=[];for(let y=0;y<H;y++)c.push(id(x,y));add(c)}
    for(let k=0;k<W-H;k+=3){const d=[];for(let i=0;i<H;i++)d.push(id(k+i,i));add(d)}
    m={name:'drag perf',stations:st,lines,texts:[],regions:[],transfers:[]}}
  m=__t.normalize(m);__t.loadInto(m,'perf');__hookContent();
  return new Promise(r=>setTimeout(()=>r({stations:m.stations.length,lines:m.lines.length,nodes:document.querySelectorAll('#vp *').length}),800))})()`);
// pick the station served by the most lines, centre the view on it, and find it on screen
const at=await run(`(()=>{const M=__t.M,cnt=new Map();M.lines.forEach(L=>L.stops.forEach(s=>cnt.set(s,(cnt.get(s)||0)+1)));
  const s=M.stations.slice().sort((a,b)=>(cnt.get(b.id)||0)-(cnt.get(a.id)||0))[0],v=__t.view,r=document.getElementById('map').getBoundingClientRect();
  v.k=1;v.x=r.width/2-s.x;v.y=r.height/2-s.y;__t.setTool('select');window.dispatchEvent(new Event('resize'));
  return {x:r.left+r.width/2,y:r.top+r.height/2,lines:cnt.get(s.id)||0,name:s.name}})()`);
await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:5,y:5,deltaX:0,deltaY:0});await sleep(600);
const metrics=async()=>Object.fromEntries((await send('Performance.getMetrics')).result.metrics.map(m=>[m.name,m.value]));
if(process.argv.includes('--no-will-change'))await run(`['map','under'].forEach(i=>document.getElementById(i).style.willChange='auto');0`);
const before=await run(`JSON.stringify(__t.M.stations.find(s=>s.name===${JSON.stringify(at.name)}))`);
await run(`window.__fr=[];window.__on=true;(function f(t){if(window.__on){__fr.push(t);requestAnimationFrame(f)}})(performance.now());0`);
await send('Input.dispatchMouseEvent',{type:'mousePressed',x:at.x,y:at.y,button:'left',buttons:1,clickCount:1});
const doTrace=process.argv.includes('--trace');if(doTrace)await send('Tracing.start',{categories:'devtools.timeline,disabled-by-default-devtools.timeline'});
await run(`__p.on=true;0`);const m0=await metrics();
for(let i=1;i<=N;i++){const x=at.x+Math.sin(i/10)*160,y=at.y+Math.cos(i/13)*110-110;
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y,button:'left',buttons:1});await sleep(8)}
await sleep(100);const m1=await metrics();await run(`__p.on=false;0`);
let traceTop=null;if(doTrace){await new Promise(r=>{traceDone=r;send('Tracing.end')});const sum=new Map();
  for(const e of trace)if(e.ph==='X'&&e.dur&&/^(Paint|PaintImage|RasterTask|Layout|UpdateLayoutTree|PrePaint|Layerize|HitTest|FunctionCall|EventDispatch|ParseHTML|Commit|UpdateLayer|CompositeLayers)$/.test(e.name))sum.set(e.name,(sum.get(e.name)||0)+e.dur/1000);
  traceTop=[...sum].sort((a,b)=>b[1]-a[1]).slice(0,8)}
await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:at.x,y:at.y-110,button:'left',buttons:0,clickCount:1});await sleep(300);
const after=await run(`JSON.stringify(__t.M.stations.find(s=>s.name===${JSON.stringify(at.name)}))`);
const p=await run(`__p`);
const fr=await run(`(window.__on=false,__fr.slice(1).map((t,i)=>t-__fr[i]))`);
fr.sort((a,b)=>a-b);const pct=q=>fr[Math.min(fr.length-1,Math.floor(fr.length*q))].toFixed(1);
const ms=k=>(m1[k]-m0[k])*1000,per=v=>(v/Math.max(1,p.frames)).toFixed(1);
console.log(`map: ${mapIn?path.basename(mapIn):'synthetic '+size}  ${info.stations} stations, ${info.lines} lines, ${info.nodes} svg nodes; dragged "${at.name}" (${at.lines} lines)${before===after?'  WARNING: the station did not move':''}`);
console.log(`frames ${fr.length}  median ${pct(.5)}ms  p90 ${pct(.9)}ms  max ${fr[fr.length-1].toFixed(1)}ms  over 33ms: ${fr.filter(x=>x>33).length}`);
console.log(`renders ${p.frames}; per render: total ${per(p.render)}ms = geom ${per(p.geom)} + SVG string ${per(p.mapSVG-p.geom)} + innerHTML ${per(p.html)} + other ${per(p.render-p.mapSVG-p.html)}`);
console.log(`browser after render, per render: style ${per(ms('RecalcStyleDuration'))}ms  layout ${per(ms('LayoutDuration'))}ms  (all script ${per(ms('ScriptDuration'))}ms, all tasks ${per(ms('TaskDuration'))}ms)`);
if(traceTop)console.log('trace, per render: '+traceTop.map(([k,v])=>k+' '+per(v)+'ms').join('  '));
chrome.kill();process.exit(0);
