-- Additive awards for the new course. Existing achievement rows remain intact.
INSERT INTO dashboard_achievement_rules(id,game,metric,target,score) VALUES('comp_run_020','comp-run','completed_last_draft_normal',1,25) ON CONFLICT(id) DO NOTHING;
INSERT INTO dashboard_achievement_rules(id,game,metric,target,score) VALUES('comp_run_021','comp-run','completed_last_draft_nightmare',1,50) ON CONFLICT(id) DO NOTHING;
