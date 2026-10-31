// Headless check: builds src/sndt.html, loads a map (SNDT JSON or Rail Map Painter), runs JS, saves an exported PNG and a screenshot (<out>-ui.png).
// usage: node tools/eval-shot.mjs <repo root> <map.json> <out.png> "<js>"   (prefix the js with tools/focus.js to zoom the editor: __focus(x,y,k))

import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {spawn,spawnSync} from 'node:child_process';
const [,,root,mapIn,out,js]=process.argv;
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sndt-ev-'));const built=path.join(tmp,'b.html');
const b=spawnSync('python3',[path.join(root,'scripts/build.py'),path.join(root,'src/sndt.html'),built],{encoding:'utf8'});if(b.status)throw b.stderr;
let html=fs.readFileSync(built,'utf8');const end=html.lastIndexOf('\n})();');
html=html.slice(0,end)+'\nwindow.__t={get M(){return M},get view(){return view},get sel(){return sel},act:typeof act!=="undefined"?act:null,geom,normalize,rmpToSndt,loadInto,exportSVG,render,mapSVG,legendSVG,select,applyStyleSet:typeof applyStyleSet!=="undefined"?applyStyleSet:null,renderInspector:typeof renderInsp!=="undefined"?renderInsp:null};'+html.slice(end);
fs.writeFileSync(path.join(tmp,'page.html'),html);
const port=9200+Math.floor(Math.random()*700),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const chrome=spawn('google-chrome',['--headless=new','--no-sandbox',`--remote-debugging-port=${port}`,`--user-data-dir=${path.join(tmp,'p')}`,'about:blank'],{stdio:'ignore'});
let tabs;for(let i=0;i<60;i++){try{tabs=await(await fetch(`http://127.0.0.1:${port}/json`)).json();if(tabs.length)break}catch{}await sleep(200)}
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pend=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
const run=async expr=>{const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true,awaitPromise:true});if(r.result.exceptionDetails)throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0,800));return r.result.result.value};
await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url:'file://'+path.join(tmp,'page.html')});await sleep(2500);
await run(`document.querySelectorAll('.tour-card button').forEach(b=>/skip/i.test(b.textContent)&&b.click());{let m=JSON.parse(${JSON.stringify(fs.readFileSync(mapIn,"utf8"))});if(m.graph)m=__t.rmpToSndt(m,"t").map;__t.loadInto(__t.normalize(m),"t")};0`);await sleep(500);
console.log(JSON.stringify(await run(js)));
const u=await run(`(async()=>{__t.render();await document.fonts.ready;const {svg,w,h}=__t.exportSVG(true);const img=new Image();await new Promise((r,j)=>{img.onload=r;img.onerror=j;img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)});
 const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0);return c.toDataURL()})()`);
fs.writeFileSync(out,Buffer.from(u.split(',')[1],'base64'));
const sh=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(out.replace('.png','-ui.png'),Buffer.from(sh.result.data,'base64'));
ws.close();chrome.kill();
