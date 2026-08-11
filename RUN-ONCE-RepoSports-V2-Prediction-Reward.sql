create table if not exists public.repo_sports_v2_prediction_rewards (
  user_id uuid not null,
  match_key text not null,
  awarded_gp integer not null default 1000,
  created_at timestamptz not null default now(),
  primary key (user_id, match_key)
);
alter table public.repo_sports_v2_prediction_rewards enable row level security;
drop function if exists public.claim_repo_sports_v2_prediction_reward(text);
create function public.claim_repo_sports_v2_prediction_reward(p_match_key text)
returns table(awarded boolean,new_gp bigint)
language plpgsql security definer set search_path=public
as $$
declare v_uid uuid:=auth.uid(); v_name text; v_gp bigint; v_rows integer:=0;
begin
  if v_uid is null then raise exception 'Sign in to claim the V2 prediction reward'; end if;
  if coalesce(p_match_key,'') !~ '^v2-[A-Za-z0-9._:-]+$' then raise exception 'Invalid V2 match key'; end if;
  select c.username into v_name from public.characters c where c.user_id=v_uid;
  if lower(coalesce(v_name,''))<>'catasthma' then raise exception 'Repo Sports V2 rewards are currently admin-test only'; end if;
  insert into public.repo_sports_v2_prediction_rewards(user_id,match_key,awarded_gp) values(v_uid,p_match_key,1000)
  on conflict(user_id,match_key) do nothing;
  get diagnostics v_rows=row_count;
  if v_rows>0 then
    update public.characters set gp=coalesce(gp,0)+1000 where user_id=v_uid returning gp into v_gp;
  else
    select coalesce(c.gp,0) into v_gp from public.characters c where c.user_id=v_uid;
  end if;
  if v_gp is null then raise exception 'Character not found'; end if;
  return query select (v_rows>0),v_gp;
end; $$;
revoke all on function public.claim_repo_sports_v2_prediction_reward(text) from public;
grant execute on function public.claim_repo_sports_v2_prediction_reward(text) to authenticated;
notify pgrst,'reload schema';
