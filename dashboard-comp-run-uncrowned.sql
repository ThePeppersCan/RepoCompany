-- Add Uncrowned completion awards without changing existing awards or scores.
INSERT INTO dashboard_achievement_rules(id,game,metric,target,score) VALUES('comp_run_018','comp-run','completed_uncrowned_normal',1,25) ON CONFLICT(id) DO UPDATE SET metric=excluded.metric,target=excluded.target;
INSERT INTO dashboard_achievement_rules(id,game,metric,target,score) VALUES('comp_run_019','comp-run','completed_uncrowned_nightmare',1,50) ON CONFLICT(id) DO UPDATE SET metric=excluded.metric,target=excluded.target;
