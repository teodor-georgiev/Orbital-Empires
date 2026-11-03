/* Static asset shell: network-first online to make new Git/Vercel builds visible on reload,
   cache-first fallback offline. Local game saves stay in localStorage, never this cache. */
const CACHE='orbital-empires-app-0.3.0-hybrid-ui-government';
const OFFLINE_FILES=['./','./index.html','./style.css','./modules/styles/cinematic-ui.css','./modules/styles/distribution.css','./modules/styles/solar-frontier.css','./modules/galaxy/real-stars.js','./modules/styles/planet-command.css','./modules/simulation/population.js','./assets/ui/interface-icons.svg','./assets/planet-portraits/atlas.webp','./assets/original/emblems/terran.svg','./app.js','./core.js','./version.js','./support-config.js','./modules/strategy/civics.js','./modules/strategy/government.js','./modules/styles/government.css','./modules/styles/expansion.css','./system-model.js','./solar-view.js','./manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(OFFLINE_FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('orbital-empires-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const live=await fetch(event.request,{cache:'no-cache'});
   if(live.ok)await cache.put(event.request,live.clone());
   return live;
  }catch(error){
   const saved=await cache.match(event.request);
   if(saved)return saved;
   throw error;
  }
 })());
});
