-- Popular songs share the existing round, scoring and shuffle mechanics.
-- Apply after the Disney category migration, then the popular-only catalogue seed.
begin;
alter table reparty_private.soundtracks drop constraint if exists soundtracks_category_check;
alter table reparty_private.soundtracks add constraint soundtracks_category_check
 check (category in ('game','movie','disney','popular'));
do $upgrade$
declare definition text;
begin
 select pg_get_functiondef('public.reparty_soundtrack_action(text,text,jsonb)'::regprocedure) into definition;
 if position($old$('game','movie','disney','mixed')$old$ in definition)>0 then
  execute replace(definition,$old$('game','movie','disney','mixed')$old$,$new$('game','movie','disney','popular','mixed')$new$);
 elsif position($new$('game','movie','disney','popular','mixed')$new$ in definition)=0 then
  raise exception 'Unrecognised soundtrack category validation; popular-songs update stopped.';
 end if;
end;
$upgrade$;
notify pgrst, 'reload schema';
commit;
