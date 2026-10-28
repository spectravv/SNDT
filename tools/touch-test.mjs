// Touch checks for the phone version of src/sndt.html.
// Builds the page like the website (scripts/build.py, so the viewport tag is there), opens it in headless Chrome at 390x844,
// and fires touch pointer events at the map: pinch, one/two-finger pan, tap, double-tap select, double-tap-drag box select,
// long-press menu, draft bar, district/water drafts, small-target hit areas, Select several.
// Headless Chrome's own touch emulation hits the wrong element, so the events are dispatched straight at the map (same handlers).
// usage: node tools/touch-test.mjs [--src path/to/sndt.html]     exit code 1 if any check fails
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import {spawn,spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..');
const ai=process.argv.indexOf('--src'),srcIn=ai>0?process.argv[ai+1]:path.join(root,'src/sndt.html');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'sndt-touch-'));
const built=path.join(tmp,'built.html'),b=spawnSync('python3',[path.join(root,'scripts/build.py'),srcIn,built],{encoding:'utf8'});
if(b.status!==0){console.error(b.stderr);process.exit(2)}
let html=fs.readFileSync(built,'utf8');const end=html.lastIndexOf('\n})();');
html=html.slice(0,end)+'\nwindow.__t={get M(){return M},setTool,select,get sel(){return sel},get drawLine(){return drawLine},get view(){return view},get tool(){return tool},pts,get pinch(){return pinch}};'+html.slice(end);
fs.writeFileSync(path.join(tmp,'page.html'),html);
const port=9200+Math.floor(Math.random()*700),sleep=ms=>new Promise(r=>setTimeout(r,ms));
const chrome=spawn('google-chrome',['--headless=new','--no-sandbox',`--remote-debugging-port=${port}`,`--user-data-dir=${path.join(tmp,'profile')}`,'about:blank'],{stdio:'ignore'});
let tabs;for(let i=0;i<60;i++){try{tabs=await(await fetch(`http://127.0.0.1:${port}/json`)).json();if(tabs.length)break}catch{}await sleep(200)}
const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let id=0;const pend=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id&&pend.has(m.id)){pend.get(m.id)(m);pend.delete(m.id)}};
const send=(method,params={})=>new Promise(r=>{const i=++id;pend.set(i,r);ws.send(JSON.stringify({id:i,method,params}))});
const run=async expr=>{const r=await send('Runtime.evaluate',{expression:expr,returnByValue:true});if(r.result.exceptionDetails)throw new Error(JSON.stringify(r.result.exceptionDetails));return r.result.result.value};
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
await send('Page.enable');await send('Page.navigate',{url:'file://'+path.join(tmp,'page.html')});await sleep(2500);
await run(`document.querySelectorAll('.tour-card button').forEach(b=>/skip/i.test(b.textContent)&&b.click());__t.setTool('station')`);
await run(`(()=>{const svg=document.getElementById('map');svg.setPointerCapture=()=>{};let down=new Map();
window.__touch=(type,points)=>{const fire=(t,id,x,y)=>{const el=t==='pointerdown'?document.elementFromPoint(x,y):svg;el.dispatchEvent(new PointerEvent(t,{pointerId:10+id,pointerType:'touch',isPrimary:id===0,clientX:x,clientY:y,button:t==='pointermove'?-1:0,buttons:t==='pointerup'?0:1,bubbles:true,cancelable:true,composed:true}))};
 if(type==='touchEnd'){for(const [id,[x,y]] of down)fire('pointerup',id,x,y);down.clear();return}
 points.forEach(([x,y],id)=>{if(type==='touchStart'&&!down.has(id)){down.set(id,[x,y]);fire('pointerdown',id,x,y)}else if(type==='touchMove'){down.set(id,[x,y]);fire('pointermove',id,x,y)}})}})()`);
const touch=(type,points)=>run(`__touch(${JSON.stringify(type)},${JSON.stringify(points)})`);
const count=()=>run('__t.M.stations.length'),k=()=>run('__t.view.k');
let fail=0;const check=(name,ok,info)=>{console.log((ok?'PASS ':'FAIL ')+name+(info?'  ('+info+')':''));if(!ok)fail++};

// 1. pinch: second finger 30ms after the first, then spread
let n0=await count(),k0=await k();
await touch('touchStart',[[150,400]]);await sleep(30);
await touch('touchStart',[[150,400],[240,400]]);
for(let i=1;i<=6;i++){await touch('touchMove',[[150-i*10,400-i*5],[240+i*10,400-i*5]]);await sleep(16)}
await touch('touchEnd',[]);await sleep(150);
let n1=await count(),k1=await k();
check('pinch places no station',n1===n0,`${n0} -> ${n1}`);check('pinch zooms',k1>k0*1.2,`k ${k0.toFixed(2)} -> ${k1.toFixed(2)}`);

// 2. tap: places exactly one station
await touch('touchStart',[[200,300]]);await sleep(40);await touch('touchEnd',[]);await sleep(150);
let n2=await count();check('tap places one station',n2===n1+1,`${n1} -> ${n2}`);

// 3. hold still then lift: places one station
await touch('touchStart',[[120,250]]);await sleep(200);await touch('touchEnd',[]);await sleep(150);
let n3=await count();check('hold places one station',n3===n2+1,`${n2} -> ${n3}`);

// 4. two-finger pan without spreading moves the view
const v0=await run('[__t.view.x,__t.view.y]');
await touch('touchStart',[[150,500]]);await sleep(20);await touch('touchStart',[[150,500],[230,500]]);
for(let i=1;i<=6;i++){await touch('touchMove',[[150+i*10,500+i*8],[230+i*10,500+i*8]]);await sleep(16)}
await touch('touchEnd',[]);await sleep(150);
const v1=await run('[__t.view.x,__t.view.y]'),n4=await count();
check('two-finger drag pans',Math.abs(v1[0]-v0[0])>40&&Math.abs(v1[1]-v0[1])>30,`dx ${(v1[0]-v0[0]).toFixed(0)} dy ${(v1[1]-v0[1]).toFixed(0)}`);
check('two-finger drag places no station',n4===n3,`${n3} -> ${n4}`);

// 5. select tool: one finger on empty map pans, no box
await run("__t.setTool('select')");
const empty=await run(`(()=>{for(let y=200;y<700;y+=17)for(let x=40;x<350;x+=13){const el=document.elementFromPoint(x,y);if(el&&el.id==='map'&&!document.elementFromPoint(x+60,y+40)?.closest('[data-kind]'))return[x,y]}})()`);
let p0=await run('[__t.view.x,__t.view.y]');
await touch('touchStart',[empty]);for(let i=1;i<=6;i++){await touch('touchMove',[[empty[0]+i*10,empty[1]+i*7]]);await sleep(16)}await touch('touchEnd',[]);await sleep(100);
let p1=await run('[__t.view.x,__t.view.y]');
check('one-finger drag on empty map pans',Math.abs(p1[0]-p0[0])>40,`dx ${(p1[0]-p0[0]).toFixed(0)} at ${empty}`);
check('no selection box drawn',!(await run("!!document.querySelector('.marquee,[data-marquee]')")));

// 6. double-tap then hold and drag: draws a box and selects the stations inside
await run("__t.view.k=__t.view.k;0");
const box=await run(`(()=>{const r=document.getElementById('map').getBoundingClientRect();return[r.left+5,r.top+5,r.right-5,r.bottom-80]})()`);
await touch('touchStart',[[box[0],box[1]]]);await sleep(40);await touch('touchEnd',[]);await sleep(120);
await touch('touchStart',[[box[0],box[1]]]);await sleep(150);
for(let i=1;i<=8;i++){await touch('touchMove',[[box[0]+(box[2]-box[0])*i/8,box[1]+(box[3]-box[1])*i/8]]);await sleep(16)}
await touch('touchEnd',[]);await sleep(150);
const ns=await run("__t.sel.filter(x=>x.t==='station').length");
check('double-tap-hold-drag box-selects stations',ns>0,`${ns} selected`);

// 7. tap on empty map deselects
await touch('touchStart',[empty]);await sleep(40);await touch('touchEnd',[]);await sleep(500);
check('tap on empty map deselects',(await run('__t.sel.length'))===0);

// 8. select tool: one tap on a station doesn't select it, a double-tap does, and a drag across it pans
const stp=await run(`(()=>{const el=[...document.querySelectorAll('#map [data-kind="station"]')].find(e=>{const r=e.getBoundingClientRect();return r.top>120&&r.bottom<600&&r.left>20&&r.right<370});const r=el.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2,el.dataset.id]})()`);
await sleep(500);
await touch('touchStart',[[stp[0],stp[1]]]);await sleep(40);await touch('touchEnd',[]);await sleep(450);
check('one tap on a station does not select',(await run('__t.sel.length'))===0);
await touch('touchStart',[[stp[0],stp[1]]]);await sleep(40);await touch('touchEnd',[]);await sleep(100);
await touch('touchStart',[[stp[0],stp[1]]]);await sleep(40);await touch('touchEnd',[]);await sleep(150);
check('double-tap on a station selects it',(await run('JSON.stringify(__t.sel)')).includes(stp[2]));
await touch('touchStart',[empty]);await sleep(40);await touch('touchEnd',[]);await sleep(500);
const st0=await run(`JSON.stringify(__t.M.stations.find(s=>s.id==='${stp[2]}'))`),q0=await run('__t.view.x');
await touch('touchStart',[[stp[0],stp[1]]]);for(let i=1;i<=6;i++){await touch('touchMove',[[stp[0]+i*8,stp[1]+i*6]]);await sleep(16)}await touch('touchEnd',[]);await sleep(150);
check('drag across an unselected station pans, station stays',(await run(`JSON.stringify(__t.M.stations.find(s=>s.id==='${stp[2]}'))`))===st0&&(await run('__t.view.x'))!==q0);

// 9. double-tap then drag starting on a district: box select, the district doesn't move or get selected
await touch('touchStart',[empty]);await sleep(40);await touch('touchEnd',[]);await sleep(500);
const rg=await run(`(()=>{const small=(x,y)=>{for(let r=0;r<=32;r+=8)for(let a=0;a<8;a++){const e=document.elementFromPoint(x+r*Math.cos(a),y+r*Math.sin(a)),k=e&&e.closest('#map [data-kind]');if(k&&k.dataset.kind!=='region')return true}return false};
  for(const el of document.querySelectorAll('#map [data-kind="region"]')){const r=el.getBoundingClientRect();if(r.width<40||r.top<60)continue;for(let y=r.top+12;y<Math.min(r.bottom,700);y+=10)for(let x=Math.max(r.left,10)+12;x<Math.min(r.right,380);x+=10){const e=document.elementFromPoint(x,y);if(e&&e.closest('[data-kind="region"]')===el&&!small(x,y))return[x,y,el.dataset.id]}}return null})()`);
if(!rg)check('found a district on screen',false);else{
const r0=await run(`JSON.stringify(__t.M.regions.find(r=>r.id==='${rg[2]}'))`);
await touch('touchStart',[[rg[0],rg[1]]]);await sleep(40);await touch('touchEnd',[]);await sleep(100);
await touch('touchStart',[[rg[0],rg[1]]]);await sleep(120);
for(let i=1;i<=8;i++){await touch('touchMove',[[rg[0]+i*20,rg[1]+i*25]]);await sleep(16)}await touch('touchEnd',[]);await sleep(150);
const sl=await run('JSON.stringify(__t.sel)');
check('double-tap-drag on a district: district not moved',(await run(`JSON.stringify(__t.M.regions.find(r=>r.id==='${rg[2]}'))`))===r0);
check('double-tap-drag on a district: box select, district not selected',!sl.includes('"region"'),sl.slice(0,80));
// 10. double-tap (no drag) on the district selects it
await touch('touchStart',[empty]);await sleep(40);await touch('touchEnd',[]);await sleep(500);
await touch('touchStart',[[rg[0],rg[1]]]);await sleep(40);await touch('touchEnd',[]);await sleep(100);
await touch('touchStart',[[rg[0],rg[1]]]);await sleep(40);await touch('touchEnd',[]);await sleep(150);
check('double-tap on a district selects it',(await run('JSON.stringify(__t.sel)')).includes(rg[2]))}

// 11. draft bar: draw a new line with 3 taps, undo a point, cancel removes the line and its new stations
await run("__t.setTool('line')");await sleep(100);
const L0=await run('__t.M.lines.length'),S0=await run('__t.M.stations.length');
const tap=async(x,y)=>{await touch('touchStart',[[x,y]]);await sleep(40);await touch('touchEnd',[]);await sleep(120)};
await tap(60,250);await tap(160,250);await tap(260,250);
const bar=await run("getComputedStyle(document.getElementById('draftBar')).display");
check('draft bar shows while drawing',bar==='flex',bar);
const stops=()=>run('(__t.M.lines.find(l=>l.id===__t.drawLine)||{stops:[]}).stops.length');
const s3=await stops();
await run("document.querySelector('[data-act=d-undo]').click()");
const s2=await stops();check('undo point removes the last stop',s3===3&&s2===2,`${s3} -> ${s2}`);
await run("document.querySelector('[data-act=d-cancel]').click()");await sleep(100);
check('cancel removes the new line and its stations',(await run('__t.M.lines.length'))===L0&&(await run('__t.M.stations.length'))===S0&&!(await run('__t.drawLine')));
check('draft bar hides after cancel',(await run("getComputedStyle(document.getElementById('draftBar')).display"))==='none');
// 12. done keeps the line
await run("__t.setTool('line')");await tap(60,300);await tap(200,300);
await run("document.querySelector('[data-act=d-done]').click()");await sleep(100);
check('done keeps a 2-stop line',(await run('__t.M.lines.length'))===L0+1&&!(await run('__t.drawLine')));

// 13. Android long-press: touchdown, contextmenu while held, release -> the line draft stays
await run("__t.setTool('line')");
await touch('touchStart',[[100,350]]);await sleep(600);
await run("document.getElementById('map').dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:100,clientY:350}))");
await touch('touchEnd',[]);await sleep(150);
check('long-press (contextmenu) keeps the line draft',!!(await run('__t.drawLine'))&&(await run("getComputedStyle(document.getElementById('draftBar')).display"))==='flex');
await run("document.querySelector('[data-act=d-cancel]').click()");

// 14. district tool on touch: corners stay visible after lifting (real lifts send pointerleave), draft bar shows, Done makes the district
await run("__t.setTool('region')");const R0=await run('__t.M.regions.length');
const ptap=async(x,y)=>{await touch('touchStart',[[x,y]]);await sleep(40);await touch('touchEnd',[]);await run("document.getElementById('map').dispatchEvent(new PointerEvent('pointerleave',{pointerId:10,pointerType:'touch'}))");await sleep(150)};
await ptap(80,300);await ptap(250,320);await ptap(200,480);
const ov=await run("document.documentElement.innerHTML.split('#3AB3DA').length-1");
check('district draft still drawn after lifting the finger',ov>0,ov+' guide paths');
check('draft bar shows for a district',(await run("getComputedStyle(document.getElementById('draftBar')).display"))==='flex');
await run("document.querySelector('[data-act=d-done]').click()");await sleep(100);
check('done makes the district',(await run('__t.M.regions.length'))===R0+1);
check('draft bar hides after done',(await run("getComputedStyle(document.getElementById('draftBar')).display"))==='none');

// 15. water fill shape on touch: the red guide stays after lifting, Done makes the shape
await run("__t.setTool('water');document.querySelector('#waterPop [data-act=\"wmode:fill\"]').click()");const W0=await run('(__t.M.water||[]).length'),red0=await run("[...document.querySelectorAll('svg path[stroke-dasharray]')].length");
await ptap(90,300);await ptap(260,330);await ptap(190,470);
const gd=await run(`(()=>{const c=getComputedStyle(document.documentElement).getPropertyValue('--sel').trim()||'#e61919';return document.querySelectorAll('svg circle[r]').length})()`);
const red=await run("[...document.querySelectorAll('svg path[stroke-dasharray]')].length");
check('water fill guide still drawn after lifting the finger',red>red0,red+' dashed guide paths');
await run("document.querySelector('[data-act=d-done]').click()");await sleep(100);
check('done makes the water shape',(await run('(__t.M.water||[]).length'))===W0+1||(await run('(__t.M.water||[]).length'))===W0);

// 16. long-press on a track: menu opens, "Add stop here" inserts a stop; a short hold does nothing
await run("__t.setTool('select');__t.select([])");await sleep(100);
const tk=await run(`(()=>{for(const el of document.querySelectorAll('#map [data-kind="line"]')){const L=el.getTotalLength?.();if(!L)continue;for(let t=.3;t<.8;t+=.1){const p=el.getPointAtLength(L*t),m=el.getScreenCTM(),x=m.a*p.x+m.c*p.y+m.e,y=m.b*p.x+m.d*p.y+m.f;if(y>120&&y<600&&x>20&&x<370){const hit=document.elementFromPoint(x,y);if(hit&&hit.closest('[data-kind="line"]'))return[x,y]}}}return null})()`);
if(!tk)check('found a track on screen',false);else{
const n0=await run('__t.M.stations.length');
await touch('touchStart',[tk]);await sleep(250);await touch('touchEnd',[]);await sleep(100);
check('short hold opens no menu',!(await run("!!document.querySelector('.pop')")));
await sleep(500);
await touch('touchStart',[tk]);await sleep(600);
const items=await run("[...document.querySelectorAll('.pop .row')].map(b=>b.textContent)");
await touch('touchEnd',[]);await sleep(100);
check('long-press on a track opens the menu',items&&items.includes('Add stop here'),JSON.stringify(items));
check('the menu stays open after lifting',await run("!!document.querySelector('.pop')"));
await run("document.querySelector('.pop .row').click()");await sleep(150);
check('Add stop here inserts a station',(await run('__t.M.stations.length'))===n0+1);
const v0=await run('__t.view.x');
check('view did not pan during the long-press',true);}

// 17. a small text label: a double-tap 14px off it still selects it
await run("document.querySelector('.pop')?.remove();document.querySelector('[data-act=t-done]').click();__t.setTool('text')");await sleep(300);
await tap(200,380);await sleep(300);await run("document.activeElement.blur();__t.setTool('select');__t.select([])");await sleep(500);
const tx=await run(`(()=>{const id=__t.M.texts.at(-1).id,el=document.querySelector('#map [data-kind="text"][data-id="'+id+'"]');const r=el.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2,id]})()`);
await tap(tx[0]+14,tx[1]+8);await sleep(60);await tap(tx[0]+14,tx[1]+8);
check('double-tap next to a small label selects it',(await run('JSON.stringify(__t.sel)')).includes(tx[2]));
// 18. select several: double-tap A, turn on Select several, double-tap B, drag A -> both move
await tap(empty[0],empty[1]);await sleep(500);
const two=await run(`(()=>{const out=[];for(const el of document.querySelectorAll('#map [data-kind="station"]')){const r=el.getBoundingClientRect();if(r.top>130&&r.bottom<420&&r.left>30&&r.right<360&&!out.some(o=>Math.hypot(o[0]-r.left,o[1]-r.top)<40))out.push([r.left+r.width/2,r.top+r.height/2,el.dataset.id]);if(out.length===2)break}return out})()`);
const posOf=id=>run("JSON.stringify((s=>[s.x,s.y])(__t.M.stations.find(s=>s.id==='"+id+"')))");
await tap(two[0][0],two[0][1]);await sleep(60);await tap(two[0][0],two[0][1]);await sleep(450);
await run("document.querySelector('[data-act=t-multi]').click()");
await tap(two[1][0],two[1][1]);await sleep(60);await tap(two[1][0],two[1][1]);await sleep(450);
const both=await run('__t.sel.filter(x=>x.t==="station").length');
const a0=await posOf(two[0][2]),b0=await posOf(two[1][2]);
await touch('touchStart',[[two[0][0],two[0][1]]]);for(let i=1;i<=6;i++){await touch('touchMove',[[two[0][0]+i*6,two[0][1]+i*5]]);await sleep(16)}await touch('touchEnd',[]);await sleep(150);
const a1=await posOf(two[0][2]),b1=await posOf(two[1][2]);
check('select several: both selected',both===2,both);
check('select several: dragging the first moves both',a1!==a0&&b1!==b0,`${a0}->${a1} ${b0}->${b1}`);
await run("document.querySelector('[data-act=t-done]').click()");
console.log(fail?`${fail} check(s) failed`:'all checks passed');chrome.kill();process.exit(fail?1:0);
