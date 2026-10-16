# Broomflight — Velmora

Repo Company’s solo course-racing demo. Open `/Demos/broomflight` from the website or `/broomflight/` for the standalone game.

This first demo is available on the website. It is omitted from the native launcher's catalogue until a launcher build adds it to its supported embedded-game list.

Adapted from the user-supplied `sunbreak-downhill-3D-game-main.zip` (SUNBREAK by Imirushik, https://github.com/Imirushik/sunbreak-downhill-3D-game). The cel renderer, terrain generation and race framework derive from that source. Broom characters, flight physics, Elvane scenery, controls and interface are the Repo Company adaptation. No separate upstream license file was included in the supplied archive; retain this provenance record.

Run `npm ci --ignore-scripts` in this directory, then `npm run build`. The dashboard build invokes the same build and ships only compiled output to `dist/broomflight`. All art is procedural apart from the existing Repo Company logo. No runtime third-party CDN requests. Three.js carries its MIT notice in the generated bundle.

W/up accelerates, A/D steers, S/down brakes, hold Space to climb (release to descend), Shift boosts, C skims, 1–7 perform aerial tricks. Escape/P pauses. Mobile has touch controls and automatic throttle. Best times and a ghost are saved locally under `repo.broomflight.best.v1`, independently of other games.

`?capture=1` exposes `window.__BROOMFLIGHT` for deterministic test stepping and screenshots. Race time uses a fixed 120 Hz simulation.
