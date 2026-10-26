import * as THREE from './vendor/three.module.js?v=2.16.0';
import {createKnife} from './knife-models.js?v=2.16.0';
import {normalizeKnifeSelection} from './knife-catalog.js?v=2.16.0';

/** The same knife geometry and finish used by first-person and shop previews. */
export function withRunnerEquipment(actor){
 let model=null,selection=null,disposed=false;
 const update=actor.update,dispose=actor.dispose;
 const socket=new THREE.Group();socket.name='Equipped knife grip';socket.position.set(-.024,-.067,-.064);socket.rotation.set(0,0,Math.PI/2);
 actor.anatomy.bones['hand.R'].add(socket);
 actor.setKnife=value=>{
  if(disposed)return;
  if(value===null){model?.dispose();model=null;selection=null;return;}
  const next=normalizeKnifeSelection(value);
  if(model&&next.knifeId===selection.knifeId){model.setFinish(next.finishId);selection=next;return;}
  model?.dispose();model=createKnife(next);selection=next;socket.add(model.group);model.pose({});
 };
 actor.update=(time,state={})=>{
  if(disposed)return;
  const visible=!!model&&state.knife!==false;socket.visible=visible;
  const gait=update(time,{...state,knife:visible});
  if(visible){actor.group.updateMatrixWorld(true);model.updateFinish(time,{reducedMotion:state.motion===false,effects:state.effects||'full',inspect:0});}
  return gait;
 };
 actor.dispose=()=>{if(disposed)return;disposed=true;model?.dispose();socket.removeFromParent();dispose();};
 return actor;
}
