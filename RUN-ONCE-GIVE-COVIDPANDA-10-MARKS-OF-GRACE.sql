-- ONE-TIME GRANT: COVIDPANDA +10 MARKS OF GRACE
-- ADDITIVE. Run exactly once in Supabase SQL Editor.

do $$
declare
  v_uid uuid;
  v_new_balance integer;
begin
  select c.user_id
    into v_uid
    from public.characters c
   where lower(trim(c.username))=lower('CovidPanda')
   limit 1;

  if v_uid is null then
    raise exception 'CovidPanda account was not found in public.characters';
  end if;

  insert into public.repo_rooftops_profiles(user_id)
  values(v_uid)
  on conflict(user_id) do nothing;

  update public.repo_rooftops_profiles p
     set mark_balance=coalesce(p.mark_balance,0)+10
   where p.user_id=v_uid
   returning p.mark_balance into v_new_balance;

  update public.characters c
     set bank_items=jsonb_set(
       coalesce(c.bank_items,'{}'::jsonb),
       '{marks_of_grace}',
       to_jsonb(v_new_balance),
       true
     )
   where c.user_id=v_uid;

  raise notice 'CovidPanda now has % Marks of Grace (+10 granted).',v_new_balance;
end
$$;
