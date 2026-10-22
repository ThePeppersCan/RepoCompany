// Read from the currently published game's player-facing practice guide on
// 18 October 2026. The live entry loads both sources below. Keep these pins;
// do not infer encounter facts from art, unused files, or a member's claim.
export const FINAL_BOSS_SOURCES=Object.freeze([
  {id:'morogue-finale-guide',external:true,url:'https://morogue.repocompany.uk/interface/vampire-survivor/finale.js',entry:'https://morogue.repocompany.uk/',sha256:'bc5367a3321e03bae181a8c78d717ee6c470b880188a2d06b1235e61e8e3f703'},
  {id:'morogue-finale-practice',external:true,url:'https://repocompany.uk/game-integrations/morogue/relics-20261015/app.js?v=caa9a1f26ae0',entry:'https://morogue.repocompany.uk/',sha256:'caa9a1f26ae0d1ad5798d7ee1464883f9abc6a95a2c9605ee4c80002f8db0998'}
]);
export const FINAL_BOSS_FACTS=Object.freeze([
  {
    id:'morogue-boss-guide-uncrowned',product:'morogue',spoiler:true,
    topics:['final boss','final adversary','uncrowned','boss','tips','help','complete','beat','defeat','strategy','counterplay','phase','climb','ascent','chains','gaze'],
    requiredTopics:['final boss','final adversary','uncrowned'],
    sourceIds:['morogue-finale-guide','morogue-finale-practice'],title:'Morogue — The Uncrowned combat guide',url:'/Morogue',
    text:'For The Uncrowned, focus on creating attack openings and keeping a safe route. The main things to practise are:\n\n'+
      '• Chains: break both anchors while avoiding the pursuing hand. This exposes the moving heart; it can still hurt you while exposed.\n'+
      '• Gaze: stand on the gold seal until the beam locks, then sidestep. The overloaded seal breaks the crown and gives you an attack opening.\n'+
      '• Crown fans: move into the empty lane as it changes sides. Standing in the aimed centre is unsafe. For the curved hand sweep, stay inside its reach or cross behind the fingers.\n'+
      '• Ruin March: use the gold landing markers for the six collapsing crossings. Aim toward the next island and dash to leap; completing a crossing restores a dash.\n'+
      '• Final act: bait a raised limb, leave its locked shadow, then hit the joints braced in gold. Break all four wrist/ankle joints; those breaks are permanent. Then shatter the lowered mask.\n'+
      '• Ascent: clear each landing by dodging sweeps and rib pulses, breaking the bindings and countering the crown knight. Space/Shift dodges during the encounter and jumps when the next landing settles. Steer in the air and walk across the released cloth bridge. A hit or fall returns you to the last secure foothold and costs health; broken joints stay broken. Attack at the crown to finish.\n\n'+
      'Boss practice lets you select The Uncrowned and a phase without spending coins or affecting run records. Which part is catching you: the chains/gaze, the crossings, or the final climb?'
  }
]);
