-- Repo Company animated avatar frames. Repoints and ownership commit together.
BEGIN;
CREATE TABLE IF NOT EXISTS public.repo_avatar_frame_ownership (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 frame_id text NOT NULL,
 purchased_at timestamptz NOT NULL DEFAULT now(),
 price_paid integer NOT NULL CHECK (price_paid >= 0),
 PRIMARY KEY(user_id,frame_id)
);
ALTER TABLE public.repo_avatar_frame_ownership DROP CONSTRAINT IF EXISTS repo_avatar_frame_ownership_frame_id_check;
ALTER TABLE public.repo_avatar_frame_ownership ADD CONSTRAINT repo_avatar_frame_ownership_frame_id_check CHECK(frame_id IN ('ember-crown','moonlit-grove','arcane-orbit','deepwater','stormglass','royal-gilt','blossom-drift','astral-eclipse','honeycomb-court','jade-serpent','autumn-hearth','silver-thistle','mothlight','rose-reliquary','tidekeeper','glasswing','sunken-compass','wildwood-stag','lavender-hour','copper-automaton','ivory-sonata','orchid-veil','crimson-oath','amber-reliquary','frost-fern','starlit-cartographer','phoenix-feather','pearl-masquerade','verdant-cathedral','celestial-orrery','gilded-leviathan','winter-empress','eternal-phoenix'));
ALTER TABLE public.repo_avatar_frame_ownership ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.repo_avatar_frame_ownership FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_my_avatar_frames()
RETURNS TABLE(owned text[]) LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to view your frames.'; END IF;
 RETURN QUERY SELECT COALESCE(array_agg(o.frame_id ORDER BY o.purchased_at,o.frame_id),ARRAY[]::text[])
 FROM public.repo_avatar_frame_ownership o WHERE o.user_id=auth.uid();
END;$fn$;

CREATE OR REPLACE FUNCTION public.buy_avatar_frame(p_frame_id text)
RETURNS TABLE(new_gp integer,owned text[],already_owned boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $fn$
DECLARE v_user uuid:=auth.uid();v_price integer;v_gp integer;v_owned boolean;
BEGIN
 IF v_user IS NULL THEN RAISE EXCEPTION 'Sign in to buy a frame.'; END IF;
 v_price:=CASE p_frame_id
  WHEN 'ember-crown' THEN 1800
  WHEN 'moonlit-grove' THEN 1500
  WHEN 'arcane-orbit' THEN 2000
  WHEN 'deepwater' THEN 1500
  WHEN 'stormglass' THEN 2200
  WHEN 'royal-gilt' THEN 1800
  WHEN 'blossom-drift' THEN 1000
  WHEN 'astral-eclipse' THEN 2500
  WHEN 'honeycomb-court' THEN 1500
  WHEN 'jade-serpent' THEN 2200
  WHEN 'autumn-hearth' THEN 1200
  WHEN 'silver-thistle' THEN 1500
  WHEN 'mothlight' THEN 1800
  WHEN 'rose-reliquary' THEN 1800
  WHEN 'tidekeeper' THEN 1500
  WHEN 'glasswing' THEN 2000
  WHEN 'sunken-compass' THEN 1800
  WHEN 'wildwood-stag' THEN 2200
  WHEN 'lavender-hour' THEN 1200
  WHEN 'copper-automaton' THEN 2000
  WHEN 'ivory-sonata' THEN 1500
  WHEN 'orchid-veil' THEN 1000
  WHEN 'crimson-oath' THEN 2200
  WHEN 'amber-reliquary' THEN 2000
  WHEN 'frost-fern' THEN 1800
  WHEN 'starlit-cartographer' THEN 2500
  WHEN 'phoenix-feather' THEN 2500
  WHEN 'pearl-masquerade' THEN 2000
  WHEN 'verdant-cathedral' THEN 4000
  WHEN 'celestial-orrery' THEN 5500
  WHEN 'gilded-leviathan' THEN 5000
  WHEN 'winter-empress' THEN 4500
  WHEN 'eternal-phoenix' THEN 6000 END;
 IF v_price IS NULL THEN RAISE EXCEPTION 'Choose a valid frame.'; END IF;
 -- Serialize all purchases against the same existing currency row, including
 -- card purchases. Repeated requests for an owned frame never debit again.
 SELECT COALESCE(c.gp,0) INTO v_gp FROM public.characters c WHERE c.user_id=v_user FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Your player profile could not be found.'; END IF;
 SELECT EXISTS(SELECT 1 FROM public.repo_avatar_frame_ownership o WHERE o.user_id=v_user AND o.frame_id=p_frame_id) INTO v_owned;
 IF NOT v_owned THEN
  IF v_gp<v_price THEN RAISE EXCEPTION 'You need % Repoints to buy this frame.',v_price; END IF;
  INSERT INTO public.repo_avatar_frame_ownership(user_id,frame_id,price_paid) VALUES(v_user,p_frame_id,v_price);
  v_gp:=v_gp-v_price;
  UPDATE public.characters SET gp=v_gp WHERE user_id=v_user;
 END IF;
 RETURN QUERY SELECT v_gp,COALESCE(array_agg(o.frame_id ORDER BY o.purchased_at,o.frame_id),ARRAY[]::text[]),v_owned
 FROM public.repo_avatar_frame_ownership o WHERE o.user_id=v_user;
END;$fn$;
REVOKE ALL ON FUNCTION public.get_my_avatar_frames() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.buy_avatar_frame(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_avatar_frames() TO authenticated;
GRANT EXECUTE ON FUNCTION public.buy_avatar_frame(text) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
