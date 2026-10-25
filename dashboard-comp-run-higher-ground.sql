-- Additive Higher Ground awards; existing earned awards and scores remain intact.
INSERT INTO dashboard_achievement_rules(id,game,metric,target,score) VALUES('comp_run_026','comp-run','completed_higher_ground_normal',1,25) ON CONFLICT(id) DO NOTHING;
INSERT INTO dashboard_achievement_rules(id,game,metric,target,score) VALUES('comp_run_027','comp-run','completed_higher_ground_nightmare',1,50) ON CONFLICT(id) DO NOTHING;
UPDATE dashboard_achievement_rules SET target=13 WHERE id='comp_run_017';
