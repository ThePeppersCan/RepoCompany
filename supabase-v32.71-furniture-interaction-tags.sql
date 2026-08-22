-- V32.71: legacy furniture semantic interaction tags.
-- The original 64 catalogue rows were still blank, so Dragonbound had no way
-- to distinguish beds/baths/training/toys and fell back to "inspect".
UPDATE public.dragonbound_furniture_catalog
SET tags = CASE
  WHEN item_id LIKE 'bed-%' THEN ARRAY['comfortable','sleepable']::text[]
  WHEN item_id LIKE 'bath-%' THEN ARRAY['washable']::text[]
  WHEN item_id LIKE 'training-%' THEN ARRAY['training','exercise','climbable','playable']::text[]
  WHEN item_id LIKE 'toy-%' THEN ARRAY['playable']::text[]
  WHEN item_id LIKE 'kitchen-%' THEN ARRAY['food']::text[]
  WHEN item_id='cottage-0' THEN ARRAY['warm']::text[]
  WHEN item_id IN ('cottage-1','cottage-2','cottage-5') THEN ARRAY['comfortable','restable']::text[]
  WHEN item_id IN ('cottage-4','cottage-8') THEN ARRAY['reading']::text[]
  WHEN item_id IN ('cottage-9','cottage-13') THEN ARRAY['food']::text[]
  WHEN item_id='cottage-10' THEN ARRAY['hideable']::text[]
  WHEN item_id='cottage-11' THEN ARRAY['comfortable','sleepable']::text[]
  WHEN item_id='cottage-12' THEN ARRAY['washable','hideable']::text[]
  WHEN item_id='cottage-14' THEN ARRAY['warm']::text[]
  WHEN item_id='cottage-15' THEN ARRAY['comfortable','restable','hideable']::text[]
  WHEN item_id='health-1' THEN ARRAY['comfortable','restable']::text[]
  WHEN item_id LIKE 'health-%' THEN ARRAY['inspectable']::text[]
  ELSE ARRAY['inspectable']::text[]
END,
updated_at=now()
WHERE coalesce(array_length(tags,1),0)=0
  AND (item_id LIKE 'bed-%' OR item_id LIKE 'bath-%' OR item_id LIKE 'training-%'
    OR item_id LIKE 'toy-%' OR item_id LIKE 'kitchen-%' OR item_id LIKE 'cottage-%'
    OR item_id LIKE 'health-%');
