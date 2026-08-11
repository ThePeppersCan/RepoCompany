REPO SPORTS WORLD CUP — ADMIN FIXTURE LOBBY SELECTOR

This update modifies index.html only.

ADMIN TUNE IN LIVE FLOW:
TUNE IN! LIVE
-> Choose fixture
-> Fixture-specific lobby opens
-> Correct teams / flags / date / kickoff time shown
-> Fixture has its own realtime presence/chat room
-> Host can send a START signal for the selected fixture

FIXTURES:
Friday 14th August
- Belros vs Zafran — 9pm
- Iskandar vs Calvora — 9:30pm
- Sorevia vs Lumerre — 10pm

Saturday 15th August
- Talune vs Kordesh — 9pm
- Norveth vs Qasmir — 9:30pm
- Nambara vs Elvane — 10pm

Sunday 16th August
- Drazhen vs Rovarn — 9pm
- Vardesh vs Marovar — 9pm

IMPORTANT:
- This patch intentionally does NOT yet switch the Quidditch gameplay engine by fixture.
- Belros vs Zafran retains the existing gameplay hook.
- Other fixtures stay safely in their chosen lobby after the host start signal until
  their real team/roster match loading is connected.
- Back from a lobby returns the admin to the fixture selector for quick testing.
- No Quidditch JS/CSS mechanics were changed in this patch.

Replace your existing index.html in the web2 folder.
