const [,, url, expr, shot, wait='3000'] = process.argv;
const { spawn } = await import('node:child_process'); const fs = await import('node:fs');
const port = 9400 + Math.floor(Math.random()*400);
const dir=(await import('node:os')).tmpdir()+`/sndt-cdp-${port}`;
const chrome = spawn('google-chrome',['--headless=new','--no-sandbox',`--remote-debugging-port=${port}`,`--user-data-dir=${dir}`,'--window-size=1440,900','about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let tabs;for(let i=0;i<50;i++){try{tabs=await(await fetch(`http://127.0.0.1:${port}/json`)).json();if(tabs.length)break}catch{}await sleep(200)}
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pend=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
await send('Page.navigate',{url});await sleep(+wait);
const r=await send('Runtime.evaluate',{expression:expr,awaitPromise:true,returnByValue:true,timeout:600000});
console.log(JSON.stringify(r.result.result?.value ?? r.result.exceptionDetails ?? r.result));
if(shot&&shot!=='-'){const sh=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(shot,Buffer.from(sh.result.data,'base64'))}
ws.close();chrome.kill();fs.rmSync(dir,{recursive:true,force:true});
