-- V32.72: the five starter homes are now single-floor interiors.
-- Preserve placed furniture by moving every existing starter-home placement onto the new ground floor.
update public.dragonbound_house_furniture
set room_id='downstairs',
    x=greatest(0.225, least(0.775, x)),
    y=case
        when room_id='upstairs' then 0.585 + greatest(0, least(1, (y-0.35)/0.22))*0.11
        else greatest(0.575, least(0.715, y))
      end,
    updated_at=now()
where house_id in (
  'norveth-varka-fell-starter',
  'nambara-naskor-edge-starter',
  'lumerre-greenhollow-starter',
  'elvane-canto-plains-starter',
  'vardesh-hestholm-fjord-starter'
);
