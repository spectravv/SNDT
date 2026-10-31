// Real mouse drag test in Free placement: drags one station to 2px off another's X and checks it snaps.
// usage: node tools/drag-test.mjs <repo root> <out.png>
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {spawn,spawnSync} from 'node:child_process';
const root=process.argv[2],out=process.argv[3];
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sndt-dr-'));const built=path.join(tmp,'b.html');
const b=spawnSync('python3',[path.join(root,'scripts/build.py'),path.join(root,'src/sndt.html'),built],{encoding:'utf8'});if(b.status)throw b.stderr;
let html=fs.readFileSync(built,'utf8');const end=html.lastIndexOf('\n})();');
html=html.slice(0,end)+'\nwindow.__t={get M(){return M},get view(){return view},render,act,select};'+html.slice(end);fs.writeFileSync(path.join(tmp,'page.html'),html);
const port=9200+Math.floor(Math.random()*700),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const chrome=spawn('google-chrome',['--headless=new','--no-sandbox',`--remote-debugging-port=${port}`,`--user-data-dir=${path.join(tmp,'p')}`,'about:blank'],{stdio:'ignore'});
let tabs;for(let i=0;i<60;i++){try{tabs=await(await fetch(`http://127.0.0.1:${port}/json`)).json();if(tabs.length)break}catch{}await sleep(200)}
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pend=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
const run=async expr=>{const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});if(r.result.exceptionDetails)throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0,600));return r.result.result.value};
await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'file://'+path.join(tmp,'page.html')});await sleep(2500);
await run(`document.querySelectorAll('.tour-card button').forEach(b=>/skip/i.test(b.textContent)&&b.click());document.querySelector('#plFree').click();0`);await sleep(300);
// pick two stations: A to drag, B to align with; screen coords of each
const info=await run(`(()=>{const M=__t.M,v=__t.view,r=document.getElementById('map').getBoundingClientRect(),st=M.stations.filter(s=>s.kind!=='waypoint');
  let A=null,B=null;for(const a of st)for(const b of st){if(a===b)continue;const dx=Math.abs(a.x-b.x),dy=Math.abs(a.y-b.y);if(dx>40&&dy>60&&dy<200&&(!A||dx<Math.abs(A.x-B.x))){A=a;B=b}}
  const sc=p=>({x:r.left+v.x+p.x*v.k,y:r.top+v.y+p.y*v.k});return{place:M.settings.place,A:{id:A.id,name:A.name,x:A.x,y:A.y,...{s:sc(A)}},B:{name:B.name,x:B.x,y:B.y,s:sc(B)},k:v.k}})()`);
console.log(JSON.stringify(info));
const {A,B}=info,tx=B.s.x+2,ty=A.s.y+15;
await send('Input.dispatchMouseEvent',{type:'mousePressed',x:A.s.x,y:A.s.y,button:'left',buttons:1,clickCount:1});
for(let i=1;i<=12;i++){await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:A.s.x+(tx-A.s.x)*i/12,y:A.s.y+(ty-A.s.y)*i/12,button:'left',buttons:1});await sleep(20)}
await sleep(200);const sh=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(out,Buffer.from(sh.result.data,'base64'));
await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:tx,y:ty,button:'left',buttons:0,clickCount:1});await sleep(300);
console.log(JSON.stringify(await run(`(()=>{const a=__t.M.stations.find(s=>s.id===${JSON.stringify(A.id)});return{Ax:a.x,Ay:a.y,Bx:${B.x}}})()`)));
ws.close();chrome.kill();
