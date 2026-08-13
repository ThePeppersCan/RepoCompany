LEVEL HUNTER — DARWIN DIALOGUE + RESET SETTINGS PATCH

Replace only:
- script.js

Changes:
- Darwin dialogue choices redesigned as compact premium dark-teal / aged-brass in-world controls.
- Choices fit the dialogue frame cleanly and use a restrained hover sheen rather than generic browser-button styling.
- Animal Centre Settings hotspot now opens a dedicated premium Settings panel.
- Added Reset Animal Centre Progress.
- Reset requires a second explicit "Are you sure?" confirmation.
- Reset clears Level Hunter wildlife/journal/inventory/quests/Centre animals, Canto field notes, Elvane progression and the admin unlock preview.
- Reset also overwrites the existing account-backed Level Hunter wildlife save with a fresh default state using the existing upsert permissions; no new SQL is required.
- Escape closes Settings before closing the Animal Centre menu.

Hard refresh after replacement: Ctrl + Shift + R.
