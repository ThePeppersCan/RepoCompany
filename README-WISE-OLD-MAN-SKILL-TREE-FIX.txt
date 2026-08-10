REPO COMPANY — WISE OLD MAN + PROFESSIONAL SKILL TREE RESTORE

UPLOAD
1. Copy script.js into the website root and replace the existing script.js.
2. Run fix-wise-old-man-all-xp-sources.sql ONCE in Supabase SQL Editor.
3. Hard refresh the site after deployment.

WISE OLD MAN
- Tasks now use canonical character XP totals rather than a particular weapon/activity.
- Combat counts Attack + Strength + Defence + Magic + Ranged XP.
- Agility, Slayer, Sailing and Runecrafting count every valid source that writes to that skill's normal XP total.
- No map, weapon, activity, difficulty or game-mode restriction is used.
- Existing active Combat task progress is migrated safely so old Magic/Ranged XP does not falsely complete it.
- Existing Wise Old Man task variants, rewards, skipping and claim behaviour are left intact.

SKILL TREE
- Restores the Professional Skill Tree renderer that the existing style.css was built for.
- Harmony is the shared central foundation.
- Gathering: Woodcutting, Mining, Fishing, Farming.
- Combat: Attack, Strength, Defence, Magic, Ranged, Slayer.
- Artisan: Cooking, Runecrafting.
- Adventure: Agility, Sailing.
- Restores Total Level, Total XP, Highest Skill and Mastered summaries.
- Each skill shows level, XP, progress %, XP remaining and Level 99 mastered state.
- No World Cup, TCG, cosmetics or Repo Sports files are changed by this patch.
