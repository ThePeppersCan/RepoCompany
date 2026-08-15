-- Repo Diver V12 shared-world / seasons / records backend.
-- Applied live by ChatGPT; included in package for reference only.

alter table public.repo_diver_career_2026
  add column if not exists public_profile boolean not null default true,
  add column if not exists featured_catch_id bigint,
  add column if not exists featured_photo_id uuid;

create table if not exists public.repo_diver_validated_catches_2026 (
  id bigint generated always as identity primary key,
  run_id uuid not null references public.repo_diver_runs(id) on delete cascade,
  user_id uuid not null,
  username text not null,
  ordinal integer not null,
  fish_id text not null references public.repo_diver_catch_catalog(id),
  biome text not null,
  rarity text not null,
  quality smallint not null check (quality between 1 and 4),
  weight_kg numeric(10,2) not null check (weight_kg > 0),
  variant text not null default 'normal' check (variant in ('normal','albino','melanistic','luminous','golden')),
  named_specimen_id bigint,
  caught_at timestamptz not null default now(),
  unique(run_id, ordinal)
);
create index if not exists repo_diver_validated_catches_species_weight_idx on public.repo_diver_validated_catches_2026(fish_id,weight_kg desc);
create index if not exists repo_diver_validated_catches_recent_idx on public.repo_diver_validated_catches_2026(caught_at desc);
create index if not exists repo_diver_validated_catches_user_idx on public.repo_diver_validated_catches_2026(user_id,caught_at desc);

create table if not exists public.repo_diver_activity_2026 (
  id bigint generated always as identity primary key,
  user_id uuid,
  username text,
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists repo_diver_activity_recent_idx on public.repo_diver_activity_2026(created_at desc);

create table if not exists public.repo_diver_record_history_2026 (
  id bigint generated always as identity primary key,
  category text not null,
  record_key text not null,
  user_id uuid,
  username text not null,
  value numeric not null,
  source_kind text not null,
  source_id text,
  detail jsonb not null default '{}'::jsonb,
  achieved_at timestamptz not null default now(),
  unique(category,record_key,source_kind,source_id)
);
create index if not exists repo_diver_record_history_lookup_idx on public.repo_diver_record_history_2026(category,record_key,achieved_at desc);

create table if not exists public.repo_diver_tournament_archive_2026 (
  week_start date primary key,
  tournament_id text not null,
  format text not null,
  title text not null,
  target_key text,
  target_name text,
  winner_user_id uuid,
  winner_username text,
  winner_value numeric,
  podium jsonb not null default '[]'::jsonb,
  archived_at timestamptz not null default now()
);

create table if not exists public.repo_diver_named_specimens_2026 (
  id bigint generated always as identity primary key,
  code text not null unique,
  display_name text not null,
  fish_id text not null references public.repo_diver_catch_catalog(id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  caught_catch_id bigint,
  caught_by_user_id uuid,
  caught_by_username text,
  caught_at timestamptz,
  created_at timestamptz not null default now()
);

-- One launch-era shared named specimen. Future specimens can be inserted without a frontend deploy.
insert into public.repo_diver_named_specimens_2026(code,display_name,fish_id,starts_at,ends_at)
select 'old_ironjaw_2026_08','OLD IRONJAW','rift_shark',
       timestamptz '2026-08-15 00:00:00+00',timestamptz '2026-09-01 00:00:00+00'
where not exists(select 1 from public.repo_diver_named_specimens_2026 where code='old_ironjaw_2026_08');

-- Tables are intentionally not directly writable/readable from the browser. All social state goes through RPCs.
revoke all on public.repo_diver_validated_catches_2026 from anon, authenticated;
revoke all on public.repo_diver_activity_2026 from anon, authenticated;
revoke all on public.repo_diver_record_history_2026 from anon, authenticated;
revoke all on public.repo_diver_tournament_archive_2026 from anon, authenticated;
revoke all on public.repo_diver_named_specimens_2026 from anon, authenticated;

create or replace function public.repo_diver_note_record(
  p_category text,p_record_key text,p_user_id uuid,p_username text,p_value numeric,
  p_source_kind text,p_source_id text,p_detail jsonb default '{}'::jsonb
) returns boolean
language plpgsql security definer set search_path=public,auth as $$
declare prev numeric; inserted_id bigint;
begin
  select max(value) into prev from public.repo_diver_record_history_2026 where category=p_category and record_key=p_record_key;
  if prev is not null and p_value <= prev then return false; end if;
  insert into public.repo_diver_record_history_2026(category,record_key,user_id,username,value,source_kind,source_id,detail)
  values(p_category,p_record_key,p_user_id,coalesce(nullif(trim(p_username),''),'Diver'),p_value,p_source_kind,p_source_id,coalesce(p_detail,'{}'::jsonb))
  on conflict do nothing returning id into inserted_id;
  if inserted_id is null then return false; end if;
  insert into public.repo_diver_activity_2026(user_id,username,kind,payload)
  values(p_user_id,p_username,'world_record',jsonb_build_object('category',p_category,'record_key',p_record_key,'value',p_value,'detail',coalesce(p_detail,'{}'::jsonb)));
  return true;
end$$;
revoke all on function public.repo_diver_note_record(text,text,uuid,text,numeric,text,text,jsonb) from public,anon,authenticated;

create or replace function public.repo_diver_publish_catches(p_run_id uuid,p_catches jsonb)
returns jsonb
language plpgsql security definer set search_path=public,auth as $$
declare
  u uuid:=auth.uid(); r public.repo_diver_runs%rowtype; ch public.characters%rowtype; item jsonb; cat public.repo_diver_catch_catalog%rowtype;
  i int:=0; fid text; q int; w numeric; v text; named_id bigint; inserted_count int:=0; cid bigint; prior numeric; world_record boolean; ns public.repo_diver_named_specimens_2026%rowtype;
begin
  if u is null then raise exception 'You must be logged in'; end if;
  select * into r from public.repo_diver_runs where id=p_run_id and user_id=u and status='claimed';
  if not found then raise exception 'Claimed run required'; end if;
  select * into ch from public.characters where user_id=u;
  if not found then raise exception 'Character not found'; end if;
  if jsonb_typeof(coalesce(p_catches,'[]'::jsonb))<>'array' or jsonb_array_length(coalesce(p_catches,'[]'::jsonb))>90 then raise exception 'Invalid catches'; end if;
  if jsonb_array_length(coalesce(p_catches,'[]'::jsonb)) > greatest(0,coalesce((r.summary->>'fish')::int,0)+coalesce((r.summary->>'treasures')::int,0)) then raise exception 'Catch count does not match claimed run'; end if;

  for item in select value from jsonb_array_elements(coalesce(p_catches,'[]'::jsonb)) loop
    i:=i+1; fid:=item->>'id';
    select * into cat from public.repo_diver_catch_catalog where id=fid and biome=r.biome and kind='fish';
    if not found then continue; end if;
    q:=least(4,greatest(1,coalesce(nullif(item->>'q','')::int,1)));
    w:=least(cat.weight_kg*1.70,greatest(cat.weight_kg*0.50,case when coalesce(item->>'w','') ~ '^[0-9]+([.][0-9]+)?$' then (item->>'w')::numeric else cat.weight_kg end));
    v:=coalesce(nullif(item->>'variant',''),'normal'); if v not in ('normal','albino','melanistic','luminous','golden') then v:='normal'; end if;
    named_id:=null;
    if coalesce(item->>'named_id','') ~ '^[0-9]+$' then
      select * into ns from public.repo_diver_named_specimens_2026 where id=(item->>'named_id')::bigint and fish_id=fid and r.completed_at between starts_at and ends_at for update;
      if found then named_id:=ns.id; end if;
    end if;
    select max(weight_kg) into prior from public.repo_diver_validated_catches_2026 where fish_id=fid;
    insert into public.repo_diver_validated_catches_2026(run_id,user_id,username,ordinal,fish_id,biome,rarity,quality,weight_kg,variant,named_specimen_id,caught_at)
    values(p_run_id,u,ch.username,i,fid,r.biome,cat.rarity,q,round(w,2),v,named_id,coalesce(r.completed_at,now()))
    on conflict(run_id,ordinal) do nothing returning id into cid;
    if cid is null then continue; end if;
    inserted_count:=inserted_count+1;
    world_record:=public.repo_diver_note_record('species_weight',fid,u,ch.username,round(w,2),'catch',cid::text,jsonb_build_object('fish_id',fid,'fish_name',cat.name,'biome',r.biome,'rarity',cat.rarity,'quality',q,'variant',v));
    if not world_record and (cat.rarity in ('legendary','mythic','ancient') or v<>'normal') then
      insert into public.repo_diver_activity_2026(user_id,username,kind,payload)
      values(u,ch.username,case when v<>'normal' then 'rare_variant' else 'notable_catch' end,jsonb_build_object('catch_id',cid,'fish_id',fid,'fish_name',cat.name,'biome',r.biome,'rarity',cat.rarity,'quality',q,'weight_kg',round(w,2),'variant',v));
    end if;
    if named_id is not null then
      update public.repo_diver_named_specimens_2026 set caught_catch_id=coalesce(caught_catch_id,cid),caught_by_user_id=coalesce(caught_by_user_id,u),caught_by_username=coalesce(caught_by_username,ch.username),caught_at=coalesce(caught_at,now()) where id=named_id and caught_catch_id is null;
      if found then
        insert into public.repo_diver_activity_2026(user_id,username,kind,payload)
        values(u,ch.username,'named_specimen',jsonb_build_object('named_id',named_id,'name',ns.display_name,'fish_id',fid,'fish_name',cat.name,'weight_kg',round(w,2)));
      end if;
    end if;
  end loop;
  return jsonb_build_object('saved',true,'count',inserted_count,'duplicate',inserted_count=0);
end$$;

create or replace function public.repo_diver_social_endgame_trigger()
returns trigger language plpgsql security definer set search_path=public,auth as $$
declare uname text; is_record boolean;
begin
  select username into uname from public.characters where user_id=new.user_id;
  if new.mode='descent' then
    is_record:=public.repo_diver_note_record('descent_depth','global',new.user_id,uname,new.depth,'endgame',new.id::text,jsonb_build_object('mode',new.mode,'biome',new.biome));
  end if;
  is_record:=public.repo_diver_note_record('expedition_score','global',new.user_id,uname,new.score,'endgame_score',new.id::text,jsonb_build_object('mode',new.mode,'biome',new.biome,'depth',new.depth));
  if new.boss_id is not null then
    insert into public.repo_diver_activity_2026(user_id,username,kind,payload)
    values(new.user_id,uname,'ancient_victory',jsonb_build_object('boss_id',new.boss_id,'biome',new.biome,'score',new.score,'depth',new.depth));
  end if;
  return new;
end$$;
drop trigger if exists repo_diver_social_endgame_after_insert on public.repo_diver_endgame_scores_2026;
create trigger repo_diver_social_endgame_after_insert after insert on public.repo_diver_endgame_scores_2026 for each row execute function public.repo_diver_social_endgame_trigger();

create or replace function public.repo_diver_social_photo_trigger()
returns trigger language plpgsql security definer set search_path=public,auth as $$
declare uname text; fname text;
begin
  if new.quality>=4 then
    select c.username, f.name into uname,fname from public.characters c cross join public.repo_diver_catch_catalog f where c.user_id=new.user_id and f.id=new.fish_id limit 1;
    insert into public.repo_diver_activity_2026(user_id,username,kind,payload)
    values(new.user_id,uname,'perfect_photo',jsonb_build_object('photo_id',new.photo_id,'fish_id',new.fish_id,'fish_name',fname,'quality',new.quality));
  end if;
  return new;
end$$;
drop trigger if exists repo_diver_social_photo_after_insert on public.repo_diver_photos_2026;
create trigger repo_diver_social_photo_after_insert after insert on public.repo_diver_photos_2026 for each row execute function public.repo_diver_social_photo_trigger();

create or replace function public.repo_diver_set_public_profile(p_public boolean)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare u uuid:=auth.uid();
begin
 if u is null then raise exception 'You must be logged in';end if;
 insert into public.repo_diver_career_2026(user_id) values(u) on conflict(user_id) do nothing;
 update public.repo_diver_career_2026 set public_profile=coalesce(p_public,true),updated_at=now() where user_id=u;
 return jsonb_build_object('public_profile',coalesce(p_public,true));
end$$;

create or replace function public.repo_diver_set_featured_catch(p_catch_id bigint)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare u uuid:=auth.uid(); rowv public.repo_diver_validated_catches_2026%rowtype;
begin
 if u is null then raise exception 'You must be logged in';end if;
 select * into rowv from public.repo_diver_validated_catches_2026 where id=p_catch_id and user_id=u;
 if not found then raise exception 'Catch not found';end if;
 update public.repo_diver_career_2026 set featured_catch_id=p_catch_id,updated_at=now() where user_id=u;
 return jsonb_build_object('featured_catch_id',p_catch_id);
end$$;

create or replace function public.repo_diver_get_public_profile(p_username text)
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare uid uuid; c public.repo_diver_career_2026%rowtype; p public.repo_diver_profiles%rowtype; uname text; species int; bosses int; mastery_total int; feat jsonb; best jsonb; best_photo jsonb;
begin
 select user_id,username into uid,uname from public.characters where lower(username)=lower(trim(p_username)) limit 1;
 if uid is null then raise exception 'Diver not found';end if;
 select * into c from public.repo_diver_career_2026 where user_id=uid;
 select * into p from public.repo_diver_profiles where user_id=uid;
 if c.user_id is null or p.user_id is null then raise exception 'No Repo Diver career';end if;
 if not c.public_profile and uid is distinct from auth.uid() then return jsonb_build_object('username',uname,'private',true);end if;
 species:=jsonb_object_length(coalesce(p.fish_journal,'{}'::jsonb));
 select coalesce(sum(value::int),0)::int into bosses from jsonb_each_text(coalesce(c.endgame->'bosses','{}'::jsonb));
 select coalesce(sum(value::int),0)::int into mastery_total from jsonb_each_text(coalesce(c.mastery,'{}'::jsonb));
 select jsonb_build_object('id',vc.id,'fish_id',vc.fish_id,'name',cc.name,'weight_kg',vc.weight_kg,'quality',vc.quality,'variant',vc.variant,'rarity',vc.rarity,'biome',vc.biome,'caught_at',vc.caught_at)
 into feat from public.repo_diver_validated_catches_2026 vc join public.repo_diver_catch_catalog cc on cc.id=vc.fish_id where vc.user_id=uid and vc.id=c.featured_catch_id;
 if feat is null then
  select jsonb_build_object('id',vc.id,'fish_id',vc.fish_id,'name',cc.name,'weight_kg',vc.weight_kg,'quality',vc.quality,'variant',vc.variant,'rarity',vc.rarity,'biome',vc.biome,'caught_at',vc.caught_at)
  into best from public.repo_diver_validated_catches_2026 vc join public.repo_diver_catch_catalog cc on cc.id=vc.fish_id where vc.user_id=uid order by vc.weight_kg desc limit 1;
 else best:=feat; end if;
 select jsonb_build_object('photo_id',ph.photo_id,'fish_id',ph.fish_id,'fish_name',cc.name,'quality',ph.quality,'taken_at',ph.taken_at)
 into best_photo from public.repo_diver_photos_2026 ph join public.repo_diver_catch_catalog cc on cc.id=ph.fish_id where ph.user_id=uid order by ph.quality desc,ph.taken_at desc limit 1;
 return jsonb_build_object('username',uname,'private',false,'active_title',c.active_title,'day',p.day_number,'species',species,'species_total',(select count(*) from public.repo_diver_catch_catalog where kind='fish'),'deepest',coalesce((p.stats->>'deepest')::numeric,0),'customers',coalesce((p.stats->>'total_customers')::bigint,0),'perfect_dishes',coalesce((p.stats->>'perfect_dishes')::bigint,0),'fish_house_rank',coalesce((p.restaurant->>'rank')::int,1),'fish_house_reputation',coalesce((p.restaurant->>'reputation_points')::bigint,0),'prestige_xp',coalesce((c.endgame->>'prestige_xp')::bigint,0),'descent_best',coalesce((c.endgame->>'descent_best')::int,0),'ancient_hunts',bosses,'mastery_total',mastery_total,'featured_catch',best,'featured_photo',best_photo,'public_profile',c.public_profile);
end$$;

create or replace function public.repo_diver_get_shared_world()
returns jsonb language plpgsql security definer set search_path=public,auth as $$
declare
 u uuid:=auth.uid(); now_london timestamp:=(now() at time zone 'Europe/London'); week_start date:=date_trunc('week',now_london)::date; week_end date:=week_start+7;
 week_no int:=extract(week from now_london)::int; active_users int; target int; event_type text; event_title text; event_desc text; event_progress numeric:=0; my_contribution numeric:=0;
 tournament_format text; tournament_title text; tournament_target_id text; tournament_target_name text; tournament_biome text; tournament_board jsonb:='[]'::jsonb;
 community jsonb; feed jsonb; records jsonb; hall jsonb; legacy jsonb; named jsonb; season jsonb; tournament jsonb; uname text;
begin
 if u is null then raise exception 'You must be logged in';end if;
 select username into uname from public.characters where user_id=u;
 select count(distinct user_id)::int into active_users from public.repo_diver_runs where completed_at>=now()-interval '28 days'; active_users:=greatest(1,coalesce(active_users,0));

 -- lightweight four-week seasonal presentation, server-clock based
 season:=case mod((extract(year from now_london)::int*12+extract(month from now_london)::int),4)
  when 0 then jsonb_build_object('id','season_deep','name','SEASON OF THE DEEP','subtitle','Hadal waters are unusually active.','starts_at',date_trunc('month',now_london),'ends_at',date_trunc('month',now_london)+interval '1 month')
  when 1 then jsonb_build_object('id','season_migration','name','GREAT MIGRATION','subtitle','Large schools are crossing Velmoran waters.','starts_at',date_trunc('month',now_london),'ends_at',date_trunc('month',now_london)+interval '1 month')
  when 2 then jsonb_build_object('id','season_stormwake','name','STORMWAKE','subtitle','Rough water brings rare predators closer to shore.','starts_at',date_trunc('month',now_london),'ends_at',date_trunc('month',now_london)+interval '1 month')
  else jsonb_build_object('id','season_crystal','name','CRYSTAL BLOOM','subtitle','Unusual light is drawing rare species to the trenches.','starts_at',date_trunc('month',now_london),'ends_at',date_trunc('month',now_london)+interval '1 month') end;

 -- Shared weekly community event. Targets scale for the small current RepoCompany population.
 case mod(week_no,4)
  when 0 then event_type:='migration';event_title:='THE GREAT MIGRATION';event_desc:='Document migratory catches across every expedition.';target:=greatest(60,active_users*30);
    select count(*)::numeric into event_progress from public.repo_diver_validated_catches_2026 where caught_at>=week_start and caught_at<week_end;
    select count(*)::numeric into my_contribution from public.repo_diver_validated_catches_2026 where user_id=u and caught_at>=week_start and caught_at<week_end;
  when 1 then event_type:='ancient_watch';event_title:='ANCIENT WATCH';event_desc:='Complete Ancient encounters and help the Institute map colossal activity.';target:=greatest(6,active_users*3);
    select count(*)::numeric into event_progress from public.repo_diver_endgame_scores_2026 where boss_id is not null and created_at>=week_start and created_at<week_end;
    select count(*)::numeric into my_contribution from public.repo_diver_endgame_scores_2026 where user_id=u and boss_id is not null and created_at>=week_start and created_at<week_end;
  when 2 then event_type:='marine_archive';event_title:='MARINE ARCHIVE SURVEY';event_desc:='Photograph the ocean and expand the shared research archive.';target:=greatest(30,active_users*15);
    select count(*)::numeric into event_progress from public.repo_diver_photos_2026 where taken_at>=week_start and taken_at<week_end;
    select count(*)::numeric into my_contribution from public.repo_diver_photos_2026 where user_id=u and taken_at>=week_start and taken_at<week_end;
  else event_type:='fish_house_festival';event_title:='HARBOUR SEAFOOD FESTIVAL';event_desc:='Serve customers across RepoCompany and keep the harbour busy.';target:=greatest(80,active_users*40);
    select coalesce(sum((summary->>'customers')::numeric),0) into event_progress from public.repo_diver_runs where status='claimed' and completed_at>=week_start and completed_at<week_end;
    select coalesce(sum((summary->>'customers')::numeric),0) into my_contribution from public.repo_diver_runs where user_id=u and status='claimed' and completed_at>=week_start and completed_at<week_end;
 end case;

 -- Weekly tournament rotates through validated, non-client-trusted sources.
 case mod(week_no,4)
  when 0 then
    tournament_format:='species_weight';
    select id,name,biome into tournament_target_id,tournament_target_name,tournament_biome from public.repo_diver_catch_catalog where kind='fish' and rarity in ('rare','epic') order by sort_order offset mod(week_no*7,(select count(*) from public.repo_diver_catch_catalog where kind='fish' and rarity in ('rare','epic'))) limit 1;
    tournament_title:=upper(tournament_target_name)||' TROPHY WEEK';
    select coalesce(jsonb_agg(x order by (x->>'value')::numeric desc),'[]'::jsonb) into tournament_board from (
      select jsonb_build_object('username',vc.username,'value',max(vc.weight_kg),'unit','KG') x from public.repo_diver_validated_catches_2026 vc where vc.fish_id=tournament_target_id and vc.caught_at>=week_start and vc.caught_at<week_end group by vc.user_id,vc.username order by max(vc.weight_kg) desc limit 5
    ) q;
  when 1 then
    tournament_format:='deepest_dive';tournament_title:='DEEPWATER WEEK';tournament_target_name:='Deepest validated expedition';
    select coalesce(jsonb_agg(x order by (x->>'value')::numeric desc),'[]'::jsonb) into tournament_board from (
      select jsonb_build_object('username',c.username,'value',max(coalesce((r.summary->>'depth')::numeric,0)),'unit','M') x from public.repo_diver_runs r join public.characters c on c.user_id=r.user_id where r.status='claimed' and r.completed_at>=week_start and r.completed_at<week_end group by r.user_id,c.username order by max(coalesce((r.summary->>'depth')::numeric,0)) desc limit 5
    ) q;
  when 2 then
    tournament_format:='ancient_score';tournament_title:='ANCIENT HUNT TRIAL';tournament_target_name:='Highest Ancient expedition score';
    select coalesce(jsonb_agg(x order by (x->>'value')::numeric desc),'[]'::jsonb) into tournament_board from (
      select jsonb_build_object('username',c.username,'value',max(e.score),'unit','PTS') x from public.repo_diver_endgame_scores_2026 e join public.characters c on c.user_id=e.user_id where e.boss_id is not null and e.created_at>=week_start and e.created_at<week_end group by e.user_id,c.username order by max(e.score) desc limit 5
    ) q;
  else
    tournament_format:='expedition_score';tournament_title:='MASTER DIVER OPEN';tournament_target_name:='Highest validated expedition score';
    select coalesce(jsonb_agg(x order by (x->>'value')::numeric desc),'[]'::jsonb) into tournament_board from (
      select jsonb_build_object('username',c.username,'value',max(e.score),'unit','PTS') x from public.repo_diver_endgame_scores_2026 e join public.characters c on c.user_id=e.user_id where e.created_at>=week_start and e.created_at<week_end group by e.user_id,c.username order by max(e.score) desc limit 5
    ) q;
 end case;
 tournament:=jsonb_build_object('id','week_'||week_start::text,'format',tournament_format,'title',tournament_title,'target_id',tournament_target_id,'target_name',tournament_target_name,'biome',tournament_biome,'starts_at',week_start,'ends_at',week_end,'leaderboard',tournament_board);

 select jsonb_build_object(
   'total_fish',coalesce(sum((p.stats->>'total_fish')::bigint),0),
   'species_documented',coalesce((select count(distinct key) from public.repo_diver_profiles pp cross join lateral jsonb_object_keys(coalesce(pp.fish_journal,'{}'::jsonb)) key),0),
   'species_total',(select count(*) from public.repo_diver_catch_catalog where kind='fish'),
   'ancient_hunts',coalesce((select count(*) from public.repo_diver_endgame_scores_2026 where boss_id is not null),0),
   'deepest_expedition',coalesce(max((p.stats->>'deepest')::numeric),0),
   'golden_specimens',coalesce((select count(*) from public.repo_diver_validated_catches_2026 where variant='golden'),0),
   'customers_served',coalesce(sum((p.stats->>'total_customers')::bigint),0),
   'active_divers_28d',active_users
 ) into community from public.repo_diver_profiles p;

 select coalesce(jsonb_agg(rowv order by (rowv->>'created_at')::timestamptz desc),'[]'::jsonb) into feed from (
   select jsonb_build_object('id',a.id,'username',a.username,'kind',a.kind,'payload',a.payload,'created_at',a.created_at) rowv from public.repo_diver_activity_2026 a order by a.created_at desc limit 14
 ) q;

 -- A compact world-record board; species records remain available in the history/legacy list.
 select jsonb_build_object(
   'heaviest_catch',(select jsonb_build_object('username',vc.username,'value',vc.weight_kg,'fish_id',vc.fish_id,'fish_name',cc.name,'variant',vc.variant,'quality',vc.quality) from public.repo_diver_validated_catches_2026 vc join public.repo_diver_catch_catalog cc on cc.id=vc.fish_id order by vc.weight_kg desc limit 1),
   'deepest_descent',(select jsonb_build_object('username',c.username,'value',e.depth) from public.repo_diver_endgame_scores_2026 e join public.characters c on c.user_id=e.user_id where e.mode='descent' order by e.depth desc limit 1),
   'highest_score',(select jsonb_build_object('username',c.username,'value',e.score,'mode',e.mode) from public.repo_diver_endgame_scores_2026 e join public.characters c on c.user_id=e.user_id order by e.score desc limit 1),
   'best_photo',(select jsonb_build_object('username',c.username,'quality',ph.quality,'fish_name',cc.name,'taken_at',ph.taken_at) from public.repo_diver_photos_2026 ph join public.characters c on c.user_id=ph.user_id join public.repo_diver_catch_catalog cc on cc.id=ph.fish_id order by ph.quality desc,ph.taken_at asc limit 1)
 ) into records;

 select jsonb_build_object(
  'deepest_diver',(select jsonb_build_object('username',c.username,'value',coalesce((p.stats->>'deepest')::numeric,0),'unit','M') from public.repo_diver_profiles p join public.characters c on c.user_id=p.user_id order by coalesce((p.stats->>'deepest')::numeric,0) desc limit 1),
  'greatest_catch',(select jsonb_build_object('username',vc.username,'value',vc.weight_kg,'unit','KG','label',cc.name) from public.repo_diver_validated_catches_2026 vc join public.repo_diver_catch_catalog cc on cc.id=vc.fish_id order by vc.weight_kg desc limit 1),
  'ancient_hunter',(select jsonb_build_object('username',c.username,'value',count(*),'unit','HUNTS') from public.repo_diver_endgame_scores_2026 e join public.characters c on c.user_id=e.user_id where e.boss_id is not null group by e.user_id,c.username order by count(*) desc limit 1),
  'marine_researcher',(select jsonb_build_object('username',c.username,'value',coalesce((d.research->>'photos')::int,0),'unit','PHOTOS') from public.repo_diver_career_2026 d join public.characters c on c.user_id=d.user_id order by coalesce((d.research->>'photos')::int,0) desc limit 1),
  'master_chef',(select jsonb_build_object('username',c.username,'value',coalesce((p.stats->>'perfect_dishes')::bigint,0),'unit','PERFECT') from public.repo_diver_profiles p join public.characters c on c.user_id=p.user_id order by coalesce((p.stats->>'perfect_dishes')::bigint,0) desc limit 1),
  'fish_house_legend',(select jsonb_build_object('username',c.username,'value',coalesce((p.restaurant->>'reputation_points')::bigint,0),'unit','REP') from public.repo_diver_profiles p join public.characters c on c.user_id=p.user_id order by coalesce((p.restaurant->>'reputation_points')::bigint,0) desc limit 1),
  'descent_champion',(select jsonb_build_object('username',c.username,'value',max(e.depth),'unit','M') from public.repo_diver_endgame_scores_2026 e join public.characters c on c.user_id=e.user_id where e.mode='descent' group by e.user_id,c.username order by max(e.depth) desc limit 1),
  'completionist',(select jsonb_build_object('username',c.username,'value',jsonb_object_length(coalesce(p.fish_journal,'{}'::jsonb)),'unit','SPECIES') from public.repo_diver_profiles p join public.characters c on c.user_id=p.user_id order by jsonb_object_length(coalesce(p.fish_journal,'{}'::jsonb)) desc limit 1)
 ) into hall;

 select coalesce(jsonb_agg(x order by (x->>'achieved_at')::timestamptz desc),'[]'::jsonb) into legacy from (
  select jsonb_build_object('category',h.category,'record_key',h.record_key,'username',h.username,'value',h.value,'detail',h.detail,'achieved_at',h.achieved_at) x from public.repo_diver_record_history_2026 h order by h.achieved_at desc limit 20
 ) q;

 select jsonb_build_object('id',n.id,'code',n.code,'name',n.display_name,'fish_id',n.fish_id,'fish_name',cc.name,'biome',cc.biome,'starts_at',n.starts_at,'ends_at',n.ends_at,'caught_by',n.caught_by_username,'caught_at',n.caught_at)
 into named from public.repo_diver_named_specimens_2026 n join public.repo_diver_catch_catalog cc on cc.id=n.fish_id where now() between n.starts_at and n.ends_at order by n.starts_at desc limit 1;

 return jsonb_build_object('server_time',now(),'season',season,'community_event',jsonb_build_object('type',event_type,'title',event_title,'desc',event_desc,'progress',event_progress,'target',target,'pct',least(100,round(event_progress/nullif(target,0)*100,1)),'my_contribution',my_contribution,'ends_at',week_end),'tournament',tournament,'community_stats',community,'feed',feed,'records',records,'hall_of_fame',hall,'legacy',legacy,'named_specimen',named,'my_public_profile',(select public_profile from public.repo_diver_career_2026 where user_id=u));
end$$;

-- Baseline record history from existing server-validated journal PBs so the shared world is not empty on launch.
insert into public.repo_diver_record_history_2026(category,record_key,user_id,username,value,source_kind,source_id,detail,achieved_at)
select 'species_weight',x.fish_id,x.user_id,x.username,x.weight_kg,'legacy_profile','legacy:'||x.fish_id||':'||x.user_id::text,jsonb_build_object('fish_id',x.fish_id,'fish_name',x.fish_name,'legacy',true),now()
from (
 select distinct on (j.key) j.key fish_id,p.user_id,c.username,(j.value->>'best_weight')::numeric weight_kg,cc.name fish_name
 from public.repo_diver_profiles p join public.characters c on c.user_id=p.user_id cross join lateral jsonb_each(coalesce(p.fish_journal,'{}'::jsonb)) j join public.repo_diver_catch_catalog cc on cc.id=j.key
 where coalesce(j.value->>'best_weight','') ~ '^[0-9]+([.][0-9]+)?$'
 order by j.key,(j.value->>'best_weight')::numeric desc
) x
on conflict do nothing;

-- Explicit grants for safe RPCs only.
grant execute on function public.repo_diver_publish_catches(uuid,jsonb) to authenticated;
grant execute on function public.repo_diver_get_shared_world() to authenticated;
grant execute on function public.repo_diver_get_public_profile(text) to authenticated;
grant execute on function public.repo_diver_set_public_profile(boolean) to authenticated;
grant execute on function public.repo_diver_set_featured_catch(bigint) to authenticated;

-- Follow-up live migration: repo_diver_v12_validated_catch_snapshot
-- The live repo_diver_complete_day() now stores a sanitized verified_catches snapshot
-- in the claimed run summary. repo_diver_publish_catches() publishes that exact
-- server-accepted snapshot for new runs instead of trusting a second client payload.
-- This section is intentionally documentary; do not rerun this file against production.

-- Additional live V12 migrations also applied after the base shared-world migration:
--   repo_diver_v12_trophy_cabinet
--     creates repo_diver_get_my_verified_catches() for the player's public featured-catch selector.
--   repo_diver_v12_guestbook_reactions
--     creates repo_diver_guestbook_reactions_2026 and safe preset-reaction RPCs.
-- These production changes are already live. This file is a change record, not an install script.

-- Follow-up live migration: repo_diver_v12_world_record_feedback
-- repo_diver_publish_catches() now returns the number of world records broken so the
-- V12 client can play a restrained record fanfare and queue a proper record reveal.

-- Additional live migration: repo_diver_v12_first_ancient_legacy
-- Records the first validated completion for newly encountered Ancient bosses in Legacy history.

-- Additional live migration: repo_diver_v12_first_discoveries
-- Creates repo_diver_first_discoveries_2026. Species already present in pre-V12 journals
-- are seeded as PRE-V12 ARCHIVE rather than falsely assigning them to a new player.
-- Future genuinely new species can therefore retain a real first verified discoverer.

-- Additional live migration: repo_diver_v12_tournament_legacy
-- Creates repo_diver_get_tournament_archive(), which idempotently snapshots recent completed
-- weekly competitions from persisted server data and returns the historical champions archive.

-- Additional live migration: repo_diver_v12_social_badges
-- Adds server-awarded Shared Ocean prestige flags for world-record holders, tournament
-- champions, first verified discoverers and Legacy-history divers. Public profiles expose
-- only those game-facing badges, never authentication/private account data.
