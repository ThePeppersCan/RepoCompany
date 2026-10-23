-- Add new awards; earned awards and RepoScore are never removed.
INSERT INTO dashboard_achievement_rules(id,game,metric,target,score) VALUES('comp_run_022','comp-run','completed_rep_orca_normal',1,25) ON CONFLICT(id) DO NOTHING;
INSERT INTO dashboard_achievement_rules(id,game,metric,target,score) VALUES('comp_run_023','comp-run','completed_rep_orca_nightmare',1,50) ON CONFLICT(id) DO NOTHING;
UPDATE dashboard_achievement_rules SET target=11 WHERE id='comp_run_017';
