/* Pure deterministic shortest hyperlane routing (no gameplay state mutations). */
export function findHyperlaneRoute(systems,start,target,mayEnter=()=>true){
 if(!Array.isArray(systems)||!Number.isInteger(start)||!Number.isInteger(target)||!systems[start]||!systems[target])return null;
 if(start===target)return [];
 const parents=new Map([[start,null]]),pending=[start];
 for(let cursor=0;cursor<pending.length;cursor++){
  const origin=pending[cursor];
  for(const next of systems[origin].neighbors||[]){
   if(!Number.isInteger(next)||!systems[next]||parents.has(next)||!mayEnter(next,origin))continue;
   parents.set(next,origin);
   if(next===target){
    const route=[];
    for(let at=target;at!==start;at=parents.get(at))route.unshift(at);
    return route;
   }
   pending.push(next);
  }
 }
 return null;
}
