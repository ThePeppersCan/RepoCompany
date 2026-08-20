const fs=require('fs');
const src=fs.readFileSync(__dirname+'/dragonbound-baby-engine.js','utf8');
const REGISTRY=eval('('+src.match(/const REGISTRY=(\{.*?\});\n  const BREED_BY_DISPLAY=/s)[1]+')');
const HOUSE_MAPS=eval('('+src.match(/const HOUSE_MAPS=(\{.*?\});\n\n  const STORAGE_KEY=/s)[1]+')');
const pointInPoly=(p,poly)=>{let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i],[xj,yj]=poly[j];const hit=((yi>p[1])!==(yj>p[1]))&&(p[0]<(xj-xi)*(p[1]-yi)/((yj-yi)||1e-9)+xi);if(hit)inside=!inside;}return inside;};
const orient=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const segIntersect=(a,b,c,d)=>{const o1=orient(a,b,c),o2=orient(a,b,d),o3=orient(c,d,a),o4=orient(c,d,b);return ((o1>0)!==(o2>0))&&((o3>0)!==(o4>0));};
const segHitsPoly=(a,b,poly)=>{if(pointInPoly(a,poly)||pointInPoly(b,poly))return true;for(let i=0;i<poly.length;i++)if(segIntersect(a,b,poly[i],poly[(i+1)%poly.length]))return true;return false;};
const clear=(m,a,b)=>!m.blockedZones.some(poly=>segHitsPoly(a,b,poly));
const walkable=(m,fid,p)=>{const f=m.floors.find(f=>f.id===fid);return !!f&&f.walkableZones.some(poly=>pointInPoly(p,poly))&&!m.blockedZones.some(poly=>pointInPoly(p,poly));};
const dist=(m,a,b)=>Math.hypot((b[0]-a[0])*m.width,(b[1]-a[1])*m.height);
function path(m,fid,a,b){if(!walkable(m,fid,b))return[];if(clear(m,a,b))return[b];const f=m.floors.find(f=>f.id===fid),nodes=(f.navigationNodes||[]).filter(p=>walkable(m,fid,p)),pts=[a,...nodes,b],N=pts.length,adj=Array.from({length:N},()=>[]);for(let i=0;i<N;i++)for(let j=i+1;j<N;j++)if(clear(m,pts[i],pts[j])){const w=dist(m,pts[i],pts[j]);adj[i].push([j,w]);adj[j].push([i,w]);}const d=Array(N).fill(Infinity),prev=Array(N).fill(-1),used=Array(N).fill(false);d[0]=0;for(let k=0;k<N;k++){let u=-1;for(let i=0;i<N;i++)if(!used[i]&&(u<0||d[i]<d[u]))u=i;if(u<0||!isFinite(d[u]))break;used[u]=true;if(u===N-1)break;for(const [v,w]of adj[u])if(d[u]+w<d[v]){d[v]=d[u]+w;prev[v]=u;}}if(!isFinite(d[N-1]))return[];const out=[];for(let cur=N-1;cur>0;cur=prev[cur])out.unshift(pts[cur]);return out;}
let seed=1337;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const sample=(poly)=>{let minX=1,maxX=0,minY=1,maxY=0;for(const p of poly){minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);}for(let i=0;i<100;i++){const p=[minX+rnd()*(maxX-minX),minY+rnd()*(maxY-minY)];if(pointInPoly(p,poly))return p;}return poly[0];};
const errors=[];let pathChecks=0,flightChecks=0,stairChecks=0;
for(const [hid,m] of Object.entries(HOUSE_MAPS)){
  for(const f of m.floors){const sp=m.spawnPoints.find(s=>s.floorId===f.id)?.p||sample(f.walkableZones[0]);let cur=sp;for(let i=0;i<1000;i++){const poly=f.walkableZones[Math.floor(rnd()*f.walkableZones.length)];let t=sample(poly);if(!walkable(m,f.id,t)){i--;continue;}const p=path(m,f.id,cur,t);pathChecks++;if(!p.length)errors.push(`${hid}/${f.id}: no path ${cur}->${t}`);else{for(const q of p)if(!walkable(m,f.id,q))errors.push(`${hid}/${f.id}: path waypoint invalid ${q}`);cur=t;}}
  }
  for(const z of m.flightZones){for(let i=0;i<200;i++){const p=sample(z.poly);flightChecks++;if(!pointInPoly(p,z.poly)||m.blockedZones.some(b=>pointInPoly(p,b)))errors.push(`${hid}/${z.floorId}: bad flight sample`);}}
  for(const st of m.stairConnections){stairChecks++;if(!walkable(m,st.fromFloor,st.entrancePoint))errors.push(`${hid}: stair entrance not walkable`);if(!walkable(m,st.toFloor,st.exitPoint))errors.push(`${hid}: stair exit not walkable`);}
}
const combos=Object.keys(REGISTRY).length*Object.keys(HOUSE_MAPS).length;
console.log(JSON.stringify({breeds:Object.keys(REGISTRY).length,houses:Object.keys(HOUSE_MAPS).length,combinations:combos,pathChecks,flightChecks,stairChecks,errorCount:errors.length,errors:errors.slice(0,30)},null,2));
if(errors.length)process.exit(1);
