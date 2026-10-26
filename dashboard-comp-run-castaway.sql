-- Add Castaway awards without revoking existing awards or changing scores.
INSERT INTO dashboard_achievement_rules(id,game,metric,target,score) VALUES('comp_run_028','comp-run','completed_castaway_normal',1,25) ON CONFLICT(id) DO NOTHING;
INSERT INTO dashboard_achievement_rules(id,game,metric,target,score) VALUES('comp_run_029','comp-run','completed_castaway_nightmare',1,50) ON CONFLICT(id) DO NOTHING;
UPDATE dashboard_achievement_rules SET target=14 WHERE id='comp_run_017';
