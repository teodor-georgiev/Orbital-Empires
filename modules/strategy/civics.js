/* Traditions, unity and mutually exclusive social-policy slots. */
export const TRADITIONS=[
 {id:'frontier-spirit',name:'Frontier Spirit',track:'Expansion',prereqs:[],bonus:'Colonization costs -12%',effects:{colonization:.12}},
 {id:'pathfinders',name:'Star Pathfinders',track:'Expansion',prereqs:['frontier-spirit'],bonus:'Fleet strength +8%',effects:{fleet:.08}},
 {id:'settlers-covenant',name:"Settlers' Covenant",track:'Expansion',prereqs:['pathfinders'],bonus:'Influence +15%',effects:{influence:.15}},
 {id:'merchant-leagues',name:'Merchant Leagues',track:'Prosperity',prereqs:[],bonus:'Credits +12%',effects:{credits:.12}},
 {id:'orbital-artisans',name:'Orbital Artisans',track:'Prosperity',prereqs:['merchant-leagues'],bonus:'Alloys +12%',effects:{alloys:.12}},
 {id:'golden-age',name:'Golden Age',track:'Prosperity',prereqs:['orbital-artisans'],bonus:'Credits and unity +10%',effects:{credits:.10,unity:.10}},
 {id:'scientific-method',name:'Scientific Method',track:'Discovery',prereqs:[],bonus:'Science +12%',effects:{science:.12}},
 {id:'living-archives',name:'Living Archives',track:'Discovery',prereqs:['scientific-method'],bonus:'Unity +20%',effects:{unity:.2}},
 {id:'cosmic-insight',name:'Cosmic Insight',track:'Discovery',prereqs:['living-archives'],bonus:'Science +18%',effects:{science:.18}}
];
export const POLICIES=[
 {id:'open-markets',name:'Open Markets',slot:'Economy',bonus:'Credits +16%',effects:{credits:.16},description:'Promote private interstellar trade.'},
 {id:'directed-industry',name:'Directed Industry',slot:'Economy',bonus:'Alloys +16%',effects:{alloys:.16},description:'Prioritize strategic industrial capacity.'},
 {id:'academic-freedom',name:'Academic Freedom',slot:'Society',bonus:'Science +14%',effects:{science:.14},description:'Protect independent research institutions.'},
 {id:'civic-service',name:'Civic Service',slot:'Society',bonus:'Unity +18%',effects:{unity:.18},description:'Build common purpose across the colonies.'},
 {id:'fleet-doctrine',name:'Fleet Doctrine',slot:'Defense',bonus:'Fleet power +12%',effects:{fleet:.12},description:'Place military readiness first.'},
 {id:'diplomatic-corps',name:'Diplomatic Corps',slot:'Defense',bonus:'Influence +16%',effects:{influence:.16},description:'Project power through diplomacy.'}
];
export function civicBonuses(emp){
 const ids=[...(Array.isArray(emp?.traditions)?emp.traditions:[]),...(Array.isArray(emp?.policies)?emp.policies:[])];
 const sum={credits:0,alloys:0,science:0,influence:0,fleet:0,colonization:0,unity:0};
 for(const id of ids){const item=TRADITIONS.find(t=>t.id===id)||POLICIES.find(t=>t.id===id);if(item)for(const [key,value] of Object.entries(item.effects))sum[key]+=value;}
 return sum;
}
export function traditionCost(emp){const n=Array.isArray(emp?.traditions)?emp.traditions.length:0;return 32+24*n+Math.floor(n/3)*12;}
export function unityIncome(game,owner=0){
 const emp=game.empires[owner];if(!emp)return 0;
 const colonies=game.systems.filter(s=>s.owner===owner);
 const basic=colonies.reduce((n,s)=>n+3+(s.capital?3:0),0);
 const bonus=civicBonuses(emp).unity+(emp.techs?.includes('culture-networks')?.2:0);
 return Math.round(basic*(1+bonus));
}
export function canAdoptTradition(game,id){
 const emp=game.empires[0],item=TRADITIONS.find(t=>t.id===id);
 if(!item)return {ok:false,message:'Unknown tradition.'};
 if((emp.traditions||[]).includes(id))return {ok:false,message:'Tradition already adopted.'};
 if(!item.prereqs.every(p=>(emp.traditions||[]).includes(p)))return {ok:false,message:'Unlock preceding traditions first.'};
 if((emp.unity||0)<traditionCost(emp))return {ok:false,message:'Not enough unity.'};
 return {ok:true,message:'Tradition available.'};
}
export function canEnactPolicy(game,id){
 const emp=game.empires[0],item=POLICIES.find(p=>p.id===id);
 if(!item)return {ok:false,message:'Unknown social policy.'};
 if((emp.policies||[]).includes(id))return {ok:false,message:'Policy already in force.'};
 if(emp.influence<20)return {ok:false,message:'Not enough influence (20 required).'};
 return {ok:true,message:'Policy available.'};
}
