-- Additive On the Menu awards; existing unlocks are preserved.
INSERT INTO dashboard_achievement_rules(id,game,metric,target,score) VALUES('comp_run_024','comp-run','completed_on_the_menu_normal',1,25) ON CONFLICT(id) DO NOTHING;
INSERT INTO dashboard_achievement_rules(id,game,metric,target,score) VALUES('comp_run_025','comp-run','completed_on_the_menu_nightmare',1,50) ON CONFLICT(id) DO NOTHING;
UPDATE dashboard_achievement_rules SET target=12 WHERE id='comp_run_017';
