/* Velmora Dragonbound — autonomous baby dragon engine V34.05.1 Starter House Expansion */
(()=>{
  'use strict';
  const REGISTRY={"vardesh":{"breedId":"vardesh","displayName":"Vardesh","sourceSheet":"01 Vardesh Baby Dragon Animations.png","nativeFacing":"right","renderedScale":0.78,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.408,"sleepiness":0.722,"playfulness":0.617,"flightLikelihood":0.47,"walkingSpeedMultiplier":0.979},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/vardesh/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/vardesh/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/vardesh/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/vardesh/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/vardesh/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/vardesh/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/vardesh/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/vardesh/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/vardesh/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/vardesh/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/vardesh/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/vardesh/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/vardesh/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/vardesh/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/vardesh/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/vardesh/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/vardesh/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/vardesh/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/vardesh/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"lumerre":{"breedId":"lumerre","displayName":"Lumerre","sourceSheet":"02_Lumerre_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.64,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.576,"sleepiness":0.598,"playfulness":0.591,"flightLikelihood":0.533,"walkingSpeedMultiplier":0.971},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/lumerre/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/lumerre/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/lumerre/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/lumerre/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/lumerre/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/lumerre/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/lumerre/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/lumerre/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/lumerre/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/lumerre/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/lumerre/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/lumerre/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/lumerre/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/lumerre/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/lumerre/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/lumerre/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/lumerre/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/lumerre/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/lumerre/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"kordesh":{"breedId":"kordesh","displayName":"Kordesh","sourceSheet":"03_Kordesh_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.605,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.441,"sleepiness":0.393,"playfulness":0.688,"flightLikelihood":0.551,"walkingSpeedMultiplier":1.042},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/kordesh/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/kordesh/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/kordesh/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/kordesh/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/kordesh/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/kordesh/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/kordesh/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/kordesh/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/kordesh/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/kordesh/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/kordesh/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/kordesh/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/kordesh/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/kordesh/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/kordesh/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/kordesh/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/kordesh/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/kordesh/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/kordesh/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"nambara":{"breedId":"nambara","displayName":"Nambara","sourceSheet":"04_Nambara_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.559,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.505,"sleepiness":0.64,"playfulness":0.361,"flightLikelihood":0.425,"walkingSpeedMultiplier":1.058},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/nambara/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/nambara/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/nambara/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/nambara/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/nambara/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/nambara/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/nambara/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/nambara/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/nambara/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/nambara/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/nambara/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/nambara/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/nambara/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/nambara/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/nambara/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/nambara/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/nambara/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/nambara/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/nambara/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"norveth":{"breedId":"norveth","displayName":"Norveth","sourceSheet":"05_Norveth_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.612,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.688,"sleepiness":0.389,"playfulness":0.446,"flightLikelihood":0.462,"walkingSpeedMultiplier":1.019},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/norveth/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/norveth/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/norveth/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/norveth/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/norveth/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/norveth/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/norveth/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/norveth/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/norveth/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/norveth/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/norveth/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/norveth/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/norveth/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/norveth/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/norveth/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/norveth/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/norveth/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/norveth/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/norveth/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"zafran":{"breedId":"zafran","displayName":"Zafran","sourceSheet":"06_Zafran_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.78,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.409,"sleepiness":0.412,"playfulness":0.376,"flightLikelihood":0.316,"walkingSpeedMultiplier":0.994},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/zafran/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/zafran/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/zafran/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/zafran/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/zafran/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/zafran/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/zafran/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/zafran/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/zafran/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/zafran/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/zafran/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/zafran/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/zafran/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/zafran/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/zafran/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/zafran/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/zafran/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/zafran/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/zafran/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"elvane":{"breedId":"elvane","displayName":"Elvane","sourceSheet":"07_Elvane_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.623,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.731,"sleepiness":0.673,"playfulness":0.591,"flightLikelihood":0.468,"walkingSpeedMultiplier":1.008},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/elvane/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/elvane/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/elvane/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/elvane/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/elvane/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/elvane/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/elvane/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/elvane/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/elvane/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/elvane/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/elvane/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/elvane/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/elvane/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/elvane/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/elvane/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/elvane/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/elvane/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/elvane/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/elvane/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"qasmir":{"breedId":"qasmir","displayName":"Qasmir","sourceSheet":"08_Qasmir_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.692,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.533,"sleepiness":0.6,"playfulness":0.636,"flightLikelihood":0.612,"walkingSpeedMultiplier":1.062},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/qasmir/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/qasmir/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/qasmir/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/qasmir/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/qasmir/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/qasmir/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/qasmir/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/qasmir/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/qasmir/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/qasmir/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/qasmir/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/qasmir/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/qasmir/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/qasmir/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/qasmir/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/qasmir/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/qasmir/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/qasmir/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/qasmir/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"calvora":{"breedId":"calvora","displayName":"Calvora","sourceSheet":"09_Calvora_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.694,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.752,"sleepiness":0.636,"playfulness":0.499,"flightLikelihood":0.336,"walkingSpeedMultiplier":1.035},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/calvora/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/calvora/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/calvora/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/calvora/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/calvora/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/calvora/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/calvora/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/calvora/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/calvora/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/calvora/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/calvora/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/calvora/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/calvora/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/calvora/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/calvora/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/calvora/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/calvora/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/calvora/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/calvora/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"rovarn":{"breedId":"rovarn","displayName":"Rovarn","sourceSheet":"10_Rovarn_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.778,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.656,"sleepiness":0.408,"playfulness":0.515,"flightLikelihood":0.567,"walkingSpeedMultiplier":0.971},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/rovarn/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/rovarn/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/rovarn/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/rovarn/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/rovarn/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/rovarn/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/rovarn/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/rovarn/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/rovarn/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/rovarn/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/rovarn/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/rovarn/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/rovarn/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/rovarn/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/rovarn/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/rovarn/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/rovarn/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/rovarn/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/rovarn/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"talune":{"breedId":"talune","displayName":"Talune","sourceSheet":"11_Talune_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.574,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.488,"sleepiness":0.532,"playfulness":0.541,"flightLikelihood":0.504,"walkingSpeedMultiplier":0.979},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/talune/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/talune/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/talune/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/talune/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/talune/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/talune/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/talune/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/talune/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/talune/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/talune/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/talune/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/talune/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/talune/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/talune/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/talune/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/talune/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/talune/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/talune/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/talune/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"drazhen":{"breedId":"drazhen","displayName":"Drazhen","sourceSheet":"12_Drazhen_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.554,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.396,"sleepiness":0.705,"playfulness":0.594,"flightLikelihood":0.443,"walkingSpeedMultiplier":0.958},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/drazhen/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/drazhen/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/drazhen/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/drazhen/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/drazhen/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/drazhen/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/drazhen/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/drazhen/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/drazhen/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/drazhen/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/drazhen/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/drazhen/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/drazhen/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/drazhen/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/drazhen/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/drazhen/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/drazhen/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/drazhen/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/drazhen/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"belros":{"breedId":"belros","displayName":"Belros","sourceSheet":"13_Belros_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.642,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.465,"sleepiness":0.498,"playfulness":0.494,"flightLikelihood":0.451,"walkingSpeedMultiplier":0.938},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/belros/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/belros/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/belros/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/belros/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/belros/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/belros/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/belros/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/belros/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/belros/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/belros/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/belros/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/belros/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/belros/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/belros/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/belros/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/belros/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/belros/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/belros/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/belros/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"marovar":{"breedId":"marovar","displayName":"Marovar","sourceSheet":"14_Marovar_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.648,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.531,"sleepiness":0.53,"playfulness":0.496,"flightLikelihood":0.426,"walkingSpeedMultiplier":1.048},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/marovar/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/marovar/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/marovar/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/marovar/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/marovar/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/marovar/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/marovar/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/marovar/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/marovar/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/marovar/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/marovar/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/marovar/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/marovar/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/marovar/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/marovar/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/marovar/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/marovar/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/marovar/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/marovar/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"sorevia":{"breedId":"sorevia","displayName":"Sorevia","sourceSheet":"15_Sorevia_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.579,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.542,"sleepiness":0.547,"playfulness":0.52,"flightLikelihood":0.453,"walkingSpeedMultiplier":1.069},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/sorevia/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/sorevia/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/sorevia/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/sorevia/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/sorevia/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/sorevia/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/sorevia/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/sorevia/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/sorevia/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/sorevia/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/sorevia/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/sorevia/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/sorevia/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/sorevia/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/sorevia/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/sorevia/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/sorevia/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/sorevia/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/sorevia/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"iskandar":{"breedId":"iskandar","displayName":"Iskandar","sourceSheet":"16_Iskandar_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.552,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.683,"sleepiness":0.463,"playfulness":0.599,"flightLikelihood":0.329,"walkingSpeedMultiplier":1.056},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/iskandar/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/iskandar/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/iskandar/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/iskandar/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/iskandar/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/iskandar/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/iskandar/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/iskandar/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/iskandar/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/iskandar/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/iskandar/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/iskandar/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/iskandar/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/iskandar/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/iskandar/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/iskandar/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/iskandar/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/iskandar/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/iskandar/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"blackglass-coast":{"breedId":"blackglass-coast","displayName":"Blackglass Coast","sourceSheet":"17_Blackglass_Coast_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.571,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.675,"sleepiness":0.587,"playfulness":0.474,"flightLikelihood":0.334,"walkingSpeedMultiplier":1.064},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/blackglass-coast/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/blackglass-coast/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/blackglass-coast/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/blackglass-coast/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/blackglass-coast/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/blackglass-coast/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/blackglass-coast/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/blackglass-coast/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/blackglass-coast/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/blackglass-coast/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/blackglass-coast/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/blackglass-coast/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/blackglass-coast/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/blackglass-coast/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/blackglass-coast/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/blackglass-coast/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/blackglass-coast/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/blackglass-coast/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/blackglass-coast/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"skallheim":{"breedId":"skallheim","displayName":"Skallheim","sourceSheet":"18_Skallheim_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.605,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.704,"sleepiness":0.427,"playfulness":0.507,"flightLikelihood":0.537,"walkingSpeedMultiplier":0.923},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/skallheim/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/skallheim/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/skallheim/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/skallheim/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/skallheim/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/skallheim/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/skallheim/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/skallheim/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/skallheim/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/skallheim/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/skallheim/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/skallheim/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/skallheim/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/skallheim/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/skallheim/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/skallheim/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/skallheim/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/skallheim/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/skallheim/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"hestholm-fjord":{"breedId":"hestholm-fjord","displayName":"Hestholm Fjord","sourceSheet":"19_Hestholm_Fjord_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.64,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.614,"sleepiness":0.48,"playfulness":0.699,"flightLikelihood":0.492,"walkingSpeedMultiplier":1.077},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/hestholm-fjord/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/hestholm-fjord/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/hestholm-fjord/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/hestholm-fjord/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/hestholm-fjord/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/hestholm-fjord/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/hestholm-fjord/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/hestholm-fjord/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/hestholm-fjord/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/hestholm-fjord/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/hestholm-fjord/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/hestholm-fjord/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/hestholm-fjord/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/hestholm-fjord/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/hestholm-fjord/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/hestholm-fjord/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/hestholm-fjord/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/hestholm-fjord/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/hestholm-fjord/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"nyrgate-aurora":{"breedId":"nyrgate-aurora","displayName":"Nyrgate Aurora","sourceSheet":"20_Nyrgate_Aurora_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.614,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.738,"sleepiness":0.669,"playfulness":0.578,"flightLikelihood":0.447,"walkingSpeedMultiplier":0.986},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/nyrgate-aurora/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/nyrgate-aurora/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/nyrgate-aurora/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/nyrgate-aurora/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/nyrgate-aurora/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/nyrgate-aurora/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/nyrgate-aurora/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/nyrgate-aurora/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/nyrgate-aurora/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/nyrgate-aurora/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/nyrgate-aurora/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/nyrgate-aurora/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/nyrgate-aurora/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/nyrgate-aurora/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/nyrgate-aurora/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/nyrgate-aurora/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/nyrgate-aurora/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/nyrgate-aurora/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/nyrgate-aurora/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"warmvein-krellhaven":{"breedId":"warmvein-krellhaven","displayName":"Warmvein / Krellhaven","sourceSheet":"21_Warmvein_Krellhaven_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.78,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.662,"sleepiness":0.595,"playfulness":0.501,"flightLikelihood":0.376,"walkingSpeedMultiplier":0.949},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/warmvein-krellhaven/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/warmvein-krellhaven/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/warmvein-krellhaven/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/warmvein-krellhaven/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/warmvein-krellhaven/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/warmvein-krellhaven/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/warmvein-krellhaven/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/warmvein-krellhaven/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/warmvein-krellhaven/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/warmvein-krellhaven/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/warmvein-krellhaven/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/warmvein-krellhaven/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/warmvein-krellhaven/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/warmvein-krellhaven/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/warmvein-krellhaven/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/warmvein-krellhaven/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/warmvein-krellhaven/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/warmvein-krellhaven/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/warmvein-krellhaven/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"aurelia":{"breedId":"aurelia","displayName":"Aurelia","sourceSheet":"22_Aurelia_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.544,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.696,"sleepiness":0.551,"playfulness":0.381,"flightLikelihood":0.542,"walkingSpeedMultiplier":0.931},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/aurelia/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/aurelia/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/aurelia/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/aurelia/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/aurelia/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/aurelia/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/aurelia/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/aurelia/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/aurelia/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/aurelia/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/aurelia/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/aurelia/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/aurelia/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/aurelia/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/aurelia/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/aurelia/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/aurelia/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/aurelia/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/aurelia/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"orsanne":{"breedId":"orsanne","displayName":"Orsanne","sourceSheet":"23_Orsanne_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.571,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.509,"sleepiness":0.496,"playfulness":0.449,"flightLikelihood":0.372,"walkingSpeedMultiplier":1.006},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/orsanne/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/orsanne/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/orsanne/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/orsanne/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/orsanne/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/orsanne/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/orsanne/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/orsanne/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/orsanne/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/orsanne/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/orsanne/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/orsanne/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/orsanne/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/orsanne/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/orsanne/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/orsanne/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/orsanne/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/orsanne/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/orsanne/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"saint-ciro":{"breedId":"saint-ciro","displayName":"Saint Ciro","sourceSheet":"24_Saint_Ciro_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.78,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.609,"sleepiness":0.745,"playfulness":0.471,"flightLikelihood":0.529,"walkingSpeedMultiplier":0.954},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/saint-ciro/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/saint-ciro/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/saint-ciro/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/saint-ciro/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/saint-ciro/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/saint-ciro/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/saint-ciro/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/saint-ciro/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/saint-ciro/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/saint-ciro/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/saint-ciro/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/saint-ciro/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/saint-ciro/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/saint-ciro/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/saint-ciro/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/saint-ciro/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/saint-ciro/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/saint-ciro/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/saint-ciro/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"marenza":{"breedId":"marenza","displayName":"Marenza","sourceSheet":"25_Marenza_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.629,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.419,"sleepiness":0.739,"playfulness":0.641,"flightLikelihood":0.497,"walkingSpeedMultiplier":1.0},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/marenza/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/marenza/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/marenza/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/marenza/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/marenza/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/marenza/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/marenza/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/marenza/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/marenza/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/marenza/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/marenza/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/marenza/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/marenza/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/marenza/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/marenza/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/marenza/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/marenza/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/marenza/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/marenza/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"grand-khor":{"breedId":"grand-khor","displayName":"Grand Khor","sourceSheet":"26_Grand_Khor_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.607,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.475,"sleepiness":0.539,"playfulness":0.569,"flightLikelihood":0.546,"walkingSpeedMultiplier":1.024},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/grand-khor/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/grand-khor/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/grand-khor/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/grand-khor/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/grand-khor/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/grand-khor/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/grand-khor/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/grand-khor/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/grand-khor/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/grand-khor/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/grand-khor/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/grand-khor/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/grand-khor/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/grand-khor/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/grand-khor/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/grand-khor/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/grand-khor/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/grand-khor/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/grand-khor/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"rova-end":{"breedId":"rova-end","displayName":"Rova End","sourceSheet":"27_Rova_End_Baby_Dragon_Animations.png","nativeFacing":"left","renderedScale":0.78,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.534,"sleepiness":0.385,"playfulness":0.585,"flightLikelihood":0.373,"walkingSpeedMultiplier":0.997},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/rova-end/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/rova-end/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/rova-end/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/rova-end/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/rova-end/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/rova-end/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/rova-end/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/rova-end/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/rova-end/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/rova-end/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/rova-end/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/rova-end/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/rova-end/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/rova-end/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/rova-end/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/rova-end/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/rova-end/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/rova-end/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/rova-end/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"zafir-row":{"breedId":"zafir-row","displayName":"Zafir Row","sourceSheet":"28_Zafir_Row_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.611,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.424,"sleepiness":0.76,"playfulness":0.678,"flightLikelihood":0.545,"walkingSpeedMultiplier":1.043},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/zafir-row/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/zafir-row/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/zafir-row/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/zafir-row/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/zafir-row/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/zafir-row/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/zafir-row/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/zafir-row/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/zafir-row/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/zafir-row/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/zafir-row/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/zafir-row/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/zafir-row/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/zafir-row/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/zafir-row/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/zafir-row/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/zafir-row/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/zafir-row/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/zafir-row/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"ossa-mere":{"breedId":"ossa-mere","displayName":"Ossa Mere","sourceSheet":"29_Ossa_Mere_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.489,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.589,"sleepiness":0.401,"playfulness":0.563,"flightLikelihood":0.321,"walkingSpeedMultiplier":0.926},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/ossa-mere/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/ossa-mere/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/ossa-mere/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/ossa-mere/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/ossa-mere/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/ossa-mere/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/ossa-mere/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/ossa-mere/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/ossa-mere/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/ossa-mere/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/ossa-mere/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/ossa-mere/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/ossa-mere/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/ossa-mere/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/ossa-mere/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/ossa-mere/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/ossa-mere/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/ossa-mere/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/ossa-mere/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}},"ashwick-cinderbank":{"breedId":"ashwick-cinderbank","displayName":"Ashwick / Cinderbank","sourceSheet":"30_Ashwick_Cinderbank_Baby_Dragon_Animations.png","nativeFacing":"right","renderedScale":0.604,"footAnchor":{"x":0.5,"y":0.92},"collisionRadius":26,"personality":{"curiosity":0.537,"sleepiness":0.621,"playfulness":0.673,"flightLikelihood":0.319,"walkingSpeedMultiplier":0.946},"animations":{"idle":{"frames":[{"src":"assets/dragonbound/baby-dragons/ashwick-cinderbank/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":true},"look":{"frames":[{"src":"assets/dragonbound/baby-dragons/ashwick-cinderbank/frame-00.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/ashwick-cinderbank/frame-01.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":560,"anchorX":0.5,"anchorY":0.92}],"loop":true},"sit":{"frames":[{"src":"assets/dragonbound/baby-dragons/ashwick-cinderbank/frame-02.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":900,"anchorX":0.5,"anchorY":0.92}],"loop":false},"rest":{"frames":[{"src":"assets/dragonbound/baby-dragons/ashwick-cinderbank/frame-03.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1100,"anchorX":0.5,"anchorY":0.92}],"loop":false},"sleep":{"frames":[{"src":"assets/dragonbound/baby-dragons/ashwick-cinderbank/frame-04.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":1200,"anchorX":0.5,"anchorY":0.92}],"loop":true},"walk":{"frames":[{"src":"assets/dragonbound/baby-dragons/ashwick-cinderbank/frame-05.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/ashwick-cinderbank/frame-06.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/ashwick-cinderbank/frame-07.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":185,"anchorX":0.5,"anchorY":0.92}],"loop":true},"takeOff":{"frames":[{"src":"assets/dragonbound/baby-dragons/ashwick-cinderbank/frame-12.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/ashwick-cinderbank/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":170,"anchorX":0.5,"anchorY":0.92}],"loop":false},"fly":{"frames":[{"src":"assets/dragonbound/baby-dragons/ashwick-cinderbank/frame-08.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/ashwick-cinderbank/frame-09.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/ashwick-cinderbank/frame-10.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/ashwick-cinderbank/frame-11.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/ashwick-cinderbank/frame-13.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/ashwick-cinderbank/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":145,"anchorX":0.5,"anchorY":0.92}],"loop":true},"land":{"frames":[{"src":"assets/dragonbound/baby-dragons/ashwick-cinderbank/frame-14.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92},{"src":"assets/dragonbound/baby-dragons/ashwick-cinderbank/frame-15.webp?v=v32-47-full-baby-dragon-asset-qa-20260821","durationMs":190,"anchorX":0.5,"anchorY":0.92}],"loop":false}}}};
  const BREED_BY_DISPLAY={"Vardesh":"vardesh","Lumerre":"lumerre","Kordesh":"kordesh","Nambara":"nambara","Norveth":"norveth","Zafran":"zafran","Elvane":"elvane","Qasmir":"qasmir","Calvora":"calvora","Rovarn":"rovarn","Talune":"talune","Drazhen":"drazhen","Belros":"belros","Marovar":"marovar","Sorevia":"sorevia","Iskandar":"iskandar","Blackglass Coast":"blackglass-coast","Skallheim":"skallheim","Hestholm Fjord":"hestholm-fjord","Nyrgate Aurora":"nyrgate-aurora","Warmvein / Krellhaven":"warmvein-krellhaven","Aurelia":"aurelia","Orsanne":"orsanne","Saint Ciro":"saint-ciro","Marenza":"marenza","Grand Khor":"grand-khor","Rova End":"rova-end","Zafir Row":"zafir-row","Ossa Mere":"ossa-mere","Ashwick / Cinderbank":"ashwick-cinderbank"};

const HOUSE_MAPS={
  'norveth-varka-fell-starter':{houseId:'norveth-varka-fell-starter',sourceImage:'assets/dragonbound/property/starters/norveth-varka-fell-starter.png',width:1536,height:1024,
    floors:[{id:'downstairs',walkableZones:[[[.235,.563],[.765,.563],[.792,.728],[.208,.728]]],navigationNodes:[[.28,.578],[.39,.578],[.50,.578],[.61,.578],[.72,.578],[.26,.620],[.38,.620],[.50,.620],[.62,.620],[.74,.620],[.245,.665],[.37,.665],[.50,.665],[.63,.665],[.755,.665],[.23,.710],[.36,.710],[.50,.710],[.64,.710],[.77,.710]]}],blockedZones:[],stairConnections:[],spawnPoints:[{floorId:'downstairs',p:[.50,.655]}],restingZones:[{floorId:'downstairs',poly:[[.58,.595],[.735,.595],[.755,.700],[.57,.700]]}],sleepingZones:[{floorId:'downstairs',poly:[[.265,.595],[.435,.595],[.445,.700],[.245,.700]]}],flightZones:[{floorId:'downstairs',poly:[[.315,.585],[.685,.585],[.710,.690],[.290,.690]]}]},
  'nambara-naskor-edge-starter':{houseId:'nambara-naskor-edge-starter',sourceImage:'assets/dragonbound/property/starters/nambara-naskor-edge-starter.png',width:1536,height:1024,
    floors:[{id:'downstairs',walkableZones:[[[.235,.563],[.765,.563],[.792,.728],[.208,.728]]],navigationNodes:[[.28,.578],[.39,.578],[.50,.578],[.61,.578],[.72,.578],[.26,.620],[.38,.620],[.50,.620],[.62,.620],[.74,.620],[.245,.665],[.37,.665],[.50,.665],[.63,.665],[.755,.665],[.23,.710],[.36,.710],[.50,.710],[.64,.710],[.77,.710]]}],blockedZones:[],stairConnections:[],spawnPoints:[{floorId:'downstairs',p:[.50,.655]}],restingZones:[{floorId:'downstairs',poly:[[.58,.595],[.735,.595],[.755,.700],[.57,.700]]}],sleepingZones:[{floorId:'downstairs',poly:[[.265,.595],[.435,.595],[.445,.700],[.245,.700]]}],flightZones:[{floorId:'downstairs',poly:[[.315,.585],[.685,.585],[.710,.690],[.290,.690]]}]},
  'lumerre-greenhollow-starter':{houseId:'lumerre-greenhollow-starter',sourceImage:'assets/dragonbound/property/starters/lumerre-greenhollow-starter.png',width:1536,height:1024,
    floors:[{id:'downstairs',walkableZones:[[[.258,.563],[.732,.563],[.775,.728],[.225,.728]]],navigationNodes:[[.295,.578],[.395,.578],[.495,.578],[.595,.578],[.695,.578],[.275,.620],[.385,.620],[.495,.620],[.605,.620],[.715,.620],[.255,.665],[.375,.665],[.495,.665],[.615,.665],[.735,.665],[.24,.710],[.365,.710],[.495,.710],[.625,.710],[.75,.710]]}],blockedZones:[],stairConnections:[],spawnPoints:[{floorId:'downstairs',p:[.50,.655]}],restingZones:[{floorId:'downstairs',poly:[[.56,.595],[.705,.595],[.735,.700],[.55,.700]]}],sleepingZones:[{floorId:'downstairs',poly:[[.285,.595],[.435,.595],[.445,.700],[.265,.700]]}],flightZones:[{floorId:'downstairs',poly:[[.325,.585],[.665,.585],[.695,.690],[.300,.690]]}]},
  'elvane-canto-plains-starter':{houseId:'elvane-canto-plains-starter',sourceImage:'assets/dragonbound/property/starters/elvane-canto-plains-starter.png',width:1536,height:1024,
    floors:[{id:'downstairs',walkableZones:[[[.258,.563],[.735,.563],[.775,.728],[.225,.728]]],navigationNodes:[[.295,.578],[.395,.578],[.495,.578],[.595,.578],[.695,.578],[.275,.620],[.385,.620],[.495,.620],[.605,.620],[.715,.620],[.255,.665],[.375,.665],[.495,.665],[.615,.665],[.735,.665],[.24,.710],[.365,.710],[.495,.710],[.625,.710],[.75,.710]]}],blockedZones:[],stairConnections:[],spawnPoints:[{floorId:'downstairs',p:[.50,.655]}],restingZones:[{floorId:'downstairs',poly:[[.56,.595],[.705,.595],[.735,.700],[.55,.700]]}],sleepingZones:[{floorId:'downstairs',poly:[[.285,.595],[.435,.595],[.445,.700],[.265,.700]]}],flightZones:[{floorId:'downstairs',poly:[[.325,.585],[.665,.585],[.695,.690],[.300,.690]]}]},
  'vardesh-hestholm-fjord-starter':{houseId:'vardesh-hestholm-fjord-starter',sourceImage:'assets/dragonbound/property/starters/vardesh-hestholm-fjord-starter.png',width:1536,height:1024,
    floors:[{id:'downstairs',walkableZones:[[[.235,.563],[.765,.563],[.792,.728],[.208,.728]]],navigationNodes:[[.28,.578],[.39,.578],[.50,.578],[.61,.578],[.72,.578],[.26,.620],[.38,.620],[.50,.620],[.62,.620],[.74,.620],[.245,.665],[.37,.665],[.50,.665],[.63,.665],[.755,.665],[.23,.710],[.36,.710],[.50,.710],[.64,.710],[.77,.710]]}],blockedZones:[],stairConnections:[],spawnPoints:[{floorId:'downstairs',p:[.50,.655]}],restingZones:[{floorId:'downstairs',poly:[[.58,.595],[.735,.595],[.755,.700],[.57,.700]]}],sleepingZones:[{floorId:'downstairs',poly:[[.265,.595],[.435,.595],[.445,.700],[.245,.700]]}],flightZones:[{floorId:'downstairs',poly:[[.315,.585],[.685,.585],[.710,.690],[.290,.690]]}]},
  'sorevia-lakeside-starter':{houseId:'sorevia-lakeside-starter',sourceImage:'assets/dragonbound/property/starters/sorevia-lakeside-starter.png',width:1536,height:1024,
    floors:[{id:'downstairs',walkableZones:[[[0.205,0.565],[0.795,0.565],[0.815,0.744],[0.185,0.744]]],navigationNodes:[[0.26,0.578],[0.38,0.578],[0.5,0.578],[0.62,0.578],[0.74,0.578],[0.245,0.62],[0.37,0.62],[0.5,0.62],[0.63,0.62],[0.755,0.62],[0.23,0.665],[0.36,0.665],[0.5,0.665],[0.64,0.665],[0.77,0.665],[0.215,0.71],[0.35,0.71],[0.5,0.71],[0.65,0.71],[0.785,0.71]]}],blockedZones:[],stairConnections:[],spawnPoints:[{floorId:'downstairs',p:[0.5,0.665]}],restingZones:[{floorId:'downstairs',poly:[[0.57,0.59],[0.735,0.59],[0.755,0.705],[0.56,0.705]]}],sleepingZones:[{floorId:'downstairs',poly:[[0.265,0.59],[0.435,0.59],[0.445,0.705],[0.245,0.705]]}],flightZones:[{floorId:'downstairs',poly:[[0.315,0.585],[0.685,0.585],[0.71,0.695],[0.29,0.695]]}]},
  'iskandar-moonlit-starter':{houseId:'iskandar-moonlit-starter',sourceImage:'assets/dragonbound/property/starters/iskandar-moonlit-starter.png',width:1536,height:1024,
    floors:[{id:'downstairs',walkableZones:[[[0.205,0.525],[0.795,0.525],[0.812,0.735],[0.188,0.735]]],navigationNodes:[[0.25,0.545],[0.375,0.545],[0.5,0.545],[0.625,0.545],[0.75,0.545],[0.235,0.59],[0.365,0.59],[0.5,0.59],[0.635,0.59],[0.765,0.59],[0.22,0.635],[0.355,0.635],[0.5,0.635],[0.645,0.635],[0.78,0.635],[0.205,0.69],[0.35,0.69],[0.5,0.69],[0.65,0.69],[0.795,0.69],[0.2,0.72],[0.35,0.72],[0.5,0.72],[0.65,0.72],[0.8,0.72]]}],blockedZones:[],stairConnections:[],spawnPoints:[{floorId:'downstairs',p:[0.5,0.65]}],restingZones:[{floorId:'downstairs',poly:[[0.57,0.59],[0.735,0.59],[0.755,0.7],[0.56,0.7]]}],sleepingZones:[{floorId:'downstairs',poly:[[0.265,0.59],[0.435,0.59],[0.445,0.7],[0.245,0.7]]}],flightZones:[{floorId:'downstairs',poly:[[0.315,0.58],[0.685,0.58],[0.71,0.69],[0.29,0.69]]}]},
  'drazhen-ashlands-starter':{houseId:'drazhen-ashlands-starter',sourceImage:'assets/dragonbound/property/starters/drazhen-ashlands-starter.png',width:1536,height:1024,
    floors:[{id:'downstairs',walkableZones:[[[0.22,0.56],[0.78,0.56],[0.805,0.735],[0.195,0.735]]],navigationNodes:[[0.26,0.578],[0.38,0.578],[0.5,0.578],[0.62,0.578],[0.74,0.578],[0.245,0.62],[0.37,0.62],[0.5,0.62],[0.63,0.62],[0.755,0.62],[0.23,0.665],[0.36,0.665],[0.5,0.665],[0.64,0.665],[0.77,0.665],[0.215,0.71],[0.35,0.71],[0.5,0.71],[0.65,0.71],[0.785,0.71]]}],blockedZones:[],stairConnections:[],spawnPoints:[{floorId:'downstairs',p:[0.5,0.66]}],restingZones:[{floorId:'downstairs',poly:[[0.57,0.59],[0.735,0.59],[0.755,0.7],[0.56,0.7]]}],sleepingZones:[{floorId:'downstairs',poly:[[0.265,0.59],[0.435,0.59],[0.445,0.7],[0.245,0.7]]}],flightZones:[{floorId:'downstairs',poly:[[0.315,0.5800000000000001],[0.685,0.5800000000000001],[0.71,0.69],[0.29,0.69]]}]},
  'rovarn-redstone-starter':{houseId:'rovarn-redstone-starter',sourceImage:'assets/dragonbound/property/starters/rovarn-redstone-starter.png',width:1536,height:1024,
    floors:[{id:'downstairs',walkableZones:[[[0.21,0.56],[0.79,0.56],[0.81,0.735],[0.19,0.735]]],navigationNodes:[[0.26,0.578],[0.38,0.578],[0.5,0.578],[0.62,0.578],[0.74,0.578],[0.245,0.62],[0.37,0.62],[0.5,0.62],[0.63,0.62],[0.755,0.62],[0.23,0.665],[0.36,0.665],[0.5,0.665],[0.64,0.665],[0.77,0.665],[0.215,0.71],[0.35,0.71],[0.5,0.71],[0.65,0.71],[0.785,0.71]]}],blockedZones:[],stairConnections:[],spawnPoints:[{floorId:'downstairs',p:[0.5,0.66]}],restingZones:[{floorId:'downstairs',poly:[[0.57,0.59],[0.735,0.59],[0.755,0.7],[0.56,0.7]]}],sleepingZones:[{floorId:'downstairs',poly:[[0.265,0.59],[0.435,0.59],[0.445,0.7],[0.245,0.7]]}],flightZones:[{floorId:'downstairs',poly:[[0.315,0.5800000000000001],[0.685,0.5800000000000001],[0.71,0.69],[0.29,0.69]]}]},
  'marovar-crescent-starter':{houseId:'marovar-crescent-starter',sourceImage:'assets/dragonbound/property/starters/marovar-crescent-starter.png',width:1536,height:1024,
    floors:[{id:'downstairs',walkableZones:[[[0.21,0.56],[0.79,0.56],[0.81,0.735],[0.19,0.735]]],navigationNodes:[[0.26,0.578],[0.38,0.578],[0.5,0.578],[0.62,0.578],[0.74,0.578],[0.245,0.62],[0.37,0.62],[0.5,0.62],[0.63,0.62],[0.755,0.62],[0.23,0.665],[0.36,0.665],[0.5,0.665],[0.64,0.665],[0.77,0.665],[0.215,0.71],[0.35,0.71],[0.5,0.71],[0.65,0.71],[0.785,0.71]]}],blockedZones:[],stairConnections:[],spawnPoints:[{floorId:'downstairs',p:[0.5,0.66]}],restingZones:[{floorId:'downstairs',poly:[[0.57,0.59],[0.735,0.59],[0.755,0.7],[0.56,0.7]]}],sleepingZones:[{floorId:'downstairs',poly:[[0.265,0.59],[0.435,0.59],[0.445,0.7],[0.245,0.7]]}],flightZones:[{floorId:'downstairs',poly:[[0.315,0.5800000000000001],[0.685,0.5800000000000001],[0.71,0.69],[0.29,0.69]]}]}
};

  // V32.73 starter homes use per-house floor polygons traced against the supplied artwork. are single-floor interiors. Old two-floor navigation hotfixes are intentionally retired.
  const HOUSE_NAV_HOTFIXES={};

  const STORAGE_KEY_BASE='dragonboundBabyDragonStateV2';
  const PROFILE_STORAGE_KEY_BASE='dragonboundNamedDragonV2';
  const HOUSE_STATE_KEY_BASE='dragonboundBabyHouseMovementV5';
  const currentAccountSlug=()=>{try{const fromCharacter=(typeof character!=='undefined'&&character?.username)?String(character.username):'';const fromPassport=document.getElementById('passportUsername')?.textContent||'';return String(fromCharacter||fromPassport||'guest').trim().toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'')||'guest';}catch(_e){return'guest';}};
  const storageKey=()=>`${STORAGE_KEY_BASE}:${currentAccountSlug()}`;
  const profileStorageKey=()=>`${PROFILE_STORAGE_KEY_BASE}:${currentAccountSlug()}`;
  const movementStorageKey=()=>`${HOUSE_STATE_KEY_BASE}:${currentAccountSlug()}`;
  const DEBUG_KEY='dragonboundNavDebug';
  const RENDER_SCALE_MULTIPLIER=0.43923;
  const FLIGHT_PROBABILITY_MULTIPLIER=0.2;
  const MIN_FLIGHT_COOLDOWN_MS=180000;
  const MAX_FLIGHT_COOLDOWN_MS=360000;
  const WEATHER_CONFIGS={
    'vardesh-hestholm-fjord-starter':{
      modes:['snow','fjord-mist','snow'],
      zones:[[0,0,.19,1],[.81,0,.19,1],[.12,0,.76,.19],[0,.76,1,.24]],
      density:1.05
    },
    'norveth-varka-fell-starter':{
      modes:['mountain-mist','light-snow','wind-motes'],
      zones:[[0,0,.21,1],[.79,0,.21,1],[.10,0,.80,.19],[0,.84,1,.16]],
      density:.92
    },
    'nambara-naskor-edge-starter':{
      modes:['warm-motes','fireflies','night-breeze'],
      zones:[[0,0,.225,1],[.775,0,.225,1],[.12,0,.76,.16],[0,.79,1,.21]],
      density:.9
    },
    'lumerre-greenhollow-starter':{
      modes:['pollen','leaf-drift','sun-motes'],
      zones:[[0,0,.23,1],[.72,0,.28,1],[.14,0,.68,.27],[0,.72,1,.28]],
      density:1.0
    },
    'elvane-canto-plains-starter':{
      modes:['leaf-drift','forest-motes','soft-rain'],
      zones:[[0,0,.20,1],[.84,0,.16,1],[.12,0,.76,.16],[0,.69,1,.31]],
      density:.95
    }
  };
  const STARTER_HOME_MUSIC='assets/dragonbound/home/starter-home-music.mp3';
  const STARTER_HOME_MUSIC_VOLUME=0.30;
  const WALKING_SPEED_MULTIPLIER=1.5;
  const WALK_ANIMATION_SPEED_MULTIPLIER=1.5;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const now=()=>performance.now();
  const rand=(a,b)=>a+Math.random()*(b-a);
  const choose=a=>a[Math.floor(Math.random()*a.length)];
  const distSrc=(a,b,map)=>Math.hypot((b[0]-a[0])*map.width,(b[1]-a[1])*map.height);
  const pointInPoly=(p,poly)=>{let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];const hit=((yi>p[1])!==(yj>p[1]))&&(p[0]<(xj-xi)*(p[1]-yi)/((yj-yi)||1e-9)+xi);if(hit)inside=!inside;}return inside;};
  const orient=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const segIntersect=(a,b,c,d)=>{const o1=orient(a,b,c),o2=orient(a,b,d),o3=orient(c,d,a),o4=orient(c,d,b);return ((o1>0)!==(o2>0))&&((o3>0)!==(o4>0));};
  const segHitsPoly=(a,b,poly)=>{if(pointInPoly(a,poly)||pointInPoly(b,poly))return true;for(let i=0;i<poly.length;i++)if(segIntersect(a,b,poly[i],poly[(i+1)%poly.length]))return true;return false;};
  const randomInPoly=(poly)=>{let minX=1,maxX=0,minY=1,maxY=0;poly.forEach(p=>{minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);});for(let i=0;i<80;i++){const p=[rand(minX,maxX),rand(minY,maxY)];if(pointInPoly(p,poly))return p;}return poly[0].slice();};
  const nearest=(p,pts,map)=>pts.slice().sort((a,b)=>distSrc(p,a,map)-distSrc(p,b,map))[0];
  const getFurniturePolys=(floorId='')=>{try{const provider=window.dragonboundFurnitureCollisionProvider;const raw=typeof provider==='function'?(provider()||[]):JSON.parse(localStorage.getItem('dragonboundFurnitureCollisions')||'[]');return (Array.isArray(raw)?raw:[]).map(entry=>Array.isArray(entry)?{floorId:'',poly:entry}:entry).filter(entry=>entry&&Array.isArray(entry.poly)&&(!floorId||!entry.floorId||entry.floorId===floorId)).map(entry=>entry.poly);}catch(_e){return[];}};
  const getFurnitureInteractions=()=>{try{const provider=window.dragonboundFurnitureInteractionProvider;return typeof provider==='function'?(provider()||[]):[];}catch(_e){return[];}};
  const formatDragonAge=hatchedAt=>{const age=Math.max(0,Date.now()-(Number(hatchedAt)||Date.now())),m=Math.floor(age/60000),h=Math.floor(age/3600000),d=Math.floor(age/86400000),w=Math.floor(d/7);if(m<1)return'Just hatched';if(h<1)return`${m} min${m===1?'':'s'} old`;if(d<1)return`${h} hr${h===1?'':'s'} old`;if(d<7)return`${d} day${d===1?'':'s'} old`;return`${w} week${w===1?'':'s'} old`;};
  const DEFAULT_BEHAVIOUR={idleWeight:.23,lookWeight:.25,walkWeight:.30,sitWeight:.09,restWeight:.09,sleepWeight:.04,stairAffinity:1,flightAffinity:1,centralBias:.82,idleMinMs:2800,idleMaxMs:7600,lookMinMs:3200,lookMaxMs:8800,sitMinMs:4500,sitMaxMs:13000,restMinMs:8000,restMaxMs:22000,sleepMinMs:18000,sleepMaxMs:50000};
  const BEHAVIOUR_OVERRIDES={
    'vardesh':{walkWeight:.33,lookWeight:.24,sleepWeight:.025,stairAffinity:1.12,centralBias:.84},
    'norveth':{walkWeight:.34,lookWeight:.24,sleepWeight:.025,stairAffinity:1.15,centralBias:.86},
    'blackglass-coast':{walkWeight:.34,lookWeight:.25,sleepWeight:.02,stairAffinity:1.12,centralBias:.86},
    'skallheim':{walkWeight:.34,lookWeight:.24,sleepWeight:.02,stairAffinity:1.12,centralBias:.86},
    'hestholm-fjord':{walkWeight:.32,lookWeight:.25,sleepWeight:.02,stairAffinity:1.08,centralBias:.86},
    'nyrgate-aurora':{lookWeight:.29,walkWeight:.30,sleepWeight:.02,flightAffinity:1.08,centralBias:.85},
    'lumerre':{lookWeight:.30,walkWeight:.27,restWeight:.10,sleepWeight:.03,flightAffinity:1.05,centralBias:.85},
    'aurelia':{lookWeight:.31,walkWeight:.27,restWeight:.10,sleepWeight:.03,flightAffinity:1.05,centralBias:.85},
    'orsanne':{lookWeight:.29,walkWeight:.27,restWeight:.11,sleepWeight:.03,centralBias:.85},
    'elvane':{lookWeight:.29,walkWeight:.29,restWeight:.09,sleepWeight:.025,flightAffinity:1.10,stairAffinity:1.06,centralBias:.87},
    'ossa-mere':{lookWeight:.28,walkWeight:.28,restWeight:.10,sleepWeight:.03,flightAffinity:1.10,centralBias:.86},
    'sorevia':{lookWeight:.28,walkWeight:.27,restWeight:.11,sleepWeight:.03,centralBias:.85},
    'nambara':{restWeight:.12,sitWeight:.11,walkWeight:.25,sleepWeight:.05,flightAffinity:.88,centralBias:.83},
    'zafran':{restWeight:.12,sitWeight:.11,walkWeight:.26,sleepWeight:.05,flightAffinity:.9,centralBias:.83},
    'qasmir':{lookWeight:.28,restWeight:.12,sitWeight:.10,walkWeight:.25,sleepWeight:.05,flightAffinity:.92,centralBias:.83},
    'zafir-row':{restWeight:.12,sitWeight:.11,walkWeight:.26,sleepWeight:.05,flightAffinity:.92,centralBias:.83},
    'kordesh':{walkWeight:.35,lookWeight:.23,sleepWeight:.02,stairAffinity:1.18,centralBias:.87},
    'grand-khor':{walkWeight:.35,lookWeight:.22,sleepWeight:.02,stairAffinity:1.20,centralBias:.88},
    'rovarn':{walkWeight:.34,lookWeight:.24,sleepWeight:.025,stairAffinity:1.15,centralBias:.87},
    'rova-end':{walkWeight:.34,lookWeight:.24,sleepWeight:.025,stairAffinity:1.15,centralBias:.87},
    'drazhen':{walkWeight:.33,lookWeight:.24,sleepWeight:.025,stairAffinity:1.12,flightAffinity:1.05,centralBias:.86},
    'warmvein-krellhaven':{walkWeight:.33,lookWeight:.23,sleepWeight:.025,stairAffinity:1.12,centralBias:.86},
    'calvora':{lookWeight:.26,walkWeight:.29,restWeight:.10,sleepWeight:.03,flightAffinity:1.04,centralBias:.84},
    'saint-ciro':{lookWeight:.27,walkWeight:.28,restWeight:.10,sleepWeight:.03,flightAffinity:1.04,centralBias:.84},
    'marenza':{lookWeight:.27,walkWeight:.28,restWeight:.10,sleepWeight:.03,flightAffinity:1.04,centralBias:.84},
    'talune':{walkWeight:.31,lookWeight:.26,restWeight:.09,sleepWeight:.03,flightAffinity:1.08,centralBias:.85},
    'belros':{walkWeight:.30,lookWeight:.27,restWeight:.09,sleepWeight:.03,centralBias:.85},
    'marovar':{lookWeight:.27,walkWeight:.28,restWeight:.10,sleepWeight:.03,centralBias:.84},
    'ashwick-cinderbank':{walkWeight:.30,lookWeight:.26,restWeight:.10,sleepWeight:.03,stairAffinity:1.05,centralBias:.85},
    'iskandar':{lookWeight:.29,walkWeight:.27,restWeight:.09,sleepWeight:.03,flightAffinity:1.12,centralBias:.86}
  };
  const getBehaviour=id=>Object.assign({},DEFAULT_BEHAVIOUR,BEHAVIOUR_OVERRIDES[id]||{});
  const centralNodes=(nodes,bias=.82)=>{if(nodes.length<3)return nodes.slice();const cx=nodes.reduce((s,p)=>s+p[0],0)/nodes.length,cy=nodes.reduce((s,p)=>s+p[1],0)/nodes.length,sorted=nodes.slice().sort((a,b)=>Math.hypot(a[0]-cx,a[1]-cy)-Math.hypot(b[0]-cx,b[1]-cy));return sorted.slice(0,Math.max(2,Math.min(sorted.length,Math.round(sorted.length*(.55+.25*bias)))));};
  const pickAction=actor=>{const b=actor.behaviour||DEFAULT_BEHAVIOUR;let entries=[['idle',b.idleWeight],['looking',b.lookWeight],['walking',b.walkWeight],['sitting',b.sitWeight],['resting',b.restWeight],['sleeping',b.sleepWeight]];if(actor.lastAction==='sleeping')entries=entries.map(([k,v])=>[k,k==='sleeping'?v*.35:v]);if(actor.lastAction==='walking')entries=entries.map(([k,v])=>[k,k==='walking'?v*.82:v]);const total=entries.reduce((s,e)=>s+e[1],0)||1;let r=Math.random()*total;for(const [name,weight] of entries){r-=weight;if(r<=0)return name;}return 'idle';};


  /* V32.51 — individual personality brain. Breed is only a nudge; the permanent
     server-generated coreStats + quirks + needs + memory drive actual choices. */
  const PERSONALITY_STAT_KEYS=['energy','curiosity','affection','independence','bravery','playfulness','mischief','stubbornness','sociability','appetite','sleepiness','intelligence'];
  const BOND_STAGES=[
    {min:0,name:'New Keeper',note:'Still learning who you are and what life with you feels like'},
    {min:20,name:'Getting Comfortable',note:'Recognises your voice, touch and familiar routines'},
    {min:40,name:'Trusting',note:'Starts choosing to check in with you on their own'},
    {min:60,name:'Attached',note:'Feels safe enough to relax and seek you out'},
    {min:80,name:'Close Companion',note:'Treats you as a familiar part of home'},
    {min:95,name:'Inseparable',note:'Complete trust, expressed in their own personality'}
  ];

  /* V32.92 — persistent dragon growth + skill progression. Skills are stored in the
     same dragon_memory snapshot as needs/Bond so one timestamp/merge policy remains
     authoritative across localStorage and Supabase. */
  const DRAGON_SKILLS=['flying','agility','strength','fireControl','intelligence','confidence'];
  const DRAGON_SKILL_LABELS={flying:'Flying',agility:'Agility',strength:'Strength',fireControl:'Fire Control',intelligence:'Intelligence',confidence:'Confidence'};
  const DRAGON_SKILL_RANKS=[
    {min:0,name:'Untrained'},
    {min:10,name:'Beginner'},
    {min:25,name:'Developing'},
    {min:45,name:'Capable'},
    {min:65,name:'Skilled'},
    {min:80,name:'Talented'},
    {min:90,name:'Exceptional'},
    {min:97,name:'Masterful'}
  ];
  // V32.93 baby-growth lock: we do not have adult/juvenile art yet, so real-age
  // growth is intentionally VERY slow and all visual changes remain subtle. This keeps
  // current dragons in the cute baby phase for months rather than days.
  const GROWTH_STAGES=[
    {minDays:0,maxDays:3,name:'Newly Hatched',scale:.94,move:.97},
    {minDays:3,maxDays:90,name:'Baby',scale:1,move:1},
    {minDays:90,maxDays:180,name:'Growing Baby',scale:1.02,move:1.01},
    {minDays:180,maxDays:365,name:'Young Dragon',scale:1.035,move:1.02},
    {minDays:365,maxDays:Infinity,name:'Juvenile',scale:1.05,move:1.03}
  ];
  const GROWTH_ART_STAGE_CAP=2; // Growing Baby — later stages stay locked until matching art/sprites are ready.
  const SKILL_MARK_REWARDS={10:5,20:7,30:10,40:12,50:15,60:18,70:22,80:28,90:40,95:50,100:75};
  const SKILL_MARK_MILESTONES=Object.keys(SKILL_MARK_REWARDS).map(Number).sort((a,b)=>a-b);
  // V32.94 — skill learning is intentionally paced over real time. Swapping to a
  // different piece of furniture cannot bypass a cooldown because the cooldown is
  // stored per skill, not per furnishing. High levels recover more slowly.
  const SKILL_TRAINING_COOLDOWNS=[
    {min:0,ms:10*60*1000},{min:10,ms:15*60*1000},{min:25,ms:20*60*1000},
    {min:45,ms:30*60*1000},{min:65,ms:45*60*1000},{min:80,ms:60*60*1000},
    {min:90,ms:90*60*1000}
  ];
  const PASSIVE_SKILL_COOLDOWNS={indoorFlight:4*60*1000,zoomies:6*60*1000,stairs:8*60*1000};
  // V32.97 — Sims-style care autonomy. Dragons do not instantly rush to satisfy a
  // half-empty bar. They generally wait until a visible care stat is around 30-40%,
  // then satisfy the LOWEST need without automatically filling it to 100%.
  const CARE_AUTONOMY_THRESHOLDS={hunger:40,hygiene:36,energy:38,fun:40};
  // V34.00 — every furnishing type now owns a believable interaction window instead
  // of inheriting arbitrary timings from individual branches. minCommitMs is the
  // point after which a genuinely critical unrelated need may interrupt autonomy.
  const FURNITURE_USE_TIMINGS={
    sleep:{minMs:20000,maxMs:60000,minCommitMs:12000},
    rest:{minMs:15000,maxMs:35000,minCommitMs:7000},
    perch:{minMs:12000,maxMs:35000,minCommitMs:6000},
    play:{minMs:8000,maxMs:20000,minCommitMs:4000},
    puzzle:{minMs:10000,maxMs:22000,minCommitMs:5000},
    eat:{minMs:6000,maxMs:14000,minCommitMs:3500},
    drink:{minMs:5500,maxMs:12000,minCommitMs:3000},
    wash:{minMs:12000,maxMs:30000,minCommitMs:6000},
    sandbath:{minMs:12000,maxMs:30000,minCommitMs:6000},
    groom:{minMs:10000,maxMs:22000,minCommitMs:5000},
    exercise:{minMs:10000,maxMs:25000,minCommitMs:5000},
    roar:{minMs:8000,maxMs:18000,minCommitMs:4000},
    fire:{minMs:8000,maxMs:18000,minCommitMs:4000},
    scratch:{minMs:8000,maxMs:18000,minCommitMs:4000},
    dig:{minMs:8000,maxMs:18000,minCommitMs:4000},
    climb:{minMs:10000,maxMs:25000,minCommitMs:5000},
    hide:{minMs:12000,maxMs:35000,minCommitMs:6000},
    warm:{minMs:12000,maxMs:30000,minCommitMs:6000},
    watch:{minMs:5000,maxMs:10000,minCommitMs:2500},
    read:{minMs:6000,maxMs:10000,minCommitMs:3000},
    mirror:{minMs:4500,maxMs:9000,minCommitMs:2200},
    sniff:{minMs:4000,maxMs:8500,minCommitMs:2000},
    toilet:{minMs:6000,maxMs:12000,minCommitMs:3000},
    inspect:{minMs:4000,maxMs:10000,minCommitMs:2200}
  };
  // V34.02 — sparse, context-aware dragon thoughts. These are presentation only:
  // no AI decisions, needs, race speed/rewards or personality weights are changed here.
  const DRAGON_THOUGHT_CONFIG={
    enabled:true,
    ambientMinMs:30000,
    ambientMaxMs:90000,
    activityMinMs:22000,
    activityMaxMs:60000,
    recentLimit:12
  };
  const DRAGON_THOUGHT_PRIORITY={
    ambient:10,
    activity:20,
    need:24,
    favourite:50,
    newFurniture:52,
    keeper:60,
    command:65,
    race:80,
    discovery:90
  };
  // V34.03 — server-owned several-hour moods. These are gentle behaviour biases only;
  // race simulation, Dragon Racing XP/GP and Keeper Marks are intentionally untouched.
  const DRAGON_DAILY_MOOD_ACTION_BIAS={
    Bouncy:{walking:8,explore:7,zoomies:11,furniture:4,resting:-4,sleeping:-5},
    Sleepy:{sitting:5,resting:10,sleeping:14,walking:-3,flight:-5,zoomies:-10},
    Cuddly:{looking:9,sitting:6,resting:4,walking:2},
    Curious:{looking:10,walking:4,explore:12,furniture:8},
    Grumpy:{idle:4,looking:2,sitting:5,resting:6,zoomies:-4},
    Focused:{looking:3,furniture:12,explore:-2,zoomies:-4},
    Hungry:{looking:3,furniture:12},
    Playful:{walking:4,explore:4,furniture:10,zoomies:9},
    Nervous:{looking:5,sitting:7,resting:8,explore:-7,flight:-8,zoomies:-6},
    Proud:{looking:5,walking:3,furniture:6},
    Relaxed:{looking:4,sitting:9,resting:10,walking:-3,zoomies:-10},
    Restless:{looking:4,walking:10,explore:8,furniture:5,resting:-5,zoomies:7}
  };
  // V34.04 — temporary several-hour preferences. These only add gentle weights to the
  // existing autonomy system; care urgency and direct commands still win.
  const DRAGON_DAILY_PREFERENCE_ACTION_BIAS={
    nap_day:{sleeping:16,resting:10,sitting:5,furniture:5,walking:-4},
    comfort_seeker:{resting:9,sitting:6,furniture:7},
    favourite_corner:{resting:5,sitting:4,furniture:8},
    toy_obsession:{furniture:12,zoomies:3},
    playful_day:{furniture:10,zoomies:8,explore:4,walking:3},
    puzzle_mood:{furniture:9,looking:5},
    training_kick:{furniture:12,walking:3,zoomies:2},
    race_itch:{furniture:10,walking:4,zoomies:4},
    focused_practice:{furniture:11,looking:4,zoomies:-3},
    attention_day:{looking:8,sitting:6,walking:3},
    shadowing:{looking:9,walking:5,sitting:3},
    independent_streak:{explore:9,walking:6,looking:2},
    cuddle_day:{sitting:8,resting:6,looking:4},
    snacky:{furniture:8,looking:3},
    treat_hopeful:{looking:6,walking:2},
    bath_lover:{furniture:7},
    sand_bath_day:{furniture:8},
    avoiding_bath:{},
    explorer:{explore:15,walking:8,stairs:4,looking:4},
    window_watcher:{furniture:8,looking:6,sitting:3},
    furniture_inspector:{furniture:10,explore:7,looking:5},
    hideaway:{furniture:8,resting:6,sitting:5},
    object_fixation:{furniture:12},
    new_furniture_interest:{furniture:10,looking:5},
    object_avoidance:{explore:2,walking:2}
  };
  // V32.98 — the visible Sims-style care bars now decay at exactly 3x the V32.97
  // baseline. The existing autonomy thresholds, partial refill ceilings, offline
  // floor and gentle mood/Bond consequences keep the faster pace from becoming
  // destructive or forcing constant micromanagement.
  const NEED_DECAY_MULTIPLIER=3;
  const CARE_TARGET_RANGES={
    hunger:[76,84],hygiene:[80,88],energy:[78,86],fun:[76,86],social:[78,88],comfort:[78,88]
  };
  /* V32.95 — low-frequency daily-life moments. These are autonomous behaviours,
     not popup quests. Cooldowns are persisted in dragon_memory so reopening the
     house cannot reset the event clock or create event spam. */
  const LIFE_EVENT_GLOBAL_MIN_MS=8*60*1000;
  const LIFE_EVENT_GLOBAL_MAX_MS=18*60*1000;
  const LIFE_EVENT_DEFS={
    'toy-carry':{label:'Carrying a favourite toy',cooldown:[10,20],importance:'notable'},
    'ball-chase':{label:'Chasing a toy around',cooldown:[12,24],importance:'ordinary'},
    'hoard-trip':{label:'Checking the little hoard',cooldown:[25,50],importance:'notable'},
    'cupboard-mischief':{label:'Investigating the cupboard',cooldown:[20,40],importance:'notable'},
    'new-furniture':{label:'Inspecting something new',cooldown:[18,35],importance:'notable'},
    'window-watch':{label:'Watching the world outside',cooldown:[15,35],importance:'notable'},
    'cosy-nap':{label:'Settling into a favourite bed',cooldown:[20,45],importance:'ordinary'},
    'bath-fun':{label:'Having a splash',cooldown:[22,45],importance:'ordinary'},
    'food-check':{label:'Checking the food station',cooldown:[30,60],importance:'ordinary'},
    'training-practice':{label:'Choosing a bit of practice',cooldown:[22,45],importance:'ordinary'},
    'flight-practice':{label:'Thinking about a little flight',cooldown:[22,45],importance:'ordinary'},
    'quiet-hide':{label:'Finding a quiet corner',cooldown:[18,38],importance:'ordinary'},
    'zoomies':{label:'Sudden zoomies!',cooldown:[15,30],importance:'ordinary'},
    'curious-wander':{label:'Going to investigate',cooldown:[12,28],importance:'ordinary'},
    'favourite-return':{label:'Returning to a favourite spot',cooldown:[18,36],importance:'ordinary'}
  };
  const skillXpForLevel=level=>1.8*Math.pow(clamp(Number(level)||0,0,100),1.70);
  const skillLevelForXp=xp=>clamp(Math.pow(Math.max(0,Number(xp)||0)/1.8,1/1.70),0,100);
  const skillRankForLevel=level=>{const v=clamp(Number(level)||0,0,100);let rank=DRAGON_SKILL_RANKS[0];for(const r of DRAGON_SKILL_RANKS){if(v>=r.min)rank=r;else break;}return rank;};
  const nextSkillRankForLevel=level=>DRAGON_SKILL_RANKS.find(r=>r.min>Number(level||0))||null;
  const PERSONALITY_ACTIONS=['idle','looking','walking','explore','furniture','sitting','resting','sleeping','stairs','flight','zoomies'];
  const PERSONALITY_BASE_SCORES={idle:24,looking:28,walking:31,explore:20,furniture:12,sitting:13,resting:15,sleeping:8,stairs:8,flight:4,zoomies:3};
  const TRAIT_ACTION_MODIFIERS={
    'Professional Napper':{sleeping:34,resting:18,sitting:8,walking:-10,flight:-12,furniture:12},
    'Zoomies':{zoomies:45,walking:14,explore:8,sleeping:-12},
    'Coward':{flight:-22,explore:-8,looking:12,resting:7},
    'Fearless':{flight:12,explore:12,stairs:6,looking:4},
    'Tiny Menace':{explore:24,walking:7,looking:8,resting:-5,furniture:14},
    'Velcro Baby':{idle:6,looking:7,independence:-4},
    'Explorer':{explore:30,walking:10,stairs:10,idle:-7,sleeping:-5},
    'Independent Spirit':{explore:8,walking:8,idle:4},
    'Introvert':{resting:7,sitting:6,looking:5,explore:-5},
    'Social Butterfly':{looking:8,walking:6,resting:-3},
    'Creature of Habit':{resting:10,sleeping:8,explore:-8},
    'Little Pilot':{flight:42,explore:7,walking:5},
    'Grounded':{flight:-100,walking:9,stairs:5},
    'Food Goblin':{walking:5,looking:5},
    'Watcher':{looking:28,idle:9,walking:-4},
    'Gentle Soul':{resting:10,sitting:8,zoomies:-12,explore:-3},
    'Couch Potato':{sleeping:28,resting:22,sitting:12,walking:-15,flight:-20},
    'Furniture Inspector':{explore:20,looking:8,furniture:38},
    'Toy Obsessed':{zoomies:12,walking:8,explore:7,furniture:34},
    'Routine Lover':{resting:7,sleeping:6,explore:-6},
    'Restless':{walking:18,explore:12,zoomies:9,sitting:-8,sleeping:-8},
    'Attention Seeker':{looking:7,walking:5},
    'Night Owl':{walking:7,looking:7,sleeping:-10},
    'Deep Sleeper':{sleeping:18,resting:8},
    'Adventurous':{explore:14,stairs:7,flight:5},
    'Patient':{idle:8,looking:6},
    'Stair Goblin':{stairs:36,walking:6,explore:5},
    'Snob':{resting:7,looking:5,furniture:14},
    'Fireplace Lover':{resting:12,sitting:8},
    'Rain Lover':{looking:12,explore:7},
    'Rain Hater':{resting:12,sitting:7,explore:-8},
    'Upstairs Dweller':{stairs:15,resting:5},
    'Downstairs Dweller':{stairs:15,resting:5},
    'Dramatic':{looking:10,zoomies:8,resting:5},
    'Fussy Sleeper':{sleeping:8,resting:5},
    'Greedy':{walking:8,explore:5},
    'Impatient':{walking:12,zoomies:8,idle:-9},
    'Hoarder':{explore:12,walking:8},
    'Window Watcher':{looking:25,idle:7},
    'Early Riser':{walking:8,looking:5,sleeping:-9},
    'Splash Addict':{furniture:22,walking:4,zoomies:5},
    'Little Athlete':{furniture:26,walking:7,zoomies:8,resting:-5}
  };
  const DISCOVERY_RULES={
    'Professional Napper':m=>(m.sleepSessions||0)>=3,
    'Zoomies':m=>(m.zoomiesTriggered||0)>=2,
    'Fearless':m=>((m.flightsTaken||0)+(m.stairsUsed||0))>=5,
    'Tiny Menace':m=>(m.newLocationsVisited||0)>=8,
    'Explorer':m=>(m.newLocationsVisited||0)>=7,
    'Independent Spirit':m=>(m.walkSessions||0)>=14,
    'Introvert':m=>(m.longIdleSessions||0)>=5,
    'Social Butterfly':m=>(m.walkSessions||0)>=12,
    'Creature of Habit':m=>(m.sameSleepSpotVisits||0)>=3,
    'Little Pilot':m=>(m.flightsTaken||0)>=3,
    'Grounded':m=>(m.totalDecisions||0)>=28&&(m.flightsTaken||0)===0,
    'Watcher':m=>(m.lookSessions||0)>=10,
    'Gentle Soul':m=>(m.restSessions||0)>=7,
    'Couch Potato':m=>((m.sleepSessions||0)+(m.restSessions||0))>=8,
    'Furniture Inspector':m=>(m.furnitureInteractions||0)>=4,
    'Toy Obsessed':m=>(m.toyPlays||0)>=3,
    'Routine Lover':m=>(m.sameSleepSpotVisits||0)>=3,
    'Restless':m=>(m.walkSessions||0)>=15,
    'Attention Seeker':m=>(m.lookSessions||0)>=9,
    'Night Owl':m=>(m.walkSessions||0)>=12,
    'Deep Sleeper':m=>(m.sleepSessions||0)>=3,
    'Adventurous':m=>((m.stairsUsed||0)+(m.flightsTaken||0)+(m.newLocationsVisited||0))>=10,
    'Patient':m=>(m.longIdleSessions||0)>=5,
    'Coward':m=>(m.longIdleSessions||0)>=5,
    'Velcro Baby':m=>(m.keeperSeekingEvents||0)>=3,
    'Food Goblin':m=>((m.feedingUses||0)+(m.drinkUses||0))>=3,
    'Stair Goblin':m=>(m.stairsUsed||0)>=4,
    'Snob':m=>(m.expensiveFurnitureUses||0)>=3,
    'Fireplace Lover':m=>(m.warmRestUses||0)>=3,
    'Rain Lover':m=>(m.lookSessions||0)>=10,
    'Rain Hater':m=>(m.restSessions||0)>=7,
    'Upstairs Dweller':m=>(m.floorVisits?.upstairs||0)>=4,
    'Downstairs Dweller':m=>(m.floorVisits?.downstairs||0)>=4,
    'Dramatic':m=>(m.zoomiesTriggered||0)+(m.lookSessions||0)>=10,
    'Fussy Sleeper':m=>(m.sleepSessions||0)>=4,
    'Greedy':m=>(m.feedingUses||0)>=2,
    'Impatient':m=>(m.walkSessions||0)>=14,
    'Hoarder':m=>(m.hoardableUses||0)>=3,
    'Window Watcher':m=>(m.windowWatches||0)>=4,
    'Early Riser':m=>(m.walkSessions||0)>=12,
    'Splash Addict':m=>(m.bathUses||0)>=3,
    'Little Athlete':m=>(m.trainingUses||0)>=3
  };
  /* V33.80 — Living Dragon personality universe. This deliberately lives inside
     dragon_memory so existing dragons receive one deterministic profile and never reroll.
     The old server personality remains valid; this layer adds nuance without moving any
     currency, skill or care authority into the browser. */
  const DRAGONBOUND_PERSONALITY_UNIVERSE_VERSION=1;
  const universeTrait=(name,family,group,weights,note,action={},furniture={})=>({name,family,group,weights,note,action,furniture});
  const DRAGONBOUND_UNIVERSE_TRAITS=[
    universeTrait('Energetic','Energy','energy',{energy:38,sleepiness:-12},'Likes to stay busy and usually finds a reason to be moving.',{walking:11,explore:7,zoomies:6,resting:-5}),
    universeTrait('Hyper','Energy','energy',{energy:48,playfulness:16,sleepiness:-18},'Has a remarkable amount of energy and very little interest in conserving it.',{walking:16,explore:9,zoomies:18,sitting:-8,sleeping:-8}),
    universeTrait('Bouncy','Energy','energy',{energy:34,playfulness:25},'Approaches ordinary life with a little more bounce than strictly necessary.',{walking:9,zoomies:12,looking:4}),
    universeTrait('Relaxed','Energy','energy',{energy:-25,patience:20,sensitivity:-8},'Rarely seems in a hurry and is very good at simply being comfortable.',{resting:12,sitting:10,walking:-5}),
    universeTrait('Lazy','Energy','energy',{energy:-42,sleepiness:18,trainDrive:-12},'Would usually rather choose the comfortable option than the energetic one.',{resting:18,sitting:13,sleeping:13,walking:-11,flight:-9}),
    universeTrait('Slow Starter','Energy','energy',{energy:-22,circadian:18},'Takes a while to get going, then settles into the day at its own pace.',{idle:9,looking:5,walking:-4}),
    universeTrait('Second Wind','Energy','energy',{energy:20,circadian:28,playfulness:10},'Often becomes noticeably more animated later in the day.',{walking:7,explore:5,zoomies:5}),
    universeTrait('Zoomies-Prone','Energy','energy',{energy:28,playfulness:38,mischief:8},'Sudden high-speed laps of the room are an entirely normal part of the schedule.',{zoomies:32,walking:8,resting:-5}),

    universeTrait('Morning Dragon','Rhythm','circadian',{circadian:-48,patience:8},'Seems brightest and most interested in the world early in the day.',{walking:5,looking:5}),
    universeTrait('Night Owl','Rhythm','circadian',{circadian:48,energy:8},'Often seems to find a second life once the evening arrives.',{walking:6,looking:7,sleeping:-5}),
    universeTrait('Early Riser','Rhythm','circadian',{circadian:-38,energy:15},'Rarely needs much convincing to begin the day.',{walking:6,explore:3}),
    universeTrait('Late Riser','Rhythm','circadian',{circadian:38,sleepiness:20},'Treats mornings as a suggestion rather than a firm arrangement.',{sleeping:10,resting:7,walking:-4}),
    universeTrait('Sunset Spark','Rhythm','circadian',{circadian:30,playfulness:20},'Often perks up as the light begins to fade.',{play:0,zoomies:7,walking:5}),

    universeTrait('Affectionate','Social','social-warmth',{affection:42,sociability:18,attachment:20},'Enjoys reassurance, touch and familiar company.',{looking:7,walking:4}),
    universeTrait('Friendly','Social','social-warmth',{sociability:38,affection:22,socialConfidence:16},'Generally assumes company is a good thing.',{looking:8,walking:5}),
    universeTrait('Gentle','Social','social-warmth',{affection:24,mischief:-22,sensitivity:12},'Has a naturally soft way of approaching people and objects.',{resting:7,sitting:6,zoomies:-6}),
    universeTrait('Quiet Companion','Social','social-warmth',{sociability:-24,affection:24,patience:20},'Likes being nearby without needing to be the centre of attention.',{sitting:8,resting:6,looking:5}),
    universeTrait('Social Butterfly','Social','social-warmth',{sociability:48,socialConfidence:22},'Is unusually interested in whatever everyone else is doing.',{walking:7,looking:10,resting:-4}),
    universeTrait('Bossy','Social','social-warmth',{stubbornness:32,sociability:18,mischief:10},'Has strong opinions about how household business should be conducted.',{looking:9,walking:5}),

    universeTrait('Shy','Social','social-confidence',{socialConfidence:-44,sensitivity:24,bravery:-12},'Takes time to warm up and prefers familiar, predictable company.',{looking:8,resting:6,explore:-6},{noisy:-20,hideable:18}),
    universeTrait('Confident','Social','social-confidence',{socialConfidence:42,bravery:18},'Carries itself as though most situations are probably manageable.',{explore:7,walking:5,looking:4}),
    universeTrait('Suspicious of Strangers','Social','social-confidence',{socialConfidence:-34,independence:12,sensitivity:18},'Keeps an eye on unfamiliar company before deciding what to make of them.',{looking:11,resting:4}),
    universeTrait('Attention Seeker','Social','social-confidence',{socialConfidence:30,sociability:24,attachment:14},'Has developed a talent for making sure it is noticed.',{looking:10,walking:6}),
    universeTrait('Drama Queen','Social','social-confidence',{socialConfidence:18,sensitivity:25,mischief:15},'Small events occasionally receive extremely large reactions.',{looking:11,zoomies:6,resting:4}),

    universeTrait('Cuddlebug','Keeper Bond','attachment',{attachment:48,affection:30,independence:-18},'Would happily make familiar affection part of the daily routine.',{looking:7,resting:5}),
    universeTrait('Shadow','Keeper Bond','attachment',{attachment:50,independence:-30},'Often seems happiest keeping tabs on the keeper from nearby.',{walking:7,looking:8}),
    universeTrait('Keeper-Focused','Keeper Bond','attachment',{attachment:40,sociability:12},'Pays particular attention to the keeper’s movements and routines.',{looking:10,walking:5}),
    universeTrait('Independent Friend','Keeper Bond','attachment',{attachment:-34,independence:38,affection:12},'Clearly cares, but prefers to choose when and how to show it.',{explore:8,walking:5,idle:3}),
    universeTrait('Clingy','Keeper Bond','attachment',{attachment:46,independence:-38,sensitivity:14},'Likes familiar company close enough to keep an eye on.',{looking:9,walking:7}),
    universeTrait('Quietly Loyal','Keeper Bond','attachment',{attachment:26,affection:22,patience:22},'Shows trust in small, consistent ways rather than dramatic displays.',{sitting:6,looking:6}),
    universeTrait('Greeting Enthusiast','Keeper Bond','attachment',{attachment:35,energy:20,socialConfidence:18},'Treats the keeper returning home as an event worth acknowledging properly.',{walking:7,zoomies:4}),
    universeTrait('Door Waiter','Keeper Bond','attachment',{attachment:30,routine:20,patience:14},'Has a habit of noticing doors and the people who come through them.',{looking:8,idle:4}),
    universeTrait('Protective Companion','Keeper Bond','attachment',{attachment:32,bravery:24,sensitivity:8},'Seems especially alert when familiar company is nearby.',{looking:9,walking:4}),
    universeTrait('Bedtime Companion','Keeper Bond','attachment',{attachment:24,sleepiness:22,routine:18},'Likes the end of the day to feel familiar and shared.',{resting:8,sleeping:7}),

    universeTrait('Curious','Curiosity','curiosity',{curiosity:44,intelligence:12},'Notices changes quickly and wants to understand what they are.',{looking:11,explore:10,furniture:10},{inspectable:14}),
    universeTrait('Nosy','Curiosity','curiosity',{curiosity:38,mischief:18},'Has a strong belief that absolutely everything is its business.',{looking:12,explore:12,furniture:12},{openable:14,inspectable:12}),
    universeTrait('Observant','Curiosity','curiosity',{curiosity:24,intelligence:26,patience:18},'Often watches first and acts second.',{looking:16,idle:4},{window:12}),
    universeTrait('Furniture Inspector','Curiosity','curiosity',{curiosity:42,routine:-16},'New furnishings tend to receive a very thorough inspection.',{furniture:24,explore:8},{inspectable:24}),
    universeTrait('Door Inspector','Curiosity','curiosity',{curiosity:32,routine:10},'Doors, thresholds and entrances seem disproportionately fascinating.',{looking:10,walking:7}),
    universeTrait('Easily Distracted','Curiosity','curiosity',{curiosity:34,patience:-30,intelligence:-5},'Can begin with one plan and become fascinated by something completely different.',{looking:12,explore:9,walking:5}),
    universeTrait('Cautious Investigator','Curiosity','curiosity',{curiosity:28,bravery:-18,patience:24},'Wants to investigate, but prefers to do it carefully.',{looking:14,explore:5},{inspectable:12,hideable:5}),

    universeTrait('Explorer','Curiosity','exploration',{outdoorAffinity:32,curiosity:32,bravery:12},'Rarely seems satisfied with seeing only the familiar parts of home.',{explore:24,walking:9,stairs:7}),
    universeTrait('Fearless Explorer','Curiosity','exploration',{outdoorAffinity:38,curiosity:28,bravery:34},'Treats unfamiliar places as invitations rather than warnings.',{explore:22,stairs:8,flight:8}),
    universeTrait('Homebody','Curiosity','exploration',{outdoorAffinity:-38,routine:22,sensitivity:10},'Feels most secure when the surroundings are familiar.',{resting:9,sitting:7,explore:-10}),
    universeTrait('Indoor Dragon','Curiosity','exploration',{outdoorAffinity:-42,comfort:0,routine:15},'Seems happiest with walls, cushions and familiar household noises nearby.',{resting:9,explore:-8}),
    universeTrait('Wanderer','Curiosity','exploration',{outdoorAffinity:24,independence:24,curiosity:16},'Often invents a route around the house simply because it can.',{walking:14,explore:11}),
    universeTrait('High Place Seeker','Curiosity','exploration',{bravery:20,curiosity:20,energy:15},'Has a persistent interest in perches and anything that offers a better view.',{stairs:8,flight:5},{perchable:20,climbable:12}),

    universeTrait('Playful','Play','play',{playfulness:44,energy:12},'Games and toys make up a large part of a good day.',{zoomies:10,furniture:12,walking:6},{playable:24}),
    universeTrait('Toy Obsessed','Play','play',{playfulness:48,routine:8},'Can become extremely attached to the right toy.',{furniture:22,zoomies:8},{playable:32,hoardable:10}),
    universeTrait('Puzzle Lover','Play','play',{playfulness:22,intelligence:34,curiosity:20},'Enjoys activities that require a little figuring out.',{furniture:18,looking:6},{puzzle:34,reading:10}),
    universeTrait('Competitive','Play','play',{playfulness:24,trainDrive:25,stubbornness:18},'Seems to enjoy any activity that can be treated as a challenge.',{furniture:15,zoomies:8},{training:18,exercise:16}),
    universeTrait('Chaser','Play','play',{playfulness:40,energy:28},'Anything that moves has a reasonable chance of becoming a game.',{zoomies:15,walking:8},{playable:18}),
    universeTrait('Gentle Player','Play','play',{playfulness:26,affection:18,mischief:-20},'Likes to play without turning the room upside down.',{furniture:10,sitting:4},{playable:14}),
    universeTrait('Solo Player','Play','play',{playfulness:30,independence:30,sociability:-15},'Is perfectly capable of entertaining itself for long stretches.',{furniture:13,explore:5},{playable:18,puzzle:12}),
    universeTrait('Rough Player','Play','play',{playfulness:32,energy:24,mischief:20},'Games tend to become energetic very quickly.',{zoomies:14,walking:8},{playable:20,scratchable:10}),

    universeTrait('Mischievous','Play','mischief',{mischief:44,curiosity:16},'Finds harmless trouble with impressive efficiency.',{explore:13,looking:7,furniture:10},{openable:18,inspectable:10}),
    universeTrait('Prankster','Play','mischief',{mischief:48,playfulness:24,socialConfidence:10},'Appears to enjoy the reaction almost as much as the mischief itself.',{explore:12,zoomies:8,looking:7},{openable:16,playable:10}),
    universeTrait('Collector','Play','mischief',{mischief:22,routine:18,curiosity:22},'Likes favourite objects to be kept, revisited and occasionally reorganised.',{furniture:12,explore:6},{hoardable:28}),
    universeTrait('Treasure Hunter','Play','mischief',{mischief:26,curiosity:30,outdoorAffinity:15},'Has a suspicious ability to identify anything that might count as treasure.',{explore:14,furniture:9},{hoardable:24,inspectable:10}),
    universeTrait('Well Behaved','Play','mischief',{mischief:-42,patience:16},'Usually chooses the sensible option, which is almost unsettling for a baby dragon.',{sitting:5,resting:5,explore:-4}),
    universeTrait('Tiny Tyrant','Play','mischief',{mischief:36,stubbornness:38,socialConfidence:12},'Small body. Very strong opinions.',{looking:9,walking:7,furniture:7}),

    universeTrait('Greedy','Food','food',{foodDrive:44,appetite:34},'Food receives immediate and enthusiastic attention.',{walking:6,looking:5},{food:30}),
    universeTrait('Foodie','Food','food',{foodDrive:34,intelligence:12,curiosity:10},'Appears to take meals rather more seriously than most.',{looking:5,furniture:7},{food:24,drink:8}),
    universeTrait('Picky','Food','food',{foodDrive:-18,stubbornness:30,sensitivity:18},'Can be surprisingly particular about what counts as an acceptable snack.',{looking:5},{food:4}),
    universeTrait('Treat Obsessed','Food','food',{foodDrive:42,playfulness:18,attachment:8},'Has learned that treat-related noises are extremely important.',{walking:8,zoomies:5},{food:28,puzzle:12}),
    universeTrait('Slow Eater','Food','food',{foodDrive:8,patience:32,energy:-10},'Prefers to take its time rather than inhale a meal.',{resting:3},{food:14}),
    universeTrait('Excitable Eater','Food','food',{foodDrive:35,energy:20,playfulness:12},'Meal time tends to be preceded by a small amount of chaos.',{walking:8,zoomies:6},{food:26}),
    universeTrait('Snack Hunter','Food','food',{foodDrive:32,curiosity:18,mischief:16},'Regularly checks whether the household might have accidentally produced another snack.',{explore:7,looking:7},{food:24,openable:12}),
    universeTrait('Polite Eater','Food','food',{foodDrive:12,patience:25,stubbornness:-12},'Shows an unusual amount of restraint around food.',{idle:4},{food:12}),
    universeTrait('Always Hungry','Food','food',{foodDrive:48,appetite:42},'Could be fed five minutes ago and still consider checking the bowl worthwhile.',{walking:7,looking:6},{food:32}),
    universeTrait('Suspicious of New Food','Food','food',{foodDrive:5,curiosity:-8,sensitivity:24,stubbornness:18},'Treats unfamiliar food as a mystery that may need investigating first.',{looking:7},{food:6}),

    universeTrait('Focused','Training','training',{trainDrive:38,intelligence:24,patience:24},'Can stay with a task longer than most baby dragons.',{furniture:14,looking:4},{training:24,puzzle:12}),
    universeTrait('Natural Athlete','Training','training',{trainDrive:40,energy:28,bravery:10},'Physical practice seems to make immediate intuitive sense.',{furniture:18,walking:5},{training:28,exercise:24,agility:20}),
    universeTrait('Born Flyer','Training','training',{trainDrive:26,bravery:24,energy:16},'Flying practice seems to come unusually naturally.',{flight:20,explore:5},{'flight-practice':32,perchable:12}),
    universeTrait('Strong','Training','training',{trainDrive:22,energy:24,stubbornness:18},'Seems particularly interested in resistance and strength work.',{furniture:12},{training:18,exercise:22}),
    universeTrait('Agile','Training','training',{trainDrive:24,energy:28,playfulness:14},'Enjoys activities that involve balance, speed and quick changes of direction.',{zoomies:8,furniture:13},{agility:28,climbable:18}),
    universeTrait('Persistent','Training','training',{trainDrive:28,stubbornness:22,patience:26},'Does not give up on a difficult activity easily.',{furniture:12,looking:4},{training:20,puzzle:12}),
    universeTrait('Quick Learner','Training','training',{trainDrive:26,intelligence:34,curiosity:18},'Seems to understand the point of new activities unusually quickly.',{furniture:12,looking:6},{puzzle:20,reading:16,training:12}),
    universeTrait('Show-Off','Training','training',{trainDrive:22,socialConfidence:28,playfulness:15},'Training becomes much more interesting when somebody is watching.',{furniture:12,zoomies:5},{training:18}),
    universeTrait('Reluctant Trainee','Training','training',{trainDrive:-40,energy:-10,stubbornness:24},'Training is acceptable, provided there was genuinely nothing more comfortable available.',{furniture:-9,resting:8},{training:-14,exercise:-12}),
    universeTrait('Training Addict','Training','training',{trainDrive:48,energy:22,routine:12},'Regular practice has a habit of becoming the day’s main event.',{furniture:20,walking:5},{training:30,exercise:24}),
    universeTrait('Praise Motivated','Training','training',{trainDrive:18,attachment:20,socialConfidence:14},'Seems particularly pleased when practice earns attention from the keeper.',{furniture:10},{training:16}),
    universeTrait('Treat Motivated','Training','training',{trainDrive:18,foodDrive:24,playfulness:8},'Would like it formally recorded that snacks improve most educational experiences.',{furniture:10},{training:12,puzzle:16,food:8}),
    universeTrait('Routine Learner','Training','training',{trainDrive:18,routine:34,patience:20},'Learns best when familiar practice becomes part of a routine.',{furniture:11},{training:16}),

    universeTrait('Heavy Sleeper','Sleep','sleep',{sleepiness:44,sensitivity:-18},'Once asleep, treats waking up as somebody else’s problem.',{sleeping:20,resting:7}),
    universeTrait('Light Sleeper','Sleep','sleep',{sleepiness:8,sensitivity:32,energy:8},'Settles easily enough, but does not seem to miss much while resting.',{sleeping:4,looking:5}),
    universeTrait('Nap Lover','Sleep','sleep',{sleepiness:38,routine:12},'Believes a perfectly ordinary day contains room for at least one excellent nap.',{sleeping:19,resting:11},{sleepable:22,comfortable:12}),
    universeTrait('Bed Loyalist','Sleep','sleep',{sleepiness:24,routine:38},'Once a favourite bed is chosen, alternatives face an uphill battle.',{sleeping:12},{sleepable:18}),
    universeTrait('Floor Sleeper','Sleep','sleep',{sleepiness:24,routine:-10,comfort:0},'Has surprisingly democratic views on what technically counts as a bed.',{sleeping:9,resting:5}),
    universeTrait('Warm Spot Seeker','Sleep','sleep',{sleepiness:20,sensitivity:10},'Quietly gravitates towards warm, comfortable resting spots.',{resting:10,sleeping:8},{warm:30,comfortable:18}),
    universeTrait('Corner Sleeper','Sleep','sleep',{sleepiness:24,socialConfidence:-14,routine:15},'Seems to settle best when a cosy edge of the room feels safely tucked away.',{sleeping:9,resting:8},{hideable:14,comfortable:12}),
    universeTrait('Restless Sleeper','Sleep','sleep',{sleepiness:24,energy:18,sensitivity:20},'Likes sleep in theory, but rarely approaches it in a straight line.',{walking:4,sleeping:6}),
    universeTrait('Dreamer','Sleep','sleep',{sleepiness:20,sensitivity:18,intelligence:10},'Sometimes seems to be having a much more interesting night than everyone else.',{sleeping:8,resting:4}),
    universeTrait('Sleep Talker','Sleep','sleep',{sleepiness:22,sociability:8,sensitivity:8},'Occasionally makes tiny noises while completely asleep.',{sleeping:8}),

    universeTrait('Very Clean','Cleanliness','cleanliness',{cleanliness:48,routine:14},'Notices dirt quickly and seems genuinely pleased after a proper clean.',{furniture:6},{washable:28,groomable:24,sandbath:16}),
    universeTrait('Self-Groomer','Cleanliness','cleanliness',{cleanliness:36,independence:18},'Takes a little more responsibility for personal presentation than expected.',{furniture:5},{groomable:24}),
    universeTrait('Messy','Cleanliness','cleanliness',{cleanliness:-42,playfulness:12},'Has a relaxed interpretation of what counts as clean enough.',{explore:4},{washable:-10,groomable:-8}),
    universeTrait('Dirt Magnet','Cleanliness','cleanliness',{cleanliness:-28,playfulness:20,mischief:10},'Can leave a perfectly clean corner and somehow return looking less clean.',{explore:6,walking:4}),
    universeTrait('Mud Lover','Cleanliness','cleanliness',{cleanliness:-30,waterAffinity:10,playfulness:24},'Considers mud less of a problem and more of an activity.',{furniture:7},{sandbath:16,diggable:18}),

    universeTrait('Bath Lover','Cleanliness','water',{waterAffinity:42,cleanliness:18,playfulness:14},'Treats bath time as entertainment rather than maintenance.',{furniture:10},{washable:34}),
    universeTrait('Bath Hater','Cleanliness','water',{waterAffinity:-46,stubbornness:18,sensitivity:14},'Regards bathing with deep and consistent suspicion.',{furniture:-4},{washable:-28}),
    universeTrait('Sand Bath Fan','Cleanliness','water',{waterAffinity:12,cleanliness:20,playfulness:12},'Has a clear preference for sand-based cleaning when given the choice.',{furniture:7},{sandbath:36,washable:-5}),
    universeTrait('Water Baby','Cleanliness','water',{waterAffinity:48,playfulness:18},'Anything involving water immediately becomes more interesting.',{furniture:10},{washable:30,hydration:10}),
    universeTrait('Puddle Seeker','Cleanliness','water',{waterAffinity:38,outdoorAffinity:16,mischief:12},'Would like every damp patch to be assessed personally.',{explore:6}),
    universeTrait('Rain Lover','Cleanliness','water',{waterAffinity:30,outdoorAffinity:18,sensitivity:-8},'Seems especially interested in the house when rain can be heard outside.',{looking:8,explore:4},{window:14}),

    universeTrait('Sensitive','Emotion','emotional',{sensitivity:44,affection:12},'Notices changes in mood and environment quickly.',{looking:9,resting:4}),
    universeTrait('Easygoing','Emotion','emotional',{sensitivity:-36,patience:24,stubbornness:-14},'Most minor inconveniences are allowed to remain minor.',{resting:8,sitting:5}),
    universeTrait('Dramatic','Emotion','emotional',{sensitivity:30,mischief:16,socialConfidence:15},'Has a gift for making its current opinion extremely obvious.',{looking:11,zoomies:7,resting:4}),
    universeTrait('Moody','Emotion','emotional',{sensitivity:30,stubbornness:18,circadian:8},'Can be perfectly content one moment and deeply unconvinced by life the next.',{looking:7,resting:6}),
    universeTrait('Soft-Hearted','Emotion','emotional',{sensitivity:26,affection:30,mischief:-12},'Responds strongly to reassurance and familiar company.',{resting:6,looking:6}),
    universeTrait('Proud','Emotion','emotional',{socialConfidence:24,trainDrive:18,stubbornness:14},'Seems to know when it has done something well.',{looking:6,furniture:6}),
    universeTrait('Sulky','Emotion','emotional',{sensitivity:24,stubbornness:30,socialConfidence:-10},'Sometimes needs a minute to communicate that it is still thinking about an injustice.',{resting:8,sitting:7}),
    universeTrait('Forgiving','Emotion','emotional',{sensitivity:-8,affection:22,patience:26},'Returns to normal quickly after small annoyances.',{resting:5,walking:3}),
    universeTrait('Resilient','Emotion','emotional',{sensitivity:-18,bravery:22,patience:18},'Recovers quickly after unfamiliar or awkward moments.',{explore:5,walking:4}),

    universeTrait('Brave','Emotion','courage',{bravery:44,socialConfidence:12},'New situations rarely produce more than a brief hesitation.',{explore:9,flight:7,stairs:4}),
    universeTrait('Nervous','Emotion','courage',{bravery:-42,sensitivity:28},'Prefers to understand a situation before getting involved.',{looking:11,resting:6,explore:-7},{hideable:18}),
    universeTrait('Cautious','Emotion','courage',{bravery:-28,patience:20,curiosity:12},'Usually checks before committing to a new idea.',{looking:10,explore:-3}),
    universeTrait('Fearless','Emotion','courage',{bravery:48,energy:12},'Unfamiliar situations rarely seem capable of putting it off.',{explore:10,flight:10,stairs:5}),
    universeTrait('Patient','Emotion','courage',{patience:44,energy:-8},'Is unusually good at waiting, watching and choosing a moment.',{idle:8,looking:8}),
    universeTrait('Impatient','Emotion','courage',{patience:-44,energy:18,stubbornness:10},'Waiting is tolerated only when absolutely unavoidable.',{walking:11,zoomies:7,idle:-8}),
    universeTrait('Stubborn','Emotion','courage',{stubbornness:48,independence:14},'Once a decision has been made, persuasion can become a lengthy process.',{idle:5,resting:4}),

    universeTrait('Garden Lover','Environment','environment',{outdoorAffinity:42,curiosity:12},'Seems happiest when there is something natural nearby to inspect.',{explore:9,walking:5},{nature:28,diggable:10}),
    universeTrait('Sunbather','Environment','environment',{outdoorAffinity:18,waterAffinity:-5,sleepiness:12},'Can turn a warm bright spot into a serious appointment.',{resting:10,sitting:6},{warm:16}),
    universeTrait('Shade Seeker','Environment','environment',{outdoorAffinity:4,sensitivity:18,sleepiness:10},'Often gravitates towards calmer, shaded-feeling corners.',{resting:8},{hideable:12,comfortable:10}),
    universeTrait('Fireplace Lover','Environment','environment',{sleepiness:18,sensitivity:8,routine:10},'Has an impressive ability to locate the warmest part of a room.',{resting:10,sitting:7},{warm:36}),
    universeTrait('Cosy Corner Lover','Environment','environment',{socialConfidence:-10,sleepiness:16,routine:20},'Quiet corners repeatedly become very serious candidates for favourite spot.',{resting:10,sitting:7},{hideable:18,comfortable:18}),
    universeTrait('Window Watcher','Environment','environment',{curiosity:26,patience:20,outdoorAffinity:8},'Can spend a surprising amount of time watching the world outside.',{looking:18,idle:5},{window:38}),
    universeTrait('Plant Inspector','Environment','environment',{curiosity:24,outdoorAffinity:18},'Plants and nature-themed furnishings rarely escape inspection.',{looking:8,furniture:8},{nature:28,inspectable:8}),

    universeTrait('Creature of Habit','Routine','routine',{routine:48,curiosity:-8},'Likes familiar places, familiar timings and familiar objects.',{resting:7,sleeping:6,explore:-6}),
    universeTrait('Routine Companion','Routine','routine',{routine:40,attachment:18},'Quickly learns the rhythm of the household and seems to enjoy recognising it.',{looking:7,resting:5}),
    universeTrait('Spontaneous','Routine','routine',{routine:-42,curiosity:20,playfulness:12},'Has little interest in doing today exactly as yesterday was done.',{explore:10,walking:6,looking:4}),
    universeTrait('Familiarity Seeker','Routine','routine',{routine:36,sensitivity:18,bravery:-8},'Prefers objects and places that already feel known.',{resting:7,furniture:6}),
    universeTrait('Change Lover','Routine','routine',{routine:-38,curiosity:28},'New arrangements and unfamiliar objects tend to be interesting rather than alarming.',{explore:9,furniture:9},{inspectable:16})
  ];
  const DRAGONBOUND_UNIVERSE_TRAIT_BY_NAME=Object.fromEntries(DRAGONBOUND_UNIVERSE_TRAITS.map(t=>[t.name,t]));

  const universeQuirk=(id,label,note,evidence,min=3,families=[])=>({id,label,note,evidence,min,families});
  const DRAGONBOUND_UNIVERSE_QUIRKS=[
    universeQuirk('sleep-circles','Circles Before Sleeping','Usually performs a tiny settling lap before a serious nap.','sleep',3,['Sleep','Routine']),
    universeQuirk('fireplace-stare','Fireplace Stare','Can spend an unreasonable amount of time simply looking at a warm hearth.','warm',3,['Environment']),
    universeQuirk('morning-bowl-check','Morning Bowl Check','Food areas receive an early inspection surprisingly often.','food',4,['Food','Rhythm']),
    universeQuirk('door-sitter','Door Sitter','Frequently chooses spots near doors and thresholds.','explore',7,['Keeper Bond','Curiosity']),
    universeQuirk('small-bed','Small Bed Loyalist','Has a habit of choosing a more modest sleeping spot than expected.','sleep',4,['Sleep']),
    universeQuirk('upside-down-dreamer','Upside-Down Dreamer','Occasionally manages to make sleeping look structurally questionable.','sleep',5,['Sleep']),
    universeQuirk('across-room-watcher','Across-the-Room Watcher','Often keeps track of the keeper without needing to be right beside them.','keeper',5,['Keeper Bond','Social']),
    universeQuirk('treat-zoomies','Treat Zoomies','Dragon Bites have an unusually strong chance of being followed by chaos.','treat',3,['Food','Energy','Play']),
    universeQuirk('toy-carrier','Carries a Toy Around','Likes moving favourite playthings from one place to another.','play',4,['Play']),
    universeQuirk('new-furniture-first','First to Inspect','New furniture rarely remains uninvestigated for long.','newFurniture',3,['Curiosity']),
    universeQuirk('rug-stander','Rug Inspector','Soft floor furnishings seem to deserve repeated inspection.','furniture',6,['Curiosity','Routine']),
    universeQuirk('bedroom-follower','Bedroom Follower','Often seems to follow familiar household movement towards quieter rooms.','keeper',6,['Keeper Bond']),
    universeQuirk('bed-check-route','Bedtime Patrol','Likes a small wander before finally settling down.','sleep',5,['Sleep','Routine']),
    universeQuirk('window-routine','Window Routine','Returns to window-watching often enough for it to count as a hobby.','window',4,['Environment','Curiosity']),
    universeQuirk('plant-sitter','Plant Sitter','Frequently chooses spots beside plants or nature furnishings.','furniture',6,['Environment']),
    universeQuirk('high-percher','High Percher','Seems convinced that higher places have better information.','climb',3,['Curiosity','Environment']),
    universeQuirk('corner-collector','Corner Collector','Keeps finding reasons to visit the same quiet corners.','rest',5,['Sleep','Routine']),
    universeQuirk('pre-bed-wander','Pre-Bed Wander','Often makes one last little trip around the room before sleeping.','sleep',4,['Routine']),
    universeQuirk('wake-lap','Wake-Up Lap','A proper day apparently begins with a circuit of the house.','walk',8,['Energy','Routine']),
    universeQuirk('regional-furniture','Homeland Taste','Shows a noticeable fondness for furnishings that feel familiar to its region.','furniture',7,['Routine','Environment']),
    universeQuirk('simple-taste','Simple Taste','Expensive furniture does not automatically impress this dragon.','furniture',7,['Routine']),
    universeQuirk('training-watched','Performs for an Audience','Training seems more satisfying when the keeper is nearby.','training',4,['Training','Keeper Bond']),
    universeQuirk('training-private','Private Practice','Sometimes seems more interested in training when left to get on with it.','training',4,['Training','Keeper Bond']),
    universeQuirk('praise-glow','Praise Glow','A successful bit of attention after training produces a very obvious proud mood.','training',4,['Training','Emotion']),
    universeQuirk('pet-jealousy','Keeps an Eye on Other Pets','Other household pets receive a little more scrutiny than expected.','keeper',7,['Social','Keeper Bond']),
    universeQuirk('post-meal-nap','Post-Meal Napper','Eating and sleeping have started appearing suspiciously close together.','eatSleep',3,['Food','Sleep']),
    universeQuirk('pre-bed-play','Bedtime Player','Often manages to fit one last game in before settling down.','playSleep',3,['Play','Sleep']),
    universeQuirk('sunset-energy','Sunset Zoom','Energy frequently seems to return in the evening.','evening',5,['Rhythm','Energy']),
    universeQuirk('rain-napper','Rain Napper','Bad weather has a suspicious habit of making naps more attractive.','rest',5,['Environment','Sleep']),
    universeQuirk('sun-patch','Sun Patch Hunter','Bright warm spots repeatedly become places worth lingering.','warm',3,['Environment']),
    universeQuirk('noise-avoid','Noise Skeptic','Noisy furnishings are approached with more caution than the quiet ones.','hide',3,['Social','Emotion']),
    universeQuirk('clutter-fan','Clutter Fan','Seems more interested when a room has plenty of objects to investigate.','furniture',7,['Curiosity']),
    universeQuirk('empty-room','Empty-Room Enjoyer','Occasionally chooses the least busy bit of the house on purpose.','rest',5,['Social','Routine']),
    universeQuirk('old-favourites','Old Favourite Loyalist','Familiar objects keep winning even when newer alternatives appear.','favourite',4,['Routine']),
    universeQuirk('fast-bonder-object','Fast Furniture Bond','Can become attached to a new object unusually quickly.','newFurniture',4,['Curiosity','Routine']),
    universeQuirk('snack-cupboard','Cupboard Auditor','Checks storage furniture with the seriousness of a professional inspector.','mischief',3,['Food','Play']),
    universeQuirk('bath-marathon','Bath Marathoner','Some baths last noticeably longer than the job requires.','bath',4,['Cleanliness']),
    universeQuirk('wake-scratch','Morning Scratch','Scratching often seems to be part of getting properly awake.','scratch',3,['Rhythm','Play']),
    universeQuirk('night-eater','Night Snacker','Food interest appears especially strong later in the day.','food',5,['Food','Rhythm']),
    universeQuirk('puddle-business','Puddle Business','Any watery area appears to need personal inspection.','bath',4,['Cleanliness','Environment']),
    universeQuirk('moving-furniture-suspicion','Moving Furniture Suspicion','Redecorating tends to earn a period of careful observation.','newFurniture',3,['Routine','Curiosity']),
    universeQuirk('hide-and-peek','Hide and Peek','Likes disappearing into a quiet spot and checking the room from there.','hide',3,['Social','Play']),
    universeQuirk('narrow-space','Narrow-Space Enthusiast','Small cosy gaps seem disproportionately appealing.','hide',3,['Sleep','Environment']),
    universeQuirk('garden-after-wake','Garden First','Exploration often becomes the first proper activity of the day.','walk',7,['Environment','Rhythm']),
    universeQuirk('treat-stare','Treat Cupboard Stare','Has perfected a look specifically for places where treats might exist.','treat',4,['Food','Keeper Bond']),
    universeQuirk('training-rest','Post-Training Flop','Hard practice is frequently followed by a very deliberate rest.','trainingRest',3,['Training','Sleep']),
    universeQuirk('bath-bed','Clean Then Cosy','Bathing and settling down have begun to form a familiar little sequence.','bathSleep',3,['Cleanliness','Sleep']),
    universeQuirk('same-window','One Particular Window','Not all views are apparently equal. One window gets more attention than the rest.','window',5,['Environment','Routine']),
    universeQuirk('tiny-hoard','Tiny Hoard','Favourite little objects keep ending up together.','hoard',3,['Play','Curiosity']),
    universeQuirk('dramatic-refusal','Dramatic Refusal','Occasionally communicates a lack of enthusiasm with unnecessary theatricality.','rest',6,['Emotion','Training']),
    universeQuirk('keeper-check-in','Keeper Check-In','Regularly pauses its own plans just long enough to see what the keeper is doing.','keeper',6,['Keeper Bond'])
  ];
  const DRAGONBOUND_UNIVERSE_QUIRK_BY_ID=Object.fromEntries(DRAGONBOUND_UNIVERSE_QUIRKS.map(q=>[q.id,q]));
  const universeHash=value=>{let h=2166136261>>>0;for(const ch of String(value||'')){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;};
  // V33.96: the 2-3 server-owned signature traits are intentionally broad.
  // They bias decisions; they never replace needs, commands, pathing, or race fairness.
  const SIGNATURE_TRAIT_ACTION_MODIFIERS={
    'Lazy':{sleeping:18,resting:15,sitting:8,walking:-7,explore:-8,flight:-7,zoomies:-12},
    'Energetic':{walking:9,explore:7,furniture:5,flight:5,zoomies:12,sleeping:-7},
    'Curious':{looking:10,explore:13,furniture:11,walking:4},
    'Mischievous':{explore:9,furniture:8,zoomies:6,looking:4},
    'Clingy':{looking:7,walking:5,resting:2},
    'Independent':{explore:8,walking:6,looking:-2},
    'Food Obsessed':{furniture:12,walking:3,looking:3},
    'Sleepy':{sleeping:17,resting:11,sitting:5,zoomies:-6},
    'Playful':{furniture:13,zoomies:10,explore:6,walking:4},
    'Brave':{explore:7,flight:8,stairs:4},
    'Shy':{resting:7,sitting:6,looking:6,explore:-5,flight:-5},
    'Competitive':{furniture:10,explore:4,flight:4},
    'Stubborn':{idle:5,resting:3,looking:2},
    'Affectionate':{looking:7,walking:4,sitting:3},
    'Clean':{furniture:7},
    'Messy':{furniture:-2,explore:3},
    'Easily Excited':{zoomies:13,walking:5,flight:4,furniture:4,resting:-3},
    'Calm':{sitting:8,resting:8,looking:5,zoomies:-11,walking:-2},
    'Adventurous':{explore:12,stairs:6,flight:8,walking:4}
  };
  const universeRng=seed=>{let a=(Number(seed)||1)>>>0;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};};
  const universeAxis=(axes,key,f=50)=>pNum(axes?.[key],f);
  const universeTraitScore=(def,axes,jitter=0)=>{let score=50;for(const [key,weight] of Object.entries(def.weights||{}))score+=((universeAxis(axes,key)-50)/50)*Number(weight||0);return score+jitter;};
  const universeTraitNames=list=>(Array.isArray(list)?list:[]).map(v=>typeof v==='string'?v:String(v?.name||'')).filter(Boolean);
  const pNum=(v,f=50)=>clamp(Number.isFinite(Number(v))?Number(v):f,0,100);
  const pStats=dragon=>{const src=dragon?.personality?.coreStats||{};const out={};PERSONALITY_STAT_KEYS.forEach(k=>out[k]=pNum(src[k]));return out;};
  const pArray=v=>Array.isArray(v)?v.filter(x=>typeof x==='string').slice(0,20):[];
  const boundedObject=(v,f={})=>v&&typeof v==='object'&&!Array.isArray(v)?v:f;
  const locationKey=(floor,p)=>`${floor}:${Math.round(p[0]*24)}:${Math.round(p[1]*24)}`;
  const weightedChoiceFromScores=scores=>{const entries=Object.entries(scores).filter(([,v])=>v>0);if(!entries.length)return'idle';const weighted=entries.map(([k,v])=>[k,Math.pow(Math.max(1,v),1.35)]),total=weighted.reduce((s,e)=>s+e[1],0);let r=Math.random()*total;for(const [k,w] of weighted){r-=w;if(r<=0)return k;}return weighted[0][0];};

  class BabyDragonActor{
    constructor(engine,dragon,map){
      this.engine=engine;this.dragon=dragon;this.def=REGISTRY[dragon.breedId];this.map=map;this.floorId='downstairs';this.pos=[0,0];this.facing='right';this.state='idle';this.path=[];this.pathIndex=0;this.nextDecision=0;this.stateUntil=0;this.frameIndex=0;this.frameAt=0;this.lastAction='';this.lastStairUse=0;this.lastFlight=0;this.floorEntered=Date.now();this.pauseUntil=0;this.el=null;this.img=null;this.hoverCard=null;this.hoverAge=null;this.hoverGender=null;this.hoverNature=null;this.hoverBond=null;this.hoverPet=null;this.hoverTimer=0;this.hoverMoveHandler=null;this.hoverVisible=false;this.petAudio=null;this.petLove=null;this.petLoveTimer=0;this.bondTogetherSeconds=0;this.bondNeglectSeconds=0;this.greetingTimer=0;
      this.personality=this.def?.personality||{};this.behaviour=getBehaviour(dragon.breedId);this.coreStats=pStats(dragon);this.dailyMood=this.normaliseDailyMood(dragon?.mood||dragon?.dragonMood||{});this.dailyPreferencesState=this.normaliseDailyPreferences(dragon?.dailyPreferences||{});
      this.assignedTraits=pArray(dragon?.traits?.assigned||dragon?.personality?.quirks);this.discoveredTraits=pArray(dragon?.traits?.discovered);this.signatureTraits=pArray(dragon?.traits?.signature||dragon?.personality?.signatureTraits).slice(0,3);
      this.preferences=boundedObject(dragon?.preferences,{preferredFloor:dragon?.personality?.preferencesSeed?.preferredFloor||'downstairs',formed:{}});if(!this.preferences.formed)this.preferences.formed={};
      this.memory=boundedObject(dragon?.memory,{});this.memory.recentActions=pArray(this.memory.recentActions).slice(-8);this.memory.activityCounts=boundedObject(this.memory.activityCounts,{});this.memory.floorVisits=boundedObject(this.memory.floorVisits,{downstairs:0,upstairs:0});this.memory.sleepLocations=boundedObject(this.memory.sleepLocations,{});this.memory.visitedLocations=boundedObject(this.memory.visitedLocations,{});this.memory.observationCounters=boundedObject(this.memory.observationCounters,{});this.memory.firsts=boundedObject(this.memory.firsts,{});this.memory.traitDiscoveredAt=boundedObject(this.memory.traitDiscoveredAt,{});this.memory.lifeHistory=Array.isArray(this.memory.lifeHistory)?this.memory.lifeHistory.filter(x=>x&&typeof x==='object').slice(0,40):[];this.memory.socialUniverse=boundedObject(this.memory.socialUniverse,{version:1,relationships:{},socialMoments:[],milestones:{}});this.memory.socialUniverse.version=1;this.memory.socialUniverse.relationships=boundedObject(this.memory.socialUniverse.relationships,{});this.memory.socialUniverse.socialMoments=Array.isArray(this.memory.socialUniverse.socialMoments)?this.memory.socialUniverse.socialMoments.filter(x=>x&&typeof x==='object').slice(-30):[];this.memory.socialUniverse.milestones=boundedObject(this.memory.socialUniverse.milestones,{});this.memory.calendarHistory=boundedObject(this.memory.calendarHistory,{version:1,firstEvents:{},eventMoments:[],eventStats:{}});this.memory.calendarHistory.version=1;this.memory.calendarHistory.firstEvents=boundedObject(this.memory.calendarHistory.firstEvents,{});this.memory.calendarHistory.eventMoments=Array.isArray(this.memory.calendarHistory.eventMoments)?this.memory.calendarHistory.eventMoments.filter(x=>x&&typeof x==='object').slice(-25):[];this.memory.calendarHistory.eventStats=boundedObject(this.memory.calendarHistory.eventStats,{});
      this.personalityUniverse=this.ensurePersonalityUniverse();const universeAssigned=[...(this.personalityUniverse.innateTraits||[]),...(this.personalityUniverse.secondaryTraits||[])];this.assignedTraits=[...new Set([...this.assignedTraits,...universeAssigned])].slice(0,20);
      const life=boundedObject(this.memory.dailyLife,{});life.cooldowns=boundedObject(life.cooldowns,{});life.eventCounts=boundedObject(life.eventCounts,{});life.routineCounts=boundedObject(life.routineCounts,{});life.knownFurniture=boundedObject(life.knownFurniture,{});life.moodCounts=boundedObject(life.moodCounts,{});life.recentEvents=Array.isArray(life.recentEvents)?life.recentEvents.filter(v=>typeof v==='string').slice(-10):[];life.lastMeaningfulMoment=boundedObject(life.lastMeaningfulMoment,{});life.lastSeenAt=Number(life.lastSeenAt||0);life.globalReadyAt=Number(life.globalReadyAt||0);this.awayMs=life.lastSeenAt?Math.max(0,Date.now()-life.lastSeenAt):0;this.memory.dailyLife=life;this.currentLifeEvent=null;this.nextLifeEventCheckAt=Date.now()+rand(12000,26000);this.nextMoodSampleAt=Date.now()+45000;this.lifeEventLabel=null;this.returnMomentTimer=0;
      if(!this.memory.lifeHistory.length&&Number(dragon?.hatchedAt)){this.memory.lifeHistory.push({type:'hatch',title:'Hatched into the world',detail:`${dragon?.name||'Your dragon'} joined your home.`,at:Number(dragon.hatchedAt)});}
      this.memory.skills=boundedObject(this.memory.skills,{});this.memory.skillFatigue=boundedObject(this.memory.skillFatigue,{});this.memory.skillCooldowns=boundedObject(this.memory.skillCooldowns,{});this.memory.skillPassiveCooldowns=boundedObject(this.memory.skillPassiveCooldowns,{});this.memory.skillMilestones=boundedObject(this.memory.skillMilestones,{});this.memory.growth=boundedObject(this.memory.growth,{});this.memory.confidenceLocations=boundedObject(this.memory.confidenceLocations,{});
      this.skills=this.initialiseSkills(this.memory.skills);this.memory.skills=this.skills;this.skillTrainingPlan=null;this.skillSessionGain={};this.lastSkillHudEventAt=0;this.migrateLegacySkillHistory();
      this.needs={rest:pNum(this.memory.runtimeNeeds?.rest,30),stimulation:pNum(this.memory.runtimeNeeds?.stimulation,35),social:pNum(this.memory.runtimeNeeds?.social,25),hunger:pNum(this.memory.runtimeNeeds?.hunger,20),comfort:pNum(this.memory.runtimeNeeds?.comfort,30),hygiene:pNum(this.memory.runtimeNeeds?.hygiene,24)};
      this.bond=pNum(this.memory.bond,Math.round(18+this.coreStats.affection*.12));this.memory.bondAwards=boundedObject(this.memory.bondAwards,{});this.memory.bondMilestones=boundedObject(this.memory.bondMilestones,{});
      const keeperRel=boundedObject(this.memory.keeperRelationshipV3405,{});keeperRel.version=1;keeperRel.sharedActivities=boundedObject(keeperRel.sharedActivities,{});keeperRel.visitPeriods=boundedObject(keeperRel.visitPeriods,{});keeperRel.recentMoments=Array.isArray(keeperRel.recentMoments)?keeperRel.recentMoments.filter(v=>v&&typeof v==='object').slice(-12):[];keeperRel.greetings=Math.max(0,Number(keeperRel.greetings)||0);keeperRel.checkIns=Math.max(0,Number(keeperRel.checkIns)||0);keeperRel.nearbyRests=Math.max(0,Number(keeperRel.nearbyRests)||0);keeperRel.pets=Math.max(0,Number(keeperRel.pets)||0);keeperRel.treats=Math.max(0,Number(keeperRel.treats)||0);keeperRel.commands=Math.max(0,Number(keeperRel.commands)||0);keeperRel.guidedActivities=Math.max(0,Number(keeperRel.guidedActivities)||0);keeperRel.returnCount=Math.max(0,Number(keeperRel.returnCount)||0);keeperRel.lastReturnAt=Number(keeperRel.lastReturnAt||0);keeperRel.lastReturnBand=String(keeperRel.lastReturnBand||'');keeperRel.lastVisitStartedAt=Date.now();const visitBucket=Math.floor(Date.now()/1800000);if(Number(keeperRel.lastVisitBucket||0)!==visitBucket){const vh=new Date().getHours(),vp=vh>=5&&vh<11?'morning':vh>=11&&vh<17?'day':vh>=17&&vh<22?'evening':'night';keeperRel.visitPeriods[vp]=(Number(keeperRel.visitPeriods[vp])||0)+1;keeperRel.lastVisitBucket=visitBucket;}this.memory.keeperRelationshipV3405=keeperRel;this.nextKeeperCheckInAt=Date.now()+rand(45000,100000);this.keeperMomentUntil=0;
      this.applyOfflineNeedsCatchup();this.updateGrowthMemory(true);
      this.memory.furnitureAffinity=boundedObject(this.memory.furnitureAffinity,{});this.memory.furnitureFavourites=boundedObject(this.memory.furnitureFavourites,{});this.memory.skillRewards=boundedObject(this.memory.skillRewards,{});this.memory.thoughtMilestones=boundedObject(this.memory.thoughtMilestones,{});this.lastFurnitureInteraction=Number(this.memory.lastFurnitureInteractionAt||0);this.furniturePlan=null;this.commandedFurniture=null;this.furnitureExitPos=null;this.furnitureMounted=false;this.furnitureDepthY=null;this.furnitureCarePlan=null;this.furnitureUseSession=null;this.physicalMountTarget=null;this.physicalInteraction=null;this.physicalProp=null;this.physicalEffects=null;this.physicalFurnitureEl=null;this.bathAudio=null;
      this.thoughtEl=null;this.thoughtTimer=0;this.activeThought=null;this.recentThoughtIds=[];this.thoughtCooldowns={};this.nextAmbientThoughtAt=Date.now()+rand(DRAGON_THOUGHT_CONFIG.ambientMinMs,DRAGON_THOUGHT_CONFIG.ambientMaxMs);this.nextActivityThoughtAt=Date.now()+rand(DRAGON_THOUGHT_CONFIG.activityMinMs,DRAGON_THOUGHT_CONFIG.activityMaxMs);
      if(!this.memory.dailyLife.globalReadyAt)this.memory.dailyLife.globalReadyAt=Date.now()+rand(6*60*1000,12*60*1000);
      this.behaviourDirty=true;this.lastBehaviourSaveAt=0;this.walkSpeedBoost=1;this.pendingMoveMode='';this.pendingDestination=null;this.pendingCareNeed='';this.lastScores={};this.decisionCount=0;
    }

petCooldownKey(){return `dragonboundPetCooldown:${String(this.dragon?.id||this.dragon?.name||'dragon')}`;}
petReadyAt(){try{return Number(localStorage.getItem(this.petCooldownKey())||0)||0;}catch(_){return 0;}}
petCooldownRemaining(){return Math.max(0,this.petReadyAt()-Date.now());}
formatPetCooldown(ms){const sec=Math.max(1,Math.ceil(ms/1000)),m=Math.floor(sec/60),s=sec%60;return m?`${m}m ${String(s).padStart(2,'0')}s`:`${s}s`;}
updatePetHint(){if(!this.hoverPet)return;const remaining=this.petCooldownRemaining();this.hoverPet.textContent=remaining?`Pet again in ${this.formatPetCooldown(remaining)}`:'♥ Click to pet';this.hoverPet.classList.toggle('is-ready',!remaining);if(this.img)this.img.classList.toggle('is-pet-ready',!remaining);}
ensurePetAudio(){if(this.petAudio)return this.petAudio;try{const audio=new Audio('assets/dragonbound/audio/dragon-pet-love.mp3');audio.preload='auto';audio.volume=.60;this.petAudio=audio;}catch(_){this.petAudio=null;}return this.petAudio;}
playPetLove(label='lovely!'){
  clearTimeout(this.petLoveTimer);this.petLoveTimer=0;
  if(this.petLove?.isConnected)this.petLove.remove();
  const love=document.createElement('span');love.className='dragonbound-baby-pet-love';love.setAttribute('aria-hidden','true');
  love.innerHTML=`<i>♥</i><i>♥</i><i>♥</i><i>♥</i><b>${String(label||'lovely!').replace(/[<>]/g,'')}</b>`;
  this.el?.appendChild(love);this.petLove=love;
  this.el?.classList.remove('is-being-petted');void this.el?.offsetWidth;this.el?.classList.add('is-being-petted');
  this.petLoveTimer=setTimeout(()=>{this.el?.classList.remove('is-being-petted');love.remove();if(this.petLove===love)this.petLove=null;},2100);
}
pet(){
  if(!this.el||!this.img||this.petCooldownRemaining()>0){this.updatePetHint();return false;}
  if(this.engine?.stage?.classList.contains('is-visiting-house'))return false;
  if(this.engine?.homeScene?.classList.contains('is-build-editing')||this.engine?.homeScene?.classList.contains('is-build-placing'))return false;
  const readyAt=Date.now()+120000;try{localStorage.setItem(this.petCooldownKey(),String(readyAt));}catch(_){ }
  const audio=this.ensurePetAudio();if(audio){try{audio.pause();audio.currentTime=0;audio.volume=.60;const result=audio.play();if(result&&typeof result.catch==='function')result.catch(()=>{});}catch(_){ }}
  const stage=this.bondStage();const personalityLabel=this.personalityReaction?.('pet')||'',petLabel=personalityLabel||(this.bond>=95?'inseparable ♥':this.bond>=80?'close companion!':this.bond>=60?'loves the scratches!':this.bond>=40?'nuzzles closer!':this.bond>=20?'happy!':'lovely!');this.playPetLove(petLabel);this.applyCareBenefit('social',14);this.applyCareBenefit('comfort',8);this.applyCareBenefit('fun',3);this.awardBond('pet',1.0,115000);const obs=this.memory.observationCounters||(this.memory.observationCounters={});obs.petsReceived=(Number(obs.petsReceived)||0)+1;this.noteKeeperRelationship?.('pet');this.noteUniverseActivity?.('keeper:pet');this.maybeShowDragonThought?.('pet');try{window.dispatchEvent(new CustomEvent('dragonbound:keeper-pet',{detail:{dragonId:String(this.dragon?.id||''),dragonName:String(this.dragon?.name||'Your dragon')}}));}catch(_e){}this.rememberLifeEvent('bond','First proper cuddle','You gave your dragon a reassuring pet.','first-pet');this.engine.saveBehaviourLocal?.();this.updatePetHint();return true;
}
    mount(layer){if(!this.def)return;this.el=document.createElement('div');this.el.className='dragonbound-baby-actor';this.el.dataset.breedId=this.dragon.breedId;this.img=document.createElement('img');this.img.className='dragonbound-baby-sprite';this.img.alt=this.dragon.name||this.def.displayName;const hover=document.createElement('div');hover.className='dragonbound-baby-hover-card';hover.setAttribute('aria-hidden','true');const avatar=document.createElement('span');avatar.className='dragonbound-baby-hover-avatar';const avatarImg=document.createElement('img');avatarImg.alt='';avatarImg.src=this.def.animations?.idle?.frames?.[0]?.src||'';avatar.appendChild(avatarImg);const copy=document.createElement('span');copy.className='dragonbound-baby-hover-copy';const name=document.createElement('strong');name.className='dragonbound-baby-hover-name';name.textContent=this.dragon.name||this.def.displayName||'Baby Dragon';const age=document.createElement('small');age.className='dragonbound-baby-hover-age';const gender=document.createElement('small');gender.className='dragonbound-baby-hover-gender';const nature=document.createElement('small');nature.className='dragonbound-baby-hover-nature';const bond=document.createElement('small');bond.className='dragonbound-baby-hover-bond';const pet=document.createElement('small');pet.className='dragonbound-baby-hover-pet';copy.append(name,age,gender,nature,bond,pet);hover.append(avatar,copy);this.hoverCard=hover;this.hoverAge=age;this.hoverGender=gender;this.hoverNature=nature;this.hoverBond=bond;this.hoverPet=pet;const updateHover=()=>{if(this.hoverAge)this.hoverAge.textContent=formatDragonAge(this.dragon.hatchedAt);if(this.hoverGender){const g=String(this.dragon.gender||'').toLowerCase();this.hoverGender.textContent=g==='female'?'Gender · Female':g==='male'?'Gender · Male':'';this.hoverGender.dataset.gender=g;}if(this.hoverNature){const observed=this.personalityUniverseDiscovered?.()?.[0]||this.discoveredTraits?.[0]||'';this.hoverNature.textContent=observed?`Observed Nature · ${observed}`:'';this.hoverNature.classList.toggle('is-visible',!!observed);}if(this.hoverBond){const bs=this.bondStage();this.hoverBond.textContent=`Bond ${Math.round(this.bond)} · ${bs.name}`;this.hoverBond.title=bs.note;}this.updatePetHint();};const setHover=visible=>{if(!this.el||visible===this.hoverVisible)return;this.hoverVisible=visible;this.el.classList.toggle('is-hovered',visible);this.hoverCard?.setAttribute('aria-hidden',visible?'false':'true');clearInterval(this.hoverTimer);this.hoverTimer=0;if(visible){updateHover();this.hoverTimer=setInterval(updateHover,1000);}};this.img.addEventListener('mouseenter',()=>setHover(true));this.img.addEventListener('mouseleave',()=>setHover(false));this.img.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();this.pet();});this.hoverMoveHandler=e=>{if(!this.img||!this.el?.isConnected)return;const r=this.img.getBoundingClientRect();const pad=4,inside=e.clientX>=r.left-pad&&e.clientX<=r.right+pad&&e.clientY>=r.top-pad&&e.clientY<=r.bottom+pad;setHover(inside);};window.addEventListener('pointermove',this.hoverMoveHandler,{passive:true});this.el.append(this.img,hover);layer.appendChild(this.el);this.updatePetHint();const saved=this.engine.loadMovement(this.dragon.id,this.map.houseId),savedFloor=saved&&this.map.floors.some(f=>f.id===saved.floorId)?saved.floorId:'',savedPoint=savedFloor?[Number(saved.normalizedX),Number(saved.normalizedY)]:null,resolvedSaved=savedPoint?.every(Number.isFinite)?this.engine.nearestWalkablePoint(savedFloor,savedPoint):null;if(resolvedSaved){this.floorId=savedFloor;this.pos=resolvedSaved;this.facing=saved.facing||'right';this.lastStairUse=saved.lastStairUseAt||0;this.lastFlight=saved.lastFlightAt||0;}else{const preferredFloor=savedFloor||'downstairs';const sp=choose(this.map.spawnPoints.filter(s=>s.floorId===preferredFloor))||choose(this.map.spawnPoints.filter(s=>s.floorId==='downstairs'))||this.map.spawnPoints[0],resolvedSpawn=sp?this.engine.nearestWalkablePoint(sp.floorId,sp.p):null;if(sp){this.floorId=sp.floorId;this.pos=(resolvedSpawn||sp.p).slice();}if(saved?.facing)this.facing=saved.facing;}this.setState('idle',rand(2500,5000));this.render(true);this.syncLifeFurniture(true);this.scheduleReturnMoment();if(this.awayMs<4*60*1000)this.scheduleBondGreeting();}
    destroy(){clearInterval(this.hoverTimer);this.hoverTimer=0;clearTimeout(this.petLoveTimer);this.petLoveTimer=0;clearTimeout(this.greetingTimer);this.greetingTimer=0;clearTimeout(this.returnMomentTimer);this.returnMomentTimer=0;this.clearDragonThought('destroy');if(this.hoverMoveHandler)window.removeEventListener('pointermove',this.hoverMoveHandler);this.hoverMoveHandler=null;this.hoverVisible=false;this.stopBathAudio();this.finishPhysicalInteraction();this.finishDailyLifeEvent();this.lifeEventLabel?.remove();this.lifeEventLabel=null;try{this.petAudio?.pause();if(this.petAudio)this.petAudio.currentTime=0;}catch(_){ }this.petLove?.remove();this.petLove=null;this.el?.remove();this.el=null;}
    setState(state,duration=0){const previousState=this.state;this.lastAction=this.state;this.state=state;this.frameIndex=0;this.frameAt=0;this.stateUntil=duration?now()+duration:0;if(previousState!==state&&this.activeThought?.clearOnStateChange)this.clearDragonThought('state-change',DRAGON_THOUGHT_PRIORITY.need);if(state!=='furnitureWash')this.stopBathAudio();if(!['walking','approachingStairs','climbingStairs','flying'].includes(state))this.path=[];if(this.el&&!String(state).startsWith('furniture')){delete this.el.dataset.furnitureInteraction;delete this.el.dataset.furnitureLabel;delete this.el.dataset.furnitureKind;delete this.el.dataset.furniturePlacementId;delete this.el.dataset.furnitureFacing;}this.applyFrame(true);this.engine.updateDebug();this.engine.updatePersonalityDebug();}
    animationName(){
      if(this.state==='walking'||this.state==='approachingStairs'||this.state==='climbingStairs'||this.state==='furnitureExercise'||this.state==='furnitureScratch')return'walk';
      if(this.state==='sitting'||this.state==='furniturePerch'||this.state==='furnitureWash')return'sit';
      if(this.state==='resting'||['furnitureRest','furnitureHide','furnitureWarm','furnitureGroom','furnitureSandbath'].includes(this.state))return'rest';
      if(this.state==='sleeping'||this.state==='furnitureSleep')return'sleep';
      if(this.state==='takingOff')return'takeOff';if(this.state==='flying')return'fly';if(this.state==='landing')return'land';
      if(this.state==='looking'||String(this.state).startsWith('furniture'))return'look';
      return'idle';
    }
    applyFrame(force=false,t=now()){if(!this.img)return;const animationName=this.animationName(),anim=this.def.animations[animationName]||this.def.animations.idle;const frames=anim.frames;if(!frames.length)return;const frame=frames[this.frameIndex%frames.length];if(force||this.img.dataset.src!==frame.src){this.img.src=frame.src;this.img.dataset.src=frame.src;this.img.onload=()=>this.render(true);}const duration=frame.durationMs/(animationName==='walk'?WALK_ANIMATION_SPEED_MULTIPLIER:1);if(!this.frameAt)this.frameAt=t+duration;if(t>=this.frameAt){this.frameIndex=(this.frameIndex+1)%frames.length;this.frameAt=0;this.applyFrame(true,t);}}
    stat(key){return pNum(this.coreStats?.[key]);}
    hasTrait(name){return this.signatureTraits.includes(name)||this.assignedTraits.includes(name);}
    hasSignatureTrait(name){return this.signatureTraits.includes(name);}
    ensurePersonalityUniverse(){
      let u=boundedObject(this.memory?.personalityUniverse,{});if(Number(u.version)===DRAGONBOUND_PERSONALITY_UNIVERSE_VERSION&&u.seed&&u.axes){u.habits=boundedObject(u.habits,{});u.transitions=boundedObject(u.transitions,{});u.relationship=boundedObject(u.relationship,{});u.observations=boundedObject(u.observations,{});u.furnitureRelations=boundedObject(u.furnitureRelations,{});u.dislikes=boundedObject(u.dislikes,{});u.recentActivity=Array.isArray(u.recentActivity)?u.recentActivity.slice(-14):[];return u;}
      const seed=universeHash(`${this.dragon?.id||''}|${this.dragon?.breedId||''}|${this.dragon?.name||''}|${this.dragon?.hatchedAt||''}|living-dragon-v1`),rng=universeRng(seed),base=this.coreStats||{},j=span=>(rng()-.5)*span;
      const axes={
        energy:pNum(base.energy+j(12)),curiosity:pNum(base.curiosity+j(12)),affection:pNum(base.affection+j(10)),independence:pNum(base.independence+j(10)),bravery:pNum(base.bravery+j(10)),playfulness:pNum(base.playfulness+j(12)),mischief:pNum(base.mischief+j(12)),stubbornness:pNum(base.stubbornness+j(10)),sociability:pNum(base.sociability+j(10)),appetite:pNum(base.appetite+j(10)),sleepiness:pNum(base.sleepiness+j(10)),intelligence:pNum(base.intelligence+j(10)),
        patience:pNum(55-(Number(base.energy||50)-50)*.28+(Number(base.intelligence||50)-50)*.12+j(34)),cleanliness:pNum(50+j(70)),sensitivity:pNum(52-(Number(base.bravery||50)-50)*.32+(Number(base.affection||50)-50)*.12+j(30)),routine:pNum(50+(Number(base.stubbornness||50)-50)*.22-(Number(base.curiosity||50)-50)*.18+j(38)),trainDrive:pNum((Number(base.energy||50)+Number(base.intelligence||50)+Number(base.bravery||50))/3+j(24)),foodDrive:pNum(Number(base.appetite||50)+j(20)),waterAffinity:pNum(50+j(76)),socialConfidence:pNum(Number(base.sociability||50)*.56+Number(base.bravery||50)*.44+j(18)),attachment:pNum(Number(base.affection||50)*.66+(100-Number(base.independence||50))*.34+j(16)),circadian:pNum(50+j(90)),outdoorAffinity:pNum(Number(base.curiosity||50)*.48+Number(base.bravery||50)*.26+Number(base.independence||50)*.26+j(24))
      };
      const bestByGroup=new Map();for(const def of DRAGONBOUND_UNIVERSE_TRAITS){const score=universeTraitScore(def,axes,(rng()-.5)*15),prev=bestByGroup.get(def.group);if(!prev||score>prev.score)bestByGroup.set(def.group,{def,score});}
      const ranked=[...bestByGroup.values()].sort((a,b)=>b.score-a.score),innate=ranked.slice(0,4).map(v=>v.def.name),secondary=ranked.slice(4,7).map(v=>v.def.name),families=new Set([...innate,...secondary].map(name=>DRAGONBOUND_UNIVERSE_TRAIT_BY_NAME[name]?.family));
      const quirks=DRAGONBOUND_UNIVERSE_QUIRKS.map(q=>({q,score:((q.families||[]).some(f=>families.has(f))?25:0)+(rng()-.5)*20})).sort((a,b)=>b.score-a.score).slice(0,2+(rng()>.58?1:0)).map(v=>({id:v.q.id,label:v.q.label,note:v.q.note}));
      u={version:DRAGONBOUND_PERSONALITY_UNIVERSE_VERSION,seed,createdAt:Date.now(),axes,innateTraits:innate,secondaryTraits:secondary,discoveredTraits:[],quirks,discoveredQuirks:[],habits:{},transitions:{},recentActivity:[],furnitureRelations:{},dislikes:{},relationship:{greetings:0,pets:0},observations:{ticks:0,lastDiscoveryAt:0,lastQuirkDiscoveryAt:0},descriptor:'',lastExpressionAt:0};
      this.memory.personalityUniverse=u;this.behaviourDirty=true;return u;
    }
    personalityUniverseTraitDef(name){return DRAGONBOUND_UNIVERSE_TRAIT_BY_NAME[String(name||'')]||null;}
    personalityUniverseAllTraits(){const u=this.personalityUniverse||this.ensurePersonalityUniverse();return [...new Set([...(u.innateTraits||[]),...(u.secondaryTraits||[])])];}
    personalityUniverseDiscovered(){const u=this.personalityUniverse||this.ensurePersonalityUniverse();return [...new Set(u.discoveredTraits||[])];}
    personalityExpression(symbol='?',text='',tone=''){
      const u=this.personalityUniverse||this.ensurePersonalityUniverse(),nowMs=Date.now();if(!this.el?.isConnected||this.activeThought||nowMs-Number(u.lastExpressionAt||0)<90000)return false;u.lastExpressionAt=nowMs;const el=document.createElement('span');el.className='dragonbound-personality-expression'+(tone?` is-${tone}`:'');el.setAttribute('aria-hidden','true');el.innerHTML=`<b>${String(symbol||'?').replace(/[<>]/g,'')}</b>${text?`<small>${String(text).replace(/[<>]/g,'').slice(0,34)}</small>`:''}`;this.el.appendChild(el);setTimeout(()=>el.remove(),2700);this.behaviourDirty=true;return true;
    }
    dragonThoughtsEnabled(){return DRAGON_THOUGHT_CONFIG.enabled&&window.DragonboundThoughts?.enabled!==false;}
    thoughtTraitSet(){return new Set([...(this.signatureTraits||[]),...(this.assignedTraits||[]),...(this.personalityUniverseAllTraits?.()||[])]);}
    thoughtHas(...names){const traits=this.thoughtTraitSet();return names.some(name=>traits.has(name));}
    thoughtRecent(id=''){return !!id&&this.recentThoughtIds.includes(String(id));}
    thoughtFavourite(meta={},kind=''){
      const id=String(meta?.placementId||''),formed=this.preferences?.formed||{},overall=formed.favouriteFurniture||null,group=this.furnitureFavouriteGroup?.(kind)||'',byKind=formed.favouritesByKind?.[group]||null;
      return !!id&&([overall,byKind].some(row=>String(row?.placementId||'')===id));
    }
    clearDragonThought(reason='',maxPriority=Infinity){
      if(this.activeThought&&Number(this.activeThought.priority||0)>Number(maxPriority))return false;
      clearTimeout(this.thoughtTimer);this.thoughtTimer=0;
      if(this.thoughtEl?.isConnected){this.thoughtEl.classList.add('is-leaving');const old=this.thoughtEl;setTimeout(()=>old.remove(),180);}
      this.thoughtEl=null;this.activeThought=null;if(this.el)this.el.classList.remove('has-dragon-thought');return true;
    }
    pickDragonThought(candidates=[]){
      const rows=(Array.isArray(candidates)?candidates:[]).filter(row=>row&&row.text);
      if(!rows.length)return null;
      const fresh=rows.filter(row=>!this.thoughtRecent(row.id||row.text)),pool=fresh.length?fresh:rows;
      return choose(pool);
    }
    showDragonThought(candidate={},options={}){
      if(!this.dragonThoughtsEnabled()||!this.el?.isConnected||this.engine?.stage?.classList.contains('is-visiting-house')||this.engine?.homeScene?.classList.contains('is-build-editing')||this.engine?.homeScene?.classList.contains('is-build-placing'))return false;
      const nowMs=Date.now(),text=String(candidate.text||options.text||'').trim().slice(0,82);if(!text)return false;
      const id=String(candidate.id||options.id||text),priority=Number(options.priority??candidate.priority??DRAGON_THOUGHT_PRIORITY.activity),cooldownKey=String(options.cooldownKey||candidate.cooldownKey||id),cooldownMs=Math.max(0,Number(options.cooldownMs??candidate.cooldownMs??12000));
      if(Number(this.thoughtCooldowns[cooldownKey]||0)>nowMs&&!options.force)return false;
      if(this.thoughtRecent(id)&&!options.force&&!options.allowRepeat)return false;
      if(this.activeThought&&Number(this.activeThought.expiresAt||0)>nowMs){
        const currentPriority=Number(this.activeThought.priority||0);
        if(currentPriority>priority||currentPriority===priority&&!options.replaceSamePriority)return false;
      }
      this.clearDragonThought('replace');
      this.el.querySelectorAll('.dragonbound-personality-expression').forEach(node=>node.remove());
      const el=document.createElement('span');el.className=`dragonbound-dragon-thought is-${String(options.type||candidate.type||'activity').replace(/[^a-z0-9-]+/gi,'-').toLowerCase()}${candidate.tone||options.tone?` is-${String(candidate.tone||options.tone).replace(/[^a-z0-9-]+/gi,'-').toLowerCase()}`:''}`;el.setAttribute('aria-hidden','true');
      const copy=document.createElement('span');copy.className='dragonbound-dragon-thought-copy';copy.textContent=text;el.appendChild(copy);this.el.appendChild(el);this.el.classList.add('has-dragon-thought');this.thoughtEl=el;
      const durationMs=clamp(Number(options.durationMs||candidate.durationMs||3200+text.length*34),3000,6000),clearOnStateChange=options.clearOnStateChange??candidate.clearOnStateChange??priority<=DRAGON_THOUGHT_PRIORITY.need;
      this.activeThought={id,text,type:options.type||candidate.type||'activity',priority,startedAt:nowMs,expiresAt:nowMs+durationMs,clearOnStateChange};
      this.recentThoughtIds=[...this.recentThoughtIds.filter(v=>v!==id),id].slice(-DRAGON_THOUGHT_CONFIG.recentLimit);this.thoughtCooldowns[cooldownKey]=nowMs+cooldownMs;
      this.thoughtTimer=setTimeout(()=>{if(this.activeThought?.id===id)this.clearDragonThought('expired');},durationMs);
      if(priority>=DRAGON_THOUGHT_PRIORITY.favourite)this.nextAmbientThoughtAt=Math.max(this.nextAmbientThoughtAt,nowMs+45000);
      return true;
    }
    maybeShowDragonThought(event='',ctx={}){
      if(!this.dragonThoughtsEnabled())return false;
      const e=String(event||''),nowMs=Date.now(),traits=this.thoughtTraitSet(),has=(...n)=>n.some(x=>traits.has(x)),rows=[],add=(id,text,tone='')=>rows.push({id:`${e}:${id}`,text,tone});
      let priority=DRAGON_THOUGHT_PRIORITY.activity,type=e||'activity',chance=.55,cooldownMs=22000,cooldownKey=e,clearOnStateChange=true,force=!!ctx.force;
      if(e==='pet'){
        priority=DRAGON_THOUGHT_PRIORITY.keeper;type='keeper';chance=.72;cooldownMs=75000;clearOnStateChange=false;
        if(this.bond<20){chance=.48;if(has('Shy','Nervous'))add('new-shy','...okay','soft');else if(has('Independent','Independent Friend'))add('new-independent','Just a little','calm');else add('new-keeper','Still getting used to that...','soft');}
        else if(this.bond>=80){if(has('Affectionate','Cuddlebug','Clingy','Shadow'))add('affection-trust','Stay here with me','warm');if(has('Independent','Independent Friend'))add('independent-trust','You can stay','calm');if(has('Shy','Nervous'))add('shy-trust','...I trust you','warm');add('close','That is nice...','warm');}
        if(has('Affectionate','Cuddlebug','Clingy','Shadow')){add('affection-more','More!','warm');add('affection-stay','Stay here a bit','warm');}
        if(has('Independent','Independent Friend'))add('independent','Alright, that is enough','calm');
        if(has('Calm','Quiet Companion'))add('calm','That is nice...','calm');
        if(has('Easily Excited','Hyper','Bouncy'))add('excited','Again!','excited');
        if(has('Shy'))add('shy','...that was nice','soft');
        add('generic','I like that','warm');
      }else if(e==='treat'){
        priority=DRAGON_THOUGHT_PRIORITY.keeper;type='keeper';chance=.80;cooldownMs=45000;clearOnStateChange=false;
        if(has('Food Obsessed','Food Goblin','Treat Obsessed','Greedy','Always Hungry')){add('food-yes','TREATS!','excited');add('food-more','More?','excited');}
        if(has('Playful','Toy Obsessed'))add('playful','Catch!','playful');
        if(has('Easily Excited','Energetic','Hyper'))add('excited','YES!','excited');
        add('yum','Yum!','warm');
      }else if(e==='command'){
        priority=DRAGON_THOUGHT_PRIORITY.command;type='command';chance=.64;cooldownMs=24000;cooldownKey=`command:${ctx.key||'any'}`;clearOnStateChange=false;
        if(has('Stubborn')){add('stubborn-busy','I was busy...','sulking');add('stubborn-fine','Fine...','sulking');}
        if(has('Lazy')&&ctx.key!=='goToBed')add('lazy','Do I have to?','sleepy');
        if(has('Energetic','Easily Excited'))add('energetic','Let us go!','excited');
        if(has('Competitive')&&['roar','tinyFlame','flyToPerch','goToFurniture'].includes(String(ctx.key||'')))add('competitive','Training time!','proud');
        if(has('Sleepy','Professional Napper')&&ctx.key==='goToBed')add('sleepy','Good idea...','sleepy');
        if(has('Food Obsessed','Greedy')&&ctx.key==='eat')add('eat','Best command yet','excited');
        add('listening','Okay!','calm');
      }else if(e==='return'){
        priority=DRAGON_THOUGHT_PRIORITY.keeper+3;type='keeper';chance=1;cooldownMs=4*60*1000;cooldownKey='keeper-return';clearOnStateChange=false;force=!!ctx.force;
        const band=String(ctx.band||this.returnBand?.()||'hours');
        if(has('Food Obsessed','Food Goblin','Treat Obsessed','Greedy')){add('food-return',band==='quick'?'Back already... with snacks?':'You brought treats, right?','playful');}
        if(has('Affectionate','Clingy','Cuddlebug','Shadow')){add('affection-return',band==='quick'?'You are back already!':'There you are!','warm');}
        if(has('Independent','Independent Friend'))add('independent-return',band==='long'?'Good to see you.':'Oh, you are back.','calm');
        if(has('Shy','Nervous'))add('shy-return',this.bond>=60?'...there you are':'I will watch from here','soft');
        if(has('Lazy','Couch Potato'))add('lazy-return','You came back. I am still comfy.','sleepy');
        if(has('Playful','Toy Obsessed'))add('play-return','There you are! Play?','playful');
        if(has('Stubborn'))add('stubborn-return','I was not waiting or anything...','sulking');
        if(band==='quick')add('quick','You are back already?','calm');else if(band==='long')add('long','It has been a while... good to see you','warm');else add('generic','There you are','warm');
      }else if(e==='keeper-checkin'){
        priority=DRAGON_THOUGHT_PRIORITY.keeper;type='keeper';chance=.72;cooldownMs=80000;cooldownKey='keeper-checkin';clearOnStateChange=false;
        if(has('Affectionate','Clingy','Cuddlebug','Shadow')){add('affection','I will stay here with you','warm');add('affection-two','There you are','warm');}
        if(has('Independent','Independent Friend'))add('independent','I am not following you...','calm');
        if(has('Shy','Nervous'))add('shy','I will sit here','soft');
        if(has('Food Obsessed','Food Goblin','Treat Obsessed','Greedy'))add('food','Just checking... no treats?','playful');
        if(has('Calm','Quiet Companion'))add('calm','Nice being nearby','calm');
        if(has('Playful','Toy Obsessed'))add('play','Want to play?','playful');
        add('generic','Just checking in','warm');
      }else if(e==='race'){
        priority=DRAGON_THOUGHT_PRIORITY.race;type='race';chance=1;cooldownMs=12000;cooldownKey='race-reaction';clearOnStateChange=false;force=true;
        const won=!!ctx.won,position=Math.max(1,Math.min(6,Number(ctx.position)||6));
        if(won&&has('Competitive')){add('competitive-win','I KNEW IT!','proud');add('competitive-again','Again!','excited');}
        if(won&&has('Calm'))add('calm-win','That went well','calm');
        if(!won&&has('Competitive')){add('competitive-loss','I can do better','proud');add('competitive-train','Back to training','proud');}
        if(!won&&has('Stubborn'))add('stubborn-loss','That race was unfair...','sulking');
        if(has('Affectionate','Clingy'))add('affection','Did you see me?','warm');
        if(has('Shy'))add('shy','Was that okay?','soft');
        if(has('Food Obsessed','Greedy'))add('food','Do racers get snacks?','playful');
        add(won?'generic-win':'generic-finish',won?'We won!':`Finished ${position}${position===2?'nd':position===3?'rd':position===1?'st':'th'}`,'proud');
      }else if(e==='favourite-discovered'){
        priority=DRAGON_THOUGHT_PRIORITY.favourite;type='favourite';chance=1;cooldownMs=1000;cooldownKey=`favourite:${ctx.placementId||ctx.name||'place'}`;clearOnStateChange=false;force=true;
        add('new-favourite',`I think ${ctx.name?'this is':'this might be'} my favourite...`,'favourite');add('new-favourite-place','I really like it here','favourite');
      }else if(e==='furniture'){
        const meta=ctx.meta||{},kind=String(ctx.kind||''),isNew=!!meta.isNew,isFavourite=this.thoughtFavourite(meta,kind),name=String(meta.name||'this').slice(0,38),dailyPref=this.dailyPreferenceForFurniture(meta,kind);
        type=isNew?'new-furniture':isFavourite?'favourite':dailyPref?'daily-preference':'activity';priority=isNew?DRAGON_THOUGHT_PRIORITY.newFurniture:isFavourite?34:dailyPref?DRAGON_THOUGHT_PRIORITY.activity+3:DRAGON_THOUGHT_PRIORITY.activity;chance=isNew?.82:isFavourite?.48:dailyPref?.42:.26;cooldownMs=isNew?180000:dailyPref?70000:42000;cooldownKey=isNew?`new-furniture:${meta.placementId||meta.itemId}`:dailyPref?`daily-preference:${dailyPref.id}:${kind}`:`furniture:${kind}`;clearOnStateChange=!isNew&&!isFavourite;
        if(!isNew&&!isFavourite&&!dailyPref&&nowMs<this.nextActivityThoughtAt)return false;
        if(dailyPref){
          const target=this.dailyPreferenceTargetName(dailyPref)||name,p=String(dailyPref.type||'');
          if(p==='toy_obsession'){add('daily-toy-one','There it is!','playful');add('daily-toy-two','One more go...','playful');}
          if(['nap_day','comfort_seeker','favourite_corner'].includes(p)&&['sleep','rest','warm','perch','hide'].includes(kind)){add('daily-rest-one','Maybe another little rest...','sleepy');add('daily-rest-two','This is exactly the spot','calm');}
          if(['training_kick','race_itch','focused_practice'].includes(p)&&['exercise','climb','roar','fire','puzzle'].includes(kind)){add('daily-train-one','One more practice','proud');add('daily-train-two','Again!','proud');}
          if(['explorer','furniture_inspector','new_furniture_interest'].includes(p)){add('daily-inspect-one','What have I not checked yet?','curious');if(p==='new_furniture_interest')add('daily-inspect-two',`Still deciding about ${target}`,'curious');}
          if(['snacky','treat_hopeful'].includes(p)&&['eat','drink','puzzle'].includes(kind))add('daily-snack','Snack?','playful');
          if(['bath_lover','sand_bath_day'].includes(p)&&['wash','sandbath','groom'].includes(kind))add('daily-bath','Bath time again?','calm');
          if(p==='window_watcher'&&(kind==='watch'||kind==='perch'))add('daily-window','Back to the view...','calm');
          if(p==='object_fixation'&&String(dailyPref.targetPlacementId||'')===String(meta.placementId||''))add('daily-fixation',`${target} again...`,'favourite');
          if(p==='object_avoidance'&&String(dailyPref.targetPlacementId||'')===String(meta.placementId||''))add('daily-avoid','Maybe not this one...','soft');
        }
        if(isNew){
          if(has('Food Obsessed','Food Goblin','Greedy')&&['eat','drink','puzzle'].includes(kind))add('new-food','IS THAT FOOD?','excited');
          if(has('Lazy','Sleepy','Professional Napper')&&['sleep','rest','warm'].includes(kind))add('new-bed','Oh... that looks comfortable','sleepy');
          if(has('Curious','Furniture Inspector','Nosy')){add('new-curious','This was not here before...','curious');add('new-investigate','Need to investigate','curious');}
          if(has('Shy','Nervous'))add('new-shy','Not sure about that new thing...','soft');
          if(has('Brave','Adventurous','Fearless'))add('new-brave','I will check it out','proud');
          if(has('Playful','Toy Obsessed')&&['play','puzzle','scratch','dig'].includes(kind))add('new-play','Is that for me?','playful');
          add('new-generic',`What is ${name}?`,'curious');
        }else if(isFavourite){
          if(['sleep','rest','perch','warm'].includes(kind)){add('fav-bed','Nothing beats this spot','favourite');add('fav-bed-back','Back to my favourite spot','favourite');}
          else if(['play','puzzle','scratch','dig'].includes(kind)){add('fav-toy','My favourite!','favourite');add('fav-toy-found','Found it!','favourite');}
          else{add('fav-place','I like it here','favourite');add('fav-back','Back here again','favourite');}
        }else{
          if(['sleep'].includes(kind)){add('sleep','Time for a little nap','sleepy');add('sleep-settle','Getting comfortable...','sleepy');}
          else if(['rest','warm'].includes(kind)){add('rest','Taking it easy','calm');add('rest-comfy','Just getting comfortable','calm');}
          else if(['play','puzzle','scratch','dig'].includes(kind)){add('play','Play time!','playful');add('play-found','Found something fun','playful');}
          else if(['exercise','climb','roar','fire'].includes(kind)){add('train','Time to train','proud');add('train-practice','A little practice will not hurt','proud');}
          else if(['wash','sandbath','groom'].includes(kind)){add('bath','Getting nice and clean','calm');add('bath-warm','Bath time','calm');}
          else if(['eat','drink'].includes(kind)){add('food','Snack time','warm');add('food-smell','That smells good','warm');}
          else if(kind==='watch'||kind==='perch'){add('watch','Watching the world go by','calm');add('watch-out','Wonder what is out there...','curious');}
          else if(kind==='hide'){add('hide','A little privacy','soft');add('hide-quiet','Found a quiet spot','calm');}
          else{add('inspect','Having a closer look...','curious');add('interesting','Interesting...','curious');}
          if(has('Lazy')&&['sleep','rest','warm'].includes(kind))add('lazy-comfy','This spot is too comfortable','sleepy');
          if(has('Curious')&&['inspect','watch','read','mirror','sniff'].includes(kind))add('curious','Need to investigate','curious');
          if(has('Food Obsessed','Greedy')&&['eat','drink'].includes(kind))add('food-obsessed','Finally, food','excited');
          if(has('Competitive')&&['exercise','climb','roar','fire'].includes(kind))add('competitive','Next race, I am winning','proud');
        }
      }else if(e==='need'){
        priority=DRAGON_THOUGHT_PRIORITY.need;type='need';chance=.68;cooldownMs=60000;cooldownKey=`need:${ctx.need||'any'}`;clearOnStateChange=true;
        const need=String(ctx.need||'');
        if(need==='hunger'){add('hunger','Getting a little hungry...','soft');add('hunger-food','Wonder if there is food around','soft');}
        if(need==='energy'){add('energy','Starting to feel tired','sleepy');add('energy-bed','That bed is looking tempting','sleepy');}
        if(need==='hygiene'){add('hygiene','Could probably use a wash','soft');if(has('Messy'))add('messy','Bath? Maybe later','sulking');}
        if(need==='fun'){add('fun','Getting a bit bored...','soft');add('fun-play','Need something fun to do','playful');}
      }else if(e==='mood'){
        priority=DRAGON_THOUGHT_PRIORITY.ambient+4;type='mood';chance=ctx.force?1:.72;cooldownMs=70000;cooldownKey=`mood:${ctx.mood||this.currentMoodName()||'current'}`;clearOnStateChange=true;force=!!ctx.force;
        const mood=String(ctx.mood||this.currentMoodName()||'');
        if(mood==='Bouncy'){add('bouncy-one','Too much energy!','excited');add('bouncy-two','Let us do something!','excited');}
        if(mood==='Sleepy'){add('sleepy-one','Everything looks nap-shaped today...','sleepy');add('sleepy-two','Could definitely curl up somewhere','sleepy');}
        if(mood==='Cuddly'){add('cuddly-one','I am staying close today','warm');add('cuddly-two','There you are','warm');}
        if(mood==='Curious'){add('curious-one','There has to be something I have not inspected yet','curious');add('curious-two','What have I missed?','curious');}
        if(mood==='Grumpy'){add('grumpy-one','Not impressed. Yet.','sulking');add('grumpy-two','I am having a very serious dragon day','sulking');}
        if(mood==='Focused'){add('focused-one','I have practice to do','proud');add('focused-two','One more proper training session','proud');}
        if(mood==='Hungry'){add('hungry-one','Just checking the food situation...','playful');add('hungry-two','A snack would improve this day','playful');}
        if(mood==='Playful'){add('playful-one','What can I play with?','playful');add('playful-two','One more game','playful');}
        if(mood==='Nervous'){add('nervous-one','I will stay somewhere familiar for a bit','soft');add('nervous-two','Taking things slowly today','soft');}
        if(mood==='Proud'){add('proud-one','I did pretty well, actually','proud');add('proud-two','Yes, I know I am impressive','proud');}
        if(mood==='Relaxed'){add('relaxed-one','No rush today','calm');add('relaxed-two','This is a good pace','calm');}
        if(mood==='Restless'){add('restless-one','I need to do something','excited');add('restless-two','Where next?','curious');}
      }else if(e==='preference'){
        const pref=ctx.preference||choose(this.activeDailyPreferences()),p=String(pref?.type||''),target=this.dailyPreferenceTargetName(pref)||'that';
        priority=DRAGON_THOUGHT_PRIORITY.ambient+5;type='daily-preference';chance=ctx.force?1:.68;cooldownMs=90000;cooldownKey=`daily-preference:${pref?.id||p||'today'}`;clearOnStateChange=true;force=!!ctx.force;
        if(p==='nap_day'){add('nap','Maybe another nap...','sleepy');add('nap-two','Still feeling cosy today','sleepy');}
        if(p==='comfort_seeker'||p==='favourite_corner'){add('comfort','Somewhere comfortable sounds good','calm');add('corner','I know where I want to be','calm');}
        if(p==='toy_obsession'){add('toy','Where is it?','playful');add('toy-two','One more game','playful');}
        if(p==='playful_day'){add('play','Today needs more games','playful');}
        if(p==='puzzle_mood'){add('puzzle','Give me something to figure out','curious');}
        if(p==='training_kick'||p==='focused_practice'){add('train','One more practice','proud');}
        if(p==='race_itch'){add('race','I want another race','proud');}
        if(p==='attention_day'||p==='shadowing'||p==='cuddle_day'){add('keeper','There you are','warm');add('keeper-two','I am keeping close today','warm');}
        if(p==='independent_streak'){add('independent','I have got my own plans today','calm');}
        if(p==='snacky'||p==='treat_hopeful'){add('snack','Snack?','playful');}
        if(p==='bath_lover'||p==='sand_bath_day'){add('bath','Could have another wash...','calm');}
        if(p==='avoiding_bath'){add('avoid-bath','Bath can wait','sulking');}
        if(p==='explorer'){add('explore','What have I not checked yet?','curious');}
        if(p==='window_watcher'){add('window','I want to see what is outside','curious');}
        if(p==='furniture_inspector'){add('inspect','There is still furniture to inspect','curious');}
        if(p==='hideaway'){add('hide','Somewhere quiet sounds good','soft');}
        if(p==='object_fixation'){add('fixation',`${target} again...`,'favourite');}
        if(p==='new_furniture_interest'){add('new',`Still deciding about ${target}`,'curious');}
        if(p==='object_avoidance'){add('avoid',`I am keeping an eye on ${target} from over here`,'soft');}
      }else if(e==='idle'){
        priority=DRAGON_THOUGHT_PRIORITY.ambient;type='ambient';chance=.74;cooldownMs=25000;cooldownKey='ambient';clearOnStateChange=true;
        const state=String(ctx.state||this.state||'idle');
        if(state==='sleeping'){add('sleeping','Could definitely nap...','sleepy');add('sleeping-quiet','This is nice','calm');}
        else if(state==='resting'||state==='sitting'){add('rest','Nice and quiet','calm');add('rest-no-rush','No rush','calm');}
        else if(has('Curious','Explorer','Nosy'))add('curious','What should I investigate next?','curious');
        if(has('Lazy','Nap Lover'))add('lazy','Doing nothing is nice','sleepy');
        if(has('Playful','Toy Obsessed'))add('playful','Bored...','playful');
        if(has('Calm','Quiet Companion'))add('calm','Just enjoying the moment','calm');
        if(has('Affectionate','Clingy','Shadow'))add('affection','There you are','warm');
        if(has('Food Obsessed','Food Goblin','Greedy'))add('food','Snack?','playful');
        if(has('Sleepy','Professional Napper'))add('sleepy','Could nap...','sleepy');
        if(has('Independent','Independent Friend'))add('independent','Off I go','calm');
        if(has('Shy','Nervous'))add('shy','It is peaceful here','soft');
        if(has('Energetic','Hyper','Easily Excited'))add('energy','What is next?','excited');
      }
      if(!rows.length)return false;
      if(!force&&Math.random()>chance)return false;
      const candidate=this.pickDragonThought(rows);if(!candidate)return false;
      const shown=this.showDragonThought(candidate,{priority,type,cooldownMs,cooldownKey,clearOnStateChange,force});
      if(shown&&e==='furniture'&&priority<=DRAGON_THOUGHT_PRIORITY.activity)this.nextActivityThoughtAt=nowMs+rand(DRAGON_THOUGHT_CONFIG.activityMinMs,DRAGON_THOUGHT_CONFIG.activityMaxMs);
      return shown;
    }
    updateDragonThoughts(){
      if(!this.dragonThoughtsEnabled()){if(this.activeThought)this.clearDragonThought('disabled');return;}
      const nowMs=Date.now();if(this.activeThought&&nowMs>=Number(this.activeThought.expiresAt||0))this.clearDragonThought('expired');
      if(nowMs<this.nextAmbientThoughtAt||this.activeThought)return;
      this.nextAmbientThoughtAt=nowMs+rand(DRAGON_THOUGHT_CONFIG.ambientMinMs,DRAGON_THOUGHT_CONFIG.ambientMaxMs);
      if(['walking','approachingStairs','climbingStairs','takingOff','flying','landing'].includes(String(this.state||'')))return;
      const care=this.careStats(),needs=[['hunger',care.hunger],['energy',care.energy],['hygiene',care.hygiene],['fun',care.fun]].sort((a,b)=>a[1]-b[1]);
      let shown=false;if(needs[0]&&Number(needs[0][1])<40&&Math.random()<.62)shown=this.maybeShowDragonThought('need',{need:needs[0][0]});
      if(!shown&&String(this.state).startsWith('furniture')&&this.furnitureUseSession?.meta)shown=this.maybeShowDragonThought('furniture',{meta:this.furnitureUseSession.meta,kind:this.furnitureUseSession.kind,ambient:true});
      if(!shown&&this.activeDailyPreferences().length&&Math.random()<.38)shown=this.maybeShowDragonThought('preference',{preference:choose(this.activeDailyPreferences())});
      if(!shown&&this.currentMoodName()&&Math.random()<.52)shown=this.maybeShowDragonThought('mood',{mood:this.currentMoodName()});
      if(!shown)this.maybeShowDragonThought('idle',{state:this.state});
    }
    universeEvidence(family=''){
      const obs=this.memory?.observationCounters||{},life=this.lifeData(),total=Number(obs.totalDecisions||0),sum=(...keys)=>keys.reduce((n,k)=>n+Number(obs[k]||0),0),f=String(family||'');
      if(f==='Energy')return sum('walkSessions','zoomiesTriggered')+total*.12;
      if(f==='Rhythm')return total*.18+Object.values(life.routineCounts||{}).reduce((n,row)=>n+Object.values(row||{}).reduce((s,v)=>s+Number(v||0),0),0)*.3;
      if(f==='Social'||f==='Keeper Bond')return sum('petsReceived','keeperSeekingEvents')+Number(this.personalityUniverse?.relationship?.greetings||0)*2+this.bond*.035;
      if(f==='Curiosity')return sum('lookSessions','newLocationsVisited','newFurnitureInvestigations','furnitureInteractions')*.55;
      if(f==='Play')return sum('toyPlays','puzzleUses','zoomiesTriggered','lifeZoomies','toyCarries','ballChases')*.85;
      if(f==='Food')return sum('feedingUses','drinkUses','dragonBitesEaten','foodInvestigations');
      if(f==='Training')return sum('trainingUses','autonomousTrainingMoments','flightsTaken','climbUses')*.9;
      if(f==='Sleep')return sum('bedSleeps','sleepSessions','restSessions')*.75;
      if(f==='Cleanliness')return sum('bathUses','groomingUses','bathSplashes')*.95;
      if(f==='Emotion')return total*.18+sum('petsReceived','zoomiesTriggered','restSessions')*.25;
      if(f==='Environment')return sum('windowWatches','lifeWindowWatches','warmRestUses','newLocationsVisited')*.8;
      if(f==='Routine')return Number(obs.sameSleepSpotVisits||0)*1.8+Object.values(life.routineCounts||{}).reduce((n,row)=>n+Math.max(0,...Object.values(row||{}).map(Number)),0)*.7;
      return total*.2;
    }
    discoverUniverseTraits(){
      const u=this.personalityUniverse||this.ensurePersonalityUniverse(),nowMs=Date.now();u.observations=boundedObject(u.observations,{});u.discoveredTraits=Array.isArray(u.discoveredTraits)?u.discoveredTraits:[];u.observations.ticks=Number(u.observations.ticks||0)+1;if(nowMs-Number(u.observations.lastDiscoveryAt||0)<70000)return false;
      const assigned=this.personalityUniverseAllTraits(),hidden=assigned.filter(name=>!u.discoveredTraits.includes(name));if(!hidden.length)return false;
      const scored=hidden.map(name=>{const def=this.personalityUniverseTraitDef(name),core=(u.innateTraits||[]).includes(name),target=core?6:11,evidence=this.universeEvidence(def?.family);return{name,def,target,evidence,ratio:evidence/target};}).sort((a,b)=>b.ratio-a.ratio);
      const pick=scored.find(row=>row.ratio>=1);if(!pick){const tentative=scored[0];u.observations.tentativeTrait=tentative?.ratio>=.48?tentative.name:'';u.observations.tentativeRatio=tentative?.ratio||0;return false;}
      u.discoveredTraits.push(pick.name);u.observations.lastDiscoveryAt=nowMs;u.observations.tentativeTrait='';this.memory.traitDiscoveredAt=this.memory.traitDiscoveredAt||{};this.memory.traitDiscoveredAt[pick.name]=nowMs;this.rememberLifeEvent('trait',`Discovered: ${pick.name}`,pick.def?.note||'A new part of their nature revealed itself.',`universe-trait-${pick.name}`);this.lifeEventNotice(`New observation · ${pick.name}`,'happy');this.personalityExpression('★',pick.name,'discovery');this.behaviourDirty=true;return true;
    }
    quirkEvidence(kind=''){
      const obs=this.memory?.observationCounters||{},u=this.personalityUniverse||{},trans=u.transitions||{},n=k=>Number(obs[k]||0);switch(kind){
        case'sleep':return n('bedSleeps')+n('sleepSessions');case'warm':return n('warmRestUses');case'food':return n('feedingUses')+n('foodInvestigations');case'explore':return n('newLocationsVisited')+n('walkSessions')*.25;case'keeper':return n('petsReceived')+Number(u.relationship?.greetings||0);case'treat':return n('dragonBitesEaten');case'play':return n('toyPlays')+n('puzzleUses')+n('toyCarries');case'newFurniture':return n('newFurnitureInvestigations');case'furniture':return n('furnitureInteractions')*.35;case'window':return n('windowWatches')+n('lifeWindowWatches');case'climb':return n('climbUses')+n('stairsUsed')*.35;case'training':return n('trainingUses')+n('autonomousTrainingMoments');case'eatSleep':return Number(trans['eat>sleep']||0);case'playSleep':return Number(trans['play>sleep']||0);case'evening':return Object.values(this.lifeData().routineCounts?.evening||{}).reduce((s,v)=>s+Number(v||0),0);case'rest':return n('restSessions')+n('bedSleeps')*.4;case'hide':return n('hideUses');case'favourite':return Number(this.preferences?.formed?.favouriteFurniture?.count||0);case'mischief':return n('cupboardsOpened')+n('hoardVisits');case'bath':return n('bathUses');case'scratch':return n('scratchUses');case'trainingRest':return Number(trans['training>rest']||0);case'bathSleep':return Number(trans['bath>sleep']||0);case'hoard':return n('hoardVisits')+n('hoardableUses');case'walk':return n('walkSessions')*.35;default:return n('totalDecisions')*.12;}
    }
    discoverUniverseQuirks(){
      const u=this.personalityUniverse||this.ensurePersonalityUniverse(),nowMs=Date.now();u.discoveredQuirks=Array.isArray(u.discoveredQuirks)?u.discoveredQuirks:[];if(nowMs-Number(u.observations?.lastQuirkDiscoveryAt||0)<150000)return false;const candidates=(u.quirks||[]).map(q=>DRAGONBOUND_UNIVERSE_QUIRK_BY_ID[q.id]||q).filter(q=>q?.id&&!u.discoveredQuirks.includes(q.id)).map(q=>({q,evidence:this.quirkEvidence(q.evidence)})).sort((a,b)=>(b.evidence/Math.max(1,b.q.min||3))-(a.evidence/Math.max(1,a.q.min||3)));const pick=candidates.find(v=>v.evidence>=Number(v.q.min||3));if(!pick)return false;u.discoveredQuirks.push(pick.q.id);u.observations.lastQuirkDiscoveryAt=nowMs;this.rememberLifeEvent('quirk',`Quirk discovered: ${pick.q.label}`,pick.q.note,`quirk-${pick.q.id}`);this.lifeEventNotice(`New quirk · ${pick.q.label}`,'happy');this.personalityExpression('?',pick.q.label,'discovery');this.behaviourDirty=true;return true;
    }
    noteUniverseActivity(kind='',meta={}){
      const u=this.personalityUniverse||this.ensurePersonalityUniverse(),nowMs=Date.now(),raw=String(kind||''),mapKind=k=>k.startsWith('furniture:')?({eat:'eat',drink:'eat',sleep:'sleep',rest:'rest',perch:'rest',play:'play',puzzle:'play',scratch:'play',dig:'play',wash:'bath',sandbath:'bath',groom:'bath',exercise:'training',climb:'training',fire:'training',roar:'training',warm:'rest',watch:'window'}[k.split(':')[1]]||'furniture'):k.startsWith('life:')?({zoomies:'play','toy-carry':'play','ball-chase':'play','training-practice':'training','flight-practice':'training','bath-fun':'bath','food-check':'eat','window-watch':'window','quiet-hide':'rest'}[k.slice(5)]||k.slice(5)):k==='sleeping'?'sleep':k==='resting'?'rest':k==='zoomies'?'play':k==='flight'?'training':k==='treat'?'treat':k==='keeper:pet'||k==='keeper:greeting'?'keeper':k;
      const simple=mapKind(raw),recent=Array.isArray(u.recentActivity)?u.recentActivity:[],prev=recent[recent.length-1];if(prev&&prev.kind!==simple&&nowMs-Number(prev.at||0)<12*60*1000){u.transitions=boundedObject(u.transitions,{});u.transitions[`${prev.kind}>${simple}`]=(Number(u.transitions[`${prev.kind}>${simple}`])||0)+1;}
      u.recentActivity=[...recent,{kind:simple,raw,at:nowMs,name:String(meta?.name||'').slice(0,64)}].slice(-14);if(simple==='keeper'){u.relationship=boundedObject(u.relationship,{});if(raw==='keeper:pet')u.relationship.pets=(Number(u.relationship.pets)||0)+1;if(raw==='keeper:greeting')u.relationship.greetings=(Number(u.relationship.greetings)||0)+1;}
      // V33.80: sparse, meaningful tells. The 90s expression guard prevents visual spam.
      if(Math.random()<.16){const tell=simple==='keeper'?['♥','', 'warm']:simple==='sleep'?['zzz','', 'sleepy']:simple==='play'?['♪','', 'playful']:simple==='training'?['★','', 'proud']:simple==='window'?['…','', 'curious']:simple==='furniture'&&meta?.isNew?['?','new','curious']:null;if(tell)this.personalityExpression(tell[0],tell[1],tell[2]);}
      this.refreshUniverseHabits();this.discoverUniverseTraits();this.discoverUniverseQuirks();try{window.dispatchEvent(new CustomEvent('dragonbound:personality-activity',{detail:{kind:simple,raw,meta:{name:String(meta?.name||'').slice(0,64),itemId:String(meta?.itemId||'').slice(0,64)},dragonId:String(this.dragon?.id||''),dragonName:String(this.dragon?.name||'Your dragon')}}));}catch(_e){}this.behaviourDirty=true;
    }
    refreshUniverseHabits(){
      const u=this.personalityUniverse||this.ensurePersonalityUniverse(),t=u.transitions||{},habits=boundedObject(u.habits,{}),life=this.lifeData(),add=(id,label,evidence,detail='')=>{if(Number(evidence)<3)return;if(!habits[id]){habits[id]={id,label,detail,discoveredAt:Date.now(),evidence:Number(evidence)};this.rememberLifeEvent('habit',`Habit noticed: ${label}`,detail||'A little routine has started to become familiar.',`habit-${id}`);}else habits[id].evidence=Number(evidence);};
      add('post-meal-nap','Often naps after eating',t['eat>sleep'],'Meals and naps have started appearing together often enough to look deliberate.');add('post-play-rest','Likes to wind down after playing',t['play>rest']||t['play>sleep'],'Big play sessions are often followed by a proper flop.');add('post-training-rest','Usually rests after training',t['training>rest']||t['training>sleep'],'Practice tends to be followed by a well-earned rest.');add('clean-then-cosy','Likes settling down after a bath',t['bath>rest']||t['bath>sleep'],'A clean dragon apparently deserves a cosy dragon.');add('treat-zoomies','Dragon Bites often trigger zoomies',t['treat>play'],'Treat excitement has become a very recognisable little pattern.');
      const periods=['morning','day','evening','night'];for(const period of periods){const top=Object.entries(life.routineCounts?.[period]||{}).sort((a,b)=>Number(b[1]||0)-Number(a[1]||0))[0];if(top&&Number(top[1])>=4)add(`routine-${period}`,`Has a ${period} routine`,Number(top[1]),`${LIFE_EVENT_DEFS[top[0]]?.label||top[0]} is becoming a familiar ${period} activity.`);}
      const fav=this.preferences?.formed?.favouriteFurniture;if(fav?.name&&Number(fav.count||0)>=4)add('favourite-return',`Keeps returning to ${fav.name}`,Number(fav.count),`Even with other choices available, ${fav.name} keeps winning.`);u.habits=habits;
    }
    personalityTitle(){
      const u=this.personalityUniverse||this.ensurePersonalityUniverse(),known=u.discoveredTraits||[],names=known.slice(),pick=(...c)=>c.find(x=>names.includes(x));if(pick('Hyper','Zoomies-Prone','Bouncy')&&pick('Curious','Explorer','Nosy'))return'The Curious Rocket';if(pick('Lazy','Nap Lover','Heavy Sleeper')&&pick('Affectionate','Cuddlebug','Shadow'))return'The Cuddly Lounger';if(pick('Mischievous','Prankster','Tiny Tyrant'))return'The Household Menace';if(pick('Window Watcher','Observant'))return'The Window Watcher';if(pick('Bath Lover','Water Baby'))return'The Bath Enthusiast';if(pick('Foodie','Greedy','Treat Obsessed'))return'The Treat Inspector';if(pick('Explorer','Fearless Explorer','Wanderer'))return'The Little Explorer';if(pick('Focused','Training Addict','Natural Athlete'))return'The Tiny Athlete';if(pick('Shy','Quiet Companion')&&pick('Affectionate','Quietly Loyal'))return'The Gentle Shadow';if(pick('Nap Lover','Heavy Sleeper','Lazy'))return'The Professional Lounger';return names[0]?`The ${names[0]}`:'Still Becoming Themselves';
    }
    personalityKeeperNote(){
      const u=this.personalityUniverse||this.ensurePersonalityUniverse(),fav=this.preferences?.formed?.favouriteFurniture?.name||'',moment=this.lifeData().lastMeaningfulMoment,habit=Object.values(u.habits||{}).sort((a,b)=>Number(b.discoveredAt||0)-Number(a.discoveredAt||0))[0];if(moment?.detail)return String(moment.detail);if(habit?.detail)return String(habit.detail);if(fav)return`${this.dragon?.name||'Your dragon'} keeps finding reasons to return to ${fav}.`;const tentative=String(u.observations?.tentativeTrait||'');if(tentative)return`May be ${tentative.toLowerCase()} — Bonnie's notes need a little more evidence.`;return'Keep watching what they choose when nobody tells them what to do.';
    }
    personalityUniverseSummary(){
      const u=this.personalityUniverse||this.ensurePersonalityUniverse(),defs=DRAGONBOUND_UNIVERSE_QUIRK_BY_ID,knownTraits=this.personalityUniverseDiscovered(),knownQuirks=(u.quirks||[]).filter(q=>u.discoveredQuirks?.includes(q.id)).map(q=>defs[q.id]||q),habits=Object.values(u.habits||{}).sort((a,b)=>Number(b.evidence||0)-Number(a.evidence||0)),fav=this.preferences?.formed?.favouriteFurniture?.name||'',recent=u.recentActivity||[],latest=recent[recent.length-1]||{},activityLabel={play:'Playtime',sleep:'Nap time',rest:'Cosy spots',training:'Training',window:'Watching the world',eat:'Food',treat:'Dragon Bites',keeper:'Keeping an eye on you',furniture:'Household investigating'}[latest.kind]||'',topRecent=recent.slice(-6).map(v=>v.name).filter(Boolean).pop()||activityLabel||fav,dislikes=[];
      Object.values(u.dislikes||{}).sort((a,b)=>Number(b.at||0)-Number(a.at||0)).slice(0,3).forEach(v=>{if(v?.name)dislikes.push(v.name);});if(knownTraits.includes('Bath Hater'))dislikes.push('Bath time');if(knownTraits.includes('Suspicious of New Food'))dislikes.push('Unfamiliar food');if(knownTraits.includes('Shy'))dislikes.push('Busy attention');if(knownTraits.includes('Quiet Companion'))dislikes.push('Noisy spaces');if(knownTraits.includes('Reluctant Trainee'))dislikes.push('Being pushed into training');if(knownTraits.includes('Indoor Dragon'))dislikes.push('Too much unfamiliar wandering');
      const comforts=[];if(fav)comforts.push(fav);if(knownTraits.includes('Fireplace Lover'))comforts.push('Warm hearths');if(knownTraits.includes('Cosy Corner Lover'))comforts.push('Quiet corners');if(knownTraits.includes('Bed Loyalist'))comforts.push('A familiar bed');if(knownTraits.includes('Cuddlebug')||knownTraits.includes('Affectionate'))comforts.push('Keeper affection');
      const relation=u.relationship||{},relationship=relation.greetings>=3?'Usually notices when you come home':this.bond>=80?'Deeply trusting, but still unmistakably themselves':this.bond>=60?'Comfortable and secure around you':this.bond>=40?'Beginning to trust your routines':'Still learning what life with you feels like';return{version:u.version,title:this.personalityTitle(),knownTraits,hiddenTraits:Math.max(0,this.personalityUniverseAllTraits().length-knownTraits.length),tentative:String(u.observations?.tentativeTrait||''),knownQuirks,hiddenQuirks:Math.max(0,(u.quirks||[]).length-knownQuirks.length),habits,comforts:[...new Set(comforts)].slice(0,5),dislikes:[...new Set(dislikes)].slice(0,5),relationship,currentObsession:topRecent||'Still choosing',keeperNote:this.personalityKeeperNote(),togetherDays:Math.max(0,Math.floor((Date.now()-Number(this.dragon?.hatchedAt||Date.now()))/86400000)),axes:{...u.axes}};
    }
    personalityUniverseSnapshot(){
      const u=this.personalityUniverse||this.ensurePersonalityUniverse();return{version:u.version,seed:u.seed,createdAt:Number(u.createdAt||0),axes:{...(u.axes||{})},innateTraits:[...(u.innateTraits||[])].slice(0,6),secondaryTraits:[...(u.secondaryTraits||[])].slice(0,8),discoveredTraits:[...(u.discoveredTraits||[])].slice(0,14),quirks:(u.quirks||[]).slice(0,4).map(q=>({id:q.id,label:q.label,note:q.note})),discoveredQuirks:[...(u.discoveredQuirks||[])].slice(0,4),habits:Object.fromEntries(Object.entries(u.habits||{}).slice(-12)),transitions:Object.fromEntries(Object.entries(u.transitions||{}).sort((a,b)=>Number(b[1]||0)-Number(a[1]||0)).slice(0,20)),recentActivity:(u.recentActivity||[]).slice(-14),furnitureRelations:Object.fromEntries(Object.entries(u.furnitureRelations||{}).sort((a,b)=>Number(b[1]?.lastAt||0)-Number(a[1]?.lastAt||0)).slice(0,24)),dislikes:Object.fromEntries(Object.entries(u.dislikes||{}).sort((a,b)=>Number(b[1]?.at||0)-Number(a[1]?.at||0)).slice(0,8)),relationship:{...(u.relationship||{})},observations:{...(u.observations||{})},descriptor:this.personalityTitle(),lastExpressionAt:Number(u.lastExpressionAt||0)};
    }
    personalityReaction(type=''){
      const known=[...new Set([...(this.signatureTraits||[]),...this.personalityUniverseAllTraits()])],has=n=>known.includes(n),name=this.dragon?.name||'Your dragon';if(type==='treat'){if(has('Food Obsessed')||has('Treat Obsessed')||has('Greedy')||has('Always Hungry'))return`${name} recognises that sound immediately.`;if(has('Picky')||has('Suspicious of New Food'))return`${name} gives it one careful look… then decides it is worth investigating.`;if(has('Easily Excited')||has('Energetic')||has('Hyper')||has('Zoomies-Prone'))return`${name} spots it and the entire room suddenly feels too small.`;if(has('Lazy'))return`${name} notices it… eventually.`;}if(type==='pet'){if(has('Cuddlebug')||has('Affectionate'))return'loves the scratches ♥';if(has('Independent Friend'))return'pretends not to care';if(has('Shy'))return this.bond>=60?'leans in softly':'tiny happy nudge';if(has('Hyper')||has('Bouncy'))return'happy wiggles!';if(has('Lazy')||has('Nap Lover'))return'melts into it';}return'';
    }
    hasUniverseQuirk(id){return (this.personalityUniverse?.quirks||[]).some(q=>String(q?.id||q)===String(id||''));}
    universeLastActivity(){const rows=this.personalityUniverse?.recentActivity||[];return rows[rows.length-1]||null;}
    rememberLifeEvent(type,title,detail='',onceKey=''){
      this.memory.lifeHistory=Array.isArray(this.memory.lifeHistory)?this.memory.lifeHistory:[];
      this.memory.firsts=boundedObject(this.memory.firsts,{});
      if(onceKey&&this.memory.firsts[onceKey])return false;
      const at=Date.now();if(onceKey)this.memory.firsts[onceKey]=at;
      const entry={type:String(type||'memory').slice(0,32),title:String(title||'A little memory').slice(0,96),detail:String(detail||'').slice(0,180),at};
      this.memory.lifeHistory=[entry,...this.memory.lifeHistory.filter(x=>x&&x.title!==entry.title)].slice(0,40);this.behaviourDirty=true;return true;
    }

    lifePeriod(date=new Date()){
      const h=date.getHours();if(h>=6&&h<11)return'morning';if(h>=11&&h<17)return'day';if(h>=17&&h<22)return'evening';return'night';
    }
    lifeData(){
      const life=boundedObject(this.memory.dailyLife,{});life.cooldowns=boundedObject(life.cooldowns,{});life.eventCounts=boundedObject(life.eventCounts,{});life.routineCounts=boundedObject(life.routineCounts,{});life.knownFurniture=boundedObject(life.knownFurniture,{});life.moodCounts=boundedObject(life.moodCounts,{});life.recentEvents=Array.isArray(life.recentEvents)?life.recentEvents.slice(-10):[];life.lastMeaningfulMoment=boundedObject(life.lastMeaningfulMoment,{});this.memory.dailyLife=life;return life;
    }
    lifeEventNotice(text,tone=''){
      if(!this.el||!text)return;this.lifeEventLabel?.remove();const label=document.createElement('span');label.className='dragonbound-life-moment'+(tone?` is-${tone}`:'');label.textContent=String(text).slice(0,92);this.el.appendChild(label);this.lifeEventLabel=label;setTimeout(()=>{if(this.lifeEventLabel===label)this.lifeEventLabel=null;label.remove();},3600);
    }
    lifeCooldownReady(type,at=Date.now()){return Number(this.lifeData().cooldowns?.[type]||0)<=at;}
    armLifeCooldown(type){
      const def=LIFE_EVENT_DEFS[type]||{cooldown:[15,30]},minutes=rand(Number(def.cooldown?.[0]||15),Number(def.cooldown?.[1]||30)),life=this.lifeData();life.cooldowns[type]=Date.now()+minutes*60*1000;return life.cooldowns[type];
    }
    syncLifeFurniture(seedIfNeeded=true){
      const life=this.lifeData(),items=getFurnitureInteractions().filter(x=>x?.placementId),nowMs=Date.now();
      if(!life.knownFurnitureSeeded&&seedIfNeeded){for(const meta of items)life.knownFurniture[String(meta.placementId)]={seenAt:nowMs,used:true};life.knownFurnitureSeeded=nowMs;this.behaviourDirty=true;return [];}
      const fresh=[];for(const meta of items){const id=String(meta.placementId);if(!life.knownFurniture[id]){life.knownFurniture[id]={seenAt:nowMs,used:false};fresh.push(meta);}}
      const liveIds=new Set(items.map(v=>String(v.placementId)));for(const id of Object.keys(life.knownFurniture)){if(!liveIds.has(id))delete life.knownFurniture[id];}
      this.reconcileFurnitureFavourites(liveIds);
      if(fresh.length)this.behaviourDirty=true;return fresh;
    }
    markLifeFurnitureUsed(meta={}){
      const id=String(meta.placementId||'');if(!id)return;const life=this.lifeData(),row=boundedObject(life.knownFurniture[id],{});life.knownFurniture[id]={seenAt:Number(row.seenAt||Date.now()),used:true,lastUsedAt:Date.now()};this.behaviourDirty=true;
    }
    sampleMoodHistory(){
      const life=this.lifeData(),mood=this.moodSummary();life.moodCounts[mood]=(Number(life.moodCounts[mood])||0)+1;life.lastMood=mood;life.lastMoodAt=Date.now();this.behaviourDirty=true;
    }
    lifeRoutineBoost(type){
      const period=this.lifePeriod(),counts=this.lifeData().routineCounts?.[period]||{},top=Object.entries(counts).sort((a,b)=>Number(b[1]||0)-Number(a[1]||0))[0];return top?.[0]===type?10:0;
    }
    recordDailyLifeEvent(type,detail='',target=null){
      const life=this.lifeData(),def=LIFE_EVENT_DEFS[type]||{label:type,importance:'ordinary'},nowMs=Date.now(),period=this.lifePeriod();life.eventCounts[type]=(Number(life.eventCounts[type])||0)+1;life.recentEvents=[...life.recentEvents,type].slice(-10);life.lastEventAt=nowMs;life.globalReadyAt=nowMs+rand(LIFE_EVENT_GLOBAL_MIN_MS,LIFE_EVENT_GLOBAL_MAX_MS);this.armLifeCooldown(type);
      life.routineCounts[period]=boundedObject(life.routineCounts[period],{});life.routineCounts[period][type]=(Number(life.routineCounts[period][type])||0)+1;
      const periodCount=life.routineCounts[period][type];if(periodCount>=3){this.preferences.formed=this.preferences.formed||{};const key=period==='morning'?'preferredMorningActivity':period==='evening'?'preferredEveningActivity':period==='night'?'preferredNightActivity':'preferredDayActivity';this.preferences.formed[key]=type;}
      const moment={type,label:def.label,detail:String(detail||def.label).slice(0,160),at:nowMs,targetName:String(target?.name||'').slice(0,90)};if(def.importance!=='ordinary'||Math.random()<.35)life.lastMeaningfulMoment=moment;
      const obs=this.memory.observationCounters||(this.memory.observationCounters={});
      if(type==='toy-carry'){obs.toyCarries=(Number(obs.toyCarries)||0)+1;if(life.eventCounts[type]===1)this.rememberLifeEvent('life','First toy retrieval',`${this.dragon?.name||'Your dragon'} carried ${target?.name||'a favourite toy'} across the room.`,'life-first-toy-carry');}
      if(type==='ball-chase')obs.ballChases=(Number(obs.ballChases)||0)+1;
      if(type==='cupboard-mischief'){obs.cupboardsOpened=(Number(obs.cupboardsOpened)||0)+1;if(life.eventCounts[type]===1)this.rememberLifeEvent('life','First bit of mischief',`${this.dragon?.name||'Your dragon'} discovered that cupboard doors are apparently fascinating.`,'life-first-mischief');}
      if(type==='hoard-trip'){obs.hoardVisits=(Number(obs.hoardVisits)||0)+1;if(life.eventCounts[type]===1)this.rememberLifeEvent('life','A little hoard begins',`${this.dragon?.name||'Your dragon'} has started keeping favourite things together.`,'life-first-hoard');}
      if(type==='window-watch'){obs.lifeWindowWatches=(Number(obs.lifeWindowWatches)||0)+1;if(life.eventCounts[type]===3)this.rememberLifeEvent('life','A window-watching routine',`${this.dragon?.name||'Your dragon'} seems to enjoy watching the world outside.`,'life-window-routine');}
      if(type==='food-check')obs.foodInvestigations=(Number(obs.foodInvestigations)||0)+1;
      if(type==='training-practice')obs.autonomousTrainingMoments=(Number(obs.autonomousTrainingMoments)||0)+1;
      if(type==='bath-fun')obs.bathSplashes=(Number(obs.bathSplashes)||0)+1;
      if(type==='new-furniture')obs.newFurnitureInvestigations=(Number(obs.newFurnitureInvestigations)||0)+1;
      if(type==='zoomies')obs.lifeZoomies=(Number(obs.lifeZoomies)||0)+1;
      if(type==='favourite-return')obs.favouriteReturns=(Number(obs.favouriteReturns)||0)+1;
      this.currentLifeEvent={type,label:def.label,startedAt:nowMs,targetPlacementId:String(target?.placementId||''),targetName:String(target?.name||'')};this.noteUniverseActivity(`life:${type}`,target||{});this.behaviourDirty=true;this.discoverTraits();this.engine.saveBehaviourLocal?.();return moment;
    }
    finishDailyLifeEvent(){if(!this.currentLifeEvent)return;this.currentLifeEvent.endedAt=Date.now();this.currentLifeEvent=null;this.behaviourDirty=true;}
    weightedLifePick(candidates=[]){
      const recent=this.lifeData().recentEvents||[],rows=candidates.map(row=>{let score=Math.max(.1,Number(row.score)||0),n=0;for(const r of recent)if(r===row.type)n++;if(n)score*=Math.pow(.28,n);score+=this.lifeRoutineBoost(row.type);return{...row,score};}).filter(v=>v.score>.25);if(!rows.length)return null;const total=rows.reduce((s,v)=>s+Math.pow(v.score,1.15),0);let r=Math.random()*total;for(const row of rows){r-=Math.pow(row.score,1.15);if(r<=0)return row;}return rows[0];
    }
    lifeEventCandidates(){
      const nowMs=Date.now(),care=this.careStats(),needPressure=Math.max(this.needs.rest,this.needs.hunger,this.needs.hygiene,this.needs.stimulation),mood=this.moodSummary(),items=getFurnitureInteractions().filter(x=>x&&x.roomId===this.floorId),c=[];
      // Once any real care bar reaches its 30-40% autonomy threshold, optional daily-life
      // moments stand aside and the normal AI is allowed to solve that need first.
      if(this.carePriorityNeed())return c;
      const eligible=type=>this.lifeCooldownReady(type,nowMs),traits=new Set([...(this.assignedTraits||[]),...(this.signatureTraits||[])]),has=t=>traits.has(t),weather=String(this.engine?.weatherMode||'');
      const entries=items.map(meta=>{const kind=this.furnitureKind(meta),flags=this.physicalClassification(meta,kind),tags=new Set(this.effectiveFurnitureTags(meta));return{meta,kind,flags,tags,sources:this.furnitureSkillSources(meta,kind)};});
      const pickBest=(filter,bonus=()=>0)=>entries.filter(filter).map(v=>({...v,fit:Number(bonus(v))||0})).sort((a,b)=>b.fit-a.fit)[0]||null;
      const favouriteId=String(this.preferences?.formed?.favouriteFurniture?.placementId||'');
      if(eligible('toy-carry')){const row=pickBest(v=>v.flags.carryable,v=>(v.meta.placementId===favouriteId?16:0)+(has('Toy Obsessed')||has('Playful')?28:0)+(has('Hoarder')||has('Collector')||has('Treasure Hunter')?14:0)+this.stat('playfulness')*.15);if(row)c.push({type:'toy-carry',target:row.meta,score:8+row.fit});}
      if(eligible('ball-chase')){const row=pickBest(v=>v.flags.rollable&&v.flags.toy,()=>this.stat('playfulness')*.18+(has('Toy Obsessed')?18:0));if(row)c.push({type:'ball-chase',target:row.meta,score:6+row.fit});}
      if(eligible('hoard-trip')&&(has('Hoarder')||has('Collector')||has('Treasure Hunter'))){const row=pickBest(v=>v.flags.carryable,()=>24+this.stat('mischief')*.08);if(row)c.push({type:'hoard-trip',target:row.meta,score:18+row.fit});}
      if(eligible('cupboard-mischief')){const row=pickBest(v=>v.flags.openable,v=>(has('Tiny Menace')||has('Mischievous')||has('Prankster')?30:0)+(has('Hoarder')||has('Collector')?18:0)+(has('Food Goblin')||has('Greedy')||has('Snack Hunter')?12:0)+this.stat('mischief')*.22);if(row)c.push({type:'cupboard-mischief',target:row.meta,score:4+row.fit});}
      if(eligible('new-furniture')){const life=this.lifeData(),row=pickBest(v=>life.knownFurniture?.[String(v.meta.placementId)]&&!life.knownFurniture[String(v.meta.placementId)].used,v=>(has('Furniture Inspector')||has('Curious')||has('Nosy')?34:0)+(has('Explorer')||has('Fearless Explorer')||has('Change Lover')?16:0)+(has('Coward')||has('Shy')||has('Nervous')?-10:0)+this.stat('curiosity')*.20);if(row)c.push({type:'new-furniture',target:row.meta,score:10+row.fit});}
      if(eligible('window-watch')){const row=pickBest(v=>v.tags.has('window'),()=>this.stat('curiosity')*.12+(has('Window Watcher')||has('Watcher')||has('Observant')?28:0)+(has('Rain Lover')&&/rain|mist|snow/.test(weather)?24:0));if(row)c.push({type:'window-watch',target:row.meta,score:5+row.fit});}
      if(eligible('cosy-nap')&&(care.energy<=CARE_AUTONOMY_THRESHOLDS.energy||((has('Professional Napper')||has('Nap Lover')||has('Heavy Sleeper'))&&care.energy<68))){const row=pickBest(v=>v.kind==='sleep'||v.kind==='rest',v=>(v.meta.placementId===favouriteId?18:0)+(has('Professional Napper')||has('Nap Lover')||has('Heavy Sleeper')?34:0)+(has('Creature of Habit')||has('Routine Lover')||has('Bed Loyalist')||has('Routine Companion')?14:0)+this.stat('sleepiness')*.16);if(row)c.push({type:'cosy-nap',target:row.meta,score:5+row.fit+(100-care.energy)*.12});}
      if(eligible('bath-fun')&&(care.hygiene<=CARE_AUTONOMY_THRESHOLDS.hygiene||((has('Splash Addict')||has('Bath Lover')||has('Water Baby')||has('Sand Bath Fan'))&&care.hygiene<68))){const row=pickBest(v=>v.flags.bath,()=>has('Splash Addict')||has('Bath Lover')||has('Water Baby')?38:this.stat('playfulness')*.08);if(row)c.push({type:'bath-fun',target:row.meta,score:3+row.fit+(100-care.hygiene)*.06});}
      if(eligible('food-check')&&care.hunger<=CARE_AUTONOMY_THRESHOLDS.hunger){const row=pickBest(v=>v.flags.feeding,()=>has('Food Obsessed')||has('Food Goblin')||has('Greedy')||has('Foodie')||has('Treat Obsessed')||has('Always Hungry')?32:this.stat('appetite')*.12);if(row)c.push({type:'food-check',target:row.meta,score:4+row.fit+(100-care.hunger)*.05});}
      if(eligible('training-practice')&&care.energy>45&&mood!=='Grumpy'&&mood!=='Sulking'){const row=pickBest(v=>v.sources.some(s=>Number(s.rate)>=.12),v=>{const ready=v.sources.some(s=>this.skillCooldownRemaining(s.skill)<=0),physical=v.sources.some(s=>s.skill==='agility'||s.skill==='strength');return(ready?14:2)+((has('Competitive')||has('Energetic')||has('Little Athlete')||has('Natural Athlete')||has('Training Addict'))&&physical?30:0)+((has('Little Pilot')||has('Born Flyer'))&&v.sources.some(s=>s.skill==='flying')?20:0)+this.stat('energy')*.08;});if(row)c.push({type:'training-practice',target:row.meta,score:2+row.fit});}
      if(eligible('flight-practice')&&care.energy>50&&!has('Grounded')&&!has('Reluctant Trainee')){const row=pickBest(v=>v.sources.some(s=>s.skill==='flying'),()=>has('Little Pilot')||has('Born Flyer')?35:this.stat('bravery')*.10);if(row)c.push({type:'flight-practice',target:row.meta,score:2+row.fit});}
      if(eligible('quiet-hide')&&(mood==='Sulking'||mood==='Grumpy'||has('Coward')||has('Introvert')||has('Shy')||has('Nervous')||has('Quiet Companion')||has('Cosy Corner Lover'))){const row=pickBest(v=>v.tags.has('hideable')||v.kind==='hide',()=>mood==='Sulking'?32:has('Coward')?18:8);if(row)c.push({type:'quiet-hide',target:row.meta,score:7+row.fit});}
      if(eligible('zoomies')&&care.energy>62&&care.fun>48&&(has('Easily Excited')||has('Energetic')||has('Zoomies')||has('Restless')||has('Hyper')||has('Bouncy')||has('Zoomies-Prone')||this.stat('playfulness')>68))c.push({type:'zoomies',score:8+(has('Easily Excited')||has('Zoomies')||has('Hyper')||has('Zoomies-Prone')?36:0)+this.stat('playfulness')*.12});
      if(eligible('curious-wander')&&(has('Explorer')||has('Adventurous')||has('Fearless Explorer')||has('Curious')||has('Wanderer')||this.stat('curiosity')>62))c.push({type:'curious-wander',score:6+this.stat('curiosity')*.16+(has('Explorer')||has('Fearless Explorer')?18:0)});
      if(eligible('favourite-return')&&favouriteId){
        const row=entries.find(v=>String(v.meta?.placementId||'')===favouriteId);
        if(row){
          let fit=8;
          if(has('Creature of Habit')||has('Routine Lover')||has('Bed Loyalist')||has('Routine Companion')||has('Lazy')||has('Sleepy'))fit+=12;
          if(has('Curious')||has('Explorer')||has('Change Lover'))fit-=4;
          c.push({type:'favourite-return',target:row.meta,score:Math.max(2,fit)});
        }
      }
      return c;
    }
    startDailyLifeEvent(type='',target=null,forced=false){
      if(!type)return false;const def=LIFE_EVENT_DEFS[type];if(!def)return false;if(!forced&&(!this.lifeCooldownReady(type)||Date.now()<Number(this.lifeData().globalReadyAt||0)))return false;
      if(this.engine?.stage?.classList.contains('is-visiting-house')||this.engine?.homeScene?.classList.contains('is-build-editing')||this.engine?.homeScene?.classList.contains('is-build-placing'))return false;
      let started=false,detail=def.label;
      if(target){started=this.commandFurniture(target);detail=target?.name?`${def.label}: ${target.name}`:def.label;}
      else if(type==='zoomies'){started=this.startWalk(null,'zoomies');if(started)this.walkSpeedBoost=Math.max(this.walkSpeedBoost,1.34);}
      else if(type==='curious-wander')started=this.startWalk(null,'explore');
      if(!started)return false;this.recordDailyLifeEvent(type,detail,target);this.lifeEventNotice(def.label,type==='zoomies'?'excited':'');return true;
    }
    maybeDailyLifeEvent(t=Date.now()){
      const nowMs=Date.now();if(nowMs<this.nextLifeEventCheckAt)return;this.nextLifeEventCheckAt=nowMs+rand(6500,12500);this.syncLifeFurniture(true);
      if(nowMs>=this.nextMoodSampleAt){this.sampleMoodHistory();this.nextMoodSampleAt=nowMs+120000;}
      if(this.currentLifeEvent){const busy=String(this.state).startsWith('furniture')||this.state==='walking'||this.state==='flying'||this.state==='takingOff'||this.state==='landing';if(!busy)this.finishDailyLifeEvent();return;}
      if(nowMs<Number(this.lifeData().globalReadyAt||0))return;if(this.stateUntil&&t<this.stateUntil)return;if(!['idle','looking','sitting','resting'].includes(this.state))return;
      const choice=this.weightedLifePick(this.lifeEventCandidates());if(!choice)return;if(Math.random()>.62)return;this.startDailyLifeEvent(choice.type,choice.target,false);
    }
    scheduleReturnMoment(){
      clearTimeout(this.returnMomentTimer);this.returnMomentTimer=0;if(this.awayMs<4*60*1000)return;const rel=this.relationshipMemory(),nowMs=Date.now();if(rel.lastReturnAt&&nowMs-rel.lastReturnAt<4*60*1000)return;const band=this.returnBand(this.awayMs);this.returnMomentTimer=setTimeout(()=>{if(!this.el?.isConnected)return;const life=this.lifeData(),text=this.returnReactionText(band),tone=this.bond>=60?'happy':'';this.lifeEventNotice(text,tone);life.lastReturnAt=Date.now();life.lastMeaningfulMoment={type:'return-home',label:'Keeper came home',detail:text,at:Date.now()};this.noteKeeperRelationship('return',{band,label:'Keeper returned',detail:text});this.noteUniverseActivity('keeper:greeting');this.maybeShowDragonThought?.('return',{band,text,force:true});this.behaviourDirty=true;this.engine.saveBehaviourLocal?.();const eager=this.bond>=60||this.hasTrait('Affectionate')||this.hasTrait('Clingy')||this.hasTrait('Greeting Enthusiast')||this.hasTrait('Cuddlebug')||this.hasTrait('Shadow');if(eager||this.bond>=40&&Math.random()<.65)setTimeout(()=>this.startBondGreeting(),this.hasTrait('Shy')?1100:450);},1500);
    }

    initialiseSkills(raw={}){
      const out={};
      for(const key of DRAGON_SKILLS){
        const src=boundedObject(raw?.[key],{}),xp=Math.max(0,Number(src.xp??src.lifetimeXp)||0),level=skillLevelForXp(xp);
        out[key]={xp:+xp.toFixed(3),lifetimeXp:+Math.max(xp,Number(src.lifetimeXp)||0).toFixed(3),level:+level.toFixed(3),lastGainAt:Number(src.lastGainAt||0),activities:Math.max(0,Number(src.activities)||0),lastSource:String(src.lastSource||'').slice(0,80)};
      }
      return out;
    }
    migrateLegacySkillHistory(){
      if(this.memory.skillMigrationV3292)return;
      const obs=this.memory.observationCounters||{};
      const seed={
        flying:(Number(obs.flightsTaken)||0)*2.4,
        agility:(Number(obs.trainingUses)||0)*1.2+(Number(obs.climbUses)||0)*1.8+(Number(obs.zoomiesTriggered)||0)*.6+(Number(obs.stairsUsed)||0)*.2,
        strength:(Number(obs.trainingUses)||0)*.9+(Number(obs.climbUses)||0)*1.2+(Number(obs.digUses)||0)*1.4,
        fireControl:(Number(obs.firePracticeUses)||0)*4.0+(Number(obs.roarPracticeUses)||0)*.8,
        intelligence:(Number(obs.puzzleUses)||0)*4.0+(Number(obs.readingUses)||0)*2.2+(Number(obs.inspectionUses)||0)*.25,
        confidence:(Number(obs.newLocationsVisited)||0)*1.5+(Number(obs.flightsTaken)||0)*.7+(Number(obs.trainingUses)||0)*.35
      };
      for(const key of DRAGON_SKILLS){const skill=this.skills[key];if(skill.xp<=.001&&seed[key]>0){skill.xp=+Math.min(seed[key],skillXpForLevel(22)).toFixed(3);skill.lifetimeXp=skill.xp;skill.level=+skillLevelForXp(skill.xp).toFixed(3);skill.lastSource='Existing life experience';}}
      this.memory.skillMigrationV3292=Date.now();this.memory.skills=this.skills;this.behaviourDirty=true;
    }
    skillRank(key){return skillRankForLevel(this.skills?.[key]?.level||0);}
    skillProgress(key){
      const skill=this.skills?.[key]||{xp:0,level:0},rank=this.skillRank(key),next=nextSkillRankForLevel(skill.level);
      if(!next)return{rank:rank.name,next:null,percent:100};
      const fromXp=skillXpForLevel(rank.min),toXp=skillXpForLevel(next.min),span=Math.max(.001,toXp-fromXp),percent=clamp(((skill.xp-fromXp)/span)*100,0,100);
      return{rank:rank.name,next:next.name,nextAt:next.min,percent:+percent.toFixed(1)};
    }
    skillCooldownDurationMs(key){
      const level=Number(this.skills?.[key]?.level||0);let ms=SKILL_TRAINING_COOLDOWNS[0].ms;for(const tier of SKILL_TRAINING_COOLDOWNS){if(level>=tier.min)ms=tier.ms;else break;}return ms;
    }
    skillCooldownRemaining(key){const entry=boundedObject(this.memory.skillCooldowns?.[key],{});return Math.max(0,Number(entry.until||0)-Date.now());}
    skillCooldownStatus(key){
      const remaining=this.skillCooldownRemaining(key),total=this.skillCooldownDurationMs(key);return{ready:remaining<=0,remainingMs:remaining,totalMs:total,until:Date.now()+remaining,lastSource:String(this.memory.skillCooldowns?.[key]?.lastSource||'')};
    }
    armSkillCooldown(key,source='Training'){
      if(!DRAGON_SKILLS.includes(key))return;this.memory.skillCooldowns=this.memory.skillCooldowns||{};const nowMs=Date.now(),ms=this.skillCooldownDurationMs(key);this.memory.skillCooldowns[key]={until:nowMs+ms,lastAt:nowMs,lastSource:String(source||'Training').slice(0,80),durationMs:ms};this.behaviourDirty=true;
    }
    passiveSkillReady(token){return Date.now()>=Number(this.memory.skillPassiveCooldowns?.[token]||0);}
    gainPassiveSkill(key,amount,source,token,cooldownMs,context={}){
      if(!this.passiveSkillReady(token))return 0;const gained=this.gainSkill(key,amount,source,{...context,passive:true});if(gained>0){this.memory.skillPassiveCooldowns=this.memory.skillPassiveCooldowns||{};this.memory.skillPassiveCooldowns[token]=Date.now()+Math.max(1000,Number(cooldownMs)||0);this.behaviourDirty=true;}return gained;
    }
    learningModifier(skill,context={}){
      let mod=1;const s=this.coreStats||{},traits=this.assignedTraits||[];
      if(skill==='flying')mod+=(Number(this.personality?.flightLikelihood||.5)-.5)*.16+(pNum(s.bravery)-50)*.0012;
      if(skill==='agility')mod+=(pNum(s.energy)-50)*.0016+(pNum(s.playfulness)-50)*.0010;
      if(skill==='strength')mod+=(pNum(s.energy)-50)*.0015+(pNum(s.stubbornness)-50)*.0007;
      if(skill==='fireControl')mod+=(pNum(s.intelligence)-50)*.0010+(pNum(s.bravery)-50)*.0010;
      if(skill==='intelligence')mod+=(pNum(s.intelligence)-50)*.0017+(pNum(s.curiosity)-50)*.0010;
      if(skill==='confidence')mod+=(pNum(s.bravery)-50)*.0015+(pNum(s.curiosity)-50)*.0008;
      if((traits.includes('Little Athlete')||traits.includes('Natural Athlete'))&&(skill==='agility'||skill==='strength'))mod+=.10;
      if((traits.includes('Little Pilot')||traits.includes('Born Flyer'))&&skill==='flying')mod+=.11;
      if((traits.includes('Explorer')||traits.includes('Adventurous')||traits.includes('Fearless Explorer'))&&skill==='confidence')mod+=.08;
      if(traits.includes('Fearless')&&skill==='confidence')mod+=.07;
      if(traits.includes('Coward')&&skill==='confidence')mod+=context.challenge?.07:-.07;
      if(traits.includes('Couch Potato')&&(skill==='agility'||skill==='strength'))mod-=.10;
      if(traits.includes('Toy Obsessed')&&skill==='intelligence'&&context.puzzle)mod+=.07;
      if(traits.includes('Furniture Inspector')&&skill==='intelligence'&&context.investigate)mod+=.06;
      if(traits.includes('Food Goblin')&&skill==='intelligence'&&context.treatPuzzle)mod+=.05;
      return clamp(mod,.80,1.28);
    }
    gainSkill(key,amount,source='Life experience',context={}){
      if(!DRAGON_SKILLS.includes(key)||!(amount>0))return 0;
      const skill=this.skills[key],beforeLevel=skill.level,beforeRank=this.skillRank(key),mod=this.learningModifier(key,context),gain=Math.max(0,Number(amount)||0)*mod;
      if(gain<=0)return 0;
      skill.xp=+(skill.xp+gain).toFixed(3);skill.lifetimeXp=+(Math.max(skill.lifetimeXp,skill.xp)).toFixed(3);skill.level=+skillLevelForXp(skill.xp).toFixed(3);skill.lastGainAt=Date.now();skill.lastSource=String(source||'Life experience').slice(0,80);skill.activities=Math.max(0,Number(skill.activities)||0)+(context.activityComplete?1:0);this.memory.skills=this.skills;this.behaviourDirty=true;
      const afterRank=this.skillRank(key);if(afterRank.min>beforeRank.min){const milestoneKey=`skill-rank-${key}-${afterRank.min}`;if(!this.memory.skillMilestones[milestoneKey]){this.memory.skillMilestones[milestoneKey]=Date.now();this.rememberLifeEvent('skill',`${DRAGON_SKILL_LABELS[key]} reached ${afterRank.name}`,`${this.dragon?.name||'Your dragon'} has become ${afterRank.name.toLowerCase()} at ${DRAGON_SKILL_LABELS[key].toLowerCase()}.`,milestoneKey);window.dispatchEvent(new CustomEvent('dragonbound:skill-rank-up',{detail:{name:this.dragon?.name||'Your dragon',skill:key,label:DRAGON_SKILL_LABELS[key],rank:afterRank.name,level:Math.floor(skill.level)}}));}}
      if(beforeLevel<1&&skill.level>=1)this.rememberLifeEvent('skill',`Started learning ${DRAGON_SKILL_LABELS[key]}`,`The first little steps toward mastering ${DRAGON_SKILL_LABELS[key].toLowerCase()}.`,`skill-first-${key}`);
      for(const milestone of SKILL_MARK_MILESTONES){
        if(beforeLevel<milestone&&skill.level>=milestone){
          window.dispatchEvent(new CustomEvent('dragonbound:skill-reward-ready',{detail:{name:this.dragon?.name||'Your dragon',skill:key,label:DRAGON_SKILL_LABELS[key],milestone,reward:SKILL_MARK_REWARDS[milestone],level:skill.level}}));
        }
      }
      return gain;
    }
    growthInfo(){
      const hatched=Number(this.dragon?.hatchedAt)||Date.parse(String(this.dragon?.hatchedAt||''))||Date.now(),days=Math.max(0,(Date.now()-hatched)/86400000);let stage=GROWTH_STAGES[0],index=0;
      for(let i=0;i<GROWTH_STAGES.length;i++){if(days>=GROWTH_STAGES[i].minDays){stage=GROWTH_STAGES[i];index=i;}else break;}
      // The game currently only has baby-era art. Real age keeps counting, but the
      // visible/gameplay growth stage is capped at Growing Baby until the later art
      // set is deliberately enabled in a future release.
      index=Math.min(index,GROWTH_ART_STAGE_CAP);stage=GROWTH_STAGES[index];
      const care=this.careStats(),careAvg=(care.hunger+care.hygiene+care.energy+care.fun)/4,careNudge=clamp(((careAvg-50)/50)*3+(this.bond-50)/50*2,-2,5);const capped=index>=GROWTH_ART_STAGE_CAP,span=Number.isFinite(stage.maxDays)?Math.max(.001,stage.maxDays-stage.minDays):1,raw=capped&&days>=stage.maxDays?100:Number.isFinite(stage.maxDays)?((days-stage.minDays)/span)*100:100,progress=clamp(raw+careNudge,0,100),next=capped?null:(GROWTH_STAGES[index+1]||null);
      return{name:stage.name,index,days:+days.toFixed(2),progress:+progress.toFixed(1),next:next?.name||null,nextAtDays:next?.minDays??null,scale:stage.scale,move:stage.move,growthLocked:capped&&days>=stage.maxDays};
    }
    updateGrowthMemory(initial=false){
      const info=this.growthInfo(),previous=String(this.memory.growth?.stage||'');this.memory.growth={stage:info.name,index:info.index,lastCheckedAt:Date.now()};
      if(previous&&previous!==info.name&&!initial)this.rememberLifeEvent('growth',`Became a ${info.name}`,`${this.dragon?.name||'Your dragon'} has reached a new stage of growing up.`,`growth-${info.index}`);
      else if(previous&&previous!==info.name&&initial)this.rememberLifeEvent('growth',`Became a ${info.name}`,`${this.dragon?.name||'Your dragon'} has reached a new stage of growing up.`,`growth-${info.index}`);
      return info;
    }
    trainingFatigueFactor(meta={}){
      const id=String(meta.placementId||meta.itemId||'training'),entry=boundedObject(this.memory.skillFatigue?.[id],{}),elapsed=Date.now()-Number(entry.lastAt||0),streak=Math.max(0,Number(entry.streak)||0);
      if(!entry.lastAt||elapsed>45*60*1000)return 1;
      if(elapsed>25*60*1000)return .94;
      if(elapsed>10*60*1000)return Math.max(.76,.92-streak*.04);
      return Math.max(.45,1-streak*.16);
    }
    markTrainingFatigue(meta={}){
      const id=String(meta.placementId||meta.itemId||'training'),old=boundedObject(this.memory.skillFatigue?.[id],{}),elapsed=Date.now()-Number(old.lastAt||0),streak=elapsed<25*60*1000?Math.min(5,Math.max(0,Number(old.streak)||0)+1):1;this.memory.skillFatigue=this.memory.skillFatigue||{};this.memory.skillFatigue[id]={lastAt:Date.now(),streak};
      const fresh=Object.entries(this.memory.skillFatigue).sort((a,b)=>Number(b[1]?.lastAt||0)-Number(a[1]?.lastAt||0)).slice(0,12);this.memory.skillFatigue=Object.fromEntries(fresh);this.behaviourDirty=true;
    }
    furnitureSkillSources(meta={},kind=''){
      const tags=new Set(this.effectiveFurnitureTags(meta)),text=`${meta.name||''} ${meta.itemId||''} ${meta.category||''}`.toLowerCase(),out=[];const add=(skill,rate,context={})=>{const found=out.find(v=>v.skill===skill);if(found){found.rate=Math.max(found.rate,rate);Object.assign(found.context,context);}else out.push({skill,rate,context});};
      const recovery=/recovery|cool[ -]?down|restorative/.test(text),strength=/weight|dumbbell|resistance|sled|push|pull|strength|heavy|cable|lifting|power|punching bag/.test(text);
      const agility=tags.has('agility')||tags.has('climbable')||/agility|weave|balance|hurdle|landing target|sprint|climb|pegboard|roller|obstacle|jump|treadmill|exercise wheel|stretch ring/.test(text);
      const flight=tags.has('flight-practice')||/flight|flying|wing landing|launch perch|hover/.test(text);
      const fire=tags.has('fire-practice')||/fire[- ]?breath|flame practice|fire control|tiny flames|soot[- ]?proof practice dummy/.test(text);
      const puzzle=tags.has('puzzle')||/puzzle|sorting|memory game|navigation table|logic|maze|reaction console|rune learning|learning board/.test(text);
      const reading=tags.has('reading')||/book|reading|scribe|study/.test(text);
      if(flight){add('flying',.42,{challenge:true});add('agility',.12,{challenge:true});}
      if(fire)add('fireControl',.48,{challenge:true});
      if(strength)add('strength',.44,{challenge:true});
      if(agility){add('agility',strength?.24:.42,{challenge:true});if(tags.has('climbable'))add('strength',strength?.44:.16,{challenge:true});}
      if(kind==='dig'||tags.has('diggable')){add('strength',.18,{challenge:true});add('intelligence',.10,{investigate:true});}
      if(puzzle){add('intelligence',.40,{puzzle:true,treatPuzzle:tags.has('food')});if(/reaction console/.test(text))add('agility',.18,{challenge:true});}
      else if(reading)add('intelligence',.25,{investigate:true});
      if(/dragon stretching mat/.test(text)&&!recovery)add('agility',.08,{challenge:false});
      else if(kind==='read')add('intelligence',.24,{investigate:true});
      else if(kind==='inspect'&&tags.has('inspectable'))add('intelligence',.045,{investigate:true});
      if(kind==='roar')add('confidence',.12,{challenge:true});
      if(/navigation|celestial|map table/.test(text))add('confidence',.03,{challenge:true});
      if((tags.has('noisy')||flight||fire||strength||agility)&&!tags.has('sleepable'))add('confidence',.055,{challenge:true});
      if(!recovery&&(tags.has('training')||tags.has('exercise'))&&!out.length){add('agility',.16,{challenge:true});add('strength',.13,{challenge:true});}
      return out;
    }
    trainingDurationFor(meta={},kind='',fallback=12000){
      const sources=this.furnitureSkillSources(meta,kind);if(!sources.length||Math.max(...sources.map(v=>Number(v.rate)||0))<.12)return fallback;const skills=new Set(sources.map(v=>v.skill));let min=10,max=22;
      if(skills.has('strength')){min=14;max=25;}else if(skills.has('agility')){min=12;max=25;}else if(skills.has('flying')){min=12;max=25;}else if(skills.has('intelligence')){min=14;max=25;}else if(skills.has('fireControl')){min=10;max=22;}else return fallback;
      let mult=1;if(this.hasTrait('Stubborn')||this.stat('stubbornness')>72)mult+=.08;if(this.hasTrait('Impatient'))mult-=.12;if(this.hasTrait('Little Athlete')&&(skills.has('agility')||skills.has('strength')))mult+=.10;if(this.hasTrait('Couch Potato')&&(skills.has('agility')||skills.has('strength')))mult-=.08;return rand(min*1000,max*1000)*clamp(mult,.78,1.22);
    }
    startSkillTraining(durationMs,meta={},kind=''){
      const sources=this.furnitureSkillSources(meta,kind);if(!sources.length){this.skillTrainingPlan=null;return null;}
      const durationSec=Math.max(1,Number(durationMs||0)/1000),fatigue=this.trainingFatigueFactor(meta),nowMs=Date.now();
      // Eligibility is captured once at the start of a real session so XP can still
      // rise gradually throughout that session. A different furnishing cannot reset it.
      const gatedSources=sources.map(src=>({...src,eligible:this.skillCooldownRemaining(src.skill)<=0,cooldownAtStart:this.skillCooldownRemaining(src.skill)}));
      this.skillTrainingPlan={durationSec,elapsedSec:0,meta:{placementId:meta.placementId,itemId:meta.itemId,name:meta.name},kind,sources:gatedSources,fatigue,gains:{},startedAt:nowMs};this.skillSessionGain={};this.markTrainingFatigue(meta);return this.skillTrainingPlan;
    }
    applySkillTraining(dt){
      const plan=this.skillTrainingPlan;if(!plan||!String(this.state).startsWith('furniture'))return;
      if(this.physicalInteraction&&this.physicalInteraction.elapsedSec<this.physicalInteraction.settleSec)return;
      const remaining=Math.max(0,plan.durationSec-plan.elapsedSec),step=Math.min(Math.max(0,Number(dt)||0),remaining);if(step<=0)return;
      for(const src of plan.sources){if(!src.eligible)continue;const raw=src.rate*step*plan.fatigue,gained=this.gainSkill(src.skill,raw,plan.meta.name||'Training',src.context||{});plan.gains[src.skill]=(Number(plan.gains[src.skill])||0)+gained;this.skillSessionGain[src.skill]=(Number(this.skillSessionGain[src.skill])||0)+gained;}
      plan.elapsedSec+=step;
    }
    finishSkillTraining(){
      const plan=this.skillTrainingPlan;if(!plan)return;const gains=Object.entries(plan.gains||{}).filter(([,v])=>Number(v)>.08);for(const [key] of gains){if(this.skills[key])this.skills[key].activities=Math.max(0,Number(this.skills[key].activities)||0)+1;this.armSkillCooldown(key,plan.meta?.name||'Training');}
      if(gains.length){const total=gains.reduce((s,[,v])=>s+Number(v||0),0);window.dispatchEvent(new CustomEvent('dragonbound:skill-session-finished',{detail:{name:this.dragon?.name||'Your dragon',source:plan.meta?.name||'Training',gains:Object.fromEntries(gains),fatigue:plan.fatigue,completed:plan.elapsedSec>=plan.durationSec-.15,total,cooldowns:Object.fromEntries(gains.map(([key])=>[key,this.skillCooldownDurationMs(key)]))}}));}
      this.skillTrainingPlan=null;this.skillSessionGain={};this.behaviourDirty=true;
    }
    updatePassiveSkills(dt){
      const seconds=Math.max(0,Number(dt)||0);if(!seconds)return;
      // Passive movement is intentionally tiny and independently gated. It cannot be
      // spammed by repeatedly triggering flight/zoomies between training cooldowns.
      if(this.state==='flying'){
        if(this.passiveSkillReady('indoor-flight-flying'))this.gainPassiveSkill('flying',.12,'Indoor flight','indoor-flight-flying',PASSIVE_SKILL_COOLDOWNS.indoorFlight,{challenge:false});
        if(this.passiveSkillReady('indoor-flight-confidence'))this.gainPassiveSkill('confidence',.03,'Indoor flight','indoor-flight-confidence',PASSIVE_SKILL_COOLDOWNS.indoorFlight,{challenge:true});
      }else if(this.pendingMoveMode==='zoomies'&&this.state==='walking'&&this.passiveSkillReady('zoomies-agility'))this.gainPassiveSkill('agility',.035,'Zoomies','zoomies-agility',PASSIVE_SKILL_COOLDOWNS.zoomies,{challenge:false});
    }
    recentPenalty(action){const recent=this.memory.recentActions||[];let n=0;for(let i=Math.max(0,recent.length-5);i<recent.length;i++)if(recent[i]===action)n++;return n*(n>=2?17:9);}

applyOfflineNeedsCatchup(){
  const savedAt=Date.parse(String(this.memory?.lastSavedAt||''));if(!Number.isFinite(savedAt))return;
  // V32.89: daily care should matter, but Dragonbound must never become a chore.
  // Up to 42 hours away can affect needs; after that they effectively wait for you.
  // Offline catch-up also keeps every care bar above 8%, so nothing catastrophic happens.
  const elapsedHours=clamp((Date.now()-savedAt)/3600000,0,42);if(elapsedHours<.05)return;
  // The first 18 hours count normally, then decay slows to 35% while you are away.
  // This makes a daily check-in meaningful without making a two-day absence brutal.
  const hours=Math.min(18,elapsedHours)+Math.max(0,elapsedHours-18)*.35;
  const rates=this.naturalNeedRates(),capInternal=88;
  this.needs.rest=clamp(this.needs.rest+hours*rates.rest,0,capInternal);
  this.needs.hunger=clamp(this.needs.hunger+hours*rates.hunger,0,capInternal);
  this.needs.stimulation=clamp(this.needs.stimulation+hours*rates.stimulation,0,capInternal);
  this.needs.social=clamp(this.needs.social+hours*rates.social,0,capInternal);
  this.needs.hygiene=clamp(this.needs.hygiene+hours*rates.hygiene,0,capInternal);
  this.needs.comfort=clamp(this.needs.comfort+hours*rates.comfort,0,capInternal);
  // Neglect can very gently soften the relationship, but it is deliberately tiny.
  // Even returning to a very grumpy dragon after a long absence costs only a little bond.
  const care=this.careStats(),avg=(care.hunger+care.hygiene+care.energy+care.fun)/4;
  if(avg<38){
    const severity=clamp((38-avg)/30,0,1),loss=Math.min(1.5,elapsedHours*.035*severity);
    if(loss>.01){this.bond=clamp(this.bond-loss,0,100);this.memory.bond=this.bond;}
  }
}
naturalNeedRates(){
  const sl=this.stat('sleepiness'),ap=this.stat('appetite'),pl=this.stat('playfulness'),af=this.stat('affection');
  const security=1-Math.min(.46,this.bond/220),m=NEED_DECAY_MULTIPLIER;
  // V32.98: exact 3x V32.97 decay. This makes the care loop noticeably active:
  // while the house is open the dragon will naturally start solving a need once its
  // visible bar reaches the 30-40% Sims-style trigger zone. Offline, care can become
  // low much sooner but still respects the existing safe floor and gentle penalties.
  return {
    rest:(2.35+sl*.0065)*m,
    hunger:(2.70+ap*.0081)*m,
    stimulation:(2.35+pl*.0070)*m,
    social:((.90+af*.0039)*security)*m,
    hygiene:1.60*m,
    comfort:.55*m
  };
}
careStats(){
  return {hunger:Math.round(100-this.needs.hunger),hygiene:Math.round(100-this.needs.hygiene),energy:Math.round(100-this.needs.rest),fun:Math.round(100-this.needs.stimulation),bond:Math.round(this.bond)};
}
moodSummary(){
  const c=this.careStats(),n=this.needs,s=this.state||'';
  const lows=[['Hungry',c.hunger],['Scruffy',c.hygiene],['Sleepy',c.energy],['Bored',c.fun]].sort((a,b)=>a[1]-b[1]);
  const avg=(c.hunger+c.hygiene+c.energy+c.fun)/4,lowCount=[c.hunger,c.hygiene,c.energy,c.fun].filter(v=>v<34).length;
  if(lows[0][1]<=12)return lows[0][0];
  if(lowCount>=2&&avg<42)return'Grumpy';
  if(n.social>=88)return'Sulking';
  if(c.fun<28&&c.energy>45)return'Restless';
  if(this.el?.classList?.contains('is-treat-excited')||s==='zoomies')return'Excited';
  if(['furnitureSleep','furnitureRest','furnitureWarm','sleeping','resting'].includes(s)&&c.energy>=62)return'Cosy';
  if(['furniturePlay','furnitureExercise','furnitureRoar','furnitureFire'].includes(s))return s==='furnitureExercise'?'Proud':'Playful';
  if(s==='looking'||s==='explore'||s==='walking')return'Curious';
  if(avg>=90)return'Thriving';
  if(avg>=78)return'Content';
  if(avg>=62)return'Okay';
  return'Grumpy';
}
normaliseDailyMood(raw={}){
  const src=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{},name=String(src.name||'').trim(),story=String(src.story||'').trim().slice(0,280),startedAt=Date.parse(String(src.startedAt||'')),expiresAt=Date.parse(String(src.expiresAt||''));
  if(!name)return{};return{version:Number(src.version||1),name,story,reason:String(src.reason||'').slice(0,32),startedAt:Number.isFinite(startedAt)?startedAt:0,expiresAt:Number.isFinite(expiresAt)?expiresAt:0};
}
dailyMoodActive(){const m=this.dailyMood||{};return !!m.name&&(!Number(m.expiresAt)||Number(m.expiresAt)>Date.now());}
currentMoodName(){return this.dailyMoodActive()?String(this.dailyMood.name||''):'';}
currentMoodStory(){return this.dailyMoodActive()?String(this.dailyMood.story||''):'';}
setDailyMood(raw={},options={}){
  const before=this.currentMoodName(),next=this.normaliseDailyMood(raw);this.dailyMood=next;this.dragon.mood=next;
  const after=this.currentMoodName();if(after!==before){this.nextDecision=0;this.engine.updateNeedsHud(true);if(after==='Cuddly')this.scheduleBondGreeting();if(options.announce!==false&&after)setTimeout(()=>this.maybeShowDragonThought?.('mood',{mood:after,force:true}),450);}
  return next;
}
dailyMoodActionBias(action=''){const mood=this.currentMoodName();return Number(DRAGON_DAILY_MOOD_ACTION_BIAS[mood]?.[action]||0);}
dailyMoodFurnitureBias(tags=new Set(),meta={}){
  const mood=this.currentMoodName();if(!mood)return 0;const t=tags instanceof Set?tags:new Set(tags||[]),has=(...names)=>names.some(n=>t.has(n));let score=0;
  if(mood==='Bouncy'&&has('playable','exercise','training','agility','climbable'))score+=10;
  if(mood==='Sleepy'&&has('sleepable','restable','comfortable','warm'))score+=14;
  if(mood==='Cuddly'&&has('comfortable','restable','perchable'))score+=6;
  if(mood==='Curious'&&(has('inspectable','reading','window','mirror','sniffable')||meta?.isNew))score+=meta?.isNew?14:9;
  if(mood==='Grumpy'){if(has('hideable','comfortable','restable'))score+=8;if(has('noisy'))score-=6;}
  if(mood==='Focused'&&has('training','exercise','agility','flight-practice','fire-practice','roarable','puzzle'))score+=14;
  if(mood==='Hungry'&&has('food','drink','hydration'))score+=18;
  if(mood==='Playful'&&has('playable','puzzle','tug','chewable','scratchable','diggable'))score+=14;
  if(mood==='Nervous'){if(has('hideable','comfortable','restable'))score+=11;if(meta?.isNew)score-=8;if(has('noisy'))score-=8;}
  if(mood==='Proud'&&has('training','exercise','perchable','mirror'))score+=7;
  if(mood==='Relaxed'&&has('restable','comfortable','warm','window','perchable'))score+=11;
  if(mood==='Restless'&&has('playable','exercise','training','climbable','scratchable','diggable'))score+=9;
  return score;
}
normaliseDailyPreferences(raw={}){
  const src=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{},parseTime=value=>{const n=Number(value);if(Number.isFinite(n)&&n>1000000000000)return n;const p=Date.parse(String(value||''));return Number.isFinite(p)?p:0;},nowMs=Date.now();
  const preferences=(Array.isArray(src.preferences)?src.preferences:[]).map(row=>({id:String(row?.id||''),type:String(row?.type||''),label:String(row?.label||'').slice(0,64),story:String(row?.story||'').slice(0,360),targetPlacementId:String(row?.targetPlacementId||''),targetItemId:String(row?.targetItemId||''),targetName:String(row?.targetName||'').slice(0,90),generatedAt:parseTime(row?.generatedAt),expiresAt:parseTime(row?.expiresAt)})).filter(row=>row.id&&row.type&&(!row.expiresAt||row.expiresAt>nowMs));
  const nextChangeAt=parseTime(src.nextChangeAt)||preferences.map(v=>v.expiresAt).filter(Boolean).sort((a,b)=>a-b)[0]||0;
  return{version:Number(src.version||1),preferences,nextChangeAt};
}
activeDailyPreferences(){
  const nowMs=Date.now(),state=this.dailyPreferencesState||{};return(Array.isArray(state.preferences)?state.preferences:[]).filter(p=>p?.type&&(!Number(p.expiresAt)||Number(p.expiresAt)>nowMs));
}
hasDailyPreference(...types){const set=new Set(types.flat().map(String));return this.activeDailyPreferences().some(p=>set.has(String(p.type||'')));}
setDailyPreferences(raw={},options={}){
  const before=(this.dailyPreferencesState?.preferences||[]).map(v=>v.id).join('|'),next=this.normaliseDailyPreferences(raw),after=next.preferences.map(v=>v.id).join('|');this.dailyPreferencesState=next;this.dragon.dailyPreferences=next;
  if(after!==before){this.nextDecision=0;if(this.hasDailyPreference('attention_day','shadowing','cuddle_day'))this.scheduleBondGreeting();if(options.announce!==false&&next.preferences.length)setTimeout(()=>this.maybeShowDragonThought?.('preference',{preference:choose(next.preferences),force:true}),520);}
  return next;
}
dailyPreferenceActionBias(action=''){
  let total=0;for(const pref of this.activeDailyPreferences()){const points=DRAGON_DAILY_PREFERENCE_ACTION_BIAS[pref.type]?.[action];if(Number.isFinite(Number(points)))total+=Number(points);}return clamp(total,-24,28);
}
dailyPreferenceTargetName(pref={}){
  if(!pref)return'';const id=String(pref.targetPlacementId||'');if(id){const live=getFurnitureInteractions().find(meta=>String(meta?.placementId||'')===id);if(live?.name){pref.targetName=String(live.name).slice(0,90);return pref.targetName;}}return String(pref.targetName||'').slice(0,90);
}
dailyPreferenceForFurniture(meta={},kind=''){
  const id=String(meta?.placementId||''),t=new Set(this.effectiveFurnitureTags(meta)),k=kind||this.furnitureKind(meta);let best=null,bestScore=-Infinity;
  for(const pref of this.activeDailyPreferences()){
    let score=0;if(pref.targetPlacementId&&String(pref.targetPlacementId)===id)score+=100;
    if(pref.type==='toy_obsession'&&['play','puzzle','scratch','dig'].includes(k))score+=30;
    if(pref.type==='favourite_corner'&&['sleep','rest','perch','warm','hide'].includes(k))score+=25;
    if(pref.type==='new_furniture_interest'&&meta?.isNew)score+=20;
    if(pref.type==='window_watcher'&&(k==='watch'||k==='perch'||t.has('window')))score+=15;
    if(pref.type==='training_kick'&&['exercise','climb','roar','fire'].includes(k))score+=12;
    if(pref.type==='snacky'&&['eat','drink','puzzle'].includes(k))score+=12;
    if(score>bestScore){bestScore=score;best=pref;}
  }
  return bestScore>0?best:null;
}
dailyPreferenceFurnitureBias(tags=[],meta={}){
  const t=tags instanceof Set?tags:new Set(tags||[]),kind=this.furnitureKind({...meta,tags:[...t]}),id=String(meta?.placementId||''),careNeed=this.carePriorityNeed(),urgentHere=!!(careNeed&&this.furnitureSupportsCare(meta,careNeed.need));let score=0;
  for(const pref of this.activeDailyPreferences()){
    const exact=!!(id&&pref.targetPlacementId&&String(pref.targetPlacementId)===id);
    switch(pref.type){
      case'nap_day':if(['sleep','rest','warm','perch'].includes(kind)||t.has('comfortable'))score+=18;break;
      case'comfort_seeker':if(['sleep','rest','warm','perch','hide'].includes(kind)||t.has('comfortable'))score+=15;break;
      case'favourite_corner':if(exact)score+=30;else if(['sleep','rest','perch','warm','hide'].includes(kind))score+=5;break;
      case'toy_obsession':if(exact)score+=40;else if(['play','puzzle','scratch','dig'].includes(kind))score+=8;break;
      case'playful_day':if(['play','puzzle','scratch','dig'].includes(kind))score+=15;break;
      case'puzzle_mood':if(kind==='puzzle'||t.has('puzzle')||t.has('reading'))score+=18;break;
      case'training_kick':if(['exercise','climb','roar','fire'].includes(kind)||t.has('training')||t.has('agility'))score+=18;break;
      case'race_itch':if(['exercise','climb','roar','fire'].includes(kind)||t.has('training')||t.has('flight-practice'))score+=16;break;
      case'focused_practice':if(['exercise','climb','roar','fire','puzzle'].includes(kind)||t.has('training'))score+=17;break;
      case'attention_day':if(['rest','perch','warm'].includes(kind)||t.has('comfortable'))score+=4;break;
      case'cuddle_day':if(['sleep','rest','perch','warm'].includes(kind)||t.has('comfortable'))score+=7;break;
      case'snacky':if(['eat','drink','puzzle'].includes(kind)||t.has('food'))score+=16;break;
      case'treat_hopeful':if(['eat','puzzle'].includes(kind)||t.has('food'))score+=7;break;
      case'bath_lover':if(['wash','sandbath','groom'].includes(kind))score+=18;break;
      case'sand_bath_day':if(kind==='sandbath'||t.has('sandbath'))score+=23;break;
      case'avoiding_bath':if(!urgentHere&&['wash','sandbath','groom'].includes(kind))score-=18;break;
      case'explorer':if(meta?.isNew)score+=18;else if(Number(meta?.timesUsed||0)<=1)score+=10;else if(['inspect','watch','read','mirror','sniff','climb'].includes(kind))score+=6;break;
      case'window_watcher':if(kind==='watch'||kind==='perch'||t.has('window'))score+=22;break;
      case'furniture_inspector':if(meta?.isNew)score+=22;else if(['inspect','watch','read','mirror','sniff'].includes(kind)||t.has('inspectable'))score+=13;break;
      case'hideaway':if(kind==='hide'||t.has('hideable'))score+=20;else if(['rest','sleep'].includes(kind))score+=5;break;
      case'object_fixation':if(exact)score+=44;break;
      case'new_furniture_interest':if(exact)score+=36;else if(meta?.isNew)score+=12;break;
      case'object_avoidance':if(exact&&!urgentHere)score-=36;break;
    }
  }
  return clamp(score,-40,50);
}
dailyPreferenceSummary(){const active=this.activeDailyPreferences();return{version:Number(this.dailyPreferencesState?.version||1),preferences:active.map(p=>({...p,targetName:this.dailyPreferenceTargetName(p)})),nextChangeAt:Number(this.dailyPreferencesState?.nextChangeAt||0)};}
traitDiscoverySlots(max=4){
  if(this.signatureTraits?.length)return this.signatureTraits.slice(0,max).map(label=>({label,revealed:true,signature:true}));
  const universe=this.personalityUniverse||this.ensurePersonalityUniverse(),assigned=[...new Set([...(this.assignedTraits||[]),...(universe.innateTraits||[]),...(universe.secondaryTraits||[])])].filter(Boolean),discoveredSet=new Set([...(this.discoveredTraits||[]),...(universe.discoveredTraits||[])].filter(Boolean));
  const visible=[];
  for(const trait of assigned){if(discoveredSet.has(trait))visible.push({label:trait,revealed:true});}
  const slotTarget=Math.min(max,Math.max(3,assigned.length||0));
  for(let i=visible.length;i<slotTarget;i++)visible.push({label:'???',revealed:false});
  return visible.slice(0,max);
}
mostUsedActivity(){
  const counts=this.memory?.activityCounts||{};
  const labels={walking:'wandering',explore:'exploring',furniture:'using furniture',resting:'resting',sleeping:'sleeping',looking:'watching',zoomies:'zoomies',stairs:'stair roaming',flight:'flying'};
  const top=Object.entries(counts).sort((a,b)=>Number(b[1]||0)-Number(a[1]||0))[0];
  if(!top||!Number(top[1]))return'';
  return labels[top[0]]||top[0];
}
favouriteSleepSummary(){
  const fav=this.preferences?.formed?.favouriteSleepSpot;
  if(!fav)return'';
  const floor=fav.floorId==='upstairs'?'Upstairs':'Downstairs';
  return `${floor} sleeper`;
}
profileSummary(){
  const formed=this.preferences?.formed||{},furniture=formed.favouriteFurniture?.name||'',sleep=this.favouriteSleepSummary(),activity=this.mostUsedActivity(),floor=this.preferences?.preferredFloor==='upstairs'?'Upstairs':'Downstairs';
  let favourite='Still choosing favourite furnishings.';
  if(furniture&&sleep)favourite=`Favourite furniture: ${furniture} · ${sleep}`;
  else if(furniture)favourite=`Favourite furniture: ${furniture}`;
  else if(sleep)favourite=`Favourite routine: ${sleep}`;
  let routine=`Usually prefers the ${floor.toLowerCase()} floor.`;
  if(activity)routine=`Most often found ${activity} · usually prefers the ${floor.toLowerCase()} floor.`;
  return{favourite,routine,signatureTraits:[...(this.signatureTraits||[])]};
}
bondStage(value=this.bond){
  const v=clamp(Number(value)||0,0,100);let stage=BOND_STAGES[0];for(const candidate of BOND_STAGES){if(v>=candidate.min)stage=candidate;else break;}return stage;
}
nextBondStage(value=this.bond){const v=clamp(Number(value)||0,0,100);return BOND_STAGES.find(stage=>stage.min>v)||null;}
bondRelationship(){
  const current=this.bondStage(),next=this.nextBondStage(),fav=this.preferences?.formed?.favouriteFurniture?.name||'',keeper=this.keeperRelationshipSummary();
  return {level:Math.max(1,Math.round(this.bond)),name:current.name,note:current.note,next,nextAt:next?.min||100,favouriteFurniture:fav,description:keeper.description,greetingStyle:keeper.greetingStyle,sharedActivity:keeper.favouriteSharedActivity};
}
relationshipMemory(){
  const rel=boundedObject(this.memory.keeperRelationshipV3405,{});rel.version=1;rel.sharedActivities=boundedObject(rel.sharedActivities,{});rel.visitPeriods=boundedObject(rel.visitPeriods,{});rel.recentMoments=Array.isArray(rel.recentMoments)?rel.recentMoments.filter(v=>v&&typeof v==='object').slice(-12):[];this.memory.keeperRelationshipV3405=rel;return rel;
}
keeperVisitPeriod(){const h=new Date().getHours();return h>=5&&h<11?'morning':h>=11&&h<17?'day':h>=17&&h<22?'evening':'night';}
keeperSharedActivityLabel(key=''){
  return ({pet:'Quiet affection',treat:'Dragon Bites',command:'Commands & tricks',training:'Training together',checkin:'Keeping each other company',rest:'Resting nearby',play:'Playing together',care:'Care time',race:'Racing together'}[String(key||'')]||'Spending time together');
}
noteKeeperRelationship(kind='',meta={}){
  const rel=this.relationshipMemory(),nowMs=Date.now(),k=String(kind||'moment'),period=this.keeperVisitPeriod(),periodKey=String(period||'day'),visitBucket=Math.floor(nowMs/1800000);
  if(Number(rel.lastVisitBucket||0)!==visitBucket){rel.visitPeriods[periodKey]=(Number(rel.visitPeriods[periodKey])||0)+1;rel.lastVisitBucket=visitBucket;}
  const inc=name=>{rel[name]=Math.max(0,Number(rel[name])||0)+1;};
  if(k==='pet'){inc('pets');rel.sharedActivities.pet=(Number(rel.sharedActivities.pet)||0)+1;}
  else if(k==='treat'){inc('treats');rel.sharedActivities.treat=(Number(rel.sharedActivities.treat)||0)+1;}
  else if(k==='command'){inc('commands');rel.sharedActivities.command=(Number(rel.sharedActivities.command)||0)+1;}
  else if(k==='guided-activity'){inc('guidedActivities');const activity=['exercise','climb','roar','fire','puzzle'].includes(String(meta.kind||''))?'training':['play','scratch','dig'].includes(String(meta.kind||''))?'play':'care';rel.sharedActivities[activity]=(Number(rel.sharedActivities[activity])||0)+1;}
  else if(k==='greeting'){inc('greetings');rel.sharedActivities.checkin=(Number(rel.sharedActivities.checkin)||0)+.5;}
  else if(k==='checkin'){inc('checkIns');rel.sharedActivities.checkin=(Number(rel.sharedActivities.checkin)||0)+1;}
  else if(k==='nearby-rest'){inc('nearbyRests');rel.sharedActivities.rest=(Number(rel.sharedActivities.rest)||0)+1;}
  else if(k==='race'){rel.sharedActivities.race=(Number(rel.sharedActivities.race)||0)+1;}
  else if(k==='return'){inc('returnCount');rel.lastReturnAt=nowMs;rel.lastReturnBand=String(meta.band||'');}
  const momentLabel=String(meta.label||({pet:'Petting',treat:'Dragon Bites',command:'A keeper cue','guided-activity':'Shared activity',greeting:'Greeting',checkin:'Keeper check-in','nearby-rest':'Resting nearby',return:'Keeper returned',race:'Race day'}[k]||'Time together')).slice(0,80);
  if(!meta.silent&&['return','pet','treat','guided-activity','checkin','nearby-rest','race'].includes(k))rel.recentMoments=[...rel.recentMoments,{type:k,label:momentLabel,detail:String(meta.detail||'').slice(0,120),at:nowMs}].slice(-12);
  const top=Object.entries(rel.sharedActivities).filter(([,v])=>Number(v)>0).sort((a,b)=>Number(b[1])-Number(a[1]))[0];rel.favouriteSharedActivity=top?.[0]||String(rel.favouriteSharedActivity||'');rel.lastInteractionAt=nowMs;this.memory.keeperRelationshipV3405=rel;this.behaviourDirty=true;return rel;
}
keeperGreetingStyle(){
  const high=this.bond>=70;
  if(this.hasTrait('Food Obsessed')||this.hasTrait('Food Goblin')||this.hasTrait('Treat Obsessed')||this.hasTrait('Greedy'))return high?'Comes over, then immediately checks whether your return means snacks':'Notices you — and checks the food situation';
  if(this.hasTrait('Affectionate')||this.hasTrait('Clingy')||this.hasTrait('Cuddlebug')||this.hasTrait('Shadow'))return high?'Runs over and wants to stay close':'Brightens up and comes closer';
  if(this.hasTrait('Shy')||this.hasTrait('Nervous'))return high?'Watches first, then quietly comes closer':'Watches from somewhere familiar before deciding';
  if(this.hasTrait('Independent')||this.hasTrait('Independent Friend'))return high?'Acknowledges you warmly, then carries on on their own terms':'Looks up, checks it is you, then keeps doing their own thing';
  if(this.hasTrait('Lazy')||this.hasTrait('Couch Potato'))return'Greets you without wasting perfectly good lounging energy';
  if(this.hasTrait('Energetic')||this.hasTrait('Hyper')||this.hasTrait('Easily Excited'))return'Fast, excited and not remotely subtle';
  if(this.hasTrait('Playful')||this.hasTrait('Toy Obsessed'))return'Turns seeing you into an excuse to play';
  if(this.hasTrait('Stubborn'))return high?'Pretends not to care for a moment, then checks in anyway':'Makes you earn the acknowledgement';
  if(this.hasTrait('Calm')||this.hasTrait('Quiet Companion'))return'A slow, gentle acknowledgement rather than a dramatic greeting';
  return high?'Comes over when you return and settles nearby':'Notices you and is gradually becoming more confident';
}
keeperRelationshipDescription(){
  const stage=this.bondStage(),name=this.dragon?.name||'Your dragon';
  if(this.bond<20)return`${name} is still learning your routines and deciding what kind of keeper you are.`;
  if(this.bond<40)return`${name} recognises you now and is beginning to treat your presence as part of home.`;
  if(this.hasTrait('Independent')||this.hasTrait('Independent Friend'))return this.bond>=80?`${name} trusts you deeply, but still chooses when and how to show affection.`:`${name} trusts you more each day while keeping a strong independent streak.`;
  if(this.hasTrait('Shy')||this.hasTrait('Nervous'))return this.bond>=80?`${name} trusts you enough to come close without losing that naturally cautious nature.`:`${name} is cautious by nature, but increasingly chooses to stay where they can see you.`;
  if(this.hasTrait('Affectionate')||this.hasTrait('Clingy')||this.hasTrait('Cuddlebug'))return this.bond>=80?`${name} trusts you completely and regularly seeks out your company and affection.`:`${name} is becoming openly attached and often looks for reassurance from you.`;
  if(this.hasTrait('Lazy')||this.hasTrait('Couch Potato'))return`${name} is very comfortable with you — enough to greet you without necessarily getting out of bed.`;
  if(this.hasTrait('Food Obsessed')||this.hasTrait('Food Goblin')||this.hasTrait('Treat Obsessed'))return`${name} trusts you, likes your company, and has also learned that keepers are suspiciously good sources of snacks.`;
  if(this.hasTrait('Playful')||this.hasTrait('Toy Obsessed'))return`${name} increasingly treats you as part of playtime rather than merely the person who lives here.`;
  if(this.bond>=95)return`${name} trusts you completely. The bond is unmistakable, but they still show it in their own way.`;
  if(this.bond>=80)return`${name} treats you as a close companion and naturally checks where you are during the day.`;
  if(this.bond>=60)return`${name} feels safe with you and is comfortable choosing to stay nearby.`;
  return`${name} trusts your routines and has started seeking you out without being asked.`;
}
keeperRelationshipSummary(){
  const rel=this.relationshipMemory(),stage=this.bondStage(),top=String(rel.favouriteSharedActivity||''),period=Object.entries(rel.visitPeriods||{}).sort((a,b)=>Number(b[1]||0)-Number(a[1]||0))[0]?.[0]||'',last=(rel.recentMoments||[]).slice(-1)[0]||{};
  return{version:1,bond:+this.bond.toFixed(2),stage:stage.name,note:stage.note,description:this.keeperRelationshipDescription(),greetingStyle:this.keeperGreetingStyle(),favouriteSharedActivity:top?this.keeperSharedActivityLabel(top):'Still forming',favouriteSharedActivityKey:top,usualVisit:period?period[0].toUpperCase()+period.slice(1):'Still learning',greetings:Number(rel.greetings||0),checkIns:Number(rel.checkIns||0),nearbyRests:Number(rel.nearbyRests||0),pets:Number(rel.pets||0),treats:Number(rel.treats||0),commands:Number(rel.commands||0),returns:Number(rel.returnCount||0),lastReturnAt:Number(rel.lastReturnAt||0),lastReturnBand:String(rel.lastReturnBand||''),recentMoment:last};
}
returnBand(ms=this.awayMs){const n=Math.max(0,Number(ms)||0);if(n<15*60*1000)return'quick';if(n<3*60*60*1000)return'short';if(n<18*60*60*1000)return'hours';if(n<3*24*60*60*1000)return'next-day';return'long';}
returnReactionText(band=this.returnBand()){
  if(this.hasTrait('Food Obsessed')||this.hasTrait('Food Goblin')||this.hasTrait('Treat Obsessed')||this.hasTrait('Greedy'))return band==='quick'?'Back already... with snacks?':'You are back. Did you bring treats?';
  if(this.hasTrait('Lazy')||this.hasTrait('Couch Potato'))return band==='long'?'It has been a while. I saved the comfy spot.':'You came back. I am still comfy.';
  if(this.hasTrait('Independent')||this.hasTrait('Independent Friend'))return band==='long'?'It has been a while. Good to see you.':'Oh, you are back.';
  if(this.hasTrait('Shy')||this.hasTrait('Nervous'))return this.bond>=60?(band==='quick'?'You are back already?':'...there you are'):'Watches carefully until they realise it is you';
  if(this.hasTrait('Stubborn'))return band==='quick'?'Back already? I was busy.':'Pretends not to care... then keeps checking that you are still here';
  if(this.hasTrait('Playful')||this.hasTrait('Toy Obsessed'))return band==='quick'?'That was quick! Play?':band==='long'?'It has been a while — play time?':'There you are! Play?';
  if(this.hasTrait('Affectionate')||this.hasTrait('Clingy')||this.hasTrait('Cuddlebug')||this.hasTrait('Shadow'))return band==='quick'?'You are back already!':band==='long'?'It has been a while... there you are!':'There you are!';
  if(band==='quick')return'You are back already?';if(band==='short')return'Oh — there you are.';if(band==='hours')return'There you are!';if(band==='next-day')return'Good to see you again.';return'It has been a while... good to see you.';
}
keeperAnchorPoint(){
  try{const provided=window.DragonboundKeeperPosition?.();if(provided&&(!provided.floorId||provided.floorId===this.floorId)){const p=[Number(provided.x),Number(provided.y)];if(p.every(Number.isFinite)){const safe=this.engine.nearestWalkablePoint?.(this.floorId,p);if(safe)return safe;}}}catch(_e){}
  const floor=this.map.floors.find(f=>f.id===this.floorId),nodes=(floor?.navigationNodes||[]).filter(p=>this.engine.isWalkable(this.floorId,p));if(!nodes.length)return null;const desired=this.floorId==='downstairs'?[.50,.72]:[.50,.68];return nodes.slice().sort((a,b)=>distSrc(a,desired,this.map)-distSrc(b,desired,this.map))[0]?.slice()||null;
}
maybeKeeperRelationshipMoment(t=now()){
  const wall=Date.now();if(wall<this.nextKeeperCheckInAt)return false;const reserved=this.hasDailyPreference('independent_streak','hideaway')||this.hasTrait('Independent')||this.hasTrait('Independent Friend')||this.hasTrait('Shy'),eager=this.currentMoodName()==='Cuddly'||this.hasDailyPreference('attention_day','shadowing','cuddle_day')||this.hasTrait('Affectionate')||this.hasTrait('Clingy')||this.hasTrait('Cuddlebug')||this.hasTrait('Shadow');this.nextKeeperCheckInAt=wall+rand(eager?65000:90000,eager?125000:190000);
  if(this.bond<25||this.currentLifeEvent||String(this.state).startsWith('furniture')||['walking','approachingStairs','climbingStairs','takingOff','flying','landing'].includes(this.state)||this.commandedFurniture||this.pendingMoveMode?.startsWith('command'))return false;if(this.carePriorityNeed?.())return false;
  let chance=.08+this.bond*.0024+(eager?.14:0)-(reserved?.08:0);if(this.currentMoodName()==='Cuddly')chance+=.12;if(this.hasDailyPreference('attention_day','shadowing','cuddle_day'))chance+=.12;if(this.hasDailyPreference('independent_streak'))chance-=.10;if(Math.random()>clamp(chance,.04,.52))return false;
  if((this.hasTrait('Lazy')||this.hasTrait('Couch Potato'))&&!eager&&Math.random()<.55){this.setState('looking',rand(3200,5200));this.noteKeeperRelationship('checkin',{label:'Looked over at keeper'});this.maybeShowDragonThought?.('keeper-checkin');this.nextDecision=t+rand(5000,9000);return true;}
  const target=this.keeperAnchorPoint();if(!target||distSrc(this.pos,target,this.map)<36){this.setState(this.hasTrait('Shy')?'sitting':'resting',rand(5500,10500));this.noteKeeperRelationship('nearby-rest',{label:'Settled near keeper'});this.maybeShowDragonThought?.('keeper-checkin');this.nextDecision=t+rand(7000,12000);return true;}
  const started=this.startWalk(target,'keeper-checkin');if(started){this.walkSpeedBoost=eager?1.14:reserved?.94:1.03;return true;}return false;
}
addBond(amount=0){
  const before=this.bond,beforeStage=this.bondStage(before);this.bond=clamp(this.bond+Number(amount||0),0,100);const afterStage=this.bondStage(this.bond);
  if(Math.abs(this.bond-before)>=.01){
    this.memory.bond=this.bond;this.behaviourDirty=true;this.engine.updateNeedsHud(true);
    if(afterStage.min>beforeStage.min&&!this.memory.bondMilestones?.[String(afterStage.min)]){
      this.memory.bondMilestones=this.memory.bondMilestones||{};this.memory.bondMilestones[String(afterStage.min)]=Date.now();
      window.dispatchEvent(new CustomEvent('dragonbound:bond-milestone',{detail:{name:this.dragon?.name||'Your dragon',bond:Math.round(this.bond),stage:afterStage.name,note:afterStage.note}}));
      this.rememberLifeEvent('bond',`Reached ${afterStage.name}`,afterStage.note,`bond-${afterStage.min}`);
      this.playPetLove(afterStage.name==='Inseparable'?'inseparable ♥':'trusts you more!');
    }
  }
  return this.bond;
}
awardBond(source,amount=0,cooldownMs=0){
  const key=String(source||'care'),nowMs=Date.now(),last=Number(this.memory.bondAwards?.[key]||0);
  if(cooldownMs>0&&last&&nowMs-last<cooldownMs)return 0;
  this.memory.bondAwards=this.memory.bondAwards||{};this.memory.bondAwards[key]=nowMs;const before=this.bond;this.addBond(amount);return this.bond-before;
}
scheduleBondGreeting(){
  clearTimeout(this.greetingTimer);this.greetingTimer=0;const eager=this.currentMoodName()==='Cuddly'||this.hasDailyPreference('attention_day','shadowing','cuddle_day')||this.hasTrait('Clingy')||this.hasTrait('Greeting Enthusiast')||this.hasTrait('Shadow')||this.hasTrait('Cuddlebug')||this.hasTrait('Affectionate')||this.hasTrait('Keeper-Focused'),reserved=this.hasDailyPreference('independent_streak','hideaway')||this.hasTrait('Shy')||this.hasTrait('Independent')||this.hasTrait('Independent Friend')||this.hasTrait('Suspicious of Strangers');const minimum=eager?18:reserved?45:32;if(this.bond<minimum)return;
  const last=Number(this.memory.lastGreetingAt||0),cooldown=eager?12*60*1000:reserved?26*60*1000:18*60*1000;if(last&&Date.now()-last<cooldown)return;if(reserved&&this.bond<75&&Math.random()>.55)return;
  this.greetingTimer=setTimeout(()=>this.startBondGreeting(),eager?650:reserved?1900:1100);
}
startBondGreeting(){
  const eager=this.currentMoodName()==='Cuddly'||this.hasDailyPreference('attention_day','shadowing','cuddle_day')||this.hasTrait('Clingy')||this.hasTrait('Greeting Enthusiast')||this.hasTrait('Shadow')||this.hasTrait('Cuddlebug')||this.hasTrait('Affectionate')||this.hasTrait('Keeper-Focused'),reserved=this.hasDailyPreference('independent_streak','hideaway')||this.hasTrait('Shy')||this.hasTrait('Independent')||this.hasTrait('Independent Friend')||this.hasTrait('Suspicious of Strangers'),minimum=eager?18:reserved?45:32;
  this.greetingTimer=0;if(!this.el?.isConnected||this.bond<minimum||this.engine?.stage?.classList.contains('is-visiting-house'))return false;
  if(String(this.state).startsWith('furniture'))this.finishFurnitureUse('keeper-greeting');
  this.memory.lastGreetingAt=Date.now();this.noteKeeperRelationship('greeting',{silent:true});this.noteUniverseActivity('keeper:greeting');try{window.dispatchEvent(new CustomEvent('dragonbound:keeper-greeting',{detail:{dragonId:String(this.dragon?.id||''),dragonName:String(this.dragon?.name||'Your dragon'),style:this.keeperGreetingStyle()}}));}catch(_e){}this.behaviourDirty=true;this.path=[];this.pathIndex=0;this.stateUntil=0;this.pauseUntil=0;
  if((this.hasTrait('Lazy')||this.hasTrait('Couch Potato'))&&!eager&&this.bond<85){this.setState('resting',4200);this.personalityExpression('♥','noticed you','greeting');this.maybeShowDragonThought?.('keeper-checkin');this.nextDecision=now()+5200;return true;}
  const target=this.keeperAnchorPoint();if(!target)return false;const started=this.startWalk(target.slice(),'bond-greeting');if(started){this.walkSpeedBoost=this.hasTrait('Greeting Enthusiast')||this.hasTrait('Hyper')?1.42:this.bond>=80?1.30:this.hasTrait('Shy')?0.92:this.hasTrait('Independent Friend')?0.98:1.14;this.personalityExpression(this.hasTrait('Shy')?'…':this.hasTrait('Independent Friend')?'•':'♥',this.hasTrait('Shy')?'hello':this.hasTrait('Independent Friend')?'hey':'you came back','greeting');}return started;
}
applyCareBenefit(kind,amount=0){
  // Benefits are additive only. Nothing here reinitialises another need.
  if(kind==='hunger')this.needs.hunger=clamp(this.needs.hunger-amount,0,100);
  else if(kind==='hygiene')this.needs.hygiene=clamp(this.needs.hygiene-amount,0,100);
  else if(kind==='energy')this.needs.rest=clamp(this.needs.rest-amount,0,100);
  else if(kind==='fun')this.needs.stimulation=clamp(this.needs.stimulation-amount,0,100);
  else if(kind==='social')this.needs.social=clamp(this.needs.social-amount,0,100);
  else if(kind==='comfort')this.needs.comfort=clamp(this.needs.comfort-amount,0,100);
  this.behaviourDirty=true;this.engine.updateNeedsHud(true);
}
careVisibleKey(internalKey){return internalKey==='rest'?'energy':internalKey==='stimulation'?'fun':internalKey;}
careTargetFor(internalKey){
  const key=this.careVisibleKey(internalKey),range=CARE_TARGET_RANGES[key]||[78,86];
  const low=Number(range[0]||78),high=Number(range[1]||86),seed=clamp((this.stat('stubbornness')+this.stat('independence'))/200,0,1);
  // A little individual variation: some dragons stop sooner, others fuss around longer.
  return clamp(low+(high-low)*(0.25+Math.random()*.55+seed*.20),low,high);
}
startFurnitureCare(durationMs,deltas={}){
  const durationSec=Math.max(1,Number(durationMs||0)/1000),clean={},targets={};
  for(const [key,value] of Object.entries(deltas||{})){
    const n=Number(value);if(!Number.isFinite(n)||Math.abs(n)<=.0001)continue;clean[key]=n;
    // Only improvements (negative internal deltas) get a satisfaction ceiling.
    // This prevents a quick bath/meal/nap from always leaving a bar at 100%.
    if(n<0)targets[key]=this.careTargetFor(key);
  }
  this.furnitureCarePlan={durationSec,elapsedSec:0,deltas:clean,targetCare:targets};
}
applyFurnitureCare(dt){
  const plan=this.furnitureCarePlan;if(!plan||!String(this.state).startsWith('furniture'))return;
  if(this.physicalInteraction&&this.physicalInteraction.elapsedSec<this.physicalInteraction.settleSec)return;
  const remaining=Math.max(0,plan.durationSec-plan.elapsedSec),step=Math.min(Math.max(0,Number(dt)||0),remaining);if(step<=0)return;
  const portion=step/plan.durationSec;
  for(const [key,totalDelta] of Object.entries(plan.deltas||{})){
    if(!Object.prototype.hasOwnProperty.call(this.needs,key))continue;
    const delta=Number(totalDelta||0)*portion;
    if(delta<0&&Number.isFinite(Number(plan.targetCare?.[key]))){
      const targetInternal=100-clamp(Number(plan.targetCare[key]),0,100);
      this.needs[key]=clamp(Math.max(targetInternal,this.needs[key]+delta),0,100);
    }else this.needs[key]=clamp(this.needs[key]+delta,0,100);
  }
  plan.elapsedSec+=step;this.behaviourDirty=true;
}
updateNeeds(dt){
  // All normal decay is time-based. V32.98 deliberately runs at 3x the V32.97 baseline. dt is seconds.
  const hours=Math.max(0,Number(dt)||0)/3600;if(!hours)return;const rates=this.naturalNeedRates();
  this.needs.rest=clamp(this.needs.rest+hours*rates.rest,0,100);
  this.needs.stimulation=clamp(this.needs.stimulation+hours*rates.stimulation,0,100);
  this.needs.social=clamp(this.needs.social+hours*rates.social,0,100);
  this.needs.hunger=clamp(this.needs.hunger+hours*rates.hunger,0,100);
  this.needs.comfort=clamp(this.needs.comfort+hours*rates.comfort,0,100);
  this.needs.hygiene=clamp(this.needs.hygiene+hours*rates.hygiene,0,100);
  // Ordinary idle actions have tiny natural effects. Furniture care is handled by
  // a separate per-second plan so a dragon only earns the benefit while it actually
  // sleeps, bathes, plays, eats, trains, etc. Leaving early only grants partial care.
  if(this.state==='sleeping'){this.needs.rest=clamp(this.needs.rest-hours*18,0,100);this.needs.comfort=clamp(this.needs.comfort-hours*4,0,100);}
  else if(this.state==='resting'||this.state==='sitting'){this.needs.rest=clamp(this.needs.rest-hours*7,0,100);this.needs.comfort=clamp(this.needs.comfort-hours*2.5,0,100);}
  else if(this.state==='walking'||this.state==='flying'){this.needs.stimulation=clamp(this.needs.stimulation-hours*1.7,0,100);}
  else if(this.state==='looking'){this.needs.stimulation=clamp(this.needs.stimulation-hours*.8,0,100);}
  this.applyFurnitureCare(dt);
  this.behaviourDirty=true;
  // Simply spending relaxed time together slowly builds familiarity when the dragon is
  // reasonably cared for. If several needs are very low, the bond can drift down instead,
  // but only by a few tenths per hour — it never punishes the player harshly.
  const care=this.careStats(),avgCare=(care.hunger+care.hygiene+care.energy+care.fun)/4,critical=[care.hunger,care.hygiene,care.energy,care.fun].filter(v=>v<25).length;
  if(avgCare>=58&&critical===0){
    this.bondNeglectSeconds=0;this.bondTogetherSeconds+=Math.max(0,Number(dt)||0);
    if(this.bondTogetherSeconds>=600){this.bondTogetherSeconds%=600;this.addBond(.14);}
  }else if(avgCare<38||critical>=2){
    this.bondTogetherSeconds=0;this.bondNeglectSeconds+=Math.max(0,Number(dt)||0);
    if(this.bondNeglectSeconds>=600){
      this.bondNeglectSeconds%=600;const loss=avgCare<22?.07:.04;this.addBond(-loss);
    }
  }else{
    this.bondTogetherSeconds=Math.max(0,this.bondTogetherSeconds-Math.max(0,Number(dt)||0)*.25);this.bondNeglectSeconds=0;
  }
}
    scoreAction(action,t,simulation=false){
      const s=this.coreStats,n=this.needs,b=this.behaviour||DEFAULT_BEHAVIOUR;let score=PERSONALITY_BASE_SCORES[action]||1;
      const energy=s.energy,curiosity=s.curiosity,affection=s.affection,independence=s.independence,bravery=s.bravery,playfulness=s.playfulness,mischief=s.mischief,stubbornness=s.stubbornness,sleepiness=s.sleepiness,intelligence=s.intelligence;
      if(action==='idle')score+=(100-energy)*.12+stubbornness*.05-n.stimulation*.08;
      if(action==='looking')score+=curiosity*.23+intelligence*.11+(100-energy)*.04+n.stimulation*.10+n.social*.08;
      if(action==='walking')score+=energy*.24+curiosity*.13+independence*.08+n.stimulation*.13-n.rest*.10;
      if(action==='explore')score+=curiosity*.34+intelligence*.13+playfulness*.12+mischief*.08+n.stimulation*.16-n.rest*.08;
      if(action==='furniture'){
        const best=this.bestFurnitureCandidate(true);if(!best)score=0;else{const careNeed=this.carePriorityNeed(),urgency=careNeed?Math.max(0,careNeed.threshold-careNeed.value):0;score+=best.score*.58+curiosity*.05+playfulness*.05+n.comfort*.05+urgency*1.9;}
      }
      const restPressure=Math.max(0,n.rest-(100-CARE_AUTONOMY_THRESHOLDS.energy));
      if(action==='sitting')score+=(100-energy)*.08+sleepiness*.09+n.comfort*.10+restPressure*.15;
      if(action==='resting')score+=sleepiness*.15+(100-energy)*.05+restPressure*.48+n.comfort*.12;
      if(action==='sleeping'){score+=sleepiness*.20+(100-energy)*.05+restPressure*.88-n.stimulation*.05;const hasBed=getFurnitureInteractions().some(x=>x?.roomId===this.floorId&&this.effectiveFurnitureTags(x).includes('sleepable'));if(hasBed&&restPressure>0)score-=38;else if(hasBed&&!this.hasTrait('Professional Napper'))score-=48;}
      if(action==='stairs')score+=energy*.10+curiosity*.16+independence*.06+stubbornness*.03;
      if(action==='flight')score+=energy*.14+bravery*.19+playfulness*.15+curiosity*.06;
      if(action==='zoomies')score+=energy*.24+playfulness*.27+curiosity*.08-n.rest*.16;
      for(const q of this.assignedTraits){const mod=TRAIT_ACTION_MODIFIERS[q]?.[action];if(Number.isFinite(mod))score+=mod;const universeMod=DRAGONBOUND_UNIVERSE_TRAIT_BY_NAME[q]?.action?.[action];if(Number.isFinite(universeMod))score+=universeMod;}
      for(const q of this.signatureTraits){const mod=SIGNATURE_TRAIT_ACTION_MODIFIERS[q]?.[action];if(Number.isFinite(mod))score+=mod;}
      score+=this.dailyMoodActionBias(action);score+=this.dailyPreferenceActionBias(action);
      const previousUniverseKind=this.universeLastActivity()?.kind||'';
      if(this.hasUniverseQuirk('treat-zoomies')&&previousUniverseKind==='treat'&&action==='zoomies')score+=34;
      if(this.hasUniverseQuirk('post-meal-nap')&&previousUniverseKind==='eat'&&(action==='sleeping'||action==='resting'))score+=action==='sleeping'?24:14;
      if(this.hasUniverseQuirk('training-rest')&&previousUniverseKind==='training'&&action==='resting')score+=24;
      if(this.hasUniverseQuirk('bath-bed')&&previousUniverseKind==='bath'&&(action==='sleeping'||action==='resting'))score+=18;
      if(this.hasUniverseQuirk('pre-bed-wander')&&previousUniverseKind==='rest'&&action==='walking')score+=9;
      const preferred=this.hasTrait('Upstairs Dweller')?'upstairs':this.hasTrait('Downstairs Dweller')?'downstairs':(this.preferences?.preferredFloor||this.dragon?.personality?.preferencesSeed?.preferredFloor);
      if(action==='stairs'&&preferred&&preferred!==this.floorId)score+=18+(this.hasTrait('Creature of Habit')||this.hasTrait('Routine Lover')?10:0);
      const weather=this.engine.weatherMode||'';
      if(weather){if(bravery<30){if(action==='resting'||action==='sitting')score+=14;if(action==='flight'||action==='explore')score-=16;if(action==='looking')score+=6;}else if(bravery>72){if(action==='looking'||action==='explore')score+=9;}if(this.hasTrait('Rain Lover')&&/rain|mist|snow/.test(weather)&&(action==='looking'||action==='explore'))score+=18;if(this.hasTrait('Rain Hater')&&/rain|mist|snow/.test(weather)){if(action==='resting'||action==='sitting')score+=18;if(action==='explore'||action==='flight')score-=18;}}
      try{score+=Number(window.DragonboundCalendar?.actionBias?.(action,this)||0);}catch(_e){}
      score-=this.recentPenalty(action);
      const wallNow=simulation?t:Date.now(),floorAge=wallNow-this.floorEntered;
      if(action==='stairs'){
        const minCooldown=this.hasTrait('Stair Goblin')?48000:this.hasTrait('Explorer')?65000:78000;
        if(!this.map.stairConnections.length||floorAge<32000||wallNow-this.lastStairUse<minCooldown)score=0;
      }
      if(action==='flight'){
        let minCooldown=this.hasTrait('Little Pilot')?125000:MIN_FLIGHT_COOLDOWN_MS;if(this.hasTrait('Grounded'))minCooldown=900000;
        if(!this.map.flightZones.some(z=>z.floorId===this.floorId)||floorAge<65000||wallNow-this.lastFlight<minCooldown)score=0;
      }
      if(action==='zoomies'){
        const last=this.memory.lastZoomiesAt||0;if(wallNow-last<150000||energy<58||playfulness<55)score=0;
      }
      if(action==='furniture'){
        const cooldown=this.hasTrait('Furniture Inspector')||this.hasTrait('Toy Obsessed')?28000:42000;
        if(wallNow-this.lastFurnitureInteraction<cooldown)score=0;
      }
      if(action==='sleeping'&&this.memory.recentActions?.slice(-4).includes('sleeping'))score-=28;
      return Math.max(0,score);
    }
    scoreActions(t,simulation=false){const scores={};for(const action of PERSONALITY_ACTIONS)scores[action]=this.scoreAction(action,t,simulation);this.lastScores=scores;return scores;}
    carePriorityNeed(){
      const c=this.careStats(),
        cleanDelta=this.hasTrait('Clean')?7:this.hasTrait('Very Clean')?6:this.hasTrait('Messy')||this.hasTrait('Dirt Magnet')?-5:0,
        foodDelta=this.hasTrait('Food Obsessed')?4:this.hasTrait('Always Hungry')||this.hasTrait('Greedy')?3:this.hasTrait('Picky')?-2:0,
        sleepDelta=this.hasTrait('Sleepy')?5:this.hasTrait('Lazy')?2:this.hasTrait('Nap Lover')||this.hasTrait('Heavy Sleeper')?4:this.hasTrait('Energetic')||this.hasTrait('Hyper')?-2:0,
        funDelta=this.hasTrait('Playful')?4:this.hasTrait('Energetic')?2:this.hasTrait('Toy Obsessed')?3:this.hasTrait('Lazy')?-2:0,rows=[
        {need:'hunger',careKey:'hunger',value:c.hunger,threshold:CARE_AUTONOMY_THRESHOLDS.hunger+foodDelta},
        {need:'hygiene',careKey:'hygiene',value:c.hygiene,threshold:CARE_AUTONOMY_THRESHOLDS.hygiene+cleanDelta},
        {need:'rest',careKey:'energy',value:c.energy,threshold:CARE_AUTONOMY_THRESHOLDS.energy+sleepDelta},
        {need:'stimulation',careKey:'fun',value:c.fun,threshold:CARE_AUTONOMY_THRESHOLDS.fun+funDelta}
      ].filter(row=>row.value<=row.threshold).sort((a,b)=>a.value-b.value);
      return rows[0]||null;
    }
    furnitureSupportsCare(meta,need){
      const t=new Set(this.effectiveFurnitureTags(meta));
      if(need==='hunger')return t.has('food')||t.has('drink')||t.has('hydration');
      if(need==='hygiene')return t.has('washable')||t.has('sandbath')||t.has('groomable');
      if(need==='rest')return t.has('sleepable')||t.has('restable')||t.has('comfortable')||t.has('warm');
      if(need==='stimulation')return t.has('playable')||t.has('puzzle')||t.has('scratchable')||t.has('diggable')||t.has('reading')||t.has('window');
      return false;
    }
    careFurnitureAvailable(need){
      if(!need)return false;return getFurnitureInteractions().some(meta=>meta&&meta.roomId===this.floorId&&this.furnitureSupportsCare(meta,need));
    }
    urgentCareFurnitureAvailable(){const need=this.carePriorityNeed();return !!(need&&this.careFurnitureAvailable(need.need));}
    chooseAction(t,simulation=false){
      const scores=this.scoreActions(t,simulation),careNeed=this.carePriorityNeed();
      if(careNeed&&this.careFurnitureAvailable(careNeed.need)&&scores.furniture>0){this.pendingCareNeed=careNeed.need;return'furniture';}
      this.pendingCareNeed='';return weightedChoiceFromScores(scores);
    }
    recordAction(action){
      const m=this.memory,obs=m.observationCounters||(m.observationCounters={});m.recentActions=(m.recentActions||[]).concat(action).slice(-8);m.activityCounts=m.activityCounts||{};m.activityCounts[action]=(Number(m.activityCounts[action])||0)+1;obs.totalDecisions=(Number(obs.totalDecisions)||0)+1;
      if(action==='walking'||action==='explore'||action==='zoomies')obs.walkSessions=(Number(obs.walkSessions)||0)+1;
      if(action==='furniture')obs.furnitureDecisions=(Number(obs.furnitureDecisions)||0)+1;
      if(action==='looking'&&this.bond>=40)obs.keeperSeekingEvents=(Number(obs.keeperSeekingEvents)||0)+1;
      if(action==='looking')obs.lookSessions=(Number(obs.lookSessions)||0)+1;
      if(action==='resting')obs.restSessions=(Number(obs.restSessions)||0)+1;
      if(action==='stairs')obs.stairsUsed=(Number(obs.stairsUsed)||0)+1;
      if(action==='flight'){obs.flightsTaken=(Number(obs.flightsTaken)||0)+1;this.rememberLifeEvent('skill','First successful flight','A careful little indoor flight — and a safe landing to follow.','first-flight');}
      if(action==='sleeping'){obs.sleepSessions=(Number(obs.sleepSessions)||0)+1;this.noteSleepLocation();}
      if(action==='zoomies'){obs.zoomiesTriggered=(Number(obs.zoomiesTriggered)||0)+1;m.lastZoomiesAt=Date.now();}
      if(action==='idle'&&this.stateUntil-now()>8000)obs.longIdleSessions=(Number(obs.longIdleSessions)||0)+1;
      obs.floorVisits={downstairs:Number(this.memory.floorVisits?.downstairs||0),upstairs:Number(this.memory.floorVisits?.upstairs||0)};this.noteUniverseActivity(action);this.discoverTraits();this.behaviourDirty=true;
    }
    noteLocation(p=this.pos){
      const key=locationKey(this.floorId,p),vis=this.memory.visitedLocations||(this.memory.visitedLocations={}),obs=this.memory.observationCounters||(this.memory.observationCounters={}),confidence=this.memory.confidenceLocations||(this.memory.confidenceLocations={});const first=!vis[key],confidenceFirst=!confidence[key];vis[key]=(Number(vis[key])||0)+1;if(first)obs.newLocationsVisited=(Number(obs.newLocationsVisited)||0)+1;if(confidenceFirst){confidence[key]=Date.now();this.gainSkill('confidence',.18,'Explored a new corner',{challenge:true});}
      const entries=Object.entries(vis).sort((a,b)=>b[1]-a[1]).slice(0,16);this.memory.visitedLocations=Object.fromEntries(entries);this.memory.confidenceLocations=Object.fromEntries(Object.entries(confidence).sort((a,b)=>Number(b[1]||0)-Number(a[1]||0)).slice(0,64));this.behaviourDirty=true;
    }
    noteSleepLocation(){
      const key=locationKey(this.floorId,this.pos),spots=this.memory.sleepLocations||(this.memory.sleepLocations={}),obs=this.memory.observationCounters||(this.memory.observationCounters={});const before=Number(spots[key]?.count||0),count=before+1;spots[key]={floorId:this.floorId,x:+this.pos[0].toFixed(4),y:+this.pos[1].toFixed(4),count};if(before>0)obs.sameSleepSpotVisits=(Number(obs.sameSleepSpotVisits)||0)+1;
      const top=Object.entries(spots).sort((a,b)=>(b[1]?.count||0)-(a[1]?.count||0)).slice(0,8);this.memory.sleepLocations=Object.fromEntries(top);const threshold=this.hasTrait('Creature of Habit')||this.hasTrait('Routine Lover')?2:this.hasTrait('Explorer')?5:3;if(count>=threshold){this.preferences.formed=this.preferences.formed||{};this.preferences.formed.favouriteSleepSpot={floorId:this.floorId,x:+this.pos[0].toFixed(4),y:+this.pos[1].toFixed(4),count};this.preferences.preferredFloor=this.floorId;}
    }
    discoverTraits(){
      const obs=this.memory.observationCounters||{};let changed=false;this.memory.traitDiscoveredAt=boundedObject(this.memory.traitDiscoveredAt,{});
      for(const trait of this.assignedTraits){
        if(DRAGONBOUND_UNIVERSE_TRAIT_BY_NAME[trait])continue;if(this.discoveredTraits.includes(trait))continue;const rule=DISCOVERY_RULES[trait];
        if(rule&&rule(obs)){this.discoveredTraits.push(trait);this.memory.traitDiscoveredAt[trait]=Date.now();this.rememberLifeEvent('trait',`Discovered: ${trait}`,'A new part of their personality has revealed itself.',`trait-${trait}`);this.lifeEventNotice(`Learned: ${trait}`,'happy');changed=true;}
      }
      const universeTraitChanged=this.discoverUniverseTraits();const universeQuirkChanged=this.discoverUniverseQuirks();const universeChanged=universeTraitChanged||universeQuirkChanged;
      if(changed||universeChanged){const allDiscovered=[...new Set([...this.discoveredTraits,...this.personalityUniverseDiscovered()])];this.dragon.traits={...(this.dragon.traits||{}),assigned:this.assignedTraits.slice(),discovered:allDiscovered.slice(0,20)};this.behaviourDirty=true;this.engine.saveBehaviour(true);}
    }
    behaviourSnapshot(){
      const activity={};for(const k of PERSONALITY_ACTIONS)activity[k]=Number(this.memory.activityCounts?.[k]||0);
      const floorVisits={downstairs:Number(this.memory.floorVisits?.downstairs||0),upstairs:Number(this.memory.floorVisits?.upstairs||0)};
      const obs={};for(const [k,v] of Object.entries(this.memory.observationCounters||{}).slice(0,60))obs[k]=Number(v)||0;
      const skills={};for(const key of DRAGON_SKILLS){const s=this.skills[key]||{};skills[key]={xp:+Number(s.xp||0).toFixed(3),lifetimeXp:+Number(s.lifetimeXp||0).toFixed(3),level:+Number(s.level||0).toFixed(3),lastGainAt:Number(s.lastGainAt||0),activities:Number(s.activities||0),lastSource:String(s.lastSource||'').slice(0,80)};}
      const growth=this.updateGrowthMemory(),life=this.lifeData(),keeperRel=this.relationshipMemory();life.lastSeenAt=Date.now();
      return {keeperRelationshipV3405:{version:1,sharedActivities:boundedObject(keeperRel.sharedActivities,{}),visitPeriods:boundedObject(keeperRel.visitPeriods,{}),recentMoments:Array.isArray(keeperRel.recentMoments)?keeperRel.recentMoments.slice(-12):[],greetings:Number(keeperRel.greetings||0),checkIns:Number(keeperRel.checkIns||0),nearbyRests:Number(keeperRel.nearbyRests||0),pets:Number(keeperRel.pets||0),treats:Number(keeperRel.treats||0),commands:Number(keeperRel.commands||0),guidedActivities:Number(keeperRel.guidedActivities||0),returnCount:Number(keeperRel.returnCount||0),lastReturnAt:Number(keeperRel.lastReturnAt||0),lastReturnBand:String(keeperRel.lastReturnBand||''),favouriteSharedActivity:String(keeperRel.favouriteSharedActivity||''),lastInteractionAt:Number(keeperRel.lastInteractionAt||0),lastVisitStartedAt:Number(keeperRel.lastVisitStartedAt||0),lastVisitBucket:Number(keeperRel.lastVisitBucket||0)},socialUniverse:{version:1,relationships:boundedObject(this.memory.socialUniverse?.relationships,{}),socialMoments:Array.isArray(this.memory.socialUniverse?.socialMoments)?this.memory.socialUniverse.socialMoments.slice(-30):[],milestones:boundedObject(this.memory.socialUniverse?.milestones,{}),favouriteCompanion:String(this.memory.socialUniverse?.favouriteCompanion||'').slice(0,100),lastSocialAt:Number(this.memory.socialUniverse?.lastSocialAt||0)},calendarHistory:{version:1,firstEvents:boundedObject(this.memory.calendarHistory?.firstEvents,{}),eventMoments:Array.isArray(this.memory.calendarHistory?.eventMoments)?this.memory.calendarHistory.eventMoments.slice(-25):[],eventStats:boundedObject(this.memory.calendarHistory?.eventStats,{})},personalityUniverse:this.personalityUniverseSnapshot(),recentActions:(this.memory.recentActions||[]).slice(-8),recentFurnitureKinds:(this.memory.recentFurnitureKinds||[]).slice(-6),recentFurnitureIds:(this.memory.recentFurnitureIds||[]).slice(-6),activityCounts:activity,floorVisits,sleepLocations:this.memory.sleepLocations||{},visitedLocations:this.memory.visitedLocations||{},confidenceLocations:this.memory.confidenceLocations||{},furnitureAffinity:this.memory.furnitureAffinity||{},furnitureFavourites:this.memory.furnitureFavourites||{},skillRewards:this.memory.skillRewards||{},thoughtMilestones:this.memory.thoughtMilestones||{},commands:this.memory.commands||{},observationCounters:obs,firsts:this.memory.firsts||{},traitDiscoveredAt:this.memory.traitDiscoveredAt||{},lifeHistory:(this.memory.lifeHistory||[]).slice(0,40),dailyLife:{cooldowns:life.cooldowns||{},eventCounts:life.eventCounts||{},routineCounts:life.routineCounts||{},knownFurniture:life.knownFurniture||{},knownFurnitureSeeded:Number(life.knownFurnitureSeeded||0),moodCounts:life.moodCounts||{},recentEvents:(life.recentEvents||[]).slice(-10),lastMeaningfulMoment:life.lastMeaningfulMoment||{},lastEventAt:Number(life.lastEventAt||0),globalReadyAt:Number(life.globalReadyAt||0),lastReturnAt:Number(life.lastReturnAt||0),lastMood:String(life.lastMood||''),lastMoodAt:Number(life.lastMoodAt||0),lastSeenAt:Number(life.lastSeenAt||0)},skills,skillFatigue:this.memory.skillFatigue||{},skillCooldowns:this.memory.skillCooldowns||{},skillPassiveCooldowns:this.memory.skillPassiveCooldowns||{},skillMilestones:this.memory.skillMilestones||{},skillMigrationV3292:Number(this.memory.skillMigrationV3292||0),growth:{stage:growth.name,index:growth.index,lastCheckedAt:Date.now()},runtimeNeeds:{rest:+this.needs.rest.toFixed(2),stimulation:+this.needs.stimulation.toFixed(2),social:+this.needs.social.toFixed(2),hunger:+this.needs.hunger.toFixed(2),comfort:+this.needs.comfort.toFixed(2),hygiene:+this.needs.hygiene.toFixed(2)},bond:+this.bond.toFixed(2),bondAwards:this.memory.bondAwards||{},bondMilestones:this.memory.bondMilestones||{},lastGreetingAt:Number(this.memory.lastGreetingAt||0),lastZoomiesAt:Number(this.memory.lastZoomiesAt||0),lastFurnitureInteractionAt:Number(this.memory.lastFurnitureInteractionAt||0),lastSavedAt:new Date().toISOString()};
    }
    effectiveFurnitureTags(meta={}){
      const tags=new Set((Array.isArray(meta?.tags)?meta.tags:[]).map(t=>String(t||'').trim().toLowerCase()).filter(Boolean));
      const category=String(meta?.category||'').trim().toLowerCase(),text=`${String(meta?.itemId||'')} ${String(meta?.name||'')} ${category}`.toLowerCase();
      if(category==='beds'||/\bbed\b|nest|hammock|sleep|cushion/.test(text)){tags.add('sleepable');tags.add('comfortable');}
      if(category==='bath'||/bath|wash|tub|basin|washstand|shower|steamroom/.test(text))tags.add('washable');
      if(/sand|mud/.test(text)&&(category==='bath'||tags.has('washable')))tags.add('sandbath');
      if(category==='training'){tags.add('training');tags.add('exercise');}
      if(category==='toys')tags.add('playable');
      if(category==='feeding'||category==='kitchen'){if(/water|drink|trough|hydration/.test(text)){tags.add('drink');tags.add('hydration');}else tags.add('food');}
      if(/scratch|scratching|claw post|claw log/.test(text))tags.add('scratchable');
      if(/groom|brush|polish|scale scrub|towel/.test(text))tags.add('groomable');
      if(/toilet|litter/.test(text))tags.add('toilet');
      if(/fireplace|hearth|brazier|heater|heated|warm/.test(text))tags.add('warm');
      if(/book|reading|scribe/.test(text))tags.add('reading');
      if(/mirror|reflection/.test(text))tags.add('mirror');
      if(/window/.test(text))tags.add('window');
      if(/roar/.test(text))tags.add('roarable');
      if(/flame|fire practice|fire-practice/.test(text))tags.add('fire-practice');
      if(/dig|burrow/.test(text))tags.add('diggable');
      if(/climb|ramp|beam|jump|agility|treadwheel|weave/.test(text))tags.add('climbable');
      if(/chair|sofa|bench|daybed|cushion|lounger/.test(text))tags.add('restable');
      if(/chest|wardrobe|cabinet|hide/.test(text))tags.add('hideable');
      if(!tags.size)tags.add('inspectable');
      return [...tags];
    }
    scoreFurnitureTags(tags=[],meta={}){
      const t=new Set(this.effectiveFurnitureTags({...meta,tags:Array.isArray(tags)?tags:meta?.tags})),s=this.coreStats,n=this.needs;let score=16;
      // Needs only begin adding strong furniture-seeking pressure once the visible bar
      // reaches the Sims-like 30-40% zone. Personality can still create optional use.
      const p=(internal,key)=>Math.max(0,Number(internal||0)-(100-Number(CARE_AUTONOMY_THRESHOLDS[key]||40)));
      const restP=p(n.rest,'energy'),funP=p(n.stimulation,'fun'),hungerP=p(n.hunger,'hunger'),hygieneP=p(n.hygiene,'hygiene');
      if(t.has('sleepable'))score+=s.sleepiness*.24+restP*1.25+(this.hasTrait('Professional Napper')?32:0);
      if(t.has('restable')||t.has('perchable')||t.has('comfortable'))score+=n.comfort*.12+restP*.48+s.sleepiness*.07;
      if(t.has('playable')||t.has('tug')||t.has('chewable')||t.has('hoardable'))score+=s.playfulness*.31+funP*1.10+(this.hasTrait('Toy Obsessed')?34:0);
      if(t.has('puzzle'))score+=s.intelligence*.24+s.curiosity*.18+funP*.42;
      if(t.has('food'))score+=s.appetite*.22+hungerP*1.42+(this.hasTrait('Food Goblin')||this.hasTrait('Greedy')?30:0);
      if(t.has('drink')||t.has('hydration'))score+=hungerP*.52+s.appetite*.08+8;
      if(t.has('washable')||t.has('sandbath')||t.has('groomable'))score+=n.comfort*.08+hygieneP*1.38+s.curiosity*.10;
      if(t.has('exercise')||t.has('training')||t.has('agility')){score+=s.energy*.23+s.playfulness*.17+n.stimulation*.18;const carePressure=Math.max(n.rest,n.hunger,n.hygiene);if(carePressure>62)score-=Math.min(60,(carePressure-62)*1.8);}
      if(t.has('roarable')||t.has('fire-practice'))score+=s.bravery*.20+s.playfulness*.13+s.energy*.10+n.stimulation*.15;
      if(t.has('scratchable')||t.has('diggable'))score+=s.playfulness*.20+s.mischief*.15+n.stimulation*.20;
      if(t.has('climbable'))score+=s.energy*.16+s.curiosity*.15+s.bravery*.08;
      if(t.has('inspectable'))score+=s.curiosity*.26+s.mischief*.07+(this.hasTrait('Furniture Inspector')?28:0);
      if(t.has('reading'))score+=s.intelligence*.22+s.curiosity*.14;
      if(t.has('mirror'))score+=s.curiosity*.18+s.sociability*.06;
      if(t.has('sniffable'))score+=s.curiosity*.18+n.stimulation*.08;
      if(t.has('toilet'))score+=n.comfort*.10+8;
      if(t.has('warm'))score+=this.hasTrait('Fireplace Lover')?38:10;
      if(t.has('window'))score+=(this.hasTrait('Window Watcher')||this.hasTrait('Watcher'))?34:s.curiosity*.11;
      if(t.has('hideable')&&s.bravery<45)score+=(100-s.bravery)*.24;
      if(t.has('hoardable')&&this.hasTrait('Hoarder'))score+=36;
      if(t.has('flight-practice')&&this.hasTrait('Little Pilot'))score+=32;
      if(t.has('noisy'))score+=s.bravery*.16-(100-s.bravery)*.19;
      if(t.has('expensive')&&this.hasTrait('Snob'))score+=32;
      if(t.has('nature')&&this.hasTrait('Gentle Soul'))score+=10;
      if(meta.isNew&&(this.hasTrait('Explorer')||this.hasTrait('Curious')||this.hasTrait('Furniture Inspector')||this.hasTrait('Change Lover')))score+=28;
      // Signature traits weight furniture choice, while urgent care still wins above.
      if((this.hasTrait('Lazy')||this.hasTrait('Sleepy'))&&(t.has('sleepable')||t.has('restable')||t.has('comfortable')))score+=18;
      if(this.hasTrait('Energetic')&&(t.has('exercise')||t.has('training')||t.has('agility')||t.has('climbable')))score+=15;
      if(this.hasTrait('Competitive')&&(t.has('exercise')||t.has('training')||t.has('agility')||t.has('flight-practice')||t.has('roarable')))score+=20;
      if(this.hasTrait('Lazy')&&(t.has('exercise')||t.has('training')||t.has('agility')||t.has('flight-practice')))score-=11;
      if(this.hasTrait('Curious')&&(t.has('inspectable')||meta.isNew))score+=meta.isNew?24:10;
      if(this.hasTrait('Mischievous')&&(t.has('scratchable')||t.has('diggable')||t.has('hoardable')||t.has('openable')))score+=16;
      if(this.hasTrait('Food Obsessed')&&(t.has('food')||t.has('drink')||t.has('hydration')))score+=22;
      if(this.hasTrait('Playful')&&(t.has('playable')||t.has('puzzle')||t.has('tug')||t.has('chewable')))score+=18;
      if((this.hasTrait('Brave')||this.hasTrait('Adventurous'))&&(t.has('climbable')||t.has('flight-practice')||meta.isNew))score+=12;
      if(this.hasTrait('Shy')&&t.has('hideable'))score+=22;
      if(this.hasTrait('Shy')&&t.has('noisy'))score-=18;
      if(this.hasTrait('Clean')&&(t.has('washable')||t.has('sandbath')||t.has('groomable')))score+=20;
      if(this.hasTrait('Messy')&&(t.has('washable')||t.has('sandbath')||t.has('groomable')))score-=7;
      if(this.hasTrait('Easily Excited')&&(t.has('playable')||t.has('exercise')||t.has('training')))score+=11;
      if(this.hasTrait('Calm')&&(t.has('restable')||t.has('comfortable')||t.has('window')))score+=12;
      score+=this.dailyMoodFurnitureBias(t,meta);score+=this.dailyPreferenceFurnitureBias(t,meta);
      for(const trait of this.personalityUniverseAllTraits()){const prefs=DRAGONBOUND_UNIVERSE_TRAIT_BY_NAME[trait]?.furniture||{};for(const [tag,points] of Object.entries(prefs)){if(t.has(tag)&&Number.isFinite(Number(points)))score+=Number(points);}}
      if(this.hasUniverseQuirk('fireplace-stare')&&t.has('warm'))score+=18;
      if(this.hasUniverseQuirk('window-routine')&&t.has('window'))score+=22;
      if(this.hasUniverseQuirk('plant-sitter')&&t.has('nature'))score+=16;
      if(this.hasUniverseQuirk('new-furniture-first')&&meta.isNew)score+=20;
      if(this.hasUniverseQuirk('moving-furniture-suspicion')&&meta.isNew)score-=9;
      if(this.hasUniverseQuirk('simple-taste')&&t.has('expensive'))score-=10;
      try{score+=Number(window.DragonboundCalendar?.furnitureBias?.([...t],meta,this)||0);}catch(_e){}
      const skillSources=this.furnitureSkillSources({...meta,tags:[...t]},this.furnitureKind({...meta,tags:[...t]}));if(skillSources.length&&Math.max(n.rest,n.hunger,n.hygiene)<68){let interest=0;for(const src of skillSources){const level=Number(this.skills?.[src.skill]?.level||0);interest+=level<25?2.2:level<50?1.2:.5;}if(this.hasTrait('Little Athlete')||this.hasTrait('Natural Athlete')||this.hasTrait('Training Addict'))if(skillSources.some(v=>v.skill==='agility'||v.skill==='strength'))interest+=3;if(this.hasTrait('Little Pilot')||this.hasTrait('Born Flyer'))if(skillSources.some(v=>v.skill==='flying'))interest+=3;score+=Math.min(12,interest);}
      return Math.max(0,score);
    }
    furnitureKind(meta){
      const t=new Set(this.effectiveFurnitureTags(meta)),text=`${meta?.name||''} ${meta?.itemId||''} ${meta?.category||''}`.toLowerCase(),training=t.has('training')||String(meta?.category||'').toLowerCase()==='training';
      // Purpose-built training equipment wins over accidental comfort/sleep tags.
      // Recovery/stretch nests remain restful, but weight/resistance/agility gear must train.
      if(t.has('fire-practice'))return'fire';
      if(t.has('roarable'))return'roar';
      if(training&&!/recovery|restorative|stretch nest/.test(text)&&/weight|dumbbell|resistance|sled|push|pull|strength|heavy|cable|lifting|punch|treadmill|sprint|agility|weave|balance|hurdle|landing target|climb|pegboard|roller|obstacle|jump|exercise wheel|stretch ring/.test(text))return'exercise';
      if(t.has('sleepable'))return'sleep';
      if(t.has('food'))return t.has('puzzle')?'puzzle':'eat';
      if(t.has('drink')||t.has('hydration'))return'drink';
      if(t.has('sandbath'))return'sandbath';
      if(t.has('washable'))return'wash';
      if(t.has('groomable'))return'groom';
      if(t.has('scratchable'))return'scratch';
      if(t.has('diggable'))return'dig';
      if(t.has('climbable'))return'climb';
      if(t.has('exercise')||t.has('training')||t.has('agility'))return'exercise';
      if(t.has('playable')||t.has('tug')||t.has('chewable')||t.has('hoardable'))return'play';
      if(t.has('hideable'))return'hide';
      if(t.has('perchable'))return'perch';
      if(t.has('reading'))return'read';
      if(t.has('mirror'))return'mirror';
      if(t.has('sniffable'))return'sniff';
      if(t.has('toilet'))return'toilet';
      if(t.has('restable')||t.has('comfortable'))return'rest';
      if(t.has('warm'))return'warm';
      if(t.has('window'))return'watch';
      return'inspect';
    }
    autonomyFurnitureMeta(meta={}){
      // V33.98: turn the furniture-provider row into dragon-specific context. The same
      // furnishing can be "new" to one dragon and familiar to another because this is
      // read from that dragon's persisted behaviour memory, not from the global catalogue.
      const id=String(meta?.placementId||''),life=this.lifeData(),known=id?life.knownFurniture?.[id]:null,affinity=id?this.memory.furnitureAffinity?.[id]:null;
      return {...meta,isNew:!!(id&&known&&!known.used),timesUsed:Number(affinity?.count||0),lastUsedAt:Number(affinity?.lastUsedAt||0)};
    }
    signatureFurnitureBias(kind,tags=[],meta={}){
      // Signature traits deliberately alter probabilities rather than forbidding choices.
      // Need urgency is added separately and remains dominant when a care bar is low.
      const t=new Set(tags),has=x=>this.hasTrait(x);let score=0;
      if(has('Lazy')){if(['sleep','rest','warm','perch'].includes(kind))score+=22;if(['exercise','climb','fire','roar'].includes(kind))score-=15;}
      if(has('Sleepy')){if(['sleep','rest','warm','perch'].includes(kind))score+=25;if(['exercise','climb'].includes(kind))score-=8;}
      if(has('Energetic')){if(['exercise','climb','play','scratch','dig','roar','fire'].includes(kind))score+=19;if(['sleep','rest'].includes(kind))score-=7;}
      if(has('Competitive')){if(['exercise','climb','roar','fire'].includes(kind))score+=27;if(kind==='play'&&t.has('training'))score+=12;}
      if(has('Playful')){if(['play','puzzle','scratch','dig'].includes(kind))score+=24;}
      if(has('Curious')){if(['inspect','watch','read','mirror','sniff','climb'].includes(kind))score+=18;if(meta.isNew)score+=30;}
      if(has('Mischievous')){if(['scratch','dig','hide','play'].includes(kind))score+=20;if(kind==='inspect'&&t.has('openable'))score+=16;}
      if(has('Food Obsessed')){if(['eat','drink','puzzle'].includes(kind))score+=30;}
      if(has('Clean')){if(['wash','sandbath','groom'].includes(kind))score+=28;}
      if(has('Messy')){if(['wash','sandbath','groom'].includes(kind))score-=10;}
      if(has('Shy')){if(['hide','rest','warm','perch'].includes(kind))score+=18;if(t.has('noisy')||['roar','fire'].includes(kind))score-=18;if(meta.isNew)score-=6;}
      if(has('Brave')||has('Adventurous')){if(['climb','roar','fire','inspect'].includes(kind))score+=12;if(meta.isNew)score+=12;}
      if(has('Calm')){if(['rest','warm','perch','watch','read'].includes(kind))score+=18;if(['scratch','dig','roar'].includes(kind))score-=7;}
      if(has('Easily Excited')){if(['play','exercise','climb','scratch','roar'].includes(kind))score+=14;}
      if(has('Affectionate')||has('Clingy')){if(['rest','perch','warm'].includes(kind))score+=5;}
      return score;
    }
    recentFurnitureKindPenalty(kind){
      const recent=Array.isArray(this.memory.recentFurnitureKinds)?this.memory.recentFurnitureKinds:[];let penalty=0;
      if(recent.at(-1)===kind)penalty+=14;
      if(recent.at(-2)===kind)penalty+=8;
      if(recent.slice(-4).filter(v=>v===kind).length>=3)penalty+=14;
      return penalty;
    }
    bestFurnitureCandidate(simulation=false,careNeed=''){
      this.syncLifeFurniture(false);
      let items=getFurnitureInteractions().filter(x=>x&&x.roomId===this.floorId).map(meta=>this.autonomyFurnitureMeta(meta));
      if(careNeed)items=items.filter(meta=>this.furnitureSupportsCare(meta,careNeed));
      if(!items.length)return null;
      const affinity=this.memory.furnitureAffinity||{},recentId=this.memory.lastFurniturePlacementId||'',recentIds=Array.isArray(this.memory.recentFurnitureIds)?this.memory.recentFurnitureIds:[];
      const ranked=items.map(meta=>{
        const tags=this.effectiveFurnitureTags(meta),kind=this.furnitureKind({...meta,tags});let score=this.scoreFurnitureTags(tags,{...meta,tags});
        const count=Number(affinity[meta.placementId]?.count||0),formed=this.preferences?.formed||{},favId=String(formed.favouriteFurniture?.placementId||''),favKinds=formed.favouritesByKind||{};
        score+=this.signatureFurnitureBias(kind,tags,meta);
        if(String(meta.placementId||'')===favId)score+=12;
        for(const fav of Object.values(favKinds)){if(String(fav?.placementId||'')===String(meta.placementId||''))score+=6;}
        if((this.hasTrait('Creature of Habit')||this.hasTrait('Routine Lover')||this.hasTrait('Bed Loyalist')||this.hasTrait('Familiarity Seeker')||this.hasTrait('Routine Companion'))&&count)score+=Math.min(24,count*5);
        if((this.hasTrait('Explorer')||this.hasTrait('Fearless Explorer')||this.hasTrait('Change Lover'))&&count)score-=Math.min(20,count*4);
        if(meta.placementId===recentId)score-=24;
        if(recentIds.slice(-4).includes(String(meta.placementId||'')))score-=8;
        score-=this.recentFurnitureKindPenalty(kind);
        if(careNeed)score+=50;
        if(!simulation)score+=rand(0,10);
        return{meta,kind,score};
      }).filter(x=>x.score>8).sort((a,b)=>b.score-a.score);
      if(!ranked.length)return null;
      // Urgent care should be dependable, and simulations need deterministic ranking.
      if(careNeed||simulation)return ranked[0];
      // For ordinary autonomous life, choose from the best few rather than always taking
      // the mathematical #1. This preserves personality while stopping robotic loops.
      const pool=ranked.slice(0,Math.min(4,ranked.length)),floor=Math.max(0,pool[pool.length-1].score-6),weighted=pool.map(row=>({row,weight:Math.max(1,Math.pow(Math.max(1,row.score-floor),1.18))}));
      let roll=Math.random()*weighted.reduce((sum,v)=>sum+v.weight,0);for(const entry of weighted){roll-=entry.weight;if(roll<=0)return entry.row;}return pool[0];
    }
    furnitureUseRange(meta){const hw=Math.max(.018,Number(meta?.halfWidth||.025)),d=Math.max(.012,Number(meta?.depth||.018));return Math.max(110,Math.min(280,Math.max((hw+.035)*this.map.width,(d+.045)*this.map.height)));}
    furnitureInteractionProfile(meta,kind=''){
      const profile=meta?.interaction;
      if(profile&&Number(profile.version)>=2&&Array.isArray(profile.approaches)){
        // The furniture system owns the geometry. The engine owns behaviour. Keeping those
        // responsibilities separate means every newly-added furnishing can expose the exact
        // same stable interaction contract without teaching the AI about individual sprites.
        return profile;
      }
      return null;
    }
    furnitureApproachDetail(meta,kind=''){
      const profile=this.furnitureInteractionProfile(meta,kind);
      let candidates=[];
      if(profile){
        candidates=profile.approaches.map(a=>({point:[Number(a.x),Number(a.y)],facing:a.facing||'',slot:a.slot||'',priority:Number(a.priority||0)})).filter(a=>a.point.every(Number.isFinite)).sort((a,b)=>b.priority-a.priority);
      }else{
        const hw=Math.max(.018,Number(meta?.halfWidth||.025)),d=Math.max(.012,Number(meta?.depth||.018)),x=Number(meta.x),y=Number(meta.y);if(!Number.isFinite(x)||!Number.isFinite(y))return null;const front={point:[x,y+d+.014],slot:'front',priority:100},left={point:[x-hw-.016,y+.004],slot:'left',priority:70,facing:'right'},right={point:[x+hw+.016,y+.004],slot:'right',priority:70,facing:'left'},rear={point:[x,y-d-.018],slot:'rear',priority:20};candidates=kind==='scratch'?[right,left,front,rear]:[front,left,right,rear];
      }
      for(const candidate of candidates){
        const point=candidate.point;if(!this.engine.isWalkable(this.floorId,point))continue;
        const path=this.engine.findPath(this.floorId,this.pos,point);
        if(path.length||distSrc(this.pos,point,this.map)<18)return{...candidate,point:point.slice(),path,profile};
      }
      return null;
    }
    furnitureApproach(meta,kind=''){const detail=this.furnitureApproachDetail(meta,kind);return detail?.point?detail.point.slice():null;}

ensureBathAudio(){
  if(this.bathAudio)return this.bathAudio;
  try{
    const audio=new Audio('assets/dragonbound/audio/bath-splash-loop.mp3');
    audio.loop=true;audio.preload='auto';audio.volume=.34;
    this.bathAudio=audio;
  }catch(_){this.bathAudio=null;}
  return this.bathAudio;
}
startBathAudio(){
  const audio=this.ensureBathAudio();
  if(!audio)return;
  try{audio.currentTime=0;}catch(_){ }
  const p=audio.play();
  if(p&&typeof p.catch==='function')p.catch(()=>{});
}
stopBathAudio(){
  const audio=this.bathAudio;
  if(!audio)return;
  try{audio.pause();audio.currentTime=0;}catch(_){ }
}

    furnitureUseTiming(meta={},kind='inspect',commanded=false){
      const profile=FURNITURE_USE_TIMINGS[kind]||FURNITURE_USE_TIMINGS.inspect;
      let mult=1;
      if((kind==='sleep'||kind==='rest'||kind==='perch'||kind==='hide'||kind==='warm')&&(this.hasTrait('Sleepy')||this.hasTrait('Professional Napper')||this.hasTrait('Nap Lover')||this.hasTrait('Heavy Sleeper')))mult+=.16;
      if((kind==='sleep'||kind==='rest'||kind==='warm')&&this.hasTrait('Lazy'))mult+=.08;
      if((kind==='play'||kind==='puzzle'||kind==='scratch'||kind==='dig')&&(this.hasTrait('Playful')||this.hasTrait('Toy Obsessed')))mult+=.10;
      if((kind==='wash'||kind==='sandbath')&&(this.hasTrait('Splash Addict')||this.hasTrait('Bath Lover')||this.hasTrait('Water Baby')))mult+=.10;
      if((kind==='eat'||kind==='drink'||kind==='puzzle')&&(this.hasTrait('Food Obsessed')||this.hasTrait('Food Goblin')||this.hasTrait('Greedy')))mult+=.08;
      if((kind==='exercise'||kind==='climb'||kind==='fire'||kind==='roar')&&(this.hasTrait('Competitive')||this.hasTrait('Energetic')||this.hasTrait('Little Athlete')))mult+=.08;
      if((kind==='rest'||kind==='perch'||kind==='warm'||kind==='watch'||kind==='read')&&this.hasTrait('Calm'))mult+=.08;
      if((kind==='play'||kind==='exercise'||kind==='climb'||kind==='scratch')&&this.hasTrait('Easily Excited'))mult+=.06;
      if(this.hasTrait('Impatient'))mult-=.10;
      // Direct commands still feel natural, but avoid turning a requested interaction into
      // the absolute longest possible session. The player can always issue another command.
      if(commanded)mult*=.96;
      const minMs=Number(profile.minMs),maxMs=Number(profile.maxMs);
      const durationMs=clamp(rand(minMs,maxMs)*mult,minMs,maxMs);
      const minCommitMs=Math.min(durationMs-600,Number(profile.minCommitMs||Math.min(4000,minMs*.45)));
      return{durationMs,minMs,maxMs,minCommitMs};
    }
    furnitureUseCreditReady(session=this.furnitureUseSession,force=false){
      if(!session||session.credited)return false;
      const elapsed=Math.max(0,Number(this.physicalInteraction?.elapsedSec||0)*1000);
      const enough=Math.max(1800,Math.min(Number(session.minCommitMs||0),Number(session.durationMs||0)*.45));
      return !!force||elapsed>=enough;
    }
    creditFurnitureUse(session=this.furnitureUseSession,force=false){
      if(!this.furnitureUseCreditReady(session,force))return false;
      session.credited=true;
      if(session.meta)this.recordFurnitureUse(session.meta,session.kind||'inspect');
      return true;
    }
    criticalFurnitureInterruptNeed(session=this.furnitureUseSession,t=now()){
      if(!session||t<Number(session.interruptAfter||Infinity))return null;
      const c=this.careStats(),rows=[
        {need:'hunger',value:c.hunger,critical:10},
        {need:'rest',value:c.energy,critical:10},
        {need:'hygiene',value:c.hygiene,critical:8},
        {need:'stimulation',value:c.fun,critical:8}
      ].filter(row=>row.value<=row.critical).sort((a,b)=>a.value-b.value);
      const urgent=rows[0]||null;
      if(!urgent||!session.meta||this.furnitureSupportsCare(session.meta,urgent.need))return null;
      return urgent;
    }
    physicalSettleDelay(meta={},kind=''){
      if(kind==='sleep')return this.hasTrait('Professional Napper')?850:this.hasTrait('Fussy Sleeper')?1700:1250;
      if(kind==='wash'||kind==='sandbath')return this.hasTrait('Splash Addict')?800:(this.hasTrait('Coward')?1700:1150);
      if(kind==='eat'||kind==='drink')return this.hasTrait('Food Goblin')||this.hasTrait('Greedy')?500:850;
      if(kind==='exercise'||kind==='climb'||kind==='fire'||kind==='roar')return this.hasTrait('Impatient')?500:900;
      return 650;
    }
    physicalClassification(meta={},kind=''){
      const tags=new Set(this.effectiveFurnitureTags(meta)),text=`${meta.name||''} ${meta.itemId||''} ${meta.category||''}`.toLowerCase(),fw=Math.max(1,Number(meta.footprintW||2)),fh=Math.max(1,Number(meta.footprintH||1));
      const sleep=kind==='sleep'||kind==='rest'||tags.has('sleepable'),bath=kind==='wash'||kind==='sandbath'||tags.has('washable'),feeding=kind==='eat'||kind==='drink'||tags.has('food')||tags.has('drink'),puzzle=kind==='puzzle'||tags.has('puzzle'),training=['exercise','climb','fire','roar'].includes(kind)||tags.has('training')||tags.has('exercise')||tags.has('agility')||tags.has('flight-practice')||tags.has('fire-practice');
      const rollable=/\bball\b|roller|rolling/.test(text)&&!sleep&&!bath;
      const openable=/cupboard|cabinet|chest|wardrobe|pantry|toy box|storage box|basket/.test(text)&&!meta.wallMounted;
      const toy=kind==='play'||tags.has('playable')||tags.has('chewable')||tags.has('tug')||tags.has('hoardable');
      const carryable=toy&&!rollable&&!sleep&&!bath&&!training&&!feeding&&fw<=2&&fh<=1&&!/table|bench|station|shelf|rack|machine|platform|pool|fountain/.test(text);
      return{sleep,bath,feeding,puzzle,training,rollable,openable,toy,carryable,mountable:sleep||bath||kind==='perch'||kind==='hide'||kind==='climb'};
    }
    furnitureRuntimeElement(meta={}){
      const id=String(meta.placementId||'');if(!id)return null;
      try{return document.querySelector(`.dragonbound-furniture-placement[data-placement-id="${CSS.escape(id)}"]`);}catch(_){return null;}
    }
    startPhysicalInteraction(meta={},kind='',durationMs=10000,settleMs=650){
      // Preserve the mount target calculated for the NEW bed/bath before cleaning up
      // any previous physical interaction. V32.93 cleared this here, leaving dragons
      // standing in front of beds and baths even though their state said they were using them.
      const requestedMountTarget=Array.isArray(this.physicalMountTarget)?this.physicalMountTarget.slice():null;
      this.finishPhysicalInteraction();this.physicalMountTarget=requestedMountTarget;
      const flags=this.physicalClassification(meta,kind),el=this.furnitureRuntimeElement(meta),obs=this.memory.observationCounters||(this.memory.observationCounters={});
      let carryTarget=null,carryOrigin=this.pos.slice(),activityTarget=null,activityOrigin=this.pos.slice();
      const floor=this.map.floors.find(f=>f.id===this.floorId),safeNodes=(floor?.navigationNodes||[]).filter(p=>this.engine.isWalkable(this.floorId,p)&&this.engine.lineClear(this.pos,p,this.floorId));
      if(flags.carryable){const candidates=safeNodes.map(p=>({p,d:distSrc(this.pos,p,this.map)})).filter(v=>v.d>55&&v.d<175).sort((a,b)=>a.d-b.d);if(candidates.length)carryTarget=choose(candidates.slice(0,Math.min(5,candidates.length))).p.slice();}
      if(flags.training&&!this.physicalMountTarget){const candidates=safeNodes.map(p=>({p,d:distSrc(this.pos,p,this.map)})).filter(v=>v.d>35&&v.d<115).sort((a,b)=>a.d-b.d);if(candidates.length)activityTarget=choose(candidates.slice(0,Math.min(5,candidates.length))).p.slice();}
      const entryOrigin=this.pos.slice();
      this.physicalInteraction={meta:{placementId:meta.placementId,itemId:meta.itemId,name:meta.name},kind,flags,durationSec:Math.max(1,durationMs/1000),elapsedSec:0,settleSec:Math.max(0,settleMs/1000),mountTarget:this.physicalMountTarget?this.physicalMountTarget.slice():null,mountOrigin:entryOrigin,mounted:false,carryOrigin,carryTarget,activityOrigin,activityTarget};
      // V32.96: mount-style furniture is resolved BEFORE the first interaction frame.
      // Previously the settling animation began at the approach point on the floor and only
      // moved onto the bed/bath after the settle delay, producing a very visible snap.
      // Care/skill timers still wait for settleSec; only the visual position is corrected here.
      if(this.physicalInteraction.mountTarget){
        this.pos=this.physicalInteraction.mountTarget.slice();
        this.furnitureMounted=true;
        this.physicalInteraction.mounted=true;
      }
      this.physicalFurnitureEl=el||null;if(el){el.classList.add('is-dragon-occupied',`is-physical-${kind}`);if(flags.openable)el.classList.add('is-runtime-open');if(flags.rollable){el.classList.add('is-runtime-rolling');el.style.setProperty('--dragon-roll-x',`${Math.round(rand(-18,18))}px`);el.style.setProperty('--dragon-roll-rot',`${Math.round(rand(-14,14))}deg`);}}
      try{window.DragonboundFurniture?.setInteractionMask?.(meta.placementId,true,kind);}catch(_e){}
      if(this.el){this.el.classList.add('is-physical-interaction');if(this.furnitureMounted)this.el.classList.add('is-physical-mounted');this.el.dataset.physicalKind=kind;this.el.dataset.physicalPhase='settling';}
      if(this.physicalInteraction.mountTarget)this.render(true);
      const sourceImg=el?.querySelector('img');
      if(flags.carryable&&sourceImg?.src&&this.el){const prop=document.createElement('img');prop.className='dragonbound-carried-object';prop.alt='';prop.src=sourceImg.src;prop.setAttribute('aria-hidden','true');this.el.appendChild(prop);this.physicalProp=prop;el.classList.add('is-runtime-carried');obs.objectsCarried=(Number(obs.objectsCarried)||0)+1;this.rememberLifeEvent('first','First toy carried',`${this.dragon?.name||'Your dragon'} proudly picked up ${meta.name||'a little toy'}.`,'first-object-carried');}
      if(flags.rollable){obs.ballsChased=(Number(obs.ballsChased)||0)+1;}
      if(flags.openable){obs.cupboardsInvestigated=(Number(obs.cupboardsInvestigated)||0)+1;this.rememberLifeEvent('first','First cupboard investigation',`A suspicious amount of interest was shown in ${meta.name||'a storage spot'}.`,'first-openable');}
      if(flags.puzzle)obs.puzzleInteractions=(Number(obs.puzzleInteractions)||0)+1;
      if(flags.training)obs.physicalTrainingSessions=(Number(obs.physicalTrainingSessions)||0)+1;
      if(this.el&&(flags.bath||flags.feeding||flags.puzzle||flags.training||kind==='fire'||kind==='roar')){const fx=document.createElement('span');fx.className=`dragonbound-physical-effects dragonbound-physical-effects--${flags.bath?'bath':kind==='fire'?'fire':flags.feeding?'feeding':flags.puzzle?'puzzle':'training'}`;fx.setAttribute('aria-hidden','true');fx.innerHTML='<i></i><i></i><i></i><i></i><i></i><i></i>';this.el.appendChild(fx);this.physicalEffects=fx;}
      this.behaviourDirty=true;return this.physicalInteraction;
    }
    updatePhysicalInteraction(dt){
      const plan=this.physicalInteraction;if(!plan)return;plan.elapsedSec=Math.min(plan.durationSec,plan.elapsedSec+Math.max(0,Number(dt)||0));
      const lockedFacing=this.furnitureUseSession?.lockedFacing;if(lockedFacing&&!plan.flags?.carryable&&!plan.flags?.training)this.facing=lockedFacing;
      this.creditFurnitureUse(this.furnitureUseSession,false);
      if(this.el&&plan.elapsedSec>=plan.settleSec){this.el.dataset.physicalPhase='engaged';this.el.classList.add('is-physical-engaged');if(plan.flags?.bath&&!plan.bathAudioStarted){plan.bathAudioStarted=true;this.startBathAudio();}}
      if(plan.mountTarget&&!plan.mounted&&plan.elapsedSec>=plan.settleSec){const from=Array.isArray(plan.mountOrigin)?plan.mountOrigin:this.pos,climbSec=.68,u=clamp((plan.elapsedSec-plan.settleSec)/climbSec,0,1),ease=u*u*(3-2*u);this.pos=[from[0]+(plan.mountTarget[0]-from[0])*ease,from[1]+(plan.mountTarget[1]-from[1])*ease];if(u>=1){this.furnitureMounted=true;plan.mounted=true;this.el?.classList.add('is-physical-mounted');}}
      if(plan.flags?.carryable&&this.el&&plan.elapsedSec>=plan.settleSec+1){this.el.classList.add('is-carrying-object');if(plan.carryTarget&&plan.carryOrigin){const activeSpan=Math.max(.5,plan.durationSec-plan.settleSec-1),u=clamp((plan.elapsedSec-plan.settleSec-1)/activeSpan,0,1),there=plan.carryOneWay?u:(u<=.5?u*2:(1-u)*2);this.pos=[plan.carryOrigin[0]+(plan.carryTarget[0]-plan.carryOrigin[0])*there,plan.carryOrigin[1]+(plan.carryTarget[1]-plan.carryOrigin[1])*there];if(Math.abs(plan.carryTarget[0]-plan.carryOrigin[0])>.002)this.facing=(u<=.5?(plan.carryTarget[0]>=plan.carryOrigin[0]):(plan.carryTarget[0]<plan.carryOrigin[0]))?'right':'left';}}
      if(plan.flags?.training&&!plan.mountTarget&&plan.activityTarget&&plan.activityOrigin&&plan.elapsedSec>=plan.settleSec){const activeSpan=Math.max(.5,plan.durationSec-plan.settleSec),u=clamp((plan.elapsedSec-plan.settleSec)/activeSpan,0,1),cycles=plan.kind==='exercise'?3:2,there=(1-Math.cos(u*Math.PI*2*cycles))/2;this.pos=[plan.activityOrigin[0]+(plan.activityTarget[0]-plan.activityOrigin[0])*there,plan.activityOrigin[1]+(plan.activityTarget[1]-plan.activityOrigin[1])*there];if(Math.abs(plan.activityTarget[0]-plan.activityOrigin[0])>.002)this.facing=(Math.sin(u*Math.PI*2*cycles)>=0?(plan.activityTarget[0]>=plan.activityOrigin[0]):(plan.activityTarget[0]<plan.activityOrigin[0]))?'right':'left';}
      if(plan.flags?.rollable&&this.physicalFurnitureEl&&plan.elapsedSec>=plan.settleSec)this.physicalFurnitureEl.classList.add('is-runtime-rolling-active');
    }
    finishPhysicalInteraction(){
      const active=this.physicalInteraction;if(active?.flags?.carryable&&Array.isArray(active.carryOrigin)&&!this.furnitureMounted&&!active.carryOneWay)this.pos=active.carryOrigin.slice();else if(active?.flags?.training&&Array.isArray(active.activityOrigin)&&!this.furnitureMounted)this.pos=active.activityOrigin.slice();
      try{if(active?.meta?.placementId)window.DragonboundFurniture?.setInteractionMask?.(active.meta.placementId,false,active.kind||'');}catch(_e){}
      const el=this.physicalFurnitureEl;if(el){el.classList.remove('is-dragon-occupied','is-runtime-open','is-runtime-rolling','is-runtime-rolling-active','is-runtime-carried');for(const c of [...el.classList])if(c.startsWith('is-physical-'))el.classList.remove(c);el.style.removeProperty('--dragon-roll-x');el.style.removeProperty('--dragon-roll-rot');}
      if(this.el){this.el.classList.remove('is-physical-interaction','is-physical-engaged','is-carrying-object','is-physical-mounted');delete this.el.dataset.physicalKind;delete this.el.dataset.physicalPhase;}
      this.physicalProp?.remove();this.physicalEffects?.remove();this.physicalProp=null;this.physicalEffects=null;this.physicalFurnitureEl=null;this.physicalMountTarget=null;this.physicalInteraction=null;
    }

    furnitureUsePosition(meta,kind){
      const profile=this.furnitureInteractionProfile(meta,kind),use=profile?.use;
      if(use&&use.mounted!==false&&Number.isFinite(Number(use.x))&&Number.isFinite(Number(use.y)))return[Number(use.x),Number(use.y)];
      if(!meta||meta.wallMounted)return null;const x=Number(meta.x),y=Number(meta.y);if(!Number.isFinite(x)||!Number.isFinite(y))return null;
      const fpH=Math.max(1,Number(meta.footprintH||1)),scale=clamp(Number(meta.scale||1),.55,1.6);
      let lift=0;
      if(kind==='sleep')lift=Math.min(.034, (.014+.0045*fpH)*scale);
      else if(kind==='wash')lift=Math.min(.030, (.013+.004*fpH)*scale);
      else if(kind==='sandbath')lift=Math.min(.026, (.012+.004*fpH)*scale);
      else if(kind==='perch')lift=Math.min(.034, (.018+.005*fpH)*scale);
      else if(kind==='hide')lift=Math.min(.030, (.015+.0045*fpH)*scale);
      else if(kind==='rest')lift=Math.min(.030, (.015+.0045*fpH)*scale);
      if(!lift)return null;
      return [x,y-lift];
    }
    furnitureUseFacing(meta,kind,approachFacing=''){
      const profile=this.furnitureInteractionProfile(meta,kind),f=String(profile?.use?.facing||approachFacing||'');
      return f==='left'||f==='right'?f:'';
    }
    finishFurnitureUse(reason='complete'){
      if(this.furnitureMounted&&Array.isArray(this.furnitureExitPos))this.pos=this.furnitureExitPos.slice();
      const session=this.furnitureUseSession,recoveryKind=this.furniturePlan?.kind||session?.kind,careProgress=this.furnitureCarePlan?.durationSec?Number(this.furnitureCarePlan.elapsedSec||0)/Number(this.furnitureCarePlan.durationSec||1):0;
      this.creditFurnitureUse(session,reason==='complete');
      if(session&&reason!=='complete'&&!session.credited){const obs=this.memory.observationCounters||(this.memory.observationCounters={});obs.shortFurnitureInterrupts=(Number(obs.shortFurnitureInterrupts)||0)+1;}
      if((recoveryKind==='sleep'||recoveryKind==='rest')&&careProgress>=.65){for(const entry of Object.values(this.memory.skillFatigue||{})){entry.streak=Math.max(0,Number(entry.streak||0)-2);entry.lastAt=Math.max(0,Number(entry.lastAt||0)-12*60*1000);}}
      this.stopBathAudio();this.finishSkillTraining();this.finishPhysicalInteraction();
      this.furnitureMounted=false;this.furnitureExitPos=null;this.furnitureDepthY=null;this.furniturePlan=null;this.furnitureCarePlan=null;this.furnitureUseSession=null;if(this.currentLifeEvent?.targetPlacementId)this.finishDailyLifeEvent();
      if(this.el){delete this.el.dataset.furnitureInteraction;delete this.el.dataset.furnitureLabel;delete this.el.dataset.furnitureKind;delete this.el.dataset.furniturePlacementId;delete this.el.dataset.furnitureFacing;delete this.el.dataset.furnitureCommitment;}
    }
    startFurnitureInteraction(){const careNeed=this.pendingCareNeed||'',pick=this.bestFurnitureCandidate(false,careNeed);this.pendingCareNeed='';if(!pick)return false;const kind=this.furnitureKind(pick.meta),detail=this.furnitureApproachDetail(pick.meta,kind);if(!detail?.point)return false;const approach=detail.point;this.furniturePlan={meta:pick.meta,kind,approach:approach.slice(),approachFacing:detail.facing||'',interactionSlot:detail.slot||'',careNeed};if(distSrc(this.pos,approach,this.map)<18){this.pos=approach.slice();return this.beginFurnitureUse();}const started=this.startWalk(approach,'furniture-approach');if(!started)this.furniturePlan=null;return started;}
    startStairsToFloor(targetFloor){
      if(!targetFloor||targetFloor===this.floorId)return false;
      const options=this.map.stairConnections.map(stair=>{
        if(stair.fromFloor===this.floorId&&stair.toFloor===targetFloor)return{stair,up:true,entrance:stair.entrancePoint};
        if(stair.toFloor===this.floorId&&stair.fromFloor===targetFloor)return{stair,up:false,entrance:stair.exitPoint};
        return null;
      }).filter(Boolean).map(o=>({...o,path:this.engine.findPath(this.floorId,this.pos,o.entrance)})).filter(o=>o.path.length).sort((a,b)=>distSrc(this.pos,a.entrance,this.map)-distSrc(this.pos,b.entrance,this.map));
      const pick=options[0];if(!pick)return false;
      this.stairPlan={stair:pick.stair,up:pick.up,phase:'approach',commanded:true};this.path=pick.path;this.pathIndex=0;this.setState('approachingStairs');return true;
    }
    continueFurnitureCommand(){
      const cmd=this.commandedFurniture;if(!cmd?.meta)return false;
      if(this.floorId!==cmd.meta.roomId)return this.startStairsToFloor(cmd.meta.roomId);
      const detail=this.furnitureApproachDetail(cmd.meta,cmd.kind);if(!detail?.point)return false;const approach=detail.point;
      this.furniturePlan={meta:cmd.meta,kind:cmd.kind,approach:approach.slice(),approachFacing:detail.facing||'',interactionSlot:detail.slot||'',commanded:true};
      if(distSrc(this.pos,approach,this.map)<18){this.pos=approach.slice();const started=this.beginFurnitureUse();if(started)this.commandedFurniture=null;else this.furniturePlan=null;return started;}
      const started=this.startWalk(approach,'furniture-command-approach');if(!started)this.furniturePlan=null;return started;
    }
    commandFurniture(meta){
      if(!meta?.placementId||!meta?.roomId)return false;
      if(String(this.state).startsWith('furniture'))this.finishFurnitureUse('player-command');
      const effectiveTags=this.effectiveFurnitureTags(meta);this.commandedFurniture={meta:{...meta,tags:effectiveTags},kind:this.furnitureKind({...meta,tags:effectiveTags})};
      this.nextDecision=now()+60000;this.stateUntil=0;this.pendingDestination=null;this.pendingMoveMode='';this.pendingCareNeed='';this.walkSpeedBoost=1;this.pendingFlightZone=null;this.flightPlan=null;this.furniturePlan=null;
      // Never snap a dragon off the visible staircase. If it is already climbing,
      // queue the command and continue from whichever landing it reaches.
      if(this.state==='climbingStairs')return true;
      this.path=[];this.pathIndex=0;this.stairPlan=null;
      if(this.continueFurnitureCommand())return true;
      this.commandedFurniture=null;this.setState('looking',1800);this.nextDecision=now()+2600;return false;
    }
    beginFurnitureUse(){
      const plan=this.furniturePlan;if(!plan?.meta)return false;const meta=plan.meta,kind=plan.kind;const furniturePos=[Number(meta.x),Number(meta.y)];if(!furniturePos.every(Number.isFinite)||distSrc(this.pos,furniturePos,this.map)>this.furnitureUseRange(meta)){this.furniturePlan=null;return false;}const specifiedFacing=this.furnitureUseFacing(meta,kind,plan.approachFacing);this.facing=specifiedFacing||(furniturePos[0]>=this.pos[0]?'right':'left');
      this.furnitureExitPos=Array.isArray(plan.approach)?plan.approach.slice():this.pos.slice();const usePos=this.furnitureUsePosition(meta,kind);this.physicalMountTarget=usePos?usePos.slice():null;this.furnitureMounted=false;this.furnitureDepthY=Number(meta.y);
      let state='furnitureInspect',label=`Investigating ${meta.name||'furniture'}`,care={stimulation:-12};
      if(kind==='sleep'){state='furnitureSleep';label='Curling up for a proper nap';care={rest:-42,comfort:-20};}
      else if(kind==='rest'){state='furnitureRest';label='Settling down to rest';care={rest:-20,comfort:-20};}
      else if(kind==='perch'){state='furniturePerch';label='Perching proudly';care={comfort:-14,stimulation:-8};}
      else if(kind==='play'){state='furniturePlay';label='Playing for a while';care={stimulation:-40,social:-4,rest:6};}
      else if(kind==='puzzle'){state='furniturePlay';label='Working through the treat puzzle';care={stimulation:-28,hunger:-18};}
      else if(kind==='eat'){state='furnitureInspect';label='Settling down for a snack';care={hunger:-40,comfort:-6};}
      else if(kind==='drink'){state='furnitureInspect';label='Taking a proper drink';care={hunger:-14,comfort:-6};}
      else if(kind==='wash'||kind==='sandbath'){state=kind==='sandbath'?'furnitureSandbath':'furnitureWash';label=kind==='sandbath'?'Rolling around in the cleaning sand':'Having a proper splash in the bath';care={hygiene:kind==='sandbath'?-42:-52,comfort:-16,stimulation:-7};}
      else if(kind==='groom'){state='furnitureGroom';label='Taking time to groom scales';care={hygiene:-34,comfort:-18};}
      else if(kind==='exercise'){state='furnitureExercise';label='Training hard';care={stimulation:-30,rest:10,hygiene:5};}
      else if(kind==='roar'){state='furnitureRoar';label='Practising a few proper roars';care={stimulation:-20,rest:5};}
      else if(kind==='fire'){state='furnitureFire';label='Practising tiny flames';care={stimulation:-20,rest:6};}
      else if(kind==='scratch'){state='furnitureScratch';label='Working over the scratch post';care={stimulation:-23,comfort:-9};}
      else if(kind==='dig'){state='furniturePlay';label='Digging enthusiastically';care={stimulation:-28,rest:6};}
      else if(kind==='climb'){state='furnitureExercise';label='Clambering around';care={stimulation:-24,rest:8};}
      else if(kind==='hide'){state='furnitureHide';label='Hiding away for some quiet time';care={comfort:-22,rest:-9};}
      else if(kind==='warm'){state='furnitureWarm';label='Basking in the warmth';care={comfort:-20,rest:-10};}
      else if(kind==='watch'){state='furnitureInspect';label='Watching the world outside';care={stimulation:-13};}
      else if(kind==='read'){state='furnitureInspect';label='Poking through the books';care={stimulation:-15};}
      else if(kind==='mirror'){state='furnitureInspect';label='Inspecting the reflection';care={stimulation:-9};}
      else if(kind==='sniff'){state='furnitureInspect';label='Sniffing curiously';care={stimulation:-11};}
      else if(kind==='toilet'){state='furnitureInspect';label='Using the litter station';care={comfort:-9};}

      const timing=this.furnitureUseTiming(meta,kind,!!plan.commanded);
      let duration=timing.durationMs;
      if(['exercise','climb','fire','roar','puzzle','read','inspect'].includes(kind)){
        duration=this.trainingDurationFor(meta,kind,duration);
        duration=clamp(duration,timing.minMs,timing.maxMs);
      }
      timing.durationMs=duration;timing.minCommitMs=Math.min(timing.minCommitMs,Math.max(1000,duration-600));
      if((kind==='wash'||kind==='sandbath')&&this.hasTrait('Splash Addict'))care.stimulation=Number(care.stimulation||0)-4;
      const settleMs=this.physicalSettleDelay(meta,kind),activeMs=Math.max(1200,duration-settleMs),startedAt=now();
      this.furnitureUseSession={meta:{...meta},kind,state,label,durationMs:duration,minCommitMs:timing.minCommitMs,startedAt,interruptAfter:startedAt+timing.minCommitMs,lockedFacing:this.facing,commanded:!!plan.commanded,credited:false};
      this.startFurnitureCare(activeMs,care);this.startSkillTraining(activeMs,meta,kind);this.startPhysicalInteraction(meta,kind,duration,settleMs);
      this.setState(state,duration);if(this.el){this.el.dataset.furnitureInteraction='1';this.el.dataset.furnitureLabel=label;this.el.dataset.furnitureKind=kind;this.el.dataset.furniturePlacementId=String(meta.placementId||'');this.el.dataset.furnitureFacing=this.facing;this.el.dataset.furnitureCommitment=String(Math.round(timing.minCommitMs));}
      this.maybeShowDragonThought('furniture',{meta,kind,commanded:!!plan.commanded});
      if(plan.commanded&&!this.currentLifeEvent&&['sleep','rest','play','puzzle','eat','drink','wash','sandbath','groom','exercise','scratch','warm'].includes(kind)){this.awardBond(`guided-${kind}`,.28,8*60*1000);this.noteKeeperRelationship?.('guided-activity',{kind,label:`Shared ${kind}`,detail:meta?.name||''});}
      this.behaviourDirty=true;this.engine.saveBehaviourLocal?.();this.engine.updateNeedsHud(true);this.nextDecision=startedAt+duration+rand(2500,6500);return true;
    }
    furnitureFavouriteGroup(kind=''){
      return kind==='sleep'||kind==='rest'||kind==='perch'?'bed':kind==='play'||kind==='puzzle'||kind==='scratch'||kind==='dig'?'toy':kind==='wash'||kind==='sandbath'||kind==='groom'?'bath':kind==='exercise'||kind==='climb'||kind==='fire'||kind==='roar'?'training':kind==='eat'||kind==='drink'?'feeding':'';
    }
    favouriteFormationThreshold(group='overall'){
      let threshold=group==='overall'?5:4;
      const steady=this.hasTrait('Creature of Habit')||this.hasTrait('Routine Lover')||this.hasTrait('Routine Companion')||this.hasTrait('Familiarity Seeker');
      const changeable=this.hasTrait('Curious')||this.hasTrait('Explorer')||this.hasTrait('Change Lover')||this.hasTrait('Adventurous');
      if(group==='bed'&&(this.hasTrait('Lazy')||this.hasTrait('Sleepy')||this.hasTrait('Bed Loyalist')||this.hasTrait('Professional Napper')||this.hasTrait('Nap Lover')))threshold-=1;
      if(group==='toy'&&(this.hasTrait('Playful')||this.hasTrait('Toy Obsessed')||this.hasTrait('Gentle Player')))threshold-=1;
      if(group==='feeding'&&(this.hasTrait('Food Obsessed')||this.hasTrait('Greedy')||this.hasTrait('Foodie')||this.hasTrait('Always Hungry')))threshold-=1;
      if(steady)threshold-=group==='overall'?0:1;
      if(changeable)threshold+=1;
      return Math.max(3,Math.min(7,threshold));
    }
    favouriteSwitchMargin(group='overall'){
      let margin=2.4;
      if(this.hasTrait('Curious')||this.hasTrait('Explorer')||this.hasTrait('Change Lover'))margin-=.7;
      if(this.hasTrait('Creature of Habit')||this.hasTrait('Routine Lover')||this.hasTrait('Routine Companion')||this.hasTrait('Familiarity Seeker'))margin+=1.0;
      if(group==='bed'&&(this.hasTrait('Lazy')||this.hasTrait('Sleepy')||this.hasTrait('Bed Loyalist')||this.hasTrait('Professional Napper')))margin+=1.0;
      if(group==='toy'&&this.hasTrait('Toy Obsessed'))margin+=.55;
      return Math.max(1.25,margin);
    }
    furniturePreferenceScore(row={}){
      const count=Math.max(0,Number(row.count)||0),recent=Math.max(0,Number(row.preferenceScore)||0);
      return recent+Math.min(5,count*.35);
    }
    reconcileFurnitureFavourites(liveIds){
      if(!(liveIds instanceof Set))return;
      let changed=false;
      const affinity=this.memory.furnitureAffinity||{};
      for(const id of Object.keys(affinity)){if(!liveIds.has(String(id))){delete affinity[id];changed=true;}}
      this.memory.furnitureAffinity=affinity;
      const favs=this.memory.furnitureFavourites||{};
      for(const [group,row] of Object.entries(favs)){if(row?.placementId&&!liveIds.has(String(row.placementId))){delete favs[group];changed=true;}}
      this.memory.furnitureFavourites=favs;
      this.preferences.formed=this.preferences.formed||{};
      const overall=this.preferences.formed.favouriteFurniture;
      if(overall?.placementId&&(!liveIds.has(String(overall.placementId))||Number(overall.count||0)<this.favouriteFormationThreshold('overall'))){delete this.preferences.formed.favouriteFurniture;changed=true;}
      const byKind=this.preferences.formed.favouritesByKind||{};
      for(const [group,row] of Object.entries(byKind)){if(row?.placementId&&(!liveIds.has(String(row.placementId))||Number(row.count||0)<this.favouriteFormationThreshold(group))){delete byKind[group];delete this.memory.furnitureFavourites[group];changed=true;}}
      this.preferences.formed.favouritesByKind=byKind;
      if(changed)this.behaviourDirty=true;
    }
    updateFurnitureFavourites(id,meta,kind,prev){
      this.preferences.formed=this.preferences.formed||{};
      const affinity=this.memory.furnitureAffinity||{},group=this.furnitureFavouriteGroup(kind),nowMs=Date.now();
      const rows=Object.entries(affinity).map(([placementId,row])=>({placementId,row,score:this.furniturePreferenceScore(row)})).sort((a,b)=>b.score-a.score);
      const choose=(current,candidate,scope)=>{
        if(!candidate||Number(candidate.row?.count||0)<this.favouriteFormationThreshold(scope))return current||null;
        const record={placementId:candidate.placementId,itemId:candidate.row.itemId,name:candidate.row.name,count:Number(candidate.row.count||0),interaction:candidate.row.lastKind||'',score:+candidate.score.toFixed(2),sinceAt:Number(current?.placementId===candidate.placementId?current.sinceAt:nowMs)||nowMs,updatedAt:nowMs};
        if(!current||!current.placementId)return record;
        if(String(current.placementId)===String(candidate.placementId))return record;
        const currentRow=affinity[String(current.placementId)]||{},currentScore=this.furniturePreferenceScore(currentRow);
        return candidate.score>=currentScore+this.favouriteSwitchMargin(scope)?record:current;
      };
      const currentOverall=this.preferences.formed.favouriteFurniture||null,nextOverall=choose(currentOverall,rows[0]||null,'overall');
      if(nextOverall){
        const changed=!currentOverall||String(currentOverall.placementId)!==String(nextOverall.placementId);
        this.preferences.formed.favouriteFurniture=nextOverall;
        const universe=this.personalityUniverse||this.ensurePersonalityUniverse();
        if(universe.furnitureRelations?.[nextOverall.placementId])universe.furnitureRelations[nextOverall.placementId].stage='favourite';
        if(changed){
          this.rememberLifeEvent('favourite',`New favourite place: ${nextOverall.name||'furniture'}`,'They keep choosing this furnishing again and again.',`favourite-${nextOverall.placementId}-${Math.floor(nowMs/86400000)}`);
          const thoughtKey=`favourite:${nextOverall.placementId}`;if(!this.memory.thoughtMilestones?.[thoughtKey]&&this.maybeShowDragonThought('favourite-discovered',{placementId:nextOverall.placementId,name:nextOverall.name,force:true})){this.memory.thoughtMilestones[thoughtKey]=nowMs;this.behaviourDirty=true;}else this.personalityExpression('♥','new favourite','favourite');
        }
      }
      if(group){
        const groupRows=rows.filter(entry=>this.furnitureFavouriteGroup(String(entry.row?.lastKind||''))===group);
        const byKind=this.preferences.formed.favouritesByKind||(this.preferences.formed.favouritesByKind={}),current=byKind[group]||null,next=choose(current,groupRows[0]||null,group);
        if(next)byKind[group]=next;
        if(next)this.memory.furnitureFavourites[group]=next;
      }
    }
    recordFurnitureUse(meta,kind){
      const obs=this.memory.observationCounters||(this.memory.observationCounters={}),aff=this.memory.furnitureAffinity||(this.memory.furnitureAffinity={}),id=String(meta.placementId||meta.itemId||'furniture'),prev=aff[id]||{count:0,itemId:meta.itemId,name:meta.name};
      const changeable=this.hasTrait('Curious')||this.hasTrait('Explorer')||this.hasTrait('Change Lover'),steady=this.hasTrait('Creature of Habit')||this.hasTrait('Routine Lover')||this.hasTrait('Routine Companion')||this.hasTrait('Familiarity Seeker'),decay=changeable ? .94 : (steady ? .985 : .97);
      for(const [otherId,row] of Object.entries(aff)){if(String(otherId)!==id)row.preferenceScore=Math.max(0,Number(row.preferenceScore||Math.min(5,Number(row.count||0)*.32))*decay);}
      prev.count=Number(prev.count||0)+1;prev.preferenceScore=Math.min(30,Number(prev.preferenceScore||Math.min(5,(prev.count-1)*.32))*.93+1.35);prev.itemId=meta.itemId;prev.name=meta.name;prev.lastUsedAt=Date.now();prev.lastKind=kind;aff[id]=prev;
      this.memory.furnitureAffinity=Object.fromEntries(Object.entries(aff).sort((a,b)=>this.furniturePreferenceScore(b[1])-this.furniturePreferenceScore(a[1])).slice(0,16));
      obs.furnitureInteractions=(Number(obs.furnitureInteractions)||0)+1;
      const counterMap={play:'toyPlays',puzzle:'puzzleUses',sleep:'bedSleeps',rest:'furnitureRests',perch:'perchUses',wash:'bathUses',sandbath:'bathUses',groom:'groomingUses',eat:'feedingUses',drink:'drinkUses',exercise:'trainingUses',roar:'roarPracticeUses',fire:'firePracticeUses',scratch:'scratchUses',dig:'digUses',climb:'climbUses',hide:'hideUses',warm:'warmRestUses',watch:'windowWatches',read:'readingUses',mirror:'mirrorUses',sniff:'sniffUses',toilet:'toiletUses',inspect:'inspectionUses'};
      const ck=counterMap[kind]||'inspectionUses';obs[ck]=(Number(obs[ck])||0)+1;if(kind==='sleep')this.noteSleepLocation();
      this.memory.recentFurnitureKinds=[...(Array.isArray(this.memory.recentFurnitureKinds)?this.memory.recentFurnitureKinds:[]),kind].slice(-6);
      this.memory.recentFurnitureIds=[...(Array.isArray(this.memory.recentFurnitureIds)?this.memory.recentFurnitureIds:[]),id].slice(-6);
      const tags=new Set(this.effectiveFurnitureTags(meta));
      if(tags.has('hoardable'))obs.hoardableUses=(Number(obs.hoardableUses)||0)+1;
      if(tags.has('window'))obs.windowWatches=(Number(obs.windowWatches)||0)+1;
      if(tags.has('warm'))obs.warmRestUses=(Number(obs.warmRestUses)||0)+1;
      if(tags.has('expensive'))obs.expensiveFurnitureUses=(Number(obs.expensiveFurnitureUses)||0)+1;
      // V33.80: familiarity belongs to the individual dragon and grows from real use.
      const universe=this.personalityUniverse||this.ensurePersonalityUniverse(),relations=universe.furnitureRelations||(universe.furnitureRelations={}),rel=relations[id]||{itemId:meta.itemId,name:meta.name,count:0,stage:'noticed',firstAt:Date.now()};rel.count=prev.count;rel.name=meta.name||rel.name;rel.itemId=meta.itemId||rel.itemId;rel.lastAt=Date.now();rel.stage=prev.count>=6?'liked':prev.count>=2?'familiar':'noticed';relations[id]=rel;
      let dislikeReason='';if(prev.count>=2){if(this.hasTrait('Bath Hater')&&(tags.has('washable')||tags.has('sandbath')))dislikeReason='Still deeply unconvinced by this bathing spot.';else if((this.hasTrait('Shy')||this.hasUniverseQuirk('noise-avoid'))&&tags.has('noisy'))dislikeReason='Seems to prefer quieter furnishings.';else if(this.hasUniverseQuirk('simple-taste')&&tags.has('expensive'))dislikeReason='Apparently price is not persuasive.';else if(this.hasTrait('Suspicious of New Food')&&(tags.has('food')||tags.has('drink')))dislikeReason='Approaches this feeding spot with persistent suspicion.';}
      if(dislikeReason){universe.dislikes=boundedObject(universe.dislikes,{});universe.dislikes[id]={name:meta.name||'A furnishing',reason:dislikeReason,at:Date.now()};rel.stage='wary';}
      this.lastFurnitureInteraction=Date.now();this.memory.lastFurnitureInteractionAt=this.lastFurnitureInteraction;this.memory.lastFurniturePlacementId=id;this.markLifeFurnitureUsed(meta);
      if(kind==='sleep')this.rememberLifeEvent('first','First furniture nap',`Curled up in ${meta.name||'a cosy bed'}.`,'first-furniture-sleep');
      else if(kind==='wash'||kind==='sandbath')this.rememberLifeEvent('first','First proper bath',`Had a good clean using ${meta.name||'a bathing spot'}.`,'first-bath');
      else if(kind==='puzzle'){this.rememberLifeEvent('skill','First puzzle completed',`Worked through ${meta.name||'a puzzle'} and learned something from it.`,'first-puzzle');this.rememberLifeEvent('first','First favourite game',`Started playing with ${meta.name||'a toy'}.`,'first-play');}
      else if(kind==='play')this.rememberLifeEvent('first','First favourite game',`Started playing with ${meta.name||'a toy'}.`,'first-play');
      else if(kind==='fire'){this.rememberLifeEvent('skill','First fire practice',`Practised careful little flames at ${meta.name||'a fire-control station'}.`,'first-fire-practice');this.rememberLifeEvent('first','First training session',`Tried out ${meta.name||'some training equipment'}.`,'first-training');}
      else if(kind==='exercise'||kind==='climb')this.rememberLifeEvent('first','First training session',`Tried out ${meta.name||'some training equipment'}.`,'first-training');
      else if(kind==='eat'||kind==='drink')this.rememberLifeEvent('first','First home snack',`Stopped for ${kind==='drink'?'a drink':'a snack'} at ${meta.name||'a feeding station'}.`,'first-feeding');
      this.updateFurnitureFavourites(id,meta,kind,prev);
      this.noteUniverseActivity(`furniture:${kind}`,meta);this.behaviourDirty=true;this.discoverTraits();
    }
    queueRaceReaction(detail={}){
      const position=Math.max(1,Math.min(6,Number(detail.finishPosition)||6));
      this.memory.pendingRaceReaction={position,won:detail.won===true||position===1,trackId:String(detail.trackId||''),at:Date.now()};
      this.behaviourDirty=true;this.engine.saveBehaviourLocal?.();this.engine.saveBehaviour?.(true);
    }
    playPendingRaceReaction(){
      const r=this.memory?.pendingRaceReaction;if(!r)return false;
      if(this.currentLifeEvent||String(this.state).startsWith('furniture')||['walking','flying','takingOff','landing','climbingStairs'].includes(this.state))return false;
      delete this.memory.pendingRaceReaction;const won=!!r.won,name=this.dragon?.name||'Your dragon';
      this.maybeShowDragonThought('race',{won,position:r.position,trackId:r.trackId,force:true});
      if(won&&(this.hasTrait('Competitive')||this.hasTrait('Energetic')||this.hasTrait('Easily Excited'))){
        if(this.startWalk(null,'zoomies'))this.walkSpeedBoost=Math.max(this.walkSpeedBoost,1.38);else this.setState('looking',3000);
        this.personalityExpression('★','we won!','proud');
      }else if(!won&&this.hasTrait('Stubborn')){
        this.setState('resting',3600);this.personalityExpression('…','hmph','sulking');
      }else if(this.hasTrait('Affectionate')||this.hasTrait('Clingy')){
        this.setState('sitting',3000);this.personalityExpression('♥',won?'proud of us':'still with you',won?'proud':'greeting');
      }else if(this.hasTrait('Calm')){
        this.setState('sitting',3200);this.personalityExpression('•',won?'quietly pleased':'steady','calm');
      }else{
        this.setState('looking',2800);this.personalityExpression(won?'★':'…',won?'race winner':'good race',won?'proud':'');
      }
      this.rememberLifeEvent('race',won?'Race win':`Race finish · ${r.position}`,won?`${name} came home buzzing after a win.`:`${name} came home after finishing ${r.position}.`,`race-${Number(r.at)||Date.now()}`);
      this.noteKeeperRelationship?.('race',{label:won?'Race win':'Race day',detail:`Finished ${r.position}`});this.noteUniverseActivity(won?'race:win':'race:finish');this.behaviourDirty=true;this.engine.saveBehaviourLocal?.();this.engine.saveBehaviour?.(true);this.nextDecision=now()+3800;return true;
    }
    simulateBehaviour(minutes=60){
      const saved={recent:[...(this.memory.recentActions||[])],needs:{...this.needs},lastStair:this.lastStairUse,lastFlight:this.lastFlight,floorEntered:this.floorEntered,lastZoom:this.memory.lastZoomiesAt};const counts={};PERSONALITY_ACTIONS.forEach(k=>counts[k]=0);let simNow=Date.now(),steps=Math.max(20,Math.round(minutes*4));this.memory.recentActions=[];this.lastStairUse=simNow-300000;this.lastFlight=simNow-420000;this.floorEntered=simNow-180000;this.memory.lastZoomiesAt=simNow-300000;
      for(let i=0;i<steps;i++){simNow+=15000;const action=this.chooseAction(simNow,true);counts[action]++;this.memory.recentActions.push(action);this.memory.recentActions=this.memory.recentActions.slice(-8);if(action==='stairs')this.lastStairUse=simNow;if(action==='flight')this.lastFlight=simNow;if(action==='zoomies')this.memory.lastZoomiesAt=simNow;this.needs.rest=clamp(this.needs.rest+(action==='sleeping'?-15:3),0,100);this.needs.stimulation=clamp(this.needs.stimulation+(['walking','explore','zoomies','flight'].includes(action)?-10:3),0,100);}
      const result={minutes,steps,counts,percentages:Object.fromEntries(Object.entries(counts).map(([k,v])=>[k,+((v/steps)*100).toFixed(1)]))};this.memory.recentActions=saved.recent;this.needs=saved.needs;this.lastStairUse=saved.lastStair;this.lastFlight=saved.lastFlight;this.floorEntered=saved.floorEntered;this.memory.lastZoomiesAt=saved.lastZoom;return result;
    }
    decide(t){
      if(t<this.nextDecision)return;if(this.playPendingRaceReaction())return;if(this.stateUntil&&t<this.stateUntil)return;if(['walking','approachingStairs','climbingStairs','takingOff','flying','landing'].includes(this.state))return;
      let action=this.chooseAction(t);this.decisionCount++;
      if(action==='stairs'){if(this.startStairs()){this.recordAction('stairs');return;}action='walking';}
      if(action==='flight'){if(this.startFlight()){this.recordAction('flight');return;}action='looking';}
      if(action==='furniture'){if(this.startFurnitureInteraction()){this.recordAction('furniture');return;}action='looking';}
      const b=this.behaviour||DEFAULT_BEHAVIOUR;
      if(action==='idle'){this.setState('idle',rand(b.idleMinMs,b.idleMaxMs)*(1+(100-this.stat('energy'))/420));this.recordAction('idle');}
      else if(action==='looking'){this.setState('looking',rand(b.lookMinMs,b.lookMaxMs)*(1+this.stat('intelligence')/650));this.recordAction('looking');}
      else if(action==='walking'){if(this.startWalk(null,'walking'))this.recordAction('walking');else this.setState('looking',rand(3000,6500));}
      else if(action==='explore'){if(this.startWalk(null,'explore'))this.recordAction('explore');else this.setState('looking',rand(3000,6500));}
      else if(action==='zoomies'){if(this.startWalk(null,'zoomies'))this.recordAction('zoomies');else this.setState('looking',rand(2500,5000));}
      else if(action==='sitting'){this.setState('sitting',rand(b.sitMinMs,b.sitMaxMs)*(1+this.stat('sleepiness')/700));this.recordAction('sitting');}
      else if(action==='resting'){this.setState('resting',rand(b.restMinMs,b.restMaxMs)*(1+this.stat('sleepiness')/450));this.recordAction('resting');}
      else {const maxScale=this.hasTrait('Professional Napper')?1.45:this.hasTrait('Couch Potato')?1.35:1;this.setState('sleeping',rand(b.sleepMinMs,b.sleepMaxMs)*(0.72+this.stat('sleepiness')/210)*maxScale);this.recordAction('sleeping');}
      this.nextDecision=t+rand(2800,8500);
    }
    startWalk(target=null,mode='walking'){
      const floor=this.map.floors.find(f=>f.id===this.floorId);if(!floor)return false;const safeNodes=(floor.navigationNodes||[]).filter(p=>this.engine.isWalkable(this.floorId,p)&&distSrc(this.pos,p,this.map)>26&&distSrc(this.pos,p,this.map)<340);const b=this.behaviour||DEFAULT_BEHAVIOUR,explore=mode==='explore'||mode==='zoomies'||this.hasTrait('Explorer'),habit=this.hasTrait('Creature of Habit')||this.hasTrait('Routine Lover');
      if(!target&&safeNodes.length){
        const favourite=this.preferences?.formed?.favouriteSleepSpot;const scored=safeNodes.map(p=>{let q=Math.random()*18;const d=distSrc(this.pos,p,this.map);q+=Math.min(18,d/14);const visits=Number(this.memory.visitedLocations?.[locationKey(this.floorId,p)]||0);if(explore)q+=28-visits*8;else q+=Math.max(0,12-visits*2);if(habit&&favourite?.floorId===this.floorId)q+=Math.max(0,28-distSrc(p,[favourite.x,favourite.y],this.map)/8);const centre=centralNodes(safeNodes,b.centralBias||.82);if(!explore&&centre.includes(p))q+=10;return{p,q};}).sort((a,b)=>b.q-a.q);const pick=scored[Math.floor(Math.random()*Math.min(3,scored.length))];if(pick)target=[pick.p[0]+rand(-.006,.006),pick.p[1]+rand(-.004,.004)];
      }
      if(target&&!this.engine.isWalkable(this.floorId,target))target=null;
      if(!target){for(let i=0;i<24;i++){const poly=choose(floor.walkableZones),candidate=randomInPoly(poly);if(distSrc(this.pos,candidate,this.map)>42&&distSrc(this.pos,candidate,this.map)<280&&this.engine.isWalkable(this.floorId,candidate)&&this.engine.lineClear(this.pos,candidate)){target=candidate;break;}}}
      if(!target)return false;const path=this.engine.findPath(this.floorId,this.pos,target);if(!path.length)return false;this.path=path;this.pathIndex=0;this.pendingDestination=target.slice();this.pendingMoveMode=mode;this.walkSpeedBoost=mode==='zoomies'?1.28:mode==='explore'?1.06:1;this.setState('walking');return true;
    }
    startStairs(){const options=this.map.stairConnections.filter(s=>s.fromFloor===this.floorId||s.toFloor===this.floorId);if(!options.length)return false;const ranked=options.map(stair=>{const up=stair.fromFloor===this.floorId,entrance=up?stair.entrancePoint:stair.exitPoint;return{stair,up,entrance,d:distSrc(this.pos,entrance,this.map)};}).filter(o=>o.d<420).sort((a,b)=>a.d-b.d);if(!ranked.length)return false;const pick=ranked[Math.min(ranked.length-1,Math.floor(Math.random()*Math.min(2,ranked.length)))],path=this.engine.findPath(this.floorId,this.pos,pick.entrance);if(!path.length)return false;this.stairPlan={stair:pick.stair,up:pick.up,phase:'approach'};this.path=path;this.pathIndex=0;this.setState('approachingStairs');return true;}
    startFlight(){const zones=this.map.flightZones.filter(z=>z.floorId===this.floorId);if(!zones.length)return false;const z=this.pendingFlightZone||choose(zones);if(!pointInPoly(this.pos,z.poly)){const target=randomInPoly(z.poly);if(!this.engine.isWalkable(this.floorId,target)||!this.startWalk(target,'flight-approach'))return false;this.pendingFlightZone=z;return true;}this.pendingFlightZone=null;const flying=Number(this.skills?.flying?.level||0),flightFactor=.78+flying*.0032,rx=.013*flightFactor,ry=.008*flightFactor,segments=Math.max(8,Math.min(13,Math.round(8+flying/20))),pts=[];for(let i=0;i<=segments;i++){const a=(Math.PI*2*i)/segments,p=[this.pos[0]+Math.cos(a)*rx,this.pos[1]+Math.sin(a)*ry];if(!pointInPoly(p,z.poly)||!this.engine.isClearPoint(p))return false;pts.push(p);}this.flightPlan=pts;this.lastFlight=Date.now();this.setState('takingOff',360);this.nextDecision=now()+7000+Math.min(3500,flying*35);return true;}
    moveAlongPath(dt,speedPx,stateWhenDone='idle'){if(!this.path.length)return true;let remain=speedPx*dt;while(remain>0&&this.pathIndex<this.path.length){const target=this.path[this.pathIndex];const dx=(target[0]-this.pos[0])*this.map.width,dy=(target[1]-this.pos[1])*this.map.height,d=Math.hypot(dx,dy);if(d<.5){this.pos=target.slice();this.pathIndex++;continue;}if(Math.abs(dx)>=Math.max(1.5,Math.abs(dy)*0.35))this.facing=dx>=0?'right':'left';if(remain>=d){this.pos=target.slice();remain-=d;this.pathIndex++;}else{const k=remain/d;this.pos=[this.pos[0]+(target[0]-this.pos[0])*k,this.pos[1]+(target[1]-this.pos[1])*k];remain=0;}}return this.pathIndex>=this.path.length;}
    update(t,dt){
      if(!this.el)return;this.applyFrame(false,t);this.updatePhysicalInteraction(dt);this.updateNeeds(dt);this.updatePassiveSkills(dt);this.applySkillTraining(dt);this.updateDragonThoughts();if(!this.nextGrowthCheckAt||Date.now()>=this.nextGrowthCheckAt){this.updateGrowthMemory();this.nextGrowthCheckAt=Date.now()+60000;}if(document.hidden)return;this.maybeDailyLifeEvent(t);this.maybeKeeperRelationshipMoment(t);
      if(!String(this.state).startsWith('furniture')&&!['takingOff','flying','landing','approachingStairs','climbingStairs'].includes(this.state)&&!this.engine.isWalkable(this.floorId,this.pos)){const floor=this.map.floors.find(f=>f.id===this.floorId),safeNodes=(floor?.navigationNodes||[]).filter(p=>this.engine.isWalkable(this.floorId,p)),fallback=(safeNodes.sort((a,b)=>distSrc(this.pos,a,this.map)-distSrc(this.pos,b,this.map))[0])||(this.map.spawnPoints.find(s=>s.floorId===this.floorId)?.p)||this.pos;this.pos=fallback.slice();this.path=[];this.pathIndex=0;this.setState('idle',2500);}
      const growthMove=this.growthInfo().move||1,mood=this.moodSummary(),moodMove=(mood==='Grumpy'||mood==='Sulking')?0.90:(mood==='Restless'?1.04:(mood==='Excited'?1.06:1)),speedMul=(this.personality.walkingSpeedMultiplier||1)*(0.90+this.stat('energy')/600)*growthMove*moodMove;
      if(this.state==='walking'){
        if(this.moveAlongPath(dt,24*speedMul*this.walkSpeedBoost*WALKING_SPEED_MULTIPLIER)){const completedMode=this.pendingMoveMode;this.noteLocation(this.pendingDestination||this.pos);this.pendingDestination=null;this.pendingMoveMode='';this.walkSpeedBoost=1;if(completedMode==='flight-approach'&&this.startFlight())return;if(completedMode==='bond-greeting'){const reserved=this.hasTrait('Shy')||this.hasTrait('Independent')||this.hasTrait('Independent Friend'),eager=this.hasTrait('Affectionate')||this.hasTrait('Clingy')||this.hasTrait('Cuddlebug')||this.currentMoodName()==='Cuddly';this.setState(reserved?'sitting':eager?'resting':'sitting',rand(4200,7600));this.playPetLove(this.bond>=95?'inseparable ♥':this.bond>=80?'happy to see you!':'hello!');this.noteKeeperRelationship('nearby-rest',{label:'Settled near keeper',skipPeriod:true});this.maybeShowDragonThought?.('keeper-checkin');this.nextDecision=t+rand(6200,9800);return;}if(completedMode==='keeper-checkin'){const reserved=this.hasTrait('Shy')||this.hasTrait('Independent')||this.hasTrait('Independent Friend');this.setState(reserved?'sitting':'resting',rand(5600,10500));this.noteKeeperRelationship('checkin',{label:'Came over to check in',skipPeriod:true});this.maybeShowDragonThought?.('keeper-checkin');this.nextDecision=t+rand(7200,12000);return;}if((completedMode==='furniture-approach'||completedMode==='furniture-command-approach')&&this.beginFurnitureUse()){if(completedMode==='furniture-command-approach')this.commandedFurniture=null;return;}if(completedMode==='furniture-command-approach')this.commandedFurniture=null;if(this.currentLifeEvent&&!this.currentLifeEvent.targetPlacementId)this.finishDailyLifeEvent();this.setState('idle',rand(2200,5600));this.nextDecision=t+rand(2800,8200);}
      }else if(this.state==='approachingStairs'){
        if(this.moveAlongPath(dt,22*speedMul*WALKING_SPEED_MULTIPLIER)){const s=this.stairPlan.stair,up=this.stairPlan.up;this.path=(up?s.climbingWaypoints:[...s.reverseWaypoints]).map(p=>p.slice());this.path.push((up?s.exitPoint:s.entrancePoint).slice());this.pathIndex=0;this.setState('climbingStairs');}
      }else if(this.state==='climbingStairs'){
        if(this.moveAlongPath(dt,16*speedMul*WALKING_SPEED_MULTIPLIER)){const s=this.stairPlan.stair,up=this.stairPlan.up;this.floorId=up?s.toFloor:s.fromFloor;this.floorEntered=Date.now();this.lastStairUse=Date.now();this.stairPlan=null;this.memory.floorVisits=this.memory.floorVisits||{};this.memory.floorVisits[this.floorId]=(Number(this.memory.floorVisits[this.floorId])||0)+1;this.gainPassiveSkill('agility',.03,'Using the stairs','stairs-agility',PASSIVE_SKILL_COOLDOWNS.stairs,{challenge:false});this.gainPassiveSkill('confidence',.02,'Using the stairs','stairs-confidence',PASSIVE_SKILL_COOLDOWNS.stairs,{challenge:false});this.behaviourDirty=true;this.noteLocation();if(this.commandedFurniture){if(this.continueFurnitureCommand())return;this.commandedFurniture=null;}this.setState('looking',rand(3000,6800));this.nextDecision=t+rand(5000,11000);}
      }else if(this.state==='takingOff'){
        if(t>=this.stateUntil){this.path=this.flightPlan.map(p=>p.slice());this.pathIndex=0;this.setState('flying');}
      }else if(this.state==='flying'){
        if(this.moveAlongPath(dt,52)){this.setState('landing',360);}
      }else if(this.state==='landing'){
        if(t>=this.stateUntil){this.flightPlan=null;this.noteLocation();this.setState('resting',rand(6500,14500));this.nextDecision=t+rand(5000,12000);}
      }else if(String(this.state).startsWith('furniture')){
        const urgent=this.criticalFurnitureInterruptNeed(this.furnitureUseSession,t);
        if(urgent){this.pendingCareNeed=urgent.need;this.finishFurnitureUse('urgent-care');this.setState('looking',900);this.nextDecision=t+1050;}
        else if(t>=this.stateUntil){this.finishFurnitureUse('complete');this.setState('looking',rand(2200,4800));this.nextDecision=t+rand(3500,8000);}
      }else this.decide(t);this.render();
    }
    render(force=false){if(!this.el||!this.img)return;const xy=this.engine.toPixels(this.pos);this.el.style.left=xy.x+'px';this.el.style.top=xy.y+'px';const depthY=this.furnitureMounted&&Number.isFinite(this.furnitureDepthY)?Math.max(this.pos[1],this.furnitureDepthY):this.pos[1];const base=Math.round(clamp(depthY,0,1)*100000);const actorLayer=100000+base*10+(this.furnitureMounted?8:6);this.el.style.zIndex=String(actorLayer);this.el.dataset.depthAnchorY=Number(depthY).toFixed(6);this.el.dataset.renderType=this.furnitureMounted?'interaction_actor':'actor';const growthScale=this.growthInfo().scale||1,scale=this.engine.sourceScale()*this.def.renderedScale*RENDER_SCALE_MULTIPLIER*growthScale;const nw=this.img.naturalWidth||220,nh=this.img.naturalHeight||220,tooltipLift=Math.max(44,nh*scale*.92+12);this.img.style.width=(nw*scale)+'px';this.el.style.setProperty('--dragon-tooltip-lift',tooltipLift+'px');const worldW=Math.max(1,Number(this.map?.width||0)),thoughtShift=xy.x<118?Math.min(72,118-xy.x):xy.x>worldW-118?-Math.min(72,xy.x-(worldW-118)):0;this.el.style.setProperty('--dragon-thought-shift-x',`${thoughtShift}px`);this.el.classList.toggle('is-thought-below',xy.y<tooltipLift+28);const flip=this.facing===this.def.nativeFacing?1:-1;const anchorY=.985;this.img.style.transform=`translate(-50%,-${(anchorY*100).toFixed(1)}%) scaleX(${flip})`;this.el.dataset.state=this.state;this.el.dataset.floor=this.floorId;if(this.physicalInteraction)this.el.dataset.furnitureFacing=this.facing;}
    snapshot(){const savePos=this.furnitureMounted&&Array.isArray(this.furnitureExitPos)?this.furnitureExitPos:this.pos;return{dragonId:this.dragon.id,houseId:this.map.houseId,floorId:this.floorId,normalizedX:savePos[0],normalizedY:savePos[1],facing:this.facing,restingState:['idle','sitting','resting','sleeping'].includes(this.state)?this.state:'idle',lastStairUseAt:this.lastStairUse,lastFlightAt:this.lastFlight};}
  }

  class DragonboundBabyEngine{
    constructor(){this.stage=null;this.homeScene=null;this.world=null;this.layer=null;this.actor=null;this.houseId='';this.map=null;this.weatherLayer=null;this.weatherMode='';this.weatherTimer=0;this.raf=0;this.lastT=0;this.saveAt=0;this.localCareSaveAt=0;this.needsHud=null;this.needsHudAt=0;this.debug=null;this.debugEnabled=localStorage.getItem(DEBUG_KEY)==='1';this.boundVis=()=>{if(document.hidden){this.save();this.saveBehaviourLocal();this.saveBehaviour(true);}};this.boundFurniture=()=>{if(!this.actor||!this.map)return;const a=this.actor;a.syncLifeFurniture(false);if(!this.isWalkable(a.floorId,a.pos)){const safe=this.nearestWalkablePoint(a.floorId,a.pos),fallbackSpawn=this.map.spawnPoints.find(s=>s.floorId===a.floorId)||this.map.spawnPoints[0],fallback=safe||(fallbackSpawn?this.nearestWalkablePoint(fallbackSpawn.floorId,fallbackSpawn.p):null);if(fallback){if(!safe&&fallbackSpawn)a.floorId=fallbackSpawn.floorId;a.pos=fallback.slice();a.path=[];a.setState('idle',2500);}}else if(a.path?.length&&a.path.some(p=>!this.isClearPoint(p,a.floorId))){a.path=[];a.setState('looking',2500);}};document.addEventListener('visibilitychange',this.boundVis);window.addEventListener('dragonbound:furniture-changed',this.boundFurniture);window.addEventListener('beforeunload',()=>{this.save();this.saveBehaviourLocal();this.saveBehaviour(true);});this.homeMusic=new Audio(STARTER_HOME_MUSIC);this.homeMusic.loop=true;this.homeMusic.volume=STARTER_HOME_MUSIC_VOLUME;this.homeMusic.preload='auto';this.homeMusicWanted=false;this.homeMusicCheckAt=0;this.behaviourSaveAt=0;this.personalityDebug=null;this.boundHomeMusicUnlock=()=>this.syncHomeMusic(true);window.addEventListener('pointerdown',this.boundHomeMusicUnlock,{passive:true});}
    syncHomeMusic(force=false){if(!this.homeMusic)return;const hatchOpen=!!document.querySelector('.dragonbound-home-hatch-reveal.is-visible'),wanted=!!(this.homeScene?.classList.contains('is-visible')&&this.stage?.classList.contains('is-home')&&!document.hidden&&!hatchOpen);this.homeMusicWanted=wanted;this.homeMusic.volume=STARTER_HOME_MUSIC_VOLUME;if(wanted){if(force||this.homeMusic.paused){try{const p=this.homeMusic.play();if(p&&typeof p.catch==='function')p.catch(()=>{});}catch(_e){}}}else if(!this.homeMusic.paused){try{this.homeMusic.pause();}catch(_e){}}}
    attach(stage,homeScene,world,layer){this.stage=stage;this.homeScene=homeScene;this.world=world;this.layer=layer;this.ensureWeatherLayer();this.ensureNeedsHud();this.ensureDebug();this.syncHomeMusic();this.syncWeatherVisibility();this.updateNeedsHud(true);}
    ensureNeedsHud(){
      if(!this.homeScene)return null;if(this.needsHud?.isConnected)return this.needsHud;
      const hud=document.createElement('section');hud.className='dragonbound-needs-hud';hud.setAttribute('aria-label','Dragon care needs');
      hud.innerHTML=`<div class="dragonbound-needs-hud-head"><span><small>DRAGON CARE</small><strong data-care-name>Baby Dragon</strong></span><b data-care-mood>Content</b></div><div class="dragonbound-needs-bond-summary"><strong data-care-bond-stage>New Keeper</strong><span data-care-bond-note>Still learning who you are</span></div><div class="dragonbound-needs-bars">${[['hunger','Hunger'],['hygiene','Hygiene'],['energy','Energy'],['fun','Fun'],['bond','Bond']].map(([key,label])=>`<div class="dragonbound-need-row" data-care-key="${key}"><span>${label}</span><i><em></em></i><b>--</b></div>`).join('')}</div><div class="dragonbound-care-personality"><span class="dragonbound-care-section-label">PERSONALITY NOTES</span><div class="dragonbound-care-trait-list" data-care-traits></div></div><div class="dragonbound-care-routines"><span class="dragonbound-care-section-label">FAVOURITES & ROUTINES</span><p data-care-favourite>Still choosing favourite furnishings.</p><p data-care-routine>Still settling into life at home.</p></div>`;
      this.homeScene.appendChild(hud);this.needsHud=hud;return hud;
    }
    updateNeedsHud(force=false){
      const hud=this.ensureNeedsHud();if(!hud)return;const t=Date.now();if(!force&&t<this.needsHudAt)return;this.needsHudAt=t+350;
      const actor=this.actor;const visiting=!!this.stage?.classList.contains('is-visiting-house');hud.classList.toggle('is-hidden',!actor||visiting);if(!actor||visiting)return;
      const care=actor.careStats(),name=actor.dragon?.name||actor.def?.displayName||'Baby Dragon',mood=actor.currentMoodName?.()||actor.moodSummary();
      const nameEl=hud.querySelector('[data-care-name]'),moodEl=hud.querySelector('[data-care-mood]');if(nameEl)nameEl.textContent=name;if(moodEl){moodEl.textContent=mood;moodEl.dataset.mood=mood.toLowerCase().replace(/[^a-z]+/g,'-');}const relationship=actor.bondRelationship(),stageEl=hud.querySelector('[data-care-bond-stage]'),noteEl=hud.querySelector('[data-care-bond-note]');if(stageEl)stageEl.textContent=`Bond ${relationship.level} · ${relationship.name}`;if(noteEl){const next=relationship.next?`Next: ${relationship.next.name} at ${relationship.nextAt}`:'Highest bond reached';noteEl.textContent=`${relationship.note} · ${next}`;noteEl.title=relationship.favouriteFurniture?`Favourite furniture: ${relationship.favouriteFurniture}`:'';}
      const traitList=hud.querySelector('[data-care-traits]');
      if(traitList){traitList.innerHTML=actor.traitDiscoverySlots(4).map(slot=>`<span class="dragonbound-care-trait${slot.revealed?' is-revealed':' is-hidden'}">${slot.revealed?slot.label:'???'}</span>`).join('');}
      const summary=actor.profileSummary(),favEl=hud.querySelector('[data-care-favourite]'),routineEl=hud.querySelector('[data-care-routine]');
      if(favEl)favEl.textContent=summary.favourite;
      if(routineEl)routineEl.textContent=summary.routine;
      for(const [key,value] of Object.entries(care)){const row=hud.querySelector(`[data-care-key="${key}"]`);if(!row)continue;const v=clamp(Number(value)||0,0,100);row.style.setProperty('--need-value',`${v}%`);row.dataset.level=v<=20?'critical':v<=45?'low':v<=70?'mid':'good';const num=row.querySelector('b');if(num)num.textContent=`${Math.round(v)}%`;}
    }
    ensureWeatherLayer(){if(!this.world)return null;if(this.weatherLayer?.isConnected)return this.weatherLayer;const layer=document.createElement('div');layer.className='dragonbound-home-weather-layer';layer.setAttribute('aria-hidden','true');this.world.appendChild(layer);this.weatherLayer=layer;return layer;}
    syncWeatherVisibility(){const active=!!(this.homeScene?.classList.contains('is-visible')&&this.stage?.classList.contains('is-home')&&!document.hidden);this.weatherLayer?.classList.toggle('is-active',active);}
    clearWeather(){clearTimeout(this.weatherTimer);this.weatherTimer=0;this.weatherMode='';if(this.weatherLayer)this.weatherLayer.replaceChildren();}
    chooseWeatherMode(){const cfg=WEATHER_CONFIGS[this.houseId];if(!cfg?.modes?.length)return'';let choices=cfg.modes.filter(m=>m!==this.weatherMode);if(!choices.length)choices=cfg.modes;return choose(choices);}
    weatherParticleCount(mode,density=1){const base={snow:24,'light-snow':15,'fjord-mist':5,'mountain-mist':5,'wind-motes':16,'warm-motes':20,fireflies:14,'night-breeze':14,pollen:22,'leaf-drift':14,'sun-motes':20,'forest-motes':20,'soft-rain':26}[mode]||16;return Math.max(4,Math.round(base*density));}
    buildWeather(mode){const cfg=WEATHER_CONFIGS[this.houseId],layer=this.ensureWeatherLayer();if(!cfg||!layer)return;layer.replaceChildren();layer.dataset.weather=mode;layer.dataset.house=this.houseId;this.weatherMode=mode;for(const z of cfg.zones){const zone=document.createElement('div');zone.className='dragonbound-weather-zone';zone.style.left=(z[0]*100)+'%';zone.style.top=(z[1]*100)+'%';zone.style.width=(z[2]*100)+'%';zone.style.height=(z[3]*100)+'%';const count=this.weatherParticleCount(mode,cfg.density)/cfg.zones.length;for(let i=0;i<Math.ceil(count);i++){const p=document.createElement('i');p.className='dragonbound-weather-particle';p.style.setProperty('--wx',rand(0,100).toFixed(2)+'%');p.style.setProperty('--wy',rand(-8,96).toFixed(2)+'%');p.style.setProperty('--wd',rand(5.5,15).toFixed(2)+'s');p.style.setProperty('--wdelay',(-rand(0,15)).toFixed(2)+'s');p.style.setProperty('--wdrift',rand(-46,46).toFixed(1)+'px');p.style.setProperty('--wsize',rand(.65,1.4).toFixed(2));zone.appendChild(p);}layer.appendChild(zone);}this.scheduleWeatherChange();}
    scheduleWeatherChange(){clearTimeout(this.weatherTimer);if(!WEATHER_CONFIGS[this.houseId])return;this.weatherTimer=setTimeout(()=>{if(!this.map)return;this.buildWeather(this.chooseWeatherMode());},rand(55000,95000));}
    refreshWeather(){const cfg=WEATHER_CONFIGS[this.houseId];if(!cfg){this.clearWeather();return;}this.buildWeather(this.chooseWeatherMode());this.syncWeatherVisibility();}
    setHouse(houseId){this.houseId=houseId;this.map=HOUSE_MAPS[houseId]||null;try{if(this.debugEnabled){const o=localStorage.getItem('dragonboundNavOverride:'+houseId);if(o)this.map=JSON.parse(o);}}catch(_e){}if(this.debug)this.debug.dataset.houseId=houseId;this.refreshWeather();this.trySpawn();}
    setDragon(dragon){if(!dragon)return;const previous=this.getDragon(),hatchedAt=Number(dragon.hatchedAt)||((previous&&previous.id===dragon.id&&Number(previous.hatchedAt))||Date.now()),saved={...previous,...dragon,hatchedAt};localStorage.setItem(storageKey(),JSON.stringify(saved));if(this.actor&&this.actor.dragon.id===saved.id){this.actor.destroy();this.actor=null;}this.trySpawn();}
    commandFurnitureInteraction(placementId){const id=String(placementId||'').trim();if(!id)return{ok:false,reason:'No furnishing was selected.'};if(!this.actor)return{ok:false,reason:'Your baby dragon is not at home yet.'};const meta=getFurnitureInteractions().find(x=>String(x?.placementId||'')===id);if(!meta)return{ok:false,reason:'That furnishing is not available to interact with.'};const ok=this.actor.commandFurniture(meta);return{ok,placementId:id,name:meta.name||meta.itemId,roomId:meta.roomId,kind:this.actor.furnitureKind(meta),reason:ok?'':'Your dragon could not find a safe route to that furnishing.'};}
    getDragon(){try{return JSON.parse(localStorage.getItem(storageKey())||'null');}catch(_e){return null;}}
    clearDragon(){try{localStorage.removeItem(storageKey());}catch(_e){}this.actor?.destroy();this.actor=null;this.updateNeedsHud(true);}
    trySpawn(){if(!this.layer||!this.map)return;const d=this.getDragon();if(!d||!REGISTRY[d.breedId]){this.updateNeedsHud(true);return;}if(this.actor&&this.actor.dragon.id===d.id&&this.actor.map.houseId===this.map.houseId){this.updateNeedsHud(true);return;}this.actor?.destroy();this.actor=new BabyDragonActor(this,d,this.map);this.actor.mount(this.layer);this.updateNeedsHud(true);this.ensurePersonalityDebug();this.start();}
    start(){if(this.raf)return;this.lastT=now();const loop=t=>{this.raf=requestAnimationFrame(loop);const dt=Math.min(.05,(t-this.lastT)/1000);this.lastT=t;if(t>this.homeMusicCheckAt){this.syncHomeMusic();this.syncWeatherVisibility();this.homeMusicCheckAt=t+500;}const inactive=!this.homeScene?.classList.contains('is-visible')||!this.stage?.classList.contains('is-home')||this.stage?.classList.contains('is-visiting-house')||this.homeScene?.classList.contains('is-build-editing')||this.homeScene?.classList.contains('is-build-placing')||!!document.querySelector('.dragonbound-travel-menu.is-visible')||!!document.querySelector('.dragonbound-my-dragon-overlay.is-visible');if(inactive){this.actor?.clearDragonThought?.('scene-exit');if(this.actor&&String(this.actor.state||'').startsWith('furniture')){this.actor.finishFurnitureUse('scene-exit');this.saveBehaviourLocal();}else if(this.actor?.currentLifeEvent){this.actor.path=[];this.actor.finishDailyLifeEvent();this.actor.setState('idle',1200);this.saveBehaviourLocal();}return;}if(document.querySelector('.dragonbound-home-hatch-reveal.is-visible')||document.querySelector('.dragonbound-dialogue-panel.is-visible'))return;if(this.actor){this.actor.update(t,dt);this.updateNeedsHud();}if(t>this.saveAt){this.save();this.saveAt=t+12000;}if(t>this.localCareSaveAt){this.saveBehaviourLocal();this.localCareSaveAt=t+2000;}if(t>this.behaviourSaveAt){this.saveBehaviour();this.behaviourSaveAt=t+30000;}this.drawDebug();this.updatePersonalityDebug();};this.raf=requestAnimationFrame(loop);}
    stop(){cancelAnimationFrame(this.raf);this.raf=0;this.save();this.saveBehaviour(true);clearTimeout(this.weatherTimer);this.weatherTimer=0;this.weatherLayer?.classList.remove('is-active');try{this.homeMusic?.pause();}catch(_e){}}
    destroy(){this.stop();this.clearWeather();this.weatherLayer?.remove();this.weatherLayer=null;this.actor?.destroy();document.removeEventListener('visibilitychange',this.boundVis);window.removeEventListener('dragonbound:furniture-changed',this.boundFurniture);window.removeEventListener('pointerdown',this.boundHomeMusicUnlock);}
    sourceScale(){if(!this.map||!this.world)return 1;return Math.max(this.world.clientWidth/this.map.width,this.world.clientHeight/this.map.height);}
    toPixels(p){const s=this.sourceScale(),dw=this.map.width*s,dh=this.map.height*s,ox=(this.world.clientWidth-dw)/2,oy=(this.world.clientHeight-dh)/2;return{x:ox+p[0]*this.map.width*s,y:oy+p[1]*this.map.height*s};}
    fromPixels(x,y){const s=this.sourceScale(),dw=this.map.width*s,dh=this.map.height*s,ox=(this.world.clientWidth-dw)/2,oy=(this.world.clientHeight-dh)/2;return[(x-ox)/(this.map.width*s),(y-oy)/(this.map.height*s)];}
    isClearPoint(p,floorId=this.actor?.floorId||''){const blocked=[...(this.map?.blockedZones||[]),...getFurniturePolys(floorId)];return !blocked.some(poly=>pointInPoly(p,poly));}
    isWalkable(floorId,p){const f=this.map?.floors.find(f=>f.id===floorId);return !!f&&Array.isArray(p)&&p.length>=2&&p.every(Number.isFinite)&&f.walkableZones.some(poly=>pointInPoly(p,poly))&&this.isClearPoint(p,floorId);}
    nearestWalkablePoint(floorId,preferred){
      const f=this.map?.floors.find(row=>row.id===floorId);if(!f)return null;
      const origin=Array.isArray(preferred)&&preferred.length>=2&&preferred.every(Number.isFinite)?preferred.slice(0,2):null;
      if(origin&&this.isWalkable(floorId,origin))return origin;
      const candidates=[];
      const push=p=>{if(Array.isArray(p)&&p.length>=2&&p.every(Number.isFinite)&&this.isWalkable(floorId,p))candidates.push(p.slice(0,2));};
      (f.navigationNodes||[]).forEach(push);(this.map?.spawnPoints||[]).filter(s=>s.floorId===floorId).forEach(s=>push(s.p));
      if(origin){
        // Search close to the saved point first so adding/moving a furnishing never teleports
        // a dragon across the room just because its previous feet position became blocked.
        const radii=[.006,.010,.015,.022,.030,.042,.058,.078,.105,.135];
        for(const r of radii)for(let i=0;i<20;i++){const a=(Math.PI*2*i)/20;push([clamp(origin[0]+Math.cos(a)*r,0,1),clamp(origin[1]+Math.sin(a)*r*.72,0,1)]);}
      }
      if(!candidates.length){
        for(const poly of f.walkableZones||[])for(let i=0;i<36;i++)push(randomInPoly(poly));
      }
      if(!candidates.length)return null;
      const ref=origin||candidates[0];
      return candidates.sort((a,b)=>distSrc(ref,a,this.map)-distSrc(ref,b,this.map))[0].slice();
    }
    lineClear(a,b,floorId=this.actor?.floorId||''){const blocked=[...(this.map?.blockedZones||[]),...getFurniturePolys(floorId)];return !blocked.some(poly=>segHitsPoly(a,b,poly));}
    findPath(floorId,a,b){if(!this.isWalkable(floorId,b))return[];if(this.lineClear(a,b,floorId))return[b.slice()];const f=this.map.floors.find(f=>f.id===floorId),nodes=(f.navigationNodes||[]).filter(p=>this.isWalkable(floorId,p));const pts=[a,...nodes,b],N=pts.length,adj=Array.from({length:N},()=>[]);for(let i=0;i<N;i++)for(let j=i+1;j<N;j++)if(this.lineClear(pts[i],pts[j],floorId)){const d=distSrc(pts[i],pts[j],this.map);adj[i].push([j,d]);adj[j].push([i,d]);}const d=Array(N).fill(Infinity),prev=Array(N).fill(-1),used=Array(N).fill(false);d[0]=0;for(let k=0;k<N;k++){let u=-1;for(let i=0;i<N;i++)if(!used[i]&&(u<0||d[i]<d[u]))u=i;if(u<0||!isFinite(d[u]))break;used[u]=true;if(u===N-1)break;for(const [v,w]of adj[u])if(d[u]+w<d[v]){d[v]=d[u]+w;prev[v]=u;}}if(!isFinite(d[N-1]))return[];const out=[];for(let cur=N-1;cur>0;cur=prev[cur])out.unshift(pts[cur].slice());return out;}
    loadMovement(dragonId,houseId){try{const all=JSON.parse(localStorage.getItem(movementStorageKey())||'{}');return all[dragonId+'@'+houseId]||null;}catch(_e){return null;}}
    save(){if(!this.actor)return;try{const all=JSON.parse(localStorage.getItem(movementStorageKey())||'{}');all[this.actor.dragon.id+'@'+this.actor.map.houseId]=this.actor.snapshot();localStorage.setItem(movementStorageKey(),JSON.stringify(all));}catch(_e){}}
    buildBehaviourPayload(){
      if(!this.actor)return null;
      return {memory:this.actor.behaviourSnapshot(),preferences:{preferredFloor:this.actor.preferences?.preferredFloor||'downstairs',formed:this.actor.preferences?.formed||{}},discoveredTraits:[...new Set([...(this.actor.discoveredTraits||[]),...this.actor.personalityUniverseDiscovered()])].slice(0,20)};
    }
    persistBehaviourLocal(payload){
      if(!this.actor||!payload?.memory)return false;
      try{
        const current=this.getDragon()||this.actor.dragon||{};
        const traits={...(current.traits||{}),assigned:(this.actor.assignedTraits||[]).slice(0,20),discovered:(payload.discoveredTraits||[]).slice(0,20)};
        const saved={...current,memory:payload.memory,preferences:{...(current.preferences||{}),...(payload.preferences||{})},traits};
        // Maintain both Dragonbound browser records. Earlier builds wrote live care
        // to only one of them, while profile hydration read the other one, which is
        // why a simple close/reopen could appear to reset every need and Bond value.
        localStorage.setItem(storageKey(),JSON.stringify(saved));
        localStorage.setItem(profileStorageKey(),JSON.stringify(saved));
        return true;
      }catch(_e){return false;}
    }
    saveBehaviourLocal(){const payload=this.buildBehaviourPayload();if(!payload)return null;this.persistBehaviourLocal(payload);return payload;}
    saveBehaviour(force=false){
      if(!this.actor||(!force&&!this.actor.behaviourDirty))return;
      const payload=this.buildBehaviourPayload();if(!payload)return;
      this.persistBehaviourLocal(payload);
      this.actor.behaviourDirty=false;this.actor.lastBehaviourSaveAt=Date.now();window.dispatchEvent(new CustomEvent('dragonbound:behaviour-memory-save',{detail:payload}));
    }
    ensurePersonalityDebug(){if(!this.homeScene||currentAccountSlug()!=='admin'){this.personalityDebug?.remove();this.personalityDebug=null;return;}if(this.personalityDebug?.isConnected)return;const panel=document.createElement('div');panel.className='dragonbound-personality-debug';panel.innerHTML='<div class="dragonbound-personality-debug-head"><strong>PERSONALITY BRAIN</strong><button type="button" data-sim>SIM 60M</button><button type="button" data-close>×</button></div><pre></pre>';this.homeScene.appendChild(panel);panel.querySelector('[data-close]').onclick=()=>panel.classList.toggle('is-collapsed');panel.querySelector('[data-sim]').onclick=()=>{if(!this.actor)return;const sim=this.actor.simulateBehaviour(60);console.table(sim.percentages);panel.dataset.sim=JSON.stringify(sim.percentages);this.updatePersonalityDebug(sim);};this.personalityDebug=panel;this.updatePersonalityDebug();}
    updatePersonalityDebug(sim=null){if(!this.personalityDebug||!this.actor)return;const a=this.actor,pre=this.personalityDebug.querySelector('pre'),stats=Object.entries(a.coreStats).map(([k,v])=>`${k.padEnd(13)} ${String(Math.round(v)).padStart(3)}`).join('\n'),scores=Object.entries(a.lastScores||{}).sort((x,y)=>y[1]-x[1]).slice(0,6).map(([k,v])=>`${k.padEnd(10)} ${v.toFixed(1)}`).join('\n'),needs=Object.entries(a.needs).map(([k,v])=>`${k}:${Math.round(v)}`).join('  '),traits=a.assignedTraits.join(', ')||'none',observed=a.discoveredTraits.join(', ')||'none',simText=sim?`\nSIM 60M\n${Object.entries(sim.percentages).map(([k,v])=>`${k}:${v}%`).join('  ')}`:'';pre.textContent=`${a.dragon.name} · ${a.dragon.personality?.archetype||'Individual'}\n${stats}\n\nQUIRKS\n${traits}\n\nDISCOVERED\n${observed}\n\nNEEDS\n${needs}\n\nNEXT ACTION SCORES\n${scores}${simText}`;}
    ensureDebug(){if(!this.debugEnabled||!this.homeScene||this.debug)return;const wrap=document.createElement('div');wrap.className='dragonbound-nav-debug';wrap.innerHTML='<div class="dragonbound-nav-debug-head"><strong>NAV DEBUG</strong><select data-mode><option value="inspect">Inspect</option><option value="walk">Walkable</option><option value="blocked">Blocked</option><option value="rest">Rest</option><option value="sleep">Sleep</option><option value="flight">Flight</option><option value="spawn">Spawn</option><option value="stair">Stair Route</option></select><button type="button" data-finish>Finish</button><button type="button" data-undo>Undo</button><button type="button" data-export>Export</button><button type="button" data-close>×</button></div><canvas></canvas><pre></pre>';this.homeScene.appendChild(wrap);this.debug=wrap;this.debugDraft=[];this.debugMode='inspect';const canvas=wrap.querySelector('canvas'),mode=wrap.querySelector('[data-mode]');mode.onchange=()=>{this.debugMode=mode.value;this.debugDraft=[];canvas.style.pointerEvents=this.debugMode==='inspect'?'none':'auto';};canvas.addEventListener('click',e=>{if(this.debugMode==='inspect'||!this.map)return;const r=canvas.getBoundingClientRect(),p=this.fromPixels(e.clientX-r.left,e.clientY-r.top);this.debugDraft.push([clamp(p[0],0,1),clamp(p[1],0,1)]);});canvas.addEventListener('contextmenu',e=>{e.preventDefault();this.debugDraft.pop();});wrap.querySelector('[data-close]').onclick=()=>{wrap.style.display='none';};wrap.querySelector('[data-undo]').onclick=()=>{this.debugDraft.pop();};wrap.querySelector('[data-finish]').onclick=()=>{if(!this.map||!this.debugDraft?.length)return;const floor=this.actor?.floorId||this.map.floors[0]?.id;const pts=this.debugDraft.map(p=>p.slice());if(this.debugMode==='walk'&&pts.length>=3)this.map.floors.find(f=>f.id===floor)?.walkableZones.push(pts);else if(this.debugMode==='blocked'&&pts.length>=3)this.map.blockedZones.push(pts);else if(this.debugMode==='rest'&&pts.length>=3)this.map.restingZones.push({floorId:floor,poly:pts});else if(this.debugMode==='sleep'&&pts.length>=3)this.map.sleepingZones.push({floorId:floor,poly:pts});else if(this.debugMode==='flight'&&pts.length>=3)this.map.flightZones.push({floorId:floor,poly:pts});else if(this.debugMode==='spawn'&&pts.length)this.map.spawnPoints.push({floorId:floor,p:pts[pts.length-1]});else if(this.debugMode==='stair'&&pts.length>=3){const other=this.map.floors.find(f=>f.id!==floor)?.id;if(other)this.map.stairConnections.push({id:'debug-stair-'+Date.now(),fromFloor:floor,toFloor:other,entrancePoint:pts[0],climbingWaypoints:pts.slice(1,-1),exitPoint:pts[pts.length-1],reverseWaypoints:pts.slice(1,-1).reverse()});}try{localStorage.setItem('dragonboundNavOverride:'+this.houseId,JSON.stringify(this.map));}catch(_e){}this.debugDraft=[];};wrap.querySelector('[data-export]').onclick=()=>{const blob=new Blob([JSON.stringify(this.map,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(this.houseId||'house')+'-nav.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};}
    updateDebug(){if(!this.debug||!this.actor)return;this.debug.querySelector('pre').textContent=`${this.actor.dragon.name} · ${this.actor.state}
${this.actor.floorId} · ${this.actor.pos.map(v=>v.toFixed(3)).join(', ')}
stairs ${Math.max(0,Math.round((60000-(Date.now()-this.actor.lastStairUse))/1000))}s · flight ${Math.max(0,Math.round((60000-(Date.now()-this.actor.lastFlight))/1000))}s`;}
    drawDebug(){if(!this.debug||this.debug.style.display==='none'||!this.map)return;const c=this.debug.querySelector('canvas'),r=this.world.getBoundingClientRect();if(c.width!==Math.round(r.width)||c.height!==Math.round(r.height)){c.width=Math.round(r.width);c.height=Math.round(r.height);}const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);const drawPoly=(poly,color)=>{ctx.beginPath();poly.forEach((p,i)=>{const q=this.toPixels(p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.closePath();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();};this.map.floors.forEach(f=>f.walkableZones.forEach(p=>drawPoly(p,'#39ff6a')));this.map.blockedZones.forEach(p=>drawPoly(p,'#ff4b4b'));this.map.flightZones.forEach(z=>drawPoly(z.poly,'#4ba3ff'));this.map.restingZones.forEach(z=>drawPoly(z.poly,'#c36cff'));this.map.sleepingZones.forEach(z=>drawPoly(z.poly,'#8a4bff'));ctx.strokeStyle='#ffd45a';this.map.stairConnections.forEach(s=>{const pts=[s.entrancePoint,...s.climbingWaypoints,s.exitPoint];ctx.beginPath();pts.forEach((p,i)=>{const q=this.toPixels(p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.stroke();});if(this.actor){const q=this.toPixels(this.actor.pos);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(q.x,q.y,4,0,Math.PI*2);ctx.fill();}if(this.debugDraft?.length){ctx.strokeStyle='#fff';ctx.fillStyle='#fff';ctx.beginPath();this.debugDraft.forEach((p,i)=>{const q=this.toPixels(p);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);ctx.fillRect(q.x-2,q.y-2,4,4);});ctx.stroke();}this.updateDebug();}
  }

  window.DragonboundThoughts=window.DragonboundThoughts||{enabled:true};if(typeof window.DragonboundThoughts.enabled!=='boolean')window.DragonboundThoughts.enabled=true;
  const engine=new DragonboundBabyEngine();
  window.DragonboundBabyEngine=engine;
  window.DragonboundBabyRegistry=REGISTRY;
  window.DragonboundHouseNavigationRegistry=HOUSE_MAPS;
  window.DragonboundBreedIdForEgg=name=>BREED_BY_DISPLAY[name]||String(name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  window.addEventListener('dragonbound:engine-attach',e=>{const d=e.detail||{};engine.attach(d.stage,d.homeScene,d.world,d.layer);if(d.houseId)engine.setHouse(d.houseId);});
  window.addEventListener('dragonbound:house-selected',e=>engine.setHouse(e.detail?.houseId||''));
  window.addEventListener('dragonbound:dragon-named',e=>engine.setDragon(e.detail));
  window.addEventListener('dragonbound:dragon-cleared',()=>engine.clearDragon());
  window.addEventListener('dragonbound:race-finished',e=>engine.actor?.queueRaceReaction?.(e.detail||{}));
  window.addEventListener('dragonbound:mood-updated',e=>engine.actor?.setDailyMood?.(e.detail?.mood||e.detail||{},{announce:e.detail?.announce!==false}));
  window.addEventListener('dragonbound:daily-preferences-updated',e=>engine.actor?.setDailyPreferences?.(e.detail?.preferences||e.detail||{},{announce:e.detail?.announce!==false}));

  window.addEventListener('dragonbound:house-closed',()=>engine.save());
  window.DragonboundNavDebug={enable(){localStorage.setItem(DEBUG_KEY,'1');location.reload();},disable(){localStorage.removeItem(DEBUG_KEY);location.reload();},exportCurrent(){return JSON.stringify(engine.map,null,2);}};
  window.DragonboundFurniturePersonalityScore=(tags,meta)=>engine.actor?.scoreFurnitureTags(tags,meta)||0;
  window.DragonboundPersonalityDebug={inspect(){if(currentAccountSlug()!=='admin')return null;const a=engine.actor;if(!a)return null;return{name:a.dragon.name,archetype:a.dragon.personality?.archetype,coreStats:{...a.coreStats},signatureTraits:[...(a.signatureTraits||[])],traits:[...a.assignedTraits],discovered:[...new Set([...a.discoveredTraits,...a.personalityUniverseDiscovered()])],universe:a.personalityUniverseSummary(),needs:{...a.needs},care:a.careStats(),bond:a.bond,mood:a.moodSummary(),dailyMood:{...(a.dailyMood||{})},dailyPreferences:a.dailyPreferenceSummary?.()||{preferences:[]},preferences:typeof structuredClone==='function'?structuredClone(a.preferences):JSON.parse(JSON.stringify(a.preferences)),memory:a.behaviourSnapshot(),scores:{...a.lastScores}};},simulate(minutes=60){if(currentAccountSlug()!=='admin')return null;return engine.actor?.simulateBehaviour(minutes)||null;},save(){if(currentAccountSlug()==='admin')engine.saveBehaviour(true);}};
  window.DragonboundPersonalityUniverseRegistry={version:DRAGONBOUND_PERSONALITY_UNIVERSE_VERSION,traits:Object.fromEntries(DRAGONBOUND_UNIVERSE_TRAITS.map(t=>[t.name,{name:t.name,family:t.family,note:t.note}])),quirks:Object.fromEntries(DRAGONBOUND_UNIVERSE_QUIRKS.map(q=>[q.id,{id:q.id,label:q.label,note:q.note}]))};
  window.DragonPersonalityDebug={profile(){if(currentAccountSlug()!=='admin'||!engine.actor)return null;const a=engine.actor;return{dragon:a.dragon?.name,breed:a.dragon?.breedId,universe:a.personalityUniverseSummary(),axes:{...(a.personalityUniverse?.axes||{})},assigned:a.personalityUniverseAllTraits(),discovered:a.personalityUniverseDiscovered(),quirks:(a.personalityUniverse?.quirks||[]),discoveredQuirks:[...(a.personalityUniverse?.discoveredQuirks||[])],habits:{...(a.personalityUniverse?.habits||{})},recentActivity:[...(a.personalityUniverse?.recentActivity||[])],transitions:{...(a.personalityUniverse?.transitions||{})}};},explainNextAction(){if(currentAccountSlug()!=='admin'||!engine.actor)return null;const a=engine.actor,scores=a.scoreActions(Date.now(),true),rows=Object.entries(scores).sort((x,y)=>y[1]-x[1]).map(([action,score])=>({action,score:+Number(score).toFixed(2)}));return{winner:rows[0]?.action||'idle',scores:rows.slice(0,8),carePriority:a.carePriorityNeed(),recent:[...(a.memory?.recentActions||[])],traits:a.personalityUniverseAllTraits()};},forceThink(){if(currentAccountSlug()!=='admin'||!engine.actor)return null;const a=engine.actor;a.nextDecision=0;a.stateUntil=0;a.decide(performance.now());return{state:a.state,scores:{...a.lastScores}};}};
  window.DragonboundCareDebug={inspect(){if(currentAccountSlug()!=='admin'||!engine.actor)return null;return{care:engine.actor.careStats(),internalNeeds:{...engine.actor.needs},bond:engine.actor.bond,relationship:engine.actor.bondRelationship(),mood:engine.actor.moodSummary()};},set(values={}){if(currentAccountSlug()!=='admin'||!engine.actor)return null;const a=engine.actor;if(Number.isFinite(Number(values.hunger)))a.needs.hunger=clamp(100-Number(values.hunger),0,100);if(Number.isFinite(Number(values.hygiene)))a.needs.hygiene=clamp(100-Number(values.hygiene),0,100);if(Number.isFinite(Number(values.energy)))a.needs.rest=clamp(100-Number(values.energy),0,100);if(Number.isFinite(Number(values.fun)))a.needs.stimulation=clamp(100-Number(values.fun),0,100);if(Number.isFinite(Number(values.bond)))a.bond=clamp(Number(values.bond),0,100);a.behaviourDirty=true;engine.updateNeedsHud(true);return this.inspect();}};

  window.DragonboundSkillDebug={
    inspect(){if(currentAccountSlug()!=='admin'||!engine.actor)return null;const a=engine.actor;return{growth:a.growthInfo(),skills:Object.fromEntries(DRAGON_SKILLS.map(k=>[k,{...a.skills[k],rank:a.skillRank(k).name,progress:a.skillProgress(k),modifier:a.learningModifier(k)}])),trainingPlan:a.skillTrainingPlan?JSON.parse(JSON.stringify(a.skillTrainingPlan)):null,fatigue:{...(a.memory.skillFatigue||{})},cooldowns:Object.fromEntries(DRAGON_SKILLS.map(k=>[k,a.skillCooldownStatus(k)]))};},
    set(values={}){if(currentAccountSlug()!=='admin'||!engine.actor)return null;const a=engine.actor;for(const [key,level] of Object.entries(values||{})){if(!DRAGON_SKILLS.includes(key)||!Number.isFinite(Number(level)))continue;const clamped=clamp(Number(level),0,100),xp=skillXpForLevel(clamped),s=a.skills[key];s.xp=+xp.toFixed(3);s.lifetimeXp=Math.max(Number(s.lifetimeXp||0),s.xp);s.level=+clamped.toFixed(3);s.lastGainAt=Date.now();s.lastSource='Admin debug';}a.memory.skills=a.skills;a.behaviourDirty=true;engine.saveBehaviourLocal();return this.inspect();}
  };
  window.DragonboundInteractionDebug={inspect(){if(currentAccountSlug()!=='admin'||!engine.actor)return null;const a=engine.actor,p=a.physicalInteraction;return p?{state:a.state,kind:p.kind,source:p.meta,classification:{...p.flags},elapsed:+p.elapsedSec.toFixed(2),duration:p.durationSec,settle:p.settleSec,care:a.furnitureCarePlan?{elapsed:a.furnitureCarePlan.elapsedSec,duration:a.furnitureCarePlan.durationSec,deltas:{...a.furnitureCarePlan.deltas}}:null,skills:a.skillTrainingPlan?{elapsed:a.skillTrainingPlan.elapsedSec,duration:a.skillTrainingPlan.durationSec,gains:{...a.skillTrainingPlan.gains}}:null}:null;}};
  window.DragonboundLifeDebug={
    inspect(){if(currentAccountSlug()!=='admin'||!engine.actor)return null;const a=engine.actor,life=a.lifeData();return{currentEvent:a.currentLifeEvent?{...a.currentLifeEvent}:null,recentEvents:[...(life.recentEvents||[])],eligibleEvents:a.lifeEventCandidates().map(v=>({type:v.type,score:+Number(v.score||0).toFixed(2),target:v.target?.name||''})),eventCooldowns:{...(life.cooldowns||{})},globalReadyAt:Number(life.globalReadyAt||0),routinePreferences:JSON.parse(JSON.stringify(life.routineCounts||{})),lastMeaningfulMoment:{...(life.lastMeaningfulMoment||{})},eventCounts:{...(life.eventCounts||{})},moodCounts:{...(life.moodCounts||{})}};},
    trigger(type){if(currentAccountSlug()!=='admin'||!engine.actor)return false;const a=engine.actor,key=String(type||''),candidate=a.lifeEventCandidates().find(v=>v.type===key);a.lifeData().globalReadyAt=0;a.lifeData().cooldowns[key]=0;return a.startDailyLifeEvent(key,candidate?.target||null,true);}
  };
  window.DragonboundSkillDefinitions={keys:DRAGON_SKILLS.slice(),labels:{...DRAGON_SKILL_LABELS},ranks:DRAGON_SKILL_RANKS.map(v=>({...v})),growthStages:GROWTH_STAGES.map(v=>({...v,maxDays:Number.isFinite(v.maxDays)?v.maxDays:null})),markRewards:{...SKILL_MARK_REWARDS}};
})();
