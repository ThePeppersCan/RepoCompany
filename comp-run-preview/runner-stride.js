// Original run timing: contact, compression, toe-off, heel recovery, reach.
// Coordinates use the runner's local frame: forward is -Z.
const clamp=x=>Math.max(0,Math.min(1,x));
function curve(keys,u,startSlope,endSlope){
 let k=0;while(k<keys.length-2&&u>keys[k+1][0])k++;
 const [a,av]=keys[k],[b,bv]=keys[k+1],span=b-a,t=clamp((u-a)/span);
 const slope=i=>i===0?startSlope??(keys[1][1]-keys[0][1])/(keys[1][0]-keys[0][0]):i===keys.length-1?endSlope??(keys[i][1]-keys[i-1][1])/(keys[i][0]-keys[i-1][0]):(keys[i+1][1]-keys[i-1][1])/(keys[i+1][0]-keys[i-1][0]);
 return (2*t**3-3*t*t+1)*av+(t**3-2*t*t+t)*span*slope(k)+(-2*t**3+3*t*t)*bv+(t**3-t*t)*span*slope(k+1);
}
export const RUN_STANCE=.27;
export function runStride(u,stride){
 const stance=RUN_STANCE,ground=u<stance;
 const z=ground?stride*(-.36+u/stance):stride*curve([[stance,.64],[.38,.65],[.53,.15],[.68,-.34],[.84,-.60],[1,-.36]],u,1/stance,1/stance);
 const lift=ground?0:Math.max(0,curve([[stance,0],[.38,.40],[.52,.45],[.68,.29],[.84,.09],[1,0]],u,1.8,0));
 const pitch=ground?-.95*clamp((u-stance*.46)/(stance*.54))**2:curve([[stance,-.95],[.40,-1.02],[.57,-.42],[.76,.10],[.90,.06],[1,0]],u,0,0);
 // Rotate around the planted forefoot during push-off, rather than rotating
 // the shoe about its ankle and dragging the toe through the floor.
 return {z,lift,pitch,ground};
}
export function runPelvis(u){
 const step=(u*2)%1;
 return curve([[0,-.047],[.20,-.072],[.52,-.018],[.76,.020],[1,-.047]],step,-.12,-.12);
}
export function runArm(u,holding){
 const swing=curve([[0,-.62],[.20,.02],[.38,.78],[.55,.58],[.76,-.18],[.90,-.65],[1,-.62]],u,.55,.55);
 const elbow=.80+Math.max(0,swing)*.57;
 // The knife arm carries across the front of the body like the viewmodel;
 // letting it use the free arm's full backswing drives the blade into a thigh.
 return {swing:holding?.26+swing*.20:swing,elbow:holding?1.10+Math.max(0,swing)*.16:elbow};
}
