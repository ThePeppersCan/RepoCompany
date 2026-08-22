create table if not exists public.dragonbound_treat_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_used_at timestamptz not null default now()
);

alter table public.dragonbound_treat_usage enable row level security;
revoke all on public.dragonbound_treat_usage from anon, authenticated;

create or replace function public.dragonbound_buy_treats()
returns table(new_gp integer, cooldown_until timestamptz)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_last timestamptz;
  v_gp integer;
  v_remaining integer;
begin
  if v_user is null then raise exception 'You must be signed in to buy Dragon Bites.'; end if;
  select u.last_used_at into v_last from public.dragonbound_treat_usage u where u.user_id=v_user;
  if v_last is not null and v_last > now()-interval '2 minutes' then
    v_remaining := ceil(extract(epoch from ((v_last+interval '2 minutes')-now())))::integer;
    raise exception 'Dragon Bites are cooling down. Try again in % seconds.', greatest(v_remaining,1);
  end if;
  select coalesce(c.gp,0)::integer into v_gp from public.characters c where c.user_id=v_user for update;
  if v_gp is null then raise exception 'Your character could not be found.'; end if;
  if v_gp < 200 then raise exception 'You need 200 GP to buy Dragon Bites.'; end if;
  update public.characters set gp=gp-200 where user_id=v_user;
  insert into public.dragonbound_treat_usage(user_id,last_used_at) values(v_user,now())
    on conflict(user_id) do update set last_used_at=excluded.last_used_at;
  return query select (v_gp-200)::integer, now()+interval '2 minutes';
end;
$function$;

revoke all on function public.dragonbound_buy_treats() from public;
grant execute on function public.dragonbound_buy_treats() to authenticated;
