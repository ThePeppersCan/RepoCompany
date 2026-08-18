-- Repo Company V22.12 — RCG Unfinished
-- Deploy the matching assets/script before running this migration.
--
-- Normal pack rarity ladder after this patch:
-- Black Label 1% | Millennium 2% | Signature 3% | Legendary 4% | Rival 5% | Platinum 6%
-- PSYCOMPANY Promos 10% | RCG Unfinished 9% | Patch 12% | Velmora: Off the Broom 13% | Full Art 15% | Standard 20%
-- Unfinished is intended to be rare, but not too rare.

insert into public.repo_tcg_pack_cards(card_id,rarity,duplicate_protected)
values
  ('unfinished_besquelcher','unfinished',false),
  ('unfinished_debbie','unfinished',false),
  ('unfinished_nimbler_2000','unfinished',false),
  ('unfinished_pipsqueak','unfinished',false),
  ('unfinished_rocky','unfinished',false),
  ('unfinished_soup','unfinished',false)
on conflict(card_id) do update set
  rarity=excluded.rarity,
  duplicate_protected=excluded.duplicate_protected;

create or replace function public.repo_rcg_card_set(p_card_id text)
returns text
language sql
immutable
as $function$
  select case
    when p_card_id like '%_black_label' then 'RCG Black Label'
    when p_card_id like 'unfinished_%' then 'RCG Unfinished'
    when p_card_id like 'psycompany_promo_%' then 'PSYCOMPANY Promos'
    when p_card_id like 'off_the_broom_%' then 'Velmora: Off the Broom'
    when p_card_id like '%_patch' then 'Patch'
    when p_card_id like '%_signature' then 'Signature'
    when p_card_id like '%_millennium' then 'Millennium'
    when p_card_id like '%_rival' then 'Rival'
    when p_card_id like '%_platinum' then 'Platinum'
    when p_card_id like '%legendary%' then 'Legendary Full Art'
    when p_card_id like '%full_art%' then 'Full Art'
    when p_card_id like 'ltd_%' then 'Limited'
    else 'Standard'
  end
$function$;

create or replace function public.repo_rcg_card_variant(p_card_id text)
returns text
language sql
immutable
as $function$
  select public.repo_rcg_card_set(p_card_id)
$function$;

create or replace function public.open_quidditch_tcg_pack()
returns table(
  card_id text, owned_cards text[], bank_items jsonb,
  skill_one text, skill_one_xp integer, skill_one_total integer,
  skill_two text, skill_two_xp integer, skill_two_total integer,
  all_cards_owned boolean
)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_items jsonb; v_quantity integer; v_owned text[]; v_card text;
  v_skills text[]:=array['woodcutting','mining','fishing','agility','slayer','attack','strength','defence','magic','ranged','sailing','runecrafting','cooking','farming'];
  v_skill_one text; v_skill_two text; v_column_one text; v_column_two text; v_total_one integer; v_total_two integer; v_username text;
  v_standard text[]; v_full_art text[]; v_off_broom text[]; v_patch text[]; v_unfinished text[]; v_promo text[]; v_platinum text[]; v_rival text[]; v_legendary text[]; v_signature text[]; v_millennium text[]; v_black_label text[];
  v_roll double precision:=random();
begin
  if auth.uid() is null then raise exception 'You must be signed in.'; end if;
  select coalesce(c.bank_items,'{}'::jsonb),lower(trim(coalesce(c.username,''))) into v_items,v_username
  from public.characters c where c.user_id=auth.uid() for update;
  if not found then raise exception 'Character not found.'; end if;
  v_quantity:=greatest(0,coalesce((v_items->>'quidditch_tcg_pack')::integer,0));
  if v_username='admin' then v_quantity:=greatest(1,v_quantity); v_items:=jsonb_set(v_items,'{quidditch_tcg_pack}','1'::jsonb,true);
  elsif v_quantity<1 then raise exception 'You do not have a Quidditch TCG pack.'; end if;

  insert into public.quidditch_tcg_collections(user_id,cards) values(auth.uid(),'{}'::text[]) on conflict(user_id) do nothing;
  select coalesce(q.cards,'{}'::text[]) into v_owned from public.quidditch_tcg_collections q where q.user_id=auth.uid() for update;

  select coalesce(array_agg(card_id),'{}'::text[]) into v_standard from public.repo_tcg_pack_cards where rarity='standard' and not(card_id=any(v_owned));
  select coalesce(array_agg(card_id),'{}'::text[]) into v_black_label from public.repo_tcg_pack_cards where rarity='black_label';
  select coalesce(array_agg(card_id),'{}'::text[]) into v_full_art from public.repo_tcg_pack_cards where rarity='full_art';
  select coalesce(array_agg(card_id),'{}'::text[]) into v_off_broom from public.repo_tcg_pack_cards where rarity='off_the_broom';
  select coalesce(array_agg(card_id),'{}'::text[]) into v_patch from public.repo_tcg_pack_cards where rarity='patch';
  select coalesce(array_agg(card_id),'{}'::text[]) into v_unfinished from public.repo_tcg_pack_cards where rarity='unfinished';
  select coalesce(array_agg(card_id),'{}'::text[]) into v_promo from public.repo_tcg_pack_cards where rarity='promo';
  select coalesce(array_agg(card_id),'{}'::text[]) into v_platinum from public.repo_tcg_pack_cards where rarity='platinum';
  select coalesce(array_agg(card_id),'{}'::text[]) into v_rival from public.repo_tcg_pack_cards where rarity='rival';
  select coalesce(array_agg(card_id),'{}'::text[]) into v_legendary from public.repo_tcg_pack_cards where rarity='legendary';
  select coalesce(array_agg(card_id),'{}'::text[]) into v_signature from public.repo_tcg_pack_cards where rarity='signature';
  select coalesce(array_agg(card_id),'{}'::text[]) into v_millennium from public.repo_tcg_pack_cards where rarity='millennium';

  if cardinality(v_black_label)>0 and v_roll<0.01 then v_card:=v_black_label[1+floor(random()*cardinality(v_black_label))::integer];
  elsif cardinality(v_millennium)>0 and v_roll<0.03 then v_card:=v_millennium[1+floor(random()*cardinality(v_millennium))::integer];
  elsif cardinality(v_signature)>0 and v_roll<0.06 then v_card:=v_signature[1+floor(random()*cardinality(v_signature))::integer];
  elsif cardinality(v_legendary)>0 and v_roll<0.10 then v_card:=v_legendary[1+floor(random()*cardinality(v_legendary))::integer];
  elsif cardinality(v_rival)>0 and v_roll<0.15 then v_card:=v_rival[1+floor(random()*cardinality(v_rival))::integer];
  elsif cardinality(v_platinum)>0 and v_roll<0.21 then v_card:=v_platinum[1+floor(random()*cardinality(v_platinum))::integer];
  elsif cardinality(v_promo)>0 and v_roll<0.31 then v_card:=v_promo[1+floor(random()*cardinality(v_promo))::integer];
  elsif cardinality(v_unfinished)>0 and v_roll<0.40 then v_card:=v_unfinished[1+floor(random()*cardinality(v_unfinished))::integer];
  elsif cardinality(v_patch)>0 and v_roll<0.52 then v_card:=v_patch[1+floor(random()*cardinality(v_patch))::integer];
  elsif cardinality(v_off_broom)>0 and v_roll<0.65 then v_card:=v_off_broom[1+floor(random()*cardinality(v_off_broom))::integer];
  elsif cardinality(v_full_art)>0 and v_roll<0.80 then v_card:=v_full_art[1+floor(random()*cardinality(v_full_art))::integer];
  elsif cardinality(v_standard)>0 then v_card:=v_standard[1+floor(random()*cardinality(v_standard))::integer];
  elsif cardinality(v_full_art)>0 then v_card:=v_full_art[1+floor(random()*cardinality(v_full_art))::integer];
  elsif cardinality(v_off_broom)>0 then v_card:=v_off_broom[1+floor(random()*cardinality(v_off_broom))::integer];
  elsif cardinality(v_patch)>0 then v_card:=v_patch[1+floor(random()*cardinality(v_patch))::integer];
  elsif cardinality(v_unfinished)>0 then v_card:=v_unfinished[1+floor(random()*cardinality(v_unfinished))::integer];
  elsif cardinality(v_promo)>0 then v_card:=v_promo[1+floor(random()*cardinality(v_promo))::integer];
  elsif cardinality(v_platinum)>0 then v_card:=v_platinum[1+floor(random()*cardinality(v_platinum))::integer];
  elsif cardinality(v_rival)>0 then v_card:=v_rival[1+floor(random()*cardinality(v_rival))::integer];
  elsif cardinality(v_legendary)>0 then v_card:=v_legendary[1+floor(random()*cardinality(v_legendary))::integer];
  elsif cardinality(v_signature)>0 then v_card:=v_signature[1+floor(random()*cardinality(v_signature))::integer];
  elsif cardinality(v_millennium)>0 then v_card:=v_millennium[1+floor(random()*cardinality(v_millennium))::integer];
  elsif cardinality(v_black_label)>0 then v_card:=v_black_label[1+floor(random()*cardinality(v_black_label))::integer];
  else raise exception 'No cards are configured for normal TCG packs.'; end if;

  v_skill_one:=v_skills[1+floor(random()*cardinality(v_skills))::integer];
  loop v_skill_two:=v_skills[1+floor(random()*cardinality(v_skills))::integer]; exit when v_skill_two<>v_skill_one; end loop;
  v_column_one:=v_skill_one||'_xp'; v_column_two:=v_skill_two||'_xp';
  if v_username='admin' then v_items:=jsonb_set(v_items,'{quidditch_tcg_pack}','1'::jsonb,true); else v_items:=jsonb_set(v_items,'{quidditch_tcg_pack}',to_jsonb(v_quantity-1),true); end if;
  execute format('update public.characters set bank_items=$1, %I=coalesce(%I,0)+$2, %I=coalesce(%I,0)+$3 where user_id=$4 returning %I,%I',v_column_one,v_column_one,v_column_two,v_column_two,v_column_one,v_column_two)
    into v_total_one,v_total_two using v_items,5000,10000,auth.uid();
  v_owned:=array_append(v_owned,v_card);
  update public.quidditch_tcg_collections set cards=v_owned,opened_count=opened_count+1,updated_at=clock_timestamp() where user_id=auth.uid();
  return query select v_card,v_owned,v_items,v_skill_one,5000,v_total_one,v_skill_two,10000,v_total_two,
    not exists(select 1 from public.repo_tcg_pack_cards p where not(p.card_id=any(v_owned)));
end
$function$;

revoke all on function public.open_quidditch_tcg_pack() from public;
grant execute on function public.open_quidditch_tcg_pack() to authenticated;
