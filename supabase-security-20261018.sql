-- Live permissions audit, 2026-10-18. No game or account data is deleted.
-- Apply as postgres. Public catalog reads and supported player RPCs remain available.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
-- RLS does not govern TRUNCATE. Browser roles never need structural privileges.
REVOKE TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA reparty_private FROM PUBLIC, anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA reparty_private FROM PUBLIC, anon, authenticated;
-- New objects require deliberate grants; preserve all existing supported API grants.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

ALTER TABLE public.adventure_activity_catalog ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.adventure_dynamic_quests ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.adventure_event_catalog ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.adventure_feature_catalog ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.adventure_local_reputation ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.adventure_microquest_template_catalog ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.adventure_region_catalog ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.adventure_rumour_catalog ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.repo_diver_activity_2026 ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.repo_diver_biome_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS security_catalog_read ON public.repo_diver_biome_catalog;
CREATE POLICY security_catalog_read ON public.repo_diver_biome_catalog FOR SELECT TO anon, authenticated USING (true);
REVOKE INSERT, UPDATE, DELETE ON public.repo_diver_biome_catalog FROM PUBLIC, anon, authenticated;

ALTER TABLE public.repo_diver_catch_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS security_catalog_read ON public.repo_diver_catch_catalog;
CREATE POLICY security_catalog_read ON public.repo_diver_catch_catalog FOR SELECT TO anon, authenticated USING (true);
REVOKE INSERT, UPDATE, DELETE ON public.repo_diver_catch_catalog FROM PUBLIC, anon, authenticated;

ALTER TABLE public.repo_diver_ecology_observations_2026 ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.repo_diver_first_discoveries_2026 ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.repo_diver_guestbook_reactions_2026 ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.repo_diver_named_specimens_2026 ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.repo_diver_recipe_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS security_catalog_read ON public.repo_diver_recipe_catalog;
CREATE POLICY security_catalog_read ON public.repo_diver_recipe_catalog FOR SELECT TO anon, authenticated USING (true);
REVOKE INSERT, UPDATE, DELETE ON public.repo_diver_recipe_catalog FROM PUBLIC, anon, authenticated;

ALTER TABLE public.repo_diver_record_history_2026 ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.repo_diver_tags_2026 ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.repo_diver_tournament_archive_2026 ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.repo_diver_upgrade_catalog ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS security_catalog_read ON public.repo_diver_upgrade_catalog;
CREATE POLICY security_catalog_read ON public.repo_diver_upgrade_catalog FOR SELECT TO anon, authenticated USING (true);
REVOKE INSERT, UPDATE, DELETE ON public.repo_diver_upgrade_catalog FROM PUBLIC, anon, authenticated;

ALTER TABLE public.repo_diver_validated_catches_2026 ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.repo_sports_official_career_base ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS security_catalog_read ON public.repo_sports_official_career_base;
CREATE POLICY security_catalog_read ON public.repo_sports_official_career_base FOR SELECT TO anon, authenticated USING (true);
REVOKE INSERT, UPDATE, DELETE ON public.repo_sports_official_career_base FROM PUBLIC, anon, authenticated;

ALTER TABLE public.repo_sports_official_snapshot_meta ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS security_catalog_read ON public.repo_sports_official_snapshot_meta;
CREATE POLICY security_catalog_read ON public.repo_sports_official_snapshot_meta FOR SELECT TO anon, authenticated USING (true);
REVOKE INSERT, UPDATE, DELETE ON public.repo_sports_official_snapshot_meta FROM PUBLIC, anon, authenticated;

ALTER TABLE public.repo_tcg_pack_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS security_catalog_read ON public.repo_tcg_pack_cards;
CREATE POLICY security_catalog_read ON public.repo_tcg_pack_cards FOR SELECT TO anon, authenticated USING (true);
REVOKE INSERT, UPDATE, DELETE ON public.repo_tcg_pack_cards FROM PUBLIC, anon, authenticated;

-- Owner-executed helpers remain callable by their trusted parent functions.
REVOKE EXECUTE ON FUNCTION public.adventure_add_inventory(uuid,text,integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.adventure_ensure_daily_jobs(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.adventure_grant_reward(uuid,text,text,integer,integer,text,integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.adventure_remove_inventory(uuid,text,integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.adventure_touch_internal(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.collect_resource(uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_character(uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.dragonbound_ensure_personality_v2(uuid,boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_character(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.repo_diver_postgame_metric(uuid,text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.repo_wc26_card_already_owned(uuid,text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.is_repo_site_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT coalesce(auth.uid() = '651be2a9-355a-47c7-9c27-fcc3093ed8e5'::uuid, false)
$$;
CREATE OR REPLACE FUNCTION public.adventure_is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT coalesce(auth.uid() IN ('651be2a9-355a-47c7-9c27-fcc3093ed8e5'::uuid,'3d88ff42-0383-49c5-a096-bba904c5a48c'::uuid), false)
$$;
CREATE OR REPLACE FUNCTION public.repo_fable_is_admin(p_uid uuid DEFAULT auth.uid()) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT coalesce(p_uid IN ('651be2a9-355a-47c7-9c27-fcc3093ed8e5'::uuid,'3d88ff42-0383-49c5-a096-bba904c5a48c'::uuid), false)
$$;
REVOKE EXECUTE ON FUNCTION public.admin_rename_account(uuid,text) FROM PUBLIC, anon;
ALTER POLICY "mp managers update their presence" ON public.velmora_multiplayer_presence
 WITH CHECK (user_id = (SELECT auth.uid()) AND public.velmora_mp_is_member(career_id));
ALTER POLICY "mp managers update their own profile" ON public.velmora_multiplayer_manager_profiles
 WITH CHECK (user_id = (SELECT auth.uid()) AND public.velmora_mp_is_active_member(career_id));
ALTER POLICY "mp managers update their submission" ON public.velmora_multiplayer_match_submissions
 WITH CHECK (user_id = (SELECT auth.uid()) AND public.velmora_mp_is_active_member(career_id) AND public.velmora_mp_owns_club(career_id,club_id));
-- Preserve joining an empty two-player room, but forbid replacing its host or impersonating a guest.
CREATE OR REPLACE FUNCTION public.security_guard_two_player_room() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
 IF current_user IN ('anon','authenticated') THEN
  IF NEW.id IS DISTINCT FROM OLD.id OR NEW.host_user_id IS DISTINCT FROM OLD.host_user_id OR NEW.host_name IS DISTINCT FROM OLD.host_name OR NEW.code IS DISTINCT FROM OLD.code THEN
   RAISE EXCEPTION 'Room ownership cannot be changed' USING ERRCODE='42501';
  END IF;
  IF NEW.guest_user_id IS DISTINCT FROM OLD.guest_user_id THEN
   IF NOT ((OLD.guest_user_id IS NULL AND NEW.guest_user_id=auth.uid())
     OR (NEW.guest_user_id IS NULL AND (OLD.guest_user_id=auth.uid() OR OLD.host_user_id=auth.uid()))) THEN
    RAISE EXCEPTION 'Cannot replace another player' USING ERRCODE='42501';
   END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.security_guard_two_player_room() FROM PUBLIC, anon, authenticated;
CREATE OR REPLACE TRIGGER security_guard_room_ownership BEFORE UPDATE ON public.runecrafting_rooms FOR EACH ROW EXECUTE FUNCTION public.security_guard_two_player_room();
CREATE OR REPLACE TRIGGER security_guard_room_ownership BEFORE UPDATE ON public.toa_rooms FOR EACH ROW EXECUTE FUNCTION public.security_guard_two_player_room();
CREATE OR REPLACE FUNCTION public.tavern_session_heartbeat(p_session_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_username text;
  v_identity text;
begin
  if v_uid is null then
    raise exception 'Not signed in';
  end if;
  if coalesce(length(trim(p_session_id)),0) < 8 then
    raise exception 'Invalid tavern session';
  end if;

  select c.username into v_username
  from public.characters c
  where c.user_id = v_uid
  limit 1;

  if v_username is null then
    select coalesce(u.raw_user_meta_data->>'username', split_part(u.email,'@',1))
      into v_username
    from auth.users u where u.id=v_uid;
  end if;

  -- Preserve the original artwork identity after account renames.
  begin
    select a.identity_key into v_identity
    from public.account_rename_aliases a
    where a.user_id=v_uid
    order by a.created_at asc
    limit 1;
  exception when undefined_table then
    v_identity := null;
  end;

  v_identity := coalesce(nullif(v_identity,''), lower(regexp_replace(v_username,'[^a-zA-Z0-9]','','g')));
  if v_identity in ('covidpanda','lemime') then v_identity := 'lemime'; end if;

  insert into public.tavern_sessions(session_id,user_id,username,identity_key,last_seen)
  values(trim(p_session_id),v_uid,v_username,v_identity,now())
  on conflict(session_id) do update set
    user_id=excluded.user_id,
    username=excluded.username,
    identity_key=excluded.identity_key,
    last_seen=excluded.last_seen WHERE public.tavern_sessions.user_id=excluded.user_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Session belongs to another account' USING ERRCODE='42501'; END IF;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.tavern_shared_heartbeat(p_session_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
  v_uid uuid := auth.uid();
  v_username text;
  v_identity text;
  v_seat text;
  v_seats text[] := array[
    'sofa-left','sofa-left-centre','sofa-right-centre',
    'sofa-right','armchair-left','armchair-right'
  ];
begin
  if v_uid is null then raise exception 'Not signed in'; end if;
  if coalesce(length(trim(p_session_id)),0) < 8 then raise exception 'Invalid tavern session'; end if;

  -- Serialize seat assignment so two simultaneous sign-ins cannot take one seat.
  perform pg_advisory_xact_lock(91827461);
  perform public.tavern_shared_cleanup();

  select c.username into v_username
  from public.characters c
  where c.user_id=v_uid
  limit 1;

  if v_username is null then
    select coalesce(u.raw_user_meta_data->>'username',split_part(u.email,'@',1))
    into v_username from auth.users u where u.id=v_uid;
  end if;

  select a.identity_key into v_identity
  from public.account_rename_aliases a
  where a.user_id=v_uid
  order by a.created_at asc
  limit 1;

  v_identity := coalesce(nullif(v_identity,''),lower(regexp_replace(v_username,'[^a-zA-Z0-9]','','g')));
  if lower(regexp_replace(v_username,'[^a-zA-Z0-9]','','g')) in ('covidpanda','lemime') then
    v_identity := 'lemime';
  end if;

  insert into public.tavern_shared_sessions(session_id,user_id,last_seen)
  values(trim(p_session_id),v_uid,now())
  on conflict(session_id) do update set user_id=excluded.user_id,last_seen=excluded.last_seen WHERE public.tavern_shared_sessions.user_id=excluded.user_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Session belongs to another account' USING ERRCODE='42501'; END IF;

  select o.seat_id into v_seat
  from public.tavern_shared_occupants o
  where o.user_id=v_uid;

  if v_seat is null then
    select candidate into v_seat
    from unnest(v_seats) with ordinality as available(candidate,position)
    where not exists (
      select 1 from public.tavern_shared_occupants o where o.seat_id=available.candidate
    )
    order by position
    limit 1;
  end if;

  -- There are currently six physical seats. Unsupported/no-seat accounts stay
  -- online without being rendered until another seat becomes free.
  if v_seat is not null then
    insert into public.tavern_shared_occupants(user_id,username,identity_key,seat_id,joined_at,last_seen)
    values(v_uid,v_username,v_identity,v_seat,now(),now())
    on conflict(user_id) do update set
      username=excluded.username,
      identity_key=excluded.identity_key,
      last_seen=excluded.last_seen;
  end if;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.tavern_shared_heartbeat_v2(p_session_id text,p_username text,p_identity_key text) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
 -- Legacy client name/art hints are untrusted; derive identity from the authenticated account.
 SELECT public.tavern_shared_heartbeat(p_session_id)
$$;

NOTIFY pgrst, 'reload schema';
COMMIT;
SELECT 'security migration applied' AS result;
