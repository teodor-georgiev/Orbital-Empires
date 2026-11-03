const CACHE = 'orbital-empires-app-0.2.0-autoclock';
const OFFLINE_FILES = ['./','./index.html','./style.css','./modules/styles/cinematic-ui.css','./modules/styles/simulation.css','./modules/simulation/tick-clock.js','./assets/ui/interface-icons.svg','./assets/planet-portraits/atlas.webp','./assets/original/emblems/terran.svg','./app.js','./core.js','./version.js','./modules/strategy/civics.js','./modules/styles/expansion.css','./system-model.js','./solar-view.js','./manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install', event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(OFFLINE_FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate', event=>{event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n.startsWith('orbital-empires-')&&n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch', event=>{
  if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{if(response.ok){const clone=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,clone));}return response;})));
});
