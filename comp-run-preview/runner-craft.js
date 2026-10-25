import * as THREE from './vendor/three.module.js?v=2.15.0';

const clamp=THREE.MathUtils.clamp;

// The display actors use rigid bone groups. Static details are merged within
// each bone/material, so stitching and plates do not each cost a draw call.
export function finishRunnerBuild(group,resources){
  const parents=[];group.traverse(o=>{if(!o.isMesh)parents.push(o);});
  for(const parent of parents){
    const batches=new Map();
    for(const mesh of parent.children){
      if(!mesh.isMesh||mesh.isSkinnedMesh||Array.isArray(mesh.material)||mesh.userData.keepSeparate)continue;
      const list=batches.get(mesh.material)||[];list.push(mesh);batches.set(mesh.material,list);
    }
    for(const [material,meshes] of batches){
      if(meshes.length<2)continue;
      const positions=[],normals=[],uvs=[],indices=[];
      let offset=0;
      for(const mesh of meshes){
        mesh.updateMatrix();const geometry=mesh.geometry.clone().applyMatrix4(mesh.matrix);
        const p=geometry.getAttribute('position'),n=geometry.getAttribute('normal'),uv=geometry.getAttribute('uv');
        for(let i=0;i<p.count;i++){
          positions.push(p.getX(i),p.getY(i),p.getZ(i));
          normals.push(n?.getX(i)??0,n?.getY(i)??1,n?.getZ(i)??0);
          uvs.push(uv?.getX(i)||0,uv?.getY(i)||0);
        }
        if(geometry.index)for(let i=0;i<geometry.index.count;i++)indices.push(offset+geometry.index.getX(i));
        else for(let i=0;i<p.count;i++)indices.push(offset+i);
        offset+=p.count;geometry.dispose();mesh.removeFromParent();
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      g.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setIndex(indices);
      g.computeBoundingSphere();g.computeBoundingBox();resources.add(g);
      const mesh=new THREE.Mesh(g,material);mesh.name=parent.name+' / '+(material.name||'tailoring');mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
    }
  }
  const used=new Set();let drawCalls=0,triangles=0;
  group.traverse(o=>{if(o.isMesh){used.add(o.geometry);drawCalls++;triangles+=(o.geometry.index?.count||o.geometry.getAttribute('position').count)/3;}});
  for(const r of [...resources])if(r.isBufferGeometry&&!used.has(r)){r.dispose();resources.delete(r);}
  group.userData.renderStats={drawCalls,triangles};return group.userData.renderStats;
}

export function createRunnerAnimator({group,hips,chest,head,arms,legs,secondary=[]}){
  let blend=0,previousTime=0;
  const update=(time,{gait='idle',speed=0,look=0,travel,motion=true}={})=>{
    const dt=clamp(time-previousTime,0,.1);previousTime=time;
    const moving=gait==='run'||gait==='walk',target=moving?1:0;
    blend+=(target-blend)*(1-Math.exp(-dt*9));if(time===0)blend=target;
    const run=gait==='run',cadence=run?2.55:1.12,stance=run?.4:.62;
    const groundSpeed=clamp(speed||1.2,.2,run?5.8:1.8),stride=clamp(groundSpeed/group.scale.x/cadence*stance,.1,run?.85:.68);
    const phase=(Number.isFinite(travel)?travel/(groundSpeed/cadence):time*cadence)*Math.PI*2,lean=(run?.17:.025)*blend;
    hips.position.y=.875+(run?-.10:-.023)*blend+Math.cos(phase*2)*(run?.026:.008)*blend;
    hips.rotation.y=Math.sin(phase)*.035*blend;
    chest.rotation.set(-lean,-Math.sin(phase)*.06*blend,Math.sin(phase)*.025*blend);
    chest.scale.y=1+(motion?Math.sin(time*1.7)*.0025:0)*(1-blend);
    head.rotation.set(lean*.5+(motion?Math.sin(time*.65)*.012:0)*(1-blend),clamp(look,-.65,.65),0);
    for(const l of legs){
      const u=((phase/(Math.PI*2)+(l.side<0?.5:0))%1+1)%1,swing=clamp((u-stance)/(1-stance),0,1);
      const z=u<stance?-stride/2+stride*u/stance:stride/2-stride*(swing*swing*(3-2*swing));
      const lift=u<stance?0:Math.sin(swing*Math.PI)*(run?.24:.105),h=hips.position.y-.045-(.061+lift)*blend;
      const reach=clamp(Math.hypot(h,z*blend),.08,.768),bend=Math.acos(clamp((reach*reach-.385*.385*2)/(.385*.385*2),-1,1));
      l.hip.rotation.set((Math.atan2(-z*blend,h)+bend*.5)*blend,0,0);l.knee.rotation.set(-bend*blend,0,0);
      l.ankle.rotation.set(-l.hip.rotation.x-l.knee.rotation.x+(u<stance&&u>stance*.7?-.2*(u/stance-.7)/.3:0)*blend,0,0);
    }
    for(const a of arms){
      const leg=legs.find(l=>l.side===a.side);
      a.shoulder.rotation.set(-leg.hip.rotation.x*.8+(-.06+a.side*.035)*(1-blend),0,a.side*(.065+(motion?Math.sin(time*.9)*.006:0)*(1-blend)));
      a.elbow.rotation.set(.13+(run?1.05:.28)*blend,0,0);a.hand.rotation.set(.04,0,0);
    }
    if(gait==='brace'){
      hips.position.y=.82;chest.rotation.x=-.16;head.rotation.x=.16;
      for(const a of arms){a.shoulder.rotation.x=a.side<0?1.1:.25;a.shoulder.rotation.z=a.side*.17;a.elbow.rotation.x=a.side<0?1.15:.7;}
      for(const l of legs){l.hip.rotation.x=.35;l.knee.rotation.x=-.7;l.ankle.rotation.x=.35;}
    }else if(gait==='fall'||gait==='jump'||gait==='air'){
      chest.rotation.x=-.12;for(const a of arms){a.shoulder.rotation.x=.65;a.shoulder.rotation.z=a.side*.45;a.elbow.rotation.x=.55;}
      for(const l of legs){l.hip.rotation.x=.3+l.side*.2;l.knee.rotation.x=-.7;l.ankle.rotation.x=.2;}
    }
    if(gait==='look-back'){head.rotation.y=-.7;chest.rotation.y=-.2;}
    // Secondary pieces are attached to bones, never world-space billboards.
    for(const p of secondary){
      const k=p.object,amount=motion?1:0,phaseOffset=p.phase||0;
      k.rotation.x=p.x+(Math.sin(time*(p.rate||1.3)+phaseOffset)*(p.idle||.012)*(1-blend)+Math.sin(phase+phaseOffset)*(p.run||.055)*blend)*amount;
      k.rotation.z=(p.z||0)+(Math.sin(time*.9+phaseOffset)*.008*(1-blend)+Math.cos(phase+phaseOffset)*.018*blend)*amount;
    }
    group.userData.animation={gait,blend,phase};return gait;
  };
  update(0);return update;
}

// Small deterministic material maps are shared by all surfaces of one actor.
export function createRunnerWorkshop({hero=true}={}){
  const resources=new Set(),textures=[],sides=hero?20:12;
  const makeMap=(kind)=>{
    const n=128,d=new Uint8Array(n*n*4);let seed=716534;
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;const noise=seed/4294967295;
      const grain=kind==='weave'?(x%4===0?18:0)+(y%4===0?11:0):kind==='grain'?Math.sin(y*.19+x*.014)*11:0;
      const v=clamp(234+noise*18-grain,0,255),i=(y*n+x)*4;d[i]=d[i+1]=d[i+2]=v;d[i+3]=255;
    }
    const t=new THREE.DataTexture(d,n,n);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(2,2);t.needsUpdate=true;textures.push(t);return t;
  };
  const weave=makeMap('weave'),grain=makeMap('grain');
  const material=(name,color,{roughness=.72,metalness=0,texture=null,emissive=null,intensity=0,clearcoat=0}={})=>{
    const props={color,roughness,metalness,map:texture==='cloth'?weave:texture==='grain'?grain:null,bumpMap:texture==='cloth'?weave:texture==='grain'?grain:null,bumpScale:texture==='cloth'?.0016:.001};
    if(emissive){props.emissive=emissive;props.emissiveIntensity=intensity;}
    const m=clearcoat?new THREE.MeshPhysicalMaterial({...props,clearcoat,clearcoatRoughness:.28}):new THREE.MeshStandardMaterial(props);m.name=name;resources.add(m);return m;
  };
  const group=(parent,name,x=0,y=0,z=0)=>{const o=new THREE.Group();o.name=name;o.position.set(x,y,z);parent?.add(o);return o;};
  const add=(parent,g,m,x=0,y=0,z=0)=>{resources.add(g);const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;};
  const ell=(parent,m,x,y,z,rx,ry,rz,faceted=false)=>{const o=add(parent,new THREE.SphereGeometry(1,faceted?8:hero?20:12,faceted?6:hero?14:8),m,x,y,z);o.scale.set(rx,ry,rz);return o;};
  const box=(parent,m,x,y,z,w,h,d)=>add(parent,new THREE.BoxGeometry(w,h,d),m,x,y,z);
  const tube=(parent,m,points,r=.008)=>add(parent,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),hero?Math.max(12,points.length*4):8,r,hero?7:5,false),m);
  const ring=(parent,m,x,y,z,r,t=.008,arc=Math.PI*2)=>add(parent,new THREE.TorusGeometry(r,t,hero?8:5,hero?36:20,arc),m,x,y,z);
  const rod=(parent,m,a,b,r=.01)=>{const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),d=vb.clone().sub(va);const o=add(parent,new THREE.CylinderGeometry(r,r,d.length(),hero?10:6),m,...va.clone().add(vb).multiplyScalar(.5).toArray());o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;};
  const loft=(parent,m,rings,{power=1,segments=sides}={})=>{
    const pos=[],uv=[],idx=[];
    for(let row=0;row<rings.length;row++)for(let i=0;i<=segments;i++){
      const [y,rx,rz,cx=0,cz=0]=rings[row],angle=i/segments*Math.PI*2,c=Math.cos(angle),s=Math.sin(angle);
      pos.push(cx+Math.sign(c)*Math.pow(Math.abs(c),power)*rx,y,cz+Math.sign(s)*Math.pow(Math.abs(s),power)*rz);uv.push(i/segments,row/(rings.length-1));
    }
    const up=rings.at(-1)[0]>=rings[0][0];
    for(let row=0;row<rings.length-1;row++)for(let i=0;i<segments;i++){const a=row*(segments+1)+i,b=a+segments+1;idx.push(...(up?[a,b,a+1,b,b+1,a+1]:[a,a+1,b,b,a+1,b+1]));}
    for(const row of [0,rings.length-1]){const[y,,,cx=0,cz=0]=rings[row],c=pos.length/3;pos.push(cx,y,cz);uv.push(.5,.5);for(let i=0;i<segments;i++){const a=row*(segments+1)+i;idx.push(c,...((row===0)===up?[a,a+1]:[a+1,a]));}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return add(parent,g,m);
  };
  const plate=(parent,m,outline,depth=.009)=>{
    const shape=new THREE.Shape();outline.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
    const g=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSegments:hero?2:1,bevelSize:.0035,bevelThickness:.0035,curveSegments:8});return add(parent,g,m);
  };
  const dispose=()=>{for(const r of resources)r.dispose();for(const t of textures)t.dispose();};
  return{resources,textures,sides,material,group,add,ell,box,tube,ring,rod,loft,plate,dispose};
}
