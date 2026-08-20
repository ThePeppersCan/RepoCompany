const fs=require('fs');
const src=fs.readFileSync(__dirname+'/dragonbound-baby-engine.js','utf8');
const regText=src.match(/const REGISTRY=(\{.*?\});\n  const BREED_BY_DISPLAY=/s)?.[1];
const houseText=src.match(/const HOUSE_MAPS=(\{.*?\});\n\n  const STORAGE_KEY=/s)?.[1];
if(!regText||!houseText) throw new Error('Could not extract registries');
const REGISTRY=eval('('+regText+')');
const HOUSE_MAPS=eval('('+houseText+')');
const pointInPoly=(p,poly)=>{let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const [xi,yi]=poly[i],[xj,yj]=poly[j];const hit=((yi>p[1])!==(yj>p[1]))&&(p[0]<(xj-xi)*(p[1]-yi)/((yj-yi)||1e-9)+xi);if(hit)inside=!inside;}return inside;};
const isWalkable=(map,floorId,p)=>{const floor=map.floors.find(f=>f.id===floorId);return floor&&floor.walkableZones.some(poly=>pointInPoly(p,poly))&&!map.blockedZones.some(poly=>pointInPoly(p,poly));};
const errors=[];
const semantics=['idle','look','walk','sit','rest','sleep','takeOff','fly','land'];
for(const [id,d] of Object.entries(REGISTRY)){
  for(const s of semantics){if(!d.animations[s]?.frames?.length)errors.push(`${id}: missing ${s}`);for(const f of d.animations[s]?.frames||[]){const path=__dirname+'/'+f.src;if(!fs.existsSync(path))errors.push(`${id}: missing frame ${path}`);}}
}
for(const [hid,m] of Object.entries(HOUSE_MAPS)){
  if(!m.floors.length)errors.push(`${hid}: no floors`);
  for(const sp of m.spawnPoints)if(!isWalkable(m,sp.floorId,sp.p))errors.push(`${hid}: bad spawn ${sp.floorId} ${sp.p}`);
  for(const st of m.stairConnections){if(!m.floors.some(f=>f.id===st.fromFloor)||!m.floors.some(f=>f.id===st.toFloor))errors.push(`${hid}: bad stair floor ids`);const pts=[st.entrancePoint,...st.climbingWaypoints,st.exitPoint,...st.reverseWaypoints];for(const p of pts)if(p.some(v=>v<0||v>1))errors.push(`${hid}: stair point outside normalized coords`);}
}
let combos=0;for(const d of Object.keys(REGISTRY))for(const h of Object.keys(HOUSE_MAPS)){combos++;const m=HOUSE_MAPS[h],sp=m.spawnPoints[0];if(!isWalkable(m,sp.floorId,sp.p))errors.push(`${d} x ${h}: invalid spawn`);}
// seeded target sampling from each floor: vertices-midpoint based deterministic checks
let targetChecks=0;
for(const [hid,m] of Object.entries(HOUSE_MAPS))for(const floor of m.floors)for(const poly of floor.walkableZones){let cx=0,cy=0;poly.forEach(p=>{cx+=p[0];cy+=p[1]});cx/=poly.length;cy/=poly.length;targetChecks++;if(!pointInPoly([cx,cy],poly))errors.push(`${hid}/${floor.id}: centroid outside polygon`);}
console.log(JSON.stringify({breedCount:Object.keys(REGISTRY).length,houseCount:Object.keys(HOUSE_MAPS).length,combinationCount:combos,targetChecks,errors},null,2));
if(errors.length)process.exit(1);
