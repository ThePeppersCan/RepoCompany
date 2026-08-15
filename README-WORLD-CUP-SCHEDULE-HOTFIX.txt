RepoCompany — World Cup Saturday Schedule Hotfix
Baseline: Repo Diver V18.1 UI Polish Hotfix

CHANGED
- Replaced the World Cup fixtures board artwork with the supplied Friday/Saturday schedule.
- Drazhen vs Rovarn moved to Saturday 15 August at 10:30pm UK.
- Vardesh vs Marovar moved to Saturday 15 August at 11:00pm UK.
- Waiting rooms now unlock 15 minutes before kickoff:
  Talune vs Kordesh: 8:45pm
  Norveth vs Qasmir: 9:15pm
  Nambara vs Elvane: 9:45pm
  Drazhen vs Rovarn: 10:15pm
  Vardesh vs Marovar: 10:45pm
- Saturday board hotspots realigned for all five rows.

PRESERVED
- Existing fixture IDs are unchanged.
- Existing official Supabase match results are not reset or rewritten.
- Completed-result pills continue to render on the fixtures board from the same stored result records.
- No Supabase/database migration was performed.
- All unrelated RepoCompany and Repo Diver V18.1 systems are untouched.

DEPLOY
Replace index.html and add:
assets/repo-sports-world-cup-fixtures-20260815.png
