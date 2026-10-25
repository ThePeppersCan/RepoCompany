BEGIN;
CREATE TABLE IF NOT EXISTS public.repo_comp_run_finish_ownership (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 finish_id text NOT NULL,
 purchased_at timestamptz NOT NULL DEFAULT now(),
 price_paid integer NOT NULL CHECK(price_paid>=0),
 PRIMARY KEY(user_id,finish_id),
 CHECK(finish_id IN ('jester','sovereign','argent','opaline','imperial','kintsugi','verdigris','sanguine','nocturne','wraith','bloodmoon','gravebloom','hexbound','ectoplasm','spectral','fallen','void','solstice','permafrost','stormcall','inferno','tideglass','tempest','fulgurite','nebula'))
);
ALTER TABLE public.repo_comp_run_finish_ownership ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.repo_comp_run_finish_ownership FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.comp_run_finishes_for_user(p_user_id uuid)
RETURNS TABLE(new_gp bigint,owned text[]) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $fn$
 SELECT COALESCE(c.gp,0),COALESCE((SELECT array_agg(o.finish_id ORDER BY o.purchased_at,o.finish_id) FROM public.repo_comp_run_finish_ownership o WHERE o.user_id=p_user_id),ARRAY[]::text[]) FROM public.characters c WHERE c.user_id=p_user_id;
$fn$;
REVOKE ALL ON FUNCTION public.comp_run_finishes_for_user(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.comp_run_finishes_for_user(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.buy_comp_run_finish_for_user(p_user_id uuid,p_finish_id text)
RETURNS TABLE(new_gp bigint,owned text[],already_owned boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE v_price integer;v_gp bigint;v_owned boolean;
BEGIN
 IF p_user_id IS NULL THEN RAISE EXCEPTION 'Sign in to buy a finish.'; END IF;
 v_price:=CASE
  WHEN p_finish_id='jester' THEN 3600
  WHEN p_finish_id IN ('argent','kintsugi','verdigris','sanguine','nocturne','tideglass','tempest','fulgurite') THEN 600
  WHEN p_finish_id IN ('sovereign','opaline','imperial','wraith','gravebloom','ectoplasm','fallen','solstice','permafrost') THEN 1200
  WHEN p_finish_id IN ('bloodmoon','hexbound','spectral','void','stormcall','inferno','nebula') THEN 2400 END;
 IF v_price IS NULL THEN RAISE EXCEPTION 'Choose a valid knife finish.'; END IF;
 SELECT COALESCE(c.gp,0) INTO v_gp FROM public.characters c WHERE c.user_id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Your player profile could not be found.'; END IF;
 SELECT EXISTS(SELECT 1 FROM public.repo_comp_run_finish_ownership o WHERE o.user_id=p_user_id AND o.finish_id=p_finish_id) INTO v_owned;
 IF NOT v_owned THEN
  IF v_gp<v_price THEN RAISE EXCEPTION 'You need % Repoints to buy this finish.',v_price; END IF;
  INSERT INTO public.repo_comp_run_finish_ownership(user_id,finish_id,price_paid) VALUES(p_user_id,p_finish_id,v_price);
  v_gp:=v_gp-v_price;
  UPDATE public.characters SET gp=v_gp WHERE user_id=p_user_id;
 END IF;
 RETURN QUERY SELECT v_gp,COALESCE(array_agg(o.finish_id ORDER BY o.purchased_at,o.finish_id),ARRAY[]::text[]),v_owned FROM public.repo_comp_run_finish_ownership o WHERE o.user_id=p_user_id;
END;$fn$;
REVOKE ALL ON FUNCTION public.buy_comp_run_finish_for_user(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.buy_comp_run_finish_for_user(uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION public.get_my_comp_run_finishes()
RETURNS TABLE(new_gp bigint,owned text[]) LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to view your knife finishes.'; END IF;
 RETURN QUERY SELECT * FROM public.comp_run_finishes_for_user(auth.uid());
END;$fn$;
CREATE OR REPLACE FUNCTION public.buy_comp_run_finish(p_finish_id text)
RETURNS TABLE(new_gp bigint,owned text[],already_owned boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to buy a finish.'; END IF;
 RETURN QUERY SELECT * FROM public.buy_comp_run_finish_for_user(auth.uid(),p_finish_id);
END;$fn$;
REVOKE ALL ON FUNCTION public.get_my_comp_run_finishes() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.buy_comp_run_finish(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_comp_run_finishes(),public.buy_comp_run_finish(text) TO authenticated;
NOTIFY pgrst,'reload schema';
COMMIT;
