-- Guest identities use Supabase anonymous auth, with the same Reparty room checks.
-- They do not create a character in the main RepoCompany game.
begin;
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path='public' as $$
declare clean_name text;
begin
 if coalesce(new.is_anonymous,false) then return new; end if;
 clean_name:=btrim(new.raw_user_meta_data->>'username');
 if clean_name is null or clean_name !~ '^[A-Za-z0-9_-]{3,16}$' then raise exception 'Invalid username'; end if;
 insert into public.characters(user_id,username) values(new.id,clean_name);
 return new;
end; $$;

create or replace function reparty_private.display_name(p_user uuid) returns text
language sql stable security definer set search_path='' as $$
 select case when coalesce(u.is_anonymous,false) then
  left(coalesce(nullif(trim(regexp_replace(u.raw_user_meta_data->>'reparty_name','[[:cntrl:]]','','g')),''),'Guest'),24)||' (Guest)'
 else coalesce((select username from public.characters where user_id=u.id limit 1),nullif(u.raw_user_meta_data->>'username',''),'Member') end
 from auth.users u where u.id=p_user;
$$;
revoke all on function reparty_private.display_name(uuid) from public,anon,authenticated;

-- Patch only name resolution, preserving all current video/Suno/game behaviour.
do $$
declare definition text; original text := $old$select coalesce((select username from public.characters where user_id=u limit 1),nullif(raw_user_meta_data->>'username',''), 'Member') into n from auth.users where id=u;$old$;
begin
 definition:=pg_get_functiondef('public.reparty_action(text,text,jsonb)'::regprocedure);
 if position('n := reparty_private.display_name(u);' in definition)>0 then return; end if;
 if position(original in definition)=0 then raise exception 'Unexpected Reparty function version; guest update was not applied.'; end if;
 execute replace(definition,original,'n := reparty_private.display_name(u);');
end; $$;
commit;
