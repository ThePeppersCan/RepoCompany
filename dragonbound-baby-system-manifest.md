# Velmora: Dragonbound — Baby Dragon Movement Manifest

## Implementation summary

- 30 supplied baby-dragon animation sheets registered.
- 480 individual transparent animation frames prepared (16 per breed).
- 5 supplied starter-house interiors mapped independently.
- 150 breed × starter-house combinations validated by the automated compatibility test.
- Movement engine uses one coordinated requestAnimationFrame loop, semantic animation states, normalised house coordinates, hand-tuned stair routes, rare indoor flight, state cooldowns and periodic lightweight movement saves.
- Existing Dragonbound adoption/reveal/naming flow is preserved; the named dragon is spawned only after the reveal/name sequence in the selected house.

## Baby dragons registered

- `vardesh` — Vardesh — source: `01 Vardesh Baby Dragon Animations.png` — 16 frames — no animation fallbacks required
- `lumerre` — Lumerre — source: `02_Lumerre_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `kordesh` — Kordesh — source: `03_Kordesh_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `nambara` — Nambara — source: `04_Nambara_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `norveth` — Norveth — source: `05_Norveth_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `zafran` — Zafran — source: `06_Zafran_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `elvane` — Elvane — source: `07_Elvane_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `qasmir` — Qasmir — source: `08_Qasmir_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `calvora` — Calvora — source: `09_Calvora_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `rovarn` — Rovarn — source: `10_Rovarn_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `talune` — Talune — source: `11_Talune_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `drazhen` — Drazhen — source: `12_Drazhen_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `belros` — Belros — source: `13_Belros_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `marovar` — Marovar — source: `14_Marovar_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `sorevia` — Sorevia — source: `15_Sorevia_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `iskandar` — Iskandar — source: `16_Iskandar_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `blackglass-coast` — Blackglass Coast — source: `17_Blackglass_Coast_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `skallheim` — Skallheim — source: `18_Skallheim_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `hestholm-fjord` — Hestholm Fjord — source: `19_Hestholm_Fjord_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `nyrgate-aurora` — Nyrgate Aurora — source: `20_Nyrgate_Aurora_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `warmvein-krellhaven` — Warmvein / Krellhaven — source: `21_Warmvein_Krellhaven_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `aurelia` — Aurelia — source: `22_Aurelia_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `orsanne` — Orsanne — source: `23_Orsanne_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `saint-ciro` — Saint Ciro — source: `24_Saint_Ciro_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `marenza` — Marenza — source: `25_Marenza_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `grand-khor` — Grand Khor — source: `26_Grand_Khor_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `rova-end` — Rova End — source: `27_Rova_End_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `zafir-row` — Zafir Row — source: `28_Zafir_Row_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `ossa-mere` — Ossa Mere — source: `29_Ossa_Mere_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required
- `ashwick-cinderbank` — Ashwick / Cinderbank — source: `30_Ashwick_Cinderbank_Baby_Dragon_Animations.png` — 16 frames — no animation fallbacks required

## Starter houses mapped

- `vardesh-hestholm-fjord-starter` — source: `Vardesh_20k_Hestholm_Fjord_Starter.png` — 2 floors · staircase mapped
- `lumerre-greenhollow-starter` — source: `Lumerre_20k_Greenhollow_Starter_Cottage.png` — 2 floors · staircase mapped
- `nambara-naskor-edge-starter` — source: `Nambara_20k_Starter_Naskor_Edge.png` — 2 floors · staircase mapped
- `norveth-varka-fell-starter` — source: `Norveth_20k_Starter_Varka_Fell.png` — 2 floors · staircase mapped
- `elvane-canto-plains-starter` — source: `Starter home.png` — 2 floors · staircase mapped

## Animation mapping

- `idle`: frame 1
- `look`: standing/look pair
- `sit`: seated pose
- `rest`: curled/resting pose
- `sleep`: sleeping pose
- `walk`: three supplied walking/crawling poses
- `takeOff`: supplied launch poses
- `fly`: supplied airborne poses
- `land`: supplied descending/landing poses

No AI-generated replacement frames were used. The supplied sheets already contain 16 usable poses each, so no semantic-state fallbacks were necessary.

## Navigation / collision behaviour

- Every starter house uses its own floor polygons, blocked architectural zones, spawn points, rest/sleep zones, flight zones and staircase route.
- All navigation positions are normalised to the source house image.
- The house artwork and dragon layer share the same cover/zoom transform so resize and breathing effects remain aligned.
- Permanent architecture collision is separate from optional dynamic furniture collision.
- If Build Mode emits `dragonbound:furniture-changed`, unsafe paths are cancelled and an invalid current position is moved to a safe spawn.
- Furniture collision providers can expose polygons through `window.dragonboundFurnitureCollisionProvider()` or `localStorage.dragonboundFurnitureCollisions`.

## Development navigation editor

The editor is disabled for normal players. Enable it in the browser console and reload:

```js
DragonboundNavDebug.enable();
```

The debug overlay can inspect the current actor, draw new walkable/blocked/rest/sleep/flight polygons, add spawn points, create a stair route, undo draft points and export the current house navigation JSON. Disable it with:

```js
DragonboundNavDebug.disable();
```

## Adding a future baby-dragon sheet

1. Add the sprite sheet to the source asset set.
2. Prepare/crop its 4×4 supplied poses into transparent frames using the same frame preparation pipeline.
3. Add a `DragonAnimationDefinition` entry to `REGISTRY` in `dragonbound-baby-engine.js`.
4. Map the semantic states (`idle`, `look`, `walk`, `sit`, `rest`, `sleep`, `takeOff`, `fly`, `land`).
5. Validate foot anchor, native facing, rendered scale and collision radius.
6. Run the compatibility tests against every house.

## Adding a future house

1. Add the house image and stable house ID.
2. Enable the navigation debug editor.
3. Draw each floor separately; add permanent blocked zones.
4. Add spawn/rest/sleep/flight zones.
5. Add the visible staircase route waypoint-by-waypoint.
6. Export the map and add it to `HOUSE_MAPS` in `dragonbound-baby-engine.js`.
7. Run the navigation simulation and visually test in-browser.

## Automated tests run

- JavaScript syntax check: `script.js` — passed.
- JavaScript syntax check: `dragonbound-baby-engine.js` — passed.
- Sprite asset validation: 30 breeds / 480 frames / all 480 frames contain transparency — passed.
- Registry semantics validation: all 30 breeds expose all nine semantic animation states — passed.
- Combination matrix: 30 breeds × 5 houses = 150 combinations — passed.
- Seeded navigation simulation: 10,000 walking path checks — passed.
- Seeded flight-zone sampling: 2,000 checks — passed.
- Stair registry validation: 5 staircase connections — passed.

### Runtime note

The automated tests verify asset completeness, registry integrity and deterministic navigation safety. A final visual playtest in the deployed browser is still recommended for pixel-perfect stair/occlusion tuning on each responsive viewport, because the supplied house art is illustrated rather than tile-based.

## Changed / added files

- `index.html`
- `script.js`
- `style.css`
- `dragonbound-baby-engine.js`
- `assets/dragonbound/baby-dragons/registry.json`
- `assets/dragonbound/baby-dragons/manifest.json`
- `assets/dragonbound/baby-dragons/<30 breed folders>/frame-00.webp … frame-15.webp`
- `assets/dragonbound/property/starters/<5 starter house images>`
- `dragonbound-baby-system-manifest.md`
- `dragonbound-baby-system-test.js`
- `dragonbound-baby-navigation-sim-test.js`