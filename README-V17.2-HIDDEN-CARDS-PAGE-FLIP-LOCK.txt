Repo Company V18.1 — V17.2 Hidden Cards Page-Flip Lock
========================================================

Root cause fixed:
- V4/V5 and V6-V12 were still re-parenting/repositioning Hidden Cards during
  setQuidditchTcgBinderPage().
- V17.1 also recalculated its own coordinates repeatedly at
  80/220/480/820/1250ms while the page animation was moving.

V17.2:
- disables every old Hidden Cards position writer from V4 through V16.2.
- leaves one position owner only.
- freezes the exact current Hidden Cards + paintbrush coordinates BEFORE a page
  turn and reapplies those same values throughout the animation.
- it never measures the moving spread during a page flip.
- no new coordinate is calculated until normal opening/resizing.
- keeps the Harmony Enter-spam patch.
- World Cup Passport first eight tickets remain fixed in Supabase.
