-- Add Disney/Pixar/DreamWorks, live-action musicals and Disney Channel.
-- Preserve the deployed game function, room state, permissions and clip settings.
begin;
alter table reparty_private.soundtracks drop constraint if exists soundtracks_category_check;
alter table reparty_private.soundtracks add constraint soundtracks_category_check
 check (category in ('game','movie','disney'));

do $upgrade$
declare definition text;
begin
 select pg_get_functiondef('public.reparty_soundtrack_action(text,text,jsonb)'::regprocedure) into definition;
 if position($old$('game','movie','mixed')$old$ in definition)>0 then
  execute replace(definition,$old$('game','movie','mixed')$old$,$new$('game','movie','disney','mixed')$new$);
 elsif position($new$('game','movie','disney','mixed')$new$ in definition)=0 then
  raise exception 'Unrecognised soundtrack category validation; migration stopped without changing the game.';
 end if;
end;
$upgrade$;
notify pgrst, 'reload schema';
commit;
