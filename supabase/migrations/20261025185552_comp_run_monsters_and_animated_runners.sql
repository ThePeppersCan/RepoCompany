BEGIN;
-- Extend the existing permanent knife inventory without replacing ownership.
ALTER TABLE public.repo_comp_run_finish_ownership DROP CONSTRAINT repo_comp_run_finish_ownership_finish_id_check;
ALTER TABLE public.repo_comp_run_finish_ownership ADD CONSTRAINT repo_comp_run_finish_ownership_finish_id_check CHECK(finish_id IN ('mawbound','gallows','hellhound','widow','leviathan','jester','sovereign','argent','opaline','imperial','kintsugi','verdigris','sanguine','nocturne','wraith','bloodmoon','gravebloom','hexbound','ectoplasm','spectral','fallen','void','solstice','permafrost','stormcall','inferno','tideglass','tempest','fulgurite','nebula'));
CREATE OR REPLACE FUNCTION public.buy_comp_run_finish_for_user(p_user_id uuid,p_finish_id text)
RETURNS TABLE(new_gp bigint,owned text[],already_owned boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE v_price integer;v_gp bigint;v_owned boolean;
BEGIN
 IF p_user_id IS NULL THEN RAISE EXCEPTION 'Sign in to buy a finish.'; END IF;
 v_price:=CASE
  WHEN p_finish_id IN ('mawbound','gallows','hellhound','widow','leviathan','jester') THEN 3600
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


CREATE TABLE IF NOT EXISTS public.repo_comp_run_runner_ownership (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 runner_id text NOT NULL CHECK(runner_id IN ('blackstitch','redactor','ferryman','deadchannel','lamplighter','oathbreaker','bonepicker','mothkeeper','glasswake','bellwether','nightwatch','hush','archfiend','hollow-king','red-widow','dreadhound','drowned-oracle','chain-saint','grave-moth','ash-revenant')),
 purchased_at timestamptz NOT NULL DEFAULT now(),
 price_paid integer NOT NULL CHECK(price_paid>=0),
 PRIMARY KEY(user_id,runner_id)
);
ALTER TABLE public.repo_comp_run_runner_ownership ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.repo_comp_run_runner_ownership FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION public.comp_run_runners_for_user(p_user_id uuid)
RETURNS TABLE(new_gp bigint,owned text[]) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $fn$
 SELECT COALESCE(c.gp,0),COALESCE((SELECT array_agg(o.runner_id ORDER BY o.purchased_at,o.runner_id) FROM public.repo_comp_run_runner_ownership o WHERE o.user_id=p_user_id),ARRAY[]::text[]) FROM public.characters c WHERE c.user_id=p_user_id;
$fn$;
REVOKE ALL ON FUNCTION public.comp_run_runners_for_user(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.comp_run_runners_for_user(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.buy_comp_run_runner_for_user(p_user_id uuid,p_runner_id text)
RETURNS TABLE(new_gp bigint,owned text[],already_owned boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE v_price integer;v_gp bigint;v_owned boolean;
BEGIN
 IF p_user_id IS NULL THEN RAISE EXCEPTION 'Sign in to buy a runner.'; END IF;
 v_price:=CASE WHEN p_runner_id IN ('blackstitch','redactor','ferryman','deadchannel','lamplighter','oathbreaker','bonepicker','mothkeeper','glasswake','bellwether','nightwatch','hush') THEN 1200
 WHEN p_runner_id IN ('archfiend','hollow-king','red-widow','dreadhound','drowned-oracle','chain-saint','grave-moth','ash-revenant') THEN 2400 END;
 IF v_price IS NULL THEN RAISE EXCEPTION 'Choose a valid runner.'; END IF;
 -- All purchases lock the same existing wallet row, across both cosmetic kinds.
 SELECT COALESCE(c.gp,0) INTO v_gp FROM public.characters c WHERE c.user_id=p_user_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Your player profile could not be found.'; END IF;
 SELECT EXISTS(SELECT 1 FROM public.repo_comp_run_runner_ownership o WHERE o.user_id=p_user_id AND o.runner_id=p_runner_id) INTO v_owned;
 IF NOT v_owned THEN
  IF v_gp<v_price THEN RAISE EXCEPTION 'You need % Repoints to buy this runner.',v_price; END IF;
  INSERT INTO public.repo_comp_run_runner_ownership(user_id,runner_id,price_paid) VALUES(p_user_id,p_runner_id,v_price);
  v_gp:=v_gp-v_price;UPDATE public.characters SET gp=v_gp WHERE user_id=p_user_id;
 END IF;
 RETURN QUERY SELECT v_gp,COALESCE(array_agg(o.runner_id ORDER BY o.purchased_at,o.runner_id),ARRAY[]::text[]),v_owned FROM public.repo_comp_run_runner_ownership o WHERE o.user_id=p_user_id;
END;$fn$;
REVOKE ALL ON FUNCTION public.buy_comp_run_runner_for_user(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.buy_comp_run_runner_for_user(uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION public.get_my_comp_run_runners()
RETURNS TABLE(new_gp bigint,owned text[]) LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to view your runners.'; END IF;
 RETURN QUERY SELECT * FROM public.comp_run_runners_for_user(auth.uid());
END;$fn$;
CREATE OR REPLACE FUNCTION public.buy_comp_run_runner(p_runner_id text)
RETURNS TABLE(new_gp bigint,owned text[],already_owned boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Sign in to buy a runner.'; END IF;
 RETURN QUERY SELECT * FROM public.buy_comp_run_runner_for_user(auth.uid(),p_runner_id);
END;$fn$;
REVOKE ALL ON FUNCTION public.get_my_comp_run_runners() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.buy_comp_run_runner(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_comp_run_runners(),public.buy_comp_run_runner(text) TO authenticated;

-- One consistent snapshot for the game bridge. Existing knife RPCs retain their
-- return shapes so older game clients continue to work during rollout.
CREATE OR REPLACE FUNCTION public.comp_run_cosmetics_for_user(p_user_id uuid)
RETURNS TABLE(new_gp bigint,owned text[],runners text[]) LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $fn$
 SELECT COALESCE(c.gp,0),
 COALESCE((SELECT array_agg(o.finish_id ORDER BY o.purchased_at,o.finish_id) FROM public.repo_comp_run_finish_ownership o WHERE o.user_id=p_user_id),ARRAY[]::text[]),
 COALESCE((SELECT array_agg(o.runner_id ORDER BY o.purchased_at,o.runner_id) FROM public.repo_comp_run_runner_ownership o WHERE o.user_id=p_user_id),ARRAY[]::text[])
 FROM public.characters c WHERE c.user_id=p_user_id;
$fn$;
CREATE OR REPLACE FUNCTION public.buy_comp_run_cosmetic_for_user(p_user_id uuid,p_kind text,p_id text)
RETURNS TABLE(new_gp bigint,owned text[],runners text[],already_owned boolean) LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $fn$
DECLARE v_owned boolean;
BEGIN
 IF p_kind='knife' THEN SELECT b.already_owned INTO v_owned FROM public.buy_comp_run_finish_for_user(p_user_id,p_id) b;
 ELSIF p_kind='runner' THEN SELECT b.already_owned INTO v_owned FROM public.buy_comp_run_runner_for_user(p_user_id,p_id) b;
 ELSE RAISE EXCEPTION 'Choose a valid cosmetic.'; END IF;
 RETURN QUERY SELECT c.new_gp,c.owned,c.runners,v_owned FROM public.comp_run_cosmetics_for_user(p_user_id) c;
END;$fn$;
REVOKE ALL ON FUNCTION public.comp_run_cosmetics_for_user(uuid),public.buy_comp_run_cosmetic_for_user(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.comp_run_cosmetics_for_user(uuid),public.buy_comp_run_cosmetic_for_user(uuid,text,text) TO service_role;
NOTIFY pgrst,'reload schema';
COMMIT;
