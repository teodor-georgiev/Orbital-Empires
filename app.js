import { VERSION, WORLD, BUILDINGS, SHIPS, TECHS, TRADITIONS, POLICIES, traditionCost, unityIncome, adoptTradition, enactPolicy, generateGame, getEmpire, ownedSystems, getVisibility, hasSeen, getNeighbors, income, systemYield, score, fleetPower, availableTechs, colonyCost, canColonize, colonize, canBuild, build, canRecruit, recruit, canMove, moveFleet, chooseResearch, declareWar, sendEnvoy, offerPeace, endTurn, validateGame } from './core.js';
import { generateSystemBodies, selectSystemPlanet } from './system-model.js';
import { createSolarView } from './solar-view.js';
import { APP_VERSION } from './version.js';
import { configuredDonationUrl } from './support-config.js';
import { isDevelopmentPage, renderDevelopment } from './modules/ui/development-workspace.js';

const SAVE_KEY = 'orbital-empires-save-v1';
const PLANET_CLASSES=new Set(['terran','oceanic','desert','jungle','arctic','barren','volcanic','gas-giant']);
function artworkBiome(name){
 const slug=String(name||'').toLowerCase().replace(/\s+/g,'-');
 const aliases={'ice':'arctic','ice-world':'arctic','frozen':'arctic','tundra':'arctic','arid':'desert','ocean':'oceanic','molten':'volcanic','rocky':'barren','gas':'gas-giant','gasgiant':'gas-giant'};
 const key=aliases[slug]||slug;return PLANET_CLASSES.has(key)?key:'barren';
}
function gameIcon(id){const key=/^[a-z-]+$/.test(id)?id:'star';return '<svg class="ui-icon" aria-hidden="true" focusable="false"><use href="./assets/ui/interface-icons.svg#'+key+'"></use></svg>';}
function menuAction(icon,title,note,action,primary=false){return '<button class="menu-action'+(primary?' main':'')+'" data-action="'+action+'"><span class="menu-action-icon">'+gameIcon(icon)+'</span><span>'+title+'<small>'+note+'</small></span></button>';}

const $ = selector => document.querySelector(selector);
const el = (tag, props={}) => Object.assign(document.createElement(tag),props);
const escapeHTML = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = n => Math.round(n).toLocaleString('en-US');
const fragment = (markup)=>markup;
let game, activePage='system', selectedId=0, selectedFleetId=null, modalType=null, deferredInstallPrompt=null;
let selectedDevelopmentId=null, developmentFilter='all';
const SETTINGS_KEY='orbital-empires-settings-v1';
const QUALITY={performance:{scale:1,maxPixels:1920*1080,delay:65,stars:100},balanced:{scale:2,maxPixels:2560*1440,delay:36,stars:270},ultra4k:{scale:3,maxPixels:3840*2160,delay:32,stars:470}};
const THEMES=['command','nebula','imperial'];
function readSettings(){try{const value=JSON.parse(localStorage.getItem(SETTINGS_KEY))||{};return {quality:QUALITY[value.quality]?value.quality:'balanced',theme:THEMES.includes(value.theme)?value.theme:'command',motion:value.motion==='reduced'?'reduced':'full'};}catch{return {quality:'balanced',theme:'command',motion:'full'};}}
const settings=readSettings();
function applySettings(){document.body.dataset.theme=settings.theme;document.body.dataset.motion=settings.motion;rebuildStarfield();resizeCanvas();solar.resize();}

const viewport=$('#map-viewport'), canvas=$('#galaxy-canvas'), ctx=canvas.getContext('2d',{alpha:false});
const view={cx:WORLD.width/2,cy:WORLD.height/2,zoom:.7,auto:true,width:0,height:0};
let stars=[],pulse=0,drag=null,hovered=null,toastTimer=null,lastRenderTick=0;
let solarOpen=false,solarBodies=null,selectedPlanet=0;
const solar=createSolarView($('#solar-canvas'),{onSelect: id => {selectedPlanet=id;renderSolarHud();},quality:()=>QUALITY[settings.quality],shouldAnimate:()=>settings.motion!=='reduced'&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches});

function loadGame(){try{const obj=JSON.parse(localStorage.getItem(SAVE_KEY));if(validateGame(obj))return obj;}catch(e){}return null;}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(game));return true;}catch(e){notice('Saving is unavailable in this browser. Try a normal tab.','error');return false;}}
function activateGame(g,withWelcome=false){closeSolarSystem();game=g;selectedId=g.empires[0].home;selectedFleetId=g.fleets.find(f=>f.owner===0)?.id??null;activePage='system';view.auto=true;rebuildStarfield();persist();render();if(withWelcome)openModal('welcome');}
function notice(message,type='ok'){const node=$('#toast');node.textContent=message;node.className='toast show'+(type==='error'?' error':'');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.className='toast',3200);}
function act(result){if(!result)return;if(!result.ok){notice(result.message,'error');render();return;}persist();render();notice(result.message);}
function palette(owner){return owner===null?'#91a9ba':game.empires[owner]?.color||'#aabbcc';}
function empireFleet(f){return game.empires[f.owner];}
function labelOwner(s){return s.owner===null?'Unclaimed system':game.empires[s.owner].name;}
function fleetHere(s){return game.fleets.filter(f=>f.system===s.id)}
function fleetLabel(f){return `${(f.ships.corvette||0)} C / ${(f.ships.frigate||0)} F / ${(f.ships.cruiser||0)} CR`}
function totalFleets(id=0){return game.fleets.filter(f=>f.owner===id)}
function researchPct(e){if(!e.research)return 100;const t=TECHS.find(t=>t.id===e.research);return t?Math.min(100,(e.progress/t.cost)*100):0;}
function maybeSelectFleetForSystem(id){const fs=game.fleets.filter(f=>f.owner===0&&f.system===id);if(fs.length)selectedFleetId=fs[0].id;}

function openSolarSystem(id=selectedId){
  const system=game?.systems[id];
  if(!system || !hasSeen(game,system.id)){notice('This star system must be discovered before you can enter it.','error');return;}
  selectedId=id;activePage='system';selectedPlanet=0;
  solarBodies=generateSystemBodies(game.seed,system);
  solarOpen=true;
  const stage=$('#solar-stage');stage.hidden=false;viewport.classList.add('system-mode');
  $('#map-tooltip').hidden=true;
  solar.open(system,solarBodies);
  render();
}
function closeSolarSystem(){
  if(!solarOpen)return;
  solarOpen=false;solarBodies=null;selectedPlanet=0;solar.close();
  $('#solar-stage').hidden=true;viewport.classList.remove('system-mode');
  if(game)render();
}
function renderSolarHud(){
  if(!solarOpen||!solarBodies)return;
  const system=game.systems[selectedId],planet=selectSystemPlanet(solarBodies,selectedPlanet)||solarBodies.planets[0];
  $('#solar-system-name').textContent=system.name.toUpperCase()+' SYSTEM';
  $('#solar-renderer').textContent=solar.is3D()?'WEBGL 3D':'2D COMPATIBILITY MODE';
  $('#solar-planet-list').innerHTML=solarBodies.planets.map(p=>`<button class="solar-planet-option ${p.id===planet.id?'selected':''}" data-action="solar-planet" data-id="${p.id}" aria-pressed="${p.id===planet.id}"><span class="planet-thumbnail planet-${artworkBiome(p.biome)}" aria-hidden="true"></span><span class="planet-label-main">${escapeHTML(p.name)}<small>${escapeHTML(p.biome)}${p.isColonyWorld?' · CORE WORLD':''}</small></span><span>↗</span></button>`).join('');
  $('#solar-planet-detail').innerHTML=`<span class="eyebrow cyan">${planet.isColonyWorld?'PRIMARY COLONY WORLD':'UNSURVEYED ORBITAL BODY'}</span><strong>${escapeHTML(planet.name)}</strong><span>${escapeHTML(planet.biome)} · Orbit ${planet.orbitRadius.toFixed(1)} AU · ${planet.moons.length} moon${planet.moons.length===1?'':'s'}</span><small>${planet.isColonyWorld?`Habitable class ${planet.habitability}/3 · ${escapeHTML(system.feature)} · Use the right panel for colony actions.`:'Survey-only planet in v0.2. Future updates will add individual colonies and orbital infrastructure.'}</small>`;
}

function render(){
  if(!game)return;
  const player=game.empires[0],yieldNow=income(game),territory=ownedSystems(game),systems=game.systems;
  const resources=[['credits','CREDITS','credits'],['alloys','ALLOYS','alloys'],['science','SCIENCE','science'],['influence','INFLUENCE','influence'],['unity','UNITY','unity']];
  $('#resource-bar').innerHTML=resources.map(([icon,label,key])=>`<div class="resource"><span class="resource-icon">${gameIcon(icon)}</span><div class="resource-info"><small>${label}</small><strong>${key==='science'?fmt(yieldNow.science):fmt(player[key]||0)}<i>${key==='science'?'/ TURN':key==='unity'?`+${unityIncome(game)}`:`+${fmt(yieldNow[key])}`}</i></strong></div></div>`).join('');
  $('#profile-metrics').innerHTML=`<div class="profile-metric"><strong>${territory.length}</strong><small>COLONIES</small></div><div class="profile-metric"><strong>${totalFleets().length}</strong><small>FLEETS</small></div><div class="profile-metric"><strong>${player.techs.length}</strong><small>TECHS</small></div>`;
  $('#top-turn').textContent=`CYCLE ${String(game.turn).padStart(2,'0')}`;
  $('#build-version').textContent=`BUILD v${APP_VERSION} · SINGLE PLAYER`;
  $('#map-summary').textContent=solarOpen?`${game.systems[selectedId].star} · ${solarBodies.planets.length} catalogued planets · ${solarBodies.planets.filter(p=>p.moons.length).length} moon systems`:`${systems.length} star systems · ${game.empires.filter(e=>!e.eliminated).length} civilizations · ${territory.length} controlled`;
  $('.map-top h1').innerHTML=solarOpen?`${escapeHTML(game.systems[selectedId].name)} <span>System</span>`:'Galactic Sector <span>01</span>';
  $('.map-top .eyebrow').textContent=solarOpen?'LOCAL STELLAR OBSERVATORY':'EXPLORATION OVERVIEW';
  $('.map-mode').textContent=solarOpen?'◉ ORBITAL VIEW · 3D':'● LIVE STRATEGIC MAP · TURN BASED';
  $('#sector-id').textContent=game.seed.slice(0,15).toUpperCase();
  $('#footer-coordinates').textContent=`STARDATE ${2201+Math.floor((game.turn-1)/12)}.${String((game.turn-1)%12+1).padStart(2,'0')} // ${solarOpen?'ORBITAL SURVEY':'STRATEGIC VIEW'}`;
  $('#event-text').textContent=game.logs[0]?.message||'Welcome to the galaxy.';
  $('#footer-status').textContent=game.gameOver?'CAMPAIGN COMPLETE':'GALACTIC NETWORK CONNECTED';
  const directive=territory.length<3?['Expand the frontier','Claim three systems to secure your first sector.',territory.length/3]:player.techs.length<2?['Discover new technologies','Research two technologies to advance your empire.',player.techs.length/2]:totalFleets().reduce((n,f)=>n+fleetPower(game,f),0)<55?['Establish galactic security','Build a fleet worth 55 combat power.',totalFleets().reduce((n,f)=>n+fleetPower(game,f),0)/55]:['Unite the frontier','Control 65% of the galaxy for Dominion victory.',territory.length/(systems.length*.65)];
  $('#directive-title').textContent=directive[0];$('#directive-description').textContent=directive[1];$('#directive-progress i').style.width=`${Math.round(Math.min(1,directive[2])*100)}%`;
  const isProgress = isDevelopmentPage(activePage);
  $('.main-layout').classList.toggle('progress-mode', isProgress);
  const workspace = $('#progress-workspace');
  const previousBoard = workspace.querySelector('.progress-board');
  const previousScroll = previousBoard ? [previousBoard.scrollLeft, previousBoard.scrollTop] : [0, 0];
  workspace.hidden = !isProgress;
  if (isProgress) {
    workspace.innerHTML = renderDevelopment(game, activePage, selectedDevelopmentId, developmentFilter);
    const board = workspace.querySelector('.progress-board');
    if (board) { board.scrollLeft = previousScroll[0]; board.scrollTop = previousScroll[1]; }
    $('#inspector').innerHTML = '';
  } else {
    workspace.innerHTML = '';
    $('#inspector').innerHTML = renderInspector();
  }
  for (const button of document.querySelectorAll('[data-nav]')) {
    const isPrimaryProgress = button.classList.contains('progress-nav') && isProgress;
    button.classList.toggle('active', button.dataset.nav === activePage || isPrimaryProgress);
  }
  const turnBtn=$('[data-action="end-turn"]');turnBtn.disabled=!!game.gameOver;
  if(solarOpen)renderSolarHud();
}
function header(kicker,title,description,meta='SYSTEM ONLINE'){
 return `<div class="inspector-head"><div class="inspector-headline"><span>${kicker}</span><span>${meta}</span></div><h2>${title}</h2><p class="inspector-desc">${description}</p></div>`;
}
function section(title,body){return `<section class="subsection"><div class="section-label">${title}</div>${body}</section>`;}
function stat(label,val,cls=''){return `<div class="stat-cell"><small>${label}</small><strong class="${cls}">${val}</strong></div>`;}
function btn(action,label,cls='action-primary',attrs=''){return `<button class="${cls}" data-action="${action}" ${attrs}>${label}</button>`;}
function renderInspector(){switch(activePage){case 'colonies':return renderColonies();case 'research':return renderResearch();case 'military':return renderMilitary();case 'diplomacy':return renderDiplomacy();case 'intel':return renderIntel();case 'traditions':return renderTraditions();case 'policies':return renderPolicies();default:return renderSystem();}}
function renderSystem(){const s=game.systems[selectedId],seen=hasSeen(game,s.id),visible=getVisibility(game).has(s.id);
 if(!seen)return header('LONG-RANGE SENSORS','Uncharted Sector','This star system is beyond current sensor range. Move a fleet or establish nearby colonies to reveal it.','NO SIGNAL')+`<div class="inspector-body">${section('EXPLORATION STATUS','<div class="empty-message"><div class="empty-icon">◌</div>Unknown star system. Explore with a fleet.</div>')}</div>`;
 const y=systemYield(game,s),owner=s.owner===0?'DIRECTORATE CONTROL':s.owner===null?'UNCLAIMED':game.empires[s.owner].short.toUpperCase();
 let html=header('STAR SYSTEM / '+String(s.id+1).padStart(3,'0'),escapeHTML(s.name),`${s.star} · ${s.biome} world · ${escapeHTML(s.feature)}`,owner);
 html+='<div class="inspector-body">';
 html+=section('ORBITAL OBSERVATORY',`<div class="orbital-entry"><span class="orbital-entry-icon">${gameIcon('orbit')}</span><div><strong>Explore the star system</strong><small>Visit planets, moons and orbital lanes in interactive ${solar.is3D()?'3D':'2D'}.</small></div></div>${btn(solarOpen?'close-solar':'open-solar',solarOpen?'← RETURN TO GALAXY':'✦ ENTER SOLAR SYSTEM','action-primary orbital-action')}`);
 html+=section('PLANETARY OVERVIEW',`<div class="planet-hero ${s.biome.toLowerCase().replaceAll(' ','-')}"><div class="planet-orbit"></div><div class="planet-art planet-${artworkBiome(s.biome)}" role="img" aria-label="${escapeHTML(s.biome)} planet artwork"></div><span class="planet-symbol">${escapeHTML(s.biome.toUpperCase())} PLANET</span><span class="planet-feature">${escapeHTML(s.feature.toUpperCase())}</span></div>`);
 html+=section('SYSTEM ANALYSIS',`<div class="stat-grid">${stat('HABITABILITY','★'.repeat(s.habitability)+'<span style="opacity:.28">'+'★'.repeat(3-s.habitability)+'</span>','gold')}${stat('MINERAL RICHNESS',`${s.richness}/4`,'cyan')}${stat('POPULATION',s.owner===null?'—':`${s.population}.0 B`)}${stat('OWNERSHIP',s.owner===null?'Neutral':s.owner===0?'Terran':game.empires[s.owner].short)}</div>`);
 if(s.owner===0){html+=section('COLONY PRODUCTION',`<div class="stat-grid">${stat('CREDITS / CYCLE','+'+y.credits,'gold')}${stat('ALLOYS / CYCLE','+'+y.alloys,'cyan')}${stat('SCIENCE / CYCLE','+'+y.science)}${stat('INFLUENCE / CYCLE','+'+y.influence)}</div>`);
  html+=section('PLANETARY DEVELOPMENT',BUILDINGS.map(b=>{const lv=s.buildings[b.id],next=lv<3?`${b.cost[lv]} ◈ alloys · ${b.credit[lv]} credits`:'MAX LEVEL';const valid=canBuild(game,s.id,b.id);return `<div class="build-row"><div class="build-symbol">${b.icon}</div><div class="row-main"><strong>${b.name}</strong><span class="upgrade-level">LEVEL ${lv} / 3 · ${b.effect}</span><small>${next}</small></div><button data-action="build" data-type="${b.id}" ${!valid.ok?'disabled':''}>${lv===3?'MAX':'UPGRADE'}</button></div>`}).join(''));
 }else if(s.owner===null){const c=canColonize(game,s.id),cost=colonyCost(game);html+=section('EXPANSION PROTOCOL',`<div class="alert">This system is unclaimed. Frontier colonies must connect to your existing territory.</div><div class="inline-pair"><span>COLONIZATION COST</span><b>${cost.credits} ¤ · ${cost.alloys} ◈ · ${cost.influence} ◇</b></div>${btn('colonize','◈ ESTABLISH COLONY','action-primary',!c.ok?'disabled':'')}${!c.ok?`<div class="small-muted">${c.message}</div>`:''}`);
 }else{const e=game.empires[s.owner];html+=section('FOREIGN PRESENCE',`<div class="alert"><strong style="color:${e.color}">${escapeHTML(e.name)}</strong><div class="small-muted">${escapeHTML(e.trait)} civilization. ${game.empires[0].wars[e.id]?'At war with the Directorate.':'Diplomatic channels open.'}</div></div>${btn('diplomacy-panel','OPEN DIPLOMATIC CHANNELS','action-secondary')}`)}
 const fleets=fleetHere(s).filter(f=>visible||f.owner===0);if(fleets.length)html+=section('ORBITAL FLEETS',fleets.map(f=>`<div class="fleet-row"><div class="fleet-symbol" style="color:${empireFleet(f).color}">⌁</div><div class="row-main"><strong>${escapeHTML(f.name)}</strong><small>${escapeHTML(empireFleet(f).short)} · ${fleetPower(game,f)} POWER · ${fleetLabel(f)}</small></div>${f.owner===0?`<button class="fleet-pick ${selectedFleetId===f.id?'active':''}" data-action="select-fleet" data-id="${f.id}">SELECT</button>`:''}</div>`).join(''));
 const f=game.fleets.find(f=>f.id===selectedFleetId&&f.owner===0);if(f){const movable=canMove(game,f.id,s.id);const origin=game.systems[f.system];html+=section('FLEET ORDERS',`<div class="alert">Active fleet: <b style="color:#c2eeee">${escapeHTML(f.name)}</b><div class="small-muted">Currently at ${escapeHTML(origin.name)} · ${fleetPower(game,f)} power</div></div>${btn('move-fleet',`⌁ MOVE FLEET TO ${escapeHTML(s.name.toUpperCase())}`,'action-secondary',!movable.ok?'disabled':'')}${!movable.ok?`<div class="small-muted">${movable.message}</div>`:''}`)}
 html+='</div>';return html;
}
function renderColonies(){const colonies=ownedSystems(game),total=income(game),html=colonies.map(s=>{const y=systemYield(game,s);return `<div class="colony-row ${selectedId===s.id?'active':''}"><div class="colony-symbol">${s.capital?'✧':'◈'}</div><div class="row-main"><strong>${escapeHTML(s.name)} ${s.capital?'· CAPITAL':''}</strong><small>${s.biome} · ${s.population} B citizens</small><small style="color:#88c2cb">+${y.credits} ¤ · +${y.alloys} ◈ · +${y.science} ✦</small></div><button data-action="select-system" data-id="${s.id}" class="row-arrow">↗</button></div>`}).join('');return header('CIVIL ADMINISTRATION','Colonies & Economy',`${colonies.length} settled worlds under Directorate administration.`,'GOVERNANCE')+`<div class="inspector-body">${section('TOTAL PRODUCTION',`<div class="stat-grid">${stat('CREDITS / CYCLE','+'+total.credits,'gold')}${stat('ALLOYS / CYCLE','+'+total.alloys,'cyan')}${stat('SCIENCE / CYCLE','+'+total.science)}${stat('INFLUENCE / CYCLE','+'+total.influence)}</div>`)}${section('YOUR COLONIES',html)}</div>`;}
function renderResearch(){const e=game.empires[0],current=TECHS.find(t=>t.id===e.research),branches=[...new Set(TECHS.map(t=>t.branch))];
 const cards=branches.map(branch=>`<div class="tech-branch"><h3>✦ ${escapeHTML(branch.toUpperCase())}</h3>${TECHS.filter(t=>t.branch===branch).map(t=>{const done=e.techs.includes(t.id),available=t.prereqs.every(p=>e.techs.includes(p)),selected=e.research===t.id;return `<button class="tech-choice ${done?'complete':selected?'active':!available?'locked':''}" data-action="research" data-id="${t.id}" ${done||!available?'disabled':''}><span class="tech-symbol">✧</span><span class="tech-text"><strong>${escapeHTML(t.name)}</strong><small>${escapeHTML(t.description)}</small><small class="prereq">${t.prereqs.length?'← '+t.prereqs.map(id=>escapeHTML(TECHS.find(x=>x.id===id)?.name||id)).join(' + '):'ROOT TECHNOLOGY'}</small><small style="color:${t.color}">${escapeHTML(t.bonus)}</small></span><span class="tech-price">${done?'✓':selected?'◉':t.cost+' ✦'}</span></button>`}).join('')}</div>`).join('');
 return header('RESEARCH DIRECTORATE','Technology Tree','Research linked prerequisites across six disciplines. Completed discoveries grant permanent empire effects.','R&D ONLINE')+`<div class="inspector-body">${section('ACTIVE PROJECT',current?`<div class="alert"><strong>${escapeHTML(current.name)}</strong><div class="research-progress"><i style="width:${researchPct(e)}%"></i></div><div class="inline-pair"><span>${fmt(e.progress)} / ${current.cost} science</span><b>+${income(game).science} / cycle</b></div></div>`:'<div class="alert">All technologies completed.</div>')}${section(`TECHNOLOGIES · ${e.techs.length} / ${TECHS.length}`,`<div class="tech-branches">${cards}</div>`)}</div>`;
}
function renderTraditions(){const e=game.empires[0],adopted=e.traditions||[],cost=traditionCost(e),tracks=[...new Set(TRADITIONS.map(t=>t.track))];
 const groups=tracks.map(track=>`<div class="civic-group"><h3>✥ ${track.toUpperCase()}</h3>${TRADITIONS.filter(t=>t.track===track).map(t=>{const done=adopted.includes(t.id),unlocked=t.prereqs.every(id=>adopted.includes(id)),affordable=(e.unity||0)>=cost;return `<button class="civic-tile ${done?'done':''}" data-action="adopt-tradition" data-id="${t.id}" ${done||!unlocked||!affordable?'disabled':''}><strong>${done?'✓ ':unlocked?'◇ ':'🔒 '}${escapeHTML(t.name)}</strong><small>${escapeHTML(t.bonus)}</small><span class="status">${done?'ADOPTED':unlocked?cost+' UNITY':'REQUIRES '+t.prereqs.map(id=>escapeHTML(TRADITIONS.find(x=>x.id===id)?.name)).join(', ')}</span></button>`}).join('')}</div>`).join('');
 return header('CULTURAL EVOLUTION','Traditions','Unity is earned by your colonies every cycle. Spend it to unlock lasting empire-wide bonuses.','CULTURAL ARCHIVES')+`<div class="inspector-body">${section('CULTURAL CAPITAL',`<div class="civic-stats"><div class="civic-stat"><small>UNITY RESERVE</small><strong>${fmt(e.unity||0)} ✥</strong></div><div class="civic-stat"><small>UNITY PER CYCLE</small><strong>+${unityIncome(game)}</strong></div><div class="civic-stat"><small>NEXT TRADITION</small><strong>${cost} ✥</strong></div><div class="civic-stat"><small>ADOPTED</small><strong>${adopted.length} / ${TRADITIONS.length}</strong></div></div>`)}${section('TRADITION PATHS',`<div class="civic-path">${groups}</div>`)}</div>`;
}
function renderPolicies(){const e=game.empires[0],active=e.policies||[],slots=['Economy','Society','Defense'];
 const groups=slots.map(slot=>`<div class="civic-group"><h3>◈ ${slot.toUpperCase()} POLICY SLOT</h3>${POLICIES.filter(p=>p.slot===slot).map(p=>{const done=active.includes(p.id);return `<button class="civic-tile ${done?'done':''}" data-action="enact-policy" data-id="${p.id}" ${done||e.influence<20?'disabled':''}><strong>${done?'✓ ':'◇ '}${escapeHTML(p.name)}</strong><small>${escapeHTML(p.description)}</small><span class="status">${done?'ACTIVE POLICY':escapeHTML(p.bonus)+' · 20 INFLUENCE TO ENACT'}</span></button>`}).join('')}</div>`).join('');
 return header('SOCIETAL FRAMEWORK','Social Policies','Choose one active law in each slot. Replacing a policy costs 20 influence and immediately changes empire bonuses.','SENATE ONLINE')+`<div class="inspector-body">${section('POLICY OVERVIEW',`<div class="civic-stats"><div class="civic-stat"><small>INFLUENCE</small><strong>${fmt(e.influence)} ◇</strong></div><div class="civic-stat"><small>ACTIVE POLICIES</small><strong>${active.length} / 3</strong></div></div>`)}${section('ENACT LEGISLATION',`<div class="civic-path">${groups}</div>`)}</div>`;
}
function renderMilitary(){const fleets=totalFleets(),power=fleets.reduce((sum,f)=>sum+fleetPower(game,f),0),s=game.systems[selectedId],shipyard=s.owner===0?s:game.systems[game.empires[0].home];
 const fleetList=fleets.map(f=>`<div class="fleet-row ${selectedFleetId===f.id?'active':''}"><div class="fleet-symbol">⌁</div><div class="row-main"><strong>${escapeHTML(f.name)}</strong><small>${escapeHTML(game.systems[f.system].name)} · ${fleetPower(game,f)} POWER</small><small>${fleetLabel(f)} ${f.movedTurn>=game.turn?'· MOVED':''}</small></div><button data-action="select-fleet" data-id="${f.id}" class="fleet-pick ${selectedFleetId===f.id?'active':''}">SELECT</button></div>`).join('');
 const ships=SHIPS.map(x=>`<div class="build-row"><div class="build-symbol">${x.icon}</div><div class="row-main"><strong>${escapeHTML(x.name)}</strong><span class="upgrade-level">${x.power} COMBAT POWER</span><small>${x.alloy} ◈ alloys · ${x.credits} credits${x.tech?' · '+(game.empires[0].techs.includes(x.tech)?'UNLOCKED':'TECH LOCKED'):''}</small></div><button data-action="recruit" data-type="${x.id}" data-system="${shipyard.id}" ${!canRecruit(game,shipyard.id,x.id).ok?'disabled':''}>BUILD</button></div>`).join('');
 return header('NAVAL HIGH COMMAND','Fleet Operations','Deploy ships, project power, and secure critical hyperlanes.','DEFENSE READY')+`<div class="inspector-body">${section('NAVAL READINESS',`<div class="stat-grid">${stat('FLEETS',fleets.length)}${stat('TOTAL POWER',power,'cyan')}</div><div class="alert">Select a fleet, click an adjacent star on the map, then issue a movement order from Galaxy Command. Each fleet moves once per cycle.</div>`)}${section('ACTIVE FLEETS',fleetList||'<div class="empty-message">No fleets commissioned.</div>')}${section(`SHIPYARD · ${escapeHTML(shipyard.name.toUpperCase())}`,ships)}</div>`;
}
function renderDiplomacy(){const player=game.empires[0],rivals=game.empires.slice(1);
 return header('INTERSTELLAR COUNCIL','Diplomatic Corps','Form rivalries, improve relations, or take your place among the great powers.','FOREIGN AFFAIRS')+`<div class="inspector-body">${section('KNOWN CIVILIZATIONS',rivals.map(e=>{const w=!!player.wars[e.id],relation=player.relations[e.id]||0,owned=ownedSystems(game,e.id).length,known=game.systems.some(s=>s.owner===e.id&&hasSeen(game,s.id));return `<div class="rival-card"><div class="rival-emblem" style="--faction:${e.color}">${e.short.slice(0,1)}</div><div class="row-main"><strong>${escapeHTML(e.name)}</strong><small>${e.trait} · ${e.eliminated?'DEFEATED':known?'CONTACT ESTABLISHED':'UNCONFIRMED LOCATION'}</small><small>${owned} colonies · Relations: <span style="color:${relation>=0?'#8dd6ac':'#ec9ba9'}">${relation>0?'+':''}${relation}</span></small><div class="rival-actions">${e.eliminated?'<span class="small-muted">Empire eliminated</span>':w?`<span class="badge enemy">AT WAR</span><button data-action="peace" data-id="${e.id}">OFFER PEACE</button>`:`<button data-action="envoy" data-id="${e.id}" ${player.lastEnvoy[e.id]===game.turn?'disabled':''}>ENVOY −12 ◇</button><button data-action="war" data-id="${e.id}" class="danger">DECLARE WAR</button>`}</div></div></div>`}).join(''))}</div>`;}
function renderIntel(){const ranked=game.empires.slice().sort((a,b)=>score(game,b.id)-score(game,a.id)),mine=ownedSystems(game).length,control=100*mine/game.systems.length,entries=game.logs.slice(0,26);
 return header('COMMAND & INTELLIGENCE','Empire Overview','Situation reports, rankings, and a record of galactic events.','SECTOR INTEL')+`<div class="inspector-body">${section('STRATEGIC CONTROL',`<div class="stat-grid">${stat('SECTOR CONTROL',control.toFixed(1)+'%','cyan')}${stat('VICTORY TARGET','65%','gold')}${stat('CURRENT CYCLE',game.turn)}${stat('EMPIRE SCORE',Math.round(score(game)))}</div><div class="research-progress"><i style="width:${Math.min(100,control/65*100)}%"></i></div>`)}${section('GALACTIC POWER RANKING',ranked.map((e,i)=>`<div class="inline-pair" style="padding:7px 0;border-bottom:1px solid #243b4a"><span>${i+1}. <i class="legend-dot" style="background:${e.color}"></i> ${escapeHTML(e.short)}</span><b>${Math.round(score(game,e.id))} pts</b></div>`).join(''))}${section('MISSION LOG',entries.map(entry=>`<div class="log-entry ${entry.type}"><span>CY ${String(entry.turn).padStart(2,'0')}</span><p>${escapeHTML(entry.message)}</p></div>`).join(''))}</div>`;}

function rebuildStarfield(){const seed=game?.rng||43;let z=(seed+123456)>>>0;const rand=()=>{z^=z<<13;z^=z>>>17;z^=z<<5;return(z>>>0)/4294967296};stars=Array.from({length:QUALITY[settings.quality].stars},()=>({x:rand(),y:rand(),r:rand()*1.1+.15,a:.18+rand()*.57}));}
function resizeCanvas(){const rect=canvas.getBoundingClientRect(),preset=QUALITY[settings.quality];if(!rect.width||!rect.height)return;const dpr=Math.min(preset.scale,Math.sqrt(preset.maxPixels/(rect.width*rect.height)));const w=Math.max(1,Math.round(rect.width*dpr)),h=Math.max(1,Math.round(rect.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}view.width=rect.width;view.height=rect.height;ctx.setTransform(dpr,0,0,dpr,0,0);if(view.auto){view.cx=WORLD.width/2;view.cy=WORLD.height/2;view.zoom=Math.min(rect.width/(WORLD.width+75),rect.height/(WORLD.height+60))*1.03;}}
function screenPos(s){return {x:(s.x-view.cx)*view.zoom+view.width/2,y:(s.y-view.cy)*view.zoom+view.height/2};}
function fromScreen(x,y){return{x:view.cx+(x-view.width/2)/view.zoom,y:view.cy+(y-view.height/2)/view.zoom};}
function colorAlpha(color,a){if(color[0]==='#'){const n=parseInt(color.slice(1),16);return`rgba(${n>>16&255},${n>>8&255},${n&255},${a})`;}return color;}
function draw(now){requestAnimationFrame(draw);if(solarOpen)return;if(!game||!view.width||now-lastRenderTick<QUALITY[settings.quality].delay)return;lastRenderTick=now;pulse=now/1000;
 const w=view.width,h=view.height;ctx.clearRect(0,0,w,h);
 let bg=ctx.createRadialGradient(w*.48,h*.45,15,w*.48,h*.45,Math.max(w,h)*.8);bg.addColorStop(0,'#13243b');bg.addColorStop(.4,'#0d192b');bg.addColorStop(1,'#050d18');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
 for(const glow of [{x:.28,y:.3,r:.46,c:'rgba(18,76,95,.14)'},{x:.82,y:.7,r:.48,c:'rgba(65,42,105,.15)'},{x:.55,y:.72,r:.24,c:'rgba(20,53,89,.18)'}]){const g=ctx.createRadialGradient(glow.x*w,glow.y*h,0,glow.x*w,glow.y*h,glow.r*Math.max(w,h));g.addColorStop(0,glow.c);g.addColorStop(1,'transparent');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);}
 ctx.fillStyle='#c6d6f2';for(const s of stars){ctx.globalAlpha=s.a;ctx.fillRect(s.x*w,s.y*h,s.r,s.r)}ctx.globalAlpha=1;
 const visible=getVisibility(game),seen=new Set([...game.explored,...visible]);
 // Delicate map grid follows the camera.
 ctx.strokeStyle='rgba(79,119,140,.085)';ctx.lineWidth=.7;
 const grid=85*view.zoom,offsetX=(view.width/2-view.cx*view.zoom)%grid,offsetY=(view.height/2-view.cy*view.zoom)%grid;
 if(grid>20){for(let x=offsetX;x<w;x+=grid){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke()}for(let y=offsetY;y<h;y+=grid){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}}
 // Cultural control fields, always beneath the starmap.
 for(const s of game.systems){if(s.owner===null||!seen.has(s.id))continue;const p=screenPos(s);const rad=65*view.zoom;const g=ctx.createRadialGradient(p.x,p.y,1,p.x,p.y,rad);g.addColorStop(0,colorAlpha(palette(s.owner),.16));g.addColorStop(1,colorAlpha(palette(s.owner),0));ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,rad,0,Math.PI*2);ctx.fill()}
 // Hyperlanes reveal only visited or currently surveyed sectors.
 ctx.lineCap='round';for(const s of game.systems)for(const j of s.neighbors){if(j<s.id)continue;const t=game.systems[j];if(!seen.has(s.id)||!seen.has(t.id))continue;const a=screenPos(s),b=screenPos(t),ownerLink=s.owner!==null&&s.owner===t.owner;ctx.strokeStyle=ownerLink?colorAlpha(palette(s.owner),.35):'rgba(102,143,168,.22)';ctx.lineWidth=ownerLink?1.8:1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
 // Radar rings on capital systems.
 for(const s of game.systems){if(!s.capital||!seen.has(s.id))continue;const p=screenPos(s);ctx.strokeStyle=colorAlpha(palette(s.owner),.14+.07*Math.sin(pulse*1.5));ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x,p.y,20+Math.sin(pulse*1.5)*3,0,Math.PI*2);ctx.stroke()}
 // Star systems, territory dots and fleet markers.
 for(const s of game.systems){if(!seen.has(s.id))continue;const p=screenPos(s);if(p.x< -65||p.x>w+65||p.y< -65||p.y>h+65)continue;const chosen=selectedId===s.id,active=visible.has(s.id),own=s.owner!==null;
  const radius=own?4.4:3.3;let aura=ctx.createRadialGradient(p.x,p.y,1,p.x,p.y,15);aura.addColorStop(0,colorAlpha(s.color,active?.28:.12));aura.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=aura;ctx.beginPath();ctx.arc(p.x,p.y,15,0,Math.PI*2);ctx.fill();
  ctx.fillStyle=active?s.color:'#6d8299';ctx.globalAlpha=active?1:.5;ctx.beginPath();ctx.arc(p.x,p.y,radius,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  if(own){ctx.strokeStyle=palette(s.owner);ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.stroke()}
  if(chosen){ctx.strokeStyle='#e6efee';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(p.x,p.y,15+Math.sin(pulse*3)*1.3,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='rgba(130,224,230,.65)';ctx.beginPath();ctx.moveTo(p.x-23,p.y);ctx.lineTo(p.x-17,p.y);ctx.moveTo(p.x+17,p.y);ctx.lineTo(p.x+23,p.y);ctx.moveTo(p.x,p.y-23);ctx.lineTo(p.x,p.y-17);ctx.moveTo(p.x,p.y+17);ctx.lineTo(p.x,p.y+23);ctx.stroke()}
  if(view.zoom>.42||own||chosen){ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillStyle=chosen?'#f2faf8':own?'#b8e3e5':'#90a6b6';ctx.font=(chosen?'700 ':'500 ')+'11px Rajdhani, sans-serif';ctx.fillText(s.name,p.x+13,p.y-7)}
  const ships=game.fleets.filter(f=>f.system===s.id&&(f.owner===0||active));if(ships.length){const group=ships.reduce((acc,f)=>(acc+Object.values(f.ships).reduce((a,b)=>a+b,0)),0),hue=palette(ships[0].owner);ctx.fillStyle='#0b2633';ctx.strokeStyle=hue;ctx.lineWidth=1;ctx.fillRect(p.x+9,p.y+4,19,14);ctx.strokeRect(p.x+9,p.y+4,19,14);ctx.textAlign='center';ctx.font='700 10px Rajdhani';ctx.fillStyle=hue;ctx.fillText(String(group),p.x+18.5,p.y+11)}
 }
 // Fleet route helper line from selected fleet to current target.
 const selectedFleet=game.fleets.find(f=>f.id===selectedFleetId&&f.owner===0);
 if(selectedFleet&&selectedFleet.system!==selectedId){const a=screenPos(game.systems[selectedFleet.system]),b=screenPos(game.systems[selectedId]);if(game.systems[selectedFleet.system].neighbors.includes(selectedId)){ctx.setLineDash([5,5]);ctx.strokeStyle='rgba(111,234,231,.8)';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([])}}
}
function recenter(){view.auto=true;resizeCanvas();}
function zoomAt(factor,x=view.width/2,y=view.height/2){const before=fromScreen(x,y);view.auto=false;view.zoom=Math.max(.23,Math.min(3.5,view.zoom*factor));view.cx=before.x-(x-view.width/2)/view.zoom;view.cy=before.y-(y-view.height/2)/view.zoom;}
function findStar(x,y){let best=null,d=19;for(const s of game.systems){if(!hasSeen(game,s.id))continue;const p=screenPos(s),dd=Math.hypot(p.x-x,p.y-y);if(dd<d){best=s;d=dd}}return best;}
function posEvent(event){const r=canvas.getBoundingClientRect();return{x:event.clientX-r.left,y:event.clientY-r.top};}
viewport.addEventListener('pointerdown',e=>{if(e.target!==canvas||!game)return;const p=posEvent(e);drag={pointer:e.pointerId,x:p.x,y:p.y,prevX:p.x,prevY:p.y,moved:false};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!game)return;const p=posEvent(e);if(drag&&drag.pointer===e.pointerId){const dx=p.x-drag.prevX,dy=p.y-drag.prevY;if(Math.abs(p.x-drag.x)+Math.abs(p.y-drag.y)>6)drag.moved=true;if(drag.moved){view.auto=false;view.cx-=dx/view.zoom;view.cy-=dy/view.zoom;}drag.prevX=p.x;drag.prevY=p.y;$('#map-tooltip').hidden=true;return;}
 const s=findStar(p.x,p.y),tip=$('#map-tooltip');if(s){hovered=s.id;tip.hidden=false;tip.innerHTML=`<strong>${escapeHTML(s.name)}</strong><small>${escapeHTML(labelOwner(s))} · ${escapeHTML(s.star)}</small>`;tip.style.left=Math.min(Math.max(p.x+17,12),view.width-165)+'px';tip.style.top=Math.max(7,Math.min(p.y-37,view.height-65))+'px';canvas.style.cursor='pointer';}else{tip.hidden=true;canvas.style.cursor='grab';}});
canvas.addEventListener('pointerup',e=>{if(!drag||drag.pointer!==e.pointerId)return;const p=posEvent(e);if(!drag.moved){const s=findStar(p.x,p.y);if(s){if(s.id===selectedId&&activePage==='system')openSolarSystem(s.id);else{selectedId=s.id;activePage='system';render();}}}drag=null;});
canvas.addEventListener('pointercancel',()=>drag=null);
canvas.addEventListener('pointerleave',()=>{$('#map-tooltip').hidden=true});
viewport.addEventListener('wheel',e=>{if(!game)return;e.preventDefault();const r=canvas.getBoundingClientRect();zoomAt(e.deltaY<0?1.13:.885,e.clientX-r.left,e.clientY-r.top);},{passive:false});
window.addEventListener('resize',resizeCanvas);

function modalLayout(kicker,title,body,buttons=''){return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button class="modal-close" data-action="close-modal" aria-label="Close dialog">×</button><div class="eyebrow">${kicker}</div><h2 id="modal-title">${title}</h2>${body}${buttons?`<div class="modal-actions">${buttons}</div>`:''}</div>`}
function openModal(type){modalType=type;const root=$('#modal-root');let html='';
 if(type==='welcome'){
  const worlds=['Terran','Oceanic','Desert','Jungle','Arctic','Barren','Volcanic','Gas Giant'];
  const tiles=worlds.map(world=>'<div class="menu-world"><span class="planet-thumbnail planet-'+artworkBiome(world)+'" aria-hidden="true"></span><span>'+world+'</span></div>').join('');
  const body='<div class="command-menu">'+
   '<div class="menu-showcase"><div class="menu-planet planet-terran" aria-hidden="true"></div><div class="menu-planet planet-gas-giant" aria-hidden="true"></div><div class="menu-showcase-copy"><strong>Chart the unknown.</strong><span>Explore ancient stars. Build living worlds. Forge an empire among the constellations.</span></div></div>'+
   '<div class="menu-actions">'+
   menuAction('orbit','Resume command','Continue your campaign','close-modal',true)+
   menuAction('new','New galaxy','Create a unique sector','new')+
   menuAction('book','Field manual','Learn the 4X systems','guide')+
   menuAction('save','Save progress','Save on this device','save')+
   menuAction('install','Install game','Play offline anywhere','install')+
   menuAction('download','Download / backup','Install or save game files','download-menu')+
   menuAction('heart','Donate','Support future development','donate-menu')+
   '</div>'+
   '<div class="menu-overview"><strong>THE DIRECTORATE // CURRENT CAMPAIGN</strong><p>One commander. An entire galaxy to discover. All progress is saved locally in your browser.</p><div class="menu-stats">'+
   '<div class="menu-stat"><b>'+String(game.turn)+'</b><span>CYCLE</span></div>'+
   '<div class="menu-stat"><b>'+String(ownedSystems(game).length)+'</b><span>COLONIES</span></div>'+
   '<div class="menu-stat"><b>'+String(game.systems.length)+'</b><span>STARS</span></div></div></div>'+
   '<div class="menu-worlds" aria-label="Planet classes">'+tiles+'</div></div>';
  html=modalLayout('ORBITAL EMPIRES // GALACTIC COMMAND','A galaxy awaits your command.',body);
 }
 else if(type==='download'){html=modalLayout('PLAY ANYWHERE','Download & Install',`<div class="distribution-panel"><p><b>Recommended:</b> install Orbital Empires directly from your browser. It runs as a standalone app and works offline after installation.</p><div class="distribution-choices"><button class="action-primary" data-action="install">${gameIcon('download')} INSTALL WEB APP</button><a class="action-secondary" href="https://github.com/teodor-georgiev/Orbital-Empires/archive/refs/heads/main.zip" target="_blank" rel="noopener noreferrer">${gameIcon('archive')} DOWNLOAD GAME ZIP</a><button class="action-secondary" data-action="export-save">${gameIcon('save')} BACK UP YOUR SAVE</button></div><p class="small-muted">The ZIP is a self-hosted source package, not a Windows .exe. Unzip and run the bundled local launcher with Python 3, or serve the folder over HTTPS. Saves remain only in this browser unless you export them.</p></div>`,btn('close-modal','BACK TO GAME','action-secondary'))}
 else if(type==='donate'){const donation=configuredDonationUrl();const link=donation?`<a class="action-primary donation-action" href="${escapeHTML(donation)}" target="_blank" rel="noopener noreferrer">${gameIcon('heart')} OPEN EXTERNAL DONATION PAGE</a>`:'<div class="donation-pending">Donations are not enabled yet. There is no payment account or checkout connected to this game.</div>';html=modalLayout('SUPPORT THE PROJECT','Help build Orbital Empires',`<div class="donation-panel"><div class="donation-emblem">${gameIcon('heart')}</div><p>The game is free to play. If you enjoy it, you can support development or share it with others. Donating is always optional.</p>${link}<p class="small-muted">Payments, if enabled later, will be handled by an external provider. Orbital Empires does not collect or store payment details.</p><a class="project-link" href="https://github.com/teodor-georgiev/Orbital-Empires" target="_blank" rel="noopener noreferrer">${gameIcon('galaxy')} View project on GitHub</a></div>`,btn('close-modal','BACK TO GAME','action-secondary'))}
 else if(type==='new'){html=modalLayout('NEW CAMPAIGN','Create your galaxy.',`<div class="campaign-preview"><p>YOUR NEXT FRONTIER<br><strong>Eight worlds. Thousands of possibilities.</strong><br>Choose the seed, size, and rival empires.</p><div class="preview-orbs"><span class="planet-thumbnail planet-terran" aria-hidden="true"></span><span class="planet-thumbnail planet-desert" aria-hidden="true"></span><span class="planet-thumbnail planet-gas-giant" aria-hidden="true"></span></div></div><p>Generate a fresh, deterministic star map. Starting a new campaign replaces the current local save.</p><div class="form-grid"><div class="form-field full"><label for="new-seed">GALAXY SEED</label><input id="new-seed" value="${escapeHTML(game.seed)}" maxlength="40" autocomplete="off"></div><div class="form-field"><label for="new-size">STAR SYSTEMS</label><select id="new-size"><option value="60" ${game.systems.length===60?'selected':''}>60 · Compact</option><option value="90" ${game.systems.length===90?'selected':''}>90 · Standard</option><option value="140" ${game.systems.length===140?'selected':''}>140 · Vast</option><option value="180" ${game.systems.length===180?'selected':''}>180 · Epic</option></select></div><div class="form-field"><label for="new-opponents">RIVAL EMPIRES</label><select id="new-opponents">${[2,3,4,5,6].map(n=>`<option value="${n}" ${game.empires.length===n+1?'selected':''}>${n} civilizations</option>`).join('')}</select></div><div class="form-field full"><label for="new-difficulty">AI DIFFICULTY</label><select id="new-difficulty"><option value="easy">Cadet · Relaxed expansion</option><option value="normal" ${game.difficulty==='normal'?'selected':''}>Commander · Balanced</option><option value="hard" ${game.difficulty==='hard'?'selected':''}>Admiral · Aggressive expansion</option></select></div></div>`,btn('start','GENERATE GALAXY')+btn('close-modal','CANCEL','action-secondary'))}
 else if(type==='settings'){html=modalLayout('COMMAND OPTIONS','Display & Interface',`<div class="settings-hero"><strong>CHOOSE YOUR COMMAND DECK</strong><p>4K Ultra increases internal Canvas resolution up to 3840 × 2160 pixels. It does not change your monitor resolution; performance depends on your device.</p></div><div class="form-grid"><div class="form-field full"><label for="gfx-quality">GRAPHICS QUALITY</label><select id="gfx-quality"><option value="performance" ${settings.quality==='performance'?'selected':''}>Performance · 1080p cap</option><option value="balanced" ${settings.quality==='balanced'?'selected':''}>Balanced · 1440p cap</option><option value="ultra4k" ${settings.quality==='ultra4k'?'selected':''}>4K Ultra · 3840 × 2160 cap</option></select></div><div class="form-field"><label for="ui-theme">INTERFACE STYLE</label><select id="ui-theme"><option value="command" ${settings.theme==='command'?'selected':''}>Command · Teal</option><option value="nebula" ${settings.theme==='nebula'?'selected':''}>Nebula · Violet</option><option value="imperial" ${settings.theme==='imperial'?'selected':''}>Imperial · Gold</option></select></div><div class="form-field"><label for="motion-mode">ANIMATION</label><select id="motion-mode"><option value="full" ${settings.motion==='full'?'selected':''}>Full motion</option><option value="reduced" ${settings.motion==='reduced'?'selected':''}>Reduced motion</option></select></div></div>`,btn('save-settings','APPLY SETTINGS')+btn('close-modal','CANCEL','action-secondary'))}
 else if(type==='guide'){html=modalLayout('COMMAND HANDBOOK','How to rule the stars',`<div class="guide-steps"><div><strong>◎ EXPLORE</strong><p>Star systems are connected by glowing hyperlanes. Select a fleet in <b>Fleets & Shipyard</b>, click an adjacent star, and press Move in Galaxy Command. Each fleet can move once per turn.</p></div><div><strong>◈ EXPAND</strong><p>Claim an unowned system beside your colonies. Colony ships are abstracted into the colonization cost of credits, alloys, and influence.</p></div><div><strong>⬡ DEVELOP</strong><p>Build foundries, labs, markets, and defensive grids at your colonies. End Turn collects their production and advances technology.</p></div><div><strong>✧ RESEARCH</strong><p>Choose any unlocked technology in Research. Science generated each turn advances its progress; technology prerequisites open deeper branches.</p></div><div><strong>⌁ CONQUER</strong><p>Build ships at an owned colony. Declare war before entering rival territory. Battles resolve automatically based on fleet strength, defenses, and chance.</p></div><div><strong>♜ DIPLOMACY</strong><p>Send envoys to improve relations or negotiate peace after wars. AI empires colonize, research, build fleets, and sometimes declare war.</p></div></div><p><b>Victory:</b> control 65% of systems, or eliminate all competing civilizations. Your game saves automatically in this browser.</p>`,btn('close-modal','RETURN TO GALAXY'))}
 else if(type==='turn'){const y=income(game),recent=game.logs.filter(l=>l.turn===game.turn).slice(0,5);html=modalLayout('CYCLE COMPLETE',`Stardate ${2201+Math.floor((game.turn-1)/12)}.${String((game.turn-1)%12+1).padStart(2,'0')}`,`<p>Production, research, and AI civilizations have advanced. Your command is ready for another cycle.</p><div class="stat-grid">${stat('CREDIT INCOME','+'+y.credits,'gold')}${stat('ALLOY INCOME','+'+y.alloys,'cyan')}${stat('SCIENCE GENERATED','+'+y.science)}${stat('INFLUENCE GAIN','+'+y.influence)}</div>${recent.length?`<div style="margin-top:18px">${recent.map(x=>`<div class="log-entry ${x.type}"><span>◉</span><p>${escapeHTML(x.message)}</p></div>`).join('')}</div>`:'<p>No major incidents reported this cycle.</p>'}`,btn('close-modal','CONTINUE COMMAND'))}
 else if(type==='victory'){const won=game.gameOver?.won;html=modalLayout(won?'VICTORY ACHIEVED':'EMPIRE FALLEN',escapeHTML(game.gameOver?.title||'Campaign complete'),`<div class="modal-hero"><div class="giant-planet"></div></div><p>${escapeHTML(game.gameOver?.description||'The campaign has ended.')}</p><p>Your empire survived <b>${game.turn}</b> cycles and secured <b>${ownedSystems(game).length}</b> colonies.</p>`,btn('new','BEGIN NEW CAMPAIGN')+btn('close-modal','VIEW FINAL GALAXY','action-secondary'))}
 root.innerHTML=html;root.hidden=false;root.querySelector('.modal-close')?.focus();}
function closeModal(){modalType=null;$('#modal-root').hidden=true;$('#modal-root').innerHTML='';}
$('#modal-root').addEventListener('click',e=>{if(e.target.id==='modal-root'&&modalType!=='welcome')closeModal()});
document.addEventListener('keydown',e=>{
 const currentTab=e.target instanceof Element?e.target.closest('.progress-tab'):null;
 if(currentTab&&['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){
  e.preventDefault();
  const pages=['research','traditions','policies'],index=pages.indexOf(activePage);
  const next=e.key==='Home'?0:e.key==='End'?pages.length-1:
    (index+(e.key==='ArrowLeft'?-1:1)+pages.length)%pages.length;
  activePage=pages[next];selectedDevelopmentId=null;developmentFilter='all';render();
  document.querySelector('.progress-tab[data-nav="'+activePage+'"]')?.focus({preventScroll:true});
  return;
 }
 if(e.key==='Escape'){
  if(modalType)closeModal();
  else if(solarOpen)closeSolarSystem();
  else if(isDevelopmentPage(activePage)){activePage='system';selectedDevelopmentId=null;developmentFilter='all';render();requestAnimationFrame(resizeCanvas);}
  return;
 }
 if(e.target instanceof HTMLInputElement||e.target instanceof HTMLSelectElement)return;
 if(e.key==='Enter'&&modalType===null&&game&&!game.gameOver&&e.ctrlKey){e.preventDefault();handleAction('end-turn',{})}
 if(e.key==='?'&&modalType===null)openModal('guide');
});

document.addEventListener('click',event=>{
 const nav=event.target.closest('[data-nav]');
 if(nav){
  const wasProgress=isDevelopmentPage(activePage);
  const wasProgressTab=nav.classList.contains('progress-tab');
  if(solarOpen)closeSolarSystem();
  if(activePage!==nav.dataset.nav){selectedDevelopmentId=null;developmentFilter='all';}
  activePage=nav.dataset.nav;render();
  if(wasProgressTab)document.querySelector('.progress-tab[data-nav="'+activePage+'"]')?.focus({preventScroll:true});
  if(wasProgress&&!isDevelopmentPage(activePage))requestAnimationFrame(resizeCanvas);
  return;
 }
 const action=event.target.closest('[data-action]');if(!action||action.disabled)return;
 handleAction(action.dataset.action,action.dataset);
});
function handleAction(action,data){
 const id=Number(data.id),systemId=Number(data.system);
 switch(action){
  case 'end-turn':{const result=endTurn(game);if(!result.ok){notice(result.message,'error');break;}persist();render();openModal(game.gameOver?'victory':'turn');break;}
  case 'menu':openModal('welcome');break;
  case 'new':openModal('new');break;
  case 'start':{const seed=$('#new-seed')?.value?.trim()||'ORION-47',size=Number($('#new-size').value),opponents=Number($('#new-opponents').value),difficulty=$('#new-difficulty').value;closeModal();activateGame(generateGame({seed,size,opponents,difficulty}),false);notice('Fresh galaxy generated.');break;}
  case 'close-modal':closeModal();break;
  case 'guide':openModal('guide');break;
  case 'settings':openModal('settings');break;
  case 'save-settings':{settings.quality=$('#gfx-quality').value;settings.theme=$('#ui-theme').value;settings.motion=$('#motion-mode').value;try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings))}catch{}closeModal();applySettings();render();notice('Display settings applied.');break;}
  case 'select-development': {
    selectedDevelopmentId=data.id;
    render();
    const chosen=[...document.querySelectorAll('#progress-workspace [data-action="select-development"]')].find(node=>node.dataset.id===data.id);
    chosen?.focus({preventScroll:true});
    break;
  }
  case 'filter-development': {
    developmentFilter=data.filter;
    selectedDevelopmentId=null;
    render();
    const chosen=[...document.querySelectorAll('#progress-workspace [data-action="filter-development"]')].find(node=>node.dataset.filter===data.filter);
    chosen?.focus({preventScroll:true});
    break;
  }
  case 'adopt-tradition':act(adoptTradition(game,data.id));break;
  case 'enact-policy':act(enactPolicy(game,data.id));break;
  case 'save':if(persist())notice('Campaign saved to this browser.');break;
  case 'install':installApp();break;
  case 'download-menu':openModal('download');break;
  case 'donate-menu':openModal('donate');break;
  case 'export-save':exportSave();break;
  case 'open-solar':openSolarSystem();break;
  case 'close-solar':closeSolarSystem();break;
  case 'solar-reset':solar.resetCamera();break;
  case 'solar-planet':{if(!solarOpen||!selectSystemPlanet(solarBodies,id))break;selectedPlanet=id;solar.selectPlanet(id);renderSolarHud();break;}
  case 'zoom-in':zoomAt(1.27);break;
  case 'zoom-out':zoomAt(.78);break;
  case 'center':recenter();break;
  case 'select-system':if(solarOpen)closeSolarSystem();selectedId=id;activePage='system';maybeSelectFleetForSystem(id);render();break;
  case 'select-fleet':selectedFleetId=id;activePage='military';render();notice('Fleet selected. Click a neighboring system, then issue a Move order.');break;
  case 'colonize':act(colonize(game,selectedId));break;
  case 'build':act(build(game,selectedId,data.type));break;
  case 'recruit':act(recruit(game,systemId,data.type));break;
  case 'research':act(chooseResearch(game,data.id));break;
  case 'move-fleet':act(moveFleet(game,selectedFleetId,selectedId));break;
  case 'envoy':act(sendEnvoy(game,id));break;
  case 'war':act(declareWar(game,id));break;
  case 'peace':act(offerPeace(game,id));break;
  case 'diplomacy-panel':activePage='diplomacy';render();break;
  default:break;
 }
}
function exportSave(){
 try{
  const payload=JSON.stringify({version:1,exportedAt:new Date().toISOString(),game});
  const url=URL.createObjectURL(new Blob([payload],{type:'application/json'}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download='orbital-empires-save-cycle-'+game.turn+'.json';
  document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  notice('Save backup downloaded. Store it safely.');
 }catch{notice('Could not download save backup.','error');}
}
async function installApp(){if(deferredInstallPrompt){const prompt=deferredInstallPrompt;deferredInstallPrompt=null;prompt.prompt();const result=await prompt.userChoice;notice(result.outcome==='accepted'?'App installation requested.':'Install was dismissed.');return;}
 const mobile=/iphone|ipad|ipod/i.test(navigator.userAgent),secure=window.isSecureContext&&window.location.protocol!=='file:';
 if(mobile)notice('On iPhone: Share → Add to Home Screen.');else if(secure)notice('Use your browser menu → Install app / Add to desktop.');else notice('To install: serve this folder on localhost or HTTPS, then use the browser Install option.');}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;$('#install-btn').title='Install this offline-capable game';});
window.addEventListener('appinstalled',()=>notice('Orbital Empires installed. Play offline!'));
if('serviceWorker' in navigator&&window.location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));

// Boot. Keep game state isolated from the UI — all mechanics live in core.js.
const existing=loadGame();if(existing){activateGame(existing,true);notice('Campaign restored from local save.');}else{activateGame(generateGame({seed:'ORION-47',size:90,opponents:4,difficulty:'normal'}),true);}
applySettings();requestAnimationFrame(draw);
