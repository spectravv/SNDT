// SNDT offline support for the installed app (sndt.cc).
// The page is fetched from the network first, so a new version shows up as soon as you're online; offline, the last copy opens.
// Icons and Google Fonts come from the cache and refresh in the background. Maps are saved in the browser, not here.
const CACHE='sndt-v2';
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/','/manifest.webmanifest','/icons/icon-192.png','/icons/icon-512.png'])));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  if(u.origin===location.origin&&u.pathname.startsWith('/api/'))return;
  if(r.mode==='navigate'&&u.origin===location.origin){
    // each page (the app at /, the handbook at /handbook/) is kept under its own path, so opening one never replaces the other
    const key=u.pathname.startsWith('/handbook')?'/handbook/':'/';
    e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(key,cp))}return res}).catch(()=>caches.match(key).then(h=>h||caches.match('/'))));return}
  if(u.origin===location.origin||u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.match(r).then(hit=>{const net=fetch(r).then(res=>{if(res.ok||res.type==='opaque'){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res}).catch(()=>hit);return hit||net}))}
});
