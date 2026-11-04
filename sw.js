/* Static asset shell: network-first online to make new Git/Vercel builds visible on reload,
   cache-first fallback offline. Local game saves stay in localStorage, never this cache. */
const CACHE='orbital-empires-app-0.3.1-integrated-map-first-20261104';
const OFFLINE_FILES=['./','./index.html','./style.css','./modules/styles/cinematic-ui.css','./modules/styles/distribution.css','./modules/styles/solar-frontier.css','./modules/galaxy/real-stars.js','./modules/styles/planet-command.css','./modules/simulation/population.js','./assets/ui/interface-icons.svg','./assets/ui/strategy-icons.svg','./assets/ui/empire-icon-atlas.svg','./assets/ui/empire-icon-catalog.json','./assets/ui/empire-icon-gallery.html','./modules/styles/4x-command.css','./modules/ui/strategic-outliner.js','./assets/ui/gallery.html','./assets/planet-portraits/atlas.webp','./assets/original/emblems/terran.svg','./app.js','./core.js','./version.js','./support-config.js','./modules/strategy/civics.js','./modules/strategy/government.js','./modules/styles/government.css','./modules/styles/biome-planets.css','./modules/strategy/planet-buildings.js','./modules/visuals/planet-visual.js','./modules/space/environment.js','./modules/styles/space-environment.css','./modules/styles/command-workspace.css','./modules/ui/development-workspace.js','./modules/styles/expansion.css','./system-model.js','./solar-view.js','./manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./modules/styles/monthly-time.css','./modules/simulation/monthly-clock.js','./modules/strategy/fleet-routes.js','./modules/styles/tactical-ships.css','./modules/strategy/outposts.js','./modules/strategy/ship-units.js','./modules/visuals/ship-models.js','./modules/styles/map-first-command.css','./modules/ui/galaxy-camera.js','./modules/ui/tech-tree-model.js','./modules/ui/tech-tree.js','./modules/styles/tech-tree.css','./assets/original/technologies/orbital-industry.svg','./assets/original/technologies/stellar-survey.svg','./assets/original/technologies/fusion-grid.svg','./assets/original/technologies/fleet-logistics.svg','./assets/original/technologies/quantum-labs.svg','./assets/original/technologies/colonial-charters.svg','./assets/original/technologies/synthetic-smelting.svg','./assets/original/technologies/planetary-banking.svg','./assets/original/technologies/shield-matrix.svg','./assets/original/technologies/capital-ships.svg','./assets/original/technologies/terraforming.svg','./assets/original/technologies/stellar-nexus.svg','./assets/original/technologies/culture-networks.svg','./assets/original/technologies/frontier-habitats.svg','./assets/original/technologies/exotic-materials.svg','./assets/original/technologies/civic-administration.svg'];
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
