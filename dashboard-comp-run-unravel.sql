-- Add UNRAVEL completions; retain every previously earned award and score.
INSERT INTO dashboard_achievement_rules(id,game,metric,target,score) VALUES('comp_run_030','comp-run','completed_unravel_normal',1,25) ON CONFLICT(id) DO NOTHING;
INSERT INTO dashboard_achievement_rules(id,game,metric,target,score) VALUES('comp_run_031','comp-run','completed_unravel_nightmare',1,50) ON CONFLICT(id) DO NOTHING;
UPDATE dashboard_achievement_rules SET target=15 WHERE id='comp_run_017';
