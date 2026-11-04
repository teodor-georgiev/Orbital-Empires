/* Framing for the player-visible frontier. Rendering and camera gestures remain
 * in app.js; this pure helper only computes the automatic "recenter" view.
 * Unexplored systems must not shrink the known galaxy to an unreadable knot.
 */
export function fitKnownGalaxy({systems=[],visibleIds=new Set(),width=1,height=1,world}){
  const w=Math.max(1,Number(width)||1),h=Math.max(1,Number(height)||1);
  const fallback={
    cx:world.width/2,cy:world.height/2,
    zoom:Math.max(.23,Math.min(3,Math.min(w/(world.width+75),h/(world.height+60))*1.03))
  };
  const known=systems.filter(s=>visibleIds.has(s.id)&&Number.isFinite(s.x)&&Number.isFinite(s.y));
  if(!known.length)return fallback;
  let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
  for(const star of known){
    left=Math.min(left,star.x);right=Math.max(right,star.x);
    top=Math.min(top,star.y);bottom=Math.max(bottom,star.y);
  }
  // Reserve room for star labels and the map's selection rings.
  const extentX=Math.max(260,right-left+180),extentY=Math.max(220,bottom-top+160);
  return {
    cx:(left+right)/2,
    cy:(top+bottom)/2,
    zoom:Math.max(.23,Math.min(3,Math.min(w/extentX,h/extentY)*.93))
  };
}
