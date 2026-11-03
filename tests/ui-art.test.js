import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
const read=async p=>readFile(new URL('../'+p,import.meta.url),'utf8');
test('planet portraits are locally cached real WebP files',async()=>{
 const file=new URL('../assets/planet-portraits/atlas.webp',import.meta.url);
 const data=await readFile(file);
 assert.ok((await stat(file)).size>200000);
 assert.equal(data.toString('ascii',0,4),'RIFF');
 assert.equal(data.toString('ascii',8,12),'WEBP');
 const css=await read('modules/styles/cinematic-ui.css');
 for(const name of ['terran','oceanic','desert','jungle','arctic','barren','volcanic','gas-giant'])assert.ok(css.includes('.planet-'+name+'{'),name);
 assert.ok(css.includes('atlas.webp'));
});
test('PWA menus and icons connect to working application actions',async()=>{
 const icons=await read('assets/ui/interface-icons.svg'),html=await read('index.html'),app=await read('app.js'),sw=await read('sw.js');
 for(const name of ['galaxy','colonies','research','fleets','diplomacy','intel','credits','alloys','science','influence','menu','new','save','install','planet','unity','traditions','policies'])assert.ok(icons.includes('id="'+name+'"'),name);
 assert.ok(html.includes('cinematic-ui.css')&&html.includes('data-action="menu"'));
 assert.ok(app.includes("case 'menu':")&&app.includes('artworkBiome'));
 for(const path of ['assets/planet-portraits/atlas.webp','assets/ui/interface-icons.svg','modules/styles/cinematic-ui.css'])assert.ok(sw.includes(path),path);
});
