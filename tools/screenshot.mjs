// usage: node shot.mjs url out.png width height dpr transparent(0/1) [jsBeforeShot] [waitMs]
const [,, url, out, W='1440', H='900', dpr='2', tr='0', js='', wait='2500'] = process.argv;
const { spawn } = await import('node:child_process'); const fs = await import('node:fs');
const port = 9100 + Math.floor(Math.random()*800);
const dir=(await import('node:os')).tmpdir()+`/sndt-shot-${port}`;
const chrome = spawn('google-chrome',['--headless=new','--no-sandbox','--hide-scrollbars',`--remote-debugging-port=${port}`,`--user-data-dir=${dir}`,'about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let tabs;for(let i=0;i<50;i++){try{tabs=await(await fetch(`http://127.0.0.1:${port}/json`)).json();if(tabs.length)break}catch{}await sleep(200)}
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pend=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:+W,height:+H,deviceScaleFactor:+dpr,mobile:false});
if(tr==='1')await send('Emulation.setDefaultBackgroundColorOverride',{color:{r:0,g:0,b:0,a:0}});
await send('Page.navigate',{url});await sleep(+wait);
if(js){const r=await send('Runtime.evaluate',{expression:js,awaitPromise:true,returnByValue:true});if(r.result.exceptionDetails)console.log('JS error',JSON.stringify(r.result.exceptionDetails).slice(0,300))}
await sleep(400);
const sh=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});fs.writeFileSync(out,Buffer.from(sh.result.data,'base64'));
ws.close();chrome.kill();await sleep(500);try{fs.rmSync(dir,{recursive:true,force:true})}catch{}
console.log('saved',out);
