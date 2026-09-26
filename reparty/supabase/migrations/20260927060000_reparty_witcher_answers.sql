-- Accept familiar Witcher series names without confusing explicit sequel numbers.
-- Catalogue-only: active rounds, timers and scores are preserved.
begin;
update reparty_private.soundtracks t set aliases=(select jsonb_agg(distinct a) from jsonb_array_elements(t.aliases||x.aliases) a)
from jsonb_to_recordset($aliases$[{"id":"game-0047","aliases":["Witcher","The Witcher","Witcher 3","The Witcher 3"]},{"id":"game-0756","aliases":["Witcher","The Witcher","Witcher 2","The Witcher 2"]}]$aliases$::jsonb) as x(id text,aliases jsonb) where t.id=x.id;
commit;
