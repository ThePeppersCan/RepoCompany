-- Ten-second musical reveals and Chill mode without a finish line. Existing sessions and scores are preserved.
begin;
create or replace function reparty_private.soundtrack_view(g jsonb) returns jsonb
language sql stable set search_path='' as $$
 select jsonb_build_object('version',1,'host',g->'host','revision',g->'revision','session',g->'session',
  'phase',g->'phase','paused',g->'paused','paused_by',g->'paused_by','remaining_ms',g->'remaining_ms',
  'deadline',g->'deadline','mode',g->'mode','category',g->'category','difficulty',g->'difficulty',
  'seconds',g->'seconds','round',g->'round','total',g->'total','token',g->'token',
  'players',coalesce(g->'players','[]'::jsonb),'scores',coalesce(g->'scores','{}'::jsonb),
  'solved',coalesce(g->'solved','[]'::jsonb),'ready',coalesce(g->'ready','[]'::jsonb),
  'video_id',g->'video_id','start_seconds',g->'start_seconds','reveal_position',g->'reveal_position',
  'answer',case when g->>'phase'='reveal' then
   (select jsonb_build_object('title',s.title,'track',s.track,'composer',s.composer,'year',s.year,'category',s.category)
    from reparty_private.soundtracks s where s.id=g->>'current_id') else null end,
  'history',coalesce(g->'history','[]'::jsonb));
$$;

create or replace function public.reparty_soundtrack_action(p_action text,p_room text,p_data jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 u uuid:=auth.uid(); r public.reparty_rooms%rowtype; g jsonb; snap jsonb; oldgame jsonb; stamp timestamptz;
 roster jsonb; who jsonb; item jsonb; deck jsonb; t reparty_private.soundtracks%rowtype;
 phase text; team text; unit text; units jsonb; key text; score integer; n integer; roundno integer;
 duration integer; maxdifficulty integer; total integer; cursorno integer; remaining double precision;
 changed boolean:=false; advance boolean:=false; reveal boolean:=false; feedback text; ishost boolean;
begin
 if u is null then raise exception 'Please sign in to play.'; end if;
 if jsonb_typeof(p_data) is distinct from 'object' then raise exception 'Invalid game request.'; end if;
 snap:=public.reparty_action('snapshot',p_room,'{}'::jsonb);
 select * into r from public.reparty_rooms where id=p_room for update;
 stamp:=clock_timestamp();
 select state into g from reparty_private.soundtrack_sessions where room_id=p_room;
 oldgame:=coalesce(r.settings->'game','{"mode":"watch","revision":0}'::jsonb);
 if p_action='enter' then
  if oldgame->>'mode'='game' then raise exception 'Return to the game menu first.'; end if;
  if oldgame->>'mode'='soundtrack' then return snap; end if;
  if g is null then g:=jsonb_build_object('phase','setup','revision',0,'paused',false,'session',gen_random_uuid()); end if;
  g:=g||jsonb_build_object('host',u);
  -- Freeze the watch queue so returning from a quiz keeps its exact place.
  if coalesce((r.playback->>'playing')::boolean,false) then
   update public.reparty_rooms set playback=playback||jsonb_build_object('playing',false,
    'position',least(86400,coalesce((playback->>'position')::double precision,0)+greatest(0,extract(epoch from (stamp-(playback->>'updated_at')::timestamptz)))),
    'updated_at',stamp) where id=p_room;
  end if;
  update public.reparty_rooms set settings=jsonb_set(settings,'{game}',oldgame||jsonb_build_object('mode','soundtrack','host',u,'revision',coalesce((oldgame->>'revision')::integer,0)+1)) where id=p_room;
  changed:=true;
 else
  if g is null or oldgame->>'mode' is distinct from 'soundtrack' then raise exception 'Open Guess the Soundtrack first.'; end if;
  ishost:=g->>'host'=u::text; phase:=g->>'phase';
  select v into who from jsonb_array_elements(coalesce(g->'players','[]'::jsonb)) v where v->>'id'=u::text;
  if p_action in ('guess','ready','tick','error') and p_data->>'token' is distinct from g->>'token' then return snap; end if;
  if p_action in ('pause','resume') and p_data->>'token' is distinct from g->>'token' then return snap; end if;
  -- Chill listeners can join an ongoing session with their existing room identity.
  if g->>'mode'='chill' and who is null and p_action='join' then
   if jsonb_array_length(g->'players')>=24 then raise exception 'This listening club already has 24 players.'; end if;
   select jsonb_build_object('id',m.user_id,'name',m.display_name,'avatar_id',coalesce(p.avatar_id,0),'team','1') into who
    from public.reparty_members m left join public.reparty_profiles p on p.user_id=m.user_id
    where m.room_id=p_room and m.user_id=u;
   g:=jsonb_set(g,'{players}',g->'players'||jsonb_build_array(who));changed:=true;
  end if;
  if p_action in ('start','reset','next','skip','exit','takeover') and
   coalesce((p_data->>'revision')::integer,-1)<>coalesce((g->>'revision')::integer,0) then
   return snap||'{"quiz_stale":true}'::jsonb;
  end if;
  if p_action='takeover' then
   if exists(select 1 from public.reparty_members where room_id=p_room and user_id=(g->>'host')::uuid and last_seen>stamp-interval '60 seconds') then raise exception 'The host is still connected.'; end if;
   g:=g||jsonb_build_object('host',u);changed:=true;
   update public.reparty_rooms set settings=jsonb_set(settings,'{game}',oldgame||jsonb_build_object('host',u)) where id=p_room;
  elsif p_action='exit' then
   if not ishost then raise exception 'Only the host can leave the game for everyone.'; end if;
   if not coalesce((g->>'paused')::boolean,false) then
    remaining:=greatest(0,extract(epoch from ((g->>'deadline')::timestamptz-stamp))*1000);
    g:=g||jsonb_build_object('paused',true,'remaining_ms',remaining,'deadline',null,'paused_by',u);
   end if;
   update public.reparty_rooms set settings=jsonb_set(settings,'{game}',oldgame||jsonb_build_object('mode','watch','revision',coalesce((oldgame->>'revision')::integer,0)+1)) where id=p_room;
   changed:=true;
  elsif p_action='reset' then
   if not ishost then raise exception 'Only the host can set up a new game.'; end if;
   g:=jsonb_build_object('phase','setup','host',u,'revision',g->'revision','paused',false,'session',gen_random_uuid()); changed:=true;
  elsif p_action='start' then
   if not ishost then raise exception 'Only the host can start the game.'; end if;
   if phase<>'setup' then raise exception 'Set up a new game first.'; end if;
   if coalesce(p_data->>'mode','') not in ('versus','teams','group','chill') or coalesce(p_data->>'category','') not in ('game','movie','mixed') then raise exception 'Choose a game category and play style.'; end if;
   duration:=(p_data->>'seconds')::integer; maxdifficulty:=(p_data->>'difficulty')::integer; total:=(p_data->>'rounds')::integer;
   if duration is null or duration not in (10,15,20,30) or maxdifficulty is null or maxdifficulty not between 1 and 5 or total is null or total not in (10,20,50) then raise exception 'Choose valid round settings.'; end if;
   if jsonb_typeof(p_data->'players') is distinct from 'array' or jsonb_array_length(p_data->'players') not between 1 and 24 then raise exception 'Choose between 1 and 24 connected players.'; end if;
   roster:='[]'::jsonb;
   for item in select * from jsonb_array_elements(p_data->'players') loop
    if exists(select 1 from jsonb_array_elements(roster) v where v->>'id'=item->>'id') then raise exception 'Each player can join once.'; end if;
    select jsonb_build_object('id',m.user_id,'name',m.display_name,'avatar_id',coalesce(p.avatar_id,0)) into who
     from public.reparty_members m left join public.reparty_profiles p on p.user_id=m.user_id
     where m.room_id=p_room and m.user_id=(item->>'id')::uuid and m.last_seen>stamp-interval '60 seconds';
    if who is null then raise exception 'A player disconnected. Refresh the roster.'; end if;
    team:=coalesce(item->>'team','1');if team not in ('1','2','3','4') then raise exception 'Choose a valid team.'; end if;
    roster:=roster||jsonb_build_array(who||jsonb_build_object('team',team));
   end loop;
   if p_data->>'mode'='teams' and (select count(distinct v->>'team') from jsonb_array_elements(roster) v)<2 then raise exception 'Put players on at least two teams.'; end if;
   select jsonb_agg(id) into deck from (select id from
    (select distinct on (video_id) id,video_id from reparty_private.soundtracks where video_id is not null and
     (p_data->>'category'='mixed' or category=p_data->>'category') and difficulty<=maxdifficulty order by video_id,random()) recordings
    order by random() limit case when p_data->>'mode'='chill' then null else total end) picked;
   if coalesce(jsonb_array_length(deck),0)=0 then raise exception 'No playable tracks match these settings yet.'; end if;
   g:=jsonb_build_object('host',u,'revision',g->'revision','session',gen_random_uuid(),'mode',p_data->>'mode','category',p_data->>'category',
    'seconds',duration,'difficulty',maxdifficulty,'players',roster,'scores','{}'::jsonb,'history','[]'::jsonb,'deck',deck,'deck_cursor',0,'round',0,'total',case when p_data->>'mode'='chill' then null else jsonb_array_length(deck) end,'paused',false);
   advance:=true;
  elsif p_action in ('pause','resume') then
   if who is null and not ishost then raise exception 'Only players can pause or resume.'; end if;
   if phase in ('setup','finished','unavailable') then return snap; end if;
   if p_action='pause' and not coalesce((g->>'paused')::boolean,false) then
    remaining:=greatest(0,extract(epoch from ((g->>'deadline')::timestamptz-stamp))*1000);
    g:=g||jsonb_build_object('remaining_ms',remaining,'deadline',null,'paused',true,'paused_by',u);changed:=true;
   elsif p_action='resume' and coalesce((g->>'paused')::boolean,false) then
    g:=g||jsonb_build_object('deadline',stamp+make_interval(secs=>coalesce((g->>'remaining_ms')::double precision,0)/1000),'paused',false,'paused_by',null);changed:=true;
   end if;
  elsif p_action='ready' then
   if phase='loading' and (who is not null or ishost) and not coalesce(g->'ready','[]'::jsonb) ? u::text then
    g:=jsonb_set(g,'{ready}',coalesce(g->'ready','[]'::jsonb)||jsonb_build_array(u));changed:=true;
   end if;
  elsif p_action='guess' then
   if who is null then raise exception 'You are watching this game. Join the next one to score.'; end if;
   if phase<>'guess' or coalesce((g->>'paused')::boolean,false) or (g->>'deadline')::timestamptz<=stamp then raise exception 'This round is not accepting answers.'; end if;
   if char_length(trim(coalesce(p_data->>'answer',''))) not between 2 and 160 then raise exception 'Type a game, movie or track name.'; end if;
   unit:=case g->>'mode' when 'teams' then 'team-'||(who->>'team') when 'group' then 'group' else u::text end;
   if g->'solved' ? unit then feedback:='already';
   else
    if (g->'guesses'->u::text->>'at')::timestamptz>stamp-interval '700 milliseconds' then raise exception 'Give your next guess a moment.'; end if;
    select * into t from reparty_private.soundtracks where id=g->>'current_id';
    g:=jsonb_set(g,'{guesses}',coalesce(g->'guesses','{}'::jsonb)||jsonb_build_object(u::text,jsonb_build_object('at',stamp)));
    if reparty_private.soundtrack_matches(p_data->>'answer',t.aliases) then
     g:=jsonb_set(g,'{solved}',g->'solved'||jsonb_build_array(unit));feedback:='correct';
    else feedback:='incorrect';end if;
    changed:=true;
   end if;
  elsif p_action='error' then
   -- One guest with a local blocker must not cancel the room's question.
   if ishost and phase in ('loading','countdown','guess') then
    g:=g||jsonb_build_object('phase','unavailable','paused',true,'deadline',null);changed:=true;
   end if;
  elsif p_action in ('next','skip') then
   if not ishost then raise exception 'Only the host can move the round on.'; end if;
   if phase in ('setup','finished') then return snap; end if;
   if p_action='skip' or phase in ('reveal','unavailable') then advance:=true; else reveal:=true;end if;
  elsif p_action='join' and g->>'mode'='chill' then null;
  elsif p_action<>'tick' then raise exception 'Unknown soundtrack action.';
  end if;
  -- Presence and server time, not client timestamps, control automatic progression.
  if not advance and not reveal and p_action in ('tick','ready') and not coalesce((g->>'paused')::boolean,false) then
   phase:=g->>'phase';
   if phase='loading' and (
    (g->>'deadline')::timestamptz<=stamp or not exists(select 1 from jsonb_array_elements(g->'players') v
      join public.reparty_members m on m.user_id=(v->>'id')::uuid and m.room_id=p_room
      where m.last_seen>stamp-interval '60 seconds' and not g->'ready' ? (v->>'id'))
   ) then
    g:=g||jsonb_build_object('phase','countdown','deadline',stamp+interval '3 seconds','remaining_ms',3000);changed:=true;
   elsif phase='countdown' and (g->>'deadline')::timestamptz<=stamp then
    g:=g||jsonb_build_object('phase','guess','deadline',stamp+make_interval(secs=>(g->>'seconds')::integer),'remaining_ms',(g->>'seconds')::integer*1000);changed:=true;
   elsif phase='guess' and (g->>'deadline')::timestamptz<=stamp then reveal:=true;
   elsif phase='reveal' and (g->>'deadline')::timestamptz<=stamp then advance:=true;
   end if;
  end if;
 end if;
 if reveal then
  -- Keep the music continuous, including an early reveal or a reveal while paused.
  remaining:=case when coalesce((g->>'paused')::boolean,false) then coalesce((g->>'remaining_ms')::double precision,0)
   else greatest(0,extract(epoch from ((g->>'deadline')::timestamptz-stamp))*1000) end;
  g:=g||jsonb_build_object('reveal_position',case when g->>'phase'='guess' then greatest(0,(g->>'seconds')::double precision-remaining/1000) else 0 end);
  for key in select jsonb_array_elements_text(coalesce(g->'solved','[]'::jsonb)) loop
   score:=coalesce((g->'scores'->>key)::integer,0)+1;g:=jsonb_set(g,array['scores',key],to_jsonb(score));
  end loop;
  select * into t from reparty_private.soundtracks where id=g->>'current_id';
  g:=g||jsonb_build_object('phase','reveal','deadline',case when coalesce((g->>'paused')::boolean,false) then null else stamp+interval '10 seconds' end,'remaining_ms',10000,
   'history',g->'history'||jsonb_build_array(jsonb_build_object('title',t.title,'track',t.track,'round',g->'round','solved',g->'solved')));changed:=true;
  if g->>'mode'='chill' then
   g:=jsonb_set(g,'{history}',(select jsonb_agg(value order by ord) from
    (select value,ord from jsonb_array_elements(g->'history') with ordinality h(value,ord) order by ord desc limit 100) recent));
  end if;
 end if;
 if advance then
  roundno:=(g->>'round')::integer+1;
  if roundno>(g->>'total')::integer then
   g:=g||jsonb_build_object('phase','finished','paused',false,'deadline',null,'video_id',null,'token',gen_random_uuid());
  else
   cursorno:=coalesce((g->>'deck_cursor')::integer,(g->>'round')::integer)+1;
   if g->>'mode'='chill' and cursorno>jsonb_array_length(g->'deck') then
    -- Shuffle a fresh cycle, avoiding an immediate repeat at its boundary when possible.
    select jsonb_agg(id) into deck from
     (select id from jsonb_array_elements_text(g->'deck') d(id) order by (id=g->>'current_id'),random()) shuffled;
    g:=jsonb_set(g,'{deck}',deck);cursorno:=1;
   end if;
   select * into t from reparty_private.soundtracks where id=g->'deck'->>(cursorno-1);
   g:=jsonb_set(g,'{deck_cursor}',to_jsonb(cursorno));
   g:=g||jsonb_build_object('phase','loading','round',roundno,'current_id',t.id,'video_id',t.video_id,'start_seconds',t.start_seconds,
    'token',gen_random_uuid(),'ready','[]'::jsonb,'solved','[]'::jsonb,'guesses','{}'::jsonb,
    'deadline',case when coalesce((g->>'paused')::boolean,false) then null else stamp+interval '12 seconds' end,'remaining_ms',12000);
  end if;changed:=true;
 end if;
 if changed then
  g:=g||jsonb_build_object('revision',coalesce((g->>'revision')::integer,0)+1);
  insert into reparty_private.soundtrack_sessions values(p_room,g) on conflict(room_id) do update set state=excluded.state;
  update public.reparty_rooms set settings=jsonb_set(settings,'{soundtrack}',reparty_private.soundtrack_view(g)),revision=revision+1,updated_at=stamp where id=p_room;
  snap:=public.reparty_action('snapshot',p_room,'{}'::jsonb);
 end if;
 return snap||jsonb_build_object('quiz_feedback',feedback);
end; $$;
commit;
