-- REPO COMPANY — WISE OLD MAN: COUNT EVERY VALID XP SOURCE
-- Run ONCE in Supabase SQL Editor after uploading the website patch.
--
-- This intentionally changes ONLY the XP-total helper used by the existing
-- Wise Old Man assignment/get/claim functions. Existing task variants, skip
-- behaviour, rewards and active assignments remain intact.
--
-- Result:
--   Agility task      -> any source that increases characters.agility_xp
--   Slayer task       -> any source that increases characters.slayer_xp
--   Combat task       -> Attack + Strength + Defence + Magic + Ranged XP
--   Sailing task      -> any source that increases characters.sailing_xp
--   Runecrafting task -> any source that increases characters.runecrafting_xp
--
-- No weapon, activity, map, difficulty or game-mode restriction is applied.

-- Preserve the exact progress of an already-active Combat task when upgrading
-- from the old A/S/D-only total to the new A/S/D/Magic/Ranged total.
-- The function-definition check makes this migration safe to run again.
do $$
declare
  v_fn regprocedure;
  v_definition text := '';
  v_add_magic boolean := false;
  v_add_ranged boolean := false;
begin
  v_fn := to_regprocedure('public.wise_task_current_xp(public.characters,text)');

  if v_fn is not null then
    select lower(pg_get_functiondef(v_fn)) into v_definition;
    v_add_magic := position('magic_xp' in v_definition) = 0;
    v_add_ranged := position('ranged_xp' in v_definition) = 0;

    if v_add_magic or v_add_ranged then
      update public.characters
      set wise_task_start_xp = coalesce(wise_task_start_xp, 0)
        + case when v_add_magic then coalesce(magic_xp, 0) else 0 end
        + case when v_add_ranged then coalesce(ranged_xp, 0) else 0 end
      where lower(coalesce(wise_task_skill, '')) = 'combat'
        and wise_task_start_xp is not null;
    end if;
  end if;
end
$$;

create or replace function public.wise_task_current_xp(c public.characters, skill text)
returns integer
language sql
stable
as $$
  select case lower(coalesce(skill, ''))
    when 'agility' then coalesce(c.agility_xp, 0)
    when 'slayer' then coalesce(c.slayer_xp, 0)
    when 'combat' then
      coalesce(c.attack_xp, 0)
      + coalesce(c.strength_xp, 0)
      + coalesce(c.defence_xp, 0)
      + coalesce(c.magic_xp, 0)
      + coalesce(c.ranged_xp, 0)
    when 'sailing' then coalesce(c.sailing_xp, 0)
    when 'runecrafting' then coalesce(c.runecrafting_xp, 0)
    else 0
  end::integer
$$;

grant execute on function public.wise_task_current_xp(public.characters, text) to authenticated;
notify pgrst, 'reload schema';
