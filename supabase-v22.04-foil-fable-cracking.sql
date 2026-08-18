-- Repo Company V22.04 — Foil & Fable / Gregg slab-cracking hardening
-- The function is an atomic, authenticated transaction. It destroys one slab,
-- returns exactly one raw physical instance, deducts the configured fee, and
-- removes the destroyed slab from the user's displayed binder layout.

create or replace function public.crack_my_rcg_slab(p_slab_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  uid uuid := auth.uid();
  s public.repo_rcg_slabs%rowtype;
  c public.characters%rowtype;
  v_fee bigint := greatest(0, public.repo_rcg_config_value('RCG_CRACK_FEE', 5000));
  v_new_count smallint;
  v_raw_id uuid;
  v_layout jsonb;
begin
  if uid is null then
    raise exception 'Sign in required';
  end if;

  select slab.*
    into s
    from public.repo_rcg_slabs as slab
    join public.repo_rcg_grading_orders as grading_order
      on grading_order.id = slab.grading_order_id
   where slab.id = p_slab_id
     and slab.user_id = uid
     and not slab.is_cracked
     and grading_order.reveal_status
   for update of slab;

  if not found then
    raise exception 'That slab is not available to crack.';
  end if;

  if lower(coalesce(s.card_set, '')) = 'standard' then
    raise exception 'Standard slabs cannot be cracked because Standard cards are no longer gradable.';
  end if;

  if s.crack_locked or s.crack_count >= 3 then
    raise exception 'This slab has reached its three-crack limit and is permanently locked at RCG %.', s.grade;
  end if;

  select character_row.*
    into c
    from public.characters as character_row
   where character_row.user_id = uid
   for update;

  if not found then
    raise exception 'Character not found';
  end if;

  update public.characters
     set gp = gp - v_fee
   where user_id = uid
     and gp >= v_fee
  returning * into c;

  if not found then
    raise exception 'You need % GP to crack this slab.', v_fee;
  end if;

  v_new_count := s.crack_count + 1;

  update public.repo_rcg_slabs
     set is_cracked = true,
         cracked_at = clock_timestamp(),
         is_favourite = false
   where id = s.id;

  insert into public.quidditch_tcg_collections(user_id, cards)
  values(uid, array[s.card_id])
  on conflict(user_id) do update
    set cards = array_append(coalesce(public.quidditch_tcg_collections.cards, '{}'::text[]), s.card_id),
        updated_at = clock_timestamp();

  insert into public.repo_rcg_cracked_raw_cards(
    user_id,
    lineage_id,
    card_id,
    crack_count,
    source_slab_id
  )
  values(uid, s.lineage_id, s.card_id, v_new_count, s.id)
  returning id into v_raw_id;

  select binder_layout.layout
    into v_layout
    from public.repo_rcg_slab_binder_layouts as binder_layout
   where binder_layout.user_id = uid
   for update;

  if v_layout is not null and jsonb_typeof(v_layout) = 'array' then
    select coalesce(
      jsonb_agg(
        case
          when jsonb_typeof(entry.value) = 'string'
           and (entry.value #>> '{}') = s.id::text
            then 'null'::jsonb
          else entry.value
        end
        order by entry.ord
      ),
      '[]'::jsonb
    )
      into v_layout
      from jsonb_array_elements(v_layout) with ordinality as entry(value, ord);

    update public.repo_rcg_slab_binder_layouts
       set layout = v_layout,
           updated_at = clock_timestamp()
     where user_id = uid;
  end if;

  return jsonb_build_object(
    'slab_id', s.id,
    'card_id', s.card_id,
    'grade', s.grade,
    'raw_instance_id', v_raw_id,
    'crack_count', v_new_count,
    'cracks_remaining', greatest(0, 3 - v_new_count),
    'final_regrade_locks', (v_new_count >= 3),
    'fee', v_fee,
    'new_gp', c.gp
  );
end
$function$;

revoke execute on function public.crack_my_rcg_slab(uuid) from public, anon;
grant execute on function public.crack_my_rcg_slab(uuid) to authenticated, service_role;

notify pgrst, 'reload schema';
