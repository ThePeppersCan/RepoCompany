import {createJesterKnife} from './jester-knife.js?v=2.16.0';
import {createMonsterKnife,MONSTER_KNIVES} from './monster-knives.js?v=2.16.0';
export const TRANSFORMATION_KNIVES=Object.freeze(['jester',...MONSTER_KNIVES]);
export const hasKnifeTransformation=id=>TRANSFORMATION_KNIVES.includes(id);
export function createKnifeTransformation(id,parent,environment,core){
 const controller=id==='jester'?createJesterKnife(parent,environment,core):createMonsterKnife(id,parent,environment,core);
 if(controller)controller.kind=id;return controller;
}
