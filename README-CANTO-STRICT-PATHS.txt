CANTO PLAINS — STRICT PATHING + SCALE/SPEED TWEAK

Replace / merge:
- script.js
- assets/canto-plains-collision-mask.png

Changes:
- Movement is now restricted to the actual dirt-road / plaza network derived from the Canto Plains artwork and red pathing reference.
- Water, fields, grass interiors, cliffs and off-route terrain are hard collision unless they form part of an intended path/plaza.
- The collision map no longer defaults to 'walk anywhere' while the mask is loading.
- Collision asset now preloads when the Level Hunter interface opens.
- Hunter character is 15% smaller.
- Hunter walking speed reduced from 135 to 118 world units/second.
- Existing Canto camera, POIs, Elvane progression, audio, menus and Repo Sports code remain untouched.

Hard refresh after replacing: Ctrl + Shift + R.
